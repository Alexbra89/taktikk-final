import path from 'node:path';
import { test, expect, type Page, type Locator } from '@playwright/test';

// «Se animert» med Windows-skalering (devicePixelRatio som ikke er et heltall).
// Reproduksjon av feilen fra PC-en med devicePixelRatio 1,65: dialogen bredere
// enn vinduet, for stor bane og hakking. Alt måles i CSS-piksler; bare
// oppløsningen på 3D-lerretet skal avhenge av devicePixelRatio.
test.use({ serviceWorkers: 'block', reducedMotion: 'no-preference' });

const SHOTS = path.join(process.cwd(), '_skjermbilder');

async function openBryteren(page: Page) {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
  await page.getByRole('button', { name: 'Barn', exact: true }).click();
  await page.getByPlaceholder('Søk etter øvelse…').fill('Bryteren');
  await page.getByRole('heading', { level: 3, name: /Bryteren/ }).click();
  await page.getByRole('button', { name: 'Se animert', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: /^Animert øvelse:/ });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Mål og alt som stikker utenfor vinduet, i CSS-piksler. */
function layoutReport(dialog: Locator) {
  return dialog.evaluate(root => {
    const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const outside: string[] = [];
    const visible = (el: Element) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const check = (name: string, el: Element | null) => {
      if (!el || !visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.left < -.5 || r.top < -.5 || r.right > vw + .5 || r.bottom > vh + .5) {
        outside.push(`${name} ${Math.round(r.left)},${Math.round(r.top)}–${Math.round(r.right)},${Math.round(r.bottom)}`);
      }
    };
    check('dialog', root);
    check('bane', root.querySelector('[data-testid="drill-animation-area"]'));
    check('tekst', root.querySelector('[data-testid="drill-animation-text"]'));
    root.querySelectorAll('button, a, select').forEach(el => check(el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName, el));
    const area = root.querySelector('[data-testid="drill-animation-area"]') as HTMLElement | null;
    const svg = root.querySelector<SVGSVGElement>('[data-testid="drill-animation-pitch"]');
    const canvas = root.querySelector<HTMLCanvasElement>('[data-testid="board-3d"] canvas');
    return {
      outside,
      innerWidth, innerHeight, clientWidth: vw, clientHeight: vh, dpr: devicePixelRatio,
      dialogWidth: root.getBoundingClientRect().width, scrollWidth: document.documentElement.scrollWidth,
      dialogHeight: root.getBoundingClientRect().height,
      dialogScrollWidth: root.scrollWidth,
      area: area && { width: area.clientWidth, height: area.clientHeight },
      viewBox: svg?.getAttribute('viewBox') ?? null,
      canvas: canvas && { width: canvas.width, height: canvas.height, cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight },
    };
  });
}

/**
 * Utsnittet i 2D, i CSS-piksler: viewBox, flaten, hvor utsnittet havner på
 * skjermen (relativt til flaten), og draktene/ballen/utstyret som klippes.
 */
function cropReport(dialog: Locator) {
  return dialog.evaluate(root => {
    const area = root.querySelector<HTMLElement>('[data-testid="drill-animation-area"]')!;
    const svg = root.querySelector<SVGSVGElement>('[data-testid="drill-animation-pitch"]')!;
    const a = area.getBoundingClientRect();
    const [x, y, width, height] = svg.getAttribute('viewBox')!.split(/[\s,]+/).map(Number);
    const ctm = svg.getScreenCTM()!;
    const p1 = new DOMPoint(x, y).matrixTransform(ctm), p2 = new DOMPoint(x + width, y + height).matrixTransform(ctm);
    // Det synlige utsnittet: viewBox på skjermen, avgrenset av flaten.
    const visible = {
      left: Math.max(p1.x, a.left), top: Math.max(p1.y, a.top),
      right: Math.min(p2.x, a.right), bottom: Math.min(p2.y, a.bottom),
    };
    const parts: [string, Element][] = [
      ...Array.from(svg.querySelectorAll('[data-player="true"]'), (el, i): [string, Element] => [`spiller ${i + 1}`, el]),
      ...Array.from(svg.querySelectorAll('[data-item="true"] > g'), (el, i): [string, Element] => [`utstyr ${i + 1}`, el]),
      ...Array.from(svg.querySelectorAll('g[filter] > circle[r="10"]'))
        .filter(el => !el.closest('[data-player]')).map((el): [string, Element] => ['ball', el]),
    ];
    const clipped = parts.flatMap(([name, el]) => {
      const r = el.getBoundingClientRect();
      return r.left < visible.left - 1.5 || r.top < visible.top - 1.5 || r.right > visible.right + 1.5 || r.bottom > visible.bottom + 1.5
        ? [`${name} ${Math.round(r.left - a.left)},${Math.round(r.top - a.top)}–${Math.round(r.right - a.left)},${Math.round(r.bottom - a.top)}`]
        : [];
    });
    return {
      viewBox: { x, y, width, height },
      area: { width: a.width, height: a.height },
      crop: { left: p1.x - a.left, top: p1.y - a.top, right: p2.x - a.left, bottom: p2.y - a.top },
      players: parts.filter(([name]) => name.startsWith('spiller')).length,
      clipped,
    };
  });
}

/** Utsnittet i alle faser: alt innholdet får plass, og utsnittet fyller flaten (contain). */
async function checkCropAllPhases(dialog: Locator, label: string) {
  const phaseButtons = dialog.getByRole('group', { name: 'Faser', exact: true }).getByRole('button');
  const phases = await phaseButtons.count();
  expect(phases).toBeGreaterThanOrEqual(3);
  const reports = [];
  for (let i = 0; i < phases; i++) {
    await phaseButtons.nth(i).click();
    await expect(phaseButtons.nth(i)).toHaveAttribute('aria-current', 'step');
    await dialog.page().evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const report = await cropReport(dialog);
    reports.push(report);
    expect(report.players, `${label} fase ${i + 1}: spillere i 2D`).toBeGreaterThan(0);
    expect(report.clipped, `${label} fase ${i + 1}: alt i fasen skal være innenfor utsnittet`).toEqual([]);
  }
  // Samme utsnitt i alle faser, og det ligger inne i flaten og fyller den i minst én retning.
  const { crop, area, viewBox } = reports[0];
  for (const r of reports) expect(r.viewBox).toEqual(viewBox);
  expect(crop.left).toBeGreaterThanOrEqual(-.5);
  expect(crop.top).toBeGreaterThanOrEqual(-.5);
  expect(crop.right).toBeLessThanOrEqual(area.width + .5);
  expect(crop.bottom).toBeLessThanOrEqual(area.height + .5);
  const fillsWidth = Math.abs(crop.right - crop.left - area.width) < 1.5;
  const fillsHeight = Math.abs(crop.bottom - crop.top - area.height) < 1.5;
  expect(fillsWidth || fillsHeight, `${label}: utsnittet skal fylle flaten i bredde eller høyde`).toBe(true);
  return reports[0];
}

/** Teller 3D-bildene via three.js' devtools-krok (ingen testkroker i appen), som pitch-depth.spec.ts. */
function watch3DRenders(page: Page) {
  return page.addInitScript(() => {
    type Obj = { position: { x: number; z: number } };
    const w = window as unknown as { __THREE_DEVTOOLS__: EventTarget; __drill3d: { renders: number; signature: number } };
    w.__drill3d = { renders: 0, signature: 0 };
    w.__THREE_DEVTOOLS__ = new EventTarget();
    w.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      const renderer = (event as CustomEvent).detail as { isWebGLRenderer?: boolean; render: (scene: unknown, camera: unknown) => void };
      if (!renderer?.isWebGLRenderer) return;
      const render = renderer.render.bind(renderer);
      renderer.render = (scene, camera) => {
        if ((camera as { isPerspectiveCamera?: boolean }).isPerspectiveCamera) {
          // Figurene og ballen ligger rett i scenen: posisjonene deres som ett tall.
          let signature = 0;
          (scene as { children: Obj[] }).children.forEach((o, i) => { signature += o.position.x * (i + 1) + o.position.z * (i + 3); });
          w.__drill3d.renders++;
          w.__drill3d.signature = signature;
        }
        render(scene, camera);
      };
    });
  });
}

/** Reacts devtools-krok teller faktisk arbeid, uten målekode i appen. */
function watchReactRenders(page: Page) {
  return page.addInitScript(() => {
    type Fiber = { flags: number; type?: { name?: string; displayName?: string }; child?: Fiber; sibling?: Fiber; alternate?: Fiber };
    const counts: Record<string, number> = {};
    const w = window as unknown as { __drillReact: typeof counts; __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown };
    w.__drillReact = counts;
    const renderers = new Map();
    w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true, renderers,
      inject(renderer: unknown) { const id = renderers.size + 1; renderers.set(id, renderer); return id; },
      onCommitFiberRoot(_id: number, root: { current: Fiber }) {
        const visit = (fiber?: Fiber) => {
          for (let node = fiber; node; node = node.sibling) {
            const name = node.type?.displayName || node.type?.name;
            if (name && (node.flags & 1)) counts[name] = (counts[name] ?? 0) + 1;
            // Memo gjenbruker hele child-pekeren; gamle flags på disse nodene
            // er fra forrige tegning og betyr ikke at de ble tegnet nå.
            if (node.child !== node.alternate?.child) visit(node.child);
          }
        };
        visit(root.current);
      },
      onCommitFiberUnmount() {},
    };
  });
}

/**
 * requestAnimationFrame-teller under avspilling, og hvor mange bilder banen
 * faktisk endret seg i: 2D via SVG-en, 3D via scenen som faktisk ble tegnet.
 */
function measureFps(dialog: Locator, durationMs: number, view: '2d' | '3d') {
  return dialog.evaluate(async (root, { duration, mode }) => {
    const stats = (window as unknown as { __drill3d?: { renders: number; signature: number } }).__drill3d;
    const react = (window as unknown as { __drillReact?: Record<string, number> }).__drillReact;
    const beforeViewer = react?.DrillAnimationViewer ?? 0, beforePitch = react?.FootballPitch ?? 0;
    if (mode === '3d' && !stats?.renders) throw new Error('3D-bildene telles ikke (watch3DRenders mangler eller ingen tegning ennå)');
    let changed = 0, dirty = false, renders = 0, extraRenders = 0;
    let lastRenders = stats?.renders ?? 0, lastSignature = stats?.signature ?? 0;
    const observer = new MutationObserver(() => { dirty = true; });
    const target = root.querySelector('[data-testid="drill-animation-pitch"]');
    if (mode === '2d') {
      if (!target) throw new Error('Fant ikke 2D-banen');
      observer.observe(target, { attributes: true, childList: true, subtree: true, characterData: true });
    }
    const intervals: number[] = [];
    const start = performance.now();
    let last = start;
    await new Promise<void>(resolve => {
      const tick = (now: number) => {
        intervals.push(now - last); last = now;
        if (mode === '3d' && stats) {
          const delta = stats.renders - lastRenders;
          renders += delta; if (delta > 1) extraRenders += delta - 1;
          if (delta > 0 && Math.abs(stats.signature - lastSignature) > 1e-6) dirty = true;
          lastRenders = stats.renders; lastSignature = stats.signature;
        }
        if (dirty) { changed++; dirty = false; }
        if (now - start < duration) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
    observer.disconnect();
    const seconds = (performance.now() - start) / 1000;
    const sorted = intervals.slice(1).sort((a, b) => a - b);
    return {
      fps: Math.round(intervals.length / seconds * 10) / 10,
      changedPerSecond: Math.round(changed / seconds * 10) / 10,
      rendersPerSecond: Math.round(renders / seconds * 10) / 10,
      extraRenders,
      frames: intervals.length,
      p95: Math.round(sorted[Math.floor(sorted.length * .95)] ?? 0),
      longFrames: sorted.filter(ms => ms > 50).length,
      viewerRenders: (react?.DrillAnimationViewer ?? 0) - beforeViewer,
      pitchRenders: (react?.FootballPitch ?? 0) - beforePitch,
      reactHookWorking: beforeViewer > 0 && beforePitch > 0,
    };
  }, { duration: durationMs, mode: view });
}

const viewports = [
  { width: 1536, height: 730 },
  { width: 1280, height: 650 },
  { width: 1890, height: 960 },
  { width: 652, height: 576 },
];

for (const deviceScaleFactor of [1.65, 1.25, 1.5]) {
  for (const viewport of viewports) {
    const name = `${viewport.width}x${viewport.height} @${deviceScaleFactor}`;
    test.describe(name, () => {
      test.use({ viewport, deviceScaleFactor });

      test(`dialogen, banen og teksten får plass i vinduet (${name})`, async ({ page }) => {
        const dialog = await openBryteren(page);
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const report = await layoutReport(dialog);
        console.log(`[${name}] 2D`, JSON.stringify(report));
        await page.screenshot({ path: path.join(SHOTS, `dpr-${deviceScaleFactor}-${viewport.width}x${viewport.height}-2d.png`) });
        expect(report.dpr).toBeCloseTo(deviceScaleFactor, 2);
        expect(report.dialogWidth).toBeLessThanOrEqual(report.clientWidth + .5);
        expect(report.dialogHeight).toBeLessThanOrEqual(report.clientHeight + .5);
        expect(report.scrollWidth).toBeLessThanOrEqual(report.clientWidth);
        expect(report.dialogScrollWidth).toBeLessThanOrEqual(report.clientWidth + 1);
        expect(report.outside, 'Ingenting i dialogen skal stikke utenfor vinduet').toEqual([]);
        await expect(dialog.getByTestId('drill-animation-text')).toBeInViewport({ ratio: 1 });
        await expect(dialog.getByRole('button', { name: 'Spill av', exact: true })).toBeInViewport({ ratio: 1 });
        await expect(dialog.getByRole('button', { name: 'Lukk animasjonen', exact: true })).toBeInViewport({ ratio: 1 });
        const crop = await checkCropAllPhases(dialog, name);
        console.log(`[${name}] utsnitt`, JSON.stringify(crop));
      });
    });
  }
}

test.describe('vindusendring og større tekst @1.65', () => {
  test.use({ viewport: { width: 1536, height: 730 }, deviceScaleFactor: 1.65 });

  test('tekst og kontroller får plass også etter endring mens 2D spiller', async ({ page }) => {
    const dialog = await openBryteren(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    for (const viewport of [{ width: 1536, height: 730 }, { width: 752, height: 650 }, { width: 1890, height: 960 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const report = await layoutReport(dialog);
      console.log('[vindusendring, 150% tekst]', JSON.stringify(report));
      expect(report.outside).toEqual([]);
      expect(report.dialogScrollWidth).toBeLessThanOrEqual(viewport.width);
      await expect(dialog.getByTestId('drill-animation-text')).toBeInViewport({ ratio: 1 });
      await expect(dialog.getByRole('group', { name: 'Avspilling', exact: true })).toBeInViewport({ ratio: 1 });
    }
  });
});

test.describe('3D-taket ved DPR 3', () => {
  test.use({ viewport: { width: 1536, height: 730 }, deviceScaleFactor: 3 });
  test('lerretet bruker høyst 1,75 også etter vindusendring', async ({ page }) => {
    const dialog = await openBryteren(page);
    await dialog.getByRole('button', { name: '3D', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
    for (const viewport of [{ width: 1536, height: 730 }, { width: 1890, height: 960 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const report = await layoutReport(dialog);
      const canvas = report.canvas!;
      expect(report.dpr).toBe(3);
      expect(canvas.width / canvas.cssWidth).toBeCloseTo(1.75, 2);
      expect(canvas.height / canvas.cssHeight).toBeCloseTo(1.75, 2);
      expect(canvas.width / canvas.cssWidth).toBeLessThanOrEqual(1.75);
      expect(canvas.height / canvas.cssHeight).toBeLessThanOrEqual(1.75);
      expect(report.outside).toEqual([]);
    }
  });
});

// Utsnittet regnes i CSS-piksler: samme vindu gir samme flate, viewBox og
// plassering på skjermen uansett devicePixelRatio, også mot 1 (som på telefon og i testene før).
for (const viewport of viewports) {
  test(`samme utsnitt ved devicePixelRatio 1, 1.25, 1.5 og 1.65 (${viewport.width}x${viewport.height})`, async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    const results: { dpr: number; crop: Awaited<ReturnType<typeof cropReport>> }[] = [];
    for (const deviceScaleFactor of [1, 1.25, 1.5, 1.65]) {
      const context = await browser.newContext({ baseURL, viewport, deviceScaleFactor, serviceWorkers: 'block', reducedMotion: 'no-preference' });
      try {
        const page = await context.newPage();
        const dialog = await openBryteren(page);
        const crop = await checkCropAllPhases(dialog, `${viewport.width}x${viewport.height} @${deviceScaleFactor}`);
        results.push({ dpr: deviceScaleFactor, crop });
      } finally {
        await context.close();
      }
    }
    console.log(`[${viewport.width}x${viewport.height}] utsnitt per DPR`, JSON.stringify(results));
    const [reference, ...others] = results;
    for (const { dpr, crop } of others) {
      const label = `@${dpr} mot @1`;
      expect(Math.abs(crop.area.width - reference.crop.area.width), `${label}: flatens bredde`).toBeLessThanOrEqual(1);
      expect(Math.abs(crop.area.height - reference.crop.area.height), `${label}: flatens høyde`).toBeLessThanOrEqual(1);
      for (const key of ['x', 'y', 'width', 'height'] as const) {
        const tolerance = Math.max(1, reference.crop.viewBox[key === 'x' || key === 'width' ? 'width' : 'height'] * .01);
        expect(Math.abs(crop.viewBox[key] - reference.crop.viewBox[key]), `${label}: viewBox ${key}`).toBeLessThanOrEqual(tolerance);
      }
      for (const key of ['left', 'top', 'right', 'bottom'] as const) {
        expect(Math.abs(crop.crop[key] - reference.crop.crop[key]), `${label}: utsnittet på skjermen, ${key}`).toBeLessThanOrEqual(1.5);
      }
    }
  });
}

for (const viewport of [{ width: 1536, height: 730 }, { width: 1890, height: 960 }]) {
test.describe(`bildefrekvens @1.65 ${viewport.width}x${viewport.height}`, () => {
  test.use({ viewport, deviceScaleFactor: 1.65 });

  test('2D og 3D tegner jevnt, og 3D-lerretet har tak på oppløsningen', async ({ page }) => {
    test.setTimeout(120_000);
    await watchReactRenders(page);
    await watch3DRenders(page);
    const dialog = await openBryteren(page);

    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    const fps2d = await measureFps(dialog, 3000, '2d');
    console.log(`[1.65 ${viewport.width}x${viewport.height}] 2D`, JSON.stringify(fps2d));
    await dialog.getByRole('button', { name: 'Pause', exact: true }).click();

    await dialog.getByRole('button', { name: '3D', exact: true }).click();
    const region = dialog.getByRole('region', { name: '3D-visning' });
    await expect(region.getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
    await expect(region.getByText('Laster spillermodell og himmel …', { exact: true })).toHaveCount(0, { timeout: 45_000 });
    const report = await layoutReport(dialog);
    console.log(`[1.65 ${viewport.width}x${viewport.height}] 3D`, JSON.stringify(report));
    await page.screenshot({ path: path.join(SHOTS, `dpr-1.65-${viewport.width}x${viewport.height}-3d.png`) });
    expect(report.outside, 'Ingenting i 3D-dialogen skal stikke utenfor vinduet').toEqual([]);
    await dialog.getByRole('button', { name: /^Fase 1:/ }).click();
    await dialog.getByRole('button', { name: 'Spill av', exact: true }).click();
    const fps3d = await measureFps(dialog, 3000, '3d');
    console.log(`[1.65 ${viewport.width}x${viewport.height}] 3D`, JSON.stringify(fps3d));

    // Bekreft det faktiske taket i BoardScene, ikke et løsere tak på 2.
    const canvas = report.canvas!;
    expect(canvas.width / canvas.cssWidth).toBeCloseTo(1.65, 2);
    expect(canvas.height / canvas.cssHeight).toBeCloseTo(1.65, 2);
    expect(canvas.width / canvas.cssWidth).toBeLessThanOrEqual(1.75);
    expect(canvas.height / canvas.cssHeight).toBeLessThanOrEqual(1.75);
    // Jevnt: nesten hvert skjermbilde, uten lange stopp.
    for (const fps of [fps2d, fps3d]) {
      expect(fps.fps).toBeGreaterThan(45);
      expect(fps.longFrames).toBeLessThanOrEqual(3);
    }
    // Banen endres faktisk under bevegelse: 2D-SVG-en, og i 3D scenen som tegnes
    // (en frosset 3D-scene med jevn rAF-løkke skal ikke bestå).
    expect(fps2d.changedPerSecond).toBeGreaterThan(30);
    expect(fps2d.reactHookWorking, 'React-målingen må ha sett dialogen og banen').toBe(true);
    expect(fps2d.viewerRenders, 'Dialogen skal bare oppdateres ved fasebytte').toBeLessThan(20);
    expect(fps2d.pitchRenders, 'Fast bane skal gjenbrukes under avspilling').toBe(0);
    expect(fps3d.rendersPerSecond, '3D skal tegnes i (nesten) hvert skjermbilde').toBeGreaterThan(45);
    expect(fps3d.changedPerSecond, 'Figurene/ballen i 3D skal flytte seg under avspilling').toBeGreaterThan(30);
    // Én tegning per skjermbilde: ikke flere 3D-tegninger enn skjermbilder.
    expect(fps3d.extraRenders, 'Høyst én 3D-tegning per skjermbilde').toBeLessThanOrEqual(Math.ceil(fps3d.frames * .05));
  });
});
}
