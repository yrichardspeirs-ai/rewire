// fx.js — feedback engine. The "juice": XP particles, haptics, sound, count-up,
// card celebration, screen flash. No asset files — sound is WebAudio synth.
// Everything honors user settings + prefers-reduced-motion and degrades to no-op.

import { getState } from './state.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function s() { return getState().settings || {}; }
const motionOK = () => !reduceMotion && s().motion !== false;

// --- haptics ---------------------------------------------------------------
export function vibrate(pattern) {
  if (!s().haptics) return;
  if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
}

// --- sound (lazy WebAudio synth; needs a user gesture, which our clicks are) -
let actx;
export function sound(kind) {
  if (!s().sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    if (kind === 'crit') {
      o.type = 'triangle';
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(520, t + 0.13);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.start(t); o.stop(t + 0.47);
    } else {
      o.type = 'sine';
      o.frequency.setValueAtTime(340, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.start(t); o.stop(t + 0.24);
    }
  } catch (e) {}
}

// --- XP particle that flies from the tapped card to the header XP stat -------
export function burstXP(fromEl, amount, crit) {
  if (!motionOK() || !fromEl) return;
  const target = document.querySelector('.xp-target') || document.querySelector('.head-stats');
  if (!target) return;
  const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'xp-fly' + (crit ? ' crit' : '');
  el.textContent = '+' + amount;
  el.style.left = (a.left + a.width / 2) + 'px';
  el.style.top = (a.top + a.height / 2) + 'px';
  document.body.appendChild(el);
  const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
  const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  requestAnimationFrame(() => {
    el.style.transform = `translate(${dx}px, ${dy}px) scale(.55)`;
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 900);
}

// --- count-up tweening for header stats -------------------------------------
// Elements carry data-key (stable id) + data-count (target value). We remember
// the last value per key across re-renders so the number animates old -> new.
const lastVals = new Map();
export function syncCounters(root = document) {
  root.querySelectorAll('[data-count][data-key]').forEach(el => {
    const key = el.dataset.key;
    const to = parseInt(el.dataset.count, 10) || 0;
    const last = lastVals.get(key);
    lastVals.set(key, to);
    if (last == null || last === to || !motionOK()) { el.textContent = to.toLocaleString(); return; }
    tween(el, last, to);
  });
}
function tween(el, from, to) {
  const dur = 650, t0 = performance.now();
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    el.textContent = v.toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

// --- card celebration + crit screen flash -----------------------------------
export function celebrate(cardEl, crit) {
  if (!motionOK() || !cardEl) return;
  cardEl.classList.remove('just-done', 'just-crit');
  void cardEl.offsetWidth; // restart animation
  cardEl.classList.add(crit ? 'just-crit' : 'just-done');
  setTimeout(() => cardEl.classList.remove('just-done', 'just-crit'), 800);
  if (crit) flashScreen();
}
export function flashScreen() {
  if (!motionOK()) return;
  const f = document.getElementById('crit-flash');
  if (!f) return;
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  setTimeout(() => f.classList.remove('go'), 700);
}
