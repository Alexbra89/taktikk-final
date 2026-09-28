import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// ══════════════════════════════════════════════════════════════
//  RØYKTESTER – det viktigste på brettet, i en ekte nettleser.
//  Hver test starter med tom lagring (ny nettleserkontekst) og feiler
//  hvis appen logger feil i konsollen.
// ══════════════════════════════════════════════════════════════

const SVG = 'svg[viewBox="0 0 880 560"]';

let consoleErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto('/');
  // Appen starter på dashbordet; brettet ligger under Taktikk i hovedmenyen.
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk' }).click();
  await page.locator(SVG).first().waitFor();
});
test.afterEach(() => {
  expect(consoleErrors, 'feil i konsollen').toEqual([]);
});

/** Aktiv fase slik den ligger lagret. */
async function activePhase(page: Page) {
  return page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('taktikkboard-storage') ?? 'null')?.state;
    if (!s) return null;
    const t = s.tactics.find((t: { id: string }) => t.id === s.activeTacticId);
    return t.phases[t.activePhaseIdx] as {
      drawings: unknown[];
      players: { num: number; position: { x: number; y: number } }[];
    };
  });
}

/** Midten av brikken med dette nummeret, i skjermkoordinater. */
async function playerCenter(page: Page, num: number) {
  const box = await page.locator(`${SVG} g[data-player]`)
    .filter({ has: page.locator('text', { hasText: new RegExp(`^${num}$`) }) })
    .first().boundingBox();
  if (!box) throw new Error(`fant ikke spiller ${num}`);
  return { x: box.x + box.width / 2, y: box.y + box.height * 0.4 };
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 15; i++) {
    await page.mouse.move(from.x + (to.x - from.x) * i / 15, from.y + (to.y - from.y) * i / 15);
  }
  await page.mouse.up();
}

test('tegn en strek på brettet', async ({ page }) => {
  await page.getByRole('button', { name: 'Tegn', exact: true }).first().click();
  const b = (await page.locator(SVG).first().boundingBox())!;
  await drag(page,
    { x: b.x + b.width * 0.3, y: b.y + b.height * 0.3 },
    { x: b.x + b.width * 0.6, y: b.y + b.height * 0.45 });

  await expect.poll(async () => (await activePhase(page))?.drawings.length).toBe(1);
  // Streken tegnes med temafargen (style="stroke: rgb(var(--k-draw-…))").
  await expect(page.locator(`${SVG} polyline[style*="--k-draw"]`)).toHaveCount(1);
});

test('bytt to spillere og angre: begge går tilbake', async ({ page }) => {
  // Utgangspunkt fra formasjonen; lagres først ved første endring.
  const start2 = await playerCenter(page, 2);
  const start3 = await playerCenter(page, 3);

  await drag(page, start2, start3);   // slipp spiller 2 oppå spiller 3
  await expect.poll(async () => {
    const ph = await activePhase(page);
    const p = (n: number) => ph?.players.find(pl => pl.num === n)?.position;
    return p(2) && p(3) ? `${Math.round(p(2)!.y)},${Math.round(p(3)!.y)}` : null;
  }, { message: 'spiller 2 og 3 bytter plass' }).toBe('200,100');

  await page.getByRole('button', { name: 'Angre' }).first().click();

  // K1: før fiksen gikk bare spiller 2 tilbake, og de to lå oppå hverandre.
  await expect.poll(async () => {
    const ph = await activePhase(page);
    const p = (n: number) => ph?.players.find(pl => pl.num === n)?.position;
    return `${Math.round(p(2)!.y)},${Math.round(p(3)!.y)}`;
  }, { message: 'begge tilbake etter angre' }).toBe('100,200');
});

test('eksporter bildet som PNG', async ({ page }) => {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksporter bilde' }).first().click();
  const file = await (await download).path();
  const bytes = await readFile(file);

  expect(bytes.length, 'filstørrelse').toBeGreaterThan(10_000);
  // PNG-signaturen: \x89 P N G
  expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
});

test('tom bane: spiller via utstyr følger fasene og overlever reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Ny taktikk' }).first().click();
  await page.getByRole('button', { name: /^Tom bane/ }).click();
  // Bare banen: ingen formasjonsspillere, ingen formasjon i knappen over banen.
  await expect(page.locator(`${SVG} g[data-player]`)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Tom bane/ }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Utstyr' }).first().click();
  await page.getByRole('button', { name: 'Spiller', exact: true }).click();
  const item = page.locator(`${SVG} g[data-item]`).first();
  await expect(item).toBeVisible();

  const b = (await page.locator(SVG).first().boundingBox())!;
  const center = async () => { const r = (await item.boundingBox())!; return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  type Saved = { empty?: boolean; phases: { players: number; items: [string, number][] }[] };
  const items = () => page.evaluate((): Saved => {
    const s = JSON.parse(localStorage.getItem('taktikkboard-storage')!).state;
    const t = s.tactics.find((t: { id: string }) => t.id === s.activeTacticId);
    return { empty: t.empty, phases: t.phases.map((p: { players: unknown[]; items: { type: string; position: { x: number } }[] }) =>
      ({ players: p.players.length, items: p.items.map(i => [i.type, Math.round(i.position.x)]) })) };
  });

  await drag(page, await center(), { x: b.x + b.width * 0.3, y: b.y + b.height * 0.5 });
  await page.getByRole('button', { name: 'Legg til fase' }).first().click();
  await drag(page, await center(), { x: b.x + b.width * 0.7, y: b.y + b.height * 0.5 });

  const saved = await items();
  expect(saved.empty).toBe(true);
  expect(saved.phases.map(p => p.players)).toEqual([0, 0]);
  const [[t1, x1]] = saved.phases[0].items, [[t2, x2]] = saved.phases[1].items;
  expect([t1, t2]).toEqual(['player', 'player']);
  expect(x1).toBeLessThan(x2);   // egen posisjon i hver fase

  await page.reload();
  // Appen starter alltid på dashbordet; brettet ligger under Taktikk.
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk' }).click();
  await page.locator(SVG).first().waitFor();
  expect(await items()).toEqual(saved);
  await expect(page.locator(`${SVG} g[data-item]`)).toHaveCount(1);
});
