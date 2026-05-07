// ═══════════════════════════════════════════════════════════════════════════
//  NAIJA 5S — GAME CONFIGURATION
//  Single source of truth for every tunable value in the game.
//  Edit here to change physics feel, balance AI difficulty, add new skills,
//  tweak formations, or adjust power curves. Nothing else needs to change.
// ═══════════════════════════════════════════════════════════════════════════

// ── CANVAS & RENDER ──────────────────────────────────────────────────────────
export const CANVAS = {
  logicalWidth:  800,
  logicalHeight: 480,
  spritePixelSize: 1,  // SP — each sprite "dot" occupies this many real pixels²
};

// ── PITCH GEOMETRY ────────────────────────────────────────────────────────────
export const PITCH = {
  x: 18, y: 14,        // top-left corner of the grass area
  w: 764, h: 452,      // playable area dimensions

  goalHeight:  100,    // mouth height (each goal)
  goalDepth:    18,    // how deep the net extends behind the line

  penaltyBoxW: 110,
  penaltyBoxH: 170,
  centreCircleR: 52,

  // Derived — computed once at startup in game.js
  get midX() { return this.x + this.w / 2; },
  get midY() { return this.y + this.h / 2; },
};

// ── PHYSICS ───────────────────────────────────────────────────────────────────
export const PHYSICS = {
  ball: {
    // Rolling friction — multiply velocity by this each frame.
    // 1.0 = no friction, 0.97 = heavy friction. Default: responsive but realistic.
    friction: 0.988,

    // z-axis gravity (downward pull when ball is airborne).
    // Higher = shorter arcs, lower = floatier/bouncier shots.
    gravity: 0.10,

    // Fraction of z-velocity kept after bouncing off the ground.
    // 0 = dead stop, 1 = infinite bouncing. 0.48 gives 2–3 bounces.
    groundBounceCoeff: 0.48,

    // Min z-velocity to register as a "live" bounce; below this the ball
    // settles flat on the ground.
    minBounceSpeed: 0.80,

    // Speed fraction kept when hitting a pitch boundary wall.
    wallBounceCoeff: 0.72,

    // Speed fraction kept hitting the back/sides of the goal (slower = net feel).
    goalpostBounceCoeff: 0.45,

    // Ball spin — how much vx contributes to the spin angle each frame.
    spinRate: 0.04,

    // Spin speed when ball is being dribbled by a player.
    ownedSpinRate: 0.06,

    // Maximum ball height (z) at which a player can pick the ball up.
    maxPickupZ: 10,

    // Extra contact radius beyond PRAD+BRAD for proximity pickup.
    pickupRadius: 5,

    // Additional friction multiplier applied per frame when ball is rolling on ground (z < 0.5).
    groundFriction: 0.988,
  },

  player: {
    // Circle radius used for collision detection and pickup checks.
    radius: 5,  // PRAD

    // Push-apart kicks in when two players are closer than this × radius.
    // 1.0 = perfectly flush, 2.0 = twice their radius apart.
    separationFactor: 1.75,
  },

  ballRadius: 2,  // BRAD — visual and collision radius of the ball
};

// ── MATCH RULES ───────────────────────────────────────────────────────────────
export const RULES = {
  // Length of a match in seconds.
  matchDuration: 180,

  // Milliseconds to pause after a goal before resetting to kickoff.
  goalResetDelay: 2400,

  // The team that concedes kicks off (standard 5-aside rule).
  // Set false to always have the same team kick off.
  concedingTeamKicksOff: true,

  // Pixels past the goal line for the ball to count as a goal.
  // Small buffer prevents false positives on grazing shots.
  goalLineTolerance: 2,

  // Offside is disabled — standard futsal / 5-aside rule.
  offside: false,

  // Ball out of touch = wall bounce (futsal boards, no throw-ins for MVP).
  outOfBoundsMode: 'bounce',  // 'bounce' | 'throw-in'
};

// ── PLAYER MOVEMENT ───────────────────────────────────────────────────────────
export const MOVEMENT = {
  // ── Human-controlled player ───────────────────────────────────────────────
  walk:   1.20,   // px per frame at dt=1 (normal movement)
  sprint: 2.10,   // px per frame while sprint button held

  // Seconds of continuous sprinting with ball before "POWER! ⚡" callout fires.
  sprintCalloutDelay: 1.4,

  // Vibrate every N sprint-tick integers to feel the feet pounding.
  sprintRumblePeriod: 4,

  // Direction-change combo window (frames). Reset if no change within this time.
  dribbleWindow: 90,

  // Number of rapid direction reversals to trigger "NICE DRIBBLE!" callout.
  dribbleChangesNeeded: 3,

  // ── Animation frame rates (ms per sprite frame) ───────────────────────────
  walkFrameRate:   115,
  sprintFrameRate:  78,

  // ── AI movement ───────────────────────────────────────────────────────────
  aiWalk:   1.55,

  // Speed multiplier when the AI target is far away (chasing ball across pitch).
  aiFarMult: 1.10,

  // Distance threshold (px) to activate the far-target speed boost.
  aiFarDist:   65,

  // AI considered "at target" when within this many px.
  aiArrivalDist: 4,

  // AI presses opponent ball-carrier when within this many px.
  aiPressRadius: { gk: 0, cb: 62, lm: 58, rm: 58, st: 72, lb: 50, rb: 50, lcm: 68, cm: 78, rcm: 68, lw: 60, rw: 60 },

  // How far ahead (px) a supporting striker runs toward the goal.
  aiStrikerRunOffset: 55,

  // GK collects loose balls within this px radius.
  aiGKCollectRange: 20,

  // ── AI animation ──────────────────────────────────────────────────────────
  aiFrameRate:        118,
  aiSpeedBoostFrame:   72,  // faster animation tick when speedBoost active
};

// ── POWER & KICKING ───────────────────────────────────────────────────────────
export const POWER = {
  // ── Charge shot (human player) ────────────────────────────────────────────
  charge: {
    // Frames to go from 0 → 1 charge. Lower = quicker full charge.
    chargeTime: 34,

    // Ball velocity at min/max charge.
    minVelocity: 4.0,
    maxVelocity: 9.5,

    // Ball starting height (z) at min/max charge.
    minZ:   2.0,
    maxZ:   5.5,

    // Ball upward velocity (vz) at min/max charge.
    minLift: 0.6,
    maxLift: 2.0,

    // Goal-aim scatter (px) at min/max charge.
    // High scatter at low charge = inaccurate chip; low scatter = laser at full.
    minScatter: 28,
    maxScatter:  7,

    // Charge thresholds for callout labels.
    boomThreshold: 0.65,         // ≥ this → "BOOM! 🔥"
    niceThreshold: 0.30,         // ≥ this → "NICE SHOT!"
    powerShotThreshold: 0.75,    // ≥ this + player has powerShot skill → auto powerShot

    // Cooldown frames before the same player can kick again.
    kickCooldown: 18,
  },

  // ── Tap kick (loose ball, no charge) ─────────────────────────────────────
  tap: {
    velocity:    5.5,
    z:           2.0,
    vz:          0.7,
    kickCooldown: 14,
    range:        28,   // px to ball to allow tap
  },

  // ── Slide tackle ─────────────────────────────────────────────────────────
  tackle: {
    forwardVelocity: 2.5,   // ball vx after a successful tackle
    lateralRandom:   0.8,   // ±random ball vy
    cooldown:         32,
    rangeMultiplier:   4,   // multiply by PRAD for max tackle reach
  },

  // ── AI kicking ────────────────────────────────────────────────────────────
  ai: {
    // Regular (non-skill) shot
    normalVelocity: 7.5,
    normalVariance: 1.0,    // ±random added to velocity
    normalScatter:   24,    // goal-aim scatter (px)

    // GK clearing punt
    gkClearVelocity: 3.8,

    // AI passing
    passVelocity: 4.2,

    kickCooldown:    22,
    tackleCooldown:  28,

    // Distance from goal to consider shooting (outer limit).
    shootRange:     130,

    // Probability per frame of shooting when in range (no skill).
    normalShootChance: 0.025,

    // Probability per frame of passing when pressured.
    passChance: 0.035,

    // px to nearest opponent before AI considers passing.
    passPressureRange: 55,
  },

  // ── Rumble feedback ───────────────────────────────────────────────────────
  // Each entry: [strongMotor (0-1), weakMotor (0-1), durationMs]
  rumble: {
    boom:        [1.00, 0.50, 130],  // full-power shot
    niceShot:    [0.60, 0.25,  80],  // medium shot
    tap:         [0.35, 0.12,  55],  // weak tap kick
    tackle:      [0.70, 0.40,  90],  // successful player tackle
    wall:        [0.30, 0.50,  38],  // ball hits pitch boundary
    bounce:      [0.25, 0.50,  30],  // ball bounces on ground
    sprintBuzz:  [0.00, 0.07,  25],  // periodic buzz while sprinting with ball
    goal:        [1.00, 0.50, 300],  // GOAL — long celebration rumble
    cpuSkill:    [0.20, 0.10,  40],  // CPU activates a skill near player
  },
};

// ── PLAYER SKILLS ─────────────────────────────────────────────────────────────
//  Each skill has:
//    label         — callout text shown above the activating player
//    color         — ring/glow color when active
//    cooldown      — frames before skill can be used again
//    duration      — frames the skill stays active (0 = instant / one-shot)
//    sparkColor    — particle palette key
//    ...activation conditions (per-skill)
export const SKILLS = {
  speedBoost: {
    label:    'SPEED BOOST! ⚡',
    color:    '#22c55e',
    cooldown: 320,
    duration: 130,

    // Movement speed while active.
    // Applied as a flat speed override (overrides walk/sprint split).
    speedMultiplier: 1.50,  // relative to MOVEMENT.walk

    // Animation ticks faster to feel snappier.
    frameRateOverride: 72,  // ms per frame (same as aiSpeedBoostFrame)

    sparkColor: 'green',

    // AI activation: random chance per frame when dribbling forward.
    dribbleActivateChance: 0.007,

    // AI activation: random chance per frame when pressing an opponent.
    defendActivateChance: 0.012,

    // Min distance to ball for defend-mode activation.
    defendActivateRange: 65,
  },

  steal: {
    label:    'STEAL!',
    color:    '#f97316',
    cooldown: 200,
    duration:  35,

    // Activation: trigger when within this many px of the ball carrier.
    tackleRange: 50,

    sparkColor: 'orange',

    // Steal is range-triggered; no probability — fires as soon as in range.
    // See AI logic: canSkill() check + tackleRange condition.
  },

  powerShot: {
    label:    'POWER SHOT! 🔥',
    color:    '#ef4444',
    cooldown: 350,
    duration:   0,   // instant — fires immediately on activation

    // Shot velocity override (higher than normal AI shot).
    velocity:  9.2,

    // Only activates when the AI is within this many px of the goal.
    goalRange: 110,

    // Probability per frame of activating when in range.
    activateChance: 0.045,

    sparkColor: 'kick',
  },

  longShot: {
    label:    'LONG SHOT! 🎯',
    color:    '#a855f7',
    cooldown: 450,
    duration:   0,

    velocity:  8.2,

    // Activates only in this distance band from goal (avoids short-range spam).
    minRange: 130,
    maxRange: 220,

    activateChance: 0.014,

    sparkColor: 'purple',
  },
};

// ── TEAM ROSTER (7 clubs — all in "attacks-right" orientation) ────────────────
//  buildTeamsFromDef() mirrors rx when a team is assigned as away.
export const ALL_TEAMS = [
  // 0 — NAIJA ─────────────────────────────────────────────────────────────────
  { id:0, name:'NAIJA',
    colors:{ shirt:'#16a34a',shorts:'#ffffff',skin:'#a06b3f',hair:'#1a0e08',gkShirt:'#f59e0b',gloves:'#ffffff'},
    formation:[
      {role:'gk', rx:-0.92,ry: 0.00,skills:[],                             gkRating:2,name:'Amara'  },
      {role:'lb', rx:-0.70,ry:-0.42,skills:[['speedBoost',1],['steal',1]],            name:'Emeka'  },
      {role:'cb', rx:-0.65,ry:-0.15,skills:[['steal',3],['speedBoost',1]],             name:'Chukwu' },
      {role:'cb', rx:-0.65,ry: 0.15,skills:[['steal',1]],                             name:'Nnamdi' },
      {role:'rb', rx:-0.70,ry: 0.42,skills:[['steal',1]],                             name:'Uche'   },
      {role:'lcm',rx:-0.24,ry:-0.26,skills:[['longShot',1]],                          name:'Iffy'   },
      {role:'cm', rx:-0.16,ry: 0.00,skills:[['steal',1]],                             name:'Willy'  },
      {role:'rcm',rx:-0.24,ry: 0.26,skills:[['speedBoost',1]],                        name:'Kele'   },
      {role:'lw', rx: 0.32,ry:-0.44,skills:[['speedBoost',3]],                        name:'Moses'  },
      {role:'st', rx: 0.42,ry: 0.00,skills:[['powerShot',3],['speedBoost',1]],        name:'Victor' },
      {role:'rw', rx: 0.32,ry: 0.44,skills:[['longShot',1]],                          name:'Sammy'  },
    ]},
  // 1 — WARRI FC ──────────────────────────────────────────────────────────────
  { id:1, name:'WARRI FC',
    colors:{ shirt:'#dc2626',shorts:'#111111',skin:'#c8956c',hair:'#2a1408',gkShirt:'#7c3aed',gloves:'#fbbf24'},
    formation:[
      {role:'gk', rx:-0.92,ry: 0.00,skills:[],                             gkRating:3,name:'Chisom' },
      {role:'lb', rx:-0.70,ry:-0.42,skills:[['speedBoost',1],['steal',1]],            name:'Oghe'   },
      {role:'cb', rx:-0.65,ry:-0.15,skills:[['steal',1]],                             name:'Ike'    },
      {role:'cb', rx:-0.65,ry: 0.15,skills:[['steal',3],['speedBoost',1]],             name:'Obi'    },
      {role:'rb', rx:-0.70,ry: 0.42,skills:[['steal',1]],                             name:'Chidi'  },
      {role:'lcm',rx:-0.24,ry:-0.26,skills:[['longShot',1]],                          name:'Augie'  },
      {role:'cm', rx:-0.16,ry: 0.00,skills:[['powerShot',3],['steal',1]],             name:'Alex'   },
      {role:'rcm',rx:-0.24,ry: 0.26,skills:[['longShot',1]],                          name:'Odion'  },
      {role:'lw', rx: 0.32,ry:-0.44,skills:[['speedBoost',1]],                        name:'Simy'   },
      {role:'st', rx: 0.42,ry: 0.00,skills:[['powerShot',1]],                         name:'Taiwo'  },
      {role:'rw', rx: 0.32,ry: 0.44,skills:[['longShot',3]],                          name:'Juju'   },
    ]},
  // 2 — LAGOS KINGS ───────────────────────────────────────────────────────────
  { id:2, name:'LAGOS KINGS',
    colors:{ shirt:'#1d4ed8',shorts:'#854d0e',skin:'#a06b3f',hair:'#1a0e08',gkShirt:'#f59e0b',gloves:'#ffffff'},
    formation:[
      {role:'gk', rx:-0.92,ry: 0.00,skills:[],                             gkRating:3,name:'Emmanuel'},
      {role:'lb', rx:-0.70,ry:-0.42,skills:[['steal',1]],                             name:'Badmus'  },
      {role:'cb', rx:-0.65,ry:-0.15,skills:[['steal',3],['speedBoost',1]],             name:'Razak'   },
      {role:'cb', rx:-0.65,ry: 0.15,skills:[['steal',1]],                             name:'Babatunde'},
      {role:'rb', rx:-0.70,ry: 0.42,skills:[['steal',1]],                             name:'Dauda'   },
      {role:'lcm',rx:-0.24,ry:-0.26,skills:[['longShot',1]],                          name:'Kareem'  },
      {role:'cm', rx:-0.16,ry: 0.00,skills:[['steal',1]],                             name:'Azeez'   },
      {role:'rcm',rx:-0.24,ry: 0.26,skills:[['speedBoost',1]],                        name:'Sikiru'  },
      {role:'lw', rx: 0.32,ry:-0.44,skills:[['speedBoost',1]],                        name:'Funmi'   },
      {role:'st', rx: 0.42,ry: 0.00,skills:[['powerShot',3],['speedBoost',1]],        name:'Kayode'  },
      {role:'rw', rx: 0.32,ry: 0.44,skills:[['longShot',1]],                          name:'Adeyemi' },
    ]},
  // 3 — ABUJA EAGLES ──────────────────────────────────────────────────────────
  { id:3, name:'ABUJA EAGLES',
    colors:{ shirt:'#1e3a5f',shorts:'#ffffff',skin:'#b5703a',hair:'#1a0e08',gkShirt:'#dc2626',gloves:'#ffffff'},
    formation:[
      {role:'gk', rx:-0.92,ry: 0.00,skills:[],                             gkRating:1,name:'Tanko'  },
      {role:'lb', rx:-0.70,ry:-0.42,skills:[['steal',1]],                             name:'Yakubu' },
      {role:'cb', rx:-0.65,ry:-0.15,skills:[['steal',3],['speedBoost',1]],             name:'Hassan' },
      {role:'cb', rx:-0.65,ry: 0.15,skills:[['steal',1]],                             name:'Mohammed'},
      {role:'rb', rx:-0.70,ry: 0.42,skills:[['steal',1]],                             name:'Salihu' },
      {role:'lcm',rx:-0.24,ry:-0.26,skills:[['steal',1]],                             name:'Garba'  },
      {role:'cm', rx:-0.16,ry: 0.00,skills:[['longShot',3]],                          name:'Ibrahim'},
      {role:'rcm',rx:-0.24,ry: 0.26,skills:[['longShot',1]],                          name:'Umar'   },
      {role:'lw', rx: 0.32,ry:-0.44,skills:[['speedBoost',1]],                        name:'Nuhu'   },
      {role:'st', rx: 0.42,ry: 0.00,skills:[['speedBoost',3],['powerShot',1]],        name:'Musa'   },
      {role:'rw', rx: 0.32,ry: 0.44,skills:[['longShot',1]],                          name:'Adamu'  },
    ]},
  // 4 — KANO STARS ────────────────────────────────────────────────────────────
  { id:4, name:'KANO STARS',
    colors:{ shirt:'#ca8a04',shorts:'#1c1917',skin:'#c8956c',hair:'#1a0e08',gkShirt:'#7c3aed',gloves:'#ffffff'},
    formation:[
      {role:'gk', rx:-0.92,ry: 0.00,skills:[],                             gkRating:3,name:'Aliyu'  },
      {role:'lb', rx:-0.70,ry:-0.42,skills:[['steal',1]],                             name:'Haruna' },
      {role:'cb', rx:-0.65,ry:-0.15,skills:[['steal',3],['speedBoost',1]],             name:'Lawal'  },
      {role:'cb', rx:-0.65,ry: 0.15,skills:[['steal',1]],                             name:'Surajo' },
      {role:'rb', rx:-0.70,ry: 0.42,skills:[['steal',1]],                             name:'Kabiru' },
      {role:'lcm',rx:-0.24,ry:-0.26,skills:[['steal',1]],                             name:'Maikano'},
      {role:'cm', rx:-0.16,ry: 0.00,skills:[['steal',1]],                             name:'Danjuma'},
      {role:'rcm',rx:-0.24,ry: 0.26,skills:[['speedBoost',1]],                        name:'Bala'   },
      {role:'lw', rx: 0.32,ry:-0.44,skills:[['speedBoost',1]],                        name:'Gambo'  },
      {role:'st', rx: 0.42,ry: 0.00,skills:[['powerShot',1]],                         name:'Yusuf'  },
      {role:'rw', rx: 0.32,ry: 0.44,skills:[['longShot',3],['speedBoost',1]],         name:'Bello'  },
    ]},
  // 5 — RIVERS ROVERS ─────────────────────────────────────────────────────────
  { id:5, name:'RIVERS ROVERS',
    colors:{ shirt:'#c2410c',shorts:'#1c1917',skin:'#a06b3f',hair:'#1a0e08',gkShirt:'#16a34a',gloves:'#ffffff'},
    formation:[
      {role:'gk', rx:-0.92,ry: 0.00,skills:[],                             gkRating:1,name:'Ngozi'    },
      {role:'lb', rx:-0.70,ry:-0.42,skills:[['steal',1]],                             name:'Tamuno'   },
      {role:'cb', rx:-0.65,ry:-0.15,skills:[['steal',3],['speedBoost',1]],             name:'Chukwuka' },
      {role:'cb', rx:-0.65,ry: 0.15,skills:[['steal',1]],                             name:'Soberekon'},
      {role:'rb', rx:-0.70,ry: 0.42,skills:[['steal',1]],                             name:'Opuene'   },
      {role:'lcm',rx:-0.24,ry:-0.26,skills:[['longShot',1]],                          name:'Briggs'   },
      {role:'cm', rx:-0.16,ry: 0.00,skills:[['steal',1]],                             name:'Pepple'   },
      {role:'rcm',rx:-0.24,ry: 0.26,skills:[['speedBoost',1]],                        name:'Owunari'  },
      {role:'lw', rx: 0.32,ry:-0.44,skills:[['speedBoost',3],['steal',1]],            name:'Tonye'    },
      {role:'st', rx: 0.42,ry: 0.00,skills:[['powerShot',1]],                         name:'Fubara'   },
      {role:'rw', rx: 0.32,ry: 0.44,skills:[['longShot',1]],                          name:'Peterside'},
    ]},
  // 6 — ENUGU FC ───────────────────────────────────────────────────────────────
  { id:6, name:'ENUGU FC',
    colors:{ shirt:'#7c3aed',shorts:'#ffffff',skin:'#a06b3f',hair:'#1a0e08',gkShirt:'#f59e0b',gloves:'#ffffff'},
    formation:[
      {role:'gk', rx:-0.92,ry: 0.00,skills:[],                             gkRating:1,name:'Eze'      },
      {role:'lb', rx:-0.70,ry:-0.42,skills:[['steal',1]],                             name:'Ugwu'     },
      {role:'cb', rx:-0.65,ry:-0.15,skills:[['steal',3],['speedBoost',1]],             name:'Okafor'   },
      {role:'cb', rx:-0.65,ry: 0.15,skills:[['steal',1]],                             name:'Onuoha'   },
      {role:'rb', rx:-0.70,ry: 0.42,skills:[['steal',1]],                             name:'Nwachukwu'},
      {role:'lcm',rx:-0.24,ry:-0.26,skills:[['longShot',1]],                          name:'Ugochukwu'},
      {role:'cm', rx:-0.16,ry: 0.00,skills:[['steal',3],['powerShot',1]],             name:'Tunde'    },
      {role:'rcm',rx:-0.24,ry: 0.26,skills:[['steal',1]],                             name:'Chidi'    },
      {role:'lw', rx: 0.32,ry:-0.44,skills:[['speedBoost',1]],                        name:'Ani'      },
      {role:'st', rx: 0.42,ry: 0.00,skills:[['powerShot',3],['speedBoost',1]],        name:'Obinna'   },
      {role:'rw', rx: 0.32,ry: 0.44,skills:[['longShot',1]],                          name:'Obi'      },
    ]},
];

// backward compat — existing code that references TEAMS.home / TEAMS.away still works
export const TEAMS = { home: ALL_TEAMS[0], away: ALL_TEAMS[1] };

// ── UI THEME (gold / green / cream) ──────────────────────────────────────────
export const UI = {
  bg:       '#050A05',
  surface:  '#0d1a0d',
  card:     '#0a140a',
  border:   '#00A651',
  accent:   '#00A651',
  accentHi: '#00c960',
  gold:     '#FFB800',
  goldDim:  '#8a6400',
  cream:    '#F0EDE0',
  text:     '#F0EDE0',
  textDim:  'rgba(240,237,224,0.55)',
  textMute: 'rgba(240,237,224,0.22)',
  red:      '#CC2936',
};

// ── GAME BALANCE ──────────────────────────────────────────────────────────────
//  High-level dials. Raise cpuAggression to make the AI harder;
//  raise skillCooldownScale to make skill usage rarer.
export const BALANCE = {
  // ── CPU difficulty multipliers ────────────────────────────────────────────
  // Multiply all AI shoot/pass/activate probabilities by this.
  // 1.0 = default. 1.5 = noticeably harder. 0.6 = easier.
  cpuAggressionScale:   1.2,

  // Multiply all skill cooldowns by this to space out skill use.
  // 1.0 = default. 2.0 = skills only every ~10s each.
  skillCooldownScale:   1.0,

  // ── Visual effects ────────────────────────────────────────────────────────
  trajectory: {
    steps:        36,    // number of arc preview simulation steps
    drawInterval:  2,    // draw a dot every N steps
    baseAlpha:    0.55,
    alphaDecay:   0.015,
    stepSize:     0.55,  // px advance per simulation tick
    gravity:      0.055, // vz decay per simulation tick
  },

  // ── PowerShot slow-motion ────────────────────────────────────────────────
  slowMo: {
    duration: 28,    // frames the effect lasts
    factor:   0.22,  // dt multiplier at peak slowness
  },

  // ── Callout animation ─────────────────────────────────────────────────────
  callout: {
    defaultDuration: 40,   // frames
    floatSpeed:      0.16, // px per frame upward drift
    scaleInFrames:    8,   // spring-in duration (frames)
    scaleOutStart:    0.7, // fraction of total duration to begin fade-out
    peakScale:        1.12,
  },

  // ── Particles ─────────────────────────────────────────────────────────────
  dust: {
    n: 4,          // particles per spawn
    maxLife: 28,   // frames before removal
    speed: { min: 0.4, max: 1.5 },
  },
  spark: {
    n: 8,
    maxLife: 28,
    speed: { min: 1.5, max: 4.5 },
    liftBias: -1.0,  // initial vy offset (sparks fly upward)
  },
  bounce: {
    maxLife: 17,
    speedScale: 0.4,
  },

  // ── Sprint trails ─────────────────────────────────────────────────────────
  trail: {
    spawnChance: 0.28,
    initialAlpha: 0.35,
    decayRate: 0.04,    // alpha removed per frame
  },

  // ── GK behaviour ─────────────────────────────────────────────────────────
  gk: {
    relaxedBallDist: 80,
    goalMouthInset:  12,
    // GK dives toward ball projection when shot is this fast and heading in
    diveSpeedThresh: 1.8,
    diveReachMult:   2.8,   // how aggressively GK closes toward predicted Y
  },

  // ── Feint / opponent reaction ─────────────────────────────────────────────
  feint: {
    radius:        44,   // px — opponents within this get feinted
    duration:      38,   // frames the debuff lasts
    speedMult:     0.48, // speed fraction while feinted
    shimmerAmp:     2,   // px side-wobble amplitude on feinted sprite
  },

  // ── Weather ───────────────────────────────────────────────────────────────
  weather: {
    cycleDuration: 1800,   // frames before switching rain ↔ snow (~30s at 60fps)
    rain: {
      streakCount:  55,
      speedY:       7.5,
      speedX:      -1.8,
      frictionMod: +0.007,
      bounceMod:   -0.08,
    },
    snow: {
      flakeCount:    80,
      speedYMin:     0.7,
      speedYMax:     1.8,
      driftAmp:      0.5,
      frictionMod:  +0.018,   // much more friction on snow
      bounceMod:    -0.14,    // very flat bounce on snow
      pileSpawnRate: 0.006,   // probability per frame a new pile seed appears
      pileMaxCount:   55,
      pileGrowRate:   0.012,  // radius growth per frame while snowing
    },
  },

  // ── Stamina ───────────────────────────────────────────────────────────────
  stamina: {
    max:                100,
    regenPerFrame:      0.07,   // per dt=1 frame (~4/s, full recharge in ~25s)
    minToActivate:       20,    // skill blocked below this threshold
    costs: {
      powerShot:  42,
      speedBoost: 20,   // initial cost on activation
      steal:      18,
      longShot:   34,
    },
    speedBoostDrainRate: 0.18,  // stamina lost per frame while speedBoost is active
    fatigueBelow:        28,    // below this stamina, player slows down
    fatigueMult:         0.82,  // speed fraction when fatigued
  },

  // ── Goal proximity ────────────────────────────────────────────────────────
  goalProximity: {
    glowRange:     110,  // ball within this px of goal line triggers glow
    nearMissRange:  14,  // ball misses post within this many px → callout
  },
};
