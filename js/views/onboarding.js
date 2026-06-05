// views/onboarding.js — first-run setup, Grit-style. Personalize, then sign the pact.
// Stateless render: app.js owns the step index + draft and re-renders on advance.

import { getState } from '../state.js';
import { esc } from '../utils.js';

export const ONB_STEPS = 6;

export function onboarding(step, draft) {
  const S = getState();
  const d = draft || {};
  const dots = Array.from({ length: ONB_STEPS }, (_, i) =>
    `<span class="onb-dot ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}"></span>`).join('');

  let body = '';
  if (step === 0) {
    body = `
      <div class="onb-kicker">REWIRE</div>
      <h1>This is not a habit tracker.</h1>
      <p>It's a discipline engine. You're going to forge the person you keep saying you'll become —
        one rep, one resisted urge, one hard thing at a time. No motivation. No excuses. Just reps.</p>
      <button class="onb-primary" data-action="onb-next">I'm in</button>
      <div class="onb-trust">
        <span class="ot-item"><b>Free</b><span>forever — no paywall, no account</span></span>
        <span class="ot-item"><b>Private</b><span>your data never leaves this device</span></span>
        <span class="ot-item"><b>Installable</b><span>any phone, works offline</span></span>
      </div>`;
  } else if (step === 1) {
    body = `
      <div class="onb-kicker">Step 1 · Your name</div>
      <h1>What do we call you?</h1>
      <p>This is yours alone. Make it personal.</p>
      <input class="onb-input" id="onb-name" maxlength="40" placeholder="Your name" value="${esc(d.name != null ? d.name : S.name)}">
      <div class="onb-btns"><button class="onb-primary" data-action="onb-next">Continue</button></div>`;
  } else if (step === 2) {
    body = `
      <div class="onb-kicker">Step 2 · Your why</div>
      <h1>Why does this matter?</h1>
      <p>When it gets hard — and it will — this is the reason you don't fold. Write it raw.
        What are you running toward? What darkness are you running from?</p>
      <textarea class="onb-input ta" id="onb-why" maxlength="280" placeholder="I do this because...">${esc(d.why || '')}</textarea>
      <div class="onb-btns"><button class="onb-ghost" data-action="onb-back">Back</button><button class="onb-primary" data-action="onb-next">Continue</button></div>`;
  } else if (step === 3) {
    body = `
      <div class="onb-kicker">Step 3 · Your nemesis</div>
      <h1>Who are you proving wrong?</h1>
      <p>The doubter. The old version of you. The voice that says you'll quit like always.
        Name it — every rep takes its soul. (Optional, but powerful.)</p>
      <input class="onb-input" id="onb-nemesis" maxlength="60" placeholder="e.g. the version of me that quits" value="${esc(d.nemesis || '')}">
      <div class="onb-btns"><button class="onb-ghost" data-action="onb-back">Back</button><button class="onb-primary" data-action="onb-next">Continue</button></div>`;
  } else if (step === 4) {
    body = `
      <div class="onb-kicker">Step 4 · Your reps</div>
      <h1>These are your daily reps.</h1>
      <p>Each one is a vote for an identity. After setup, open <b>Reps</b> and rewrite every if-then plan
        to a <i>real time and place</i> in your day — that one change roughly doubles follow-through.</p>
      <div class="onb-reps">${S.quests.map(q => `<div class="onb-rep"><span>${esc(q.title)}</span><span class="onb-rep-x">+${q.xp}xp</span></div>`).join('')}</div>
      <div class="onb-btns"><button class="onb-ghost" data-action="onb-back">Back</button><button class="onb-primary" data-action="onb-next">Continue</button></div>`;
  } else if (step === 5) {
    body = `
      <div class="onb-kicker">Step 5 · The pact</div>
      <h1>Sign it. Mean it.</h1>
      <p class="onb-pact">I will show up for the reps I set. When my mind says stop, I'll remember that's 40%.
        I will not negotiate with the version of me that quits. Stay hard.</p>
      <button class="onb-commit" data-action="commit-hold">
        <span class="onb-commit-fill"></span>
        <span class="onb-commit-label">Press &amp; hold to commit</span>
      </button>
      <div class="onb-btns"><button class="onb-ghost" data-action="onb-back">Back</button></div>`;
  }

  return `
    <div class="onb-screen">
      <div class="onb-card">
        ${body}
        <div class="onb-dots">${dots}</div>
      </div>
    </div>`;
}
