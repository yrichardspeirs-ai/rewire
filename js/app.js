// app.js — wires everything together: routing, rendering, and input handling.

import { onChange, onFx, getState, pickSwap, identById,
  toggleQuest, addQuest, delQuest, editQuestField, resolveUrge, saveReflection, setName, setSetting } from './state.js';
import { toast, openUrge, closeModal, takeover, closeTakeover } from './ui.js';
import { burstXP, celebrate, vibrate, sound, syncCounters } from './fx.js';
import { rand, LEVELUP_LINES, RANKUP_LINES } from './copy.js';
import { today } from './views/today.js';
import { reps } from './views/reps.js';
import { resist } from './views/resist.js';
import { identity } from './views/identity.js';
import { progress } from './views/progress.js';

const VIEWS = { today, reps, resist, identity, progress };
const content = document.getElementById('content');

function currentRoute() {
  const r = location.hash.replace('#', '');
  return VIEWS[r] ? r : 'today';
}

function render() {
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
});

// identity dropdown change
document.addEventListener('change', e => {
  const el = e.target.closest('[data-action="edit-ident"]');
  if (el) editQuestField(el.dataset.id, 'ident', el.value);
});

// reflection autosave + tiny saved indicator
let refTag;
document.addEventListener('input', e => {
  const el = e.target.closest('[data-action="reflect"]');
  if (!el) return;
  saveReflection(el.value);
  refTag = document.getElementById('ref-saved');
  if (refTag) {
    refTag.classList.add('show');
    clearTimeout(window._rt);
    window._rt = setTimeout(() => refTag.classList.remove('show'), 1200);
  }
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

render();
