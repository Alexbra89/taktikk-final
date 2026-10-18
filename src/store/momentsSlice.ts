// Lagrer og sletter øyeblikksbilder av aktiv taktikkfase.
import type { AppSlice } from './types';
import type { TacticMoment } from '../types';
import { uid } from './id';

export const createMomentsSlice: AppSlice<'moments' | 'saveMoment' | 'deleteMoment'> = (set, get) => ({

      // ─── Lagrede øyeblikk ──────────────────────────────────
      moments: [],
      saveMoment: (name) => {
        const { tactics, activeTacticId, moments } = get();
        const tactic = tactics.find(t => t.id === activeTacticId);
        const phase = tactic?.phases[tactic.activePhaseIdx];
        if (!tactic || !phase) return;
        const moment: TacticMoment = {
          id: uid(), name, tacticId: tactic.id,
          timestamp: new Date().toISOString(),
          snapshot: JSON.parse(JSON.stringify(phase)),
        };
        set({ moments: [moment, ...moments] });
      },
      deleteMoment: (id) => set(s => ({ moments: s.moments.filter(m => m.id !== id) })),
});
