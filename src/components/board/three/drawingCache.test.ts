import { describe, expect, it } from 'vitest';
import { DrawingCache } from './drawingCache';

class FakeTexture { disposed = false; constructor(readonly key: string) {} dispose() { this.disposed = true; } }

/** Requests that finish only when the test says so, in any order. */
function deferredLoads() {
  const waiting = new Map<string, () => void>(), made: FakeTexture[] = [];
  const create = (key: string) => () => new Promise<FakeTexture>(resolve => {
    waiting.set(key, () => { const texture = new FakeTexture(key); made.push(texture); resolve(texture); });
  });
  const finish = async (key: string) => { waiting.get(key)!(); await Promise.resolve(); await Promise.resolve(); };
  return { create, finish, made };
}

describe('DrawingCache', () => {
  it('stays within the limit when stale requests finish out of order after fast phase changes', async () => {
    let current = '';
    const cache = new DrawingCache<FakeTexture>(3, () => current);
    const { create, finish, made } = deferredLoads();
    const keys = ['a', 'b', 'c', 'd', 'e', 'f'];
    const requests = keys.map(key => { current = key; return cache.get(key, create(key)); });
    // Finish in a scrambled order; only 'f' is still on screen.
    for (const key of ['c', 'f', 'a', 'e', 'b', 'd']) {
      await finish(key);
      expect(cache.size).toBeLessThanOrEqual(3);
    }
    const shown = await requests[5];
    expect(shown.disposed).toBe(false);
    expect(made.filter(t => !t.disposed)).toHaveLength(3);
    // The oldest finished layers go first: c, then a, then e ('f' is kept as the one on screen).
    expect(made.filter(t => t.disposed).map(t => t.key).sort()).toEqual(['a', 'c', 'e']);
  });

  it('never evicts the layer on screen, even when it finished first', async () => {
    const cache = new DrawingCache<FakeTexture>(2, () => 'a');
    const { create, finish } = deferredLoads();
    const shown = cache.get('a', create('a'));
    await finish('a');
    for (const key of ['b', 'c', 'd']) { const pending = cache.get(key, create(key)); await finish(key); await pending; }
    expect((await shown).disposed).toBe(false);
    expect(cache.size).toBe(2);
  });

  it('loads an evicted layer again instead of reusing a disposed texture', async () => {
    let current = 'b';
    const cache = new DrawingCache<FakeTexture>(1, () => current);
    const { create, finish } = deferredLoads();
    const first = cache.get('a', create('a')); await finish('a');
    const other = cache.get('b', create('b')); await finish('b'); await other;
    expect((await first).disposed).toBe(true);
    current = 'a';
    const again = cache.get('a', create('a')); await finish('a');
    expect(await again).not.toBe(await first);
    expect((await again).disposed).toBe(false);
  });

  it('disposes everything, also requests that finish after the scene is gone', async () => {
    const cache = new DrawingCache<FakeTexture>(3, () => 'b');
    const { create, finish } = deferredLoads();
    const a = cache.get('a', create('a')); await finish('a');
    const b = cache.get('b', create('b'));
    cache.dispose();
    await finish('b');
    expect((await a).disposed).toBe(true);
    expect((await b).disposed).toBe(true);
  });
});
