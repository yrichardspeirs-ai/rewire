// views/progress.js — the long view: momentum, streaks, reflections.

import { getState, dayStreak, totalRepsDone } from '../state.js';
import { ds, dowShort, prettyDate, levelFromXp, esc } from '../utils.js';

export function progress() {
  const S = getState();
  const total = S.quests.length || 1;

  // 7-day momentum
  let week = '';
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const k = ds(dt);
    const done = (S.history[k] && S.history[k].done.length) || 0;
    const frac = Math.min(1, done / total);
    const bg = done ? `rgba(249,115,22,${0.22 + frac * 0.78})` : 'rgba(255,255,255,0.05)';
    week += `<div class="day ${i === 0 ? 'today' : ''}">
      <div class="cell" style="background:${bg};color:${done ? '#1a0f06' : 'transparent'}">${done || ''}</div>
      <div class="dl">${dowShort(k)[0]}</div></div>`;
  }

  // per-rep streaks
  const streaks = S.quests
    .map(q => `<div class="streak-row"><span>${esc(q.title)}</span>
      <span class="sv ${q.streak ? '' : 'zero'}">${'\u{1F525}'} ${q.streak || 0}</span></div>`).join('');

  // reflection history (most recent first, excluding empty)
  const refs = Object.keys(S.history)
    .filter(k => S.history[k].reflection && S.history[k].reflection.trim())
    .sort().reverse().slice(0, 8)
    .map(k => `<div class="ref-row"><span class="ref-date">${prettyDate(k)}</span>
      <span class="ref-txt">${esc(S.history[k].reflection)}</span></div>`).join('')
    || `<div class="empty">No reflections yet. Add one on the Today page tonight.</div>`;

  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">The long game</div>
        <h2>Progress</h2>
      </div>
    </div>

    <div class="stat-grid four">
      <div class="card sstat"><div class="n ember">${levelFromXp(S.totalXp)}</div><div class="l">Level</div></div>
      <div class="card sstat"><div class="n">${S.totalXp.toLocaleString()}</div><div class="l">Total XP</div></div>
      <div class="card sstat"><div class="n gold">${dayStreak()}</div><div class="l">Day Streak</div></div>
      <div class="card sstat"><div class="n">${totalRepsDone()}</div><div class="l">Reps Done</div></div>
    </div>

    <div class="prog-grid">
      <div class="card">
        <h3>Momentum</h3>
        <p class="muted">Last 7 days. Don't break the chain.</p>
        <div class="week">${week}</div>
      </div>
      <div class="card">
        <h3>Active streaks</h3>
        <p class="muted">Per rep. Loss aversion keeps these alive.</p>
        <div class="streak-list">${streaks}</div>
      </div>
    </div>

    <div class="section-label">Reflection log</div>
    <div class="card ref-card-list">${refs}</div>`;
}
