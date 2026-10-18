// Kontrollerer, eksporterer og importerer sikkerhetskopier av store-data.
import type { AppSlice } from './types';
import type { AppStore } from './types';
import { obj, repairPersisted } from './repair';

/** Import må aldri stille forkaste innhold slik reparasjon av lokal lagring kan. */
export function prepareBackupSnapshot(data: unknown, current: AppStore): Partial<AppStore> {
  const p = obj(data);
  const error = () => new Error('Sikkerhetskopien er skadet eller inneholder ugyldige data. Dataene dine er ikke endret.');
  if (!p || !Array.isArray(p.tactics) || !p.tactics.length || p.tactics.some(t => {
    const tactic = obj(t);
    return !tactic || !Array.isArray(tactic.phases) || !tactic.phases.length;
  })) throw error();
  const repaired = repairPersisted(p, current);
  // Nye standardfelter er tillatt i eldre kopier. Eksisterende verdier og hele
  // lister skal beholdes. Gamle, utgåtte hjelpefelter er ikke brukerinnhold.
  const obsolete = new Set(['targetPlayerIds', 'role', 'source', 'unverifiedSource', 'background']);
  const retained = (before: unknown, after: unknown, key = ''): boolean => {
    if (before === undefined) return true;
    if (key === 'id' && typeof before === 'string' && typeof after === 'string') return true;
    if (Array.isArray(before)) return Array.isArray(after) && before.length === after.length &&
      before.every((v, i) => retained(v, after[i]));
    const original = obj(before);
    if (original) {
      const result = obj(after);
      return !!result && Object.keys(original).every(k => obsolete.has(k) || retained(original[k], result[k], k));
    }
    return before === after;
  };
  for (const key of Object.keys(repaired)) {
    if (key in p && !retained(p[key], repaired[key as keyof AppStore])) throw error();
  }
  return repaired;
}

export const createBackupSlice: AppSlice<'lastExportedAt' | 'exportSnapshot' | 'markExported' | 'importSnapshot'> = (set, get) => ({

      // ─── Backup ──────────────────────────────────────────────
      lastExportedAt: null,

      exportSnapshot: () => {
        const s = get();
        // Samme utvalg som partialize under. Kamptid og eksporttidspunkt
        // hører ikke hjemme i en backup.
        return {
          tactics: s.tactics,
          activeTacticId: s.activeTacticId,
          ageGroup: s.ageGroup,
          homeTeamName: s.homeTeamName,
          awayTeamName: s.awayTeamName,
          awayTeamColor: s.awayTeamColor,
          rosterNames: s.rosterNames,
          events: s.events,
          customDrills: s.customDrills,
          matchReports: s.matchReports,
          moments: s.moments,
          currentView: s.currentView,
          showMovement: s.showMovement,
        };
      },

      markExported: () => set({ lastExportedAt: new Date().toISOString() }),

      importSnapshot: (data) => {
        const repaired = prepareBackupSnapshot(data, get());
        // Kontrollen over må fullføres før én eneste verdi erstattes.
        set({
          ...repaired,
          matchTimer: { running: false, startedAt: null, elapsed: 0 },
          // «Sist eksportert» handler om denne enheten. En import skal verken
          // overta tidspunktet fra filen eller slette din egen historikk.
          lastExportedAt: get().lastExportedAt,
          // Eldre kopier hadde ikke dette innstillingsfeltet.
          showMovement: obj(data)?.showMovement === undefined ? get().showMovement : repaired.showMovement,
        });
      },
});
