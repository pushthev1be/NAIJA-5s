#!/usr/bin/env node
// Generate the commentary duo's voice clips with ElevenLabs (run once, locally).
//
//   1. Put these in .env (never committed):
//        ELEVENLABS_API_KEY=...
//        ELEVEN_VOICE_MIKE=<voice id>      hype play-by-play voice
//        ELEVEN_VOICE_BAYO=<voice id>      calmer analyst voice
//        ELEVEN_MODEL=eleven_multilingual_v2   (optional)
//   2. npm run voices                 → writes public/commentary/<id>.mp3 + manifest.json
//      npm run voices -- --force      → regenerate clips that already exist
//      npm run voices -- --only goal_burst,save_brick
//      npm run voices -- --manifest-only   → just re-index the folder (e.g. after
//                                             dropping in your own recordings named <id>.mp3)
//      npm run voices -- --dry-run         → list what would be generated and the credit cost
//                                             (ElevenLabs charges ~1 credit per character)
//
// The game only plays clips listed in manifest.json, so missing ones fall back to text.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ALL_LINES, LINES } from '../commentary.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'commentary');
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const only = (args.find(a => a.startsWith('--only=')) ?? (args.includes('--only') ? '--only=' + args[args.indexOf('--only') + 1] : ''))
  .replace('--only=', '').split(',').filter(Boolean);

// Minimal .env loader so this works on any Node version
const envFile = join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

mkdirSync(OUT, { recursive: true });

function writeManifest() {
  const clips = readdirSync(OUT).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ clips }, null, 2) + '\n');
  const known = new Set(ALL_LINES.map(l => l.id));
  const missing = [...known].filter(id => !clips.includes(id));
  console.log(`manifest: ${clips.length} clips` + (missing.length ? `, ${missing.length} lines still text-only` : ', every line voiced'));
}

if (flag('--manifest-only')) { writeManifest(); process.exit(0); }

const todo = ALL_LINES.filter(l => (!only.length || only.includes(l.id)) && (flag('--force') || !existsSync(join(OUT, `${l.id}.mp3`))));
if (flag('--dry-run')) {
  const byEvent = {};
  for (const [ev, lines] of Object.entries(LINES)) byEvent[ev] = lines.flatMap(l => (l.reply ? [l, l.reply] : [l])).length;
  console.log('lines per situation:', byEvent);
  console.log(`${todo.length} clips to generate, ${todo.reduce((n, l) => n + l.say.length, 0)} characters ≈ credits`);
  process.exit(0);
}

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICES = { mike: process.env.ELEVEN_VOICE_MIKE, bayo: process.env.ELEVEN_VOICE_BAYO };
const MODEL = process.env.ELEVEN_MODEL || 'eleven_multilingual_v2';
if (!KEY || !VOICES.mike || !VOICES.bayo) {
  console.error('Set ELEVENLABS_API_KEY, ELEVEN_VOICE_MIKE and ELEVEN_VOICE_BAYO in .env (see the top of this file).');
  process.exit(1);
}

// Mike is loud and expressive; Bayo is steadier.
const SETTINGS = {
  mike: { stability: 0.3, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true },
  bayo: { stability: 0.6, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
};

async function tts(line, attempt = 1) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[line.who]}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: line.say, model_id: MODEL, voice_settings: SETTINGS[line.who] }),
  });
  if (res.status === 429 && attempt < 5) {          // rate limited: back off and retry
    await new Promise(r => setTimeout(r, 2000 * attempt));
    return tts(line, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

let made = 0, failed = 0;
const skipped = ALL_LINES.length - todo.length;
for (const line of todo) {
  const file = join(OUT, `${line.id}.mp3`);
  try {
    writeFileSync(file, await tts(line));
    made++;
    console.log(`✓ ${line.id.padEnd(16)} ${line.who}: ${line.say}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${line.id}: ${e.message}`);
  }
}
console.log(`\n${made} generated, ${skipped} skipped, ${failed} failed`);
writeManifest();
