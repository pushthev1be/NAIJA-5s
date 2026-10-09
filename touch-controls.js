// ── Naija 5s — On-screen touch controls (mobile / tablet) ────────────────────
// PlayStation-style prompts (△ ○ × □, R2, OPTIONS, SHARE). Buttons write into
// the same key map the keyboard uses, so every menu and gameplay path works
// unchanged. The joystick is analog and read via `stick`.
//
// Sizing follows platform touch guidance: targets never below 48px
// (Apple 44pt / Material 48dp), ≥8px between targets, floating joystick with a
// ~120px base and a small dead zone. Everything scales with the short screen
// side so tablets get bigger controls.

export const stick = { active: false, dx: 0, dy: 0 };

export const isTouchDevice =
  'ontouchstart' in window || navigator.maxTouchPoints > 0;

const STICK_R = 60;        // px the knob can travel from the base
const DEADZONE = 0.18;
const MIN_PRESS_MS = 60;   // keep quick taps down long enough for the game loop to see them

const GLYPH = {
  triangle: '<polygon points="12,3.5 21,19 3,19" />',
  circle:   '<circle cx="12" cy="12" r="7.5" />',
  cross:    '<path d="M5 5L19 19M19 5L5 19" />',
  square:   '<rect x="5" y="5" width="14" height="14" />',
};

const CSS = `
#tc{--b:clamp(48px,15vmin,76px);--d:calc(var(--b)*0.9);position:fixed;inset:0;pointer-events:none;z-index:10;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:'Press Start 2P',monospace}
#tc *{touch-action:none}
#tc-zone{position:absolute;left:0;top:18%;width:45%;height:82%;pointer-events:auto}
#tc-base,#tc-knob{position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);display:none}
#tc-base{width:${STICK_R * 2}px;height:${STICK_R * 2}px;background:rgba(20,22,27,.45);border:2px solid rgba(255,255,255,.22);box-shadow:inset 0 0 18px rgba(0,0,0,.6)}
#tc-knob{width:56px;height:56px;background:radial-gradient(circle at 40% 35%,#4a4f5a,#23262d);border:2px solid rgba(255,255,255,.35);box-shadow:0 2px 6px rgba(0,0,0,.6)}
#tc-hint{position:absolute;left:calc(36px + env(safe-area-inset-left));bottom:calc(28px + env(safe-area-inset-bottom));width:${STICK_R * 2}px;height:${STICK_R * 2}px;border-radius:50%;border:2px dashed rgba(255,255,255,.18);pointer-events:none;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);font-size:9px}

.tc-btn{position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;color:#e8e8ea;background:rgba(24,26,32,.72);border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 -3px 0 rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.45);transition:transform .05s,background .05s}
.tc-btn.on{background:rgba(70,76,90,.85)}
.tc-face.on,#tc-r2.on{transform:translate(-50%,-50%) scale(.92)}
.tc-pill.on{transform:scale(.95)}
.tc-btn.hide{display:none}
.tc-btn svg{width:46%;height:46%;fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;overflow:visible}
.tc-cap{position:absolute;top:100%;margin-top:3px;font-size:6px;color:rgba(255,255,255,.75);text-shadow:0 1px 2px #000;white-space:nowrap}

#tc-pad{position:absolute;width:0;height:0;right:calc(var(--b)*1.4 + 28px + env(safe-area-inset-right));bottom:calc(var(--b)*1.5 + 26px + env(safe-area-inset-bottom))}
.tc-face{width:var(--b);height:var(--b);border-radius:50%;transform:translate(-50%,-50%)}
#tc-triangle{left:0;top:calc(var(--d)*-1)}
#tc-circle{left:var(--d);top:0}
#tc-cross{left:0;top:var(--d);width:calc(var(--b)*1.15);height:calc(var(--b)*1.15)}
#tc-square{left:calc(var(--d)*-1);top:0}
#tc-triangle svg{stroke:#3fdcb0}
#tc-circle svg{stroke:#ff5f6f}
#tc-cross svg{stroke:#7fa9ff}
#tc-square svg{stroke:#f08ad2}
#tc-r2{left:calc(var(--b)*1.2);top:calc(var(--b)*-1.45);width:calc(var(--b)*1.1);height:max(44px,calc(var(--b)*.62));border-radius:10px 10px 8px 8px;transform:translate(-50%,-50%);font-size:11px}

.tc-pill{height:44px;min-width:64px;padding:0 10px;border-radius:22px;top:calc(8px + env(safe-area-inset-top));font-size:6px;letter-spacing:1px}
#tc-share{left:calc(8px + env(safe-area-inset-left))}
#tc-options{left:calc(84px + env(safe-area-inset-left))}
#tc-full{right:calc(8px + env(safe-area-inset-right))}

#tc-rotate{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;flex-direction:column;gap:18px;background:#050A05;color:#fde047;font-family:'Press Start 2P',monospace;font-size:12px;text-align:center;line-height:1.8;padding:24px}
@media (orientation:portrait){#tc-rotate.touch{display:flex}}
`;

// id, glyph/label, key code per mode, caption per mode ({play, menu, paused})
const BUTTONS = [
  { id: 'cross',    glyph: 'cross',    face: true, code: { play: 'Space', menu: 'Space', paused: null },
    cap: { play: 'SHOOT', menu: 'OK' } },
  { id: 'circle',   glyph: 'circle',   face: true, code: { play: 'KeyC', menu: 'Escape', paused: null },
    cap: { play: 'TACKLE', menu: 'BACK' } },
  { id: 'square',   glyph: 'square',   face: true, code: { play: 'KeyE' }, cap: { play: 'PASS' } },
  { id: 'triangle', glyph: 'triangle', face: true, code: { play: 'Tab' },  cap: { play: 'SWITCH' } },
  { id: 'r2',       label: 'R2',       code: { play: 'ShiftLeft' }, cap: { play: 'SPRINT' } },
  { id: 'options',  label: 'OPTIONS',  pill: true, code: { play: 'Escape', paused: 'Escape' },
    cap: { play: 'PAUSE', paused: 'RESUME' } },
  { id: 'share',    label: 'SHARE',    pill: true, code: { paused: 'Backspace' }, cap: { paused: 'QUIT' } },
];

let mode = 'menu';
const btnEls = {};

export function initTouchControls(K, onFirstTouch) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const rotate = document.createElement('div');
  rotate.id = 'tc-rotate';
  rotate.innerHTML = '<div style="font-size:40px">⟳</div>ROTATE YOUR PHONE<br>TO LANDSCAPE';
  document.body.appendChild(rotate);
  if (isTouchDevice) rotate.classList.add('touch');

  if (!isTouchDevice) return;

  const root = document.createElement('div');
  root.id = 'tc';
  root.innerHTML = '<div id="tc-zone"></div><div id="tc-hint">L3</div><div id="tc-base"></div><div id="tc-knob"></div><div id="tc-pad"></div>';
  document.body.appendChild(root);
  const pad = root.querySelector('#tc-pad');
  // Block page scroll, pinch-zoom and double-tap zoom everywhere.
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault());
  addEventListener('contextmenu', e => e.preventDefault());

  for (const def of BUTTONS) {
    const b = document.createElement('div');
    b.id = 'tc-' + def.id;
    b.className = 'tc-btn' + (def.face ? ' tc-face' : '') + (def.pill ? ' tc-pill' : '');
    b.innerHTML = def.glyph
      ? `<svg viewBox="0 0 24 24">${GLYPH[def.glyph]}</svg>`
      : def.label;
    const cap = document.createElement('span');
    cap.className = 'tc-cap';
    b.appendChild(cap);

    // The key is chosen at press time so a mode change mid-press releases the right one.
    let held = null, downAt = 0, timer = 0;
    const press = e => {
      e.preventDefault();
      onFirstTouch();
      const code = def.code[mode];
      if (!code) return;
      b.setPointerCapture?.(e.pointerId);
      clearTimeout(timer);
      if (held && held !== code) K[held] = false;
      held = code;
      downAt = performance.now();
      K[code] = true;
      b.classList.add('on');
    };
    const release = () => {
      b.classList.remove('on');
      if (!held) return;
      const code = held;
      clearTimeout(timer);
      timer = setTimeout(() => { K[code] = false; if (held === code) held = null; },
        Math.max(0, MIN_PRESS_MS - (performance.now() - downAt)));
    };
    b.addEventListener('pointerdown', press);
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('lostpointercapture', release);
    (def.face || def.id === 'r2' ? pad : root).appendChild(b);
    btnEls[def.id] = { el: b, cap, def };
  }

  const canFullscreen = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (canFullscreen) {
    const fs = document.createElement('div');
    fs.id = 'tc-full';
    fs.className = 'tc-btn tc-pill';
    fs.textContent = 'FULL';
    fs.addEventListener('pointerdown', e => { e.preventDefault(); onFirstTouch(); toggleFullscreen(); });
    root.appendChild(fs);
  }

  applyMode();

  // ── Floating joystick ───────────────────────────────────────────────────────
  const zone = root.querySelector('#tc-zone');
  const base = root.querySelector('#tc-base');
  const knob = root.querySelector('#tc-knob');
  const hint = root.querySelector('#tc-hint');
  let pid = null, ox = 0, oy = 0;

  const move = e => {
    let x = e.clientX - ox, y = e.clientY - oy;
    const d = Math.hypot(x, y);
    if (d > STICK_R) { x *= STICK_R / d; y *= STICK_R / d; }
    knob.style.left = ox + x + 'px';
    knob.style.top = oy + y + 'px';
    const mag = Math.min(d, STICK_R) / STICK_R;
    if (mag < DEADZONE) { stick.dx = 0; stick.dy = 0; }
    else { stick.dx = x / STICK_R; stick.dy = y / STICK_R; }
  };
  const end = e => {
    if (e.pointerId !== pid) return;
    pid = null;
    stick.active = false; stick.dx = 0; stick.dy = 0;
    base.style.display = knob.style.display = 'none';
    hint.style.display = '';
  };
  zone.addEventListener('pointerdown', e => {
    e.preventDefault();
    onFirstTouch();
    if (pid !== null) return;
    pid = e.pointerId;
    zone.setPointerCapture?.(pid);
    ox = e.clientX; oy = e.clientY;
    base.style.left = knob.style.left = ox + 'px';
    base.style.top = knob.style.top = oy + 'px';
    base.style.display = knob.style.display = 'block';
    hint.style.display = 'none';
    stick.active = true;
    move(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === pid) move(e); });
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
}

// mode: 'menu' | 'play' | 'paused' — shows only the buttons that do something.
export function setTouchMode(m) {
  if (m === mode) return;
  mode = m;
  applyMode();
}

function applyMode() {
  for (const { el, cap, def } of Object.values(btnEls)) {
    el.classList.toggle('hide', !def.code[mode]);
    cap.textContent = def.cap[mode] ?? '';
  }
}

function toggleFullscreen() {
  const d = document, el = d.documentElement;
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    (d.exitFullscreen || d.webkitExitFullscreen)?.call(d);
    return;
  }
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  Promise.resolve(req?.call(el))
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {});
}
