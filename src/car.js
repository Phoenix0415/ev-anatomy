import * as THREE from 'three';

// ---------- material helpers (fresh instance per mesh so parts fade independently) ----------
export function std(params) {
  const m = new THREE.MeshStandardMaterial(params);
  m.userData.baseOpacity = params.opacity ?? 1;
  return m;
}
export function phys(params) {
  const m = new THREE.MeshPhysicalMaterial(params);
  m.userData.baseOpacity = params.opacity ?? 1;
  return m;
}

const PAINT = {
  color: 0xa4121f, // multi-coat red
  metalness: 0.72,
  roughness: 0.32,
  clearcoat: 1.0,
  clearcoatRoughness: 0.08,
};
const GLASS = {
  color: 0x0d151d,
  metalness: 0.9,
  roughness: 0.12,
  transparent: true,
  opacity: 0.96,
};
const DARK_METAL = { color: 0x2b3138, metalness: 1.0, roughness: 0.35 };
const RUBBER = { color: 0x0a0c0e, roughness: 0.95, metalness: 0 };

// wheel arch parameters shared by body + wheels
const AXLE_X = 1.44;
const ARCH_R = 0.46;
const ARCH_CY = 0.33;
const BOTTOM_Y = 0.16;
const WHEEL_R = 0.34;
const WHEEL_Z = 0.84;

function bodyShape() {
  const s = new THREE.Shape();
  const t = Math.asin((ARCH_CY - BOTTOM_Y) / ARCH_R); // arch entry angle
  const dx = ARCH_R * Math.cos(t);

  s.moveTo(2.3, BOTTOM_Y);
  // front face + nose
  s.lineTo(2.4, 0.3);
  s.quadraticCurveTo(2.44, 0.56, 2.24, 0.66);
  // hood
  s.quadraticCurveTo(1.72, 0.82, 1.02, 0.92);
  // beltline (under the glass canopy)
  s.quadraticCurveTo(0.0, 1.0, -1.1, 0.96);
  // rear deck + trunk lip
  s.quadraticCurveTo(-1.9, 0.93, -2.16, 0.84);
  // rear face
  s.quadraticCurveTo(-2.44, 0.74, -2.4, 0.46);
  s.lineTo(-2.3, BOTTOM_Y);
  // bottom, rear wheel arch
  s.lineTo(-AXLE_X - dx, BOTTOM_Y);
  s.absarc(-AXLE_X, ARCH_CY, ARCH_R, Math.PI + t, -t, true);
  // bottom, front wheel arch
  s.lineTo(AXLE_X - dx, BOTTOM_Y);
  s.absarc(AXLE_X, ARCH_CY, ARCH_R, Math.PI + t, -t, true);
  s.lineTo(2.3, BOTTOM_Y);
  return s;
}

function glassShape() {
  const s = new THREE.Shape();
  s.moveTo(1.0, 0.9);
  // windshield + roof + rear glass in one smooth spline
  s.splineThru([
    new THREE.Vector2(0.55, 1.22),
    new THREE.Vector2(0.05, 1.41),
    new THREE.Vector2(-0.55, 1.4),
    new THREE.Vector2(-1.05, 1.22),
    new THREE.Vector2(-1.58, 0.92),
  ]);
  s.lineTo(-1.58, 0.9);
  s.lineTo(1.0, 0.88);
  return s;
}

function buildWheel() {
  const wheel = new THREE.Group(); // outer group: positioned at axle, spun on .rotation.z
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.23, 40),
    std(RUBBER)
  );
  tire.rotation.x = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.205, 0.205, 0.2, 28),
    std({ color: 0x30343c, metalness: 1, roughness: 0.3 })
  );
  rim.rotation.x = Math.PI / 2;
  wheel.add(rim);

  for (const side of [1, -1]) {
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 28),
      std({ color: 0x171b21, metalness: 1, roughness: 0.4 })
    );
    face.position.z = side * 0.101;
    if (side < 0) face.rotation.y = Math.PI;
    wheel.add(face);

    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.06, 0.025),
        std({ color: 0x3c424c, metalness: 1, roughness: 0.28 })
      );
      const a = (i / 5) * Math.PI * 2 + (side > 0 ? 0 : 0.3);
      spoke.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, side * 0.112);
      spoke.rotation.z = a;
      wheel.add(spoke);
    }

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16),
      std({ color: 0x0e7490, emissive: 0x22d3ee, emissiveIntensity: 1.4 })
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.z = side * 0.115;
    wheel.add(cap);
  }
  return wheel;
}

export function buildCar() {
  const carGroup = new THREE.Group();

  // ---------- painted shell ----------
  const shellGroup = new THREE.Group();
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: 1.68,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.05,
    bevelSegments: 5,
    curveSegments: 28,
  });
  bodyGeo.translate(0, 0, -0.84);
  const paintMat = phys(PAINT);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.castShadow = true;
  shellGroup.add(body);

  // headlights
  for (const side of [1, -1]) {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.045, 0.42),
      std({ color: 0xffffff, emissive: 0xe8f6ff, emissiveIntensity: 2.6 })
    );
    hl.position.set(2.26, 0.63, side * 0.55);
    hl.rotation.y = side * -0.28;
    shellGroup.add(hl);
  }
  // full-width taillight bar
  const tl = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.045, 1.5),
    std({ color: 0x550000, emissive: 0xff2030, emissiveIntensity: 2.2 })
  );
  tl.position.set(-2.37, 0.72, 0);
  shellGroup.add(tl);

  // mirrors
  for (const side of [1, -1]) {
    const mr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.16), phys(PAINT));
    mr.position.set(0.8, 0.99, side * 0.93);
    shellGroup.add(mr);
  }

  // dark front intake
  const intake = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 1.05),
    std({ color: 0x0b0d10, roughness: 0.6 })
  );
  intake.position.set(2.36, 0.27, 0);
  shellGroup.add(intake);

  // tiny glowing nose badge
  const badge = new THREE.Mesh(
    new THREE.CircleGeometry(0.028, 20),
    std({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 2 })
  );
  badge.position.set(2.435, 0.52, 0);
  badge.rotation.y = Math.PI / 2;
  shellGroup.add(badge);

  carGroup.add(shellGroup);

  // ---------- glass canopy ----------
  const glassGeo = new THREE.ExtrudeGeometry(glassShape(), {
    depth: 1.34,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 24,
  });
  glassGeo.translate(0, 0, -0.67);
  const glass = new THREE.Mesh(glassGeo, phys(GLASS));
  glass.castShadow = true;
  carGroup.add(glass);

  // ---------- wheels ----------
  const wheelsGroup = new THREE.Group();
  const wheels = {};
  const wheelDefs = [
    ['FL', AXLE_X, WHEEL_Z],
    ['FR', AXLE_X, -WHEEL_Z],
    ['RL', -AXLE_X, WHEEL_Z],
    ['RR', -AXLE_X, -WHEEL_Z],
  ];
  for (const [name, x, z] of wheelDefs) {
    const w = buildWheel();
    w.position.set(x, WHEEL_R, z);
    w.userData.home = new THREE.Vector3(x, WHEEL_R, z);
    wheels[name] = w;
    wheelsGroup.add(w);
  }
  carGroup.add(wheelsGroup);

  return {
    carGroup,
    shellGroup,
    glass,
    wheelsGroup,
    wheels,
    paintMat,
    dims: { AXLE_X, WHEEL_R, WHEEL_Z, DARK_METAL, RUBBER },
  };
}
