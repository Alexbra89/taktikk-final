// Setter sammen storen og beholder offentlig API, lagringsoppsett og fanesynkronisering.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage, createTabGuardedStorage } from '../lib/safeStorage';
import type { AppStore } from './types';
import { migrateV1, repairPersisted } from './repair';
import { createTacticsSlice } from './tacticsSlice';
import { createReportsSlice } from './reportsSlice';
import { createCalendarSlice } from './calendarSlice';
import { createMomentsSlice } from './momentsSlice';
import { createBackupSlice } from './backupSlice';

export type { AppStore } from './types';
export { repairDrawing, repairEvent, repairItem, repairPersisted, repairTactic, repairReport, repairMoment } from './repair';
export { prepareBackupSnapshot } from './backupSlice';

const STORE_KEY = 'taktikkboard-storage';
// Skriver aldri over det en annen fane har lagret; laster det inn i stedet.
// queueMicrotask: storen er midt i en set() når skrivingen avvises.
const tabStorage = createTabGuardedStorage(safeStorage, () =>
  queueMicrotask(() => void useAppStore.persist.rehydrate()));

export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      currentView: 'dashboard',
      setView: (v) => set({ currentView: v }),

      homeTeamName: 'Hjemmelag',
      awayTeamName: 'Bortelag',
      awayTeamColor: '#ef4444',
      setHomeTeamName: (name) => set({ homeTeamName: name }),
      setAwayTeamName: (name) => set({ awayTeamName: name }),
      setAwayTeamColor: (color) => set({ awayTeamColor: color }),

      ageGroup: 'adult',
      setAgeGroup: (age) => set({ ageGroup: age }),
      ...createTacticsSlice(set, get, api),
      ...createReportsSlice(set, get, api),
      ...createCalendarSlice(set, get, api),
      ...createMomentsSlice(set, get, api),

      // ─── Visning ─────────────────────────────────────────────
      showMovement: false,
      setShowMovement: (on) => set({ showMovement: on }),
      ...createBackupSlice(set, get, api),
    }),
    {
      name: STORE_KEY,
      version: 2,
      storage: createJSONStorage(() => tabStorage.storage),
      migrate: (persisted, version) =>
        version < 2 ? migrateV1((persisted ?? {}) as Record<string, unknown>) : persisted,
      merge: (persisted, current) => ({ ...current, ...repairPersisted(persisted, current) }),
      // Alt unntatt flyktig UI-state (kamptid) lagres.
      partialize: (state) => ({
        tactics: state.tactics,
        activeTacticId: state.activeTacticId,
        ageGroup: state.ageGroup,
        homeTeamName: state.homeTeamName,
        awayTeamName: state.awayTeamName,
        awayTeamColor: state.awayTeamColor,
        rosterNames: state.rosterNames,
        events: state.events,
        customDrills: state.customDrills,
        matchReports: state.matchReports,
        moments: state.moments,
        currentView: state.currentView,
        lastExportedAt: state.lastExportedAt,
        showMovement: state.showMovement,
      }),
    }
  )
);

// En annen fane har lagret, eller fanen kommer tilbake i forgrunnen (der den
// kan ha gått glipp av storage-hendelser): hent det nye før brukeren endrer noe.
if (typeof window !== 'undefined') {
  const refresh = () => {
    if (tabStorage.changedElsewhere(STORE_KEY)) void useAppStore.persist.rehydrate();
  };
  window.addEventListener('storage', e => { if (e.key === STORE_KEY) refresh(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
}
