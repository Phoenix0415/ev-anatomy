import { PART_ORDER } from './content.js';

const $ = (sel) => document.querySelector(sel);

function readout(val, unit) {
  return `<div class="readout"><div class="val">${val}</div><div class="unit">${unit}</div></div>`;
}

function slider(label, value, min = 0, max = 100) {
  return `<div class="widget-row"><label>${label}</label><input type="range" min="${min}" max="${max}" value="${value}" /></div>`;
}

function bindRange(input, onChange) {
  const apply = () => {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty('--fill', pct + '%');
    onChange(Number(input.value));
  };
  input.addEventListener('input', apply);
  apply();
}

// ---------- per-part widgets ----------
// Each returns an optional cleanup function.
const WIDGETS = {
  battery(el, app) {
    el.innerHTML = `
      ${slider('Charge', app.state.soc, 5, 100)}
      <div class="widget-readouts" id="bat-reads"></div>
      <p class="widget-note">Drag the slider — the pack's glow follows the state of charge, and range scales with it.</p>`;
    const reads = el.querySelector('#bat-reads');
    bindRange(el.querySelector('input'), (v) => {
      app.state.soc = v;
      reads.innerHTML =
        readout(Math.round(v * 5.3) + ' km', 'est. range') +
        readout((v * 0.75).toFixed(0) + ' kWh', 'energy stored') +
        readout(v + '%', 'charge');
    });
  },

  motorRear(el, app) {
    return motorWidget(el, app, 220);
  },
  motorFront(el, app) {
    return motorWidget(el, app, 137);
  },

  inverter(el, app) {
    el.innerHTML = `
      ${slider('Speed demand', Math.round(app.state.throttle * 100))}
      <canvas class="widget-canvas" width="720" height="180"></canvas>
      <div class="widget-readouts" id="inv-reads"></div>
      <p class="widget-note">Steady battery DC (left) is chopped into three staggered AC waves (right). Faster waves = faster motor.</p>`;
    const reads = el.querySelector('#inv-reads');
    bindRange(el.querySelector('input'), (v) => {
      app.state.throttle = v / 100;
      reads.innerHTML =
        readout('~' + Math.round(20 + v * 5.8) + ' Hz', 'wave frequency') +
        readout('~10k/s', 'switching') +
        readout('~99%', 'efficiency');
    });
    return drawWaves(el.querySelector('canvas'), app, true);
  },

  chargePort(el, app) {
    el.innerHTML = `
      <div class="widget-toggle-row">
        <button class="widget-btn" data-p="11.5">🏠 Home AC · 11.5 kW</button>
        <button class="widget-btn" data-p="250">⚡ Supercharger · 250 kW</button>
      </div>
      <div class="charge-bar"><div class="fill"></div></div>
      <div class="widget-readouts" id="chg-reads"></div>
      <p class="widget-note">Simulated at high speed. Watch the green energy stream flow from the port into the pack — and the taper near full.</p>`;
    const fill = el.querySelector('.fill');
    const reads = el.querySelector('#chg-reads');
    const btns = [...el.querySelectorAll('.widget-btn')];
    // continue from whatever charge the user set in the battery widget
    let pct = Math.min(Math.max(app.state.soc, 0), 100);
    let raf;
    let last = performance.now();
    fill.style.width = pct + '%';

    const setPower = (p) => {
      if (pct >= 99.5) pct = 10; // pack already full — restart the demo
      app.state.charging = { active: true, power: p };
      btns.forEach((b) => b.classList.toggle('active', Number(b.dataset.p) === p));
    };
    btns.forEach((b) => b.addEventListener('click', () => setPower(Number(b.dataset.p))));

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (app.state.charging.active) {
        const p = app.state.charging.power;
        const taper = pct > 80 ? Math.max(0.15, 1 - (pct - 80) / 25) : 1;
        // 1 real second ≈ 5 simulated minutes
        pct = Math.min(100, pct + ((p * taper) / 75) * 100 * (dt * 300 / 3600));
        fill.style.width = pct + '%';
        app.state.soc = pct;
        if (pct >= 100) {
          app.state.charging.active = false;
          btns.forEach((b) => b.classList.remove('active'));
          reads.innerHTML =
            readout('100%', 'charge') + readout('0 kW', 'power now') + readout('✓ done', 'pack full');
        } else {
          const rate = p * taper;
          reads.innerHTML =
            readout(pct.toFixed(0) + '%', 'charge') +
            readout('~' + rate.toFixed(0) + ' kW', 'power now') +
            readout(p > 50 ? '~28 min' : '~4.6 hrs', '10→80% real time');
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    reads.innerHTML = readout('—', 'pick a charger above');
    return () => {
      cancelAnimationFrame(raf);
      app.state.charging.active = false;
    };
  },

  thermal(el, app) {
    el.innerHTML = `
      <div class="widget-toggle-row">
        <button class="widget-btn" data-m="cool">❄️ Cool the battery</button>
        <button class="widget-btn" data-m="heat">🔥 Heat the cabin</button>
      </div>
      <div class="widget-readouts" id="th-reads"></div>
      <p class="widget-note">The Octovalve reroutes the same coolant loop — watch its color and flow change around the pack and motors.</p>`;
    const reads = el.querySelector('#th-reads');
    const btns = [...el.querySelectorAll('.widget-btn')];
    const setMode = (m) => {
      app.state.thermalMode = m;
      btns.forEach((b) => b.classList.toggle('active', b.dataset.m === m));
      reads.innerHTML =
        m === 'cool'
          ? readout('20–40 °C', 'battery target') + readout('waste heat', 'sent to radiator')
          : readout('1 kW in', 'electricity') + readout('~3 kW out', 'heat moved');
    };
    btns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
    setMode(app.state.thermalMode);
  },

  regen(el, app) {
    el.innerHTML = `
      ${slider('Brake pedal', Math.round(app.state.regenBrake * 100))}
      <div class="widget-readouts" id="rg-reads"></div>
      <p class="widget-note">Gentle braking = motors recover energy (watch the flow run backwards). Push past ~75% and the friction discs glow into action.</p>`;
    const reads = el.querySelector('#rg-reads');
    bindRange(el.querySelector('input'), (v) => {
      app.state.regenBrake = v / 100;
      const regenKw = Math.round(Math.min(v, 75) * 1.05);
      const friction = v > 75 ? Math.round((v - 75) * 4) : 0;
      reads.innerHTML =
        readout(regenKw + ' kW', 'back to battery') +
        readout(friction + '%', 'friction brakes') +
        readout(v === 0 ? 'coasting' : v > 75 ? 'hard stop' : 'one-pedal', 'mode');
    });
    return () => {
      app.state.regenBrake = 0;
    };
  },

  computer(el, app) {
    el.innerHTML = `
      <div class="widget-toggle-row">
        <button class="widget-btn" id="cones-btn">👁 Show 360° camera vision</button>
      </div>
      <div class="widget-readouts">
        ${readout('8', 'cameras')}${readout('~144', 'TOPS')}${readout('36×/s', 'full re-plan')}
      </div>
      <p class="widget-note">Toggle the cones to see how the eight cameras overlap into full surround vision.</p>`;
    const btn = el.querySelector('#cones-btn');
    const sync = () => btn.classList.toggle('active', app.effects.sensorCones.visible);
    btn.addEventListener('click', () => {
      app.effects.sensorCones.visible = !app.effects.sensorCones.visible;
      sync();
    });
    sync();
    return () => {
      app.effects.sensorCones.visible = false;
    };
  },
};

function motorWidget(el, app, peakKw) {
  el.innerHTML = `
    ${slider('Throttle', Math.round(app.state.throttle * 100))}
    <canvas class="widget-canvas" width="720" height="180"></canvas>
    <div class="widget-readouts" id="mo-reads"></div>
    <p class="widget-note">Push the throttle — the 3-phase waves speed up, the motor spins faster, and energy streams in from the pack.</p>`;
  const reads = el.querySelector('#mo-reads');
  bindRange(el.querySelector('input'), (v) => {
    app.state.throttle = v / 100;
    const rpm = Math.round(v * 180);
    const kmh = Math.round(((rpm / 9) * 2.14 * 60) / 1000);
    reads.innerHTML =
      readout(Math.round(Math.pow(v / 100, 1.4) * peakKw) + ' kW', 'power') +
      readout(rpm.toLocaleString() + ' rpm', 'motor speed') +
      readout(kmh + ' km/h', 'car speed');
  });
  return drawWaves(el.querySelector('canvas'), app, false);
}

// animated DC → 3-phase AC canvas
function drawWaves(canvas, app, showDC) {
  const ctx = canvas.getContext('2d');
  let raf;
  let phase = 0;
  let last = performance.now();
  const colors = ['#22d3ee', '#a78bfa', '#fbbf24'];

  const loop = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    phase += dt * (1 + app.state.throttle * 9) * 4;
    const { width: W, height: H } = canvas;
    ctx.clearRect(0, 0, W, H);
    const mid = H / 2;
    const dcEnd = showDC ? W * 0.3 : 0;

    if (showDC) {
      ctx.strokeStyle = '#e6f1f5';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(10, mid - 30);
      ctx.lineTo(dcEnd - 14, mid - 30);
      ctx.stroke();
      ctx.fillStyle = 'rgba(139,163,176,0.9)';
      ctx.font = '20px IBM Plex Mono, monospace';
      ctx.fillText('DC', 12, mid + 24);
      // divider
      ctx.strokeStyle = 'rgba(94,234,212,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(dcEnd, 8);
      ctx.lineTo(dcEnd, H - 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const amp = 24 + app.state.throttle * 34;
    const freq = 0.02 + app.state.throttle * 0.045;
    for (let ph = 0; ph < 3; ph++) {
      ctx.strokeStyle = colors[ph];
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      for (let x = dcEnd + 6; x < W - 6; x += 3) {
        const y = mid + Math.sin((x - dcEnd) * freq - phase + (ph * Math.PI * 2) / 3) * amp;
        x === dcEnd + 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

// ---------- panel + chrome ----------
export function createUI(app) {
  const { content, state } = app;
  let widgetCleanup = null;

  const panel = $('#panel');
  const chipsWrap = $('#chips');
  const hint = $('#hint');

  // chips
  const chipEls = {};
  for (const id of PART_ORDER) {
    const c = content[id];
    const b = document.createElement('button');
    b.className = 'chip';
    b.style.setProperty('--chip-color', c.color);
    b.innerHTML = `<span class="dot"></span>${c.chip}`;
    b.addEventListener('click', () => app.interactions.selectPart(id));
    chipsWrap.appendChild(b);
    chipEls[id] = b;
  }

  function showPanel(id) {
    const c = content[id];
    panel.style.setProperty('--accent', c.color);
    $('#panel-kicker').textContent = c.kicker;
    $('#panel-title').textContent = c.title;
    $('#panel-tagline').textContent = c.tagline;
    $('#panel-summary').textContent = c.summary;
    $('#panel-steps').innerHTML = c.howItWorks.map((s) => `<li>${s}</li>`).join('');
    $('#panel-specs').innerHTML = c.specs
      .map((s) => `<div class="spec"><dt>${s.label}</dt><dd>${s.value}</dd></div>`)
      .join('');
    $('#panel-funfact').textContent = c.funFact;

    if (widgetCleanup) widgetCleanup();
    widgetCleanup = WIDGETS[id]?.($('#panel-widget'), app) || null;

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    $('#panel-scroll').scrollTop = 0;
  }

  function hidePanel() {
    if (widgetCleanup) widgetCleanup();
    widgetCleanup = null;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  app.interactions.onSelectionChange((id) => {
    for (const [pid, el] of Object.entries(chipEls)) el.classList.toggle('active', pid === id);
    hint.classList.toggle('hidden', !!id);
    id ? showPanel(id) : hidePanel();
  });

  // mode buttons
  const btnX = $('#btn-xray');
  const btnE = $('#btn-explode');
  const btnD = $('#btn-drive');
  btnX.addEventListener('click', () => app.interactions.setXray(!state.xray));
  btnE.addEventListener('click', () => app.interactions.setExplode(!state.exploded));
  btnD.addEventListener('click', () => app.interactions.setDrive(!state.drive));
  $('#btn-reset').addEventListener('click', () => app.interactions.resetAll());
  app.interactions.onModeChange(() => {
    btnX.classList.toggle('active', state.xray);
    btnE.classList.toggle('active', state.exploded);
    btnD.classList.toggle('active', state.drive);
    hint.classList.toggle('hidden', !!state.selected || state.drive || state.exploded);
  });

  $('#panel-close').addEventListener('click', () => app.interactions.deselect());
  $('#panel-prev').addEventListener('click', () => step(-1));
  $('#panel-next').addEventListener('click', () => step(1));
  function step(dir) {
    const i = PART_ORDER.indexOf(state.selected);
    const next = PART_ORDER[(i + dir + PART_ORDER.length) % PART_ORDER.length];
    app.interactions.selectPart(next);
  }

  // keyboard
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    switch (e.key.toLowerCase()) {
      case 'x': app.interactions.setXray(!state.xray); break;
      case 'e': app.interactions.setExplode(!state.exploded); break;
      case 'd': app.interactions.setDrive(!state.drive); break;
      case 'r': app.interactions.resetAll(); break;
      case 'escape': app.interactions.deselect(); break;
      case 'arrowright': if (state.selected) step(1); break;
      case 'arrowleft': if (state.selected) step(-1); break;
    }
  });
}
