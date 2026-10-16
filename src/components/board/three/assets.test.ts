import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const file = await readFile(`public${url}`);
    return new Response(file);
  }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('the supplied 3D assets', () => {
  it('loads the real GLB once and gives cloned players independent animated skeletons', async () => {
    const { loadPlayer, clonePlayer, kitMaterial } = await import('./assets');
    const pending = loadPlayer();
    expect(loadPlayer()).toBe(pending);
    const source = await pending;
    expect(source.animations.map(clip => clip.name).sort()).toEqual(['Idle_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop']);
    const kit = kitMaterial('#2563eb');
    const first = clonePlayer(source, kit), second = clonePlayer(source, kit);
    const meshA = first.getObjectByProperty('isSkinnedMesh', true) as THREE.SkinnedMesh;
    const meshB = second.getObjectByProperty('isSkinnedMesh', true) as THREE.SkinnedMesh;
    expect(meshA.geometry).toBe(meshB.geometry);
    expect(meshA.material).toBe(kit);
    expect(meshA.skeleton).not.toBe(meshB.skeleton);
    const before = second.getObjectByName('spine_03')!.quaternion.clone();
    const mixer = new THREE.AnimationMixer(first);
    mixer.clipAction(source.animations.find(clip => clip.name === 'Jog_Fwd_Loop')!).play();
    mixer.update(.3);
    expect(second.getObjectByName('spine_03')!.quaternion.equals(before)).toBe(true);
    expect(first.getObjectByName('spine_03')!.quaternion.equals(before)).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    mixer.stopAllAction(); mixer.uncacheRoot(first); kit.dispose();
  });

  it('decodes the real HDR with the same colour space and sampling as HDRLoader/RGBELoader', async () => {
    const { loadSky } = await import('./assets');
    const pending = loadSky(); expect(loadSky()).toBe(pending);
    const sky = await pending;
    expect(sky.image.width).toBeGreaterThan(0);
    expect(sky.image.height).toBeGreaterThan(0);
    expect(sky.colorSpace).toBe(THREE.LinearSRGBColorSpace);
    expect(sky.mapping).toBe(THREE.EquirectangularReflectionMapping);
    expect(sky.flipY).toBe(true); expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('allows a later view to recover after a missing file', async () => {
    const { loadPlayer } = await import('./assets');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 404 }));
    await expect(loadPlayer()).rejects.toThrow('Could not load');
    expect((await loadPlayer()).animations).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('aborts a stalled file instead of leaving loading and export disabled forever', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const { loadSky } = await import('./assets');
    const pending = expect(loadSky()).rejects.toThrow('Aborted');
    await vi.advanceTimersByTimeAsync(15_000); await pending;
  });
});
