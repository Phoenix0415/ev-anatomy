// Educational content for each interactive part.
// Figures are approximate values for a Tesla Model 3/Y-class EV,
// researched and adversarially fact-checked (see project notes).

export const PART_ORDER = [
  'battery',
  'motorRear',
  'motorFront',
  'inverter',
  'chargePort',
  'thermal',
  'regen',
  'computer',
];

export const CONTENT = {
  battery: {
    color: '#22d3ee',
    kicker: 'Energy Storage',
    chip: 'Battery',
    title: 'High-Voltage Battery Pack',
    tagline: 'Thousands of small cells, one skateboard power plant',
    summary:
      'Under the cabin floor sits a flat slab of about 4,416 lithium-ion cells, each shaped like an overgrown AA battery. Together they store roughly 75 usable kWh at around 350 volts, good for about 330 miles. It is the car’s heaviest single component, and it doubles as part of the structure.',
    howItWorks: [
      'Each 2170 cell is a small rechargeable lithium-ion battery, 21 mm across and 70 mm tall.',
      'Cells are grouped into bricks, bricks into four long modules, modules into one sealed pack.',
      'Wiring 96 cell groups in series stacks their small voltages to roughly 350 volts, about 400 when full.',
      'Liquid coolant snakes between the cells, keeping temperatures even for safety, range, and fast charging.',
      'Mounting this heavy slab in the floor lowers the center of gravity and stiffens the body.',
    ],
    specs: [
      { label: 'Cells', value: '~4,416 cylindrical 2170 cells' },
      { label: 'Energy', value: '~75 kWh usable' },
      { label: 'Voltage', value: '~350 V nominal, ~400 V full' },
      { label: 'Pack weight', value: '~480 kg (~1,060 lb)' },
      { label: 'EPA range', value: '~330 mi (Long Range AWD)' },
      { label: 'Peak charging', value: 'up to 250 kW DC' },
    ],
    funFact:
      'The name 2170 is just the cell’s size: 21 mm across, 70 mm tall. Laid end to end, the pack’s roughly 4,416 cells would stretch over 300 meters — about three soccer fields.',
  },

  motorRear: {
    color: '#a78bfa',
    kicker: 'Propulsion',
    chip: 'Rear Motor',
    title: 'Rear Drive Unit',
    tagline: 'Instant torque from a motor with one moving part',
    summary:
      'Tucked between the rear wheels, this compact unit combines a permanent-magnet motor, a single-speed gearbox, and power electronics. Copper coils create a spinning magnetic field; magnets buried in the rotor chase it, turning the wheels with full torque the moment you press the pedal.',
    howItWorks: [
      'The inverter converts battery DC into three-phase AC, energizing copper coils in the motor’s stationary stator.',
      'Those coils create a magnetic field that sweeps around the stator thousands of times per minute.',
      'Neodymium magnets buried in the rotor chase that spinning field, dragging the shaft around with it.',
      'Because magnetic force appears instantly, full torque is available from a standstill, no revving required.',
      'A single-speed gearbox trades about nine motor turns for one wheel turn, multiplying torque at the axle.',
    ],
    specs: [
      { label: 'Motor type', value: 'IPM-SynRM (magnets + reluctance)' },
      { label: 'Peak power', value: '~194–220 kW (260–295 hp)' },
      { label: 'Peak torque', value: '~340–440 Nm' },
      { label: 'Max motor speed', value: '~18,000 rpm' },
      { label: 'Gear reduction', value: '~9:1, single fixed gear' },
      { label: 'Peak efficiency', value: '~97%' },
    ],
    funFact:
      'At top speed the rotor spins 300 times every second — roughly double a supercar engine’s redline — yet the single gear never shifts, covering 0 to 162 mph.',
  },

  motorFront: {
    color: '#e879f9',
    kicker: 'Propulsion',
    chip: 'Front Motor',
    title: 'Front Drive Unit',
    tagline: 'Two motor types, one brain, instant all-wheel grip',
    summary:
      'The front drive unit is an AC induction motor: its rotor contains no magnets, so electricity alone creates the spinning force. Tesla pairs it with a permanent-magnet motor at the rear because each excels at different jobs, and software shifts torque between the axles in milliseconds, with no driveshaft in between.',
    howItWorks: [
      'The inverter feeds three-phase AC into stationary copper windings, creating a magnetic field that spins.',
      'That spinning field induces currents in the magnet-free rotor, dragging it around to turn the front wheels.',
      'The rear permanent-magnet motor excels at efficient cruising; the front induction motor piles on power when needed.',
      'No driveshaft connects the axles; software alone rebalances torque front-to-rear within milliseconds for grip.',
      'Cruising steadily, the front motor simply de-energizes and freewheels with almost no drag, stretching range.',
    ],
    specs: [
      { label: 'Motor type', value: '3-phase AC induction' },
      { label: 'Peak power', value: '~137 kW (~184 hp)' },
      { label: 'Peak torque', value: '~219 Nm' },
      { label: 'Combined AWD output', value: '~295–380 kW' },
      { label: 'Torque split', value: 'Software, in milliseconds' },
      { label: 'Axle link', value: 'No driveshaft or clutch' },
    ],
    funFact:
      'Nikola Tesla patented the AC induction motor in 1888 — so the front motor in every dual-motor Model 3 is essentially the invention the company is named after.',
  },

  inverter: {
    color: '#fbbf24',
    kicker: 'Power Electronics',
    chip: 'Inverter',
    title: 'SiC Traction Inverter',
    tagline: 'Turning battery DC into motor-spinning three-phase AC',
    summary:
      'The battery stores energy as DC, current flowing one way, but the motor needs three-phase AC, current that ripples in waves. The inverter translates between them using 24 silicon-carbide transistor modules. Silicon carbide switches faster and loses less energy as heat than ordinary silicon — a first in a mass-produced car.',
    howItWorks: [
      'The battery supplies steady DC power at roughly 350 to 400 volts.',
      'Silicon-carbide transistors chop that DC on and off about 10,000 times a second, called pulse-width modulation.',
      'The pulses average into three smooth AC waves, offset like runners staggered around a track.',
      'Those waves spin a magnetic field in the motor; wave frequency sets speed, pulse width sets torque.',
      'Lift off the pedal and it runs in reverse, turning motor AC back into battery-charging DC.',
    ],
    specs: [
      { label: 'Power stage', value: '24 SiC modules, 48 dies' },
      { label: 'MOSFET rating', value: '650 V, ~100 A per die' },
      { label: 'DC input', value: '~350–400 V from the pack' },
      { label: 'Peak output', value: '~210 kW to the rear motor' },
      { label: 'Efficiency', value: '~99% inverter alone' },
    ],
    funFact:
      'Each car needs 48 silicon-carbide chips, and early Model 3 production strained global supply of the material so much that Tesla brought in a second chipmaker, Infineon.',
  },

  chargePort: {
    color: '#34d399',
    kicker: 'Charging',
    chip: 'Charge Port',
    title: 'Charge Port & Charging',
    tagline: 'AC trickles at home, DC floods at Superchargers',
    summary:
      'The little door by the driver-side taillight hides two charging paths. Plug in at home and AC wall power runs through an onboard charger that converts it to DC for the battery. At a Supercharger, high-power DC skips that step entirely, flowing straight into the pack at up to 250 kW.',
    howItWorks: [
      'Batteries only store DC power, but homes supply AC, so something has to convert between them.',
      'On AC, the car’s onboard charger does the converting, topping out around 11.5 kW.',
      'Superchargers convert AC to DC in the cabinet itself, so power bypasses the onboard charger entirely.',
      'That direct DC line feeds the battery at up to 250 kW, but only at low charge.',
      'The car tapers power as the pack fills, protecting cells, so the last 20% crawls.',
    ],
    specs: [
      { label: 'Peak DC charging', value: 'up to 250 kW (V3)' },
      { label: 'Onboard AC charger', value: 'up to 11.5 kW (48 A)' },
      { label: '10→80% on DC', value: '~25–30 min' },
      { label: '15 min of DC', value: '~160–175 mi of range' },
      { label: 'Home AC speed', value: '~44 mi of range per hour' },
      { label: 'Connector', value: 'NACS (SAE J3400)' },
    ],
    funFact:
      'The NACS plug has just five pins, and the same two carry both gentle home AC and 250 kW DC. The car senses which is arriving and routes it down the right path.',
  },

  thermal: {
    color: '#60a5fa',
    kicker: 'Thermal Management',
    chip: 'Cooling',
    title: 'Heat Pump & Octovalve',
    tagline: 'The car that recycles its own body heat',
    summary:
      'Lithium-ion batteries are picky about temperature: too cold and they lose power and charge slowly, too hot and they age fast. Tesla solves this with one integrated system — a heat pump plus a rotating 8-port valve called the Octovalve — that shuttles heat between battery, motors and cabin so almost nothing is wasted.',
    howItWorks: [
      'Water-glycol coolant circulates through the battery, motors and power electronics, picking up or dropping off heat.',
      'The Octovalve, a motorized 8-port rotary valve, reroutes that coolant to connect or isolate loops on demand.',
      'A heat pump moves heat instead of making it: about 2–3 units of warmth per unit of electricity.',
      'In winter it scavenges waste heat from motors and electronics to warm the cabin and battery.',
      'Navigating to a Supercharger pre-warms the pack so it can safely accept very fast charging.',
    ],
    specs: [
      { label: 'Octovalve ports', value: '8' },
      { label: 'Operating modes', value: '15 (12 heat, 3 cool)' },
      { label: 'Heat pump output', value: '~2–3 kW heat per 1 kW in' },
      { label: 'Battery sweet spot', value: '~20–30 °C' },
      { label: 'Range kept at 0 °C', value: '~86% (Model Y)' },
    ],
    funFact:
      'There is no dedicated battery heater: in deep cold, software deliberately runs the drive motors inefficiently, turning them into heaters whose waste heat warms the battery pack.',
  },

  regen: {
    color: '#f87171',
    kicker: 'Braking',
    chip: 'Regen Brakes',
    title: 'Regenerative Braking',
    tagline: 'Slow down, charge up: the motor becomes a generator',
    summary:
      'Ease off the accelerator and the drive motor flips roles, becoming a generator that turns the car’s momentum back into electricity for the battery. The slowing is smooth enough that most everyday driving needs only one pedal. Conventional disc brakes stand by for hard stops or when a cold or full battery limits charging.',
    howItWorks: [
      'Lift off the accelerator and the motor stops driving the wheels and starts resisting them.',
      'The wheels now spin the motor, which acts as a generator, turning motion into electric current.',
      'Power electronics route that current back into the battery pack, recharging it every time you slow.',
      'Below about 4 mph, Hold mode blends in friction brakes to reach and hold a full stop.',
      'For hard stops, or when a cold or full battery limits regeneration, disc brakes take over.',
    ],
    specs: [
      { label: 'Peak regen power', value: '~60–85 kW to the battery' },
      { label: 'Max regen decel', value: '~0.2–0.3 g' },
      { label: 'Energy recovered', value: '~60–70% of braking' },
      { label: 'Front rotors', value: '320 mm discs' },
      { label: 'City range benefit', value: '~10–30% in stop-and-go' },
    ],
    funFact:
      'The brake lights come on during strong regenerative braking even though your foot never touches the brake pedal — the car triggers them by deceleration rate, not pedal position.',
  },

  computer: {
    color: '#f472b6',
    kicker: 'Brains',
    chip: 'Computer',
    title: 'Onboard Computer & Cameras',
    tagline: 'Eight cameras, one AI brain, zero radar',
    summary:
      'Instead of radar or lidar, the car watches the road through eight cameras giving full 360-degree coverage, then feeds every frame into a custom AI computer tucked behind the glovebox. Neural networks — software loosely modeled on the brain — turn those pixels into a live 3D map of lanes, cars, and pedestrians around the vehicle.',
    howItWorks: [
      'Eight cameras around the body stream overlapping views, covering 360 degrees out to roughly 250 meters ahead.',
      'The computer’s neural networks label every frame: lanes, curbs, cars, cyclists, traffic lights, pedestrians.',
      'An “occupancy network” builds one live 3D picture of everything nearby.',
      'Autopilot software plans a path, then steers, accelerates, and brakes; twin chips cross-check decisions.',
      'A separate infotainment computer with a gaming-class AMD chip runs the touchscreen, maps, and entertainment.',
    ],
    specs: [
      { label: 'Cameras', value: '8 exterior' },
      { label: 'Farthest vision', value: '~250 m ahead' },
      { label: 'AI compute', value: '~144 TOPS (HW3)' },
      { label: 'Image throughput', value: '~2,300 frames/s' },
      { label: 'Radar & lidar', value: 'None — cameras only' },
      { label: 'Redundancy', value: '2 chips cross-check' },
    ],
    funFact:
      'The FSD chip was co-designed by Jim Keller, the engineer behind AMD’s Zen and Apple’s early iPhone chips; it chews through about 2,300 camera frames every second.',
  },
};
