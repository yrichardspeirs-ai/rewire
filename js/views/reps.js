// views/reps.js — manage the reps themselves: titles, targets, if-then plans.

import { getState } from '../state.js';
import { IDENTITIES } from '../state.js';
import { repCard } from '../components.js';

export function reps() {
  const S = getState();
  return `
    <div class="view-head">
      <div>
        <div class="eyebrow">Your system</div>
        <h2>Reps</h2>
      </div>
    </div>

    <p class="lead">Edit anything inline. The if-then line is the engine: a plan like
      "after my morning coffee, I read for 20 minutes" roughly doubles follow-through versus a vague goal.
      Make every plan name a real time and place in your day.</p>

    <div class="quests editing">${S.quests.map(q => repCard(q, true)).join('')}</div>

    <div class="add-row">
      <input class="t" id="add-title" placeholder="New rep (e.g. Cold shower)">
      <input class="i" id="add-intent" placeholder="If-then: When ___, I will ___">
      <select id="add-ident">
        ${IDENTITIES.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
      </select>
      <button data-action="add-rep">+ Add rep</button>
    </div>`;
}
