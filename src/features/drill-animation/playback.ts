'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrillAnimationPhase } from './types';

// ══════════════════════════════════════════════════════════════
//  KLOKKA FOR ANIMERTE ØVELSER
//
//  Én klokke for 2D, 3D og videoene: tiden måles med performance.now(),
//  så posisjonen avhenger bare av hvor lang tid som har gått – aldri av
//  hvor ofte nettleseren rekker å tegne. 3D leser den i hvert bilde
//  (sample), 2D tegnes på nytt i hvert bilde (requestAnimationFrame).
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
  const pause = PHASE_PAUSE_MS / speed, move = PHASE_MOVE_MS / speed;
  const last = count - 1;
  let time = Math.max(0, elapsed);
  for (let i = start; i < last; i++) {
    if (time < pause) return still(i);
    time -= pause;
    if (time < move) return { from: i, t: time / move, moving: true, shown: i + 1, done: false };
    time -= move;
  }
  return { ...still(Math.max(0, last)), done: time >= pause };
}

/**
 * Spill/pause, fasevalg og klokka. `everyFrame` = tegn på nytt i hvert bilde
 * (2D). I 3D leser scenen klokka selv via `sample`, så siden tegnes bare
 * på nytt når fasen eller pausen skifter.
 */
export function useDrillPlayback(phases: DrillAnimationPhase[], speed: number, reducedMotion: boolean, everyFrame = true) {
  const count = phases.length;
  const run = useRef<{ start: number; at: number; speed: number } | null>(null);
  const [head, setHead] = useState<Playhead>(() => still(0));
  const [playing, setPlaying] = useState(false);
  const everyFrameRef = useRef(everyFrame);
  everyFrameRef.current = everyFrame;

  /** Klokka akkurat nå, uten å vente på React. null når den står. */
  const sample = useCallback((now = performance.now()): Playhead | null => {
    const current = run.current;
    if (!current) return null;
    const next = playheadAt(current.start, count, now - current.at, current.speed);
    return reducedMotion ? { ...next, from: next.shown, t: 0, moving: false } : next;
  }, [count, reducedMotion]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const next = sample();
      if (!next) return;
      if (next.done) {
        run.current = null;
        setPlaying(false);
        setHead(still(count - 1));
        return;
      }
      setHead(previous => everyFrameRef.current || previous.from !== next.from
        || previous.moving !== next.moving || previous.shown !== next.shown ? next : previous);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, sample, count]);

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
    select, togglePlay, sample,
  };
}
