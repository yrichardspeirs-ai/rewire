// achievements.js — pure definitions (no state import, to avoid cycles).
// Each test() receives a metrics snapshot computed in state.js:
//   { streak, totalReps, resisted, level, hardDone, bestRepStreak, cleanRun }
// Discipline-themed: every badge is earned proof for the Cookie Jar.

export const ACHIEVEMENTS = [
  { id: 'first_blood',  name: 'First Blood',     icon: '🩸', desc: 'Bank your very first rep.',                 test: m => m.totalReps >= 1 },
  { id: 'week_one',     name: 'Seven Straight',  icon: '🔥', desc: 'Hold a 7-day streak. The chain is forming.', test: m => m.streak >= 7 },
  { id: 'month_one',    name: 'Thirty Deep',     icon: '⛓️', desc: '30-day streak. This is who you are now.',    test: m => m.streak >= 30 },
  { id: 'century',      name: 'Century',         icon: '💯', desc: '100 reps banked. Volume is the proof.',      test: m => m.totalReps >= 100 },
  { id: 'half_k',       name: 'Five Hundred',    icon: '🗿', desc: '500 reps. Calloused.',                       test: m => m.totalReps >= 500 },
  { id: 'level_5',      name: 'Forged',          icon: '⚒️', desc: 'Reach Level 5.',                             test: m => m.level >= 5 },
  { id: 'level_10',     name: 'Tempered',        icon: '🛡️', desc: 'Reach Level 10.',                            test: m => m.level >= 10 },
  { id: 'soul_1',       name: 'First Soul',      icon: '👻', desc: 'Resist the scroll once. Soul taken.',        test: m => m.resisted >= 1 },
  { id: 'soul_25',      name: 'Soul Collector',  icon: '💀', desc: 'Resist 25 urges. The feed fears you.',       test: m => m.resisted >= 25 },
  { id: 'soul_100',     name: 'Untouchable',     icon: '🕳️', desc: 'Resist 100 urges. The algorithm lost.',      test: m => m.resisted >= 100 },
  { id: 'rep_streak_14', name: 'Relentless',     icon: '🏔️', desc: 'Keep a single rep alive 14 days straight.',  test: m => m.bestRepStreak >= 14 },
  { id: 'hard_10',      name: 'Embrace the Suck', icon: '🪨', desc: 'Complete 10 reps you marked as hard.',       test: m => m.hardDone >= 10 },
  { id: 'hard_50',      name: 'Calloused Mind',  icon: '🧠', desc: '50 hard things done. The mind is armor now.', test: m => m.hardDone >= 50 },
  { id: 'clean_run_10', name: 'Clean Hands',     icon: '✋', desc: 'A clean run of 10 resisted urges, no slips.', test: m => m.cleanRun >= 10 },
  { id: 'first_forge',  name: 'Forged in Fire',  icon: '🔥', desc: 'Complete your first challenge. Survived the forge.', test: m => m.challengesWon >= 1 },
];
