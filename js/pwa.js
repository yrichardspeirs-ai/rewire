// pwa.js — service-worker registration + "Add to home screen" handling.
// Imported by app.js for its side effects. Keeps all PWA glue in one place.

// --- register the service worker (offline + installable) ------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {/* offline-first is best-effort */});
  });
  // When a new worker takes over, reload once so the user gets fresh code.
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return; reloaded = true; location.reload();
  });
}

// --- install prompt -------------------------------------------------------
let deferredPrompt = null;
const btn = document.getElementById('install-btn');

function showBtn(label) {
  if (!btn) return;
  btn.textContent = label;
  btn.hidden = false;
}
function hideBtn() { if (btn) btn.hidden = true; }

// Chrome / Edge / Android: capture the prompt and offer it on demand.
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  showBtn('Install app');
});

if (btn) {
  btn.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => { deferredPrompt = null; hideBtn(); });
    } else if (isIos() && !isStandalone()) {
      // iOS Safari has no install API: tell the user the manual gesture.
      alert('To install: tap the Share button, then "Add to Home Screen".');
    }
  });
}

// Already installed (or launched from the home screen): no need for the button.
window.addEventListener('appinstalled', hideBtn);
if (isStandalone()) hideBtn();
// iOS gets a manual hint button since it never fires beforeinstallprompt.
else if (isIos()) showBtn('Add to Home Screen');

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
