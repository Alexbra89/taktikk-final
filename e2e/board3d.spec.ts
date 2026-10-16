import { test, expect, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
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
  await expect(page.getByText('Laster spillermodell og himmel …', { exact: true })).toHaveCount(0, { timeout: 45_000 });
}
async function savedTactics(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('taktikkboard-storage')!).state.tactics);
}

/** Read our single-track MP4 so every encoded frame can be verified directly.
 * HTMLVideoElement-to-canvas readback can be black on headless Windows even
 * after presentation; VideoDecoder verifies the actual file's pixels instead. */
function mp4Frames(file: Buffer) {
  const avcc = file.indexOf('avcC'), sizes = file.indexOf('stsz'), sync = file.indexOf('stss');
  const description = file.subarray(avcc + 4, avcc - 4 + file.readUInt32BE(avcc - 4));
  const keys = new Set(Array.from({ length: file.readUInt32BE(sync + 8) }, (_, i) => file.readUInt32BE(sync + 12 + i * 4) - 1));
  let offset = file.indexOf('mdat') + 4;
  const samples = Array.from({ length: file.readUInt32BE(sizes + 12) }, (_, i) => {
    const length = file.readUInt32BE(sizes + 16 + i * 4);
    const data = file.subarray(offset, offset + length).toString('base64'); offset += length;
    return { data, key: keys.has(i), timestamp: Math.round(i * 1e6 / 30) };
  });
  return { description: description.toString('base64'), samples };
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
  for (const viewport of [{ width: 390, height: 560 }, { width: 320, height: 480 }, { width: 812, height: 280 }, { width: 844, height: 390 }, { width: 1024, height: 600 }]) {
    await page.setViewportSize(viewport);
    const play = page.getByRole('button', { name: 'Spill av fasene', exact: true });
    await expect(play).toBeInViewport();
    const position = await play.boundingBox();
    expect(position!.y + position!.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('all equipment and drawing types render in 3D without altering the tactic', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text()); });
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
    for (const [index, phase] of tactic.phases.entries()) {
      phase.name = index === 0 ? 'Bygg opp' : 'Vinn ballen';
      phase.stickyNote = index === 0 ? 'Hold bredden og spill fremover.' : 'Press sammen når ballen går ut på kanten.';
      phase.drawings = drawings;
      phase.items = types.map((type, i) => ({ id: `item-${i}`, type, position: { x: 160 + i * 85, y: 100 }, rotation: i * 30 }));
      phase.players[0].name = 'Ola'; phase.players[1].name = 'Nora';
    }
    tactic.phases.forEach(phase => { phase.ball = { ...phase.players[0].position }; });
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
  await expect(page.getByText('Vinn ballen. Press sammen når ballen går ut på kanten.', { exact: true })).toHaveCount(1);
  await page.getByRole('tab', { name: 'Bygg opp', exact: false }).click();
  await expect(page.getByText('Bygg opp. Hold bredden og spill fremover.', { exact: true })).toHaveCount(1);
  await page.getByRole('tab', { name: 'Vinn ballen', exact: false }).click();
  await page.getByRole('button', { name: 'Følg ballen', exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Zoom inn i 3D', exact: true }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: info.outputPath('player-kit-closeup.png') });
  expect(await savedTactics(page)).toEqual(before); expect(errors).toEqual([]);
});

test('missing model files keep 3D and playback usable with a small notice', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/models/*', route => route.abort());
  await openBoard(page);
  await page.getByRole('button', { name: 'Legg til fase', exact: true }).click();
  await open3D(page);
  await expect(page.getByText(/Spillermodellen kunne ikke lastes/)).toBeVisible();
  await expect(page.getByText(/Himmelen kunne ikke lastes/)).toBeVisible();
  await page.getByRole('button', { name: 'Spill av fasene', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stopp avspilling', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Eksporter 3D-video', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('22 animated players reuse one model load across view switches', async ({ page }, info) => {
  let models = 0, skies = 0;
  page.on('request', request => {
    if (request.url().endsWith('/models/spiller-v2.glb')) models++;
    if (request.url().endsWith('/models/himmel.hdr')) skies++;
  });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openBoard(page);
  await page.getByRole('button', { name: 'Legg til fase', exact: true }).click();
  await page.evaluate(() => {
    const storage = JSON.parse(localStorage.getItem('taktikkboard-storage')!);
    const tactic: Tactic = storage.state.tactics.find((t: Tactic) => t.id === storage.state.activeTacticId);
    tactic.phases.forEach((phase, index) => {
      phase.players = [...phase.players, ...phase.players.map(p => ({ ...p, id: `extra-${p.id}`, num: p.num + 11, position: { x: p.position.x, y: 560 - p.position.y } }))];
      if (index) phase.players.forEach(p => { p.position.x += 65; });
    });
    localStorage.setItem('taktikkboard-storage', JSON.stringify(storage));
  });
  await page.reload();
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk', exact: true }).click();
  await open3D(page);
  await page.getByRole('button', { name: '2D', exact: true }).click(); await open3D(page);
  await page.getByRole('button', { name: 'Spill av fasene', exact: true }).click();
  await page.screenshot({ path: info.outputPath('22-players-playing.png') });
  expect(models).toBe(1); expect(skies).toBe(1); expect(errors).toEqual([]);
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
    await page.evaluate(() => {
      const storage = JSON.parse(localStorage.getItem('taktikkboard-storage')!);
      const tactic: Tactic = storage.state.tactics.find((t: Tactic) => t.id === storage.state.activeTacticId);
      tactic.phases.forEach((phase, index) => {
        phase.name = index ? 'Press fremover' : 'Bygg opp';
        phase.stickyNote = index ? 'Vinn ballen sammen.' : 'Hold bredden.';
        phase.drawings = [
          { id: 'video-arrow', type: 'arrow', color: '#F97316', colorKey: 'orange', pts: [{ x: 400, y: 300 }, { x: 650, y: 300 }] },
          { id: 'video-label', type: 'label', color: '#fff', colorKey: 'white', at: { x: 440, y: 440 }, text: index ? 'Press sammen' : 'Spill fremover' },
        ];
        phase.items = [{ id: 'video-cone', type: 'cone', position: { x: 400, y: 160 } }];
        if (index) phase.players.forEach(p => { p.position.x += 50; });
      });
      localStorage.setItem('taktikkboard-storage', JSON.stringify(storage));
    });
    await page.reload();
    await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk', exact: true }).click();
    const before = await savedTactics(page);
    await open3D(page);
    const button = page.getByRole('button', { name: 'Eksporter 3D-video', exact: true });
    await expect(button).toBeEnabled();
    await button.click();
    await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
    await expect(page.getByText('Videoeksporten ble avbrutt.', { exact: true })).toBeVisible();
    const downloadPromise = page.waitForEvent('download'); await button.click();
    // Resolve on either outcome so an encoder error is reported immediately.
    await page.waitForFunction(() => {
      const region = document.querySelector('section[aria-label="3D-visning"]');
      return region?.querySelector('[role="alert"]') || Array.from(region?.querySelectorAll('[role="status"]') ?? [])
        .some(el => el.textContent?.includes('3D-videoen er lastet ned'));
    }, undefined, { timeout: 90_000 });
    await expect(page.getByRole('region', { name: '3D-visning' }).getByRole('alert')).toHaveCount(0);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(new RegExp(`-3d-.*\\.${format}$`));
    const file = await download.path(); const bytes = await readFile(file!);
    expect(bytes.length).toBeGreaterThan(20_000);
    await download.saveAs(info.outputPath(`3d-test.${format}`));
    const metadata = await page.evaluate(async ({ base64, format, mp4 }) => {
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: `video/${format}` }));
      const video = document.createElement('video'); video.muted = true; video.playsInline = true;
      video.style.cssText = 'position:fixed;bottom:0;left:0;width:192px;height:108px;z-index:9999';
      document.body.appendChild(video); video.src = url;
      const seekPresented = (time: number) => new Promise<void>((resolve, reject) => {
        video.onerror = () => reject(new Error(video.error?.message));
        video.onseeked = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        video.currentTime = time;
      });
      try {
        await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error(video.error?.message)); });
        if (mp4) {
          const unpack = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
          const thumbnail = document.createElement('canvas'); thumbnail.width = 192; thumbnail.height = 108;
          const ctx = thumbnail.getContext('2d', { willReadFrequently: true })!;
          let decoded = 0, grassPixels = Infinity, endGrassPixels = 0, image = '', failure = '';
          const decoder = new VideoDecoder({
            output(frame) {
              ctx.drawImage(frame, 0, 0, 192, 108);
              const rgba = ctx.getImageData(0, 0, 192, 108).data;
              let green = 0;
              for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 1] > rgba[i] * 1.25 && rgba[i + 1] > rgba[i + 2] * 1.1) green++;
              grassPixels = Math.min(grassPixels, green); endGrassPixels = green; decoded++;
              if (!image && frame.timestamp >= 1_800_000) {
                const canvas = document.createElement('canvas'); canvas.width = frame.displayWidth; canvas.height = frame.displayHeight;
                canvas.getContext('2d')!.drawImage(frame, 0, 0); image = canvas.toDataURL('image/png').split(',')[1];
              }
              frame.close();
            }, error(error) { failure = error.message; },
          });
          try {
            const description = unpack(mp4.description);
            const codec = `avc1.${Array.from(description.slice(1, 4), n => n.toString(16).padStart(2, '0')).join('')}`;
            decoder.configure({ codec, description, hardwareAcceleration: 'prefer-software' });
            for (const sample of mp4.samples) decoder.decode(new EncodedVideoChunk({ type: sample.key ? 'key' : 'delta', timestamp: sample.timestamp, data: unpack(sample.data) }));
            await decoder.flush();
            if (failure || decoded !== mp4.samples.length) throw new Error(failure || 'Missing decoded MP4 frames');
          } finally { if (decoder.state !== 'closed') decoder.close(); }
          return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, ready: video.readyState, grassPixels, endGrassPixels, image };
        }
        await seekPresented(1.8);
        const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 108;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(video, 0, 0, 192, 108);
        const pixels = ctx.getImageData(0, 0, 192, 108).data;
        let grassPixels = 0;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 1] > pixels[i] * 1.25 && pixels[i + 1] > pixels[i + 2] * 1.1) grassPixels++;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const image = canvas.toDataURL('image/png').split(',')[1];
        await seekPresented(video.duration - .01);
        canvas.width = 192; canvas.height = 108; ctx.drawImage(video, 0, 0, 192, 108);
        const end = ctx.getImageData(0, 0, 192, 108).data;
        let endGrassPixels = 0;
        for (let i = 0; i < end.length; i += 4) if (end[i + 1] > end[i] * 1.25 && end[i + 1] > end[i + 2] * 1.1) endGrassPixels++;
        return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, ready: video.readyState, grassPixels, endGrassPixels, image };
      } finally { video.removeAttribute('src'); video.load(); video.remove(); URL.revokeObjectURL(url); }
    }, { base64: bytes.toString('base64'), format, mp4: format === 'mp4' ? mp4Frames(bytes) : null });
    expect(metadata.width).toBe(1920); expect(metadata.height).toBe(1080);
    await writeFile(info.outputPath('decoded-video-frame.png'), Buffer.from(metadata.image, 'base64'));
    expect(metadata.duration).toBeCloseTo(2.3, 1); expect(metadata.ready).toBeGreaterThanOrEqual(2);
    expect(metadata.grassPixels).toBeGreaterThan(1500);
    expect(metadata.endGrassPixels).toBeGreaterThan(1500);
    expect(await savedTactics(page)).toEqual(before);
  });
}
