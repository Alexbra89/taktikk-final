import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

test('en eksisterende registrering og lagrede 3D-modeller beholdes ved overgang til egen worker', async ({ page, context }) => {
  const swPath = new URL('../public/sw.js', import.meta.url);
  const current = await readFile(swPath, 'utf8');
  // Den tidligere registreringsavtalen: samme URL/scope, Workbox-cache og
  // SKIP_WAITING-melding. Selve overtakelsen skjer med ekte nettleser-API-er.
  const legacy = `
    self.addEventListener('install', event => event.waitUntil(
      caches.open('workbox-precache-v2-migration').then(cache => cache.addAll(['/']))
    ));
    self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
    self.addEventListener('message', event => {
      if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
    });
  `;
  try {
    await writeFile(swPath, legacy, 'utf8');
    await page.route('**/*', route => route.continue());
    await page.goto('/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
    const size = await page.evaluate(async () => {
      const path = '/models/spiller-v2.glb';
      const response = await fetch(path);
      const size = (await response.clone().arrayBuffer()).byteLength;
      await (await caches.open('3d-models')).put(path, response);
      return size;
    });
    expect(size).toBeGreaterThan(1000);
    await writeFile(swPath, current, 'utf8');
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    const notice = page.getByRole('status', { name: 'Appoppdatering' });
    await expect(notice).toBeVisible();
    expect(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(true);
    await Promise.all([
      page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() }),
      notice.getByRole('button', { name: 'Oppdater', exact: true }).click(),
    ]);
    await expect(page.getByRole('heading', { level: 1, name: /trener/ })).toBeVisible();
    await context.setOffline(true);
    expect((await page.reload())?.fromServiceWorker()).toBe(true);
    await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Øvelser', exact: true })).toBeVisible();
    expect(await page.evaluate(async () =>
      (await (await fetch('/models/spiller-v2.glb')).arrayBuffer()).byteLength)).toBe(size);
    expect(await page.evaluate(() => caches.has('workbox-precache-v2-migration'))).toBe(true);
  } finally {
    await context.setOffline(false);
    await writeFile(swPath, current, 'utf8');
  }
});
