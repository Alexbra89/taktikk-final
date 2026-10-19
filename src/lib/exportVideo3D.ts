import { VIDEO_FPS, VIDEO_LEAD_MS, videoFilename } from './exportVideo';
import { downloadBlob } from './download';
import { muxMp4, muxWebm, type VideoSample } from './videoMux';
import { exportDuration } from '@/components/board/three/coordinates';

export interface EncoderChoice { config: VideoEncoderConfig; ext: 'mp4' | 'webm'; label: string }

/** Same format preference as exportVideo.ts, but WebCodecs rather than MediaRecorder
 * is required to assign timestamps without recording in real time.
 */
export async function chooseEncoder(lowPower = false, size?: { width: number; height: number }): Promise<EncoderChoice | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;
  // Fullscreen 16:10 and 4:3 frames can exceed level 4.2's frame-size limit.
  // Try level 5.1 H.264 before WebM, preserving the requested dimensions.
  const codecs = ['avc1.420028', 'avc1.4d0028', ...(size ? ['avc1.42002a', 'avc1.4d002a', 'avc1.420033', 'avc1.4d0033'] : []), 'vp09.00.10.08', 'vp8'];
  for (const codec of codecs) {
    for (const [width, height] of size ? [[size.width, size.height]] : lowPower ? [[1280, 720]] : [[1920, 1080], [1280, 720]]) {
      const avc = codec.startsWith('avc');
      const config: VideoEncoderConfig = {
        codec, width, height, framerate: VIDEO_FPS, bitrate: Math.max(width, height) === 1920 ? 10_000_000 : 6_000_000,
        // The MP4 muxer stores decode time equal to presentation time.
        // Request AVC without frame reordering for every profile/driver.
        latencyMode: avc ? 'realtime' : 'quality',
        ...(avc ? { avc: { format: 'avc' as const } } : {}),
      };
      try {
        const support = await VideoEncoder.isConfigSupported(config);
        if (support.supported) return { config, ext: avc ? 'mp4' : 'webm', label: `${avc ? 'MP4 (H.264)' : 'WebM'} · ${height}p · 30 bilder/s` };
      } catch { /* Try the next supported encoder/resolution. */ }
    }
  }
  return null;
}

const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/**
 * Starts the (often hardware) encoder once before a fullscreen recording, so
 * driver start-up is done before the recording clock starts. Only a warm-up:
 * real encoder errors are reported by exportVideo3D.
 */
export async function warmEncoder(choice: EncoderChoice) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return;
  const { width, height } = choice.config;
  let encoder: VideoEncoder | undefined;
  try {
    encoder = new VideoEncoder({ output() {}, error() {} });
    encoder.configure(choice.config);
    const frame = new VideoFrame(new Uint8ClampedArray(width * height * 4), { format: 'RGBA', codedWidth: width, codedHeight: height, timestamp: 0 });
    try { encoder.encode(frame, { keyFrame: true }); } finally { frame.close(); }
    await encoder.flush();
  } catch { /* The export itself configures a fresh encoder. */ }
  finally { if (encoder && encoder.state !== 'closed') encoder.close(); }
}

/**
 * Renders every frame at its exact time, however long each takes, so the file
 * always plays at an even 30 frames per second. Fullscreen recordings come here
 * too, after the live camera path has been recorded (cameraTrack.ts).
 */
export async function exportVideo3D(options: {
  choice: EncoderChoice;
  phaseCount: number;
  speed: number;
  team: string;
  tactic: string;
  signal: AbortSignal;
  onProgress: (value: number) => void;
  /** Called once per frame, in order; may take arbitrarily long. */
  draw: (elapsedMs: number, index: number) => Promise<ImageData>;
  /** Fewer frames than the whole tactic, e.g. a fullscreen recording stopped early. */
  frameCount?: number;
  /** The whole video in ms when it has its own tempo (animated drills); otherwise exportDuration. */
  durationMs?: number;
}) {
  const { choice, signal } = options;
  signal.throwIfAborted();
  const samples: VideoSample[] = [];
  let description: Uint8Array | null = null;
  let failure: Error | null = null;
  let bytes = 0;
  const encoder = new VideoEncoder({
    output(chunk, metadata) {
      const data = new Uint8Array(chunk.byteLength); chunk.copyTo(data);
      bytes += data.length;
      if (bytes > 512 * 1024 * 1024) { failure = new Error('Videoen er for stor. Del taktikken i kortere sekvenser.'); return; }
      samples.push({ data, timestamp: chunk.timestamp, key: chunk.type === 'key' });
      const d = metadata?.decoderConfig?.description;
      if (d && !description) description = ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength).slice() : new Uint8Array(d).slice();
    },
    error() { failure = new Error('Videokoderen stoppet underveis. Prøv igjen, eller bruk en annen nettleser.'); },
  });
  const check = () => { signal.throwIfAborted(); if (failure) throw failure; };
  // Closing also rejects a pending flush, so cancellation never waits for a
  // slow hardware/software encoder to finish its queued frames.
  const cancel = () => { if (encoder.state !== 'closed') encoder.close(); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    encoder.configure(choice.config);
    const whole = Math.ceil((options.durationMs ?? exportDuration(options.phaseCount, options.speed)) * VIDEO_FPS / 1000);
    const count = Math.min(whole, Math.max(1, options.frameCount ?? whole));
    for (let i = 0; i < count; i++) {
      check();
      const pixels = await options.draw(Math.max(0, i * 1000 / VIDEO_FPS - VIDEO_LEAD_MS), i);
      check();
      const timestamp = Math.round(i * 1e6 / VIDEO_FPS);
      // CPU pixels avoid stale/black GPU snapshots on some H.264 drivers.
      const frame = new VideoFrame(pixels.data, {
        format: 'RGBA', codedWidth: pixels.width, codedHeight: pixels.height,
        timestamp, duration: Math.round((i + 1) * 1e6 / VIDEO_FPS) - timestamp,
      });
      try { encoder.encode(frame, { keyFrame: i % (VIDEO_FPS * 2) === 0 }); } finally { frame.close(); }
      if (encoder.encodeQueueSize >= 4) await encoder.flush();
      options.onProgress((i + 1) / count * .98);
      await yieldToBrowser();
    }
    await encoder.flush(); check();
    if (samples.length !== count) throw new Error('Ikke alle videobildene ble kodet. Prøv igjen med en annen nettleser.');
    const { width, height } = choice.config;
    const blob = choice.ext === 'mp4'
      ? muxMp4(samples, description ?? new Uint8Array(), width, height, VIDEO_FPS)
      : muxWebm(samples, width, height, VIDEO_FPS, choice.config.codec as 'vp8' | 'vp09.00.10.08');
    check(); downloadBlob(videoFilename(options.team, `${options.tactic}-3d`, choice.ext), blob);
    options.onProgress(1);
  } finally {
    signal.removeEventListener('abort', cancel);
    if (encoder.state !== 'closed') encoder.close();
    samples.length = 0;
  }
}
