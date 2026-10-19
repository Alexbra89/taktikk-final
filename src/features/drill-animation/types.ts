import type { Tactic, TacticPhase } from '@/types';
import type { RoleFamily } from '@/data/roleInfo';

// ══════════════════════════════════════════════════════════════
//  ANIMERT ØVELSE – typene
//
//  En animasjon er en vanlig taktikk (samme faseformat som brettet),
//  pluss én kort tekst per fase og en valgfri markering («MÅL!»).
//  Den ligger fast i appen og lagres aldri hos brukeren.
// ══════════════════════════════════════════════════════════════

/** Hvem en spiller er i øvelsen: kort etikett under drakten og draktfarge. */
export interface CastMember {
  /** F.eks. «A», «F», «P». Tom streng = bare nummeret (venter i køen). */
  label: string;
  family: RoleFamily;
}

export interface DrillAnimationPhase extends TacticPhase {
  /** Kort tekst under banen, tro mot øvelsesteksten. Vises også som fasenotat i 3D. */
  text: string;
  /** Valgfri markering over banen, f.eks. «MÅL!». */
  highlight?: string;
}

export interface DrillAnimation extends Tactic {
  /** Øvelsen animasjonen hører til (DrillExercise.id). */
  drillId: string;
  /** Etikett og farge for hver spiller-id. */
  cast: Record<string, CastMember>;
  phases: DrillAnimationPhase[];
}
