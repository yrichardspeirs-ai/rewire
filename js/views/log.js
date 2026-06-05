// views/log.js — the Log: daily nutrition, body (weight + workouts), and custom
// self-rating metrics. All local, all editable. No AI scan needed to use it.

import { getState, nutritionToday } from '../state.js';
import { esc, prettyDate, todayStr } from '../utils.js';

function calRing(consumed, target) {
  const frac = target ? Math.min(1, consumed / target) : 0;
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - frac);
  const over = consumed > target && target > 0;
  return `
    <div class="ring-wrap">
      <svg viewBox="0 0 120 120" class="ring">
        <circle cx="60" cy="60" r="${r}" class="ring-bg"/>
        <circle cx="60" cy="60" r="${r}" class="ring-fg ${over ? 'over' : ''}" style="stroke-dasharray:${c.toFixed(1)};stroke-dashoffset:${off.toFixed(1)}"/>
      </svg>
      <div class="ring-center"><div class="ring-pct">${Math.round(consumed)}</div><div class="ring-sub">/ ${target} kcal</div></div>
    </div>`;
}

function macroBar(label, val, target, color) {
  const pct = target ? Math.min(100, Math.round(val / target * 100)) : 0;
  return `<div class="macro">
    <div class="macro-top"><span>${label}</span><span>${Math.round(val)} / ${target}g</span></div>
    <div class="macro-bar"><span style="width:${pct}%;background:${color}"></span></div></div>`;
}

function sparkline(weights) {
  const pts = weights.slice(-21);
  if (pts.length < 2) return `<div class="muted small">Log a few days to see your trend.</div>`;
  const vals = pts.map(w => w.kg); const min = Math.min(...vals), max = Math.max(...vals); const span = (max - min) || 1;
  const W = 280, H = 56;
  const poly = pts.map((w, i) => `${(i / (pts.length - 1) * W).toFixed(1)},${(H - ((w.kg - min) / span) * (H - 8) - 4).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${poly}"/></svg>`;
}

export function log() {
  const S = getState();
  const { items, sum, targets } = nutritionToday();
  const remaining = Math.max(0, targets.kcal - sum.kcal);

  const foodList = items.length
    ? items.slice().reverse().map(it => `
        <div class="food-row">
          <span class="food-name">${esc(it.name)}</span>
          <span class="food-macros">${Math.round(it.kcal)} kcal · ${Math.round(it.protein)}P ${Math.round(it.carbs)}C ${Math.round(it.fat)}F</span>
          <button class="food-del" data-action="del-food" data-ts="${it.ts}" aria-label="remove">✕</button>
        </div>`).join('')
    : `<div class="empty">Nothing logged today. Add your first meal below.</div>`;

  const weights = S.body.weights || [];
  const latest = weights[weights.length - 1];
  const workouts = S.body.workouts || [];
  const wkList = workouts.length
    ? workouts.slice(0, 6).map(w => `<div class="wk-row"><span class="wk-name">${esc(w.name)}</span><span class="muted small">${w.minutes ? w.minutes + 'm · ' : ''}${prettyDate(w.date)}</span></div>`).join('')
    : `<div class="empty">No workouts logged yet.</div>`;

  const tm = S.metrics.log[todayStr()] || {};
  const metricRows = S.metrics.defs.map(m => {
    const val = tm[m.id] || 0;
    const dots = [1, 2, 3, 4, 5].map(n => `<button class="mdot ${n <= val ? 'on' : ''}" data-action="set-metric" data-id="${m.id}" data-val="${n}" aria-label="${n}"></button>`).join('');
    return `<div class="metric-row">
      <span class="metric-label">${m.emoji} ${esc(m.label)}</span>
      <div class="mdots">${dots}</div>
      <button class="metric-del" data-action="del-metric" data-id="${m.id}" aria-label="remove">✕</button>
    </div>`;
  }).join('');

  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">Track the body</div>
        <h2>Log</h2>
      </div>
    </div>

    <div class="section-label">Nutrition</div>
    <div class="card log-nutrition">
      <div class="nutri-top">
        ${calRing(sum.kcal, targets.kcal)}
        <div class="nutri-macros">
          <div class="nutri-remain"><b>${remaining}</b> kcal left</div>
          ${macroBar('Protein', sum.protein, targets.protein, 'var(--green)')}
          ${macroBar('Carbs', sum.carbs, targets.carbs, 'var(--ember-soft)')}
          ${macroBar('Fat', sum.fat, targets.fat, 'var(--gold)')}
        </div>
      </div>
      <div class="goals-row">Goals:
        <span class="g-edit" contenteditable="true" spellcheck="false" data-action="edit-goal" data-key="kcal">${targets.kcal}</span>kcal ·
        <span class="g-edit" contenteditable="true" spellcheck="false" data-action="edit-goal" data-key="protein">${targets.protein}</span>P ·
        <span class="g-edit" contenteditable="true" spellcheck="false" data-action="edit-goal" data-key="carbs">${targets.carbs}</span>C ·
        <span class="g-edit" contenteditable="true" spellcheck="false" data-action="edit-goal" data-key="fat">${targets.fat}</span>F
      </div>
      <div class="food-list">${foodList}</div>
      <div class="food-add">
        <input id="food-name" class="t" placeholder="Food">
        <input id="food-kcal" class="n" type="number" inputmode="numeric" placeholder="kcal">
        <input id="food-p" class="n" type="number" inputmode="numeric" placeholder="P">
        <input id="food-c" class="n" type="number" inputmode="numeric" placeholder="C">
        <input id="food-f" class="n" type="number" inputmode="numeric" placeholder="F">
        <button data-action="add-food">Add</button>
      </div>
    </div>

    <div class="section-label">Body</div>
    <div class="card log-body">
      <div class="bw-head">
        <div class="bw-now">${latest ? latest.kg : '—'}<span>${latest ? ' kg' : ''}</span></div>
        ${sparkline(weights)}
      </div>
      <div class="add-row">
        <input id="weight-in" class="n wide" type="number" step="0.1" inputmode="decimal" placeholder="Today's weight">
        <button data-action="log-weight">Log weight</button>
      </div>
      <div class="add-row">
        <input id="wk-name" class="t" placeholder="Workout (e.g. Push day)">
        <input id="wk-min" class="n" type="number" inputmode="numeric" placeholder="min">
        <button data-action="log-workout">Log workout</button>
      </div>
      <div class="wk-list">${wkList}</div>
    </div>

    <div class="section-label">Daily check-in</div>
    <div class="card log-metrics">
      <p class="muted small">Rate where you're at today. Watch the trend, not the day.</p>
      ${metricRows}
      <div class="add-row">
        <input id="add-metric" class="t" maxlength="24" placeholder="Add a metric (e.g. Discipline)">
        <button data-action="add-metric">+ Add</button>
      </div>
    </div>`;
}
