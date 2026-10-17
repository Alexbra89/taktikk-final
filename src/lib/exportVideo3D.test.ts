import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseEncoder, exportVideo3D } from './exportVideo3D';
import { downloadBlob } from './download';
import { cameraAt, recordCameraTrack } from '@/components/board/three/cameraTrack';
import { exportDuration } from '@/components/board/three/coordinates';
import { sceneCrop } from '../../test-support/sceneCrop';
vi.mock('./download', () => ({ downloadBlob: vi.fn(), slugify: (s: string) => s }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('3D encoding capability fallback', () => {
  it('checks the actual fullscreen dimensions, also on low-power devices', async () => {
    vi.stubGlobal('VideoFrame', class {});
    const supported = vi.fn(async (config: VideoEncoderConfig) => ({ supported: true, config }));
    vi.stubGlobal('VideoEncoder', { isConfigSupported: supported });
    const choice = await chooseEncoder(true, { width: 1920, height: 888 });
    expect(choice?.config.width).toBe(1920); expect(choice?.config.height).toBe(888);
  });
  it.each([
    { width: 1920, height: 1200 },
    { width: 1920, height: 1440 },
    { width: 1440, height: 1920 },
  ])('prefers level 5.1 H.264 over WebM for fullscreen $width × $height', async (size) => {
    vi.stubGlobal('VideoFrame', class {});
    for (const codec of ['avc1.420033', 'avc1.4d0033']) {
      const supported = vi.fn(async (config: VideoEncoderConfig) => ({
        supported: config.codec === codec || config.codec.startsWith('vp'),
      }));
      vi.stubGlobal('VideoEncoder', { isConfigSupported: supported });
      const choice = await chooseEncoder(false, size);
      expect(choice?.ext).toBe('mp4');
      expect(choice?.config).toMatchObject({ ...size, codec, latencyMode: 'realtime', avc: { format: 'avc' } });
      expect(supported.mock.calls.some(([config]) => config.codec.startsWith('vp'))).toBe(false);
    }
  });
  it('keeps the fullscreen dimensions when only WebM is supported', async () => {
    vi.stubGlobal('VideoFrame', class {});
    vi.stubGlobal('VideoEncoder', {
      isConfigSupported: async (config: VideoEncoderConfig) => ({ supported: config.codec === 'vp09.00.10.08' }),
    });
    const size = { width: 1920, height: 1200 };
    const choice = await chooseEncoder(false, size);
    expect(choice?.ext).toBe('webm');
    expect(choice?.config).toMatchObject(size);
  });
  it('limits mobile export to 720p even when full HD is supported', async () => {
    vi.stubGlobal('VideoFrame', class {});
    vi.stubGlobal('VideoEncoder', { isConfigSupported: async (config: VideoEncoderConfig) => ({ supported: true, config }) });
    const choice = await chooseEncoder(true);
    expect(choice?.config.width).toBe(1280); expect(choice?.config.height).toBe(720);
    expect(choice?.ext).toBe('mp4');
  });
  it('prefers 720p H.264 over WebM when full HD H.264 is unavailable', async () => {
    vi.stubGlobal('VideoFrame', class {});
    vi.stubGlobal('VideoEncoder', { isConfigSupported: async (config: VideoEncoderConfig) => ({ supported: config.codec.startsWith('avc') ? config.height === 720 : true }) });
    const choice = await chooseEncoder();
    expect(choice?.ext).toBe('mp4'); expect(choice?.config.height).toBe(720);
  });
  it('falls back to full HD WebM and reports missing WebCodecs honestly', async () => {
    vi.stubGlobal('VideoFrame', class {});
    vi.stubGlobal('VideoEncoder', { isConfigSupported: async (c: VideoEncoderConfig) => ({ supported: c.codec === 'vp8' }) });
    expect((await chooseEncoder())?.ext).toBe('webm');
    expect((await chooseEncoder())?.config.height).toBe(1080);
    vi.stubGlobal('VideoEncoder', undefined);
    expect(await chooseEncoder()).toBeNull();
  });
});

describe('offline frame scheduling', () => {
  const pixels = { width: 1280, height: 720, data: new Uint8ClampedArray(1280 * 720 * 4) } as ImageData;
  function fakeEncoder() {
    const timestamps: number[] = [], hashes: number[] = [], fullHashes: number[] = [];
    let closed = false;
    vi.stubGlobal('VideoFrame', class {
      timestamp: number; hash: number;
      constructor(data: Uint8ClampedArray, options: VideoFrameBufferInit) {
        this.timestamp = options.timestamp!;
        // Only pitch pixels count. HUD/progress changes must not mask repeats.
        const crop = sceneCrop(options.codedWidth, options.codedHeight);
        let hash = 0x811c9dc5;
        for (let y = crop.y; y < crop.y + crop.height; y++) {
          const start = (y * options.codedWidth + crop.x) * 4;
          for (let i = start; i < start + crop.width * 4; i++) hash = Math.imul(hash ^ data[i], 0x01000193);
        }
        this.hash = hash >>> 0;
        let full = 0x811c9dc5;
        for (const value of data) full = Math.imul(full ^ value, 0x01000193);
        fullHashes.push(full >>> 0);
      }
      close() {}
    });
    vi.stubGlobal('VideoEncoder', class {
      state = 'configured'; encodeQueueSize = 0;
      constructor(private callbacks: VideoEncoderInit) {}
      configure() {}
      encode(frame: VideoFrame & { hash: number }) {
        timestamps.push(frame.timestamp); hashes.push(frame.hash);
        this.callbacks.output({ timestamp: frame.timestamp, byteLength: 4, type: 'key', copyTo: (d: Uint8Array) => d.set([0, 0, 0, 0]) } as unknown as EncodedVideoChunk, {});
      }
      async flush() {}
      close() { this.state = 'closed'; closed = true; }
    });
    return { timestamps, hashes, fullHashes, closed: () => closed };
  }
  const choice = { config: { codec: 'vp8', width: 1280, height: 720 }, ext: 'webm' as const, label: 'WebM' };
  it('assigns exact frame timestamps even when rendering takes variable time', async () => {
    const encoder = fakeEncoder(); const drawn: number[] = [];
    await exportVideo3D({ choice, phaseCount: 2, speed: 3, team: 'lag', tactic: 'test', signal: new AbortController().signal,
      onProgress: vi.fn(), draw: async (time, i) => {
        drawn.push(time);
        if (i % 7 === 0) await new Promise(r => setTimeout(r, 3));
        return pixels;
      } });
    expect(encoder.timestamps).toHaveLength(45); // (0.5 + 1.2/3 + 0.6) seconds at 30 fps
    encoder.timestamps.forEach((timestamp, i) => expect(timestamp).toBe(Math.round(i * 1e6 / 30)));
    expect(drawn[18]).toBe(100);
    expect(downloadBlob).toHaveBeenCalledOnce(); expect(encoder.closed()).toBe(true);
  });
  it('cancels without downloading and releases the encoder', async () => {
    const encoder = fakeEncoder(); const abort = new AbortController();
    await expect(exportVideo3D({ choice, phaseCount: 3, speed: 1, team: '', tactic: '', signal: abort.signal, onProgress: vi.fn(),
      draw: async (_, i) => { if (i === 2) abort.abort(); return pixels; },
    })).rejects.toThrow();
    expect(encoder.timestamps).toHaveLength(2); expect(downloadBlob).not.toHaveBeenCalled(); expect(encoder.closed()).toBe(true);
  });
  it('finishes a stopped recording with only the recorded frames', async () => {
    const encoder = fakeEncoder(); const drawn: number[] = [];
    await exportVideo3D({ choice, phaseCount: 3, speed: 1, team: '', tactic: '', signal: new AbortController().signal,
      onProgress: vi.fn(), frameCount: 5, draw: async (_, i) => { drawn.push(i); return pixels; },
    });
    expect(encoder.timestamps).toHaveLength(5); expect(drawn).toEqual([0, 1, 2, 3, 4]);
    expect(downloadBlob).toHaveBeenCalledOnce(); expect(encoder.closed()).toBe(true);
  });

  it.each([false, true])('fullscreen 3D: at least 95 percent unique scene frames with slow drawing (repeat every other scene: %s)', async (repeatScene) => {
    const encoder = fakeEncoder(); let now = 0;
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
    const small = { width: 64, height: 36, data: new Uint8ClampedArray(64 * 36 * 4) } as ImageData;
    // The user orbits the camera through the whole recording.
    const orbit = (time: number) => {
      const angle = time / 1000;
      return {
        state: { view: 'overview' as const, playerId: '', position: [Math.sin(angle) * 60, 40, Math.cos(angle) * 60], target: [0, 0, 0], manual: true, zoom: 1, anchor: null },
        pose: { position: [Math.sin(angle) * 60, 40, Math.cos(angle) * 60], quaternion: [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)], projection: Array.from({ length: 16 }, (_, i) => i % 5 ? 0 : 1) },
      };
    };
    try {
      // Live: a slow PC draws only about 14 frames per second (70 ms each).
      const { track, durationMs } = await recordCameraTrack({
        durationMs: exportDuration(4, 1), signal: new AbortController().signal, shouldStop: () => false,
        show: time => { now += 70; return orbit(time); },
      });
      expect(track.length).toBeLessThan(75);
      // Afterwards: each video frame takes 250 ms to draw, and the result is still exact.
      await exportVideo3D({ choice, phaseCount: 4, speed: 1, team: '', tactic: '', signal: new AbortController().signal,
        onProgress: vi.fn(), frameCount: Math.ceil(durationMs * 30 / 1000 - 1e-6),
        draw: async (_, index) => {
          now += 250;
          // A frame's pixels are a function of the camera it is drawn with.
          const sceneIndex = repeatScene ? index - index % 2 : index;
          const pose = cameraAt(track, sceneIndex * 1000 / 30).pose;
          const crop = sceneCrop(small.width, small.height);
          new Float32Array(small.data.buffer, (crop.y * small.width + crop.x) * 4)
            .set([...pose.position, ...pose.quaternion]);
          // Artificial HUD changes on EVERY frame, including repeated scenes.
          new Uint32Array(small.data.buffer)[0] = index;
          new Uint32Array(small.data.buffer)[small.width * small.height - 1] = index;
          return small;
        },
      });
    } finally { clock.mockRestore(); }
    // 0.5 + 3 × 1.2 + 0.6 seconds at exactly 30 frames per second.
    expect(encoder.timestamps).toHaveLength(141);
    encoder.timestamps.forEach((timestamp, i) => expect(timestamp).toBe(Math.round(i * 1e6 / 30)));
    const assertUniqueScenes = () => expect(new Set(encoder.hashes).size / encoder.hashes.length).toBeGreaterThanOrEqual(.95);
    if (repeatScene) {
      // The old full-image check would pass; the real 95 % assertion must fail.
      expect(new Set(encoder.fullHashes).size).toBe(141);
      expect(new Set(encoder.hashes).size).toBe(71);
      expect(assertUniqueScenes).toThrow();
    } else assertUniqueScenes();
    expect(downloadBlob).toHaveBeenCalledOnce(); expect(encoder.closed()).toBe(true);
  });
});

describe('fullscreen camera path', () => {
  const sample = (time: number, x: number, turn: number, view: 'overview' | 'top' = 'overview') => ({
    time,
    state: { view, playerId: 'p1', position: [x, 10, 0], target: [x, 0, 0], manual: false, zoom: 1, anchor: null },
    pose: { position: [x, 10, 0], quaternion: [0, Math.sin(turn / 2), 0, Math.cos(turn / 2)], projection: new Array(16).fill(1) },
  });
  it('glides between slow live readings and holds the ends', () => {
    const track = [sample(0, 0, 0), sample(100, 10, Math.PI / 2, 'top'), sample(200, 10, Math.PI / 2, 'top')];
    const middle = cameraAt(track, 50);
    expect(middle.pose.position[0]).toBeCloseTo(5); expect(middle.state.target[0]).toBeCloseTo(5);
    // Halfway through a quarter turn is an eighth turn, still a unit quaternion.
    expect(middle.pose.quaternion[1]).toBeCloseTo(Math.sin(Math.PI / 8));
    expect(Math.hypot(...middle.pose.quaternion)).toBeCloseTo(1);
    // Camera choice switches at the reading where it changed.
    expect(middle.state.view).toBe('overview'); expect(cameraAt(track, 150).state.view).toBe('top');
    expect(cameraAt(track, -5).pose.position[0]).toBe(0); expect(cameraAt(track, 900).pose.position[0]).toBe(10);
  });
  it('stops early with what was shown, and cancels without a path', async () => {
    let now = 0, shown = 0;
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
    try {
      const stopped = await recordCameraTrack({ durationMs: 4700, signal: new AbortController().signal,
        shouldStop: () => shown === 20, show: time => { shown++; now += 50; return sample(time, 0, 0); } });
      expect(stopped.track).toHaveLength(20); expect(stopped.durationMs).toBe(950);
      const abort = new AbortController();
      await expect(recordCameraTrack({ durationMs: 4700, signal: abort.signal, shouldStop: () => false,
        show: time => { now += 50; if (time > 300) abort.abort(); return sample(time, 0, 0); } })).rejects.toThrow();
    } finally { clock.mockRestore(); }
  });
});
