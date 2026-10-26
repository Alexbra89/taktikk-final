'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrillAnimationPhase } from './types';

// ══════════════════════════════════════════════════════════════
//  KLOKKA FOR ANIMERTE ØVELSER
//
//  Én klokke for 2D, 3D og videoene: tiden måles med performance.now(),
//  så posisjonen avhenger bare av hvor lang tid som har gått – aldri av
//  hvor ofte nettleseren rekker å tegne. 3D leser den i hvert bilde
//  (sample). 2D starter nettleserens animasjoner fra samme tid; klokka vekkes
//  bare ved fasebytte, så den ikke gir nettleseren arbeid i hvert skjermbilde.
//  Rekkefølgen: pause i fasen → bevegelse til neste → pause → … → slutt.
//  Teksten byttes når bevegelsen mot en ny fase starter.
// ══════════════════════════════════════════════════════════════

/** Bevegelse fra fase til fase ved 1×. */
export const PHASE_MOVE_MS = 1300;
/** Kort pause i hver fase ved 1×, også før første og etter siste bevegelse. */
export const PHASE_PAUSE_MS = 400;

export interface Playhead {
  /** Fasen bevegelsen går fra (eller fasen det står stille i). */
  from: number;
  /** Hvor langt bevegelsen har kommet, 0–1. 0 i pausene. */
  t: number;
  moving: boolean;
  /** Fasen som vises: teksten, prikken og 3D-pillen. Neste fase så snart bevegelsen dit starter. */
  shown: number;
  /** Siste pause er over. */
  done: boolean;
}

const still = (index: number): Playhead => ({ from: index, t: 0, moving: false, shown: index, done: false });

/** Hele avspillingen fra fasen `start`, i ms ved farten `speed`. */
export function playbackMs(start: number, count: number, speed = 1) {
  return (Math.max(0, count - 1 - start) * (PHASE_MOVE_MS + PHASE_PAUSE_MS) + PHASE_PAUSE_MS) / speed;
}

/** Hvor avspillingen er `elapsed` ms etter at den startet i fasen `start`. */
export function playheadAt(start: number, count: number, elapsed: number, speed = 1): Playhead {
  return playheadAtInto(still(start), start, count, elapsed, speed);
}

/** Writes into a caller-owned buffer. Live readers must not retain it as a snapshot. */
export function playheadAtInto(out: Playhead, start: number, count: number, elapsed: number, speed = 1): Playhead {
  const pause = PHASE_PAUSE_MS / speed, move = PHASE_MOVE_MS / speed;
  const last = count - 1;
  out.t = 0; out.moving = false; out.done = false;
  let time = Math.max(0, elapsed);
  for (let i = start; i < last; i++) {
    out.from = i; out.shown = i;
    if (time < pause) return out;
    time -= pause;
    if (time < move) {
      out.t = time / move; out.moving = true; out.shown = i + 1;
      return out;
    }
    time -= move;
  }
  out.from = out.shown = Math.max(0, last); out.done = time >= pause;
  return out;
}

/**
 * Spill/pause, fasevalg og klokka. 2D starter fra `time`, 3D leser `sample`.
 * Dialogen tegnes bare på nytt når fasen eller pausen skifter.
 */
export function useDrillPlayback(phases: DrillAnimationPhase[], speed: number, reducedMotion: boolean) {
  const count = phases.length;
  const run = useRef<{ start: number; at: number; speed: number } | null>(null);
  const [head, setHead] = useState<Playhead>(() => still(0));
  const [playing, setPlaying] = useState(false);
  const sampled = useRef<Playhead>(still(0));

  /** Klokka akkurat nå, uten å vente på React. null når den står. */
  const sample = useCallback((now = performance.now()): Playhead | null => {
    const current = run.current;
    if (!current) return null;
    const next = playheadAtInto(sampled.current, current.start, count, now - current.at, current.speed);
    if (reducedMotion) { next.from = next.shown; next.t = 0; next.moving = false; }
    return next;
  }, [count, reducedMotion]);

  /** Absolute drill time at 1×, including the current pause. Used to start compositor animations. */
  const time = useCallback(() => {
    const current = run.current;
    return current ? current.start * (PHASE_MOVE_MS + PHASE_PAUSE_MS)
      + (performance.now() - current.at) * current.speed : null;
  }, []);

  // Ny fart midt i avspillingen: klokka fortsetter fra samme sted, i ny fart
  // for både bevegelse og pause (posisjonen avhenger av tid × fart).
  useEffect(() => {
    const current = run.current;
    if (!current || current.speed === speed) return;
    const now = performance.now();
    run.current = { ...current, at: now - (now - current.at) * current.speed / speed, speed };
  }, [speed]);

  useEffect(() => {
    if (!playing) return;
    let timer: ReturnType<typeof setTimeout>;
    const boundary = still(0);
    let previousFrom = -1, previousMoving = false, previousShown = -1;
    const tick = () => {
      const now = performance.now();
      const next = sample(now);
      if (!next) return;
      if (next.done) {
        run.current = null;
        setPlaying(false);
        setHead(still(count - 1));
        return;
      }
      // Ikke send en oppdatering til React for hvert skjermbilde, heller ikke
      // en funksjon som returnerer samme state. Bare fase-/pauseskifter angår
      // dialogen; figurene leser klokka direkte, uten React i bevegelsesløypa.
      if (previousFrom !== next.from || previousMoving !== next.moving || previousShown !== next.shown) {
        previousFrom = next.from; previousMoving = next.moving; previousShown = next.shown;
        // Only phase boundaries enter React. Never store the borrowed sample buffer in state.
        setHead({ ...next });
      }
      const current = run.current;
      if (!current) return;
      const elapsed = (now - current.at) * current.speed;
      playheadAtInto(boundary, current.start, count, now - current.at, current.speed);
      const cycle = PHASE_PAUSE_MS + PHASE_MOVE_MS;
      const end = boundary.from * cycle + (boundary.moving ? cycle : PHASE_PAUSE_MS);
      const absoluteTime = current.start * cycle + elapsed;
      // Wake only for a phase boundary. An otherwise empty RAF clock still
      // makes Chrome sample compositor animations/styles on the main thread.
      timer = setTimeout(tick, Math.max(1, (end - absoluteTime) / current.speed));
    };
    tick();
    return () => clearTimeout(timer);
  }, [playing, sample, count, speed]);

  const select = useCallback((index: number) => {
    run.current = null;
    setPlaying(false);
    setHead(still(Math.max(0, Math.min(count - 1, index))));
  }, [count]);

  const togglePlay = () => {
    if (playing) { select(head.shown); return; }
    const start = head.shown >= count - 1 ? 0 : head.shown;
    run.current = { start, at: performance.now(), speed };
    setHead(still(start));
    setPlaying(true);
  };

  const moving = head.moving && !reducedMotion;
  return {
    isPlaying: playing, moving, shown: head.shown,
    from: reducedMotion ? head.shown : head.from, interpT: moving ? head.t : 0,
    select, togglePlay, sample, time,
  };
}
