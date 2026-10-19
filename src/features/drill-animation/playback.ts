'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePhasePlayback } from '@/hooks/usePhasePlayback';
import type { DrillAnimationPhase } from './types';

/** Bevegelse ved 1×. Brettets felles klokke beholdes uendret. */
export const PHASE_MOVE_MS = 1300;
/** Kort lesepause, også før første og etter siste bevegelse. */
export function phasePauseMs(text: string) {
  return Math.min(850, 650 + Math.max(0, text.length - 65) * 5);
}

/** Brettets uendrede klokke spiller én ekte overgang om gangen.
 * Mellom overgangene er klokka stoppet; ingen fasekopier interpoleres. */
export function useDrillPlayback(phases: DrillAnimationPhase[], speed: number, reducedMotion: boolean) {
  const [state, setState] = useState<{ index: number; mode: 'stopped' | 'hold' | 'move' }>({ index: 0, mode: 'stopped' });
  const segment = useMemo(() => phases.slice(state.index, state.index + 2), [phases, state.index]);
  const arrived = useCallback((index: number) => {
    if (index === 1) setState(current => ({ index: current.index + 1, mode: 'hold' }));
  }, []);
  const { isPlaying: clockRunning, interpT, startPlayback, stopPlayback } = usePhasePlayback(segment, speed * 1200 / PHASE_MOVE_MS, arrived);

  useEffect(() => {
    if (state.mode === 'move') {
      startPlayback();
      return stopPlayback;
    }
    if (state.mode === 'hold') {
      const timer = setTimeout(() => setState(current => ({
        ...current, mode: current.index === phases.length - 1 ? 'stopped' : 'move',
      })), phasePauseMs(phases[state.index].text) / speed);
      return () => clearTimeout(timer);
    }
  }, [state, phases, speed, startPlayback, stopPlayback]);

  const isPlaying = state.mode !== 'stopped';
  const moving = state.mode === 'move' && clockRunning && !reducedMotion;
  const shown = state.index + (state.mode === 'move' ? 1 : 0);
  const select = (index: number) => {
    stopPlayback();
    setState({ index: Math.max(0, Math.min(phases.length - 1, index)), mode: 'stopped' });
  };
  const togglePlay = () => {
    if (isPlaying) { select(shown); return; }
    setState({ index: shown === phases.length - 1 ? 0 : shown, mode: 'hold' });
  };
  return { isPlaying, moving, shown, from: reducedMotion ? shown : state.index, interpT: moving ? interpT : 0, select, togglePlay };
}
