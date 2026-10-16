/** Minimal single-track, silent-video containers for timestamped WebCodecs output.
 * No MediaRecorder/wall-clock capture: slow rendering cannot drop video frames.
 * AVC is encoded without B-frames (latencyMode: realtime); DTS equals PTS.
 */
export interface VideoSample { data: Uint8Array; timestamp: number; key: boolean }
const concat = (...parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0; for (const p of parts) { result.set(p, offset); offset += p.length; } return result;
};
const text = (s: string) => new TextEncoder().encode(s);
const u16 = (n: number) => new Uint8Array([(n >>> 8) & 255, n & 255]);
const u32 = (n: number) => new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const zeros = (n: number) => new Uint8Array(n);
const box = (name: string, ...data: Uint8Array[]) => { const body = concat(...data); return concat(u32(body.length + 8), text(name), body); };
const full = (name: string, flags: number, ...data: Uint8Array[]) => box(name, u32(flags), ...data);
const matrix = concat(u32(0x10000), u32(0), u32(0), u32(0), u32(0x10000), u32(0), u32(0), u32(0), u32(0x40000000));

export function muxMp4(samples: VideoSample[], avcC: Uint8Array, width: number, height: number, fps: number): Blob {
  if (!samples.length || !avcC.length) throw new Error('Videokoderen ga ingen bilder.');
  if (samples.some((s, i) => i > 0 && s.timestamp <= samples[i - 1].timestamp)) throw new Error('Videokoderen returnerte bildene i feil rekkefølge.');
  const n = samples.length, duration = Math.round(n * 1000 / fps);
  const ftyp = box('ftyp', text('isom'), u32(512), text('isomiso2avc1mp41'));
  const mvhd = full('mvhd', 0, zeros(8), u32(1000), u32(duration), u32(0x10000), u16(0x100), zeros(10), matrix, zeros(24), u32(2));
  const tkhd = full('tkhd', 7, zeros(8), u32(1), u32(0), u32(duration), zeros(8), zeros(8), matrix, u32(width * 65536), u32(height * 65536));
  const mdhd = full('mdhd', 0, zeros(8), u32(fps), u32(n), u16(0x55c4), u16(0));
  const hdlr = full('hdlr', 0, u32(0), text('vide'), zeros(12), text('Taktikktavle 3D\0'));
  const avc1 = box('avc1', zeros(6), u16(1), zeros(16), u16(width), u16(height), u32(0x480000), u32(0x480000), u32(0), u16(1), zeros(32), u16(24), u16(0xffff), box('avcC', avcC));
  const keys = samples.flatMap((s, i) => s.key ? [u32(i + 1)] : []);
  const stbl = box('stbl',
    full('stsd', 0, u32(1), avc1),
    full('stts', 0, u32(1), u32(n), u32(1)),
    full('stsc', 0, u32(1), u32(1), u32(n), u32(1)),
    full('stsz', 0, u32(0), u32(n), ...samples.map(s => u32(s.data.length))),
    full('stco', 0, u32(1), u32(ftyp.length + 8)),
    full('stss', 0, u32(keys.length), ...keys));
  const dinf = box('dinf', full('dref', 0, u32(1), full('url ', 1)));
  const minf = box('minf', full('vmhd', 1, zeros(8)), dinf, stbl);
  const moov = box('moov', mvhd, box('trak', tkhd, box('mdia', mdhd, hdlr, minf)));
  const size = samples.reduce((sum, s) => sum + s.data.length, 8);
  if (size >= 0xffffffff) throw new Error('Videoen er for stor. Del taktikken i kortere sekvenser.');
  return new Blob([ftyp, u32(size), text('mdat'), ...samples.map(s => s.data), moov] as BlobPart[], { type: 'video/mp4' });
}

function uint(n: number) {
  const bytes: number[] = []; do { bytes.unshift(n % 256); n = Math.floor(n / 256); } while (n > 0); return new Uint8Array(bytes);
}
function vint(n: number) {
  let size = 1; while (n >= 2 ** (7 * size) - 1) size++;
  const bytes = new Uint8Array(size);
  for (let i = size - 1; i >= 0; i--) { bytes[i] = n % 256; n = Math.floor(n / 256); }
  bytes[0] |= 1 << (8 - size); return bytes;
}
const ebml = (id: number, ...parts: Uint8Array[]) => { const body = concat(...parts); return concat(uint(id), vint(body.length), body); };
const number = (id: number, n: number) => ebml(id, uint(n));
const float = (id: number, n: number) => { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, n); return ebml(id, b); };

export function muxWebm(samples: VideoSample[], width: number, height: number, fps: number, codec: 'vp8' | 'vp09.00.10.08'): Blob {
  if (!samples.length) throw new Error('Videokoderen ga ingen bilder.');
  const header = ebml(0x1a45dfa3, number(0x4286, 1), number(0x42f7, 1), number(0x42f2, 4), number(0x42f3, 8), ebml(0x4282, text('webm')), number(0x4287, 4), number(0x4285, 2));
  const info = ebml(0x1549a966, number(0x2ad7b1, 1000), float(0x4489, samples.length * 1e6 / fps), ebml(0x4d80, text('Taktikktavle')), ebml(0x5741, text('Taktikktavle')));
  const tracks = ebml(0x1654ae6b, ebml(0xae, number(0xd7, 1), number(0x73c5, 1), number(0x83, 1), number(0x9c, 0), ebml(0x86, text(codec === 'vp8' ? 'V_VP8' : 'V_VP9')), number(0x23e383, Math.round(1e9 / fps)), ebml(0xe0, number(0xb0, width), number(0xba, height))));
  let position = info.length + tracks.length;
  const cues: Uint8Array[] = [];
  const clusters = samples.map(s => {
    const cluster = ebml(0x1f43b675, number(0xe7, s.timestamp), ebml(0xa3, new Uint8Array([0x81, 0, 0, s.key ? 0x80 : 0]), s.data));
    if (s.key) cues.push(ebml(0xbb, number(0xb3, s.timestamp), ebml(0xb7, number(0xf7, 1), number(0xf1, position))));
    position += cluster.length; return cluster;
  });
  const cueBox = ebml(0x1c53bb6b, ...cues);
  const size = position + cueBox.length;
  return new Blob([header, uint(0x18538067), vint(size), info, tracks, ...clusters, cueBox] as BlobPart[], { type: 'video/webm' });
}
