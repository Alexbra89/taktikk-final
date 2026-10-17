import { test, expect, type Page, type Download } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { sceneCrop } from '../test-support/sceneCrop';

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

/** Four named phases where the ball moves; opens Taktikk. */
async function openTacticWithPhases(page: Page) {
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
}

/** Frame rate and samples of the app's own MP4 muxer (src/lib/videoMux.ts). */
function mp4Track(bytes: Buffer) {
  // The index sits last in the file, after all video data.
  const box = (name: string) => { const at = bytes.lastIndexOf(Buffer.from(name, 'latin1')); expect(at).toBeGreaterThan(3); return at; };
  const mdhd = box('mdhd'), stts = box('stts'), stsz = box('stsz'), stss = box('stss'), stco = box('stco'), avcC = box('avcC');
  const description = bytes.subarray(avcC + 4, avcC - 4 + bytes.readUInt32BE(avcC - 4));
  return {
    fps: bytes.readUInt32BE(mdhd + 16) / bytes.readUInt32BE(stts + 16),
    frames: bytes.readUInt32BE(stts + 12),
    sizes: Array.from({ length: bytes.readUInt32BE(stsz + 12) }, (_, i) => bytes.readUInt32BE(stsz + 16 + i * 4)),
    keys: Array.from({ length: bytes.readUInt32BE(stss + 8) }, (_, i) => bytes.readUInt32BE(stss + 12 + i * 4) - 1),
    offset: bytes.readUInt32BE(stco + 12),
    codec: `avc1.${[1, 2, 3].map(i => description[i].toString(16).padStart(2, '0')).join('')}`,
    description: Array.from(description),
  };
}

/** Decode first, then hash only the central pitch, excluding both HUD overlays.
 * Also construct a negative control from decoded pixels: repeat each scene
 * twice while retaining the current frame's overlays. This tests the actual
 * crop/hash path, not a duplicated list of already computed hashes.
 */
async function frameHashes(page: Page, bytes: Buffer, track: ReturnType<typeof mp4Track>) {
  return page.evaluate(async ({ base64, track, crop }) => {
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 222;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const hashes: number[] = [], repeated: number[] = [], repeatedFull: number[] = [];
    let previous: ImageData | undefined, failure = '';
    const hash = (data: Uint8ClampedArray) => {
      let value = 0x811c9dc5;
      for (let i = 0; i < data.length; i++) value = Math.imul(value ^ data[i], 0x01000193);
      return value >>> 0;
    };
    const pitchPixels = () => context.getImageData(crop.x, crop.y, crop.width, crop.height);
    const decoder = new VideoDecoder({
      output: frame => {
        context.drawImage(frame, 0, 0, canvas.width, canvas.height); frame.close();
        hashes.push(hash(pitchPixels().data));
        if (hashes.length % 2 === 1) previous = context.getImageData(0, 0, canvas.width, canvas.height);
        else {
          // Freeze the scene but keep this frame's HUD. At 480 × 222,
          // layoutHud's pill fits inside 168 × 45 at top-left, and the
          // progress stripe inside the last 8 rows, well outside the crop.
          const pill = context.getImageData(0, 0, 168, 45);
          const progress = context.getImageData(0, canvas.height - 8, canvas.width, 8);
          context.putImageData(previous!, 0, 0);
          context.putImageData(pill, 0, 0);
          context.putImageData(progress, 0, canvas.height - 8);
        }
        repeated.push(hash(pitchPixels().data));
        repeatedFull.push(hash(context.getImageData(0, 0, canvas.width, canvas.height).data));
      },
      error: error => { failure = error.message; },
    });
    decoder.configure({ codec: track.codec, description: new Uint8Array(track.description) });
    let position = track.offset;
    track.sizes.forEach((size, i) => {
      decoder.decode(new EncodedVideoChunk({ type: track.keys.includes(i) ? 'key' : 'delta', timestamp: Math.round(i * 1e6 / 30), data: bytes.subarray(position, position + size) }));
      position += size;
    });
    await decoder.flush(); decoder.close();
    if (failure) throw new Error(failure);
    return { hashes, repeated, repeatedFull };
  }, { base64: bytes.toString('base64'), track, crop: sceneCrop(480, 222) });
}

test('3D fullscreen: 30 fps and unique frames while the board moves, also when drawing is slow', async ({ page }, info) => {
  test.setTimeout(300_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: false });
    // An artificially slow graphics card: every WebGL clear waits while the flag is set.
    const slow = window as Window & { slowWebGLMs?: number };
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype] as { clear(mask: number): void }[]) {
      const clear = prototype.clear;
      prototype.clear = function (this: unknown, mask: number) {
        const until = performance.now() + (slow.slowWebGLMs ?? 0);
        while (performance.now() < until) { /* busy, like a slow PC */ }
        clear.call(this, mask);
      };
    }
  });
  await openTacticWithPhases(page);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Eksporter 3D-video', exact: true })).toBeEnabled({ timeout: 45_000 });
  await page.getByRole('button', { name: 'Fullskjerm for 3D', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '3D-bane i fullskjerm' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox', { name: 'Kameravinkel', exact: true }).selectOption('ball');
  const before = await saved(page);
  // Each drawn picture now takes 2–3 clears × 30 ms: the live view manages about 10–15 per second.
  await page.evaluate(() => { (window as Window & { slowWebGLMs?: number }).slowWebGLMs = 30; });
  const download = page.waitForEvent('download', { timeout: 240_000 });
  await dialog.getByRole('button', { name: 'Ta opp', exact: true }).click();
  await expect(dialog.getByRole('status', { name: 'Opptak pågår' })).toBeVisible({ timeout: 60_000 });
  // Orbit the camera during the recording; the video follows the recorded path.
  await page.mouse.move(420, 150); await page.mouse.down(); await page.mouse.move(500, 165, { steps: 12 }); await page.mouse.up();
  await expect(dialog.getByRole('status', { name: 'Lager video' })).toContainText('%', { timeout: 60_000 });
  const file = await download;
  await page.evaluate(() => { (window as Window & { slowWebGLMs?: number }).slowWebGLMs = 0; });
  expect(file.suggestedFilename()).toMatch(/\.mp4$/);
  const bytes = await readFile((await file.path())!);
  await file.saveAs(info.outputPath('slow-3d.mp4'));
  const track = mp4Track(bytes);
  // 0.5 s opening hold + 3 × 1.2 s playback + 0.6 s closing hold, at exactly 30 fps.
  expect(track.fps).toBe(30);
  expect(track.frames).toBe(141); expect(track.sizes).toHaveLength(141);
  const { hashes, repeated, repeatedFull } = await frameHashes(page, bytes, track);
  expect(hashes).toHaveLength(141);
  // Only the pitch counts; the opening/closing holds are intentionally excluded.
  const moving = hashes.slice(15, hashes.length - 18);
  const unique = new Set(moving).size;
  info.annotations.push({ type: 'Unike bilder under bevegelse', description: `${unique} av ${moving.length}` });
  const assertUniqueScenes = (frames: number[]) => expect(new Set(frames).size / frames.length).toBeGreaterThanOrEqual(.95);
  assertUniqueScenes(moving);
  const repeatedMoving = repeated.slice(15, repeated.length - 18);
  const repeatedUnique = new Set(repeatedMoving).size;
  info.annotations.push({ type: 'Negativ kontroll: gjentatt scene', description: `${repeatedUnique} av ${repeatedMoving.length}` });
  console.info(`3D scene crop: ${unique}/${moving.length} unique; repeated scene: ${repeatedUnique}/${repeatedMoving.length}`);
  expect(repeatedUnique).toBeLessThanOrEqual(Math.ceil(repeatedMoving.length / 2) + 1);
  expect(() => assertUniqueScenes(repeatedMoving)).toThrow();
  // Demonstrates why hashing the whole image was insufficient.
  assertUniqueScenes(repeatedFull.slice(15, repeatedFull.length - 18));
  expect(await saved(page)).toEqual(before); expect(errors).toEqual([]);
});

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
    await openTacticWithPhases(page);
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
    // 3D first warms up models, drawings and the encoder («Gjør klar …»).
    await expect(dialog.getByRole('status', { name: 'Opptak pågår' })).toBeVisible({ timeout: 45_000 });
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
