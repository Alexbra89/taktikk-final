// Kamptid og handlinger for kamprapporter.
import type { AppSlice } from './types';
import type { MatchReport } from '../types';
import { uid } from './id';
import { generateReportText } from './reportText';

export const createReportsSlice: AppSlice<'matchTimer' | 'startTimer' | 'stopTimer' | 'resetTimer' | 'tickTimer' | 'matchReports' | 'createReport' | 'deleteReport'> = (set, get) => ({

      // ─── Kamptid ───────────────────────────────────────────
      matchTimer: { running: false, startedAt: null, elapsed: 0 },
      startTimer: () => {
        const { matchTimer } = get();
        if (matchTimer.running) return;
        set({ matchTimer: { ...matchTimer, running: true, startedAt: Date.now() } });
      },
      stopTimer: () => {
        const { matchTimer } = get();
        if (!matchTimer.running || !matchTimer.startedAt) return;
        const extra = Math.floor((Date.now() - matchTimer.startedAt) / 1000);
        set({ matchTimer: { running: false, startedAt: null, elapsed: matchTimer.elapsed + extra } });
      },
      resetTimer: () => set({ matchTimer: { running: false, startedAt: null, elapsed: 0 } }),
      tickTimer: () => {},

      // ─── Kamprapporter ─────────────────────────────────────
      matchReports: [],
      createReport: (tags, freeText, matchTitle, eventId) => {
        const report: MatchReport = {
          id: uid(), eventId, matchTitle,
          createdAt: new Date().toISOString(),
          tags, freeText,
          generatedText: generateReportText(tags, freeText, matchTitle),
        };
        set(s => ({ matchReports: [...s.matchReports, report] }));
        return report;
      },
      deleteReport: (id) => set(s => ({ matchReports: s.matchReports.filter(r => r.id !== id) })),
});
