import { test, expect, type Page, type Locator } from '@playwright/test';

// Animert øvelse: «Se animert» i øvelsesbiblioteket, avspilling i 2D og 3D,
// faseteksten under banen, «reduser bevegelse», mobil og fullskjerm.
test.use({ serviceWorkers: 'block', reducedMotion: 'no-preference' });

const FASE_1 = /^Pasningsleggeren står 12–15 m unna/;
const FASE_2 = /^Angriperen gjør et lite møteløp/;
const FASE_3 = /^Forsvareren leser pasningen/;
const FASE_4 = /^Pasningen slås/;
const FASE_5 = /^Forsvareren fører ballen ut av sonen/;

async function openAnimation(page: Page, search: string, age = 'Barn') {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
  await page.getByRole('button', { name: age, exact: true }).click();
  await page.getByPlaceholder('Søk etter øvelse…').fill(search);
  await page.getByRole('heading', { level: 3, name: new RegExp(search) }).click();
  await page.getByRole('button', { name: 'Se animert', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: /^Animert øvelse:/ });
  await expect(dialog).toBeVisible();
  return dialog;
}
const openBryteren = (page: Page) => openAnimation(page, 'Bryteren');
const storage = (page: Page) => page.evaluate(() => localStorage.getItem('taktikkboard-storage'));

test('spiller av, bytter til 3D, og teksten følger fasen', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const dialog = await openBryteren(page);
  const before = await storage(page);
  const text = dialog.getByTestId('drill-animation-text');
  await expect(text).toHaveText(FASE_1);
  await expect(dialog.getByText('Illustrasjon laget ut fra øvelsesteksten', { exact: false })).toBeVisible();
  const href = await dialog.getByRole('link', { name: 'Ser noe feil ut?', exact: true }).getAttribute('href');
  expect(href).toMatch(/^mailto:alex_bratland@live\.no\?/);
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
  await expect(dialog.getByTestId('drill-animation-pitch')).toBeVisible();
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
  const pitch = (await dialog.getByTestId('drill-animation-pitch').boundingBox())!;
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

const viewports = [
  { name: 'PC', width: 1400, height: 900 },
  { name: 'mobil stående', width: 390, height: 844 },
  { name: 'mobil liggende', width: 844, height: 390 },
];
const animations = [
  { search: 'Bryteren', player: 1 },
  { search: 'Murbyggerne', player: 0 },
  { search: 'Pasning til mål', player: 0 },
  { search: 'Vendespill', player: 3, age: 'Voksne' },
  { search: 'Vendingsstafett', player: 0 },
];

async function allPhasesFit(dialog: Locator) {
  const pitch = dialog.getByTestId('drill-animation-pitch');
  const crop = await pitch.getAttribute('viewBox');
  const phaseButtons = dialog.getByRole('button', { name: /^Fase \d:/ });
  for (let i = 0; i < await phaseButtons.count(); i++) {
    await phaseButtons.nth(i).click();
    expect(await pitch.getAttribute('viewBox')).toBe(crop);
    expect(await pitch.evaluate((svg: SVGSVGElement) => {
      const matrix = svg.getScreenCTM()!;
      const { x, y, width, height } = svg.viewBox.baseVal;
      const a = new DOMPoint(x, y).matrixTransform(matrix), b = new DOMPoint(x + width, y + height).matrixTransform(matrix);
      return Array.from(svg.querySelectorAll('[data-player], [data-item], g[filter="url(#dropShadow)"] circle[r="10"]')).every(el => {
        const box = el.getBoundingClientRect();
        return box.left >= a.x && box.right <= b.x && box.top >= a.y && box.bottom <= b.y;
      });
    }), `Alle spillere, ball og alt utstyr i fase ${i + 1} må få plass`).toBe(true);
  }
  await phaseButtons.first().click();
}

for (const animation of animations) {
  test(`${animation.search}: hele øvelsen under 12 sekunder ved 1×`, async ({ page }) => {
    const dialog = await openAnimation(page, animation.search, animation.age);
    const start = Date.now();
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeVisible({ timeout: 11_900 });
    expect(Date.now() - start).toBeLessThan(12_000);
    await expect(dialog.getByRole('button', { name: /^Fase \d:/ }).last()).toHaveAttribute('aria-current', 'step');
  });
}

test('farten påvirker både pausen og bevegelsen', async ({ page }) => {
  const dialog = await openBryteren(page);
  const durations = [];
  for (const speed of ['1', '2']) {
    await dialog.getByRole('button', { name: /^Fase 1:/ }).click();
    await dialog.getByRole('combobox', { name: 'Fart', exact: true }).selectOption(speed);
    durations.push(await dialog.evaluate(root => new Promise<{ hold: number; total: number }>(resolve => {
      const text = root.querySelector('[data-testid="drill-animation-text"]')!;
      const initial = text.textContent;
      const button = root.querySelector<HTMLButtonElement>('button[aria-label="Spill av"]')!;
      const start = performance.now();
      let hold = 0, started = false;
      const observer = new MutationObserver(() => {
        if (!hold && text.textContent !== initial) hold = performance.now() - start;
        if (button.getAttribute('aria-label') === 'Pause') started = true;
        else if (started) { observer.disconnect(); resolve({ hold, total: performance.now() - start }); }
      });
      observer.observe(root, { attributes: true, childList: true, characterData: true, subtree: true });
      button.click();
    })));
  }
  expect(durations[1].hold).toBeLessThan(durations[0].hold * .8);
  expect(durations[1].total).toBeLessThan(durations[0].total * .65);
});

test('øvelsens roller vises i 2D, 3D og den eksporterte videoens etiketter', async ({ page }, info) => {
  const dialog = await openBryteren(page);
  await expect(dialog.getByTestId('drill-animation-pitch').locator('[data-player] > text')).toHaveText(['P', 'A', 'F']);
  // Read the actual text drawn into Three's label textures, including the isolated exporter.
  await page.evaluate(() => {
    const captured: string[] = [];
    (window as Window & { drillRoleTexts?: string[] }).drillRoleTexts = captured;
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(...args) {
      if (this.canvas.width === 512 && this.canvas.height === 128) captured.push(args[0]);
      return original.apply(this, args);
    };
  });
  const labels = () => page.evaluate(() => (window as Window & { drillRoleTexts?: string[] }).drillRoleTexts!);
  await dialog.getByRole('button', { name: '3D', exact: true }).click();
  const exportButton = dialog.getByRole('button', { name: 'Eksporter 3D-video', exact: true });
  await expect(exportButton).toBeEnabled({ timeout: 45_000 });
  expect(await labels()).toEqual(expect.arrayContaining(['1 · P', '2 · A', '3 · F']));
  expect((await labels()).filter(label => /^\d+ · /.test(label)).every(label => /^\d+ · [PAF]$/.test(label))).toBe(true);
  await dialog.getByRole('combobox', { name: 'Fart', exact: true }).selectOption('2');
  await page.evaluate(() => { (window as Window & { drillRoleTexts?: string[] }).drillRoleTexts!.length = 0; });
  const downloadPromise = page.waitForEvent('download', { timeout: 55_000 });
  await exportButton.click();
  const download = await downloadPromise;
  await download.saveAs(info.outputPath(download.suggestedFilename()));
  expect(await download.failure()).toBeNull();
  expect(await labels()).toEqual(expect.arrayContaining(['1 · P', '2 · A', '3 · F']));
  expect((await labels()).filter(label => /^\d+ · /.test(label)).every(label => /^\d+ · [PAF]$/.test(label))).toBe(true);
});

/** Mål utsnittets hjørner og alle spillerne gjennom avspillingen. */
async function sampleMotion(dialog: Locator, playerIndex: number) {
  return dialog.evaluate(async (root, index) => {
    const svg = root.querySelector<SVGSVGElement>('[data-testid="drill-animation-pitch"]')!;
    const player = svg.querySelectorAll('[data-player]')[index];
    const readPosition = () => {
      const kit = player.querySelector<SVGGElement>('g[transform]');
      if (kit) {
        const matrix = kit.transform.baseVal.consolidate()!.matrix;
        return { x: matrix.e, y: matrix.f };
      }
      const circle = player.querySelector<SVGCircleElement>('circle')!;
      return { x: circle.cx.baseVal.value, y: circle.cy.baseVal.value };
    };
    const frames = [];
    const start = performance.now();
    do {
      const matrix = svg.getScreenCTM()!;
      const { x, y, width, height } = svg.viewBox.baseVal;
      const corners = [[x, y], [x + width, y + height]].map(([px, py]) => new DOMPoint(px, py).matrixTransform(matrix));
      const area = svg.parentElement!.parentElement!.getBoundingClientRect();
      const playersFit = Array.from(svg.querySelectorAll('[data-player]')).every(p => {
        const box = p.getBoundingClientRect();
        return box.left >= corners[0].x && box.right <= corners[1].x && box.top >= corners[0].y && box.bottom <= corners[1].y;
      });
      frames.push({
        time: performance.now() - start, ...readPosition(),
        playersFit,
        left: corners[0].x, top: corners[0].y, right: corners[1].x, bottom: corners[1].y,
        fits: corners[0].x >= Math.max(0, area.left) - 1 && corners[0].y >= Math.max(0, area.top) - 1
          && corners[1].x <= Math.min(innerWidth, area.right) + 1 && corners[1].y <= Math.min(innerHeight, area.bottom) + 1,
      });
      await new Promise(requestAnimationFrame);
    } while (performance.now() - start < 3600);
    return frames;
  }, playerIndex);
}

for (const viewport of viewports) {
  for (const animation of animations) {
    test(`${animation.search}: gradvis bevegelse og stabilt, helt utsnitt på ${viewport.name}`, async ({ page }, info) => {
      const dialog = await openAnimation(page, animation.search, animation.age);
      await page.setViewportSize(viewport);
      await allPhasesFit(dialog);
      const text = dialog.getByTestId('drill-animation-text');
      await expect(text).toBeVisible();
      // Reservetekstene skal bare måle høyde, aldri tegnes over den aktive teksten.
      await expect(dialog.locator('p[aria-hidden="true"]').first()).toBeHidden();
      await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeInViewport();
      await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
      const sampling = sampleMotion(dialog, animation.player);
      await page.waitForTimeout(1400); // midt i første overgang, etter den korte pausen
      if (animation.search === 'Bryteren') {
        await page.screenshot({ path: info.outputPath('midt-i-bevegelse.png') });
      }
      const frames = await sampling;
      expect(frames.every(frame => frame.fits && frame.playersFit), 'Utsnitt og spillere må være synlige i hvert bilde').toBe(true);
      for (const edge of ['left', 'top', 'right', 'bottom'] as const) {
        const positions = frames.map(frame => frame[edge]);
        expect(Math.max(...positions) - Math.min(...positions), `Banens ${edge} flyttet seg ved tekstbytte`).toBeLessThan(1);
      }
      const initial = frames[0];
      const arrived = frames.find(frame => frame.time > 2200)!;
      const distance = Math.hypot(arrived.x - initial.x, arrived.y - initial.y);
      expect(distance).toBeGreaterThan(1);
      const between = frames.filter(frame => {
        const moved = Math.hypot(frame.x - initial.x, frame.y - initial.y);
        return moved > distance * 0.05 && moved < distance * 0.95;
      });
      expect(new Set(between.map(frame => `${frame.x},${frame.y}`)).size).toBeGreaterThanOrEqual(3);
      // En ekte pause: samme endeposisjon gjennom minst 600 ms etter ankomst.
      const arrival = frames.find(frame => Math.hypot(frame.x - arrived.x, frame.y - arrived.y) < .001)!;
      const departure = frames.find(frame => frame.time > arrival.time && Math.hypot(frame.x - arrived.x, frame.y - arrived.y) > .001);
      const hold = frames.filter(frame => frame.time >= arrival.time && frame.time < (departure?.time ?? 3000));
      expect(hold.length).toBeGreaterThan(3);
      expect(hold.at(-1)!.time - hold[0].time).toBeGreaterThan(580);
      expect(new Set(hold.map(frame => `${frame.x},${frame.y}`)).size).toBe(1);
      // En overgang skal gli jevnt, uten et stort hopp mellom nabobilder.
      const firstTransition = frames.filter(frame => frame.time < 2200);
      for (let i = 1; i < firstTransition.length; i++) {
        const before = firstTransition[i - 1], after = firstTransition[i];
        expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(distance * 0.3);
      }
      await expect(dialog.getByTestId('drill-animation-text')).toBeInViewport();
      await expect(dialog.getByRole('button', { name: 'Pause', exact: true })).toBeInViewport();
    });
  }

  test(`fullskjerm under avspilling får plass i 2D og 3D på ${viewport.name}`, async ({ page }, info) => {
    const dialog = await openBryteren(page);
    await page.setViewportSize(viewport);
    await dialog.getByRole('button', { name: 'Fullskjerm for animasjonen', exact: true }).click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await allPhasesFit(dialog);
    await page.screenshot({ path: info.outputPath('bryteren-2d-fullskjerm.png') });
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    const frames = await sampleMotion(dialog, 1);
    expect(frames.every(frame => frame.fits && frame.playersFit)).toBe(true);
    await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
    await dialog.getByRole('button', { name: '3D', exact: true }).click();
    const region = dialog.getByRole('region', { name: '3D-visning' });
    await expect(region.getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
    await expect(region.getByText('Laster spillermodell og himmel …', { exact: true })).toHaveCount(0, { timeout: 45_000 });
    await page.screenshot({ path: info.outputPath('bryteren-3d-fullskjerm.png') });
    const canvas = region.locator('[data-testid="board-3d"] canvas');
    const checkCanvas = async () => {
      const box = (await canvas.boundingBox())!;
      expect(box.width).toBeGreaterThan(100);
      expect(box.height).toBeGreaterThan(60);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    };
    await checkCanvas();
    await dialog.getByRole('button', { name: /^Fase 1:/ }).click();
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    await page.waitForTimeout(1800);
    await checkCanvas();
    await page.screenshot({ path: info.outputPath('3d-midt-i-bevegelse.png') });
    await dialog.getByRole('button', { name: 'Lukk fullskjerm', exact: true }).click();
    await checkCanvas();
    await page.screenshot({ path: info.outputPath('bryteren-3d.png') });
    // Gjenbruk også brettets egen 3D-fullskjerm og dens avspillingskontroller.
    await region.getByRole('button', { name: 'Fullskjerm for 3D', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '3D-bane i fullskjerm', exact: true })).toBeVisible();
    await checkCanvas();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: '3D-bane i fullskjerm', exact: true })).toHaveCount(0);
    await expect(dialog).toBeVisible();
  });
}

test('fasevalg og pause avbryter ventetiden, og siste fase kan spilles om igjen', async ({ page }) => {
  const dialog = await openBryteren(page);
  await dialog.getByRole('combobox', { name: 'Fart', exact: true }).selectOption('2');
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForTimeout(1500);
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_1);
  await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await dialog.getByRole('button', { name: /^Fase 4:/ }).click();
  await page.waitForTimeout(1500);
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_4);
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_5);
  await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_1);
});
