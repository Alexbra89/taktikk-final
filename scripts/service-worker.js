/* Genereres til public/sw.js av scripts/generate-sw.mjs etter next build. */
const CACHE_VERSION = /* __CACHE_VERSION__ */ '';
const PRECACHE_URLS = /* __PRECACHE_URLS__ */ [];
const CACHE_PREFIX = 'taktikk-precache-';
const APP_CACHE = CACHE_PREFIX + CACHE_VERSION;
const MODEL_CACHE = 'taktikk-3d-models-v1';
const MODEL_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const precached = new Set(PRECACHE_URLS);
let modelWrites = Promise.resolve();

self.addEventListener('install', event => {
  // Alt, inkludert dynamisk lastede appmoduler og rene startsiden, må være
  // på plass før installasjonen godtas. Et mislykket bygg erstatter aldri
  // en fungerende worker. Ingen skipWaiting før brukeren velger Oppdater.
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(
    PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })),
  )));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Behold også forrige bygg, så åpne faner kan hente sine gamle moduler.
    // Gamle Workbox-lagre berøres ikke: de kan fortsatt tilhøre åpne faner
    // fra før overgangen fra next-pwa.
    const previous = (await caches.keys()).filter(name => name.startsWith(CACHE_PREFIX) && name !== APP_CACHE);
    const complete = [];
    for (const name of previous) {
      if (await (await caches.open(name)).match('/')) complete.push(name);
    }
    const keep = complete.at(-1);
    await Promise.all(previous.filter(name => name !== keep).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

async function modelResponse(request, event) {
  const cache = await caches.open(MODEL_CACHE);
  // Gjenbruk også modeller som en installert next-pwa-utgave allerede har
  // lagret. Da virker tidligere brukt 3D også offline rett etter oppgradering.
  const cached = await cache.match(request) || await caches.match(request, { cacheName: '3d-models' });
  const savedAt = Number(cached?.headers.get('x-taktikk-cached-at'))
    || Date.parse(cached?.headers.get('date') || '');
  if (cached && savedAt && Date.now() - savedAt < MODEL_MAX_AGE) return cached;
  const response = await fetch(request);
  if (response.ok && !response.redirected && response.status === 200) {
    const copy = response.clone();
    modelWrites = modelWrites.catch(() => {}).then(async () => {
      const headers = new Headers(copy.headers);
      headers.set('x-taktikk-cached-at', String(Date.now()));
      await cache.delete(request);
      await cache.put(request, new Response(await copy.blob(), { status: copy.status, headers }));
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, -4).map(key => cache.delete(key)));
    });
    event.waitUntil(modelWrites.catch(() => {}));
  }
  return response;
}

async function oldChunk(request) {
  // En annen fane kan fortsatt kjøre forrige bygg etter at denne workeren
  // tok over. URL-ene inneholder filhash, så gamle moduler kan brukes trygt.
  for (const name of await caches.keys()) {
    if (name.startsWith(CACHE_PREFIX) || name.startsWith('workbox-precache-')) {
      const match = await (await caches.open(name)).match(request);
      if (match) return match;
    }
  }
  return fetch(request);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Hemmelige delingskoder, API-svar, andre domener og andre metoder skal
  // aldri lagres eller erstattes av appens offline-svar.
  if (request.method !== 'GET' || url.origin !== self.location.origin
    || url.searchParams.has('kode') || url.pathname.startsWith('/api/')
    || request.headers.has('range')) return;

  if (request.mode === 'navigate' && url.pathname === '/') {
    // HTML og moduler er fra samme bygg helt til brukeren oppdaterer.
    event.respondWith(caches.open(APP_CACHE).then(async cache => (await cache.match('/')) || fetch(request)));
  } else if (request.mode !== 'navigate' && precached.has(url.pathname) && url.pathname !== '/') {
    event.respondWith(caches.open(APP_CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(oldChunk(request));
  } else if (/^\/models\/[^/]+\.(?:glb|hdr)$/i.test(url.pathname) && !url.search) {
    event.respondWith(modelResponse(request, event));
  }
});
