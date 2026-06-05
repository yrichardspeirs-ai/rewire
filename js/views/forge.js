// views/forge.js — the Forge: Grit-style time-boxed challenges. Pick one, then
// don't miss. Miss past your flex days and it's over. Consequence over motivation.

import { getState, challengeProgress, CHALLENGE_PRESETS } from '../state.js';
import { esc, prettyDate } from '../utils.js';

function head() {
  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">No participation trophies</div>
        <h2>The Forge</h2>
      </div>
    </div>`;
}

// The preset cards — shown when there's no active challenge (or to start another).
function picker(intro) {
  const cards = CHALLENGE_PRESETS.map(p => `
    <div class="forge-preset" style="--fc:var(--ember)">
      <div class="fp-top">
        <span class="fp-icon">${p.icon}</span>
        <div class="fp-meta">
          <div class="fp-name">${esc(p.name)}</div>
          <div class="fp-sub">${p.days} days · ${p.flex ? p.flex + ' flex day' + (p.flex > 1 ? 's' : '') : 'no flex'} · ${p.req === 'hard' ? 'hard reps only' : 'all reps'}</div>
        </div>
        <span class="fp-tier">${p.tier}</span>
      </div>
      <p class="fp-blurb">${esc(p.blurb)}</p>
      <button class="fp-start" data-action="start-challenge" data-id="${p.id}">Begin ${esc(p.name)}</button>
    </div>`).join('');
  return `
    ${head()}
    <p class="lead">${intro}</p>
    <div class="forge-presets">${cards}</div>`;
}

// 7-per-row day grid: done / miss / flex / today / future.
function dayGrid(dayStates) {
  return `<div class="forge-grid">${dayStates.map((d, i) =>
    `<span class="fg-cell ${d.state}" title="Day ${i + 1} — ${d.state}">${i + 1}</span>`).join('')}</div>`;
}

function flexPips(used, total) {
  if (!total) return `<span class="flex-pips none">No flex days — one miss ends it.</span>`;
  let pips = '';
  for (let i = 0; i < total; i++) pips += `<span class="pip ${i < used ? 'spent' : ''}"></span>`;
  return `<span class="flex-pips">${pips}<em>${total - used} of ${total} flex left</em></span>`;
}

export function forge() {
  const S = getState();
  const c = S.challenge;
  if (!c) return picker('Pick a program. Check off every required rep, every day. Miss more than your flex days allow and the challenge ends — you start over. That stake is the point.');

  const p = challengeProgress();

  // Finished: failed or completed — show the verdict, then offer the next one.
  if (c.status === 'failed') {
    return `
      ${head()}
      <div class="card forge-result failed">
        <div class="fr-icon">💀</div>
        <h3>${esc(c.name)} — Failed</h3>
        <p>You missed past your flex on <b>${c.failedOn ? prettyDate(c.failedOn) : 'a required day'}</b>. No skip passes — that was the deal. ${p.doneDays} of ${c.days} days banked before it broke.</p>
        ${dayGrid(p.dayStates)}
        <p class="fr-line">Failure is data. Start it again — today, not "Monday."</p>
      </div>
      ${picker('Run it back.')}`;
  }
  if (c.status === 'completed') {
    return `
      ${head()}
      <div class="card forge-result won">
        <div class="fr-icon">${c.icon || '🏆'}</div>
        <h3>${esc(c.name)} — Complete</h3>
        <p>${c.days} days. ${p.doneDays} banked${p.flexUsed ? `, ${p.flexUsed} flex used` : ', zero flex used'}. You said you would and you did. That's the whole game.</p>
        ${dayGrid(p.dayStates)}
        <p class="fr-line">Into the Cookie Jar. Now raise the bar.</p>
      </div>
      ${picker('Next forge.')}`;
  }

  // Active.
  const atRisk = !p.todayComplete;
  return `
    ${head()}
    <div class="card forge-active" style="--fc:var(--ember)">
      <div class="fa-top">
        <span class="fa-icon">${c.icon}</span>
        <div class="fa-meta">
          <div class="fa-name">${esc(c.name)}</div>
          <div class="fa-day">Day ${p.dayNumber} of ${c.days}</div>
        </div>
        <div class="fa-pct">${p.pct}%</div>
      </div>
      <div class="fa-bar"><span style="width:${p.pct}%"></span></div>
      <div class="fa-stats">
        <div class="fa-today ${p.todayComplete ? 'ok' : 'risk'}">
          ${p.todayComplete
            ? '✓ Today is banked. Come back tomorrow.'
            : `⚠ ${p.todayDoneCount}/${p.reqCount} required reps done today. Finish them or burn the day.`}
        </div>
        ${flexPips(p.flexUsed, p.flexTotal)}
      </div>
      ${dayGrid(p.dayStates)}
      <button class="fa-abandon" data-action="abandon-challenge">Abandon challenge</button>
    </div>
    <p class="lead">Required reps live on the <a href="#today">Today</a> page. The Forge only watches whether you did them — it doesn't forgive.</p>`;
}
