import { test, expect } from '@playwright/test';

test('nye appikoner forhåndslagres, og delingskode havner ikke i cache eller adresse', async ({ page, context }) => {
  await page.goto('/?kode=kun-testkode');
  await expect(page).toHaveURL('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
  await page.goto('/?kode=ny-testkode');
  await expect(page).toHaveURL('/');
  const urls = await page.evaluate(async () => {
    const cachesByName = await Promise.all((await caches.keys()).map(name => caches.open(name)));
    const requests = (await Promise.all(cachesByName.map(cache => cache.keys()))).flat();
    return requests.map(r => r.url);
  });
  expect(urls.some(url => new URL(url).searchParams.has('kode'))).toBe(false);
  for (const path of ['/icon-pitch-v2-192.png', '/icon-pitch-v2-512.png', '/icon-maskable-pitch-v2-512.png', '/apple-touch-icon-pitch-v2.png', '/favicon-pitch-v2.ico']) {
    expect(urls.some(url => new URL(url).pathname === path), `${path} i forhåndslageret`).toBe(true);
  }
  expect(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')).toBe('/apple-touch-icon-pitch-v2.png');
  await context.setOffline(true);
  for (const path of ['/manifest.json', '/icon-pitch-v2-192.png', '/icon-pitch-v2-512.png', '/icon-maskable-pitch-v2-512.png', '/apple-touch-icon-pitch-v2.png', '/favicon-pitch-v2.ico']) {
    expect(await page.evaluate(async path => (await fetch(path)).ok, path), `${path} uten nett`).toBe(true);
  }
});

test('forside, 2D og øvelser virker offline; tilbakekobling laster ikke siden på nytt', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  // HTTP-cachen må ikke skjule en manglende service worker. Cache Storage
  // (som Workbox bruker) er fortsatt tilgjengelig. Konteksten er ny og tom.
  // Playwright slår av HTTP-cachen når routing brukes. Alle forespørsler
  // sendes videre uendret; ingen svar eller nettverkstilstander forfalskes.
  await page.route('**/*', route => route.continue());

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /trener/ })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
  expect(await page.evaluate(() => new URL(navigator.serviceWorker.controller!.scriptURL).pathname)).toBe('/sw.js');

  // next-pwa legger først inn et tomt svar. Vent også på den ekte startsiden,
  // som registreringsskriptet henter etter installasjonen.
  await expect.poll(() => page.evaluate(async () => {
    const response = await (await caches.open('start-url')).match('/');
    return response ? (await response.text()).includes('Taktikkboard') : false;
  }), { message: 'startsiden er lagret for bruk uten nett' }).toBe(true);

  // Ikke åpne Taktikk eller Øvelser online: også de dynamiske modulene
  // må finnes i forhåndslageret etter aller første besøk.
  await context.setOffline(true);
  const response = await page.reload();
  expect(response?.fromServiceWorker(), 'omlastingen betjenes av service workeren').toBe(true);
  await expect(page.getByRole('heading', { level: 1, name: /trener/ })).toBeVisible();
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  expect(await page.evaluate(async () => {
    try {
      // HEAD går utenom Workbox sine GET-regler og gjør ingen endring i API-et.
      await fetch('/api/ai', { method: 'HEAD', cache: 'no-store' });
      return true;
    } catch {
      return false;
    }
  }), 'en forespørsel utenfor service workerens lager kan ikke nå serveren').toBe(false);

  const nav = page.getByRole('navigation', { name: 'Hovedmeny' });
  await nav.getByRole('button', { name: 'Taktikk', exact: true }).click();
  const pitch = page.locator('svg[viewBox="0 0 880 560"]').first();
  await expect(pitch).toBeVisible();
  await expect(pitch.locator('g[data-player]').first()).toBeVisible();
  await nav.getByRole('button', { name: 'Øvelser', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Øvelser', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();

  // Et søk er ikke lagret i localStorage: en reload ville mistet søket og
  // sendt brukeren til forsiden. Kontroller også dokumentidentitet og
  // navigasjonsforsøk, så en rask eller mislykket reload ikke slipper gjennom.
  const search = page.getByPlaceholder('Søk etter øvelse…');
  await search.fill('pasning');
  await page.evaluate(() => {
    Object.assign(window, { offlineTestDocument: crypto.randomUUID(), offlineTestOnlineEvents: 0 });
    window.addEventListener('online', () => {
      const state = window as unknown as { offlineTestOnlineEvents: number };
      state.offlineTestOnlineEvents++;
    });
  });
  const documentId = () => page.evaluate(() =>
    (window as unknown as { offlineTestDocument?: string }).offlineTestDocument);
  const before = await documentId();
  const navigations: string[] = [];
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });
  page.on('request', request => {
    if (request.isNavigationRequest()) navigations.push(request.url());
  });

  await context.setOffline(false);
  await expect.poll(() => page.evaluate(() => ({
    online: navigator.onLine,
    events: (window as unknown as { offlineTestOnlineEvents?: number }).offlineTestOnlineEvents,
  }))).toEqual({ online: true, events: 1 });
  // Negativ sjekk: gi online-håndtererne tid til å forsøke en reload.
  await page.waitForTimeout(3_000);
  expect(await documentId()).toBe(before);
  expect(navigations, 'ingen reload eller dokumentnavigasjon etter tilbakekobling').toEqual([]);
  await expect(search).toHaveValue('pasning');
  await expect(page.getByRole('heading', { level: 1, name: 'Øvelser', exact: true })).toBeVisible();
  expect(errors, 'ingen kjørefeil i appen').toEqual([]);
});
