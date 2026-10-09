// ── Naija 5s — On-screen touch controls (mobile / tablet) ────────────────────
// Buttons write into the same key map the keyboard uses, so every menu and
// gameplay path works unchanged. The joystick is analog and read via `stick`.

export const stick = { active: false, dx: 0, dy: 0 };

export const isTouchDevice =
  'ontouchstart' in window || navigator.maxTouchPoints > 0;

const STICK_R = 56;        // px the knob can travel from the base
const DEADZONE = 0.18;
const MIN_PRESS_MS = 60;   // keep quick taps down long enough for the game loop to see them

const CSS = `
#tc{position:fixed;inset:0;pointer-events:none;z-index:10;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:'Press Start 2P',monospace}
#tc *{touch-action:none}
#tc-zone{position:absolute;left:0;top:15%;width:45%;height:85%;pointer-events:auto}
#tc-base,#tc-knob{position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);display:none}
#tc-base{width:${STICK_R * 2}px;height:${STICK_R * 2}px;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08)}
#tc-knob{width:52px;height:52px;background:rgba(255,255,255,.45)}
#tc-hint{position:absolute;left:calc(40px + env(safe-area-inset-left));bottom:calc(30px + env(safe-area-inset-bottom));width:${STICK_R * 2}px;height:${STICK_R * 2}px;border-radius:50%;border:2px dashed rgba(255,255,255,.2);pointer-events:none}
.tc-btn{position:absolute;pointer-events:auto;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;font-size:9px;line-height:1.4;background:rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.45);text-shadow:0 1px 2px #000}
.tc-btn.on{background:rgba(255,255,255,.35)}
.tc-btn.hide{display:none}
#tc-shoot{width:84px;height:84px;right:calc(40px + env(safe-area-inset-right));bottom:calc(36px + env(safe-area-inset-bottom));border-color:#fde047;font-size:10px}
#tc-pass{width:62px;height:62px;right:calc(138px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom));border-color:#67e8f9}
#tc-tackle{width:62px;height:62px;right:calc(28px + env(safe-area-inset-right));bottom:calc(134px + env(safe-area-inset-bottom));border-color:#f87171}
#tc-sprint{width:62px;height:62px;right:calc(124px + env(safe-area-inset-right));bottom:calc(104px + env(safe-area-inset-bottom));border-color:#86efac}
#tc-switch{width:52px;height:52px;right:calc(112px + env(safe-area-inset-right));bottom:calc(186px + env(safe-area-inset-bottom));font-size:7px}
.tc-top{width:auto;height:auto;border-radius:6px;padding:8px 10px;top:calc(8px + env(safe-area-inset-top));font-size:8px}
#tc-pause{left:calc(8px + env(safe-area-inset-left))}
#tc-quit{left:calc(96px + env(safe-area-inset-left))}
#tc-full{right:calc(8px + env(safe-area-inset-right))}
#tc-rotate{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;flex-direction:column;gap:18px;background:#050A05;color:#fde047;font-family:'Press Start 2P',monospace;font-size:12px;text-align:center;line-height:1.8;padding:24px}
@media (orientation:portrait){#tc-rotate.touch{display:flex}}
`;

// [id, key code, label, gameplay-only]
const BUTTONS = [
  ['shoot',  'Space',      'SHOOT', false],
  ['pass',   'KeyE',       'PASS',  true],
  ['tackle', 'KeyC',       'TACKLE',true],
  ['sprint', 'ShiftLeft',  'SPRINT',true],
  ['switch', 'Tab',        'SWITCH',true],
  ['pause',  'Escape',     'PAUSE', false],
  ['quit',   'Backspace',  'QUIT',  false],
];

let els = {};
let lastMode = '';

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
  root.innerHTML = '<div id="tc-zone"></div><div id="tc-hint"></div><div id="tc-base"></div><div id="tc-knob"></div>';
  document.body.appendChild(root);
  // Block page scroll, pinch-zoom and double-tap zoom everywhere.
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault());
  addEventListener('contextmenu', e => e.preventDefault());

  for (const [id, code, label] of BUTTONS) {
    const b = document.createElement('div');
    b.id = 'tc-' + id;
    b.className = 'tc-btn' + (id === 'pause' || id === 'quit' ? ' tc-top' : '');
    b.textContent = label;
    let downAt = 0, timer = 0;
    const press = e => {
      e.preventDefault();
      onFirstTouch();
      b.setPointerCapture?.(e.pointerId);
      clearTimeout(timer);
      downAt = performance.now();
      K[code] = true;
      b.classList.add('on');
    };
    const release = () => {
      b.classList.remove('on');
      clearTimeout(timer);
      timer = setTimeout(() => { K[code] = false; }, Math.max(0, MIN_PRESS_MS - (performance.now() - downAt)));
    };
    b.addEventListener('pointerdown', press);
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('lostpointercapture', release);
    root.appendChild(b);
    els[id] = b;
  }

  const canFullscreen = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (canFullscreen) {
    const fs = document.createElement('div');
    fs.id = 'tc-full';
    fs.className = 'tc-btn tc-top';
    fs.textContent = 'FULL';
    fs.addEventListener('pointerdown', e => { e.preventDefault(); onFirstTouch(); toggleFullscreen(); });
    root.appendChild(fs);
  }

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

// Show only the buttons that matter for the current screen.
// mode: 'menu' | 'play' | 'paused'
export function setTouchMode(mode) {
  if (!isTouchDevice || mode === lastMode) return;
  lastMode = mode;
  for (const [id, , label, gameplayOnly] of BUTTONS) {
    const b = els[id];
    if (!b) continue;
    let hidden = gameplayOnly && mode !== 'play';
    if (id === 'quit') hidden = mode !== 'paused';
    b.classList.toggle('hide', hidden);
    if (id === 'shoot') b.textContent = mode === 'play' ? label : 'OK';
    if (id === 'pause') b.textContent = mode === 'menu' ? 'BACK' : mode === 'paused' ? 'RESUME' : label;
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
