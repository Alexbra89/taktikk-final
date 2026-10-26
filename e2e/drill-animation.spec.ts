import path from 'node:path';
import { test, expect, type Page, type Locator } from '@playwright/test';

// Animert øvelse: «Se animert» i øvelsesbiblioteket, avspilling i 2D og 3D,
// faseteksten under banen, «reduser bevegelse», mobil og fullskjerm,
// pasninger/skudd som synes, tempo og opptak i 2D og 3D.
test.use({ serviceWorkers: 'block', reducedMotion: 'no-preference' });

/** Skjermbildene til gjennomsyn. Ligger utenfor Git (.gitignore). */
const SHOTS = path.join(process.cwd(), '_skjermbilder');
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SHOTS, `${name}.png`) });

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

test('live bevegelse: ingen React-commits, pekertreff eller layout mellom fasebyttene', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { commits: 0 };
    const renderers = new Map();
    Object.assign(window, {
      __drillPerf: state,
      __REACT_DEVTOOLS_GLOBAL_HOOK__: {
        supportsFiber: true, renderers,
        inject: (renderer: unknown) => { const id = renderers.size + 1; renderers.set(id, renderer); return id; },
        // Next's development tools have their own React root in a shadow tree.
        onCommitFiberRoot: (_id: number, root: { containerInfo: Node }) => {
          if (root.containerInfo === document) state.commits++;
        },
        onCommitFiberUnmount: () => {},
      },
    });
  });
  const dialog = await openBryteren(page);
  await expect(dialog.getByTestId('board-3d')).toHaveCount(0);
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  // A long movement keeps this measurement away from either boundary even on a busy PC.
  await dialog.getByRole('combobox', { name: 'Fart', exact: true }).selectOption('0.5');
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_2);
  // Let the boundary commit and control transitions finish, then measure inside the move.
  await page.waitForTimeout(250);
  const before = await dialog.evaluate(root => {
    const state = (window as unknown as { __drillPerf: { commits: number } }).__drillPerf;
    const pitch = root.querySelector('[data-testid="drill-animation-area"]')!;
    const player = pitch.querySelectorAll<SVGGElement>('[data-player]')[1];
    const ball = pitch.querySelector<SVGGElement>('[data-ball]')!;
    const observed = { mutations: [] as string[], hits: 0 };
    const observer = new MutationObserver(records => { for (const r of records) observed.mutations.push(r.attributeName!); });
    observer.observe(pitch, { attributes: true, childList: true, subtree: true });
    pitch.addEventListener('pointerover', () => { observed.hits++; });
    Object.assign(window, { __drillObserved: observed, __drillObserver: observer });
    return { commits: state.commits, x: new DOMMatrixReadOnly(getComputedStyle(player.closest('[data-move]') ?? player).transform).e,
      pointers: [getComputedStyle(player).pointerEvents, getComputedStyle(ball).pointerEvents] };
  });
  // Keep the real mouse over the path of the moving attacker.
  const playerBox = await dialog.locator('[data-player]').nth(1).boundingBox();
  await page.mouse.move(playerBox!.x + playerBox!.width / 2, playerBox!.y + playerBox!.height / 2);
  await page.waitForTimeout(175);
  const metricsBefore = await client.send('Performance.getMetrics');
  await page.waitForTimeout(500);
  const metricsAfter = await client.send('Performance.getMetrics');
  const after = await dialog.evaluate(root => {
    const win = window as unknown as { __drillPerf: { commits: number }; __drillObserved: { mutations: string[]; hits: number }; __drillObserver: MutationObserver };
    win.__drillObserver.disconnect();
    const player = root.querySelectorAll<SVGGElement>('[data-player]')[1];
    return { commits: win.__drillPerf.commits, x: new DOMMatrixReadOnly(getComputedStyle(player.closest('[data-move]') ?? player).transform).e, ...win.__drillObserved };
  });
  expect(before.commits).toBeGreaterThan(0); // Prove the React hook actually observed this app.
  expect(after.commits - before.commits).toBe(0);
  expect(before.pointers).toEqual(['none', 'none']);
  expect(after.hits).toBe(0);
  expect(after.x).not.toBe(before.x);
  // Compositor animation changes the visible matrix without touching DOM attributes.
  expect(after.mutations.filter(name => name !== 'transform')).toEqual([]);
  const metric = (metrics: typeof metricsBefore, name: string) => metrics.metrics.find(m => m.name === name)!.value;
  expect(metric(metricsAfter, 'LayoutCount') - metric(metricsBefore, 'LayoutCount')).toBe(0);
  // Compositor tracks must not recalculate CSS style every frame.
  expect(metric(metricsAfter, 'RecalcStyleCount') - metric(metricsBefore, 'RecalcStyleCount')).toBeLessThanOrEqual(2);
  await client.detach();
});

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
  const ball = dialog.locator('svg [data-ball]');
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  // Ballen flytter seg først i fase 4 (etter ca. 5 s), så vi ser i 8 s.
  const seen = new Set<string>();
  for (let i = 0; i < 80; i++) {
    seen.add(await ball.evaluate(el => getComputedStyle(el.closest('[data-move]')!).transform));
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

/** Vindusstørrelsene brukeren testet på PC og mobil. */
const viewports = [
  { name: '1890x960', width: 1890, height: 960 },
  { name: '1920x700', width: 1920, height: 700 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
  { name: '844x390', width: 844, height: 390 },
];
const animations = [
  { search: 'Bryteren', player: 1 },
  { search: 'Murbyggerne', player: 0 },
  { search: 'Pasning til mål', player: 0 },
  { search: 'Vendespill', player: 3, age: 'Voksne' },
  { search: 'Vendingsstafett', player: 0 },
];

/**
 * Alle spillere (drakt og etikett), ballen og utstyret er helt synlige: innenfor
 * utsnittet, innenfor flaten banen får og innenfor vinduet. Gir en liste over det som ikke er det.
 */
function hiddenParts(dialog: Locator) {
  return dialog.evaluate(root => {
    const svg = root.querySelector<SVGSVGElement>('[data-testid="drill-animation-pitch"]')!;
    const area = root.querySelector('[data-testid="drill-animation-area"]')!.getBoundingClientRect();
    const matrix = svg.getScreenCTM()!;
    const { x, y, width, height } = svg.viewBox.baseVal;
    const a = new DOMPoint(x, y).matrixTransform(matrix), b = new DOMPoint(x + width, y + height).matrixTransform(matrix);
    const left = Math.max(a.x, area.left, 0), top = Math.max(a.y, area.top, 0);
    const right = Math.min(b.x, area.right, innerWidth), bottom = Math.min(b.y, area.bottom, innerHeight);
    const parts = Array.from(svg.parentElement!.querySelectorAll('[data-player], [data-item], [data-ball] > circle[r="10"]'));
    if (parts.length < 3) return ['for få deler på banen'];
    return parts.flatMap(el => {
      const box = el.getBoundingClientRect();
      const inside = box.width > 0 && box.left >= left - .5 && box.right <= right + .5 && box.top >= top - .5 && box.bottom <= bottom + .5;
      return inside ? [] : [`${el.getAttribute('data-player') ? 'spiller' : el.getAttribute('data-item') ? 'utstyr' : 'ball'} ${Math.round(box.left)},${Math.round(box.top)}–${Math.round(box.right)},${Math.round(box.bottom)}`];
    });
  });
}

/** Vent til siden har tegnet to bilder, så en ny vindusstørrelse har nådd utsnittet (ResizeObserver). */
const nextFrames = (page: Page) => page.evaluate(() =>
  new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

async function allPhasesFit(dialog: Locator, screenshotName?: string) {
  const pitch = dialog.getByTestId('drill-animation-pitch');
  // Utsnittet slik det tegnes i den nye størrelsen, ikke verdien fra før vinduet ble endret.
  await nextFrames(dialog.page());
  const crop = await pitch.getAttribute('viewBox');
  const phaseButtons = dialog.getByRole('button', { name: /^Fase \d:/ });
  for (let i = 0; i < await phaseButtons.count(); i++) {
    await phaseButtons.nth(i).click();
    expect(await pitch.getAttribute('viewBox')).toBe(crop);
    expect(await hiddenParts(dialog), `Alle spillere, ball og alt utstyr i fase ${i + 1} må være helt synlige`).toEqual([]);
    if (screenshotName) await shot(dialog.page(), `${screenshotName}-fase-${i + 1}`);
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

test('tempo: ca. 0,15 s pause og 1,3 s bevegelse, teksten byttes når fasen starter', async ({ page }) => {
  const dialog = await openBryteren(page);
  const changes = await dialog.evaluate(root => new Promise<number[]>(resolve => {
    const text = root.querySelector('[data-testid="drill-animation-text"]')!;
    const button = root.querySelector<HTMLButtonElement>('button[aria-label="Spill av"]')!;
    let last = text.textContent;
    const times: number[] = [];
    const start = performance.now();
    const observer = new MutationObserver(() => {
      if (text.textContent !== last) { last = text.textContent; times.push(performance.now() - start); }
      if (times.length === 3) { observer.disconnect(); resolve(times); }
    });
    observer.observe(text, { childList: true, characterData: true, subtree: true });
    button.click();
  }));
  // Første tekstbytte etter pausen; deretter én bevegelse + én pause mellom hvert bytte.
  expect(changes[0]).toBeGreaterThan(80);
  expect(changes[0]).toBeLessThan(500);
  for (const gap of [changes[1] - changes[0], changes[2] - changes[1]]) {
    expect(gap).toBeGreaterThan(1250);
    expect(gap).toBeLessThan(1700);
  }
});

test('farten påvirker både pausen og bevegelsen', async ({ page }) => {
  const dialog = await openBryteren(page);
  const durations = [];
  for (const speed of ['1', '2', '2.5']) {
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
  // 2,5×: 0,4 av tiden ved 1×, for både pausen og hele avspillingen.
  expect(durations[2].hold).toBeLessThan(durations[0].hold * .65);
  expect(durations[2].total).toBeLessThan(durations[0].total * .5);
  expect(durations[2].total).toBeGreaterThan(durations[0].total * .3);
});

test('farten kan byttes mens øvelsen spiller, uten hopp', async ({ page }) => {
  const dialog = await openBryteren(page);
  const start = Date.now();
  await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_2);
  const speed = dialog.getByRole('combobox', { name: 'Fart', exact: true });
  await expect(speed).toBeEnabled();
  await speed.selectOption('2.5');
  // Fasen som vises, står der den sto; resten går i 2,5×.
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_2);
  await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeVisible({ timeout: 6_000 });
  // 6,0 s ved 1× hele veien; bytte etter ca. 0,5 s gir ca. 2,7 s.
  expect(Date.now() - start).toBeLessThan(5_500);
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_5);
});

test('PC 1536 × 730: hele banen synlig, og «Spill av» glir jevnt bilde for bilde', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 730 });
  const dialog = await openBryteren(page);
  await nextFrames(page);
  // Banen (hele gresset 0–880 × 0–560) ligger innenfor flaten, ikke kuttet oppe eller nede.
  const pitch = await dialog.evaluate(root => {
    const svg = root.querySelector<SVGSVGElement>('[data-testid="drill-animation-pitch"]')!;
    const area = root.querySelector('[data-testid="drill-animation-area"]')!.getBoundingClientRect();
    const ctm = svg.getScreenCTM()!;
    const a = new DOMPoint(0, 0).matrixTransform(ctm), b = new DOMPoint(880, 560).matrixTransform(ctm);
    return { left: a.x - area.left, top: a.y - area.top, right: b.x - area.left, bottom: b.y - area.top, width: area.width, height: area.height };
  });
  expect(pitch.left).toBeGreaterThanOrEqual(-.5);
  expect(pitch.top).toBeGreaterThanOrEqual(-.5);
  expect(pitch.right).toBeLessThanOrEqual(pitch.width + .5);
  expect(pitch.bottom).toBeLessThanOrEqual(pitch.height + .5);
  await shot(page, 'bryteren-2d-1536x730-hele-banen');

  // I hvert skjermbilde står spilleren der klokka sier for bildets tidspunkt:
  // på en rett linje i tid gjennom første bevegelse (jevn fart, ingen hakk).
  const result = await dialog.evaluate(async root => {
    const svg = root.querySelector<SVGSVGElement>('[data-testid="drill-animation-pitch"]')!;
    const at = () => new DOMMatrixReadOnly(getComputedStyle(svg.parentElement!.querySelectorAll('[data-player]')[1].closest('[data-move]')!).transform);
    const frames: { t: number; x: number; y: number }[] = [];
    await new Promise<void>(resolve => {
      const begin = performance.now();
      const tick = (now: number) => {
        const m = at(); frames.push({ t: now, x: m.e, y: m.f });
        if (now - begin < 2000) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
      root.querySelector<HTMLButtonElement>('button[aria-label="Spill av"]')!.click();
    });
    const key = (f: { x: number; y: number }) => `${f.x},${f.y}`;
    const first = frames.findIndex((f, i) => i > 0 && key(f) !== key(frames[i - 1]));
    let last = first;
    while (last + 1 < frames.length && key(frames[last + 1]) !== key(frames[last])) last++;
    const move = frames.slice(first + 1, last);
    // Rett linje gjennom første og siste bilde i bevegelsen; avvik i andeler av ett bildes steg.
    const a = move[0], b = move.at(-1)!;
    const speed = { x: (b.x - a.x) / (b.t - a.t), y: (b.y - a.y) / (b.t - a.t) };
    const step = Math.hypot(speed.x, speed.y) * 16.7;
    const worst = Math.max(...move.map(f => Math.hypot(a.x + speed.x * (f.t - a.t) - f.x, a.y + speed.y * (f.t - a.t) - f.y)));
    return { frames: move.length, worstInSteps: worst / step };
  });
  expect(result.frames).toBeGreaterThan(40);
  expect(result.worstInSteps, 'Spilleren skal stå der klokka sier i hvert bilde').toBeLessThan(0.1);
});

test('øvelsens roller vises i 2D, 3D og den eksporterte videoens etiketter', async ({ page }, info) => {
  const dialog = await openBryteren(page);
  await expect(dialog.getByTestId('drill-animation-figures').locator('[data-role-badge] > text')).toHaveText(['P', 'A', 'F']);
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
  // Øvelsen: rollen over hodet, nummeret bare på drakten (ikke «1 · P» over hodet).
  expect(await labels()).toEqual(expect.arrayContaining(['P', 'A', 'F']));
  expect((await labels()).some(label => /^\d+ · /.test(label))).toBe(false);
  await dialog.getByRole('combobox', { name: 'Fart', exact: true }).selectOption('2');
  await page.evaluate(() => { (window as Window & { drillRoleTexts?: string[] }).drillRoleTexts!.length = 0; });
  const downloadPromise = page.waitForEvent('download', { timeout: 55_000 });
  await exportButton.click();
  const download = await downloadPromise;
  await download.saveAs(info.outputPath(download.suggestedFilename()));
  expect(await download.failure()).toBeNull();
  // Øvelsen: rollen over hodet, nummeret bare på drakten (ikke «1 · P» over hodet).
  expect(await labels()).toEqual(expect.arrayContaining(['P', 'A', 'F']));
  expect((await labels()).some(label => /^\d+ · /.test(label))).toBe(false);
});

test('opptak i 2D: samme opptak som 2D-fullskjermen, med øvelsens tempo', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const dialog = await openBryteren(page);
  await dialog.getByRole('combobox', { name: 'Fart', exact: true }).selectOption('2');
  const record = dialog.getByRole('group', { name: 'Videoopptak' }).getByRole('button', { name: 'Ta opp', exact: true });
  await expect(record).toBeEnabled();
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await record.click();
  await expect(dialog.getByRole('status', { name: 'Opptak pågår' })).toBeVisible();
  // Skjermen viser det som spilles inn: teksten går gjennom fasene.
  await expect(dialog.getByTestId('drill-animation-text')).toHaveText(FASE_3, { timeout: 10_000 });
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/bryteren.*\.(mp4|webm)$/);
  const file = info.outputPath(download.suggestedFilename());
  await download.saveAs(file);
  expect(await download.failure()).toBeNull();
  await expect(dialog.getByRole('group', { name: 'Videoopptak' }).getByRole('button', { name: 'Ta opp', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

/** Mål utsnittets hjørner, alle spillerne og ballen gjennom avspillingen. */
async function sampleMotion(dialog: Locator, playerIndex: number, durationMs = 3600) {
  return dialog.evaluate(async (root, [index, duration]) => {
    const svg = root.querySelector<SVGSVGElement>('[data-testid="drill-animation-pitch"]')!;
    // Figurene tegnes rundt (0, 0) og flyttes med transform: plassen er matrisens e, f.
    const positionOf = (el: Element) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(el.closest('[data-move]') ?? el).transform);
      return { x: matrix.e, y: matrix.f };
    };
    const readPosition = () => positionOf(svg.parentElement!.querySelectorAll('[data-player]')[index]);
    const frames = [];
    const start = performance.now();
    do {
      const matrix = svg.getScreenCTM()!;
      const { x, y, width, height } = svg.viewBox.baseVal;
      const corners = [[x, y], [x + width, y + height]].map(([px, py]) => new DOMPoint(px, py).matrixTransform(matrix));
      const area = root.querySelector('[data-testid="drill-animation-area"]')!.getBoundingClientRect();
      const visible = (box: DOMRect) => box.left >= Math.max(corners[0].x, 0) - .5 && box.right <= Math.min(corners[1].x, innerWidth) + .5
        && box.top >= Math.max(corners[0].y, 0) - .5 && box.bottom <= Math.min(corners[1].y, innerHeight) + .5;
      const ball = svg.parentElement!.querySelector('[data-ball]')!;
      const ballAt = positionOf(ball);
      frames.push({
        time: performance.now() - start, ...readPosition(),
        playersFit: Array.from(svg.parentElement!.querySelectorAll('[data-player]')).every(p => visible(p.getBoundingClientRect())),
        ballFits: visible(ball.querySelector('circle[r="10"]')!.getBoundingClientRect()),
        ballX: ballAt.x, ballY: ballAt.y,
        trail: !!svg.parentElement!.querySelector('[data-ball-trail]'),
        left: corners[0].x, top: corners[0].y, right: corners[1].x, bottom: corners[1].y,
        fits: corners[0].x >= Math.max(0, area.left) - 1 && corners[0].y >= Math.max(0, area.top) - 1
          && corners[1].x <= Math.min(innerWidth, area.right) + 1 && corners[1].y <= Math.min(innerHeight, area.bottom) + 1,
      });
      await new Promise(requestAnimationFrame);
    } while (performance.now() - start < duration);
    return frames;
  }, [playerIndex, durationMs] as const);
}

for (const viewport of viewports) {
  for (const animation of animations) {
    test(`${animation.search}: gradvis bevegelse og stabilt, helt utsnitt på ${viewport.name}`, async ({ page }) => {
      const dialog = await openAnimation(page, animation.search, animation.age);
      await page.setViewportSize(viewport);
      const slug = animation.search.toLowerCase().replace(/[^a-zæøå]+/g, '-');
      const everyPhase = ['Vendingsstafett', 'Murbyggerne'].includes(animation.search);
      await allPhasesFit(dialog, everyPhase ? `${slug}-2d-${viewport.name}` : undefined);
      if (!everyPhase) await shot(page, `${slug}-2d-${viewport.name}`);
      const text = dialog.getByTestId('drill-animation-text');
      await expect(text).toBeVisible();
      // Reservetekstene skal bare måle høyde, aldri tegnes over den aktive teksten.
      await expect(dialog.locator('p[aria-hidden="true"]').first()).toBeHidden();
      await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeInViewport();
      await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
      // Sjekkes mens avspillingen pågår: øvelser med tre faser er ferdige etter ca. 3,1 s.
      await expect(dialog.getByRole('button', { name: 'Pause', exact: true })).toBeInViewport();
      const frames = await sampleMotion(dialog, animation.player);
      expect(frames.every(frame => frame.fits && frame.playersFit && frame.ballFits), 'Utsnitt, spillere og ball må være synlige i hvert bilde').toBe(true);
      for (const edge of ['left', 'top', 'right', 'bottom'] as const) {
        const positions = frames.map(frame => frame[edge]);
        expect(Math.max(...positions) - Math.min(...positions), `Banens ${edge} flyttet seg ved tekstbytte`).toBeLessThan(1);
      }
      // Pause 0,15 s, bevegelse 1,3 s, pause 0,15 s i fase 2. Tidene måles fra når spilleren begynner å gå.
      const initial = frames[0];
      const moveStart = frames.find(frame => frame.x !== initial.x || frame.y !== initial.y)!.time;
      expect(moveStart).toBeLessThan(700);
      const arrivedAt = moveStart + 1300;
      const arrived = frames.find(frame => frame.time > arrivedAt + 60)!;
      const distance = Math.hypot(arrived.x - initial.x, arrived.y - initial.y);
      expect(distance).toBeGreaterThan(1);
      const between = frames.filter(frame => {
        const moved = Math.hypot(frame.x - initial.x, frame.y - initial.y);
        return moved > distance * 0.05 && moved < distance * 0.95;
      });
      expect(new Set(between.map(frame => `${frame.x},${frame.y}`)).size).toBeGreaterThanOrEqual(3);
      // En ekte pause: samme stilling gjennom pausen i fase 2.
      const hold = frames.filter(frame => frame.time > arrivedAt + 30 && frame.time < arrivedAt + 120);
      expect(hold.length).toBeGreaterThan(3);
      expect(new Set(hold.map(frame => `${frame.x},${frame.y}`)).size).toBe(1);
      // En overgang skal gli jevnt, uten et stort hopp mellom nabobilder.
      const firstTransition = frames.filter(frame => frame.time < arrivedAt + 60);
      for (let i = 1; i < firstTransition.length; i++) {
        const before = firstTransition[i - 1], after = firstTransition[i];
        expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(distance * 0.3);
      }
      await expect(dialog.getByTestId('drill-animation-text')).toBeInViewport();
    });
  }

  test(`fullskjerm: alt synlig i alle faser i 2D og 3D på ${viewport.name}`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    for (const animation of animations) {
      const dialog = await openAnimation(page, animation.search, animation.age);
      await page.setViewportSize(viewport);
      await dialog.getByRole('button', { name: 'Fullskjerm for animasjonen', exact: true }).click();
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
      await allPhasesFit(dialog);
      await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
      const frames = await sampleMotion(dialog, animation.player, 2500);
      expect(frames.every(frame => frame.fits && frame.playersFit && frame.ballFits), `${animation.search} i fullskjerm`).toBe(true);
      await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
      await dialog.getByRole('button', { name: 'Lukk fullskjerm', exact: true }).click();
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
      await dialog.getByRole('button', { name: 'Lukk animasjonen', exact: true }).click();
      await page.setViewportSize({ width: 1400, height: 900 });
    }
    expect(errors).toEqual([]);
  });

  test(`3D: hele lerretet synlig, i og utenfor fullskjerm, på ${viewport.name}`, async ({ page }) => {
    // En shader som ikke kompilerer (f.eks. heltall i GLSL) gir grått gress.
    const shaderErrors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error' && /WebGLProgram|Shader Error|wrong operand/i.test(message.text())) shaderErrors.push(message.text());
    });
    for (const search of ['Vendingsstafett', 'Murbyggerne', 'Bryteren']) {
      const dialog = await openAnimation(page, search);
      await page.setViewportSize(viewport);
      await dialog.getByRole('button', { name: '3D', exact: true }).click();
      const region = dialog.getByRole('region', { name: '3D-visning' });
      await expect(region.getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
      await expect(region.getByText('Laster spillermodell og himmel …', { exact: true })).toHaveCount(0, { timeout: 45_000 });
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
      const slug = search.toLowerCase();
      await checkCanvas();
      if (search === 'Bryteren') {
        await shot(page, `${slug}-3d-${viewport.name}`);
      } else {
        const phaseButtons = dialog.getByRole('button', { name: /^Fase \d:/ });
        for (let i = 0; i < await phaseButtons.count(); i++) {
          await phaseButtons.nth(i).click();
          await page.waitForTimeout(250);
          await shot(page, `${slug}-3d-${viewport.name}-fase-${i + 1}`);
        }
        await phaseButtons.first().click();
      }
      await dialog.getByRole('button', { name: 'Fullskjerm for animasjonen', exact: true }).click();
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
      await checkCanvas();
      await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
      await page.waitForTimeout(1000);
      await checkCanvas();
      await shot(page, `${slug}-3d-fullskjerm-${viewport.name}`);
      await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
      await dialog.getByRole('button', { name: 'Lukk fullskjerm', exact: true }).click();
      await checkCanvas();
      // Gjenbruk også brettets egen 3D-fullskjerm og dens avspillingskontroller.
      if (search === 'Bryteren') {
        await region.getByRole('button', { name: 'Fullskjerm for 3D', exact: true }).click();
        await expect(page.getByRole('dialog', { name: '3D-bane i fullskjerm', exact: true })).toBeVisible();
        await checkCanvas();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: '3D-bane i fullskjerm', exact: true })).toHaveCount(0);
        await expect(dialog).toBeVisible();
      }
      await dialog.getByRole('button', { name: 'Lukk animasjonen', exact: true }).click();
      await page.setViewportSize({ width: 1400, height: 900 });
    }
    expect(shaderErrors).toEqual([]);
  });
}

/** Bildene der ballen er på vei (den stiplede streken vises), målt i `durationMs`. */
async function ballInFlight(dialog: Locator, durationMs: number) {
  const frames = await sampleMotion(dialog, 0, durationMs);
  return frames.filter(frame => frame.trail);
}

test('sentringen i Vendingsstafett og skuddet i Murbyggerne reiser synlig', async ({ page }) => {
  for (const { search, phase, total, name } of [
    { search: 'Vendingsstafett', phase: 4, total: 2600, name: 'vendingsstafett-midt-i-sentringen' },
    { search: 'Murbyggerne', phase: 2, total: 2600, name: 'murbyggerne-midt-i-skuddet' },
  ]) {
    const dialog = await openAnimation(page, search);
    // Start i fasen før ballen spilles.
    await dialog.getByRole('button', { name: new RegExp(`^Fase ${phase}:`) }).click();
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    const flying = await ballInFlight(dialog, total);
    // Minst tre ulike mellomposisjoner, og ingen hopp: ballen glir bilde for bilde.
    expect(new Set(flying.map(f => `${f.ballX.toFixed(1)},${f.ballY.toFixed(1)}`)).size, search).toBeGreaterThanOrEqual(3);
    expect(flying.length).toBeGreaterThan(10);
    const first = flying[0], last = flying.at(-1)!;
    const length = Math.hypot(last.ballX - first.ballX, last.ballY - first.ballY);
    for (let i = 1; i < flying.length; i++) {
      expect(Math.hypot(flying[i].ballX - flying[i - 1].ballX, flying[i].ballY - flying[i - 1].ballY)).toBeLessThan(length * 0.35 + 1);
    }
    // Skjermbilde midt i: start igjen, vent til streken vises og litt til.
    await dialog.getByRole('button', { name: new RegExp(`^Fase ${phase}:`) }).click();
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    // The semantic marker wraps absolutely positioned SVG layers and has no own box.
    await dialog.locator('[data-ball-trail]').waitFor({ state: 'attached' });
    await page.waitForTimeout(350);
    await shot(page, name);
    await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
    // Også i 3D.
    await dialog.getByRole('button', { name: '3D', exact: true }).click();
    const region = dialog.getByRole('region', { name: '3D-visning' });
    await expect(region.getByText('Laster spillermodell og himmel …', { exact: true })).toHaveCount(0, { timeout: 45_000 });
    await expect(region.getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
    await dialog.getByRole('button', { name: new RegExp(`^Fase ${phase}:`) }).click();
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    // Pause (0,15 s) + 30 % av bevegelsen før ballen spilles + litt av flukten.
    await page.waitForTimeout(150 + 390 + 400);
    await shot(page, `${name}-3d`);
    await dialog.getByRole('button', { name: 'Lukk animasjonen', exact: true }).click();
  }
});

test('fasevalg og pause avbryter ventetiden, og siste fase kan spilles om igjen', async ({ page }) => {
  const dialog = await openBryteren(page);
  // 0,5×: pausen før første bevegelse er 0,3 s, så «Pause» rekker å komme inne i den (ved 2× bare 75 ms).
  await dialog.getByRole('combobox', { name: 'Fart', exact: true }).selectOption('0.5');
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
