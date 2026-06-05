// app.js — wires everything together: routing, rendering, and input handling.

import { onChange, onFx, getState, pickSwap, identById,
  toggleQuest, addQuest, delQuest, editQuestField, resolveUrge, saveReflection, setName, setSetting,
  completeOnboarding, setWhy, editIdentity, toggleQuestHard,
  startChallenge, endChallenge, syncChallenge } from './state.js';
import { toast, openUrge, closeModal, takeover, closeTakeover } from './ui.js';
import { burstXP, celebrate, vibrate, sound, syncCounters } from './fx.js';
import { rand, LEVELUP_LINES, RANKUP_LINES } from './copy.js';
import { onboarding, ONB_STEPS } from './views/onboarding.js';
import { today } from './views/today.js';
import { reps } from './views/reps.js';
import { resist } from './views/resist.js';
import { forge } from './views/forge.js';
import { identity } from './views/identity.js';
import { progress } from './views/progress.js';

const VIEWS = { today, reps, resist, forge, identity, progress };
const content = document.getElementById('content');

function currentRoute() {
  const r = location.hash.replace('#', '');
  return VIEWS[r] ? r : 'today';
}

// onboarding flow state (only used when getState().onboarded is false)
let onbStep = 0;
const onbDraft = {};

function render() {
  // First-run setup takes over the whole screen until the pact is signed.
  if (!getState().onboarded) {
    document.body.classList.add('onboarding');
    content.innerHTML = onboarding(onbStep, onbDraft);
    content.scrollTop = 0;
    return;
  }
  document.body.classList.remove('onboarding');

  const route = currentRoute();
  content.innerHTML = VIEWS[route]();
  content.scrollTop = 0;
  syncCounters(content); // animate header stat counters old -> new
  // animate any progress rings from empty to their target on mount
  requestAnimationFrame(() => {
    content.querySelectorAll('.ring-fg[data-off]').forEach(c => { c.style.strokeDashoffset = c.dataset.off; });
  });
  // nav active state
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

// Pull whatever the current onboarding step collected into the draft.
function captureOnbStep() {
  const name = document.getElementById('onb-name');
  const why = document.getElementById('onb-why');
  const nem = document.getElementById('onb-nemesis');
  if (name) onbDraft.name = name.value;
  if (why) onbDraft.why = why.value;
  if (nem) onbDraft.nemesis = nem.value;
}

// re-render on state change and on navigation
onChange(render);
window.addEventListener('hashchange', render);

// origin element for the XP-particle burst, set just before a toggle fires fx
let fxOrigin = null;

// transient effects: XP toast + the full "juice", plus milestone takeovers
onFx(fx => {
  if (fx.type === 'levelup') {
    takeover({ kind: 'LEVEL UP', label: 'Level ' + fx.level, line: rand(LEVELUP_LINES), color: 'var(--ember)' });
    vibrate([0, 40, 50, 90]); sound('crit');
    return;
  }
  if (fx.type === 'rankup') {
    const i = identById(fx.ident) || {};
    takeover({ kind: 'RANK UP', label: i.name || 'Identity', line: (i.name || 'It') + ' ' + rand(RANKUP_LINES), color: i.color });
    vibrate([0, 30, 40, 70]);
    return;
  }
  if (fx.type === 'achievement') {
    takeover({ kind: 'ACHIEVEMENT', label: fx.icon + ' ' + fx.name, line: fx.desc + ' — into the Cookie Jar it goes.', color: 'var(--gold)' });
    vibrate([0, 35, 45, 80]); sound('crit');
    return;
  }
  if (fx.type === 'rankladder') {
    takeover({ kind: 'RANK ASCENDED', label: fx.name, line: 'You climbed the ladder. ' + fx.name + ' is who you are now.', color: fx.color });
    vibrate([0, 45, 55, 100]); sound('crit');
    return;
  }
  if (fx.type === 'challengewin') {
    takeover({ kind: 'CHALLENGE COMPLETE', label: (fx.icon || '🏆') + ' ' + fx.name, line: fx.days + ' days. You said you would and you did. Into the Cookie Jar.', color: 'var(--gold)' });
    vibrate([0, 50, 60, 50, 60, 140]); sound('crit');
    return;
  }
  if (fx.type === 'challengefail') {
    takeover({ kind: 'CHALLENGE FAILED', label: '💀 ' + fx.name, line: 'You missed past your flex. No skip passes — that was the deal. Start it again today.', color: 'var(--red)' });
    vibrate([0, 120, 60, 120]);
    return;
  }
  // standard XP event
  toast(fx.xp, fx.label, fx.crit);
  burstXP(fxOrigin, fx.xp, fx.crit);
  celebrate(fxOrigin, fx.crit);
  vibrate(fx.crit ? [0, 20, 45, 35] : 25);
  sound(fx.crit ? 'crit' : 'tap');
});

// --- event delegation: one handler for the whole document ----------------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id } = el.dataset;
  switch (action) {
    case 'toggle': fxOrigin = el.closest('.quest'); toggleQuest(id); break;
    case 'toggle-hard': toggleQuestHard(id); break;
    case 'start-challenge':
      if (confirm('Start this challenge? Miss a required day past your flex and it ends — you start over.')) startChallenge(id);
      break;
    case 'abandon-challenge':
      if (confirm('Abandon this challenge? Quitting counts the same as failing.')) endChallenge();
      break;
    case 'clear-challenge': endChallenge(); break;
    case 'onb-next': captureOnbStep(); onbStep = Math.min(ONB_STEPS - 1, onbStep + 1); render(); break;
    case 'onb-back': captureOnbStep(); onbStep = Math.max(0, onbStep - 1); render(); break;
    case 'open-settings': openSettings(); break;
    case 'toggle-setting':
      setSetting(el.dataset.key, !getState().settings[el.dataset.key]);
      renderSettings();
      if (el.dataset.key === 'sound' && getState().settings.sound) sound('tap'); // preview
      break;
    case 'del-rep': if (confirm('Remove this rep?')) delQuest(id); break;
    case 'open-urge': openUrge(pickSwap()); break;
    case 'urge-resist': resolveUrge(true); closeModal(); break;
    case 'urge-slip': resolveUrge(false); closeModal(); break;
    case 'add-rep': {
      const t = document.getElementById('add-title');
      const i = document.getElementById('add-intent');
      const s = document.getElementById('add-ident');
      addQuest(t.value.trim(), i.value.trim(), s.value);
      break;
    }
    case 'edit-name': {
      const v = prompt('Your name:', getState().name);
      if (v !== null) setName(v);
      break;
    }
  }
});

// inline edits commit on blur
document.addEventListener('focusout', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id } = el.dataset;
  if (action === 'edit-intent') editQuestField(id, 'intent', el.textContent.trim());
  if (action === 'edit-title') editQuestField(id, 'title', el.textContent.trim());
  if (action === 'edit-target') editQuestField(id, 'target', el.textContent.trim());
  if (action === 'edit-ident-name') editIdentity(id, 'name', el.textContent.trim());
  if (action === 'edit-ident-rank') editIdentity(id, 'rank', el.textContent.trim());
  if (action === 'edit-ident-feeds') editIdentity(id, 'feeds', el.textContent.trim());
});

// --- hold-to-commit (onboarding pact) -------------------------------------
let holdRAF, holdStart;
const HOLD_MS = 1300;
function holdTick(now) {
  const btn = document.querySelector('.onb-commit');
  if (!btn) return;
  const p = Math.min(1, (now - holdStart) / HOLD_MS);
  const fill = btn.querySelector('.onb-commit-fill');
  if (fill) fill.style.width = (p * 100) + '%';
  if (p >= 1) {
    cancelHold();
    btn.classList.add('committed');
    vibrate([0, 30, 40, 30, 40, 120]); sound('crit');
    captureOnbStep();
    onbStep = 0;
    setTimeout(() => completeOnboarding(onbDraft), 420);
    return;
  }
  holdRAF = requestAnimationFrame(holdTick);
}
function startHold() {
  holdStart = performance.now();
  cancelAnimationFrame(holdRAF);
  holdRAF = requestAnimationFrame(holdTick);
}
function cancelHold() { cancelAnimationFrame(holdRAF); }
function releaseHold() {
  const btn = document.querySelector('.onb-commit');
  if (btn && !btn.classList.contains('committed')) {
    cancelHold();
    const fill = btn.querySelector('.onb-commit-fill');
    if (fill) fill.style.width = '0%';
  }
}
document.addEventListener('pointerdown', e => {
  if (e.target.closest('[data-action="commit-hold"]')) { e.preventDefault(); startHold(); }
});
document.addEventListener('pointerup', releaseHold);
document.addEventListener('pointercancel', releaseHold);
document.addEventListener('pointerleave', e => { if (e.target.closest && e.target.closest('.onb-commit')) releaseHold(); }, true);

// identity dropdown change
document.addEventListener('change', e => {
  const el = e.target.closest('[data-action="edit-ident"]');
  if (el) editQuestField(el.dataset.id, 'ident', el.value);
});

// autosave + tiny "saved ✓" flash, shared by the reflection box and the "why" box
function flashSaved(tagId, timerKey) {
  const tag = document.getElementById(tagId);
  if (!tag) return;
  tag.classList.add('show');
  clearTimeout(window[timerKey]);
  window[timerKey] = setTimeout(() => tag.classList.remove('show'), 1200);
}
document.addEventListener('input', e => {
  const ref = e.target.closest('[data-action="reflect"]');
  if (ref) { saveReflection(ref.value); flashSaved('ref-saved', '_rt'); return; }
  const why = e.target.closest('[data-action="edit-why"]');
  if (why) { setWhy(why.value); flashSaved('why-saved', '_wt'); return; }
});

// close modal by backdrop click
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

// dismiss the milestone takeover on tap anywhere
document.getElementById('takeover').addEventListener('click', closeTakeover);

// --- settings panel -------------------------------------------------------
const SETTINGS_ROWS = [
  { key: 'motion', label: 'Animations', desc: 'Motion, particles, and the level-up moments.' },
  { key: 'haptics', label: 'Haptics', desc: 'Vibration feedback on completion (phones).' },
  { key: 'sound', label: 'Sound', desc: 'A short tone when you bank a rep. Off by default.' },
];
function renderSettings() {
  const s = getState().settings || {};
  document.getElementById('settings-body').innerHTML = SETTINGS_ROWS.map(r => `
    <div class="set-row">
      <div><div class="set-name">${r.label}</div><div class="set-desc">${r.desc}</div></div>
      <button class="switch ${s[r.key] ? 'on' : ''}" data-action="toggle-setting" data-key="${r.key}"
        role="switch" aria-checked="${!!s[r.key]}" aria-label="${r.label}"><span class="knob"></span></button>
    </div>`).join('');
}
function openSettings() {
  renderSettings();
  document.getElementById('settings').classList.add('show');
}
document.getElementById('settings').addEventListener('click', e => {
  if (e.target.id === 'settings') e.currentTarget.classList.remove('show');
});

// enter-to-add on the reps page
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'add-title') {
    const i = document.getElementById('add-intent');
    const s = document.getElementById('add-ident');
    addQuest(e.target.value.trim(), i.value.trim(), s.value);
  }
});

// Failures happen by the passage of time, so re-evaluate the challenge on load —
// after onFx is wired, so any win/fail takeover actually shows.
syncChallenge();
render();
