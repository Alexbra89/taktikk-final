import { describe, expect, it, vi } from 'vitest';
import { isChunkLoadError, watchAppUpdate } from './appUpdate';

function setup(controlled = true, waiting = false) {
  const worker = Object.assign(new EventTarget(), { postMessage: vi.fn() });
  const reg = Object.assign(new EventTarget(), {
    waiting: waiting ? worker : null,
    installing: null as typeof worker | null,
    update: vi.fn().mockResolvedValue(undefined),
  });
  const sw = Object.assign(new EventTarget(), {
    controller: controlled ? worker : null,
    ready: Promise.resolve(reg),
  });
  const notify = vi.fn();
  const reload = vi.fn();
  const watcher = watchAppUpdate(sw as unknown as ServiceWorkerContainer, notify, reload);
  return { worker, reg, sw, notify, reload, watcher };
}

describe('trygg appoppdatering', () => {
  it('første installasjon viser ingen melding og laster aldri om', async () => {
    const { sw, worker, notify, reload, watcher } = setup(false);
    await sw.ready;
    sw.controller = worker;
    sw.dispatchEvent(new Event('controllerchange'));
    watcher.update();
    expect(notify).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    watcher.dispose();
  });

  it('oppdager en allerede ventende worker; knappen venter på overtakelse før reload', async () => {
    const { sw, worker, notify, reload, watcher } = setup(true, true);
    await sw.ready;
    expect(notify).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
    watcher.update();
    watcher.update();
    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'SKIP_WAITING' });
    expect(reload).not.toHaveBeenCalled();
    sw.dispatchEvent(new Event('controllerchange'));
    sw.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledOnce();
    watcher.dispose();
  });

  it('oppdager ny installasjon og tillater ny sjekk uten nett', async () => {
    const { sw, reg, worker, notify, reload, watcher } = setup();
    await sw.ready;
    reg.installing = worker;
    reg.dispatchEvent(new Event('updatefound'));
    expect(notify).not.toHaveBeenCalled();
    reg.waiting = worker;
    reg.installing = null;
    worker.dispatchEvent(new Event('statechange'));
    expect(notify).toHaveBeenCalledOnce();
    reg.update.mockRejectedValue(new TypeError('Failed to fetch'));
    watcher.check();
    await Promise.resolve();
    expect(reload).not.toHaveBeenCalled();
    watcher.dispose();
  });

  it('oppdatering fra annen fane gir bare melding; brukerens klikk laster om', async () => {
    const { sw, notify, reload, watcher } = setup();
    await sw.ready;
    sw.dispatchEvent(new Event('controllerchange'));
    expect(notify).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
    watcher.update();
    expect(reload).toHaveBeenCalledOnce();
    watcher.dispose();
  });

  it('rydder opp også hvis komponenten fjernes før registreringen er klar', async () => {
    const { sw, reg, notify, reload, watcher } = setup(true, true);
    watcher.dispose();
    await sw.ready;
    sw.dispatchEvent(new Event('controllerchange'));
    reg.dispatchEvent(new Event('updatefound'));
    expect(notify).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('gjenkjenning av dynamiske lastefeil', () => {
  // Fanget i Edge med Next 16 / Turbopack når Rapporter-filen blokkeres.
  const turbopackMessage = 'Failed to load chunk /_next/static/chunks/src_0oe3tmgm6glc6._.js from module [project]/src/components/reports/ReportsView.tsx [app-client] (ecmascript, next/dynamic entry, async loader)';
  it.each([
    Object.assign(new Error(turbopackMessage), { name: 'ChunkLoadError' }),
    new Error(turbopackMessage),
    turbopackMessage,
  ])('gjenkjenner Next 16-feilen også uten feiltypen: %s', error => {
    expect(isChunkLoadError(error)).toBe(true);
  });

  it.each([
    Object.assign(new Error('ukjent chunk'), { name: 'ChunkLoadError' }),
    new Error('Loading chunk 123 failed.\n(error: https://example.test/chunk.js)'),
    new Error('Loading CSS chunk 123 failed.'),
    new Error('Failed to load chunk /_next/static/chunks/reports.js from module ReportsView'),
    new TypeError('Failed to fetch dynamically imported module: https://example.test/file.js'),
    new TypeError('Importing a module script failed.'),
    'TypeError: error loading dynamically imported module: https://example.test/file.js',
  ])('gjenkjenner %s uten å laste om automatisk', error => {
    expect(isChunkLoadError(error)).toBe(true);
  });
  it.each([
    undefined, null, {},
    new Error('Failed to fetch'),
    new Error('Feil i tegningen'),
    new TypeError("Cannot read properties of undefined (reading 'ReportsView')"),
    new Error('Failed to load training data'),
    new Error('Module [project]/src/components/reports/ReportsView.tsx was instantiated, but the module factory is not available.'),
  ])('beholder vanlig feilskjerm for %s', error => {
    expect(isChunkLoadError(error)).toBe(false);
  });
});
