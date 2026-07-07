import * as THREE from 'three';
import { std } from './car.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- individual part builders (all centered on their group origin) ----------

function buildBattery() {
  const g = new THREE.Group();
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.1, 1.42),
    std({ color: 0x1a2129, metalness: 0.8, roughness: 0.45 })
  );
  g.add(tray);

  // four long modules
  const modMat = () => std({ color: 0x10343c, metalness: 0.6, roughness: 0.4, emissive: 0x0e7490, emissiveIntensity: 0.55 });
  for (let i = 0; i < 4; i++) {
    const mod = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.09, 1.28), modMat());
    mod.position.set(-0.99 + i * 0.66, 0.09, 0);
    g.add(mod);
    // cell rows hinted as thin bright strips on each module
    for (let r = -2; r <= 2; r++) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, 0.012, 1.2),
        std({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 1.0 })
      );
      strip.position.set(-0.99 + i * 0.66 - 0.22 + (r + 2) * 0.11, 0.14, 0);
      g.add(strip);
    }
  }
  // glowing perimeter rail
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.03, 1.46),
    std({ color: 0x164e63, emissive: 0x22d3ee, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 })
  );
  rail.position.y = -0.05;
  g.add(rail);
  return g;
}

function buildMotor(radius, length, color, emissive) {
  const g = new THREE.Group();
  const casing = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 28),
    std({ color: 0x3a4048, metalness: 1, roughness: 0.32 })
  );
  casing.rotation.x = Math.PI / 2;
  g.add(casing);
  // cooling ribs
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.012, 0.008, 8, 28),
      std({ color, metalness: 0.9, roughness: 0.35, emissive, emissiveIntensity: 0.7 })
    );
    rib.position.z = -length / 2 + 0.06 + i * ((length - 0.12) / 4);
    g.add(rib);
  }
  // gearbox lump
  const gearbox = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, 0.16, 20),
    std({ color: 0x272c33, metalness: 1, roughness: 0.4 })
  );
  gearbox.rotation.x = Math.PI / 2;
  gearbox.position.set(radius * 0.7, -0.03, length / 2 + 0.07);
  g.add(gearbox);
  // half-shafts to the wheels
  for (const side of [1, -1]) {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.62, 12),
      std({ color: 0x555c66, metalness: 1, roughness: 0.4 })
    );
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(radius * 0.7, -0.03, side * (0.31 + length / 2 + 0.15));
    g.add(shaft);
  }
  return g;
}

function buildInverter() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.12, 0.32),
    std({ color: 0x2d3138, metalness: 0.9, roughness: 0.4 })
  );
  g.add(box);
  // heat-sink fins
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.045, 0.018),
      std({ color: 0x4a505a, metalness: 1, roughness: 0.35 })
    );
    fin.position.set(0, 0.08, -0.13 + i * 0.043);
    g.add(fin);
  }
  // amber power indicator strip
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.02, 0.02),
    std({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 2 })
  );
  strip.position.set(0, 0.0, 0.17);
  g.add(strip);
  return g;
}

function buildChargePort() {
  const g = new THREE.Group();
  // inner group carries the orientation so the face points rear-left
  // (the registry resets g.rotation on restore, so it must stay on a child)
  const inner = new THREE.Group();
  inner.rotation.y = Math.PI + 0.55;
  g.add(inner);
  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.05, 24),
    std({ color: 0x1a1e24, metalness: 0.8, roughness: 0.5 })
  );
  housing.rotation.z = Math.PI / 2;
  inner.add(housing);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.012, 10, 28),
    std({ color: 0x34d399, emissive: 0x34d399, emissiveIntensity: 2.2 })
  );
  ring.rotation.y = Math.PI / 2;
  ring.position.x = 0.03;
  inner.add(ring);
  g.userData.ring = ring;
  // five NACS pins
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8),
      std({ color: 0x9aa3ad, metalness: 1, roughness: 0.3 })
    );
    pin.rotation.z = Math.PI / 2;
    pin.position.set(0.03, Math.sin(a) * 0.04, Math.cos(a) * 0.04);
    inner.add(pin);
  }
  return g;
}

function buildThermal() {
  const g = new THREE.Group(); // positioned at car origin; children in car coords
  // radiator up front
  const radiator = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.34, 1.0),
    std({ color: 0x3f4854, metalness: 0.9, roughness: 0.5 })
  );
  radiator.position.set(2.05, 0.44, 0);
  g.add(radiator);
  for (let i = 0; i < 9; i++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.3, 0.02),
      std({ color: 0x60a5fa, metalness: 0.8, roughness: 0.4, emissive: 0x2563eb, emissiveIntensity: 0.35 })
    );
    fin.position.set(2.05, 0.44, -0.44 + i * 0.11);
    g.add(fin);
  }
  // octovalve block
  const octo = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.16, 0.2),
    std({ color: 0xd97706, metalness: 0.7, roughness: 0.45, emissive: 0xb45309, emissiveIntensity: 0.4 })
  );
  octo.position.set(1.68, 0.4, 0.38);
  g.add(octo);
  // coolant loop around battery + motors
  const loop = new THREE.CatmullRomCurve3(
    [
      V3(1.98, 0.36, 0.3),
      V3(1.55, 0.3, 0.58),
      V3(0.6, 0.3, 0.64),
      V3(-0.8, 0.3, 0.64),
      V3(-1.5, 0.36, 0.35),
      V3(-1.62, 0.36, -0.2),
      V3(-0.8, 0.3, -0.64),
      V3(0.6, 0.3, -0.64),
      V3(1.6, 0.3, -0.5),
      V3(1.98, 0.36, -0.25),
    ],
    true
  );
  const tubeMat = std({ color: 0x1d4ed8, metalness: 0.4, roughness: 0.35, emissive: 0x3b82f6, emissiveIntensity: 0.9 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(loop, 120, 0.024, 10), tubeMat);
  g.add(tube);
  g.userData.loopCurve = loop;
  g.userData.tubeMat = tubeMat;
  return g;
}

function buildBrakes(dims) {
  const g = new THREE.Group(); // at car origin; children at wheel corners
  const corners = [
    [dims.AXLE_X, dims.WHEEL_Z],
    [dims.AXLE_X, -dims.WHEEL_Z],
    [-dims.AXLE_X, dims.WHEEL_Z],
    [-dims.AXLE_X, -dims.WHEEL_Z],
  ];
  g.userData.discMats = [];
  for (const [x, z] of corners) {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.195, 0.195, 0.03, 32),
      std({ color: 0x8f979f, metalness: 1, roughness: 0.35, emissive: 0xff3300, emissiveIntensity: 0 })
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.set(x, dims.WHEEL_R, z * 0.92);
    g.add(disc);
    g.userData.discMats.push(disc.material);

    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.13, 0.06),
      std({ color: 0xdc2626, metalness: 0.6, roughness: 0.4 })
    );
    caliper.position.set(x + 0.13, dims.WHEEL_R + 0.1, z * 0.92);
    caliper.rotation.z = -0.5;
    g.add(caliper);
  }
  return g;
}

function buildComputer() {
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.05, 0.44),
    std({ color: 0x11151b, metalness: 0.7, roughness: 0.5 })
  );
  g.add(board);
  // glowing "traces"
  for (let i = 0; i < 4; i++) {
    const trace = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.012, 0.014),
      std({ color: 0xf472b6, emissive: 0xf472b6, emissiveIntensity: 1.8 })
    );
    trace.position.set(0, 0.03, -0.15 + i * 0.1);
    g.add(trace);
  }
  const chip1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.03, 0.1),
    std({ color: 0x2a2f36, metalness: 0.9, roughness: 0.3 })
  );
  chip1.position.set(-0.07, 0.045, 0.08);
  g.add(chip1);
  const chip2 = chip1.clone();
  chip2.material = std({ color: 0x2a2f36, metalness: 0.9, roughness: 0.3 });
  chip2.position.set(0.09, 0.045, 0.08);
  g.add(chip2);
  return g;
}

// ---------- HV cabling (static detail, fades with the rest) ----------
function buildCables() {
  const g = new THREE.Group();
  const mk = (pts, color = 0xf97316) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 40, 0.02, 8),
      std({ color, roughness: 0.5, metalness: 0.2 })
    );
    g.add(tube);
    return curve;
  };
  const toRear = mk([V3(-0.3, 0.3, 0.18), V3(-0.9, 0.32, 0.22), V3(-1.3, 0.5, 0.15), V3(-1.42, 0.56, 0.05)]);
  const toFront = mk([V3(0.3, 0.3, 0.18), V3(0.9, 0.32, 0.22), V3(1.32, 0.48, 0.1), V3(1.42, 0.5, 0.03)]);
  const charge = mk([V3(-2.02, 0.62, 0.78), V3(-1.7, 0.42, 0.5), V3(-0.9, 0.32, 0.25), V3(-0.1, 0.3, 0.05)], 0x0d9488);
  return { group: g, curves: { toRear, toFront, charge } };
}

// ---------- registry ----------
export function buildParts(carGroup, dims) {
  const defs = [
    {
      id: 'battery',
      build: buildBattery,
      basePos: V3(0, 0.22, 0),
      focusPos: V3(0, 1.3, 0.85),
      camPos: V3(3.5, 3.0, 4.8),
      explodeOffset: V3(0, -0.22, 0),
      hotspot: V3(0, 0.1, 0.2),
      spin: true,
    },
    {
      id: 'motorRear',
      build: () => buildMotor(0.17, 0.42, 0xa78bfa, 0x7c3aed),
      basePos: V3(-1.44, 0.42, 0),
      focusPos: V3(-1.44, 1.35, 0.8),
      camPos: V3(-3.7, 2.4, 3.8),
      explodeOffset: V3(-0.75, 0.4, 0),
      hotspot: V3(0, 0.12, 0.2),
      spin: true,
    },
    {
      id: 'motorFront',
      build: () => buildMotor(0.15, 0.36, 0xe879f9, 0xc026d3),
      basePos: V3(1.44, 0.42, 0),
      focusPos: V3(1.44, 1.35, 0.8),
      camPos: V3(3.8, 2.4, 3.7),
      explodeOffset: V3(0.75, 0.4, 0),
      hotspot: V3(0, 0.12, 0.2),
      spin: true,
    },
    {
      id: 'inverter',
      build: buildInverter,
      basePos: V3(-1.44, 0.68, 0.26),
      focusPos: V3(-1.44, 1.55, 0.9),
      camPos: V3(-3.3, 2.6, 3.5),
      explodeOffset: V3(-0.45, 0.95, 0.1),
      hotspot: V3(0, 0.1, 0.05),
      spin: true,
    },
    {
      id: 'chargePort',
      build: buildChargePort,
      basePos: V3(-2.04, 0.64, 0.8),
      focusPos: V3(-2.1, 1.3, 1.15),
      camPos: V3(-4.3, 2.2, 3.8),
      explodeOffset: V3(-0.7, 0.35, 0.5),
      hotspot: V3(0, 0.05, 0.05),
      spin: true,
    },
    {
      id: 'thermal',
      build: buildThermal,
      basePos: V3(0, 0, 0),
      focusPos: V3(0, 0.55, 0),
      camPos: V3(2.9, 4.2, 3.2),
      focusTarget: V3(0.4, 0.8, 0),
      explodeOffset: V3(0, 0.75, 0),
      hotspot: V3(2.05, 0.68, 0.3),
      spin: false,
    },
    {
      id: 'regen',
      build: () => buildBrakes(dims),
      basePos: V3(0, 0, 0),
      focusPos: V3(0, 0, 0),
      camPos: V3(3.4, 1.5, 3.4),
      focusTarget: V3(dims.AXLE_X, 0.38, dims.WHEEL_Z),
      explodeOffset: V3(0, 0, 0),
      hotspot: V3(dims.AXLE_X, 0.05, dims.WHEEL_Z + 0.12),
      spin: false,
      wheelsOut: true, // slide wheels outward to expose the discs
    },
    {
      id: 'computer',
      build: buildComputer,
      basePos: V3(0.85, 0.52, 0),
      focusPos: V3(0.85, 1.4, 0.85),
      camPos: V3(2.9, 2.6, 3.4),
      explodeOffset: V3(0.4, 0.9, 0),
      hotspot: V3(0, 0.08, 0.15),
      spin: true,
    },
  ];

  const parts = {};
  for (const d of defs) {
    const group = d.build();
    group.position.copy(d.basePos);
    group.userData.def = d;
    carGroup.add(group);
    parts[d.id] = {
      ...d,
      group,
      baseQuat: group.quaternion.clone(),
    };
  }

  const cables = buildCables();
  carGroup.add(cables.group);

  return { parts, cablesGroup: cables.group, curves: cables.curves };
}
