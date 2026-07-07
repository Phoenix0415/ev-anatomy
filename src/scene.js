import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function createScene(canvas, css2dContainer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070b);
  scene.fog = new THREE.Fog(0x05070b, 16, 34);

  const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(14, 7, 14);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Reflections for car paint / glass
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // --- lights ---
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.camera.far = 25;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);

  const rimCyan = new THREE.SpotLight(0x22d3ee, 22, 30, Math.PI / 5, 0.5, 1.6);
  rimCyan.position.set(-8, 4.5, -7);
  scene.add(rimCyan);

  const rimViolet = new THREE.SpotLight(0x8b5cf6, 16, 30, Math.PI / 5, 0.6, 1.6);
  rimViolet.position.set(8, 3.5, -8);
  scene.add(rimViolet);

  const fill = new THREE.HemisphereLight(0x334455, 0x0a0c10, 1.4);
  scene.add(fill);

  // --- floor: mirror + dark tint + grid ---
  const mirror = new Reflector(new THREE.CircleGeometry(18, 64), {
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x777c85,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = -0.002;
  scene.add(mirror);

  // dark translucent skin above the mirror to dim the reflection
  const tint = new THREE.Mesh(
    new THREE.CircleGeometry(18, 64),
    new THREE.MeshBasicMaterial({
      color: 0x05070b,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    })
  );
  tint.rotation.x = -Math.PI / 2;
  tint.position.y = 0.0;
  scene.add(tint);

  // shadow-catcher (mirror can't receive shadows)
  const shadowCatcher = new THREE.Mesh(
    new THREE.CircleGeometry(12, 48),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.001;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const grid = new THREE.GridHelper(44, 44, 0x1b3a44, 0x101c26);
  grid.material.transparent = true;
  grid.material.opacity = 0.16;
  grid.material.depthWrite = false;
  grid.position.y = 0.002;
  scene.add(grid);

  // soft cyan glow disc under the car
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(34,211,238,0.16)');
  grad.addColorStop(0.5, 'rgba(34,211,238,0.04)');
  grad.addColorStop(1, 'rgba(34,211,238,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.004;
  scene.add(glow);

  // --- controls ---
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 2.2;
  controls.maxDistance = 16;
  controls.maxPolarAngle = 1.52;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;

  // --- post-processing (bloom) ---
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,
    0.55,
    0.92
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // --- CSS2D overlay for hotspots ---
  const css2d = new CSS2DRenderer({ element: css2dContainer });
  css2d.setSize(window.innerWidth, window.innerHeight);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    css2d.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls, composer, css2d, bloom };
}
