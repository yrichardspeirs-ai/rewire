// state.js — single source of truth. Holds data, persists to localStorage,
// and exposes actions. Views never touch storage directly; they call these.

import { todayStr, shift, levelFromXp, identLevel, rankFromXp, addDays, dayDiff } from './utils.js';
import { ACHIEVEMENTS } from './achievements.js';

// Grit-style time-boxed challenges. Miss a required day and it's over (unless you
// have a flex day banked). req: 'all' = every rep that day, 'hard' = only hard reps.
export const CHALLENGE_PRESETS = [
  { id: 'iron7',   name: 'Iron Week',    icon: '⚔️', days: 7,  flex: 0, req: 'all',  tier: 'Starter',  blurb: '7 days. Every rep. Zero misses. A clean test of will.' },
  { id: 'forge14', name: 'Forge 14',     icon: '🔨', days: 14, flex: 1, req: 'all',  tier: 'Beginner', blurb: 'Two weeks. One flex day for when life truly hits.' },
  { id: 'hard30',  name: '30 Days Hard', icon: '🪨', days: 30, flex: 0, req: 'hard', tier: 'Hard',     blurb: 'A month of only your hard things. No flex. No mercy.' },
  { id: 'titan75', name: '75 Titan',     icon: '🗿', days: 75, flex: 2, req: 'all',  tier: 'Elite',    blurb: '75 days, the full forge. Two flex days — spend them wisely.' },
];

// Default identity roster — seeds new users. Editable copies live in state.identities.
export const IDENTITIES = [
  { id: 'scholar',    name: 'The Scholar',    rank: 'Knowledge',    color: '#fb923c', feeds: 'Reading and studying the brain' },
  { id: 'strategist', name: 'The Strategist', rank: 'The Game',     color: '#a78bfa', feeds: 'Chess and influence' },
  { id: 'polyglot',   name: 'The Polyglot',   rank: 'Language',     color: '#34d399', feeds: 'French practice' },
  { id: 'founder',    name: 'The Founder',    rank: 'The Business',  color: '#fbbf24', feeds: 'Growing NEXUS' },
  { id: 'monk',       name: 'The Monk',       rank: 'Discipline',   color: '#60a5fa', feeds: 'Resisting the scroll' },
];
const clone = x => JSON.parse(JSON.stringify(x));

const DEFAULT_QUESTS = [
  { id: 'q_read',   title: 'Read',                        ident: 'scholar',    target: '20 min',        intent: 'After my morning coffee, I read for 20 minutes.', xp: 20 },
  { id: 'q_brain',  title: 'Study the brain & physiology', ident: 'scholar',    target: '15 min',        intent: 'At lunch, I study how the mind and body work for 15 minutes.', xp: 20 },
  { id: 'q_influ',  title: 'Influence & persuasion',      ident: 'strategist', target: '15 min',        intent: 'In the evening, I learn one principle of human influence.', xp: 20 },
  { id: 'q_chess',  title: 'Chess',                       ident: 'strategist', target: '3 puzzles',     intent: 'Before bed, I play one focused chess session.', xp: 20 },
  { id: 'q_french', title: 'French',                      ident: 'polyglot',   target: '15 min',        intent: 'Right after dinner, I practice French for 15 minutes.', xp: 20 },
  { id: 'q_biz',    title: 'Move NEXUS forward',          ident: 'founder',    target: '1 needle-mover', intent: 'Each morning, I do the one task that grows the business.', xp: 30 },
];

const KEY = 'rewire:state';
const URGE_MINUTES = 8; // assumed minutes reclaimed per resisted urge

function defaultState() {
  return {
    name: 'Richard',
    start: todayStr(),
    onboarded: false,   // new users go through the setup + commitment contract
    why: '',            // your purpose / what fuels you (Armored Mind)
    nemesis: '',        // the doubter you're proving wrong (Taking Souls)
    identities: clone(IDENTITIES),
    quests: clone(DEFAULT_QUESTS),
    identXp: { scholar: 0, strategist: 0, polyglot: 0, founder: 0, monk: 0 },
    totalXp: 0,
    hardDone: 0,        // cumulative "hard thing" reps completed (Calloused Mind)
    scroll: { resisted: 0, gaveIn: 0, run: 0, log: [] },
    history: {}, // 'YYYY-MM-DD' -> { done: [ids], reflection: '' }
    awards: {},  // 'YYYY-MM-DD' -> { questId: xpAwarded }
    achievements: {}, // achievementId -> unlocked date
    challenge: null,   // active/most-recent challenge (Grit-style). null = none.
    challengesWon: 0,  // cumulative completed challenges
    settings: { sound: false, haptics: true, motion: true, tone: 'clean' },
  };
}

function migrate(p) {
  const d = defaultState();
  const s = Object.assign(d, p);
  // existing users (saved state with no onboarded flag) skip mandatory onboarding
  s.onboarded = (p.onboarded !== undefined) ? p.onboarded : true;
  s.why = p.why || '';
  s.nemesis = p.nemesis || '';
  s.identities = (p.identities && p.identities.length) ? p.identities : clone(IDENTITIES);
  s.identXp = Object.assign({ scholar: 0, strategist: 0, polyglot: 0, founder: 0, monk: 0 }, p.identXp || {});
  s.hardDone = p.hardDone || 0;
  s.scroll = Object.assign({ resisted: 0, gaveIn: 0, run: 0, log: [] }, p.scroll || {});
  s.history = p.history || {};
  s.awards = p.awards || {};
  s.achievements = p.achievements || {};
  s.challenge = p.challenge || null;
  s.challengesWon = p.challengesWon || 0;
  s.settings = Object.assign({ sound: false, haptics: true, motion: true, tone: 'clean' }, p.settings || {});
  s.quests = (p.quests && p.quests.length) ? p.quests : clone(DEFAULT_QUESTS);
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* corrupt or unavailable: fall through */ }
  return defaultState();
}

let S = load();

// --- change + effect subscriptions ---------------------------------------
const renderListeners = [];
const fxListeners = [];
export function onChange(cb) { renderListeners.push(cb); }
export function onFx(cb) { fxListeners.push(cb); }
function fx(payload) { fxListeners.forEach(f => f(payload)); }

let saveTimer;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }, 200);
}
function emit() { persist(); renderListeners.forEach(f => f()); }

// --- read helpers ---------------------------------------------------------
export function getState() { return S; }
export function isDone(q) { return q.lastDone === todayStr(); }
export function getIdentities() { return (S.identities && S.identities.length) ? S.identities : IDENTITIES; }
export function identById(id) { return getIdentities().find(i => i.id === id); }

export function dayStreak() {
  let n = 0; const cur = new Date();
  if (!(S.history[todayStr()] && S.history[todayStr()].done.length)) cur.setDate(cur.getDate() - 1);
  for (let i = 0; i < 600; i++) {
    const k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (S.history[k] && S.history[k].done.length) { n++; cur.setDate(cur.getDate() - 1); } else break;
  }
  return n;
}

export function totalRepsDone() {
  return Object.values(S.history).reduce((sum, h) => sum + ((h.done && h.done.length) || 0), 0);
}

export function reclaimedMinutes() { return S.scroll.resisted * URGE_MINUTES; }

// --- achievements ---------------------------------------------------------
function achievementMetrics() {
  return {
    streak: dayStreak(),
    totalReps: totalRepsDone(),
    resisted: S.scroll.resisted,
    level: levelFromXp(S.totalXp),
    hardDone: S.hardDone || 0,
    bestRepStreak: S.quests.reduce((m, q) => Math.max(m, q.streak || 0), 0),
    cleanRun: S.scroll.run || 0,
    challengesWon: S.challengesWon || 0,
  };
}
// Unlock any newly-earned achievements; emits a takeover-worthy fx event each.
function checkAchievements() {
  const m = achievementMetrics();
  ACHIEVEMENTS.forEach(a => {
    if (!S.achievements[a.id] && a.test(m)) {
      S.achievements[a.id] = todayStr();
      fx({ type: 'achievement', id: a.id, name: a.name, icon: a.icon, desc: a.desc });
    }
  });
}

export function pickSwap() {
  const undone = S.quests.filter(q => !isDone(q));
  const pool = undone.length ? undone : S.quests;
  if (!pool.length) return 'Read one page.';
  const p = pool[Math.floor(Math.random() * pool.length)];
  return p.title + (p.target ? ' — ' + p.target : '');
}

// --- actions --------------------------------------------------------------
export function toggleQuest(id) {
  const q = S.quests.find(x => x.id === id); if (!q) return;
  const t = todayStr();
  if (q.lastDone === t) { // un-complete (mistap)
    const aw = (S.awards[t] && S.awards[t][id]) || 0;
    S.totalXp = Math.max(0, S.totalXp - aw);
    S.identXp[q.ident] = Math.max(0, (S.identXp[q.ident] || 0) - aw);
    if (S.awards[t]) delete S.awards[t][id];
    if (S.history[t]) S.history[t].done = (S.history[t].done || []).filter(x => x !== id);
    if (q.hard) S.hardDone = Math.max(0, (S.hardDone || 0) - 1);
    q.lastDone = q.prevDone || null;
    q.streak = Math.max(0, (q.streak || 1) - 1);
    emit(); return;
  }
  // complete
  q.prevDone = q.lastDone || null;
  q.streak = (q.lastDone === shift(-1)) ? (q.streak || 0) + 1 : 1;
  q.lastDone = t;
  const crit = Math.random() < 0.15;            // variable reward
  const award = crit ? q.xp * 2 : q.xp;
  // snapshot levels before the award so we can detect a level/rank-up
  const oldLevel = levelFromXp(S.totalXp);
  const oldRank = identLevel(S.identXp[q.ident] || 0);
  const oldLadder = rankFromXp(S.totalXp).idx;
  S.totalXp += award;
  S.identXp[q.ident] = (S.identXp[q.ident] || 0) + award;
  if (q.hard) S.hardDone = (S.hardDone || 0) + 1;
  S.awards[t] = S.awards[t] || {}; S.awards[t][id] = award;
  S.history[t] = S.history[t] || { done: [], reflection: (S.history[t] && S.history[t].reflection) || '' };
  if (!S.history[t].done.includes(id)) S.history[t].done.push(id);
  const idn = identById(q.ident);
  fx({ xp: award, label: crit ? 'CRITICAL REP' : '+ ' + (idn ? idn.name : ''), crit });
  // milestone events (rendered as full-screen takeovers by the UI layer)
  const newRank = identLevel(S.identXp[q.ident]);
  if (newRank > oldRank) fx({ type: 'rankup', ident: q.ident, level: newRank });
  const newLevel = levelFromXp(S.totalXp);
  if (newLevel > oldLevel) fx({ type: 'levelup', level: newLevel });
  const newLadder = rankFromXp(S.totalXp);
  if (newLadder.idx > oldLadder) fx({ type: 'rankladder', name: newLadder.rank.name, color: newLadder.rank.color });
  checkAchievements();
  syncChallenge(); // a completing rep may finish (or, on un-complete, never un-finishes) a challenge
  emit();
}

export function addQuest(title, intent, ident) {
  if (!title) return;
  S.quests.push({ id: 'q_' + Date.now(), title, ident: ident || 'scholar', target: '', intent: intent || 'When ___, I will do this.', xp: 20, custom: true });
  emit();
}
export function delQuest(id) { S.quests = S.quests.filter(x => x.id !== id); emit(); }

export function editQuestField(id, field, value) {
  const q = S.quests.find(x => x.id === id); if (!q) return;
  q[field] = value;
  persist(); // no re-render: the DOM already shows the edit
}

export function resolveUrge(resisted) {
  if (resisted) {
    S.scroll.resisted++; S.scroll.run++;
    S.identXp.monk += URGE_MINUTES;
    S.totalXp += URGE_MINUTES;
    fx({ xp: URGE_MINUTES, label: '+ The Monk', crit: false });
  } else {
    S.scroll.gaveIn++; S.scroll.run = 0;
  }
  S.scroll.log.unshift({ date: todayStr(), ts: Date.now(), resisted });
  S.scroll.log = S.scroll.log.slice(0, 40);
  if (resisted) checkAchievements();
  emit();
}

export function saveReflection(v) {
  const t = todayStr();
  S.history[t] = S.history[t] || { done: [], reflection: '' };
  S.history[t].reflection = v;
  persist(); // no re-render: keeps the textarea cursor steady
}

export function setName(v) { S.name = (v || '').trim() || S.name; emit(); }

export function setSetting(key, val) {
  S.settings = S.settings || {};
  S.settings[key] = val;
  emit();
}

// --- onboarding / personalization -----------------------------------------
export function completeOnboarding(data) {
  if (data) {
    if (data.name) S.name = data.name.trim() || S.name;
    if (data.why != null) S.why = data.why.trim();
    if (data.nemesis != null) S.nemesis = data.nemesis.trim();
  }
  S.onboarded = true;
  S.committedOn = todayStr();
  emit();
}
export function resetOnboarding() { S.onboarded = false; emit(); }
export function setWhy(v) { S.why = (v || '').trim(); emit(); }
export function setNemesis(v) { S.nemesis = (v || '').trim(); emit(); }

export function editIdentity(id, field, value) {
  const i = getIdentities().find(x => x.id === id); if (!i) return;
  i[field] = value;
  persist(); // inline edit; DOM already shows it
}

export function toggleQuestHard(id) {
  const q = S.quests.find(x => x.id === id); if (!q) return;
  q.hard = !q.hard;
  emit();
}

// --- challenges (Grit-style hard-fail programs) ---------------------------
export function startChallenge(presetId) {
  const p = CHALLENGE_PRESETS.find(x => x.id === presetId); if (!p) return;
  let reqIds = p.req === 'hard' ? S.quests.filter(q => q.hard).map(q => q.id) : S.quests.map(q => q.id);
  if (!reqIds.length) reqIds = S.quests.map(q => q.id); // fallback: a "hard" challenge with no hard reps requires all
  S.challenge = { id: p.id, name: p.name, icon: p.icon, days: p.days, flex: p.flex, reqIds, start: todayStr(), status: 'active' };
  emit();
}
export function endChallenge() { S.challenge = null; emit(); } // abandon active OR clear a finished one

// Pure: derive the full state of the active challenge from history. No mutation.
export function challengeProgress() {
  const c = S.challenge; if (!c) return null;
  const today = todayStr();
  const reqIds = c.reqIds || [];
  const todayIdx = dayDiff(c.start, today);          // 0-based index of today within the window
  const dayStates = [];
  const missIdx = [];
  let doneDays = 0, todayDoneCount = 0, todayComplete = false;
  for (let i = 0; i < c.days; i++) {
    const d = addDays(c.start, i);
    if (i > todayIdx) { dayStates.push({ date: d, state: 'future' }); continue; }
    const done = (S.history[d] && S.history[d].done) || [];
    const allDone = reqIds.length > 0 && reqIds.every(id => done.includes(id));
    if (i === todayIdx) {
      todayDoneCount = reqIds.filter(id => done.includes(id)).length;
      todayComplete = allDone;
      if (allDone) { doneDays++; dayStates.push({ date: d, state: 'done' }); }
      else dayStates.push({ date: d, state: 'today' });
    } else if (allDone) { doneDays++; dayStates.push({ date: d, state: 'done' }); }
    else { missIdx.push(dayStates.length); dayStates.push({ date: d, state: 'miss' }); }
  }
  // The first `flex` misses are forgiven (shown gold); the rest are fatal.
  missIdx.slice(0, c.flex).forEach(i => { dayStates[i].state = 'flex'; });
  const flexUsed = Math.min(missIdx.length, c.flex);
  const flexLeft = Math.max(0, c.flex - missIdx.length);
  const fatal = missIdx.slice(c.flex).map(i => dayStates[i].date);
  const dayNumber = Math.min(todayIdx + 1, c.days);
  let status = 'active';
  if (fatal.length) status = 'failed';
  else if (todayIdx + 1 > c.days) status = 'completed';
  else if (todayIdx + 1 === c.days && todayComplete) status = 'completed';
  return {
    c, dayStates, dayNumber, totalDays: c.days, doneDays,
    flexUsed, flexLeft, flexTotal: c.flex, reqCount: reqIds.length,
    todayComplete, todayDoneCount, status, firstFatalMiss: fatal[0] || null,
    pct: Math.round(Math.min(1, doneDays / c.days) * 100),
  };
}

// Side-effecting: detect a win/fail transition once, celebrate, and lock it in.
// Safe to call on app load (failures happen by the passage of time, not an action).
export function syncChallenge() {
  const c = S.challenge; if (!c || c.status !== 'active') return;
  const p = challengeProgress(); if (!p) return;
  if (p.status === 'failed') {
    c.status = 'failed'; c.endedOn = todayStr(); c.failedOn = p.firstFatalMiss;
    fx({ type: 'challengefail', name: c.name });
    persist();
  } else if (p.status === 'completed') {
    c.status = 'completed'; c.endedOn = todayStr();
    S.challengesWon = (S.challengesWon || 0) + 1;
    checkAchievements();
    fx({ type: 'challengewin', name: c.name, icon: c.icon, days: c.days });
    persist();
  }
}
