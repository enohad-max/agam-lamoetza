// להעלות את הגרסה בכל שינוי בנכסים, אחרת משתמשים יראו גרסה ישנה
const CACHE = 'agam-v10';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/data.js',
  'js/countdown.js',
  'js/confetti.js',
  'js/sound.js',
  'js/storage.js',
  'js/quiz.js',
  'js/certificate.js',
  'js/whatsapp.js',
  'js/icons.js',
  'game.html',
  'css/game.css',
  'js/game/main.js',
  'js/game/config.js',
  'js/game/items.js',
  'js/game/state.js',
  'js/game/catch.js',
  'js/game/rewards.js',
  'js/game/achievements.js',
  'js/game/avatar.js',
  'fonts/Rubik-subset.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// קודם הרשת (כדי שעדכונים יופיעו מיד), ואם אין רשת או שהיא איטית – מהמטמון
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  const fromCache = () => caches.match(request, { ignoreSearch: true });
  const fromNetwork = fetch(request).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy));
    }
    return res;
  });
  const timeout = new Promise((_, reject) => setTimeout(reject, 3000));

  e.respondWith(
    Promise.race([fromNetwork, timeout]).catch(() => fromCache().then((hit) => hit || fromNetwork))
  );
});
