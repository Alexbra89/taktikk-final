import { Position, PlayerRole, Sport, Tactic, TacticPhase } from '../types';
import { getFormationSlots } from '../data/formations';
import { getSlotLabel } from '../data/roleInfo';
import { useAppStore } from './useAppStore';

// Storen sikrer (også ved lasting av korrupt lager) at det alltid finnes minst én taktikk,
// at activeTacticId peker på en av dem, og at hver taktikk har minst én fase.
const activeTactic = (s: { tactics: Tactic[]; activeTacticId: string }): Tactic =>
  s.tactics.find(t => t.id === s.activeTacticId) ?? s.tactics[0];

export const useActiveTactic = (): Tactic => useAppStore(activeTactic);

export const useActivePhase = (): TacticPhase => useAppStore(s => {
  const t = activeTactic(s);
  return t.phases[t.activePhaseIdx] ?? t.phases[0];
});

/**
 * Rolle, standardposisjon og etikett for en spiller, utledet fra formasjonen.
 * Etiketten bruker slotens posisjon (ikke spillerens), så den endres ikke når spilleren dras.
 */
export function getSlot(tactic: Tactic, slotIdx: number): { role: PlayerRole; position: Position; label: string } {
  const slots = getFormationSlots(tactic.sport, tactic.formation);
  const slot = slots[slotIdx] ?? slots[0];
  return { role: slot.role, position: slot.position, label: getSlotLabel(slot.role, slot.position) };
}

/** Hva et sportbytte betyr for taktikken, brukt til bekreftelsesdialogen. */
export function getSportChangeImpact(tactic: Tactic, sport: Sport): {
  phases: number; added: number; removed: number;
} {
  const n = getFormationSlots(sport, '').length;
  const current = getFormationSlots(tactic.sport, tactic.formation).length;
  return {
    phases: tactic.phases.length,
    added: Math.max(0, n - current),
    removed: Math.max(0, current - n),
  };
}
