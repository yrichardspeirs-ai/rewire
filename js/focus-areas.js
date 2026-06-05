// focus-areas.js — the personalization catalog. Onboarding asks which areas you're
// forging; each pick seeds a matching identity + starter reps. Pure data + builder,
// no state import (keeps it cycle-free and easy to extend).

export const FOCUS_AREAS = [
  {
    id: 'mind', name: 'Mind', icon: '🧠', tagline: 'Knowledge & learning',
    identity: { id: 'scholar', name: 'The Scholar', rank: 'Knowledge', color: '#fb923c', feeds: 'Reading and studying' },
    reps: [
      { title: 'Read', target: '20 min', intent: 'After my morning coffee, I read for 20 minutes.', xp: 20 },
      { title: 'Study something hard', target: '15 min', intent: 'At lunch, I study one difficult concept for 15 minutes.', xp: 20 },
    ],
  },
  {
    id: 'body', name: 'Body', icon: '💪', tagline: 'Strength & training',
    identity: { id: 'athlete', name: 'The Athlete', rank: 'The Body', color: '#f87171', feeds: 'Training and pushing physical limits' },
    reps: [
      { title: 'Train', target: '45 min', intent: 'In the morning, I train hard for 45 minutes.', xp: 30, hard: true },
      { title: 'Cold shower', target: '2 min', intent: 'After my workout, I take a cold shower.', xp: 25, hard: true },
    ],
  },
  {
    id: 'discipline', name: 'Discipline', icon: '🧘', tagline: 'Focus & stillness',
    identity: { id: 'monk', name: 'The Monk', rank: 'Discipline', color: '#60a5fa', feeds: 'Resisting the scroll and sitting with discomfort' },
    reps: [
      { title: 'Meditate', target: '10 min', intent: 'First thing, I sit in silence for 10 minutes.', xp: 20 },
      { title: 'No-scroll morning', target: 'until noon', intent: 'I do not touch the feed before noon.', xp: 25, hard: true },
    ],
  },
  {
    id: 'craft', name: 'Craft', icon: '🛠️', tagline: 'Deep work & building',
    identity: { id: 'builder', name: 'The Builder', rank: 'The Craft', color: '#a78bfa', feeds: 'Deep work and shipping' },
    reps: [
      { title: 'Deep work block', target: '90 min', intent: 'Before noon, I do one 90-minute deep work block.', xp: 30, hard: true },
      { title: 'Ship one thing', target: '1 thing', intent: 'Each day, I ship one concrete thing.', xp: 25 },
    ],
  },
  {
    id: 'money', name: 'Money', icon: '💰', tagline: 'Business & wealth',
    identity: { id: 'founder', name: 'The Founder', rank: 'The Business', color: '#fbbf24', feeds: 'Growing income and the business' },
    reps: [
      { title: 'Move the business forward', target: '1 needle-mover', intent: 'Each morning, I do the one task that grows income.', xp: 30 },
      { title: 'Study money', target: '15 min', intent: 'In the evening, I learn one money or business principle.', xp: 20 },
    ],
  },
  {
    id: 'strategy', name: 'Strategy', icon: '♟️', tagline: 'The game & influence',
    identity: { id: 'strategist', name: 'The Strategist', rank: 'The Game', color: '#34d399', feeds: 'Chess, influence, and seeing the board' },
    reps: [
      { title: 'Chess', target: '3 games', intent: 'At lunch, I play 3 focused games.', xp: 15 },
      { title: 'Study influence', target: '15 min', intent: 'In the evening, I learn one principle of persuasion.', xp: 20 },
    ],
  },
  {
    id: 'language', name: 'Language', icon: '🗣️', tagline: 'Fluency & words',
    identity: { id: 'polyglot', name: 'The Polyglot', rank: 'Language', color: '#22d3ee', feeds: 'Daily language practice' },
    reps: [
      { title: 'Language practice', target: '15 min', intent: 'Right after dinner, I practice my language for 15 minutes.', xp: 20 },
    ],
  },
];

export function focusById(id) { return FOCUS_AREAS.find(a => a.id === id); }

// Turn a set of chosen area ids into the identities + reps + identXp the app seeds.
// Falls back to the first three areas if nothing was chosen.
export function buildFromFocus(areaIds) {
  const chosen = FOCUS_AREAS.filter(a => (areaIds || []).includes(a.id));
  const list = chosen.length ? chosen : FOCUS_AREAS.slice(0, 3);
  const identities = list.map(a => ({ ...a.identity }));
  const quests = [];
  list.forEach(a => a.reps.forEach((r, i) => quests.push({
    id: `q_${a.identity.id}_${i}`,
    title: r.title, ident: a.identity.id, target: r.target || '',
    intent: r.intent, xp: r.xp || 20, hard: !!r.hard,
  })));
  const identXp = {};
  identities.forEach(i => { identXp[i.id] = 0; });
  return { identities, quests, identXp, focus: list.map(a => a.id) };
}
