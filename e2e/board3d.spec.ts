import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { BoardItemType, Drawing, Tactic } from '../src/types';

const svg = 'svg[viewBox="0 0 880 560"]';
async function openBoard(page: Page) {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk', exact: true }).click();
  await expect(page.locator(svg).first()).toBeVisible();
}
async function open3D(page: Page) {
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('region', { name: '3D-visning' }).getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
  await expect(page.locator('[data-testid="board-3d"] canvas')).toBeVisible();
}
async function savedTactics(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('taktikkboard-storage')!).state.tactics);
}

test('3D is read-only, camera controls work, and switching back preserves 2D', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await openBoard(page);
  await page.getByRole('button', { name: 'Legg til fase', exact: true }).click();
  const before = await savedTactics(page);
  await open3D(page);
  await expect(page.getByRole('button', { name: 'Tegn', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Utstyr', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ovenfra', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom inn i 3D', exact: true }).click();
  await page.getByRole('button', { name: 'Følg ballen', exact: true }).click();
  await page.getByRole('button', { name: 'Spillerperspektiv', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Velg spillerperspektiv' })).toContainText('1 · Keeper');
  await page.getByRole('button', { name: 'Tilbakestill kamera', exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: info.outputPath('3d-desktop.png') });
  expect(await savedTactics(page)).toEqual(before);
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.locator(svg).first()).toBeVisible();
  expect(await savedTactics(page)).toEqual(before);
  await expect(page.getByRole('button', { name: 'Tegn', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('switching views during playback keeps the same shared phase clock', async ({ page }) => {
  await openBoard(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Legg til fase', exact: true }).click();
  await open3D(page); // warm lazy chunk before starting the clock
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await page.getByRole('button', { name: 'Spill av fasene', exact: true }).click();
  await page.waitForTimeout(1400);
  await open3D(page);
  const active = await page.getByRole('tablist', { name: 'Faser', exact: true }).getByRole('tab', { selected: true }).textContent();
  expect(active).not.toBe('Fase 1');
  await expect(page.getByRole('button', { name: 'Stopp avspilling', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Spill av fasene', exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tablist', { name: 'Faser', exact: true }).getByRole('tab', { selected: true })).toContainText('Fase 4');
});

test('mobile 3D has a visible pitch and controls without page overflow', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBoard(page); await open3D(page);
  await page.waitForTimeout(800);
  const box = await page.locator('[data-testid="board-3d"]').boundingBox();
  expect(box!.width).toBeGreaterThan(300); expect(box!.height).toBeGreaterThan(180);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('3d-mobile.png') });
});

test('all equipment and drawing types render in 3D without altering the tactic', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await openBoard(page);
  await page.getByRole('button', { name: 'Legg til fase', exact: true }).click();
  await page.evaluate(() => {
    const storage = JSON.parse(localStorage.getItem('taktikkboard-storage')!);
    const tactic: Tactic = storage.state.tactics.find((t: Tactic) => t.id === storage.state.activeTacticId);
    const types: BoardItemType[] = ['cone', 'opponent', 'minigoal', 'mannequin', 'ladder', 'hurdle', 'ball', 'player'];
    const drawings: Drawing[] = [
      { id: 'a', type: 'arrow', color: '#fff', colorKey: 'white', pts: [{ x: 400, y: 180 }, { x: 600, y: 180 }] },
      { id: 'b', type: 'curved-arrow', color: '#fff', colorKey: 'blue', pts: [{ x: 400, y: 230 }, { x: 480, y: 150 }, { x: 600, y: 230 }] },
      { id: 'c', type: 'dashed', color: '#fff', colorKey: 'orange', pts: [{ x: 400, y: 280 }, { x: 600, y: 280 }] },
      { id: 'd', type: 'circle', color: '#fff', colorKey: 'yellow', start: { x: 700, y: 200 }, end: { x: 750, y: 200 } },
      { id: 'e', type: 'rectangle', color: '#fff', colorKey: 'green', start: { x: 400, y: 340 }, end: { x: 520, y: 400 } },
      { id: 'f', type: 'label', color: '#fff', colorKey: 'white', at: { x: 440, y: 470 }, text: 'Press sammen' },
      { id: 'g', color: '#fff', colorKey: 'white', pts: [{ x: 650, y: 350 }, { x: 700, y: 370 }, { x: 730, y: 340 }] },
    ];
    for (const phase of tactic.phases) {
      phase.drawings = drawings;
      phase.items = types.map((type, i) => ({ id: `item-${i}`, type, position: { x: 160 + i * 85, y: 100 }, rotation: i * 30 }));
      phase.players[0].name = 'Ola'; phase.players[1].name = 'Nora';
    }
    localStorage.setItem('taktikkboard-storage', JSON.stringify(storage));
  });
  await page.reload();
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk', exact: true }).click();
  const before = await savedTactics(page);
  await open3D(page);
  await page.getByRole('button', { name: 'Ovenfra', exact: true }).click();
  await page.waitForTimeout(1000);
  await expect(page.getByText('Tegningene kunne ikke lastes i 3D.', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('3d-equipment-drawings.png') });
  expect(await savedTactics(page)).toEqual(before); expect(errors).toEqual([]);
});

for (const format of ['mp4', 'webm'] as const) {
  test(`3D ${format} export decodes at fixed duration and full HD; cancellation leaves the board intact`, async ({ page }, info) => {
    test.setTimeout(120_000);
    if (format === 'webm') await page.addInitScript(() => {
      const original = VideoEncoder.isConfigSupported.bind(VideoEncoder);
      VideoEncoder.isConfigSupported = config => config.codec.startsWith('avc')
        ? Promise.resolve({ supported: false, config }) : original(config);
    });
    await openBoard(page);
    await page.getByRole('button', { name: 'Legg til fase', exact: true }).click();
    const before = await savedTactics(page);
    await open3D(page);
    const button = page.getByRole('button', { name: 'Eksporter 3D-video', exact: true });
    await expect(button).toBeEnabled();
    await button.click();
    await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
    await expect(page.getByText('Videoeksporten ble avbrutt.', { exact: true })).toBeVisible();
    const downloadPromise = page.waitForEvent('download'); await button.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(new RegExp(`-3d-.*\\.${format}$`));
    const file = await download.path(); const bytes = await readFile(file!);
    expect(bytes.length).toBeGreaterThan(20_000);
    await download.saveAs(info.outputPath(`3d-test.${format}`));
    const metadata = await page.evaluate(async ({ base64, format }) => {
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: `video/${format}` }));
      const video = document.createElement('video'); video.muted = true; video.src = url;
      try {
        await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error(video.error?.message)); });
        video.currentTime = 1.8;
        await new Promise<void>((resolve, reject) => { video.onseeked = () => resolve(); video.onerror = () => reject(new Error(video.error?.message)); });
        const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 108;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(video, 0, 0, 192, 108);
        const pixels = ctx.getImageData(0, 0, 192, 108).data;
        let grassPixels = 0;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 1] > pixels[i] * 1.25 && pixels[i + 1] > pixels[i + 2] * 1.1) grassPixels++;
        return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, ready: video.readyState, grassPixels };
      } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
    }, { base64: bytes.toString('base64'), format });
    expect(metadata.width).toBe(1920); expect(metadata.height).toBe(1080);
    expect(metadata.duration).toBeCloseTo(2.3, 1); expect(metadata.ready).toBeGreaterThanOrEqual(2);
    expect(metadata.grassPixels).toBeGreaterThan(1500);
    expect(await savedTactics(page)).toEqual(before);
  });
}
