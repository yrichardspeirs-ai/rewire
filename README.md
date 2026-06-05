# REWIRE

A personal life-improvement app built on how behavior actually changes: habit
loops, identity reps, variable reward, loss aversion, and friction design.
Built for one user. You.

---

## Run it (2 minutes)

You cannot just double-click `index.html`. The browser blocks JavaScript modules
and local storage when a page is opened directly from a file. You need a tiny
local server. The easiest way:

1. Install **Visual Studio Code** (free).
2. In VS Code, open the Extensions panel (the squares icon on the left), search
   **Live Server**, and click Install. *Live Server is an extension that serves your
   project on a local web address so the browser treats it like a real site.*
3. Open this folder in VS Code: **File → Open Folder → select the `rewire` folder**.
4. Right-click `index.html` in the file list and choose **Open with Live Server**.
   Your browser opens at something like `http://127.0.0.1:5500`. That is your app.

Edit any file, save, and the page reloads automatically. That is your build loop.

---

## Your data

Everything you do is saved in your browser's **localStorage** under the key
`rewire:state`. It persists between sessions on that browser. It does **not** sync
across devices or browsers, and clearing browser data wipes it. That is the
trade-off for a zero-backend app. The upgrade path below removes this limit.

---

## How the project is laid out

```
rewire/
  index.html            The shell: sidebar nav + content area + modal/toast
  css/styles.css        All styling
  js/
    utils.js            Date math, XP/level formulas, escaping
    state.js            The data and every action. The brain of the app.
    components.js       Reusable HTML pieces (rep card, identity card, ring)
    ui.js               Transient UI: toast + scroll-intercept modal
    app.js              Router + rendering + all input handling (event delegation)
    views/
      today.js          Daily driver
      reps.js           Manage habits and if-then plans
      resist.js         Anti-doomscroll module
      identity.js       The five identities
      progress.js       Momentum, streaks, reflections
```

The one rule that keeps this clean: **views never touch storage.** They read from
`getState()` and call actions in `state.js`. If you want to change behavior, you
almost always edit `state.js`. If you want to change how something looks, you edit
a view or the CSS. That separation is what lets this grow without turning to mush.

---

## Make it yours first

1. Open the **Reps** page and rewrite each if-then plan to a real time and place in
   your day. This is the single change that decides whether the app works.
2. Add or delete reps so the list is exactly your six pursuits, nothing borrowed.
3. Click your name on the Today page to set it.

---

## Install it on your phone (it's a PWA now)

REWIRE is an installable, offline-capable Progressive Web App — still
framework-free, no build step. Serve it over HTTPS (or `localhost`) once and you
can install it to your home screen, where it opens full-screen like a native app
and works with no connection.

- **Android / Chrome / Edge:** open the served URL, then tap the **Install app**
  button in the app (or use the browser's "Install" menu item).
- **iPhone / Safari:** open the served URL, tap **Share → Add to Home Screen**.
  (The in-app button shows this hint, since iOS has no install API.)

How it works:
- `manifest.webmanifest` — name, icons, theme, standalone display.
- `sw.js` — a service worker that caches the app shell so it loads offline.
- `js/pwa.js` — registers the worker and wires the install button.
- `icons/` — the app icons (the ember-ring "R").

To put it online so your phone can reach it, drop the `rewire/` folder on any
static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages — all free). HTTPS
is automatic on those, which is what the service worker needs.

### Still on the upgrade path

1. **Vite** — only if you want bundling/minification or a faster dev server.
   The app doesn't need it to run or install.
2. **Notifications** — scheduled reminder pushes need a backend (or the limited
   Notification Triggers API). Not wired up yet.
3. **Sync** — for data across devices, add a small backend (Supabase is the
   fastest: hosted database with auth, minimal code).

The behavior engine and the phone-ready shell are both here now.
