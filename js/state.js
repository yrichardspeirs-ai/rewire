// state.js — single source of truth. Holds data, persists to localStorage,
// and exposes actions. Views never touch storage directly; they call these.

import { todayStr, shift } from './utils.js';

export const IDENTITIES = [
  { id: 'scholar',    name: 'The Scholar',    rank: 'Knowledge',    color: '#fb923c', feeds: 'Reading and studying the brain' },
  { id: 'strategist', name: 'The Strategist', rank: 'The Game',     color: '#a78bfa', feeds: 'Chess and influence' },
  { id: 'polyglot',   name: 'The Polyglot',   rank: 'Language',     color: '#34d399', feeds: 'French practice' },
  { id: 'founder',    name: 'The Founder',    rank: 'The Business',  color: '#fbbf24', feeds: 'Growing NEXUS' },
  { id: 'monk',       name: 'The Monk',       rank: 'Discipline',   color: '#60a5fa', feeds: 'Resisting the scroll' },
];

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
    quests: JSON.parse(JSON.stringify(DEFAULT_QUESTS)),
    identXp: { scholar: 0, strategist: 0, polyglot: 0, founder: 0, monk: 0 },
    totalXp: 0,
    scroll: { resisted: 0, gaveIn: 0, run: 0, log: [] },
    history: {}, // 'YYYY-MM-DD' -> { done: [ids], reflection: '' }
    awards: {},  // 'YYYY-MM-DD' -> { questId: xpAwarded }
  };
}

function migrate(p) {
  const d = defaultState();
  const s = Object.assign(d, p);
  s.identXp = Object.assign({ scholar: 0, strategist: 0, polyglot: 0, founder: 0, monk: 0 }, p.identXp || {});
  s.scroll = Object.assign({ resisted: 0, gaveIn: 0, run: 0, log: [] }, p.scroll || {});
  s.history = p.history || {};
  s.awards = p.awards || {};
  s.quests = (p.quests && p.quests.length) ? p.quests : JSON.parse(JSON.stringify(DEFAULT_QUESTS));
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
export function identById(id) { return IDENTITIES.find(i => i.id === id); }

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
  S.totalXp += award;
  S.identXp[q.ident] = (S.identXp[q.ident] || 0) + award;
  S.awards[t] = S.awards[t] || {}; S.awards[t][id] = award;
  S.history[t] = S.history[t] || { done: [], reflection: (S.history[t] && S.history[t].reflection) || '' };
  if (!S.history[t].done.includes(id)) S.history[t].done.push(id);
  const idn = identById(q.ident);
  fx({ xp: award, label: crit ? 'CRITICAL REP' : '+ ' + (idn ? idn.name : ''), crit });
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
  emit();
}

export function saveReflection(v) {
  const t = todayStr();
  S.history[t] = S.history[t] || { done: [], reflection: '' };
  S.history[t].reflection = v;
  persist(); // no re-render: keeps the textarea cursor steady
}

export function setName(v) { S.name = (v || '').trim() || S.name; emit(); }
