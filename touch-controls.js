// ── Naija 5s — On-screen touch controls (mobile / tablet) ────────────────────
// PlayStation-style prompts (△ ○ × □, R2, OPTIONS, SHARE). Buttons write into
// the same key map the keyboard uses, so every menu and gameplay path works
// unchanged. The joystick is analog and read via `stick`.
//
// Sizing follows platform touch guidance: targets never below 48px
// (Apple 44pt / Material 48dp), ≥8px between targets, floating joystick with a
// ~120px base and a small dead zone. Everything scales with the short screen
// side so tablets get bigger controls.
//
// Players can rearrange the controls (LAYOUT): drag to move, resize the
// selected control, set overall opacity, pick a floating or fixed joystick,
// or reset. The layout is saved per browser.

export const stick = { active: false, dx: 0, dy: 0 };

export const isTouchDevice =
  'ontouchstart' in window || navigator.maxTouchPoints > 0;

const STICK_R = 60;        // px the knob can travel from the base (at size 1)
const DEADZONE = 0.18;
const MIN_PRESS_MS = 60;   // keep quick taps down long enough for the game loop to see them
const LAYOUT_KEY = 'naija5s.touchLayout.v1';
const SIZE_MIN = 0.7, SIZE_MAX = 1.6, SIZE_STEP = 0.1;
const OP_MIN = 0.3, OP_STEP = 0.1;
const MOVABLE = ['cross', 'circle', 'square', 'triangle', 'r2'];

const GLYPH = {
  triangle: '<polygon points="12,3.5 21,19 3,19" />',
  circle:   '<circle cx="12" cy="12" r="7.5" />',
  cross:    '<path d="M5 5L19 19M19 5L5 19" />',
  square:   '<rect x="5" y="5" width="14" height="14" />',
};

const CSS = `
#tc{--b:clamp(48px,15vmin,76px);--d:calc(var(--b)*0.9);--op:1;position:fixed;inset:0;pointer-events:none;z-index:10;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:'Press Start 2P',monospace}
#tc *{touch-action:none}
#tc-zone{position:absolute;left:0;top:18%;width:45%;height:82%;pointer-events:auto}
#tc-base,#tc-knob{position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);display:none;opacity:var(--op)}
#tc-base{width:${STICK_R * 2}px;height:${STICK_R * 2}px;background:rgba(20,22,27,.45);border:2px solid rgba(255,255,255,.22);box-shadow:inset 0 0 18px rgba(0,0,0,.6)}
#tc-knob{width:56px;height:56px;background:radial-gradient(circle at 40% 35%,#4a4f5a,#23262d);border:2px solid rgba(255,255,255,.35);box-shadow:0 2px 6px rgba(0,0,0,.6)}
#tc-hint{position:absolute;left:calc(36px + env(safe-area-inset-left));bottom:calc(28px + env(safe-area-inset-bottom));width:${STICK_R * 2}px;height:${STICK_R * 2}px;border-radius:50%;border:2px dashed rgba(255,255,255,.18);pointer-events:none;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);font-size:9px;opacity:var(--op)}
#tc-hint.custom{bottom:auto;transform:translate(-50%,-50%)}

.tc-btn{position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;color:#e8e8ea;background:rgba(24,26,32,.72);border:2px solid rgba(255,255,255,.2);box-shadow:inset 0 -3px 0 rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.45);transition:transform .05s,background .05s;opacity:var(--op)}
.tc-btn.on{background:rgba(70,76,90,.85)}
.tc-face,#tc-r2{transform:translate(-50%,-50%) scale(var(--s,1))}
.tc-face.on,#tc-r2.on{transform:translate(-50%,-50%) scale(calc(var(--s,1)*.92))}
.tc-pill.on{transform:scale(.95)}
.tc-btn.hide{display:none}
.tc-btn svg{width:46%;height:46%;fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;overflow:visible}
.tc-cap{position:absolute;top:100%;margin-top:3px;font-size:6px;color:rgba(255,255,255,.75);text-shadow:0 1px 2px #000;white-space:nowrap}

#tc-pad{position:absolute;width:0;height:0;right:calc(var(--b)*1.4 + 28px + env(safe-area-inset-right));bottom:calc(var(--b)*1.5 + 26px + env(safe-area-inset-bottom))}
.tc-face{width:var(--b);height:var(--b);border-radius:50%}
#tc-pad #tc-triangle{left:0;top:calc(var(--d)*-1)}
#tc-pad #tc-circle{left:var(--d);top:0}
#tc-pad #tc-cross{left:0;top:var(--d)}
#tc-pad #tc-square{left:calc(var(--d)*-1);top:0}
#tc-pad #tc-r2{left:calc(var(--b)*1.2);top:calc(var(--b)*-1.45)}
#tc-cross{width:calc(var(--b)*1.15);height:calc(var(--b)*1.15)}
#tc-triangle svg{stroke:#3fdcb0}
#tc-circle svg{stroke:#ff5f6f}
#tc-cross svg{stroke:#7fa9ff}
#tc-square svg{stroke:#f08ad2}
#tc-r2{width:calc(var(--b)*1.1);height:max(44px,calc(var(--b)*.62));border-radius:10px 10px 8px 8px;font-size:11px}

.tc-pill{height:44px;min-width:64px;padding:0 10px;border-radius:22px;top:calc(8px + env(safe-area-inset-top));font-size:6px;letter-spacing:1px}
#tc-share{left:calc(8px + env(safe-area-inset-left))}
#tc-options{left:calc(84px + env(safe-area-inset-left))}
#tc-layout{left:calc(8px + env(safe-area-inset-left))}
#tc[data-mode=paused] #tc-layout{left:calc(160px + env(safe-area-inset-left))}
#tc-full{right:calc(8px + env(safe-area-inset-right))}

/* ── layout editor ── */
#tc.editing{pointer-events:auto;background:rgba(0,0,0,.45)}
#tc.editing #tc-zone,#tc.editing .tc-pill{display:none !important}
#tc.editing .tc-btn.hide{display:flex}
#tc.editing #tc-hint{pointer-events:auto;display:flex !important;border-color:rgba(255,255,255,.6);color:#fff}
#tc.editing .sel{outline:3px solid #fde047;outline-offset:4px}
#tc-hint.sel{border-radius:50%}
#tc-ed{display:none;position:absolute;left:50%;top:calc(6px + env(safe-area-inset-top));transform:translateX(-50%);pointer-events:auto;flex-direction:column;align-items:center;gap:6px;background:rgba(10,12,16,.92);border:2px solid #fde047;border-radius:10px;padding:8px 10px;color:#fff;font-size:7px;max-width:calc(100vw - 16px)}
#tc.editing #tc-ed{display:flex}
#tc-ed .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center}
#tc-ed button{font:inherit;color:#fff;background:#23262d;border:2px solid rgba(255,255,255,.3);border-radius:8px;min-height:40px;min-width:40px;padding:0 10px}
#tc-ed button.done{background:#166534;border-color:#22c55e}
#tc-ed .val{min-width:40px;text-align:center;color:#fde047}

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
let editing = false;
const btnEls = {};
let root, pad, hint, base, knob, ed;

// layout: { opacity, stick:{x,y,s,fixed}, controls:{id:{x,y,s}} } — x/y are viewport fractions
let layout = loadLayout();

function loadLayout() {
  try { const v = JSON.parse(localStorage.getItem(LAYOUT_KEY)); if (v && typeof v === 'object') return v; }
  catch { /* storage blocked or corrupt — use defaults */ }
  return {};
}
function saveLayout() {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /* not persisted */ }
}

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

  root = document.createElement('div');
  root.id = 'tc';
  root.innerHTML = '<div id="tc-zone"></div><div id="tc-hint">L3</div><div id="tc-base"></div><div id="tc-knob"></div><div id="tc-pad"></div>';
  document.body.appendChild(root);
  pad = root.querySelector('#tc-pad');
  hint = root.querySelector('#tc-hint');
  base = root.querySelector('#tc-base');
  knob = root.querySelector('#tc-knob');
  // Block page scroll, pinch-zoom and double-tap zoom everywhere.
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault());
  addEventListener('contextmenu', e => e.preventDefault());
  setupAutoFullscreen();

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
      if (editing) return;
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
    (MOVABLE.includes(def.id) ? pad : root).appendChild(b);
    btnEls[def.id] = { el: b, cap, def };
    if (MOVABLE.includes(def.id)) makeDraggable(b, def.id);
  }
  makeDraggable(hint, 'stick');

  const lay = document.createElement('div');
  lay.id = 'tc-layout';
  lay.className = 'tc-btn tc-pill';
  lay.textContent = 'LAYOUT';
  lay.addEventListener('click', () => setEditing(true));
  root.appendChild(lay);

  if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
    const fs = document.createElement('div');
    fs.id = 'tc-full';
    fs.className = 'tc-btn tc-pill';
    fs.textContent = 'FULL';
    // Fullscreen needs a completed tap (click), not just a touch start.
    fs.addEventListener('click', toggleFullscreen);
    root.appendChild(fs);
  }

  buildEditor();
  applyLayout();
  applyMode();
  addEventListener('resize', applyLayout);

  // ── Joystick (floating, or fixed at the player's chosen spot) ───────────────
  const zone = root.querySelector('#tc-zone');
  let pid = null, ox = 0, oy = 0;
  const radius = () => STICK_R * (layout.stick?.s ?? 1);

  const move = e => {
    const R = radius();
    let x = e.clientX - ox, y = e.clientY - oy;
    const d = Math.hypot(x, y);
    if (d > R) { x *= R / d; y *= R / d; }
    knob.style.left = ox + x + 'px';
    knob.style.top = oy + y + 'px';
    if (Math.min(d, R) / R < DEADZONE) { stick.dx = 0; stick.dy = 0; }
    else { stick.dx = x / R; stick.dy = y / R; }
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
    if (pid !== null || editing) return;
    pid = e.pointerId;
    zone.setPointerCapture?.(pid);
    if (layout.stick?.fixed) {
      const r = hint.getBoundingClientRect();
      ox = r.left + r.width / 2; oy = r.top + r.height / 2;
    } else { ox = e.clientX; oy = e.clientY; }
    const R = radius();
    base.style.width = base.style.height = R * 2 + 'px';
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
  if (!root) return;
  root.dataset.mode = mode;
  for (const { el, cap, def } of Object.values(btnEls)) {
    el.classList.toggle('hide', !def.code[mode]);
    cap.textContent = (editing ? def.cap.play : def.cap[mode]) ?? '';
  }
  root.querySelector('#tc-layout')?.classList.toggle('hide', mode === 'play');
}

// ── Layout ────────────────────────────────────────────────────────────────────
function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
}

// Freeze the current on-screen positions into the layout so they can be dragged.
function snapshotLayout() {
  layout.controls ??= {};
  for (const id of MOVABLE) {
    if (!layout.controls[id]) layout.controls[id] = { ...centerOf(btnEls[id].el), s: 1 };
  }
  if (!layout.stick || layout.stick.x == null) {
    layout.stick = { ...centerOf(hint), s: layout.stick?.s ?? 1, fixed: !!layout.stick?.fixed };
  }
}

function applyLayout() {
  if (!root) return;
  root.style.setProperty('--op', layout.opacity ?? 1);
  for (const id of MOVABLE) {
    const el = btnEls[id].el, c = layout.controls?.[id];
    if (c) {
      if (el.parentNode !== root) root.appendChild(el);
      el.style.left = c.x * innerWidth + 'px';
      el.style.top = c.y * innerHeight + 'px';
      el.style.setProperty('--s', c.s);
    } else {
      if (el.parentNode !== pad) pad.appendChild(el);
      el.style.left = el.style.top = '';
      el.style.removeProperty('--s');
    }
  }
  const st = layout.stick;
  const size = STICK_R * 2 * (st?.s ?? 1) + 'px';
  hint.style.width = hint.style.height = size;
  if (st?.x != null) {
    hint.classList.add('custom');
    hint.style.left = st.x * innerWidth + 'px';
    hint.style.top = st.y * innerHeight + 'px';
  } else {
    hint.classList.remove('custom');
    hint.style.left = hint.style.top = '';
  }
  updateEditorValues();
}

let selected = 'cross';
function select(id) {
  selected = id;
  for (const id2 of MOVABLE) btnEls[id2].el.classList.toggle('sel', id2 === id);
  hint.classList.toggle('sel', id === 'stick');
  updateEditorValues();
}
const entry = id => (id === 'stick' ? layout.stick : layout.controls[id]);

function makeDraggable(el, id) {
  let drag = null;
  el.addEventListener('pointerdown', e => {
    if (!editing) return;
    e.preventDefault(); e.stopPropagation();
    select(id);
    el.setPointerCapture?.(e.pointerId);
    const c = entry(id);
    drag = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, x: c.x * innerWidth, y: c.y * innerHeight };
  });
  el.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    const m = 24;
    const x = Math.min(innerWidth - m, Math.max(m, drag.x + e.clientX - drag.sx));
    const y = Math.min(innerHeight - m, Math.max(m, drag.y + e.clientY - drag.sy));
    const c = entry(id);
    c.x = x / innerWidth; c.y = y / innerHeight;
    applyLayout();
  });
  const stop = e => { if (drag && e.pointerId === drag.pid) { drag = null; saveLayout(); } };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
}

function buildEditor() {
  ed = document.createElement('div');
  ed.id = 'tc-ed';
  ed.innerHTML = `
    <div>DRAG TO MOVE · TAP TO SELECT</div>
    <div class="row">
      <span>SIZE</span><button data-a="size-">−</button><span class="val" data-v="size"></span><button data-a="size+">+</button>
      <span>OPACITY</span><button data-a="op-">−</button><span class="val" data-v="op"></span><button data-a="op+">+</button>
    </div>
    <div class="row">
      <button data-a="stick" data-v="stick"></button>
      <button data-a="reset">RESET</button>
      <button data-a="done" class="done">DONE</button>
    </div>`;
  ed.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a;
    if (!a) return;
    const clamp = (v, lo, hi) => Math.round(Math.min(hi, Math.max(lo, v)) * 10) / 10;
    if (a === 'size-' || a === 'size+') {
      const c = entry(selected);
      c.s = clamp((c.s ?? 1) + (a === 'size+' ? SIZE_STEP : -SIZE_STEP), SIZE_MIN, SIZE_MAX);
    } else if (a === 'op-' || a === 'op+') {
      layout.opacity = clamp((layout.opacity ?? 1) + (a === 'op+' ? OP_STEP : -OP_STEP), OP_MIN, 1);
    } else if (a === 'stick') {
      layout.stick.fixed = !layout.stick.fixed;
    } else if (a === 'reset') {
      layout = {};
      applyLayout();
      snapshotLayout();
    } else if (a === 'done') {
      setEditing(false);
      return;
    }
    applyLayout();
    saveLayout();
  });
  root.appendChild(ed);
}

function updateEditorValues() {
  if (!ed) return;
  const c = selected === 'stick' ? layout.stick : layout.controls?.[selected];
  ed.querySelector('[data-v=size]').textContent = Math.round((c?.s ?? 1) * 100) + '%';
  ed.querySelector('[data-v=op]').textContent = Math.round((layout.opacity ?? 1) * 100) + '%';
  ed.querySelector('[data-v=stick]').textContent = 'STICK: ' + (layout.stick?.fixed ? 'FIXED' : 'FLOATING');
}

function setEditing(on) {
  editing = on;
  // Toggle the class first: editing reveals mode-hidden buttons so they can be measured.
  root.classList.toggle('editing', on);
  if (on) { snapshotLayout(); applyLayout(); select(selected); }
  if (!on) saveLayout();
  applyMode();
}

// ── Fullscreen ────────────────────────────────────────────────────────────────
// Go fullscreen on the first completed tap (browsers only allow it from a user
// gesture). If the player leaves fullscreen we don't force it again; FULL toggles.
// iPhone Safari has no element fullscreen, so this quietly does nothing there.
function setupAutoFullscreen() {
  const d = document;
  if (!(d.fullscreenEnabled || d.webkitFullscreenEnabled)) return;
  const once = e => {
    if (e.target.closest?.('#tc-full,#tc-ed,#tc-layout')) return;
    d.removeEventListener('click', once, true);
    d.removeEventListener('touchend', once, true);
    if (!(d.fullscreenElement || d.webkitFullscreenElement)) toggleFullscreen();
  };
  d.addEventListener('click', once, true);
  d.addEventListener('touchend', once, true);
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
