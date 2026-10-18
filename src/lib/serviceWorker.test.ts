import { createContext, runInContext } from 'node:vm';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateServiceWorker } from '../../scripts/generate-sw.mjs';

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

async function fixture() {
  await mkdir('test-results', { recursive: true });
  const root = await mkdtemp(resolve('test-results/sw-build-'));
  temporary.push(root);
  for (const dir of ['.next/static/chunks', '.next/static/media', 'public/models', 'public/noprecache']) {
    await mkdir(resolve(root, dir), { recursive: true });
  }
  for (const [name, data] of Object.entries({
    '.next/BUILD_ID': 'test-build',
    '.next/static/chunks/app.js': 'app',
    '.next/static/chunks/lazy.js': 'lazy',
    '.next/static/chunks/app.js.map': 'source map',
    '.next/static/media/font.woff2': 'font',
    '.next/app-build-manifest.json': '{}',
    'public/manifest.json': '{}',
    'public/icon.png': 'icon',
    'public/models/player.glb': 'model',
    'public/noprecache/private.txt': 'excluded',
    'public/workbox-old.js': 'old worker',
    'public/sw.js': 'old worker',
  })) await writeFile(resolve(root, name), data);
  return root;
}

type FetchEvent = {
  request: Request | { url: string; method: string; mode: string; headers: Headers };
  respondWith: ReturnType<typeof vi.fn>;
  waitUntil: ReturnType<typeof vi.fn>;
};

async function worker() {
  const root = await fixture();
  const { urls } = await generateServiceWorker(root);
  const script = await readFile(resolve(root, 'public/sw.js'), 'utf8');
  const handlers = new Map<string, (event: FetchEvent) => void>();
  const response = new Response('cached');
  const cache = {
    addAll: vi.fn().mockResolvedValue(undefined), match: vi.fn().mockResolvedValue(response),
    put: vi.fn().mockResolvedValue(undefined), delete: vi.fn().mockResolvedValue(true),
    keys: vi.fn().mockResolvedValue([]),
  };
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    match: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue(['unrelated', 'workbox-precache-v2-legacy', 'taktikk-precache-older', 'taktikk-precache-previous']),
    delete: vi.fn().mockResolvedValue(true),
  };
  const fetch = vi.fn().mockResolvedValue(new Response('network'));
  const self = {
    location: { origin: 'https://app.test' },
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    addEventListener: (name: string, callback: (event: FetchEvent) => void) => handlers.set(name, callback),
  };
  class LocalRequest extends Request {
    constructor(input: string | Request, init?: RequestInit) {
      super(typeof input === 'string' ? new URL(input, self.location.origin) : input, init);
    }
  }
  runInContext(script, createContext({ self, caches, fetch, Request: LocalRequest, Response, Headers, URL }));
  const dispatch = (name: string, path = '/', options: { method?: string; mode?: string; headers?: HeadersInit } = {}) => {
    const event = {
      request: {
        url: new URL(path, self.location.origin).href,
        method: options.method ?? 'GET', mode: options.mode ?? 'cors', headers: new Headers(options.headers),
      },
      respondWith: vi.fn(), waitUntil: vi.fn(),
    };
    handlers.get(name)!(event);
    return event;
  };
  return { root, urls, handlers, cache, caches, self, fetch, response, dispatch };
}

describe('service worker uten byggeverktøy-plugin', () => {
  it('inkluderer alle appmoduler og skrifter, men ikke modeller, kildekart eller interne manifester', async () => {
    const { urls, self, cache, dispatch } = await worker();
    expect(urls).toEqual(['/', '/favicon.ico', '/icon.png', '/manifest.json',
      '/_next/static/chunks/app.js', '/_next/static/chunks/lazy.js', '/_next/static/media/font.woff2']);
    const event = dispatch('install');
    await event.waitUntil.mock.calls[0][0];
    expect(cache.addAll.mock.calls[0][0].map((r: Request) => new URL(r.url).pathname)).toEqual(urls);
    expect(self.skipWaiting).not.toHaveBeenCalled();
  });

  it('gir ny cacheversjon ved endring av offentlige filer eller moduler', async () => {
    const root = await fixture();
    const first = await generateServiceWorker(root);
    expect((await generateServiceWorker(root)).version).toBe(first.version);
    await writeFile(resolve(root, 'public/icon.png'), 'new icon');
    const iconChange = await generateServiceWorker(root);
    expect(iconChange.version).not.toBe(first.version);
    await writeFile(resolve(root, '.next/static/chunks/lazy.js'), 'new lazy module');
    expect((await generateServiceWorker(root)).version).not.toBe(iconChange.version);
  });

  it('avbryter installasjon hvis en ressurs ikke kan lagres', async () => {
    const { cache, self, dispatch } = await worker();
    cache.addAll.mockRejectedValue(new Error('404'));
    await expect(dispatch('install').waitUntil.mock.calls[0][0]).rejects.toThrow('404');
    expect(self.skipWaiting).not.toHaveBeenCalled();
  });

  it('beholder forrige bygg og eksisterende Workbox-lagre for åpne faner', async () => {
    const { caches, self, dispatch } = await worker();
    await dispatch('activate').waitUntil.mock.calls[0][0];
    expect(caches.delete).toHaveBeenCalledExactlyOnceWith('taktikk-precache-older');
    expect(self.clients.claim).toHaveBeenCalledOnce();
  });

  it.each([
    ['/?kode=hemmelig', {}], ['/api/ai', {}], ['/manifest.json?kode=hemmelig', {}],
    ['https://other.test/file.js', {}], ['/api/ai', { method: 'POST' }],
    ['/models/player.glb', { headers: { range: 'bytes=0-10' } }],
  ])('lar %s gå direkte til nettverket uten å lagre svar', async (path, options) => {
    const { dispatch, caches } = await worker();
    expect(dispatch('fetch', path, options).respondWith).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
  });

  it('leverer HTML fra samme bygg, også offline, og matcher ikoner med versjon i URL', async () => {
    const { dispatch, cache, response, fetch } = await worker();
    expect(await dispatch('fetch', '/', { mode: 'navigate' }).respondWith.mock.calls[0][0]).toBe(response);
    expect(cache.match).toHaveBeenLastCalledWith('/');
    expect(await dispatch('fetch', '/icon.png?v=2').respondWith.mock.calls[0][0]).toBe(response);
    expect(cache.match).toHaveBeenLastCalledWith('/icon.png');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('gjenbruker tidligere lagrede 3D-modeller etter bytte fra next-pwa', async () => {
    const { dispatch, cache, caches, fetch } = await worker();
    cache.match.mockResolvedValue(undefined);
    const legacy = new Response('legacy model', { headers: { date: new Date().toUTCString() } });
    caches.match.mockResolvedValue(legacy);
    expect(await dispatch('fetch', '/models/player.glb').respondWith.mock.calls[0][0]).toBe(legacy);
    expect(caches.match.mock.calls[0][1]).toEqual({ cacheName: '3d-models' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('venter på eksplisitt melding før en ny worker tar over', async () => {
    const { handlers, self } = await worker();
    const waitUntil = vi.fn();
    const message = handlers.get('message')! as unknown as (event: { data: unknown; waitUntil: typeof waitUntil }) => void;
    message({ data: { type: 'OTHER' }, waitUntil });
    expect(self.skipWaiting).not.toHaveBeenCalled();
    message({ data: { type: 'SKIP_WAITING' }, waitUntil });
    await waitUntil.mock.calls[0][0];
    expect(self.skipWaiting).toHaveBeenCalledOnce();
  });

  it('lagrer modeller ved første bruk med utløpstid og maksimalt fire filer', async () => {
    const { dispatch, cache, fetch } = await worker();
    cache.match.mockResolvedValue(undefined);
    const files = Array.from({ length: 5 }, (_, i) => new Request(`https://app.test/models/player-${i}.glb`));
    cache.keys.mockResolvedValue(files);
    const event = dispatch('fetch', '/models/player.glb');
    const response = await event.respondWith.mock.calls[0][0];
    await event.waitUntil.mock.calls[0][0];
    expect(await response.text()).toBe('network');
    expect(fetch).toHaveBeenCalledOnce();
    const stored = cache.put.mock.calls[0][1] as Response;
    expect(await stored.text()).toBe('network');
    expect(Number(stored.headers.get('x-taktikk-cached-at'))).toBeGreaterThan(Date.now() - 5000);
    expect(cache.delete.mock.calls.map(([request]) => request.url))
      .toEqual(['https://app.test/models/player.glb', files[0].url]);
  });

  it('henter utløpte modeller på nytt, men gjenbruker ferske modeller uten nett', async () => {
    const { dispatch, cache, fetch } = await worker();
    cache.match.mockResolvedValue(new Response('fresh', { headers: { 'x-taktikk-cached-at': String(Date.now()) } }));
    expect(await (await dispatch('fetch', '/models/player.glb').respondWith.mock.calls[0][0]).text()).toBe('fresh');
    expect(fetch).not.toHaveBeenCalled();
    cache.match.mockResolvedValue(new Response('expired', {
      headers: { 'x-taktikk-cached-at': String(Date.now() - 31 * 24 * 60 * 60 * 1000) },
    }));
    const event = dispatch('fetch', '/models/player.glb');
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('network');
    await event.waitUntil.mock.calls[0][0];
  });
});
