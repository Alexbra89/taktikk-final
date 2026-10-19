import { test, expect, type Page } from '@playwright/test';

// Animert øvelse: «Se animert» i øvelsesbiblioteket, avspilling i 2D og 3D,
// faseteksten under banen, «reduser bevegelse», mobil og fullskjerm.
test.use({ serviceWorkers: 'block' });

const FASE_1 = /^Pasningsleggeren står 12–15 m unna/;
const FASE_2 = /^Angriperen gjør et lite møteløp/;
const FASE_3 = /^Forsvareren leser pasningen/;
const FASE_4 = /^Pasningen slås/;
const FASE_5 = /^Forsvareren fører ballen ut av sonen/;

async function openBryteren(page: Page) {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
  await page.getByRole('button', { name: 'Barn', exact: true }).click();
  await page.getByPlaceholder('Søk etter øvelse…').fill('Bryteren');
  await page.getByRole('heading', { level: 3, name: /Bryteren/ }).click();
  await page.getByRole('button', { name: 'Se animert', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Animert øvelse: Bryteren (komme foran og bryte pasningen)' });
  await expect(dialog).toBeVisible();
  return dialog;
}
const storage = (page: Page) => page.evaluate(() => localStorage.getItem('taktikkboard-storage'));

test('spiller av, bytter til 3D, og teksten følger fasen', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const dialog = await openBryteren(page);
  const before = await storage(page);
  const text = dialog.getByTestId('drill-animation-text');
  await expect(text).toHaveText(FASE_1);
  await expect(dialog.getByText('Illustrasjon laget ut fra øvelsesteksten', { exact: false })).toBeVisible();
  const href = await dialog.getByRole('link', { name: 'Ser noe feil ut?', exact: true }).getAttribute('href');
  expect(href).toMatch(/^mailto:/);
  expect(decodeURIComponent(href!)).toContain('Feil i animert øvelse: Bryteren (komme foran og bryte pasningen)');

  // 2D: avspillingen går videre, og teksten byttes med fasen.
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(text).toHaveText(FASE_2, { timeout: 10_000 });
  await expect(dialog.getByRole('button', { name: /^Fase 2:/ })).toHaveAttribute('aria-current', 'step');
  await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(text).toHaveText(FASE_2);

  // 3D: samme faser og samme tekst; pillen viser fasens navn.
  await dialog.getByRole('button', { name: '3D', exact: true }).click();
  const region = dialog.getByRole('region', { name: '3D-visning' });
  await expect(region.getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
  await expect(dialog.locator('[data-testid="board-3d"] canvas')).toBeVisible();
  await expect(text).toHaveText(FASE_2);
  await dialog.getByRole('button', { name: 'Neste fase', exact: true }).click();
  await expect(text).toHaveText(FASE_3);
  await expect(dialog.locator('.board3d-phase-name')).toHaveText('Orienterer seg');
  await dialog.getByRole('button', { name: 'Neste fase', exact: true }).click();
  await expect(text).toHaveText(FASE_4);
  await expect(text).toContainText('Brudd!');
  await expect(dialog.locator('.board3d-phase-name')).toHaveText('Brudd');
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await expect(text).toHaveText(FASE_5, { timeout: 10_000 });
  await expect(dialog.locator('.board3d-phase-name')).toHaveText('Ut av sonen');
  await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeVisible({ timeout: 10_000 });

  // Tilbake til 2D og lukk: ingenting er lagret.
  await dialog.getByRole('button', { name: '2D', exact: true }).click();
  await expect(dialog.locator('svg[viewBox="0 0 880 560"]')).toBeVisible();
  await dialog.getByRole('button', { name: 'Lukk animasjonen', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Se animert', exact: true })).toBeFocused();
  expect(await storage(page)).toEqual(before);
  expect(errors).toEqual([]);
});

test('«reduser bevegelse»: spillerne hopper fra fase til fase uten å gli', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const dialog = await openBryteren(page);
  const ball = dialog.locator('svg g[filter="url(#dropShadow)"] circle[r="10"]');
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  // Ballen flytter seg først i fase 4 (etter ca. 7 s), så vi ser i 12 s.
  const seen = new Set<string>();
  for (let i = 0; i < 120; i++) {
    seen.add(`${await ball.getAttribute('cx')},${await ball.getAttribute('cy')}`);
    await page.waitForTimeout(100);
  }
  await expect(dialog.getByTestId('drill-animation-text')).not.toHaveText(FASE_1);
  // Bare fasenes egne stillinger, ingen mellomposisjoner.
  expect(seen.size).toBeGreaterThan(1);
  expect(seen.size).toBeLessThanOrEqual(4);
});

test('mobil og fullskjerm: banen, teksten og kontrollene får plass', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const dialog = await openBryteren(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const box = (await dialog.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(388);
  const pitch = (await dialog.locator('svg[viewBox="0 0 880 560"]').boundingBox())!;
  expect(pitch.width).toBeGreaterThan(300);
  for (const name of ['Spill av', 'Forrige fase', 'Neste fase']) {
    await expect(dialog.getByRole('button', { name, exact: true })).toBeInViewport();
  }
  await expect(dialog.getByTestId('drill-animation-text')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('animert-ovelse-mobil.png') });

  await dialog.getByRole('button', { name: 'Fullskjerm for animasjonen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.getAttribute('aria-label') ?? '')).toContain('Animert øvelse');
  await expect(dialog.getByRole('button', { name: 'Lukk fullskjerm', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Neste fase', exact: true }).click();
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_2);
  await dialog.getByRole('button', { name: 'Lukk fullskjerm', exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await expect(dialog).toBeVisible();
  expect(errors).toEqual([]);
});

test('tastaturet blir i dialogen, og siden bak kan ikke brukes', async ({ page }) => {
  const dialog = await openBryteren(page);
  const focusInside = () => dialog.evaluate(el => el.contains(document.activeElement));
  const backgroundInert = () => page.evaluate(() =>
    Array.from(document.body.children).every(el => el.getAttribute('role') === 'dialog' || el.hasAttribute('inert')));
  expect(await backgroundInert()).toBe(true);
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    expect(await focusInside()).toBe(true);
  }
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await focusInside()).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => document.querySelectorAll('body > [inert]').length)).toBe(0);
  await expect(page.getByRole('button', { name: 'Se animert', exact: true })).toBeFocused();
});

test('bare øvelser med animasjon har knappen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
  await page.getByRole('button', { name: 'Barn', exact: true }).click();
  await page.getByPlaceholder('Søk etter øvelse…').fill('Kjeglejakten');
  await page.getByRole('heading', { level: 3, name: /Kjeglejakten/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Kjeglejakten/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Se animert', exact: true })).toHaveCount(0);
});
