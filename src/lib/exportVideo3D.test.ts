import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseEncoder, exportVideo3D } from './exportVideo3D';
import { downloadBlob } from './download';
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
    const timestamps: number[] = [];
    let closed = false;
    vi.stubGlobal('VideoFrame', class {
      timestamp: number;
      constructor(_: unknown, options: VideoFrameInit) { this.timestamp = options.timestamp!; }
      close() {}
    });
    vi.stubGlobal('VideoEncoder', class {
      state = 'configured'; encodeQueueSize = 0;
      constructor(private callbacks: VideoEncoderInit) {}
      configure() {}
      encode(frame: VideoFrame) {
        timestamps.push(frame.timestamp);
        this.callbacks.output({ timestamp: frame.timestamp, byteLength: 4, type: 'key', copyTo: (d: Uint8Array) => d.set([0, 0, 0, 0]) } as unknown as EncodedVideoChunk, {});
      }
      async flush() {}
      close() { this.state = 'closed'; closed = true; }
    });
    return { timestamps, closed: () => closed };
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
    const encoder = fakeEncoder(); let stop = false;
    await exportVideo3D({ choice, phaseCount: 3, speed: 1, team: '', tactic: '', signal: new AbortController().signal,
      onProgress: vi.fn(), shouldStop: () => stop,
      draw: async (_, i) => { if (i === 4) stop = true; return pixels; },
    });
    expect(encoder.timestamps).toHaveLength(5); expect(downloadBlob).toHaveBeenCalledOnce(); expect(encoder.closed()).toBe(true);
  });
  it('holds slow live frames without speeding up playback or camera gestures in the file', async () => {
    const encoder = fakeEncoder(); let now = 0, draws = 0;
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
    try {
      await exportVideo3D({ choice, phaseCount: 2, speed: 3, team: '', tactic: '', signal: new AbortController().signal,
        realtime: true, onProgress: vi.fn(), draw: async () => { draws++; now += 250; return pixels; },
      });
      expect(draws).toBeLessThan(10); expect(encoder.timestamps).toHaveLength(45);
      encoder.timestamps.forEach((timestamp, i) => expect(timestamp).toBe(Math.round(i * 1e6 / 30)));
    } finally { clock.mockRestore(); }
  });
});
