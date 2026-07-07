# ⚡ EV Anatomy — How an Electric Car Works

An interactive 3D teardown of a Tesla Model 3-inspired electric car. Click any glowing
hotspot (or a part chip) and the component detaches from the car while the camera
focuses on it, with a plain-language explanation, real spec figures, and a hands-on
widget for every part.

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

## What you can do

| Interaction | What happens |
| --- | --- |
| Click a hotspot / chip | Part detaches, camera focuses, info panel + widget open |
| **X** · X-Ray | Body goes translucent, revealing the whole skateboard platform |
| **E** · Explode | Full exploded view — shell, glass, pack, motors, wheels separate |
| **D** · Drive | Low camera, wheels spin, energy particles stream battery → motors |
| **R** · Reset | Back to the showroom view |
| ← / → | Previous / next part while a part is focused |

### The 8 interactive parts & their widgets

- **Battery pack** — charge slider: pack glow + range/energy readouts
- **Rear motor (PM)** — throttle: 3-phase wave animation, kW / rpm / km/h
- **Front motor (induction)** — same rig, induction-motor story
- **SiC inverter** — DC→3-phase-AC oscilloscope, speed demand slider
- **Charge port** — Home AC vs Supercharger simulation with charge-curve taper
- **Heat pump & Octovalve** — cool/heat modes recolor and redirect the coolant loop
- **Regen braking** — brake-pedal slider: energy flows *backwards* to the pack; push
  past ~75% and the friction discs glow
- **Computer & cameras** — toggle the eight camera-vision cones

## How it's built

- **Three.js** — the car is 100% procedural geometry (extruded body silhouette with
  wheel-arch arcs, parts from primitives), so every component is a real, detachable
  3D object. No downloaded models, no licensing worries.
- **GSAP** for all detach/camera/ghosting choreography.
- Mirror floor (`Reflector`), UnrealBloom, CSS2D hotspots, instanced-mesh energy
  particles.
- **Content pipeline**: each component's copy and spec figures were researched and
  then adversarially fact-checked by a second pass before landing in
  [src/content.js](src/content.js).

Educational demo. Not affiliated with Tesla.
