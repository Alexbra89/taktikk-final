import { test, expect, type Page, type Download } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

async function saved(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('taktikkboard-storage')!).state.tactics);
}

async function metadata(page: Page, download: Download) {
  const bytes = await readFile((await download.path())!);
  expect(bytes.length).toBeGreaterThan(15_000);
  return page.evaluate(async ({ base64, format }) => {
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const video = document.createElement('video'); video.muted = true; video.playsInline = true;
    video.style.cssText = 'position:fixed;left:0;top:0;width:192px;height:89px;pointer-events:none';
    document.body.appendChild(video);
    const url = URL.createObjectURL(new Blob([bytes], { type: `video/${format}` }));
    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error(video.error?.message)); video.src = url;
      });
      // MediaRecorder's WebM has no duration header; seeking finds the real end.
      if (!Number.isFinite(video.duration)) await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve(); video.onerror = () => reject(new Error(video.error?.message)); video.currentTime = 1e6;
      });
      return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, ready: video.readyState };
    } finally { video.removeAttribute('src'); video.load(); video.remove(); URL.revokeObjectURL(url); }
  }, { base64: bytes.toString('base64'), format: download.suggestedFilename().endsWith('.mp4') ? 'mp4' : 'webm' });
}

for (const mode of ['2D', '3D'] as const) for (const format of ['mp4', 'webm'] as const) {
  test(`${mode} fullscreen ${format}: cancel, complete and stop a landscape phone recording`, async ({ page }, info) => {
    test.setTimeout(180_000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ format }) => {
      // Exercise the iPhone-style CSS fullscreen at the exact phone viewport size.
      Object.defineProperty(document, 'fullscreenEnabled', { value: false });
      if (format === 'webm') {
        const supports = MediaRecorder.isTypeSupported.bind(MediaRecorder);
        MediaRecorder.isTypeSupported = mime => !mime.startsWith('video/mp4') && supports(mime);
        const original = VideoEncoder.isConfigSupported.bind(VideoEncoder);
        VideoEncoder.isConfigSupported = config => config.codec.startsWith('avc')
          ? Promise.resolve({ supported: false, config }) : original(config);
      }
    }, { format });
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk', exact: true }).click();
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Legg til fase', exact: true }).click();
    // Distinct phases and notes also verify that previewing does not seek the stored tactic.
    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('taktikkboard-storage')!);
      const tactic = stored.state.tactics.find((t: { id: string }) => t.id === stored.state.activeTacticId);
      tactic.phases.forEach((phase: { name: string; stickyNote: string; ball: { x: number; y: number } }, index: number) => {
        phase.name = `Opptaksfase ${index + 1}`; phase.stickyNote = index % 2 ? 'Press sammen' : '';
        phase.ball = { x: 300 + index * 60, y: 280 };
      });
      localStorage.setItem('taktikkboard-storage', JSON.stringify(stored));
    });
    await page.reload();
    await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk', exact: true }).click();
    if (mode === '3D') {
      await page.getByRole('button', { name: '3D', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Eksporter 3D-video', exact: true })).toBeEnabled({ timeout: 45_000 });
      await page.getByRole('button', { name: 'Fullskjerm for 3D', exact: true }).click();
    } else await page.getByRole('button', { name: 'Fullskjerm', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: `${mode}-bane i fullskjerm` });
    await expect(dialog).toBeVisible();
    const before = await saved(page);
    if (mode === '2D') await dialog.getByRole('button', { name: 'Zoom inn', exact: true }).click();
    else {
      await dialog.getByRole('combobox', { name: 'Kameravinkel', exact: true }).selectOption('ball');
      await dialog.getByRole('button', { name: 'Zoom inn i 3D', exact: true }).click();
    }
    const originalCrop = mode === '2D' ? await dialog.locator('svg[viewBox="0 0 880 560"]').boundingBox() : null;
    let downloads = 0; page.on('download', () => downloads++);
    await dialog.getByRole('button', { name: 'Ta opp', exact: true }).click();
    await expect(dialog.getByRole('status', { name: 'Opptak pågår' })).toBeVisible();
    if (mode === '3D') {
      await dialog.getByRole('combobox', { name: 'Kameravinkel', exact: true }).selectOption('player');
      await dialog.getByRole('combobox', { name: 'Velg spillerperspektiv', exact: true }).selectOption({ index: 1 });
      await dialog.getByRole('button', { name: 'Zoom inn i 3D', exact: true }).click();
    } else await dialog.locator('svg[viewBox="0 0 880 560"]').dispatchEvent('wheel', { ctrlKey: true, deltaY: -100 });
    await dialog.getByRole('button', { name: 'Avbryt', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Ta opp', exact: true })).toBeEnabled();
    expect(downloads).toBe(0); expect(await saved(page)).toEqual(before);
    if (mode === '2D') await expect(dialog.getByRole('button', { name: 'Nullstill zoom' })).toContainText('1.3');
    if (mode === '2D') expect(await dialog.locator('svg[viewBox="0 0 880 560"]').boundingBox()).toEqual(originalCrop);
    else await expect(dialog.getByRole('combobox', { name: 'Kameravinkel', exact: true })).toHaveValue('ball');

    const complete = page.waitForEvent('download', { timeout: 120_000 });
    await dialog.getByRole('button', { name: 'Ta opp', exact: true }).click();
    await expect(dialog.getByRole('status', { name: 'Opptak pågår' })).toContainText('0:01', { timeout: 45_000 });
    await page.screenshot({ path: info.outputPath('recording-indicator.png') });
    if (mode === '3D') {
      for (const view of ['top', 'player', 'overview']) await dialog.getByRole('combobox', { name: 'Kameravinkel', exact: true }).selectOption(view);
      await dialog.getByRole('button', { name: 'Zoom inn i 3D', exact: true }).click();
      await page.mouse.move(420, 150); await page.mouse.down(); await page.mouse.move(470, 170, { steps: 5 }); await page.mouse.up();
    }
    const file = await complete;
    expect(file.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`));
    await file.saveAs(info.outputPath(`fullscreen-${mode}.${format}`));
    const video = await metadata(page, file);
    expect(video.width).toBe(1920);
    expect(video.width / video.height).toBeCloseTo(844 / 390, 2);
    expect(video.duration).toBeGreaterThanOrEqual(4.5); expect(video.duration).toBeLessThan(6.5);
    expect(video.ready).toBeGreaterThanOrEqual(2);
    expect(await saved(page)).toEqual(before);
    if (mode === '2D') expect(await dialog.locator('svg[viewBox="0 0 880 560"]').boundingBox()).toEqual(originalCrop);

    // Normal fullscreen controls fade after inactivity; tapping the pitch wakes them.
    await page.mouse.click(6, 150);
    await expect(dialog.getByRole('button', { name: 'Ta opp', exact: true })).toBeEnabled();
    const stopped = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Ta opp', exact: true }).click();
    await expect(dialog.getByRole('status', { name: 'Opptak pågår' })).toContainText('0:01', { timeout: 45_000 });
    await dialog.getByRole('button', { name: 'Stopp opptak', exact: true }).click();
    const partial = await metadata(page, await stopped);
    expect(partial.duration).toBeGreaterThan(.5); expect(partial.duration).toBeLessThan(video.duration);
    expect(await saved(page)).toEqual(before); expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath('fullscreen-controls.png') });
  });
}
