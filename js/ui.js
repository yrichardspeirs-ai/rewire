// ui.js — transient UI: the XP toast and the scroll-intercept modal.

let toastTimer;
export function toast(xp, label, crit) {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toast-x').textContent = '+' + xp;
  document.getElementById('toast-t').innerHTML = '<b>' + label + '</b>';
  el.classList.toggle('crit', !!crit);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

export function openUrge(swapText) {
  document.getElementById('modal-swap').textContent = '\u2192 ' + swapText;
  document.getElementById('modal').classList.add('show');
}
export function closeModal() {
  document.getElementById('modal').classList.remove('show');
}
