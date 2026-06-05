// views/today.js — the daily driver. Clean, focused on what to do today.

import { getState, isDone, dayStreak } from '../state.js';
import { levelFromXp, esc, todayStr } from '../utils.js';
import { repCard, ring } from '../components.js';

export function today() {
  const S = getState();
  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const doneCount = S.quests.filter(isDone).length;
  const reflection = (S.history[todayStr()] && S.history[todayStr()].reflection) || '';

  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">Good ${part}, <b data-action="edit-name" title="click to rename">${esc(S.name)}</b></div>
        <h2>Today</h2>
      </div>
      <div class="head-stats">
        <div class="hstat"><span class="hn ember">${levelFromXp(S.totalXp)}</span><span class="hl">Level</span></div>
        <div class="hstat"><span class="hn">${S.totalXp.toLocaleString()}</span><span class="hl">XP</span></div>
        <div class="hstat"><span class="hn gold">${dayStreak()}</span><span class="hl">Streak</span></div>
      </div>
    </div>

    <div class="today-grid">
      <div class="card ring-card">${ring(doneCount, S.quests.length)}
        <div class="ring-note">${doneCount === S.quests.length && S.quests.length ? 'Full clear. That is who you are now.' : 'Every rep is a vote for who you are becoming.'}</div>
      </div>
      <div class="card resist-cta">
        <div>
          <h3>The urge will come</h3>
          <p>Trade ${'8'} wasted minutes for one rep that compounds.</p>
        </div>
        <button class="urge-btn" data-action="open-urge">I want to scroll</button>
      </div>
    </div>

    <div class="section-label">Today's reps</div>
    <div class="quests">${S.quests.map(q => repCard(q, false)).join('')}</div>

    <div class="card reflect-card">
      <h3>Tonight's reflection</h3>
      <p class="muted">One honest line. What moved, what you dodged.</p>
      <textarea data-action="reflect" placeholder="Today I...">${esc(reflection)}</textarea>
      <span class="saved-tag" id="ref-saved">saved \u2713</span>
    </div>`;
}
