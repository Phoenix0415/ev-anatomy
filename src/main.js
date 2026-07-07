import * as THREE from 'three';
import gsap from 'gsap';
import { createScene } from './scene.js';
import { buildCar } from './car.js';
import { buildParts } from './parts.js';
import { createEffects } from './effects.js';
import { createInteractions } from './interactions.js';
import { createUI } from './ui.js';
import { CONTENT } from './content.js';

const canvas = document.getElementById('scene');
const css2dContainer = document.getElementById('css2d');

const { scene, camera, renderer, controls, composer, css2d } = createScene(canvas, css2dContainer);

const car = buildCar();
scene.add(car.carGroup);

const { parts, cablesGroup, curves } = buildParts(car.carGroup, car.dims);
const effects = createEffects(scene, car.carGroup, curves, parts.thermal);

const state = {
  selected: null,
  xray: false,
  exploded: false,
  drive: false,
  throttle: 0.5,
  regenBrake: 0,
  soc: 80,
  thermalMode: 'cool',
  charging: { active: false, power: 250 },
};

const app = { scene, camera, renderer, controls, car, parts, cablesGroup, effects, state, content: CONTENT };
app.interactions = createInteractions(app);
createUI(app);

// ---------- intro ----------
const loader = document.getElementById('loader');
gsap.to(camera.position, {
  x: app.interactions.HOME_CAM.x,
  y: app.interactions.HOME_CAM.y,
  z: app.interactions.HOME_CAM.z,
  duration: 2.4,
  ease: 'power3.inOut',
  delay: 0.3,
});
setTimeout(() => loader.classList.add('done'), 500);

// ---------- render loop ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  controls.update();
  app.interactions.tick(dt, time);
  effects.update(dt, time);
  composer.render();
  css2d.render(scene, camera);
}
animate();
