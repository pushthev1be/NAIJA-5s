// ── AI BALANCE ADVISOR — Dev Panel ────────────────────────────────────────────
// Toggle with backtick (`) key during play.
// Gemini key auto-loaded from .env (VITE_GEMINI_KEY) — falls back to localStorage.
// CPU vs CPU test mode: let the AI self-play N matches and feed the stats here.

const GEMINI_MODEL = 'gemini-flash-latest';
const AUTO_KEY = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GEMINI_KEY ?? '') : '';

const TUNABLE = {
  'PHYSICS.ball.friction':                   { cur: 0.981, range: [0.950, 0.995], label: 'Ball Friction' },
  'PHYSICS.ball.gravity':                    { cur: 0.10,  range: [0.04,  0.22],  label: 'Ball Gravity' },
  'PHYSICS.ball.groundBounceCoeff':          { cur: 0.48,  range: [0.20,  0.72],  label: 'Ground Bounce' },
  'PHYSICS.ball.wallBounceCoeff':            { cur: 0.72,  range: [0.40,  0.90],  label: 'Wall Bounce' },
  'POWER.charge.maxVelocity':                { cur: 9.4,   range: [6.0,   14.0],  label: 'Max Shot Power' },
  'POWER.charge.chargeTime':                 { cur: 34,    range: [14,    60],    label: 'Charge Time (frames)' },
  'POWER.ai.normalShootChance':              { cur: 0.018, range: [0.004, 0.06],  label: 'AI Shoot Chance' },
  'POWER.ai.normalVelocity':                 { cur: 6.8,   range: [4.0,   11.0],  label: 'AI Shot Speed' },
  'POWER.ai.passChance':                     { cur: 0.022, range: [0.005, 0.08],  label: 'AI Pass Chance' },
  'POWER.ai.shootRange':                     { cur: 155,   range: [80,    240],   label: 'AI Shoot Range (px)' },
  'MOVEMENT.walk':                           { cur: 1.55,  range: [0.80,  2.50],  label: 'Player Walk Speed' },
  'MOVEMENT.sprint':                         { cur: 2.50,  range: [1.50,  4.00],  label: 'Player Sprint Speed' },
  'MOVEMENT.aiWalk':                         { cur: 1.55,  range: [0.80,  2.50],  label: 'AI Walk Speed' },
  'MOVEMENT.aiFarMult':                      { cur: 1.12,  range: [1.00,  1.60],  label: 'AI Sprint Multiplier' },
  'BALANCE.cpuAggressionScale':              { cur: 1.0,   range: [0.40,  2.00],  label: 'CPU Aggression Scale' },
  'BALANCE.skillCooldownScale':              { cur: 1.0,   range: [0.50,  3.00],  label: 'Skill Cooldown Scale' },
  'SKILLS.speedBoost.dribbleActivateChance': { cur: 0.007, range: [0.001, 0.030], label: 'SpeedBoost Trigger' },
  'SKILLS.powerShot.activateChance':         { cur: 0.028, range: [0.005, 0.080], label: 'PowerShot Trigger' },
  'SKILLS.steal.tackleRange':                { cur: 38,    range: [20,    70],    label: 'Steal Range (px)' },
};

let statsRef      = null;
let getScoreF     = null;
let getCpuCtrlF   = null;
let setCpuCtrlF   = null;
let panel         = null;
let cpuTestActive = false;

// CPU test cumulative across auto-played matches
const cpuLog = { games: 0, homeGoals: 0, awayGoals: 0, homePoss: 0, shots: [0, 0] };

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export function initDevPanel(devStats, getScore, getCpuMode, setCpuMode) {
  statsRef    = devStats;
  getScoreF   = getScore;
  getCpuCtrlF = getCpuMode;
  setCpuCtrlF = setCpuMode;
  buildPanel();
  setInterval(refreshStats, 800);
  addEventListener('keydown', e => { if (e.code === 'Backquote') togglePanel(); });
}

// Called by the game after each CPU test match ends (auto-restart)
export function logCpuMatch(homeGoals, awayGoals, homePossFrames, totalPossFrames, shots) {
  cpuLog.games++;
  cpuLog.homeGoals  += homeGoals;
  cpuLog.awayGoals  += awayGoals;
  cpuLog.homePoss   += totalPossFrames > 0 ? homePossFrames / totalPossFrames : 0.5;
  cpuLog.shots[0]   += shots[0];
  cpuLog.shots[1]   += shots[1];
}

// ── PANEL BUILD ───────────────────────────────────────────────────────────────
function buildPanel() {
  const style = document.createElement('style');
  style.textContent = `
    #dp{position:fixed;top:12px;right:12px;width:296px;background:rgba(6,6,16,0.97);
        border:1px solid #252535;border-radius:7px;font-family:monospace;font-size:11px;
        color:#bbb;z-index:9999;display:none;flex-direction:column;max-height:90vh;
        box-shadow:0 6px 32px rgba(0,0,0,0.8);}
    #dp-head{background:#0d0d1e;padding:9px 11px;font-weight:bold;color:#fde047;
             display:flex;justify-content:space-between;align-items:center;
             border-radius:7px 7px 0 0;user-select:none;letter-spacing:.5px;}
    #dp-head small{color:#444;font-size:9px;font-weight:normal;}
    #dp-x{cursor:pointer;color:#444;font-size:14px;line-height:1;margin-left:8px;}
    #dp-x:hover{color:#fff;}
    #dp-stats,#dp-controls{padding:10px 11px;border-bottom:1px solid #181828;}
    #dp-out{padding:10px 11px;overflow-y:auto;flex:1;min-height:60px;}
    .dpl{color:#444;font-size:9px;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px;}
    .dpr{display:flex;justify-content:space-between;margin-bottom:2px;font-size:10px;}
    .dpr b{color:#fde047;}
    .dpr.dim{color:#555;}
    #dp-key{width:100%;background:#04040e;border:1px solid #252535;color:#ccc;
            padding:5px 7px;border-radius:3px;font-family:monospace;font-size:10px;
            box-sizing:border-box;outline:none;margin-bottom:8px;}
    #dp-key:focus{border-color:#3a3a5a;}
    #dp-fb{width:100%;height:44px;resize:none;background:#04040e;border:1px solid #252535;
           color:#ccc;padding:5px 7px;border-radius:3px;font-family:monospace;
           font-size:10px;box-sizing:border-box;outline:none;margin-top:4px;}
    #dp-fb:focus{border-color:#3a3a5a;}
    .dp-row{display:flex;gap:6px;margin-top:8px;}
    .dp-btn{flex:1;background:#10213a;border:1px solid #1d4ed8;color:#93c5fd;
            padding:6px 4px;border-radius:3px;cursor:pointer;
            font-family:monospace;font-size:10px;transition:background .12s;}
    .dp-btn:hover{background:#1d4ed8;color:#fff;}
    .dp-btn:disabled{background:#080810;color:#2a2a3a;cursor:not-allowed;border-color:#181828;}
    .dp-btn.active{background:#14432a;border-color:#22c55e;color:#4ade80;}
    .dp-btn.active:hover{background:#22c55e;color:#000;}
    .dp-analysis{color:#ccc;font-size:10px;line-height:1.6;margin-bottom:9px;
                 padding:7px;background:#0b0b1c;border-radius:3px;border-left:2px solid #fde047;}
    .dp-sg{background:#080f08;border:1px solid #12301a;border-radius:3px;
           padding:7px;margin-bottom:5px;}
    .dp-sg-path{color:#4ade80;font-size:9px;margin-bottom:2px;}
    .dp-sg-val{color:#fde047;font-size:11px;font-weight:bold;margin-bottom:2px;}
    .dp-sg-why{color:#555;font-size:9px;line-height:1.4;}
    .dp-copy{display:block;width:100%;background:#0a0a1a;border:1px solid #252535;
             color:#666;padding:5px;border-radius:3px;cursor:pointer;font-size:9px;
             font-family:monospace;margin-top:7px;text-align:center;}
    .dp-copy:hover{color:#fff;border-color:#444;}
    .dp-err{color:#f87171;font-size:10px;padding:7px;background:#160808;
            border-radius:3px;border-left:2px solid #ef4444;}
    .dp-hint{color:#333;font-size:9px;text-align:center;padding:14px 8px;line-height:1.7;}
    .dp-sep{border:none;border-top:1px solid #181828;margin:8px 0;}
    #dp-cpu-log{color:#22c55e;font-size:9px;margin-top:6px;line-height:1.7;display:none;}
  `;
  document.head.appendChild(style);

  panel = document.createElement('div');
  panel.id = 'dp';
  panel.innerHTML = `
    <div id="dp-head">
      ⚙ Balance Advisor
      <small>&#96; to toggle</small>
      <div id="dp-x">✕</div>
    </div>
    <div id="dp-stats">
      <div class="dpl">Live Stats</div>
      <div id="dp-sc">—</div>
      <div id="dp-cpu-log"></div>
    </div>
    <div id="dp-controls">
      <div class="dpl">Gemini API Key <span style="color:#2a2a3a">(auto-loaded from .env)</span></div>
      <input id="dp-key" type="password" placeholder="AIza…" autocomplete="off"/>
      <div class="dpl">What feels off? <span style="color:#2a2a3a">(optional)</span></div>
      <textarea id="dp-fb" placeholder="e.g. CPU wins too often, GK never saves anything…"></textarea>
      <div class="dp-row">
        <button class="dp-btn" id="dp-analyze">Analyze ✦</button>
        <button class="dp-btn" id="dp-cpu">CPU Test ▶</button>
      </div>
    </div>
    <div id="dp-out"><div class="dp-hint">Play a match (or run CPU test)<br>then click Analyze.</div></div>
  `;
  document.body.appendChild(panel);

  document.getElementById('dp-x').onclick       = () => togglePanel(false);
  document.getElementById('dp-analyze').onclick  = runAnalysis;
  document.getElementById('dp-cpu').onclick      = toggleCpuTest;

  const keyEl = document.getElementById('dp-key');
  keyEl.value = AUTO_KEY || localStorage.getItem('n5s_gem_key') || '';
  keyEl.addEventListener('input', () => localStorage.setItem('n5s_gem_key', keyEl.value));
}

function togglePanel(force) {
  if (!panel) return;
  const show = force !== undefined ? force : panel.style.display === 'none';
  panel.style.display = show ? 'flex' : 'none';
}

// ── CPU TEST MODE ─────────────────────────────────────────────────────────────
function toggleCpuTest() {
  cpuTestActive = !cpuTestActive;
  setCpuCtrlF?.(cpuTestActive);
  const btn = document.getElementById('dp-cpu');
  if (cpuTestActive) {
    btn.textContent = 'CPU Test ■';
    btn.classList.add('active');
    document.getElementById('dp-cpu-log').style.display = 'block';
    Object.assign(cpuLog, { games: 0, homeGoals: 0, awayGoals: 0, homePoss: 0, shots: [0, 0] });
  } else {
    btn.textContent = 'CPU Test ▶';
    btn.classList.remove('active');
  }
}

// ── STATS DISPLAY ─────────────────────────────────────────────────────────────
function refreshStats() {
  if (!statsRef || !panel || panel.style.display === 'none') return;

  const sc  = getScoreF?.() ?? [0, 0];
  const tot = (statsRef.possession[0] + statsRef.possession[1]) || 1;
  const hp  = Math.round(statsRef.possession[0] / tot * 100);
  const secs= Math.round((Date.now() - statsRef.startTime) / 1000);
  const mm  = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss  = String(secs % 60).padStart(2, '0');

  document.getElementById('dp-sc').innerHTML = `
    <div class="dpr"><span>Score</span><b>${sc[0]} – ${sc[1]}</b></div>
    <div class="dpr"><span>Possession</span><b>${hp}% / ${100 - hp}%</b></div>
    <div class="dpr"><span>Shots (H/A)</span><b>${statsRef.shots[0]} / ${statsRef.shots[1]}</b></div>
    <div class="dpr dim"><span>Session</span><span>${mm}:${ss}</span></div>
  `;

  if (cpuTestActive && cpuLog.games > 0) {
    const avgH = (cpuLog.homeGoals / cpuLog.games).toFixed(1);
    const avgA = (cpuLog.awayGoals / cpuLog.games).toFixed(1);
    const avgP = Math.round(cpuLog.homePoss / cpuLog.games * 100);
    document.getElementById('dp-cpu-log').innerHTML =
      `🤖 CPU Test: ${cpuLog.games} match${cpuLog.games !== 1 ? 'es' : ''}<br>` +
      `Avg score ${avgH} – ${avgA} &nbsp;|&nbsp; Home poss ${avgP}%<br>` +
      `Total shots H${cpuLog.shots[0]} / A${cpuLog.shots[1]}`;
  }
}

// ── ANALYSIS ──────────────────────────────────────────────────────────────────
async function runAnalysis() {
  const apiKey = document.getElementById('dp-key').value.trim();
  if (!apiKey) { showOut('<div class="dp-err">No API key — check .env or paste above.</div>'); return; }

  const btn = document.getElementById('dp-analyze');
  btn.disabled = true;
  btn.textContent = 'Thinking…';

  // Build snapshot from live stats + CPU log if available
  const sc   = getScoreF?.() ?? [0, 0];
  const tot  = (statsRef.possession[0] + statsRef.possession[1]) || 1;
  const hp   = Math.round(statsRef.possession[0] / tot * 100);
  const secs = Math.round((Date.now() - statsRef.startTime) / 1000);
  const fb   = document.getElementById('dp-fb').value.trim();

  let statsSection = `CURRENT MATCH:
- Possession Home/Away: ${hp}% / ${100 - hp}%
- Shots Home/Away: ${statsRef.shots[0]} / ${statsRef.shots[1]}
- Score: ${sc[0]} – ${sc[1]}
- Session: ${secs}s`;

  if (cpuLog.games > 0) {
    const avgH = (cpuLog.homeGoals / cpuLog.games).toFixed(2);
    const avgA = (cpuLog.awayGoals / cpuLog.games).toFixed(2);
    const avgP = Math.round(cpuLog.homePoss / cpuLog.games * 100);
    statsSection += `\n\nCPU TEST (${cpuLog.games} matches):
- Avg goals per match: Home ${avgH} / Away ${avgA}
- Avg home possession: ${avgP}%
- Total shots Home/Away: ${cpuLog.shots[0]} / ${cpuLog.shots[1]}`;
  }

  const configBlock = Object.entries(TUNABLE)
    .map(([k, v]) => `  "${k}": { "current": ${v.cur}, "range": [${v.range[0]}, ${v.range[1]}] }`)
    .join(',\n');

  const prompt = `You are a game balance consultant for "Naija 5s", an 11-a-side arcade soccer game.

TUNABLE CONFIG:
{
${configBlock}
}

${statsSection}

Developer notes: "${fb || 'none'}"

Respond with ONLY valid JSON (no markdown):
{
  "analysis": "2-3 sentence diagnosis",
  "suggestions": [
    { "path": "exact.config.path", "currentValue": <number>, "suggestedValue": <number in range>, "reason": "under 10 words" }
  ]
}
Max 6 suggestions. Only use paths from the tunable config.`;

  try {
    const text = await callGemini(apiKey, prompt);
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {
      const m = text.match(/```(?:json)?\s*([\s\S]+?)```/) ?? text.match(/(\{[\s\S]+\})/);
      if (m) try { parsed = JSON.parse(m[1]); } catch { /* fall through */ }
    }
    if (parsed) renderResult(parsed);
    else showOut(`<div class="dp-analysis">${text}</div>`);
  } catch (err) {
    showOut(`<div class="dp-err">Error: ${err.message}</div>`);
  }

  btn.disabled = false;
  btn.textContent = 'Analyze ✦';
}

function renderResult(parsed) {
  let html = '';
  if (parsed.analysis) html += `<div class="dp-analysis">${parsed.analysis}</div>`;

  let diffText = '// Paste changes into game.config.js — Vite will hot-reload\n\n';
  for (const s of parsed.suggestions ?? []) {
    const info  = TUNABLE[s.path];
    const label = info?.label ?? s.path;
    html += `<div class="dp-sg">
      <div class="dp-sg-path">${s.path}</div>
      <div class="dp-sg-val">${label}: ${s.currentValue} → ${s.suggestedValue}</div>
      <div class="dp-sg-why">${s.reason}</div>
    </div>`;
    diffText += `// ${s.path}\n// ${s.reason}\n// ${s.currentValue}  →  ${s.suggestedValue}\n\n`;
  }

  if ((parsed.suggestions ?? []).length) {
    const esc = JSON.stringify(diffText);
    html += `<button class="dp-copy"
      onclick="navigator.clipboard.writeText(${esc}).then(()=>{this.textContent='Copied ✓';setTimeout(()=>this.textContent='Copy Changes to Clipboard',1600)})">
      Copy Changes to Clipboard</button>`;
  }

  showOut(html);
}

function showOut(html) {
  document.getElementById('dp-out').innerHTML = html;
}

// ── GEMINI API ────────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    }),
  });

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try { const e = await resp.json(); msg = e?.error?.message ?? msg; } catch { /* keep */ }
    throw new Error(msg);
  }

  const data = await resp.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('No response from Gemini');
  return candidate.content.parts[0].text;
}
