// views/resist.js — the anti-doomscroll core, with stats and a log.

import { getState, reclaimedMinutes } from '../state.js';
import { fmtMins, prettyDate } from '../utils.js';

export function resist() {
  const S = getState();
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
        <div class="eyebrow">Discipline</div>
        <h2>Resist the scroll</h2>
      </div>
    </div>

    <div class="card resist-hero">
      <h3>Don't fight it with willpower. Redirect it.</h3>
      <p class="muted">When the urge hits, tap below. You'll get one specific two-minute swap pulled from your
        own undone reps. Logging the win is what makes resisting feel like winning instead of depriving.</p>
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
