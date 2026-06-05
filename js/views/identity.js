// views/identity.js — who you are becoming. Identity-based change, made visible & editable.

import { getIdentities, getState } from '../state.js';
import { identProgress, esc } from '../utils.js';

export function identity() {
  const S = getState();
  const cards = getIdentities().map((i, k) => {
    const xp = S.identXp[i.id] || 0;
    const p = identProgress(xp);
    return `
      <div class="ident big" style="--ic:${i.color};animation-delay:${k * 0.05}s">
        <div class="ihead">
          <span class="iname editable" contenteditable="true" spellcheck="false" data-action="edit-ident-name" data-id="${i.id}">${esc(i.name)}</span>
          <span class="ilvl">LV ${p.lvl}</span>
        </div>
        <div class="irank editable" contenteditable="true" spellcheck="false" data-action="edit-ident-rank" data-id="${i.id}">${esc(i.rank)}</div>
        <div class="bar"><span style="width:${p.pct}%"></span></div>
        <div class="ifoot"><span>${xp} XP</span><span>${p.next} to rank up</span></div>
        <div class="ifeeds">Fed by: <span class="editable" contenteditable="true" spellcheck="false" data-action="edit-ident-feeds" data-id="${i.id}">${esc(i.feeds)}</span></div>
      </div>`;
  }).join('');

  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">Who you're becoming</div>
        <h2>You</h2>
      </div>
    </div>

    <div class="card why-card">
      <h3>Your why</h3>
      <p class="muted">When it gets hard — and it will — this is the reason you don't fold. Write it raw and
        read it before every session.</p>
      <textarea data-action="edit-why" placeholder="I do this because...">${esc(S.why || '')}</textarea>
      <span class="saved-tag" id="why-saved">saved ✓</span>

      <div class="why-nemesis">
        <h3>Your nemesis</h3>
        <p class="muted">The doubter. The old you. Every rep takes its soul.</p>
        <input class="nemesis-input" data-action="edit-nemesis" maxlength="60" placeholder="the version of me that quits" value="${esc(S.nemesis || '')}">
        <span class="saved-tag" id="nem-saved">saved ✓</span>
      </div>
    </div>

    <p class="lead">You don't sustain behavior that feels like a chore. You sustain behavior that confirms who you
      believe you are. Each rep is a vote. Tap any name, rank, or "fed by" line to make these yours.</p>
    <div class="identities big-grid">${cards}</div>`;
}
