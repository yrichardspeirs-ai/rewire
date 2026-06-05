// copy.js — the voice of REWIRE. Intense, clean, discipline-grounded.
// Centralized so tone lives in ONE place. A future "raw" mode just swaps these tables.
// Grounded in: Goggins (calloused mind, 40% rule, no excuses), Duckworth's Grit
// (effort counts twice, purpose), and Self-Determination Theory (identity > points).

import { todayStr } from './utils.js';

// Deterministic pick for the day — stable across re-renders within the same date.
function daySeed() {
  const s = todayStr(); let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
export function daily(arr) { return arr[daySeed() % arr.length]; }
export function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// The hard line on the Today hero — your daily marching order.
export const DIRECTIVES = [
  'Nobody is coming to save you. Good — you were never going to need them.',
  'The work you keep avoiding is the exact work that changes you. Go do it.',
  'Motivation is garbage. It runs out by 9am. You run on discipline now.',
  'When your mind says stop, you are at 40%. The other 60% is who you become.',
  'Be uncommon amongst the uncommon. Average is a choice and you are done making it.',
  'You do not rise to the occasion. You fall to your training. So train.',
  'Comfort is the enemy. Go find the thing that scares you and do it first.',
  'Discipline is a muscle. Today is a rep. Skip it and it atrophies.',
  'Talent is nothing without effort. And effort counts twice. Spend it.',
  'The person you are becoming is watching what you do right now.',
  'Suffer the boredom of the basics. That is where the work hides.',
  'No one is built different. They just refused to quit. Refuse with them.',
];

// Small attribution shown when you complete a normal rep (paired with the identity).
export const COMPLETE_LINES = [
  'Rep banked.', 'One more vote cast.', 'Earned, not given.',
  'That is who you are now.', 'Logged. Keep moving.', 'Callous added.',
];

// Crit (variable-reward double XP) headline.
export const CRIT_LINES = ['CRITICAL REP', 'OVERDELIVERED', 'YOU WENT FURTHER', 'CALLOUSED'];

// Account level-up takeover lines.
export const LEVELUP_LINES = [
  'You are not the same person who started this.',
  'The work is changing you. Keep paying the price.',
  'New level. Same enemy: the version of you that quits.',
  'You earned this in reps nobody saw. Stay hard.',
];

// Identity rank-up takeover lines (paired with the identity name).
export const RANKUP_LINES = [
  'is getting stronger. Feed it again tomorrow.',
  'just ranked up. This is who you are becoming.',
  'leveled. The evidence is piling up — believe it.',
  'advanced. You are building a person, one rep at a time.',
];

// Today ring captions.
export const RING_FULL = 'Full clear. No excuses left to make. That is the standard now.';
export const RING_PARTIAL = 'Every rep is a vote for who you are becoming. The day is not done.';
export const RING_EMPTY = 'Zero reps. The day is staring at you. Take the first one.';

// Resist / Taking Souls.
export const RESIST_HERO = 'Do not fight the urge with willpower. Willpower loses. Redirect it and take the win.';
export const RESIST_CTA = 'The feed is designed to beat you. Beat it first.';

// Reflection / accountability prompt (Today).
export const REFLECT_PROMPT = 'No excuses. What did you actually do today — and what did you dodge?';

// Daily Coach — a local, rule-based read on your day. No backend, no LLM: just your
// own data turned into a directive. Returns { kind, line }.
export function coachLine(c) {
  if (c.challengeRisk) return { kind: 'Challenge', line: `${c.challengeName} needs ${c.repsLeft} more rep${c.repsLeft === 1 ? '' : 's'} before midnight. Don't break the chain you swore to keep.` };
  if (c.total && c.doneCount === c.total) return { kind: 'Standard', line: "Full clear. That's not a good day — it's the standard now. Bank it and move." };
  if (c.doneCount === 0 && c.part !== 'morning') return { kind: 'Wake up', line: `${c.part === 'evening' ? "The day's almost gone" : "Half the day's gone"} and zero reps banked. The clock doesn't negotiate. Take the first one now.` };
  if (c.slipsRecent) return { kind: 'Hold the line', line: "You've given in more than you've held lately. Next urge, redirect it — take that soul back." };
  if (c.streak >= 7) return { kind: 'Protect it', line: `Day ${c.streak}. The chain is real now. Today is about not being the reason it breaks.` };
  if (c.doneCount > 0 && c.doneCount < c.total) return { kind: 'Keep moving', line: `${c.doneCount} down, ${c.total - c.doneCount} to go. The hard ones are the ones that count — don't leave them.` };
  return { kind: 'Orders', line: daily(DIRECTIVES) };
}
