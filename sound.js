// ── Naija 5s — Procedural Audio Engine (Web Audio API) ───────────────────────

// ── lazy AudioContext — created on first use after a user gesture ─────────────
let _AC = null;
function AC() {
  if (!_AC) _AC = new (window.AudioContext || window.webkitAudioContext)();
  return _AC;
}
function resume() {
  const ctx = AC();
  if (ctx.state === 'suspended') ctx.resume();
}

// ── primitives ────────────────────────────────────────────────────────────────
function osc(freq, type, dur, vol, t0, attack = 0.004) {
  resume();
  const ctx = AC();
  if (t0 === undefined) t0 = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.01);
  return { o, g };
}

function noise(dur, vol, filterFreq = 1200, q = 1.2, t0) {
  resume();
  const ctx = AC();
  if (t0 === undefined) t0 = ctx.currentTime;
  const sz = Math.ceil(ctx.sampleRate * Math.min(dur + 0.05, 3));
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = filterFreq; filt.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt); filt.connect(g); g.connect(ctx.destination);
  src.start(t0); src.stop(t0 + dur + 0.01);
}

// ── RETRO MUSIC ───────────────────────────────────────────────────────────────
const retroAudio = new Audio('/retro.mp3');
retroAudio.loop = true;
retroAudio.volume = 0.52;
let _retroFadeTimer = null;
let _retroUnlocked = false;

// Start music on first user gesture (browser autoplay policy)
const _tryStart = () => {
  if (_retroUnlocked) return;
  _retroUnlocked = true;
  retroAudio.play().catch(() => {});
};
document.addEventListener('click',       _tryStart);
document.addEventListener('keydown',     _tryStart);
document.addEventListener('pointerdown', _tryStart);

export function playRetroMusic() {
  if (_retroFadeTimer) { clearInterval(_retroFadeTimer); _retroFadeTimer = null; }
  retroAudio.volume = 0;
  retroAudio.play().catch(() => {});
  // Fade in over 500ms
  const target = 0.52, steps = 25, interval = 20;
  let step = 0;
  _retroFadeTimer = setInterval(() => {
    step++;
    retroAudio.volume = Math.min(target, target * (step / steps));
    if (step >= steps) { clearInterval(_retroFadeTimer); _retroFadeTimer = null; }
  }, interval);
}

export function stopRetroMusic() {
  if (retroAudio.paused) return;
  if (_retroFadeTimer) { clearInterval(_retroFadeTimer); _retroFadeTimer = null; }
  const startVol = retroAudio.volume, steps = 20, interval = 20;
  let step = 0;
  _retroFadeTimer = setInterval(() => {
    step++;
    retroAudio.volume = Math.max(0, startVol * (1 - step / steps));
    if (step >= steps) {
      clearInterval(_retroFadeTimer); _retroFadeTimer = null;
      retroAudio.pause(); retroAudio.currentTime = 0; retroAudio.volume = 0.52;
    }
  }, interval);
}

// ── WHISTLE ────────────────────────────────────────────────────────────────────
export function sndWhistle() {
  resume();
  const ctx = AC(), t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(2820, t);
  o.frequency.setValueAtTime(2960, t + 0.07);
  o.frequency.setValueAtTime(2740, t + 0.17);
  o.frequency.setValueAtTime(2880, t + 0.27);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.58, t + 0.008);
  g.gain.setValueAtTime(0.58, t + 0.28);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
  o.start(t); o.stop(t + 0.50);
  noise(0.32, 0.10, 3400, 9, t);
}

// ── unlock (also called on keydown / gamepad connect) ────────────────────────
export function unlockAudio() { resume(); }

// ── BALL HIT — wall / post bounce ────────────────────────────────────────────
export function sndBallHit(speed = 3) {
  const v = Math.min(0.52, 0.10 + speed * 0.055);
  osc(165, 'sine', 0.08, v * 0.85, undefined, 0.002);
  noise(0.065, v * 0.38, 780, 2.2);
}

// ── KICK SHOTS ────────────────────────────────────────────────────────────────
export function sndBoom() {
  const ctx = AC(), t = ctx.currentTime;
  osc(82, 'sine', 0.22, 0.78, t, 0.002);
  osc(215, 'square', 0.07, 0.20, t, 0.001);
  noise(0.14, 0.45, 1900, 1.4, t);
}

export function sndNiceShot() {
  const ctx = AC(), t = ctx.currentTime;
  osc(128, 'sine', 0.13, 0.44, t, 0.003);
  noise(0.09, 0.26, 1300, 1.2, t);
}

export function sndTap() {
  const ctx = AC(), t = ctx.currentTime;
  osc(235, 'sine', 0.06, 0.27, t, 0.002);
  noise(0.045, 0.15, 2100, 1, t);
}

// ── CROWD ─────────────────────────────────────────────────────────────────────
let crowdSrc = null, crowdGain = null, crowdFilt = null;
let crowdLocked = false;

export function startCrowd() {
  if (crowdSrc || crowdLocked) return;
  crowdLocked = true;
  resume();
  const ctx = AC();
  const sec = 4;
  const sz = Math.ceil(ctx.sampleRate * sec);

  function makeLayer(filterFreq, q, gain) {
    const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = filterFreq; filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filt); filt.connect(g); g.connect(ctx.destination);
    src.start(); src.loopStart = Math.random() * sec;
    return { src, filt, g };
  }

  const a = makeLayer(480, 0.6, 0.055);
  makeLayer(720, 0.4, 0.028);

  crowdSrc = a.src; crowdFilt = a.filt; crowdGain = a.g;

  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  lfo.frequency.value = 0.22; lfoG.gain.value = 0.018;
  lfo.connect(lfoG); lfoG.connect(crowdGain.gain);
  lfo.start();
}

export function setCrowdLevel(level, tau = 0.55) {
  if (!crowdGain || !crowdFilt) return;
  const ctx = AC();
  crowdGain.gain.setTargetAtTime(0.035 + level * 0.32, ctx.currentTime, tau);
  crowdFilt.frequency.setTargetAtTime(380 + level * 1600, ctx.currentTime, tau);
}

export function crowdRoar(holdMs = 2800) {
  setCrowdLevel(1.0, 0.04);
  setTimeout(() => setCrowdLevel(0.12, 0.9), holdMs);
}

let _lastCrowdTick = 0;
export function tickCrowd(bx, PX, PW, phase) {
  if (phase !== 'play') return;
  const now = Date.now();
  if (now - _lastCrowdTick < 180) return;
  _lastCrowdTick = now;
  const nearGoal = Math.min(bx - PX, (PX + PW) - bx);
  let level;
  if      (nearGoal < 38)  level = 0.62;
  else if (nearGoal < 90)  level = 0.36;
  else if (nearGoal < 175) level = 0.20;
  else                     level = 0.10;
  setCrowdLevel(level, 0.5);
}

// ── GOAL ─────────────────────────────────────────────────────────────────────
export function sndGoal() {
  const ctx = AC(), t = ctx.currentTime;
  const horn = ctx.createOscillator(), hG = ctx.createGain();
  horn.connect(hG); hG.connect(ctx.destination);
  horn.type = 'sawtooth';
  horn.frequency.setValueAtTime(208, t);
  horn.frequency.exponentialRampToValueAtTime(268, t + 0.13);
  horn.frequency.setValueAtTime(228, t + 0.13);
  horn.frequency.exponentialRampToValueAtTime(292, t + 0.54);
  hG.gain.setValueAtTime(0, t);
  hG.gain.linearRampToValueAtTime(0.50, t + 0.014);
  hG.gain.setValueAtTime(0.50, t + 0.50);
  hG.gain.exponentialRampToValueAtTime(0.0001, t + 0.80);
  horn.start(t); horn.stop(t + 0.83);

  [131, 165, 196, 262].forEach((f, i) => {
    osc(f, 'triangle', 0.36, 0.27, t + i * 0.10, 0.008);
  });

  noise(0.55, 0.38, 700, 0.55, t);
  crowdRoar(3200);
}

// ── NET BOOM — power shot / fireball goal ────────────────────────────────────
export function sndNetBoom() {
  const ctx = AC(), t = ctx.currentTime;

  const sub = ctx.createOscillator(), sG = ctx.createGain();
  sub.connect(sG); sG.connect(ctx.destination);
  sub.type = 'sine';
  sub.frequency.setValueAtTime(92, t);
  sub.frequency.exponentialRampToValueAtTime(26, t + 0.40);
  sG.gain.setValueAtTime(0.92, t);
  sG.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  sub.start(t); sub.stop(t + 0.44);

  noise(0.052, 0.68, 4200, 3.8, t);

  const net = ctx.createOscillator(), nG = ctx.createGain();
  net.connect(nG); nG.connect(ctx.destination);
  net.type = 'sine';
  net.frequency.setValueAtTime(420, t);
  net.frequency.exponentialRampToValueAtTime(105, t + 0.26);
  nG.gain.setValueAtTime(0.46, t);
  nG.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  net.start(t); net.stop(t + 0.30);

  setTimeout(() => sndGoal(), 125);
}
