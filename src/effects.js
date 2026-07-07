import * as THREE from 'three';

// Glowing dots gliding along a curve (energy flow along HV cables / coolant loop)
class FlowLine {
  constructor(curve, { count = 12, color = 0x67e8f9, size = 0.024, yOffset = 0.045 } = {}) {
    this.curve = curve;
    this.count = count;
    this.speed = 0;
    this.direction = 1;
    this.yOffset = yOffset;
    this.mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(size, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
      count
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.offsets = Array.from({ length: count }, (_, i) => i / count);
    this.t = 0;
    this.dummy = new THREE.Object3D();
    this.mesh.visible = false;
  }

  setColor(hex) {
    this.mesh.material.color.set(hex);
  }

  update(dt) {
    if (this.speed <= 0.001) {
      if (this.mesh.visible) this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.t += dt * this.speed * this.direction;
    for (let i = 0; i < this.count; i++) {
      let u = (this.offsets[i] + this.t) % 1;
      if (u < 0) u += 1;
      const p = this.curve.getPointAt(u);
      this.dummy.position.set(p.x, p.y + this.yOffset, p.z);
      const s = 0.7 + 0.5 * Math.sin((u + this.t) * Math.PI * 6);
      this.dummy.scale.setScalar(Math.max(0.35, s));
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

function buildDust(scene) {
  const count = 350;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 4 + Math.random() * 9;
    const a = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = 0.2 + Math.random() * 4.5;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  // round sprite so near-camera particles don't show as squares
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const mat = new THREE.PointsMaterial({
    color: 0x67e8f9,
    size: 0.03,
    map: new THREE.CanvasTexture(c),
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}

function buildSensorCones(carGroup) {
  const g = new THREE.Group();
  const mat = () =>
    new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  // [origin, direction(yaw rad), length, halfAngle]
  const cams = [
    [[2.2, 0.65, 0], 0, 4.4, 0.42], // front main
    [[0.05, 1.35, 0], 0, 3.4, 0.6], // windshield wide
    [[0.7, 0.95, 0.9], 1.9, 2.6, 0.5], // left repeater
    [[0.7, 0.95, -0.9], -1.9, 2.6, 0.5], // right repeater
    [[-0.4, 1.0, 0.88], 2.6, 2.4, 0.45], // left pillar
    [[-0.4, 1.0, -0.88], -2.6, 2.4, 0.45], // right pillar
    [[-2.3, 0.8, 0], Math.PI, 3.2, 0.5], // rear
  ];
  for (const [pos, yaw, len, half] of cams) {
    const r = Math.tan(half) * len;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, len, 20, 1, true), mat());
    // cone tip at origin, opening along +x, then yawed
    cone.rotation.z = Math.PI / 2;
    cone.position.x = len / 2;
    const holder = new THREE.Group();
    holder.add(cone);
    holder.position.set(...pos);
    holder.rotation.y = yaw;
    g.add(holder);
  }
  g.visible = false;
  carGroup.add(g);
  return g;
}

export function createEffects(scene, carGroup, curves, thermalPart) {
  const rearFlow = new FlowLine(curves.toRear, { color: 0x67e8f9 });
  const frontFlow = new FlowLine(curves.toFront, { color: 0x67e8f9 });
  const chargeFlow = new FlowLine(curves.charge, { color: 0x34d399, count: 16 });
  const coolantFlow = new FlowLine(thermalPart.group.userData.loopCurve, {
    color: 0x93c5fd,
    count: 26,
    size: 0.02,
    yOffset: 0,
  });
  // coolant dots live inside the thermal part group so they follow it when it lifts
  thermalPart.group.add(coolantFlow.mesh);
  carGroup.add(rearFlow.mesh, frontFlow.mesh, chargeFlow.mesh);

  const dust = buildDust(scene);
  const sensorCones = buildSensorCones(carGroup);

  return {
    rearFlow,
    frontFlow,
    chargeFlow,
    coolantFlow,
    sensorCones,
    update(dt, time) {
      rearFlow.update(dt);
      frontFlow.update(dt);
      chargeFlow.update(dt);
      coolantFlow.update(dt);
      dust.rotation.y = time * 0.008;
    },
  };
}
