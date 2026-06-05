// views/focus.js — Critique-style "Boost Your Focus". A focus-session timer (hold it
// or get nothing) plus the anti-doomscroll Resist core, all in one place.

import { getState, reclaimedMinutes } from '../state.js';
import { fmtMins, prettyDate } from '../utils.js';
import { RESIST_HERO } from '../copy.js';

const PRESETS = [25, 45, 60];

export function focus() {
  const S = getState();
  const timer = PRESETS.map(m =>
    `<button class="focus-preset" data-action="start-focus" data-min="${m}">${m}<span>min</span></button>`).join('');

  const log = S.scroll.log || [];
  const logHtml = log.length
    ? log.slice(0, 12).map(e => `
        <div class="log-row ${e.resisted ? 'win' : 'slip'}">
          <span class="log-dot"></span>
          <span class="log-txt">${e.resisted ? 'Resisted the urge' : 'Gave in'}</span>
          <span class="log-date">${prettyDate(e.date)}</span>
        </div>`).join('')
    : `<div class="empty">No urges logged yet. The first time you feel the pull, come here and tap the button.</div>`;

  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">Lock in</div>
        <h2>Focus</h2>
      </div>
    </div>

    <div class="card focus-card">
      <h3>Lock in. No exits.</h3>
      <p class="muted">Pick a length and go. No phone, no feed, no switching until the timer dies.
        Hold the whole session and you bank the XP — quit early and you get nothing. That's the deal.</p>
      <div class="focus-presets">${timer}</div>
      <div class="focus-stats">
        <span><b>${S.focusSessions || 0}</b> sessions held</span>
        <span><b>${fmtMins(S.focusMinutes || 0)}</b> locked in</span>
      </div>
    </div>

    <div class="section-label">Box breathing</div>
    <div class="card breath-card">
      <h3>Reset the nervous system.</h3>
      <p class="muted">Four in, hold four, four out, hold four. Three minutes drags you out of fight-or-flight and back
        into control. ${S.breathSessions || 0} sessions held.</p>
      <button class="breath-start" data-action="start-breath">Begin breathing</button>
    </div>

    <div class="section-label">Resist the scroll</div>
    <div class="card resist-hero">
      <h3>Don't fight it with willpower. Willpower loses.</h3>
      <p class="muted">${RESIST_HERO} When the urge hits, tap below — you'll get one specific two-minute swap
        pulled from your own undone reps. Every redirect is a win the algorithm wanted for itself.</p>
      <button class="urge-btn big" data-action="open-urge">I want to scroll</button>
    </div>

    <div class="stat-grid">
      <div class="card sstat"><div class="n ember">${S.scroll.resisted}</div><div class="l">Urges Resisted</div></div>
      <div class="card sstat"><div class="n gold">${S.scroll.run}</div><div class="l">Clean Run</div></div>
      <div class="card sstat"><div class="n">${fmtMins(reclaimedMinutes())}</div><div class="l">Time Reclaimed</div></div>
      <div class="card sstat"><div class="n slip">${S.scroll.gaveIn}</div><div class="l">Slips</div></div>
    </div>

    <div class="section-label">Recent urges</div>
    <div class="card log-card">${logHtml}</div>`;
}
