// views/identity.js — who you are becoming. Identity-based change, made visible.

import { IDENTITIES, getState } from '../state.js';
import { identProgress, esc } from '../utils.js';

export function identity() {
  const S = getState();
  const cards = IDENTITIES.map((i, k) => {
    const xp = S.identXp[i.id] || 0;
    const p = identProgress(xp);
    return `
      <div class="ident big" style="--ic:${i.color};animation-delay:${k * 0.05}s">
        <div class="ihead"><span class="iname">${i.name}</span><span class="ilvl">LV ${p.lvl}</span></div>
        <div class="irank">${i.rank}</div>
        <div class="bar"><span style="width:${p.pct}%"></span></div>
        <div class="ifoot"><span>${xp} XP</span><span>${p.next} to rank up</span></div>
        <div class="ifeeds">Fed by: ${esc(i.feeds)}</div>
      </div>`;
  }).join('');

  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">Who you're becoming</div>
        <h2>Identity</h2>
      </div>
    </div>
    <p class="lead">You don't sustain behavior that feels like a chore. You sustain behavior that confirms who you
      believe you are. Each rep is a vote. Watch the person you're building take shape.</p>
    <div class="identities big-grid">${cards}</div>`;
}
