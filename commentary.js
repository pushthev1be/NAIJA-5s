// ── Naija 5s — Commentary duo ────────────────────────────────────────────────
// AFRO MIKE does the hype play-by-play; COACH BAYO is the dry analyst who
// sometimes answers him. Each line has:
//   id    — stable name of its voice clip: public/commentary/<id>.mp3
//   who   — 'mike' | 'bayo'
//   text  — what shows on screen
//   say   — what the voice actor / TTS reads (natural case + punctuation)
//   reply — optional answer from the other commentator
// Add or edit lines freely, then run `npm run voices` to (re)generate clips.

export const COMMENTATORS = {
  mike: { name: 'AFRO MIKE',  color: '#fde047' },
  bayo: { name: 'COACH BAYO', color: '#86efac' },
};

const r = (id, who, text, say) => ({ id, who, text, say });

export const LINES = {
  kickoff: [
    { ...r('kick_live', 'mike', 'WE DEY LIVE O!', 'We dey live o! Na Naija Five-s!'),
      reply: r('kick_live_r', 'bayo', 'MAKE UNA JUST PLAY BALL', 'Make una just play ball, abeg.') },
    { ...r('kick_whistle', 'mike', 'WHISTLE DON BLOW!', 'Whistle don blow! Make we go!'),
      reply: r('kick_whistle_r', 'bayo', 'I DEY WATCH UNA', 'I dey watch una o.') },
    r('kick_pressure', 'bayo', 'NO PRESSURE, NO DIAMOND', 'No pressure, no diamond. Make we see.'),
  ],
  goal: [
    { ...r('goal_burst', 'mike', 'E BURST AM!!', 'E burst am!!'),
      reply: r('goal_burst_r', 'bayo', 'DAT NET DON TEAR', 'Ah. Dat net don tear.') },
    r('goal_wahala', 'mike', 'NAIJA WAHALA!', 'Naija wahala!'),
    { ...r('goal_god', 'mike', 'NA GOD SEND AM!', 'Na God send am!'),
      reply: r('goal_god_r', 'bayo', 'GOD NO DEY PLAY BALL', 'God no dey play ball, my brother. Na skill.') },
    { ...r('goal_born', 'mike', 'WHO BORN DIS BOY?!', 'Who born dis boy?!'),
      reply: r('goal_born_r', 'bayo', 'IM PAPA GO HAPPY TODAY', 'Im papa go happy today.') },
    r('goal_fire', 'mike', 'FIRE GOAL!', 'Fire goal!'),
    r('goal_finish', 'mike', 'FINISH WORK!', 'Finish work! E don finish am!'),
    r('goal_calm', 'bayo', 'SIMPLE. CLEAN. GOAL.', 'Simple. Clean. Goal.'),
  ],
  save: [
    { ...r('save_choke', 'mike', 'GK CHOKE AM!', 'Goalkeeper choke am!'),
      reply: r('save_choke_r', 'bayo', 'DAT ONE GET GLUE FOR HAND', 'Dat one get glue for hand.') },
    r('save_noway', 'mike', 'NO WAY NO HOW!', 'No way, no how!'),
    r('save_brick', 'mike', 'BRICK WALL!!', 'Brick wall!!'),
    { ...r('save_early', 'mike', 'HE SEE AM EARLY!', 'He see am early!'),
      reply: r('save_early_r', 'bayo', 'EXPERIENCE BE DAT', 'Experience be dat, I tell you.') },
    r('save_abeg', 'mike', 'ABEG... NAH!!', 'Abeg... nah!!'),
  ],
  powerShot: [
    r('ps_thunder', 'mike', 'THUNDER FEET!', 'Thunder feet!'),
    r('ps_wah', 'mike', 'WAH WAH WAH!', 'Wah wah wah!'),
    { ...r('ps_missile', 'mike', 'MISSILE LAUNCH!!', 'Missile launch!!'),
      reply: r('ps_missile_r', 'bayo', 'WHO GO PAY FOR DAT NET?', 'Who go pay for dat net?') },
    r('ps_power', 'mike', 'E CARRY POWER O!', 'E carry power o!'),
  ],
  longShot: [
    r('ls_there', 'mike', 'FROM THERE?!', 'From there?!'),
    r('ls_madness', 'mike', 'LONG RANGE MADNESS!', 'Long range madness!'),
    r('ls_impossible', 'mike', 'IMPOSSIBLE SHOT!', 'Impossible shot!'),
    { ...r('ls_outside', 'mike', 'NAH!!! FROM OUTSIDE?!', 'Nah!!! From outside?!'),
      reply: r('ls_outside_r', 'bayo', 'ME, I FOR PASS AM', 'Me, I for pass am sha.') },
  ],
  flashSteal: [
    { ...r('fs_rob', 'mike', 'E ROB AM CLEAN!', 'E rob am clean!'),
      reply: r('fs_rob_r', 'bayo', 'DAYLIGHT ROBBERY', 'Dat one na daylight robbery.') },
    r('fs_thief', 'mike', 'THIEF THIEF!!', 'Thief! Thief!!'),
    r('fs_def', 'mike', 'NAIJA DEF!!', 'Naija defence!!'),
    r('fs_swipe', 'mike', 'CLEAN SWIPE BESTIE!', 'Clean swipe, bestie!'),
  ],
  speedBoost: [
    r('sb_voom', 'mike', 'HE VOOM!', 'He voom!'),
    r('sb_zoom', 'mike', 'ZOOM ZOOM!!!', 'Zoom zoom!!!'),
    { ...r('sb_pass', 'mike', 'E JUS PASS DEM!', 'E just pass dem!'),
      reply: r('sb_pass_r', 'bayo', 'EVEN OKADA NO FAST REACH AM', 'Even okada no fast reach am.') },
    r('sb_rocket', 'mike', 'ROCKET MAN!', 'Rocket man!'),
  ],
  nearMiss: [
    { ...r('nm_close', 'mike', 'SO CLOSE!', 'Ahh! So close!'),
      reply: r('nm_close_r', 'bayo', 'IM SHOOTING BOOT DEY HOUSE', 'Im shooting boot dey house.') },
    r('nm_post', 'mike', 'E KISS DI POST!', 'E kiss di post!'),
    r('nm_chai', 'mike', 'CHAI!!', 'Chaaai!!'),
  ],
};

// Every line and reply, flattened — used by the voice generator.
export const ALL_LINES = Object.values(LINES).flat().flatMap(l => (l.reply ? [l, l.reply] : [l]));
