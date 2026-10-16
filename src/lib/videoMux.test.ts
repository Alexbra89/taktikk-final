import { describe, expect, it } from 'vitest';
import { muxMp4, muxWebm, type VideoSample } from './videoMux';

const samples: VideoSample[] = Array.from({ length: 90 }, (_, i) => ({ data: new Uint8Array([0, 0, 0, 1, 0x65, i]), timestamp: Math.round(i * 1e6 / 30), key: i % 60 === 0 }));
const ascii = (data: Uint8Array) => new TextDecoder('latin1').decode(data);
const numberAt = (data: Uint8Array, offset: number) => new DataView(data.buffer, data.byteOffset).getUint32(offset);

describe('silent 3D video containers', () => {
  it('writes all MP4 samples, fixed 30 fps timing, dimensions and valid media offsets', async () => {
    const data = new Uint8Array(await muxMp4(samples, new Uint8Array([1, 66, 0, 40, 255]), 1920, 1080, 30).arrayBuffer());
    const str = ascii(data);
    expect(str.slice(4, 8)).toBe('ftyp');
    expect(numberAt(data, str.indexOf('stsz') + 12)).toBe(90);
    const stts = str.indexOf('stts');
    expect(numberAt(data, stts + 12)).toBe(90); expect(numberAt(data, stts + 16)).toBe(1);
    const mdhd = str.indexOf('mdhd');
    expect(numberAt(data, mdhd + 16)).toBe(30); expect(numberAt(data, mdhd + 20)).toBe(90);
    expect(numberAt(data, str.indexOf('stco') + 12)).toBe(str.indexOf('mdat') + 4);
    const avc1 = str.indexOf('avc1', str.indexOf('stsd'));
    const view = new DataView(data.buffer);
    expect(view.getUint16(avc1 + 28)).toBe(1920); expect(view.getUint16(avc1 + 30)).toBe(1080);
    expect(numberAt(data, str.indexOf('stss') + 8)).toBe(2);
  });
  it('rejects reordered MP4 output instead of silently corrupting timestamps', () => {
    expect(() => muxMp4([samples[1], samples[0]], new Uint8Array([1]), 1280, 720, 30)).toThrow('rekkefølge');
  });
  it.each(['vp8', 'vp09.00.10.08'] as const)('writes a seekable WebM container for %s', async codec => {
    const blob = muxWebm(samples, 1280, 720, 30, codec);
    const data = new Uint8Array(await blob.arrayBuffer());
    expect([...data.slice(0, 4)]).toEqual([0x1a, 0x45, 0xdf, 0xa3]);
    expect(ascii(data)).toContain(codec === 'vp8' ? 'V_VP8' : 'V_VP9');
    expect(data.length).toBeGreaterThan(samples.length * 6);
    expect(blob.type).toBe('video/webm');
  });
});
