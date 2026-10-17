import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const legacy = JSON.parse(readFileSync('src/lib/__fixtures__/backup-v1.json', 'utf8'));
const state = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('taktikkboard-storage')!).state);
const settings = async (page: Page) => {
  const nav = page.getByRole('navigation', { name: 'Hovedmeny' });
  if ((page.viewportSize()?.width ?? 1400) >= 640) await page.getByRole('button', { name: 'Innstillinger', exact: true }).click();
  else {
    await nav.getByRole('button', { name: 'Mer', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Innstillinger/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Sikkerhetskopi', exact: true })).toBeVisible();
};
const upload = (page: Page, data: string, name = 'sikkerhetskopi.json') =>
  page.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(data) });
const allStorage = (page: Page) => page.evaluate(() => ({ ...localStorage }));

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-17T12:00:00Z'));
  await page.goto('/');
  await page.evaluate(data => {
    localStorage.setItem('taktikkboard-storage', JSON.stringify({ version: 2, state: { ...data, showMovement: true } }));
    localStorage.setItem('taktikk:theme', 'light');
    localStorage.setItem('taktikk:player-style', 'chip');
    localStorage.setItem('taktikk:ai-access-code', 'testkode-kun-for-test');
    localStorage.setItem('taktikk:error-log', JSON.stringify([{ at: '2026-10-17T10:00:00Z', version: '2.0.0',
      area: 'board', source: 'skjerm', message: 'WebGL context lost', stack: 'FEILLOGG-KUN-LOKALT', device: 'Test Edge' }]));
  }, legacy.data);
  await page.reload();
  await settings(page);
});

test('ekte nedlasting, avbryt og bekreftet import bevarer innhold og innstillinger etter omlasting', async ({ page }) => {
  await expect(page.getByText('Sist eksportert: aldri', { exact: true })).toBeVisible();
  await expect(page.getByText(/Du har ingen eksportert sikkerhetskopi ennå/)).toBeVisible();
  const before = await state(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksporter sikkerhetskopi', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('taktikk-eldre-lag-2026-10-17.json');
  const saved = JSON.parse(readFileSync((await file.path())!, 'utf8'));
  const { lastExportedAt: _last, ...data } = before;
  expect(saved.data).toEqual(data);
  expect(saved.theme).toBe('light');
  expect(saved.settings).toEqual({ playerStyle: 'chip', aiAccessCode: 'testkode-kun-for-test' });
  expect(JSON.stringify(saved)).not.toMatch(/error-log|errorLog|lastExportedAt|matchTimer|FEILLOGG-KUN-LOKALT/);
  await expect(page.getByText(/Sist eksportert:.*2026/)).toBeVisible();
  await expect(page.getByText(/Ta gjerne en sikkerhetskopi når det passer/)).toHaveCount(0);

  // En annen datasamling på målenheten skal forsvinne først ved bekreftelse.
  await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem('taktikkboard-storage')!);
    store.state.homeTeamName = 'Andre data'; store.state.events = []; store.state.matchReports = [];
    store.state.moments = []; store.state.showMovement = false;
    store.state.tactics[0].name = 'Endret taktikk';
    localStorage.setItem('taktikkboard-storage', JSON.stringify(store));
    localStorage.setItem('taktikk:theme', 'dark'); localStorage.setItem('taktikk:player-style', 'kit');
    localStorage.setItem('taktikk:ai-access-code', 'annen kode');
  });
  await page.reload(); await settings(page);
  const destination = await allStorage(page);
  // Kontroller også at Importer-knappen åpner filvelgeren.
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Importer', exact: true }).click();
  await (await chooser).setFiles({ name: 'kopi.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await expect(page.getByText('Dette erstatter dataene på denne enheten.', { exact: true })).toBeVisible();
  expect(await allStorage(page)).toEqual(destination);
  await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
  expect(await allStorage(page)).toEqual(destination);
  await upload(page, JSON.stringify(saved));
  await page.getByRole('button', { name: 'Erstatt alt', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Dataene er importert');
  await expect(page.getByLabel('Ditt lagnavn')).toHaveValue('Eldre lag');
  await expect(page.getByRole('region', { name: 'Utseende' }).getByRole('radio', { name: 'Dagslys' })).toHaveAttribute('aria-checked', 'true');
  await page.reload(); await settings(page);
  const restored = await state(page);
  const { lastExportedAt: restoredDate, ...restoredData } = restored;
  expect(restoredData).toEqual(saved.data);
  expect(restoredDate).toBe(JSON.parse(destination['taktikkboard-storage']).state.lastExportedAt);
  expect(await page.evaluate(() => [localStorage.getItem('taktikk:theme'), localStorage.getItem('taktikk:player-style'), localStorage.getItem('taktikk:ai-access-code')]))
    .toEqual(['light', 'chip', 'testkode-kun-for-test']);
  expect(await page.evaluate(() => localStorage.getItem('taktikk:error-log'))).toBe(destination['taktikk:error-log']);
});

test('ødelagt, tom, feil type og nyere fil gir norsk feil uten å endre noe', async ({ page }) => {
  const damaged = structuredClone(legacy); damaged.data.events.push(null);
  for (const [text, name, message] of [
    ['{"format":', 'skadet.json', 'skadet'], ['', 'tom.json', 'tom'],
    [JSON.stringify(legacy), 'feil.txt', '.json'], ['{}', 'annen.json', 'Taktikkboard'],
    [JSON.stringify({ ...legacy, version: 999 }), 'nyere.json', 'nyere versjon'],
    [JSON.stringify(damaged), 'delvis-skadet.json', 'ugyldige data'],
  ]) {
    const before = await allStorage(page);
    await upload(page, text, name);
    await expect(page.getByRole('region', { name: 'Sikkerhetskopi' }).getByRole('alert')).toContainText(message);
    await expect(page.getByRole('region', { name: 'Sikkerhetskopi' }).getByRole('alert')).toContainText('Dataene dine er ikke endret.');
    await expect(page.getByRole('button', { name: 'Erstatt alt', exact: true })).toHaveCount(0);
    expect(await allStorage(page)).toEqual(before);
  }
});

test('eldre kopi kan importeres; eksport og import er synlig på mobil og gammel eksport gir rolig påminnelse', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem('taktikkboard-storage')!);
    store.state.lastExportedAt = '2026-09-16T12:00:00Z';
    localStorage.setItem('taktikkboard-storage', JSON.stringify(store));
  });
  await page.reload();
  await settings(page);
  await expect(page.getByRole('button', { name: 'Eksporter sikkerhetskopi', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Importer', exact: true })).toBeInViewport();
  await expect(page.getByText(/Det er over 30 dager siden sist/)).toBeVisible();
  expect(await page.getByRole('region', { name: 'Sikkerhetskopi' }).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await upload(page, JSON.stringify(legacy));
  await page.getByRole('button', { name: 'Erstatt alt', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Dataene er importert');
  expect((await state(page)).events).toEqual(legacy.data.events);
  await page.screenshot({ path: 'test-results/backup-mobile.png' });
});
