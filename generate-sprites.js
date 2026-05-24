#!/usr/bin/env node
// generate-sprites.js — render PNG sprite sheets for all Naija 5s teams
// Output: public/sprites/team-{0..6}.png  +  public/sprites/ball.png
// Sheet layout per team: 7 cols × 2 rows
//   Cols: run0  run1  run2  run3  kick  celebrate  dive
//   Row 0: field player   |   Row 1: GK

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Layout constants ──────────────────────────────────────────────────────────
const SP      = 4;   // pixels per sprite dot
const FRAME_W = 56;  // px per frame (dive spans ±7 dots = 56px)
const FRAME_H = 80;  // px per frame (GK top at -8 dots = 32px above origin, shadow at +7)
const OX      = 28;  // origin x within frame (7 dots from left)
const OY      = 40;  // origin y within frame (10 dots from top)
const COLS    = 7;   // run0..3, kick, celebrate, dive
const ROWS    = 2;   // 0 = field player, 1 = GK

const W = FRAME_W * COLS;  // 392
const H = FRAME_H * ROWS;  // 160

// ── Mini canvas (RGBA pixel buffer) ──────────────────────────────────────────
class Canvas {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.data = new Uint8Array(w * h * 4); // zero = transparent
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (a >= 255) {
      this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255;
    } else {
      const sa = a / 255, da = this.data[i + 3] / 255, oa = sa + da * (1 - sa);
      if (oa < 0.001) return;
      this.data[i]     = Math.round((r * sa + this.data[i]     * da * (1 - sa)) / oa);
      this.data[i + 1] = Math.round((g * sa + this.data[i + 1] * da * (1 - sa)) / oa);
      this.data[i + 2] = Math.round((b * sa + this.data[i + 2] * da * (1 - sa)) / oa);
      this.data[i + 3] = Math.round(oa * 255);
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = Math.floor(y); py < Math.floor(y + h); py++)
      for (let px = Math.floor(x); px < Math.floor(x + w); px++)
        this.setPixel(px, py, r, g, b, a);
  }
}

// ── PNG encoder (spec-compliant: sig + IHDR + IDAT + IEND) ───────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return c ^ -1;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const crcBuf  = Buffer.alloc(4); crcBuf.writeInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(cv) {
  const { w, h, data } = cv;
  // Raw pixel rows: filter_byte (0) + RGBA × width
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4, di = y * (1 + w * 4) + 1 + x * 4;
      raw[di] = data[si]; raw[di + 1] = data[si + 1]; raw[di + 2] = data[si + 2]; raw[di + 3] = data[si + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Hex color parser ──────────────────────────────────────────────────────────
function hex(str) {
  let h = str.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

// ── Sprite drawing (mirrors game's drawPlayer logic) ─────────────────────────
const FL_X = [1, 2, 1, 0], BL_X = [-1, -2, -1, 0];
const FL_Y = [0, -1, 0, 1], BL_Y = [0, 1, 0, -1];

function dot(cv, ox, oy, rx, ry, col, a = 255) {
  const [r, g, b] = Array.isArray(col) ? col : hex(col);
  cv.fillRect(ox + rx * SP, oy + ry * SP, SP, SP, r, g, b, a);
}

function drawPlayer(cv, ox, oy, tc, frame, state, d, tall = false) {
  const bodyTop = tall ? -5 : -3, headOff = tall ? 2 : 0;
  const glove   = tc.gloves ?? '#ffffff';
  const gloveCol = tall ? glove : tc.skin;
  const D = (rx, ry, col, a) => dot(cv, ox, oy, rx, ry, col, a);

  // Soft shadow
  for (let rx = -3; rx <= 3; rx++) D(rx, 7, '#000000', 70);

  if (state === 'dive') {
    for (let rx = -4; rx <= 3; rx++) D(rx, -1, tc.shirt);
    D(-5, -1, tc.shorts); D(-6, -1, tc.shorts); D(-7, 0, '#111111');
    D(4, 0, gloveCol); D(5, 0, gloveCol); D(5, -1, gloveCol);
    D(-2, -3, tc.hair); D(-3, -3, tc.hair);
    D(-2, -2, tc.skin); D(-3, -2, tc.skin); D(-4, -2, tc.skin);
    return;
  }

  if (state === 'kick') {
    for (let ry = bodyTop; ry <= 0; ry++) { D(0, ry, tc.shirt); D(-d, ry, tc.shirt); }
    D(0, 1, tc.shorts); D(-d, 2, tc.shorts); D(-d, 3, tc.shorts); D(-d * 2, 4, '#111111');
    D(d, 1, tc.shorts); D(d * 2, 0, tc.shorts); D(d * 3, 1, '#111111');
    D(-d * 2, -2 - headOff, gloveCol); D(-d * 2, -1 - headOff, gloveCol);
    D(d * 2, -3 - headOff, gloveCol);
    D(d, -6 - headOff, tc.hair); D(d * 2, -6 - headOff, tc.hair);
    D(d, -5 - headOff, tc.skin); D(d * 2, -5 - headOff, tc.skin); D(d * 3, -5 - headOff, tc.skin);
    D(d, -4 - headOff, tc.skin); D(d * 2, -4 - headOff, tc.skin);
    return;
  }

  if (state === 'celebrate') {
    for (let ry = bodyTop; ry <= 0; ry++) { D(0, ry, tc.shirt); D(d, ry, tc.shirt); }
    D(0, 1, tc.shorts); D(-d, 2, tc.shorts); D(-d, 3, tc.shorts); D(-d, 4, '#111111');
    D(d, 2, tc.shorts); D(d, 3, tc.shorts); D(d, 4, '#111111');
    D(-d * 2, -4 - headOff, gloveCol); D(-d * 2, -3 - headOff, gloveCol);
    D(d * 2, -4 - headOff, gloveCol); D(d * 2, -3 - headOff, gloveCol);
    D(d, -6 - headOff, tc.hair); D(d * 2, -6 - headOff, tc.hair);
    D(d, -5 - headOff, tc.skin); D(d * 2, -5 - headOff, tc.skin); D(d * 3, -5 - headOff, tc.skin);
    D(d, -4 - headOff, tc.skin); D(d * 2, -4 - headOff, tc.skin);
    return;
  }

  // run / walk
  const flx = FL_X[frame] * d, fly = FL_Y[frame];
  const blx = BL_X[frame] * d, bly = BL_Y[frame];
  const as  = [0, 1, 0, -1][frame];

  D(-d * 2 + as * d, -2 - headOff, gloveCol); D(-d * 2 + as * d, -1 - headOff, gloveCol);
  D(blx, 2 + bly, tc.shorts); D(blx, 3 + bly, tc.shorts); D(blx - d, 4 + bly, '#111111');
  for (let ry = bodyTop; ry <= 0; ry++) { D(0, ry, tc.shirt); D(-d, ry, tc.shirt); }
  D(0, 1, tc.shorts);
  D(flx, 2 + fly, tc.shorts); D(flx, 3 + fly, tc.shorts); D(flx + d, 4 + fly, '#111111');
  D(d * 2 - as * d, -2 - headOff, gloveCol); D(d * 2 - as * d, -1 - headOff, gloveCol);
  D(d, -6 - headOff, tc.hair); D(d * 2, -6 - headOff, tc.hair);
  D(d, -5 - headOff, tc.skin); D(d * 2, -5 - headOff, tc.skin); D(d * 3, -5 - headOff, tc.skin);
  D(d, -4 - headOff, tc.skin); D(d * 2, -4 - headOff, tc.skin);
}

// ── Team sprite sheet generator ───────────────────────────────────────────────
function generateTeamSheet(tc) {
  const cv = new Canvas(W, H);
  const states = ['run', 'run', 'run', 'run', 'kick', 'celebrate', 'dive'];
  const frames  = [0,     1,     2,     3,     0,      0,           0    ];

  for (let row = 0; row < ROWS; row++) {
    const isGK   = row === 1;
    const colors = isGK ? { ...tc, shirt: tc.gkShirt } : tc;
    for (let col = 0; col < COLS; col++) {
      drawPlayer(cv, col * FRAME_W + OX, row * FRAME_H + OY,
                 colors, frames[col], states[col], 1, isGK);
    }
  }
  return encodePNG(cv);
}

// ── Ball sprite ───────────────────────────────────────────────────────────────
function generateBallSheet() {
  const SIZE = 24, cx = 12, cy = 12, R = 5;
  const cv = new Canvas(SIZE, SIZE);

  // Body
  for (let y = -R; y <= R; y++)
    for (let x = -R; x <= R; x++)
      if (x * x + y * y <= R * R)
        cv.setPixel(cx + x, cy + y, 255, 215, 0);

  // Panel seams
  cv.setPixel(cx,     cy,     122, 71, 0);
  cv.setPixel(cx + 2, cy - 1, 168, 98, 0);
  cv.setPixel(cx - R + 1, cy, 168, 98, 0);
  cv.setPixel(cx + 1, cy + 2, 168, 98, 0);
  cv.setPixel(cx - 1, cy + R - 1, 122, 71, 0);

  // Specular highlight
  cv.setPixel(cx + 1, cy - R + 2, 255, 255, 200);
  cv.setPixel(cx + 2, cy - R + 2, 255, 248, 180);

  return encodePNG(cv);
}

// ── Team definitions (colours from game.config.js) ────────────────────────────
const ALL_TEAMS = [
  { id: 0, name: 'NAIJA',        colors: { shirt: '#16a34a', shorts: '#ffffff', skin: '#a06b3f', hair: '#1a0e08', gkShirt: '#f59e0b', gloves: '#ffffff' } },
  { id: 1, name: 'WARRI FC',     colors: { shirt: '#dc2626', shorts: '#111111', skin: '#c8956c', hair: '#2a1408', gkShirt: '#7c3aed', gloves: '#fbbf24' } },
  { id: 2, name: 'LAGOS KINGS',  colors: { shirt: '#1d4ed8', shorts: '#854d0e', skin: '#a06b3f', hair: '#1a0e08', gkShirt: '#f59e0b', gloves: '#ffffff' } },
  { id: 3, name: 'ABUJA EAGLES', colors: { shirt: '#1e3a5f', shorts: '#ffffff', skin: '#b5703a', hair: '#1a0e08', gkShirt: '#dc2626', gloves: '#ffffff' } },
  { id: 4, name: 'KANO STARS',   colors: { shirt: '#ca8a04', shorts: '#1c1917', skin: '#c8956c', hair: '#1a0e08', gkShirt: '#7c3aed', gloves: '#ffffff' } },
  { id: 5, name: 'RIVERS ROVERS',colors: { shirt: '#c2410c', shorts: '#1c1917', skin: '#a06b3f', hair: '#1a0e08', gkShirt: '#16a34a', gloves: '#ffffff' } },
  { id: 6, name: 'ENUGU FC',     colors: { shirt: '#7c3aed', shorts: '#ffffff', skin: '#a06b3f', hair: '#1a0e08', gkShirt: '#f59e0b', gloves: '#ffffff' } },
];

// ── Run ───────────────────────────────────────────────────────────────────────
const outDir = join(__dir, 'public', 'sprites');
mkdirSync(outDir, { recursive: true });

for (const team of ALL_TEAMS) {
  const png  = generateTeamSheet(team.colors);
  const file = join(outDir, `team-${team.id}.png`);
  writeFileSync(file, png);
  console.log(`  ✓  ${team.name.padEnd(14)} → team-${team.id}.png  (${W}×${H})`);
}

writeFileSync(join(outDir, 'ball.png'), generateBallSheet());
console.log(`  ✓  ball           → ball.png  (24×24)`);

console.log();
console.log(`Sheet layout — ${COLS} cols × ${ROWS} rows, ${FRAME_W}×${FRAME_H}px per frame`);
console.log(`  Cols: run0  run1  run2  run3  kick  celebrate  dive`);
console.log(`  Row 0: field player   |   Row 1: GK`);
console.log(`  Origin within frame: (${OX}, ${OY})  —  SP=${SP}px per dot`);
