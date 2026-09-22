'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaybackEasing, TacticPhase } from '@/types';
import { ease, phaseDurationMs } from '@/lib/playback';

// ══════════════════════════════════════════════════════════════
//  AVSPILLING AV FASER – felles for TacticBoard og FullscreenBoard
//  (lå før som to nesten like setInterval-løkker).
//
//  Tidsstyrt med requestAnimationFrame: hver overgang varer fasens
//  durationMs uansett bildefrekvens. Fasen i storen / fullskjerm byttes
//  via onPhase når en overgang er ferdig, akkurat som før.
//
//  Uten loop: 1 → 2 → … → siste, og stopp på siste fase.
//  Med loop:  … → siste, pause i siste fases varighet, så fase 1 igjen.
// ══════════════════════════════════════════════════════════════

interface Options {
  phases: TacticPhase[];
  easing: PlaybackEasing | undefined;
  loop: boolean;
  speed: number;
  onPhase: (idx: number) => void;
}

/** Lengre pauser enn dette (bakgrunnsfane, treg enhet) hoppes ikke over, de settes på vent. */
const MAX_FRAME_MS = 100;

export function usePhasePlayback(opts: Options) {
  // Innstillingene leses fra ref i hver frame: endres farten underveis,
  // gjelder den med en gang, uten å starte avspillingen på nytt.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT,    setInterpT]    = useState(0);   // med easing
  const [progress,   setProgress]   = useState(0);   // 0–1 over hele avspillingen, uten easing

  const rafRef = useRef<number | null>(null);
  const runRef = useRef({ seg: 0, elapsed: 0, last: 0 });

  const halt = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setIsPlaying(false);
    setInterpT(0);
  }, []);

  const frame = useCallback((now: number) => {
    const { phases, easing, loop, speed, onPhase } = optsRef.current;
    const n = phases.length;
    const r = runRef.current;
    if (n < 2) { halt(); return; }

    r.elapsed += Math.min(MAX_FRAME_MS, Math.max(0, now - r.last)) * speed;
    r.last = now;

    // seg < n-1: overgang fra fase seg til seg+1. seg = n-1: pausen før ny runde (bare i loop).
    let dur = phaseDurationMs(phases[r.seg]);
    while (r.elapsed >= dur) {
      r.elapsed -= dur;
      if (r.seg === n - 1) {
        r.seg = 0;
      } else if (r.seg + 1 === n - 1 && !loop) {
        onPhase(n - 1);
        setInterpFrom(n - 1);
        setProgress(1);
        halt();
        return;
      } else {
        r.seg += 1;
      }
      onPhase(r.seg);
      dur = phaseDurationMs(phases[r.seg]);
    }

    if (r.seg === n - 1) {
      setInterpFrom(n - 1); setInterpT(0); setProgress(1);
    } else {
      const raw = r.elapsed / dur;
      setInterpFrom(r.seg);
      setInterpT(ease(easing, raw));
      setProgress((r.seg + raw) / (n - 1));
    }
    rafRef.current = requestAnimationFrame(frame);
  }, [halt]);

  const start = useCallback(() => {
    const { phases, onPhase } = optsRef.current;
    if (phases.length < 2) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    runRef.current = { seg: 0, elapsed: 0, last: performance.now() };
    setInterpFrom(0); setInterpT(0); setProgress(0);
    onPhase(0);
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(frame);
  }, [frame]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return { isPlaying, interpFrom, interpT, progress, start, stop: halt };
}
