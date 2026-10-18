import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

test('ny versjon venter på Oppdater; lukk, sidebytte, andre faner og offline virker', async ({ page, context }) => {
  const swPath = new URL('../public/sw.js', import.meta.url);
  const original = await readFile(swPath, 'utf8');
  const version = `update-test-${Date.now()}`;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { Object.assign(window, { updateDocument: crypto.randomUUID() }); });
  const documentId = () => page.evaluate(() => (window as unknown as { updateDocument: string }).updateDocument);
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
  const notice = page.getByRole('status', { name: 'Appoppdatering' });
  await expect(notice).toBeHidden(); // Første installasjon er ingen oppdatering.
  const nav = page.getByRole('navigation', { name: 'Hovedmeny' });
  const search = page.getByPlaceholder('Søk etter øvelse…');
  const before = await documentId();

  const other = await context.newPage();
  await other.addInitScript(() => { Object.assign(window, { updateDocument: crypto.randomUUID() }); });
  await other.goto('/');
  await expect(other.getByRole('heading', { level: 1, name: /trener/ })).toBeVisible();
  const otherBefore = await other.evaluate(() => (window as unknown as { updateDocument: string }).updateDocument);
  // Appen synkroniserer currentView mellom faner. Åpne derfor den andre
  // fanen før søket som skal bevares under installasjon av ny versjon.
  await nav.getByRole('button', { name: 'Øvelser', exact: true }).click();
  await search.fill('pasning');
  try {
    // Nytt versjonert forhåndslager som ved et nytt bygg.
    // Ekte installasjon/venting/overtakelse, ingen SW-mock.
    // Testmeldingen beviser at det faktisk er den nye workeren som styrer.
    const updated = original.replace(/const CACHE_VERSION = "[^"]+";/, `const CACHE_VERSION = ${JSON.stringify(version)};`);
    expect(updated).not.toBe(original);
    await writeFile(swPath, `${updated}\nself.addEventListener('message', event => {
      if (event.data === 'TEST_VERSION') event.ports[0].postMessage(${JSON.stringify(version)});
    });\n`, 'utf8');
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    await expect(notice).toContainText('Ny versjon er klar');
    expect(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(true);
    await expect(search).toHaveValue('pasning');
    expect(await documentId()).toBe(before);

    await notice.getByRole('button', { name: 'Lukk oppdateringsmelding' }).click();
    await expect(notice).toBeHidden();
    await nav.getByRole('button', { name: 'Taktikk', exact: true }).click();
    await expect(page.locator('svg[viewBox="0 0 880 560"]').first()).toBeVisible();
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Lukk oppdateringsmelding' }).click();
    await nav.getByRole('button', { name: 'Øvelser', exact: true }).click();
    await expect(notice).toBeVisible();
    // Også en nyåpnet fane må oppdage workeren som allerede venter.
    await other.reload();
    await expect(other.getByRole('status', { name: 'Appoppdatering' })).toBeVisible();
    const otherWaiting = await other.evaluate(() => (window as unknown as { updateDocument: string }).updateDocument);
    expect(otherWaiting).not.toBe(otherBefore);
    // En eksplisitt reload i den andre fanen velger Oversikt i begge.
    // Velg Øvelser igjen før kontrollen av at workeren venter på klikk.
    await nav.getByRole('button', { name: 'Øvelser', exact: true }).click();
    await search.fill('keeper');
    await page.waitForTimeout(1_000);
    expect(await documentId()).toBe(before);
    await expect(search).toHaveValue('keeper');

    await Promise.all([
      page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() }),
      notice.getByRole('button', { name: 'Oppdater', exact: true }).click(),
    ]);
    await expect(page.getByRole('heading', { level: 1, name: /trener/ })).toBeVisible();
    expect(await documentId()).not.toBe(before);
    const activeVersion = await page.evaluate(() => new Promise<string>(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = event => { channel.port1.close(); resolve(event.data); };
      navigator.serviceWorker.controller!.postMessage('TEST_VERSION', [channel.port2]);
    }));
    expect(activeVersion).toBe(version);
    await expect(notice).toBeHidden();
    // Oppdatering i én fane skal aldri automatisk laste om en annen.
    await expect(other.getByRole('status', { name: 'Appoppdatering' })).toBeVisible();
    expect(await other.evaluate(() => (window as unknown as { updateDocument: string }).updateDocument)).toBe(otherWaiting);

    await context.setOffline(true);
    const response = await page.reload();
    expect(response?.fromServiceWorker()).toBe(true);
    await expect(page.getByRole('heading', { level: 1, name: /trener/ })).toBeVisible();
    await nav.getByRole('button', { name: 'Taktikk', exact: true }).click();
    await expect(page.locator('svg[viewBox="0 0 880 560"]').first()).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await context.setOffline(false);
    await writeFile(swPath, original, 'utf8');
    await other.close();
  }
});
