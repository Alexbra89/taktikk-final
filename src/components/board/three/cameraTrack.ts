import { VIDEO_FPS } from '@/lib/exportVideo';
import type { CameraPose, CameraState } from './BoardScene';

/** One live camera reading, `time` ms after the start of the video. */
export interface CameraSample { time: number; state: CameraState; pose: CameraPose }

const lerp = (a: number[], b: number[], t: number) => a.map((value, i) => value + (b[i] - value) * t);

/** Shortest-path rotation between two unit quaternions (x, y, z, w). */
function slerp(a: number[], b: number[], t: number) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const sign = dot < 0 ? -1 : 1; dot *= sign;
  if (dot > .9995) {
    const q = a.map((value, i) => value + (sign * b[i] - value) * t), length = Math.hypot(...q) || 1;
    return q.map(value => value / length);
  }
  const angle = Math.acos(Math.min(1, dot)), sin = Math.sin(angle);
  const wa = Math.sin((1 - t) * angle) / sin, wb = sign * Math.sin(t * angle) / sin;
  return a.map((value, i) => value * wa + b[i] * wb);
}

/**
 * The camera at any video time. A slow device reads the live camera less than
 * 30 times a second; between two readings the camera glides from one to the next,
 * so every video frame still gets its own camera. Choice of view, player and
 * follow mode switch at the reading where they changed.
 */
export function cameraAt(track: CameraSample[], time: number): CameraSample {
  if (!track.length) throw new Error('Kamerabanen er tom.');
  let low = 0, high = track.length - 1;
  if (time <= track[low].time) return track[low];
  if (time >= track[high].time) return track[high];
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (track[middle].time <= time) low = middle; else high = middle;
  }
  const a = track[low], b = track[high];
  const t = (time - a.time) / Math.max(1e-6, b.time - a.time);
  return {
    time,
    state: { ...a.state, position: lerp(a.state.position, b.state.position, t), target: lerp(a.state.target, b.state.target, t) },
    pose: { position: lerp(a.pose.position, b.pose.position, t), quaternion: slerp(a.pose.quaternion, b.pose.quaternion, t), projection: lerp(a.pose.projection, b.pose.projection, t) },
  };
}

const wait = (ms: number, signal: AbortSignal) => new Promise<void>(resolve => {
  const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
  const timer = setTimeout(done, ms); signal.addEventListener('abort', done, { once: true });
});

/**
 * Plays a fullscreen recording live and notes only where the camera is. That is
 * cheap on any device; the video itself is rendered afterwards along this path
 * with exact timestamps (exportVideo3D), never in real time.
 */
export async function recordCameraTrack(options: {
  /** The whole video, as exportDuration. */
  durationMs: number;
  signal: AbortSignal;
  shouldStop: () => boolean;
  /** Shows the live frame at `time` ms into the video and returns the camera it was drawn with. */
  show: (time: number, dt: number, index: number) => Omit<CameraSample, 'time'>;
  onElapsed?: (seconds: number) => void;
}) {
  const { signal } = options;
  const track: CameraSample[] = [];
  const started = performance.now();
  let last = started;
  for (;;) {
    signal.throwIfAborted();
    const now = performance.now(), time = Math.min(options.durationMs, now - started);
    track.push({ time, ...options.show(time, Math.min(.1, (now - last) / 1000), track.length) });
    last = now;
    options.onElapsed?.(time / 1000);
    // Stopping keeps what was shown so far, at least one video frame.
    if (time >= options.durationMs || options.shouldStop()) return { track, durationMs: Math.max(time, 1000 / VIDEO_FPS) };
    await wait(Math.max(0, 1000 / VIDEO_FPS - (performance.now() - now)), signal);
  }
}
