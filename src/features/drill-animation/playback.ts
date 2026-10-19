'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePhasePlayback } from '@/hooks/usePhasePlayback';
import type { TacticPhase } from '@/types';

/** Lesepause ved hver stilling, også før første og etter siste bevegelse. */
export const PHASE_PAUSE_MS = 1200;

/** Brettets uendrede klokke spiller én ekte overgang om gangen.
 * Mellom overgangene er klokka stoppet; ingen fasekopier interpoleres. */
export function useDrillPlayback(phases: TacticPhase[], speed: number, reducedMotion: boolean) {
  const [state, setState] = useState<{ index: number; mode: 'stopped' | 'hold' | 'move' }>({ index: 0, mode: 'stopped' });
  const segment = useMemo(() => phases.slice(state.index, state.index + 2), [phases, state.index]);
  const arrived = useCallback((index: number) => {
    if (index === 1) setState(current => ({ index: current.index + 1, mode: 'hold' }));
  }, []);
  const { isPlaying: clockRunning, interpT, startPlayback, stopPlayback } = usePhasePlayback(segment, speed, arrived);

  useEffect(() => {
    if (state.mode === 'move') {
      startPlayback();
      return stopPlayback;
    }
    if (state.mode === 'hold') {
      const timer = setTimeout(() => setState(current => ({
        ...current, mode: current.index === phases.length - 1 ? 'stopped' : 'move',
      })), PHASE_PAUSE_MS / speed);
      return () => clearTimeout(timer);
    }
  }, [state, phases.length, speed, startPlayback, stopPlayback]);

  const isPlaying = state.mode !== 'stopped';
  const moving = state.mode === 'move' && clockRunning && !reducedMotion;
  const shown = state.index + (moving && interpT > 0 ? 1 : 0);
  const select = (index: number) => {
    stopPlayback();
    setState({ index: Math.max(0, Math.min(phases.length - 1, index)), mode: 'stopped' });
  };
  const togglePlay = () => {
    if (isPlaying) { select(shown); return; }
    setState({ index: shown === phases.length - 1 ? 0 : shown, mode: 'hold' });
  };
  return { isPlaying, moving, shown, from: state.index, interpT: moving ? interpT : 0, select, togglePlay };
}
