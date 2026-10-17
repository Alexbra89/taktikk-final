import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// ══════════════════════════════════════════════════════════════
//  FEILSKJERM OG FEILLOGG – i en ekte nettleser.
//  Feilene lages utenfra, uten testkode i appen: 3D uten WebGL 2, og en
//  visning der JavaScript-filen ikke kan lastes (som etter en ny versjon).
//  Disse testene sjekker ikke konsollen: der skal feilene stå.
// ══════════════════════════════════════════════════════════════

const SVG = 'svg[viewBox="0 0 880 560"]';
const LOG_KEY = 'taktikk:error-log';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.beforeEach(async ({ page }) => {
  // Under utvikling legger Next et eget feiloverlegg over siden. Brukerne ser
  // det aldri (produksjonsbygget har det ikke), så testen fjerner det.
  await page.addInitScript(() => {
    new MutationObserver(() => document.querySelectorAll('nextjs-portal').forEach(el => el.remove()))
      .observe(document, { childList: true, subtree: true });
  });
});

const nav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name, exact: true }).click();
const errorLog = (page: Page) =>
  page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '[]') as { area: string; source: string; message: string }[], LOG_KEY);

test('lastefeil venter på brukeren; Last inn på nytt henter en fungerende side', async ({ page }) => {
  const chunk = /\/_next\/static\/.*ReportsView.*\.js/;
  await page.route(chunk, route => route.abort());
  await page.goto('/');
  await page.evaluate(() => { Object.assign(window, { chunkTestDocument: crypto.randomUUID() }); });
  const documentId = () => page.evaluate(() => (window as unknown as { chunkTestDocument?: string }).chunkTestDocument);
  const before = await documentId();
  await nav(page, 'Rapporter');
  const alert = page.getByRole('alert').filter({ hasText: 'Appen er oppdatert – last inn på nytt' });
  await expect(alert).toBeVisible();
  await page.waitForTimeout(1_000);
  expect(await documentId()).toBe(before);
  expect((await errorLog(page))[0].message).toContain('Loading chunk');
  await page.unroute(chunk);
  await Promise.all([
    page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() }),
    alert.getByRole('button', { name: 'Last inn på nytt' }).click(),
  ]);
  await expect(page.getByRole('region', { name: 'Neste trening' })).toBeVisible();
  expect(await documentId()).not.toBe(before);
  await nav(page, 'Rapporter');
  await expect(page.getByRole('heading', { level: 1, name: 'Rapporter', exact: true })).toBeVisible();
});

test('3D med bare WebGL 1: feilskjermen foreslår 2D, og 2D virker videre', async ({ page }) => {
  // Three krever WebGL 2. En enhet med bare WebGL 1 skal få feilskjermen, ikke 3D-visningens egen melding.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext as (...args: unknown[]) => unknown;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        return type === 'webgl2' ? null : original.apply(this, [type, ...rest]);
      },
    });
  });
  await page.goto('/');
  await nav(page, 'Taktikk');
  await page.locator(SVG).first().waitFor();

  await page.getByRole('button', { name: '3D', exact: true }).click();
  const alert = page.getByRole('alert').filter({ hasText: 'Noe gikk galt i denne delen' });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('WebGL');
  await expect(alert.getByRole('button', { name: 'Prøv igjen' })).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Gå til forsiden' })).toBeVisible();

  await alert.getByRole('button', { name: 'Bytt til 2D' }).click();
  await expect(alert).toBeHidden();
  await expect(page.locator(SVG).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '2D', exact: true })).toHaveAttribute('aria-pressed', 'true');

  const log = await errorLog(page);
  expect(log[0]).toMatchObject({ area: '3d', source: 'skjerm' });
  expect(log[0].message).toContain('WebGL 2');
});

test('en visning som krasjer: resten av appen virker, feilen kan kopieres og tømmes, og er ikke i backupen', async ({ page }) => {
  // Rapporter-visningens fil kan ikke lastes.
  await page.route(/\/_next\/static\/.*ReportsView.*\.js/, route => route.abort());
  await page.goto('/');
  await nav(page, 'Rapporter');

  const alert = page.getByRole('alert').filter({ hasText: 'Appen er oppdatert – last inn på nytt' });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Last inn på nytt' })).toBeVisible();
  await expect(alert).not.toContainText('Bytt til 2D');
  // Sidefeltet står fortsatt.
  await expect(page.getByRole('navigation', { name: 'Hovedmeny' })).toBeVisible();

  await alert.getByRole('button', { name: 'Gå til forsiden' }).click();
  await expect(page.getByRole('region', { name: 'Neste trening' })).toBeVisible();
  await nav(page, 'Taktikk');
  await expect(page.locator(SVG).first()).toBeVisible();

  const log = await errorLog(page);
  expect(log.length).toBeGreaterThanOrEqual(1);
  expect(log[0]).toMatchObject({ area: 'reports', source: 'skjerm' });

  // Innstillinger → Feilrapport. Knappen står nederst i sidefeltet, utenfor Hovedmeny.
  await page.getByRole('complementary', { name: 'Sidefelt' }).getByRole('button', { name: 'Innstillinger', exact: true }).click();
  const section = page.getByRole('region', { name: 'Feilrapport' });
  await expect(section).toContainText(`${log.length} feil lagret`);
  await section.getByRole('button', { name: 'Kopier feilrapport' }).click();
  await expect(section.getByRole('status')).toContainText('kopiert');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Feilrapport – Taktikkboard');
  expect(copied).toContain('Rapporter (vist som feilskjerm)');
  expect(copied).toContain('Appversjon: ');

  // Backupen har ikke feilloggen.
  const download = page.waitForEvent('download');
  await page.getByRole('region', { name: 'Data' }).getByRole('button', { name: 'Eksporter' }).click();
  const backup = await readFile((await (await download).path())!, 'utf8');
  expect(backup).not.toContain(LOG_KEY);
  expect(backup).not.toContain(log[0].message);

  page.once('dialog', d => d.accept());
  await section.getByRole('button', { name: 'Tøm logg' }).click();
  await expect(section).toContainText('Ingen feil registrert.');
  expect(await page.evaluate(key => localStorage.getItem(key), LOG_KEY)).toBeNull();
});
