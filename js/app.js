// app.js — wires everything together: routing, rendering, and input handling.

import { onChange, onFx, getState, pickSwap,
  toggleQuest, addQuest, delQuest, editQuestField, resolveUrge, saveReflection, setName } from './state.js';
import { toast, openUrge, closeModal } from './ui.js';
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
  // nav active state
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

// re-render on state change and on navigation
onChange(render);
window.addEventListener('hashchange', render);

// transient effects (XP toast)
onFx(fx => toast(fx.xp, fx.label, fx.crit));

// --- event delegation: one handler for the whole document ----------------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id } = el.dataset;
  switch (action) {
    case 'toggle': toggleQuest(id); break;
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

// enter-to-add on the reps page
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'add-title') {
    const i = document.getElementById('add-intent');
    const s = document.getElementById('add-ident');
    addQuest(e.target.value.trim(), i.value.trim(), s.value);
  }
});

render();
