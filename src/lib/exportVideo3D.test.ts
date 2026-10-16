import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseEncoder, exportVideo3D } from './exportVideo3D';
import { downloadBlob } from './download';
vi.mock('./download', () => ({ downloadBlob: vi.fn(), slugify: (s: string) => s }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('3D encoding capability fallback', () => {
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
        return {} as HTMLCanvasElement;
      } });
    expect(encoder.timestamps).toHaveLength(45); // (0.5 + 1.2/3 + 0.6) seconds at 30 fps
    encoder.timestamps.forEach((timestamp, i) => expect(timestamp).toBe(Math.round(i * 1e6 / 30)));
    expect(drawn[18]).toBe(100);
    expect(downloadBlob).toHaveBeenCalledOnce(); expect(encoder.closed()).toBe(true);
  });
  it('cancels without downloading and releases the encoder', async () => {
    const encoder = fakeEncoder(); const abort = new AbortController();
    await expect(exportVideo3D({ choice, phaseCount: 3, speed: 1, team: '', tactic: '', signal: abort.signal, onProgress: vi.fn(),
      draw: async (_, i) => { if (i === 2) abort.abort(); return {} as HTMLCanvasElement; },
    })).rejects.toThrow();
    expect(encoder.timestamps).toHaveLength(2); expect(downloadBlob).not.toHaveBeenCalled(); expect(encoder.closed()).toBe(true);
  });
});
