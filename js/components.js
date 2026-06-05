// components.js — small HTML-building helpers reused across views.

import { esc, identProgress } from './utils.js';
import { IDENTITIES, identById, isDone, getState } from './state.js';

// A single rep row. `editable` adds inline editing + delete (used on the Reps page).
export function repCard(q, editable = false) {
  const idn = identById(q.ident);
  const col = idn ? idn.color : '#f97316';
  const done = isDone(q);
  const st = q.streak || 0;

  const identControl = editable
    ? `<select class="q-ident-select" data-action="edit-ident" data-id="${q.id}">
         ${IDENTITIES.map(i => `<option value="${i.id}" ${i.id === q.ident ? 'selected' : ''}>${i.name}</option>`).join('')}
       </select>`
    : `<span class="q-tag">${idn ? idn.name : ''}</span>`;

  const title = editable
    ? `<span class="q-title editable" contenteditable="true" spellcheck="false" data-action="edit-title" data-id="${q.id}">${esc(q.title)}</span>`
    : `<span class="q-title">${esc(q.title)}</span>`;

  const target = editable
    ? `<span class="q-target editable" contenteditable="true" spellcheck="false" data-action="edit-target" data-id="${q.id}">${esc(q.target || 'set target')}</span>`
    : (q.target ? `<span class="q-target">${esc(q.target)}</span>` : '');

  const intent = editable
    ? `<div class="q-intent editable" contenteditable="true" spellcheck="false" data-action="edit-intent" data-id="${q.id}">${esc(q.intent)}</div>`
    : `<div class="q-intent">${esc(q.intent)}</div>`;

  return `
    <div class="quest ${done ? 'done' : ''}" style="--qc:${col}">
      ${editable ? '' : `<button class="check" data-action="toggle" data-id="${q.id}" aria-label="complete">
        <svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg></button>`}
      <div class="q-body">
        <div class="q-top">${title} ${identControl} ${target}</div>
        ${intent}
      </div>
      <div class="q-right">
        <span class="streak ${st ? '' : 'zero'}"><span class="flame">${'\u{1F525}'}</span>${st}</span>
        <span class="q-xp">+${q.xp} xp</span>
      </div>
      ${editable ? `<button class="q-del" data-action="del-rep" data-id="${q.id}" title="remove">\u2715</button>` : ''}
    </div>`;
}

export function identityCard(id, delay = 0) {
  const i = IDENTITIES.find(x => x.id === id) || IDENTITIES[0];
  const xp = getState().identXp[i.id] || 0;
  const p = identProgress(xp);
  return `
    <div class="ident" style="--ic:${i.color};animation-delay:${delay}s">
      <div class="ihead"><span class="iname">${i.name}</span><span class="ilvl">LV ${p.lvl}</span></div>
      <div class="irank">${i.rank}</div>
      <div class="bar"><span style="width:${p.pct}%"></span></div>
      <div class="ifoot"><span>${xp} XP</span><span>${p.next} to rank up</span></div>
    </div>`;
}

// SVG progress ring for "today complete".
export function ring(done, total) {
  const frac = total ? done / total : 0;
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - frac);
  const pct = Math.round(frac * 100);
  return `
    <div class="ring-wrap">
      <svg viewBox="0 0 120 120" class="ring">
        <circle cx="60" cy="60" r="${r}" class="ring-bg"/>
        <circle cx="60" cy="60" r="${r}" class="ring-fg" style="stroke-dasharray:${c};stroke-dashoffset:${off}"/>
      </svg>
      <div class="ring-center"><div class="ring-pct">${pct}%</div><div class="ring-sub">${done}/${total} reps</div></div>
    </div>`;
}
