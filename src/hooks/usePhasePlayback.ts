'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VIDEO_PHASE_MS } from '@/lib/exportVideo';
import type { Player, Position, TacticPhase } from '@/types';

// ══════════════════════════════════════════════════════════════
//  AVSPILLING AV FASENE – felles for TacticBoard og FullscreenBoard,
//  som før hadde hver sin kopi av løkka. Klokka er tidsbasert:
//  posisjonen regnes ut av performance.now(), så tempoet er det samme
//  uansett hvor ofte nettleseren rekker å kjøre løkka. En overgang tar
//  VIDEO_PHASE_MS (1,2 s) ved 1×, samme tempo som videoene. Løkka vekker
//  React hvert 30. ms og sier hvilken overgang som vises (interpFrom) og
//  hvor langt den har kommet (interpT). Brettet sier hvilken fase som skal
//  markeres. Mellomposisjonene regnes ut med interpolatePlayers/interpolateBall.
// ══════════════════════════════════════════════════════════════

/** Hvor ofte løkka oppdaterer brettet. Påvirker ikke tempoet. */
const TICK_MS = 30;

/** Klokka: hvor langt avspillingen var (i overganger, f.eks. 1,5) ved tidspunktet `at`, og farten siden da. */
export interface PhaseClock { at: number; position: number; speed: number }

/** Hvor langt avspillingen er kommet ved tidspunktet `now` (ms, performance.now()). */
export function clockPosition(clock: PhaseClock, now: number): number {
  return clock.position + (now - clock.at) * clock.speed / VIDEO_PHASE_MS;
}

/** Samme klokke i ny fart fra `now`: posisjonen fortsetter der den var. */
export function retimeClock(clock: PhaseClock, now: number, speed: number): PhaseClock {
  return { at: now, position: clockPosition(clock, now), speed };
}

export function usePhasePlayback(
  phases: TacticPhase[],
  playSpeed: number,
  /** Markerer fasen avspillingen står i (storen på brettet, lokal fase i fullskjerm). */
  setPhaseIdx: (idx: number) => void,
) {
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const clockRef = useRef<PhaseClock>({ at: 0, position: 0, speed: playSpeed });

  const [isPlaying,  setIsPlaying]  = useState(false);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT,    setInterpT]    = useState(0);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Ny fart midt i avspillingen: klokka fortsetter fra samme sted, i ny fart.
  useEffect(() => {
    if (clockRef.current.speed === playSpeed) return;
    clockRef.current = retimeClock(clockRef.current, performance.now(), playSpeed);
  }, [playSpeed]);

  const startPlayback = useCallback(() => {
    if (phases.length < 2) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    const last = phases.length - 1;
    clockRef.current = { at: performance.now(), position: 0, speed: clockRef.current.speed };
    let shownFrom = 0;
    setInterpFrom(0); setInterpT(0); setPhaseIdx(0); setIsPlaying(true);
    timerRef.current = setInterval(() => {
      const position = clockPosition(clockRef.current, performance.now());
      if (position >= last) {
        clearInterval(timerRef.current!); timerRef.current=null;
        setIsPlaying(false); setPhaseIdx(last); setInterpT(0); return;
      }
      const from = Math.floor(position);
      if (from !== shownFrom) { shownFrom = from; setPhaseIdx(from); }
      setInterpT(position - from); setInterpFrom(from);
    }, TICK_MS);
  }, [phases, setPhaseIdx]);

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
