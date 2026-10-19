import type { TacticPhase } from '@/types';

// ══════════════════════════════════════════════════════════════
//  AVSPILLING AV EN ANIMERT ØVELSE
//
//  Bruker brettets egen faseklokke (usePhasePlayback) uendret. Klokka
//  glir fra fase til fase uten opphold, så hver fase legges inn to
//  ganger: først selve stillingen, så en kopi. Overgangen mellom dem
//  er en pause der teksten kan leses; overgangen videre er bevegelsen.
//  Klokkas indeks 0, 1 = fase 1 · 2, 3 = fase 2 · osv.
// ══════════════════════════════════════════════════════════════

/** Fasene slik klokka spiller dem: hver fase etterfulgt av en pause i samme stilling. */
export function withPauses(phases: TacticPhase[]): TacticPhase[] {
  return phases.flatMap(phase => [phase, { ...phase, id: `${phase.id}-pause` }]);
}

/** Klokkas indeks for starten av en fase. */
export const clockIndexOf = (phaseIdx: number) => phaseIdx * 2;

/**
 * Fasen som vises nå. Under en bevegelse er det fasen spillerne er på vei
 * til, så teksten forklarer det som skjer. Uten glidning (redusert
 * bevegelse) står spillerne i klokkas fase til de hopper videre.
 */
export function shownPhase(clockIdx: number, interpFrom: number, interpT: number, gliding: boolean): number {
  const step = gliding && interpT > 0 ? interpFrom + 1 : clockIdx;
  return Math.floor(step / 2);
}
