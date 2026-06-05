// views/today.js — the daily driver. Hard, focused: your orders, your reps, no excuses.

import { getState, isDone, dayStreak, challengeProgress } from '../state.js';
import { levelFromXp, rankFromXp, esc, todayStr } from '../utils.js';
import { repCard, ring, challengeBanner } from '../components.js';
import { coachLine, RING_FULL, RING_PARTIAL, RING_EMPTY, RESIST_CTA, REFLECT_PROMPT } from '../copy.js';

export function today() {
  const S = getState();
  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const doneCount = S.quests.filter(isDone).length;
  const total = S.quests.length;
  const level = levelFromXp(S.totalXp);
  const rank = rankFromXp(S.totalXp).rank;
  const streak = dayStreak();
  const reflection = (S.history[todayStr()] && S.history[todayStr()].reflection) || '';
  const ringNote = !doneCount ? RING_EMPTY : (doneCount === total ? RING_FULL : RING_PARTIAL);

  // Daily Coach context (local, rule-based — no backend).
  const cp = challengeProgress();
  const recent = (S.scroll.log || []).slice(0, 5);
  const slipsRecent = recent.length >= 2 && recent.filter(e => !e.resisted).length > recent.filter(e => e.resisted).length;
  const coach = coachLine({
    doneCount, total, streak, part,
    challengeRisk: !!(cp && cp.c.status === 'active' && !cp.todayComplete),
    challengeName: cp ? cp.c.name : '',
    repsLeft: cp ? Math.max(0, cp.reqCount - cp.todayDoneCount) : 0,
    slipsRecent,
  });

  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">Good ${part}, <b data-action="edit-name" title="click to rename">${esc(S.name)}</b></div>
        <h2>Today</h2>
        <a class="rank-pill" href="#ranks" style="--rc:${rank.color}" title="View the rank ladder"><span class="rp-emblem">◆</span> ${rank.name}</a>
      </div>
      <div class="head-stats">
        <div class="hstat"><span class="hn ember" data-key="level" data-count="${level}">${level}</span><span class="hl">Level</span></div>
        <div class="hstat"><span class="hn xp-target" data-key="xp" data-count="${S.totalXp}">${S.totalXp.toLocaleString()}</span><span class="hl">XP</span></div>
        <div class="hstat"><span class="hn gold" data-key="streak" data-count="${streak}">${streak}</span><span class="hl">Streak</span></div>
      </div>
    </div>

    ${challengeBanner()}

    <div class="coach">
      <div class="coach-head"><span class="coach-badge">Coach</span><span class="coach-kind">${esc(coach.kind)}</span></div>
      <p>${esc(coach.line)}</p>
    </div>

    <div class="today-grid">
      <div class="card ring-card">${ring(doneCount, total)}
        <div class="ring-note">${ringNote}</div>
      </div>
      <div class="card resist-cta">
        <div>
          <h3>The urge will come for you</h3>
          <p>${RESIST_CTA}</p>
        </div>
        <button class="urge-btn" data-action="open-urge">I want to scroll</button>
      </div>
    </div>

    <div class="section-label">Today's reps <a class="edit-link" href="#reps">Edit</a></div>
    <div class="quests">${S.quests.map(q => repCard(q, false)).join('')}</div>

    <div class="card reflect-card">
      <h3>Accountability mirror</h3>
      <p class="muted">${REFLECT_PROMPT}</p>
      <textarea data-action="reflect" placeholder="Today I...">${esc(reflection)}</textarea>
      <span class="saved-tag" id="ref-saved">saved ✓</span>
    </div>`;
}
