'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player, Position, TacticPhase } from '@/types';

// ══════════════════════════════════════════════════════════════
//  AVSPILLING AV FASENE – felles for TacticBoard og FullscreenBoard,
//  som før hadde hver sin kopi av løkka. Klokka går i steg på 30 ms
//  og sier hvilken overgang som vises (interpFrom) og hvor langt den
//  har kommet (interpT). Brettet sier hvilken fase som skal markeres.
//  Mellomposisjonene regnes ut med interpolatePlayers/interpolateBall.
// ══════════════════════════════════════════════════════════════

export function usePhasePlayback(
  phases: TacticPhase[],
  playSpeed: number,
  /** Markerer fasen avspillingen står i (storen på brettet, lokal fase i fullskjerm). */
  setPhaseIdx: (idx: number) => void,
) {
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const playRef  = useRef({ from:0, t:0 });

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT,    setInterpT]    = useState(0);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startPlayback = useCallback(() => {
    if (phases.length < 2) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    playRef.current = { from:0, t:0 };
    setInterpFrom(0); setInterpT(0); setPhaseIdx(0); setIsPlaying(true);
    timerRef.current = setInterval(() => {
      playRef.current.t += 0.025 * playSpeed;
      if (playRef.current.t >= 1) {
        const next = playRef.current.from + 1;
        if (next >= phases.length - 1) {
          clearInterval(timerRef.current!); timerRef.current=null;
          setIsPlaying(false); setPhaseIdx(phases.length-1); setInterpT(0); return;
        }
        playRef.current.from=next; playRef.current.t=0;
        setInterpFrom(next); setInterpT(0); setPhaseIdx(next);
      } else {
        setInterpT(playRef.current.t); setInterpFrom(playRef.current.from);
      }
    }, 30);
  }, [phases, playSpeed, setPhaseIdx]);

  const stopPlayback = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    setIsPlaying(false); setInterpT(0);
  }, []);

  return { isPlaying, interpFrom, interpT, startPlayback, stopPlayback };
}

/** Spillerne slik de står akkurat nå: midt i en overgang under avspilling, ellers fasens egne. */
export function interpolatePlayers(
  phase: TacticPhase, phases: TacticPhase[], interpFrom: number, interpT: number, isPlaying: boolean,
): Player[] {
  if (!isPlaying || interpT===0) return phase.players;
  const from = phases[interpFrom], to = phases[Math.min(interpFrom+1,phases.length-1)];
  if (!from||!to) return phase.players;
  return from.players.map(fp => {
    const tp = to.players.find(p=>p.id===fp.id); if (!tp) return fp;
    return { ...fp, position:{
      x: fp.position.x + (tp.position.x - fp.position.x) * interpT,
      y: fp.position.y + (tp.position.y - fp.position.y) * interpT,
    }};
  });
}

/** Ballen slik den står akkurat nå, etter samme regel som spillerne. */
export function interpolateBall(
  phase: TacticPhase, phases: TacticPhase[], interpFrom: number, interpT: number, isPlaying: boolean,
): Position {
  if (!isPlaying||interpT===0) return phase.ball;
  const from=phases[interpFrom], to=phases[Math.min(interpFrom+1,phases.length-1)];
  if (!from||!to) return phase.ball;
  return {
    x: from.ball.x + (to.ball.x - from.ball.x) * interpT,
    y: from.ball.y + (to.ball.y - from.ball.y) * interpT,
  };
}
