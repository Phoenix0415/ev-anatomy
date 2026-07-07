import * as THREE from 'three';
import gsap from 'gsap';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const HOME_CAM = new THREE.Vector3(5.6, 2.4, 6.4);
const HOME_TARGET = new THREE.Vector3(0, 0.55, 0);

// tween every material in a group to baseOpacity * factor
function fadeGroup(root, factor, duration = 0.7) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    if (child.userData.baseCast === undefined) child.userData.baseCast = child.castShadow;
    child.castShadow = child.userData.baseCast && factor > 0.5;
    for (const m of mats) {
      if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity ?? 1;
      if (m.userData.baseTransparent === undefined) m.userData.baseTransparent = m.transparent;
      const target = m.userData.baseOpacity * factor;
      m.transparent = true;
      m.depthWrite = factor > 0.5;
      gsap.to(m, {
        opacity: target,
        duration,
        ease: 'power2.out',
        overwrite: 'auto',
        onComplete: () => {
          if (factor >= 1 && !m.userData.baseTransparent) m.transparent = false;
        },
      });
    }
  });
}

// scale all emissive intensities in a group (battery glow etc.)
function collectGlow(root) {
  const mats = [];
  root.traverse((child) => {
    if (!child.isMesh) return;
    const m = child.material;
    if (m && m.emissiveIntensity > 0) {
      if (m.userData.baseEmissive === undefined) m.userData.baseEmissive = m.emissiveIntensity;
      mats.push(m);
    }
  });
  return mats;
}

export function createInteractions(app) {
  const { camera, controls, car, parts, cablesGroup, effects, state, content } = app;

  const partList = Object.values(parts);
  const batteryGlow = collectGlow(parts.battery.group);
  const chargeRing = parts.chargePort.group.userData.ring;
  const discMats = parts.regen.group.userData.discMats;
  const thermalTubeMat = parts.thermal.group.userData.tubeMat;

  let selectionListener = () => {};
  let modeListener = () => {};

  // ---------- camera ----------
  let autoRotateTimer = 0;
  function cameraTo(pos, target, duration = 1.5) {
    clearTimeout(autoRotateTimer);
    controls.autoRotate = false;
    gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration, ease: 'power3.inOut', overwrite: 'auto' });
  }

  // ---------- hotspots ----------
  const hotspots = [];
  for (const p of partList) {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.style.setProperty('--cyan', content[p.id].color);
    el.style.borderColor = content[p.id].color;
    const label = document.createElement('span');
    label.className = 'hotspot-label';
    label.textContent = content[p.id].chip;
    el.appendChild(label);
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPart(p.id);
    });
    const obj = new CSS2DObject(el);
    obj.position.copy(p.hotspot);
    p.group.add(obj);
    hotspots.push(el);
  }
  function setHotspotsVisible(v) {
    for (const el of hotspots) el.classList.toggle('hidden', !v);
  }

  // ---------- fades for the current idle mode ----------
  function applyIdleFades(duration = 0.7) {
    if (state.xray) {
      fadeGroup(car.shellGroup, 0.13, duration);
      fadeGroup(car.glass, 0.08, duration);
      fadeGroup(car.wheelsGroup, 0.35, duration);
      fadeGroup(cablesGroup, 1, duration);
    } else {
      fadeGroup(car.shellGroup, 1, duration);
      fadeGroup(car.glass, 1, duration);
      fadeGroup(car.wheelsGroup, 1, duration);
      fadeGroup(cablesGroup, 1, duration);
    }
    for (const p of partList) fadeGroup(p.group, 1, duration);
  }

  // ---------- wheels helper ----------
  function moveWheels(offsetZ, duration = 1.0) {
    for (const w of Object.values(car.wheels)) {
      const home = w.userData.home;
      gsap.to(w.position, {
        z: home.z + Math.sign(home.z) * offsetZ,
        duration,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    }
  }

  // ---------- part selection ----------
  function restorePart(p, duration = 1.0) {
    // kill pending delayed detach/explode tweens — overwrite:'auto' can't catch
    // a delayed tween that hasn't initted yet, and it would kill THIS tween later
    gsap.killTweensOf(p.group.position);
    gsap.killTweensOf(p.group.rotation);
    gsap.to(p.group.position, {
      x: p.basePos.x, y: p.basePos.y, z: p.basePos.z,
      duration, ease: 'power3.inOut', overwrite: 'auto',
    });
    gsap.to(p.group.rotation, { x: 0, y: 0, z: 0, duration, ease: 'power3.inOut', overwrite: 'auto' });
    if (p.wheelsOut) moveWheels(0, duration);
  }

  function selectPart(id) {
    if (state.drive) setDrive(false, true);
    if (state.exploded) setExplode(false, true);
    if (state.selected === id) {
      deselect();
      return;
    }
    const prev = state.selected ? parts[state.selected] : null;
    if (prev) restorePart(prev);

    state.selected = id;
    const p = parts[id];

    // ghost everything except the chosen part
    fadeGroup(car.shellGroup, 0.08);
    fadeGroup(car.glass, 0.05);
    fadeGroup(car.wheelsGroup, p.wheelsOut ? 1 : 0.1);
    fadeGroup(cablesGroup, 0.12);
    for (const other of partList) fadeGroup(other.group, other.id === id ? 1 : 0.06);

    // detach the part
    gsap.to(p.group.position, {
      x: p.focusPos.x, y: p.focusPos.y, z: p.focusPos.z,
      duration: 1.2, ease: 'power3.inOut', overwrite: 'auto', delay: 0.1,
    });
    if (p.wheelsOut) moveWheels(0.55);

    cameraTo(p.camPos, p.focusTarget ?? p.focusPos, 1.5);
    setHotspotsVisible(false);
    selectionListener(id);
  }

  function deselect() {
    if (!state.selected) return;
    const p = parts[state.selected];
    state.selected = null;
    restorePart(p);
    applyIdleFades();
    cameraTo(HOME_CAM, HOME_TARGET, 1.4);
    setHotspotsVisible(true);
    selectionListener(null);
  }

  // ---------- modes ----------
  function setXray(on) {
    state.xray = on;
    if (!state.selected && !state.exploded && !state.drive) applyIdleFades(0.6);
    modeListener();
  }

  function setExplode(on, silent = false) {
    if (on && state.selected) deselect();
    if (on && state.drive) setDrive(false, true);
    state.exploded = on;
    if (on) {
      let i = 0;
      for (const p of partList) {
        gsap.to(p.group.position, {
          x: p.basePos.x + p.explodeOffset.x,
          y: p.basePos.y + p.explodeOffset.y,
          z: p.basePos.z + p.explodeOffset.z,
          duration: 1.2, ease: 'power3.inOut', delay: i * 0.05, overwrite: 'auto',
        });
        i++;
      }
      gsap.to(car.shellGroup.position, { y: 1.25, duration: 1.3, ease: 'power3.inOut', delay: 0.15, overwrite: 'auto' });
      gsap.to(car.glass.position, { y: 1.85, duration: 1.4, ease: 'power3.inOut', delay: 0.2, overwrite: 'auto' });
      moveWheels(0.85, 1.2);
      fadeGroup(cablesGroup, 0.15);
      if (!silent) cameraTo(new THREE.Vector3(8.2, 4.6, 8.2), new THREE.Vector3(0, 1.1, 0), 1.6);
      setHotspotsVisible(true);
    } else {
      for (const p of partList) restorePart(p, silent ? 0.6 : 1.1);
      gsap.killTweensOf(car.shellGroup.position);
      gsap.killTweensOf(car.glass.position);
      gsap.to(car.shellGroup.position, { y: 0, duration: 1.1, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(car.glass.position, { y: 0, duration: 1.1, ease: 'power3.inOut', overwrite: 'auto' });
      moveWheels(0, 1.1);
      applyIdleFades();
      if (!silent) cameraTo(HOME_CAM, HOME_TARGET, 1.4);
    }
    modeListener();
  }

  function setDrive(on, silent = false) {
    if (on && state.selected) deselect();
    if (on && state.exploded) setExplode(false, true);
    state.drive = on;
    if (on) {
      fadeGroup(car.shellGroup, 0.3);
      fadeGroup(car.glass, 0.15);
      fadeGroup(car.wheelsGroup, 1);
      fadeGroup(cablesGroup, 1);
      for (const p of partList) fadeGroup(p.group, 1);
      cameraTo(new THREE.Vector3(5.4, 1.2, 4.6), new THREE.Vector3(0, 0.5, 0), 1.6);
      setHotspotsVisible(false);
    } else {
      gsap.to(car.carGroup.position, { y: 0, duration: 0.4, overwrite: 'auto' });
      applyIdleFades();
      if (!silent) {
        cameraTo(HOME_CAM, HOME_TARGET, 1.4);
        setHotspotsVisible(true);
      }
    }
    modeListener();
  }

  function resetAll() {
    if (state.selected) deselect();
    if (state.exploded) setExplode(false);
    if (state.drive) setDrive(false);
    if (state.xray) setXray(false);
    state.regenBrake = 0;
    state.charging.active = false;
    cameraTo(HOME_CAM, HOME_TARGET, 1.5);
    setHotspotsVisible(true);
    autoRotateTimer = setTimeout(() => {
      if (!state.selected && !state.drive && !state.exploded) controls.autoRotate = true;
    }, 1600);
    modeListener();
  }

  // ---------- pointer picking ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = null;
  const canvas = app.renderer.domElement;

  canvas.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
    controls.autoRotate = false;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!downPos) return;
    const dx = e.clientX - downPos.x;
    const dy = e.clientY - downPos.y;
    downPos = null;
    if (dx * dx + dy * dy > 25) return; // drag, not click
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const groups = partList.map((p) => p.group);
    const hits = raycaster.intersectObjects(groups, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && !obj.userData.def) obj = obj.parent;
      if (obj) {
        selectPart(obj.userData.def.id);
        return;
      }
    }
    if (state.selected) deselect();
  });

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(partList.map((p) => p.group), true);
    canvas.style.cursor = hits.length ? 'pointer' : 'grab';
  });

  // ---------- per-frame ----------
  const tmpColor = new THREE.Color();
  function tick(dt, time) {
    // spin the focused part
    if (state.selected) {
      const p = parts[state.selected];
      if (p.spin) {
        const boost = state.selected.startsWith('motor') ? state.throttle * 4 : 0;
        p.group.rotation.y += dt * (0.45 + boost);
      }
    }

    // energy flows derived from state (single source of truth)
    const f = effects;
    let rearSpeed = 0, frontSpeed = 0, dir = 1;
    if (state.drive) {
      rearSpeed = 0.25 + state.throttle * 0.65;
      frontSpeed = 0.2 + state.throttle * 0.5;
    } else if (state.selected === 'motorRear' || state.selected === 'inverter') {
      rearSpeed = 0.15 + state.throttle * 0.75;
    } else if (state.selected === 'motorFront') {
      frontSpeed = 0.15 + state.throttle * 0.75;
    } else if (state.selected === 'regen') {
      rearSpeed = state.regenBrake * 0.7;
      dir = -1;
    } else if (state.selected === 'battery' || state.xray) {
      rearSpeed = 0.18;
      frontSpeed = 0.14;
    }
    f.rearFlow.speed = rearSpeed;
    f.frontFlow.speed = frontSpeed;
    f.rearFlow.direction = dir;
    f.frontFlow.direction = dir;
    f.chargeFlow.speed = state.charging.active ? 0.25 + (state.charging.power / 250) * 0.9 : 0;
    f.coolantFlow.speed =
      state.selected === 'thermal' ? 0.45 : state.drive || state.xray ? 0.18 : 0;

    // battery glow follows state of charge
    const glowF = 0.35 + (state.soc / 100) * 1.05;
    for (const m of batteryGlow) {
      m.emissiveIntensity += (m.userData.baseEmissive * glowF - m.emissiveIntensity) * Math.min(1, dt * 6);
    }

    // charge ring pulse
    const pulse = state.charging.active ? 4 + state.charging.power / 60 : 1.6;
    chargeRing.material.emissiveIntensity = 1.6 + Math.sin(time * pulse) * 0.9;

    // brake disc glow when friction braking
    const friction = state.regenBrake > 0.75 ? (state.regenBrake - 0.75) * 4 : 0;
    for (const m of discMats) {
      m.emissiveIntensity += (friction * 1.4 - m.emissiveIntensity) * Math.min(1, dt * 5);
    }

    // thermal loop color follows mode
    const targetHex = state.thermalMode === 'heat' ? 0xf59e0b : 0x3b82f6;
    thermalTubeMat.emissive.lerp(tmpColor.set(targetHex), Math.min(1, dt * 3));
    effects.coolantFlow.mesh.material.color.lerp(
      tmpColor.set(state.thermalMode === 'heat' ? 0xfcd34d : 0x93c5fd),
      Math.min(1, dt * 3)
    );

    // drive-mode wheel spin + body float
    if (state.drive) {
      const spin = dt * (6 + state.throttle * 26);
      for (const w of Object.values(car.wheels)) w.rotation.z -= spin;
      car.carGroup.position.y = Math.sin(time * 2.4) * 0.012;
    }
  }

  const api = {
    selectPart,
    deselect,
    setXray,
    setExplode,
    setDrive,
    resetAll,
    cameraTo,
    tick,
    HOME_CAM,
    HOME_TARGET,
    onSelectionChange: (fn) => (selectionListener = fn),
    onModeChange: (fn) => (modeListener = fn),
  };
  return api;
}
