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

/**
 * Hvordan ballen spilles inn i fasen: langs bakken, i en lav bue (sentring),
 * hardt (skudd), som en høy ball i luften, bokset høyt og langt ut av keeperen,
 * avbøyd av en spiller (deflect) eller tatt i en takling (tackle). De to siste
 * skjer i det ballen kommer, uten at noen holder den først.
 */
export type Kick = 'pass' | 'cross' | 'shot' | 'high' | 'punch' | 'deflect' | 'tackle';

export interface DrillAnimationPhase extends TacticPhase {
  /** Kort tekst under banen, tro mot øvelsesteksten. Vises også som fasenotat i 3D. */
  text: string;
  /** Valgfri markering over banen, f.eks. «MÅL!». */
  highlight?: string;
  /**
   * Ballen spilles på vei inn i fasen. Mangler den, ser avspillingen det selv:
   * ny ballholder = pasning, ballen i mål = skudd. Sentring må stå her.
   */
  kick?: Kick;
  /** Ballholderen gjør en vending på slutten av bevegelsen (ballen går rundt spilleren). */
  turn?: boolean;
  /** Spillere som slenger seg (ligger på siden) i denne fasen. Fallet skjer sent i bevegelsen inn hit. */
  dive?: string[];
  /** Ballholderen har ballen i hendene (fanget): i brysthøyde i 3D, inntil drakten i 2D. */
  held?: boolean;
}

export interface DrillAnimation extends Tactic {
  /** Øvelsen animasjonen hører til (DrillExercise.id). */
  drillId: string;
  /** Etikett og farge for hver spiller-id. */
  cast: Record<string, CastMember>;
  phases: DrillAnimationPhase[];
}
