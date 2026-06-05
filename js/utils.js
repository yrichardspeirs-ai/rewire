// utils.js — small pure helpers shared across the app.

export function ds(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
export function todayStr() { return ds(new Date()); }
export function shift(n) { const d = new Date(); d.setDate(d.getDate() + n); return ds(d); }

export function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Account level rises slowly so it always feels earned.
export function levelFromXp(xp) { return Math.floor(Math.pow(xp / 40, 0.62)) + 1; }

// Each identity ranks up on its own curve.
export function identLevel(xp) { return Math.floor(Math.pow(xp / 30, 0.6)) + 1; }
export function identProgress(xp) {
  const lvl = identLevel(xp);
  const base = Math.ceil(30 * Math.pow(lvl - 1, 1 / 0.6));
  const next = Math.ceil(30 * Math.pow(lvl, 1 / 0.6));
  const span = (next - base) || 1;
  return { lvl, pct: Math.max(4, Math.min(100, Math.round((xp - base) / span * 100))), next };
}

export function fmtMins(m) { return m >= 60 ? (Math.floor(m / 60) + 'h ' + (m % 60) + 'm') : m + 'm'; }

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function dowShort(dateStr) { const [y, m, d] = dateStr.split('-').map(Number); return DOW[new Date(y, m - 1, d).getDay()]; }
export function prettyDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
