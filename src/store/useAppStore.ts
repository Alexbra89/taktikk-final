import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Sport, TacticPhase, CalendarEvent,
  AppView, Player, Drawing,
  TrainingNote, MatchNote, MatchTimer, MatchReport, ReportTag,
  TacticMoment
} from '../types';
import { makePhase } from '../data/formations';
import { safeStorage } from '../lib/safeStorage';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ─── Rapport-tekst-generator (uendret) ───────────────────────
const TAG_LABELS: Record<ReportTag, string> = {
  god_gjennomforing:     'God gjennomføring av taktisk plan',
  manglet_konsentrasjon: 'Manglet konsentrasjon i perioder',
  god_pressing:          'Fremragende pressing og balljag',
  svak_forsvarsstilling: 'Svak forsvarsstilling ved tap',
  fin_pasningsspill:     'Fint pasningsspill og kombinasjoner',
  mange_balltap:         'For mange balltap under press',
  god_kommunikasjon:     'God kommunikasjon på banen',
  manglet_tempo:         'Manglet tempo og intensitet',
  sterk_defensiv:        'Sterk defensiv innsats',
  misset_sjanser:        'Misset for mange sjanser offensivt',
};

function generateReportText(tags: ReportTag[], freeText: string, matchTitle?: string): string {
  const date = new Date().toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const title = matchTitle ? `Kamp: ${matchTitle}` : 'Kamprapport';
  const tagLines = tags.map(t => `• ${TAG_LABELS[t]}`).join('\n');
  const extra = freeText.trim() ? `\nTilleggskommentarer:\n${freeText.trim()}` : '';
  return `${title}\nDato: ${date}\n\n${tagLines || '(ingen kategorier valgt)'}${extra}\n\nRapport generert av Taktikkboard`;
}

// ─── Opprydding av data lagret av eldre versjoner ────────────
// Eldre lagrede faser kan inneholde innbyttere og felt fra modellen med benk,
// skade og spillerkontoer. De finnes ikke lenger: innbyttere fjernes, og de
// utgåtte feltene strippes ved innlasting.
const LEGACY_PLAYER_FIELDS = [
  'isStarter', 'isOnField', 'minutesPlayed', 'specialRoles', 'secondaryRoles',
  'playerReply', 'individualTraining', 'currentSlotId', 'playerAccountId',
  'injured', 'injuryReturnDate', 'injury',
];
const LEGACY_ATTENDANCE_TITLE = '✅ Fremmøte';

function cleanPersistedPhases(phases: TacticPhase[]): TacticPhase[] {
  return phases.map(ph => ({
    ...ph,
    players: (ph.players ?? [])
      .filter(p => (p as { isStarter?: boolean }).isStarter !== false)
      .map(p => {
        const rest: Record<string, unknown> = { ...p };
        LEGACY_PLAYER_FIELDS.forEach(k => delete rest[k]);
        return rest as unknown as Player;
      }),
  }));
}

function cleanPersistedEvents(events: CalendarEvent[]): CalendarEvent[] {
  const stripTargets = <T extends { title: string }>(notes: T[] | undefined) =>
    (notes ?? []).map(n => { const rest: Record<string, unknown> = { ...n }; delete rest.targetPlayerIds; return rest as unknown as T; });
  return events.map(e => ({
    ...e,
    trainingNotes: stripTargets(e.trainingNotes).filter(n => n.title !== LEGACY_ATTENDANCE_TITLE),
    matchNotes: stripTargets(e.matchNotes),
  }));
}

// ═══════════════════════════════════════════════════════════════
//  ZUSTAND STORE
// ═══════════════════════════════════════════════════════════════

interface AppStore {
  currentView: AppView;
  setView: (v: AppView) => void;

  homeTeamName: string;
  awayTeamName: string;
  setHomeTeamName: (name: string) => void;
  setAwayTeamName: (name: string) => void;

  sport: Sport;
  ageGroup: 'youth' | 'adult';
  setSport: (s: Sport) => void;
  setAgeGroup: (age: 'youth' | 'adult') => void;
  
  phases: TacticPhase[];
  activePhaseIdx: number;
  setActivePhaseIdx: (i: number) => void;
  addPhase: () => void;
  removePhase: (idx: number) => void;
  updatePlayerPosition: (phaseIdx: number, playerId: string, pos: { x: number; y: number }) => void;
  updateBallPosition: (phaseIdx: number, pos: { x: number; y: number }) => void;
  updatePlayerField: (phaseIdx: number, playerId: string, fields: Partial<Player>) => void;
  addPlayer: (phaseIdx: number, player: Player) => void; // <-- NY
  updatePlayersInPhase: (phaseIdx: number, updates: Array<{ playerId: string; fields: Partial<Player> }>) => void;
  addDrawing: (phaseIdx: number, drawing: Omit<Drawing, 'id'>) => void;
  clearDrawings: (phaseIdx: number) => void;
  updatePhaseName: (phaseIdx: number, name: string) => void;
  updateStickyNote: (phaseIdx: number, note: string) => void;
  awayTeamColor: string;
  setAwayTeamColor: (color: string) => void;

  matchTimer: MatchTimer;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  matchReports: MatchReport[];
  createReport: (tags: ReportTag[], freeText: string, matchTitle?: string, eventId?: string) => MatchReport;
  deleteReport: (id: string) => void;

  events: CalendarEvent[];
  addEvent: (ev: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, fields: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addTrainingNote: (eventId: string, note: Omit<TrainingNote, 'id' | 'createdAt'>) => void;
  updateTrainingNote: (eventId: string, noteId: string, fields: Partial<TrainingNote>) => void;
  deleteTrainingNote: (eventId: string, noteId: string) => void;
  addMatchNote: (eventId: string, note: Omit<MatchNote, 'id' | 'createdAt'>) => void;
  updateMatchNote: (eventId: string, noteId: string, fields: Partial<MatchNote>) => void;
  deleteMatchNote: (eventId: string, noteId: string) => void;

  // Navneliste brukt kun til fremmøte på treninger – ingen kontoer eller profiler.
  rosterNames: string[];
  setRosterNames: (names: string[]) => void;

  moments: TacticMoment[];
  saveMoment: (phaseIdx: number, name: string) => void;
  deleteMoment: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      return {
        currentView: 'board',
        setView: (v) => set({ currentView: v }),

        homeTeamName: 'Hjemmelag',
        awayTeamName: 'Bortelag',

        setHomeTeamName: (name) => set({ homeTeamName: name }),
        setAwayTeamName: (name) => set({ awayTeamName: name }),

        sport: 'football',
        ageGroup: 'adult',
        phases: [makePhase('Fase 1', 'football')],
        activePhaseIdx: 0,
        moments: [],

        setSport: (s) => set({ sport: s }),
        setAgeGroup: (age) => set({ ageGroup: age }),
        setActivePhaseIdx: (i) => set({ activePhaseIdx: i }),

        addPhase: () => {
          const { phases, activePhaseIdx, sport } = get();
          const cur = phases[activePhaseIdx];
          const pitchSport = (sport === 'football7' ? 'football' : sport) as Sport;
          const np = makePhase(`Fase ${phases.length + 1}`, pitchSport, cur.players, cur.ball);
          const newPhases = [...phases, np];
          set({ phases: newPhases, activePhaseIdx: phases.length });
        },

        removePhase: (idx) => {
          const { phases, activePhaseIdx } = get();
          if (phases.length <= 1) return;
          const newP = phases.filter((_, i) => i !== idx);
          set({ phases: newP, activePhaseIdx: Math.min(activePhaseIdx, newP.length - 1) });
        },

        saveMoment: (phaseIdx, name) => {
          const { phases, moments } = get();
          const phaseToSave = phases[phaseIdx];
          if (!phaseToSave) return;
          const newMoment: TacticMoment = {
            id: uid(),
            name,
            timestamp: new Date().toISOString(),
            snapshot: JSON.parse(JSON.stringify(phaseToSave))
          };
          set({ moments: [newMoment, ...moments] });
        },

        deleteMoment: (id) => set(s => ({ moments: s.moments.filter(m => m.id !== id) })),

        updatePlayerPosition: (phaseIdx, playerId, pos) => {
          set((state) => {
            const newPhases = [...state.phases];
            newPhases[phaseIdx] = {
              ...newPhases[phaseIdx],
              players: newPhases[phaseIdx].players.map(p => 
                p.id === playerId ? { ...p, position: pos } : p
              )
            };
            return { phases: newPhases };
          });
        },

        updateBallPosition: (phaseIdx, pos) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, ball: pos });
          set({ phases: newPhases });
        },

        updatePlayerField: (phaseIdx, playerId, fields) => {
          set(state => {
            const newPhases = [...state.phases];
            const phase = newPhases[phaseIdx];
            if (!phase) return state;

            const playerExists = phase.players.some(p => p.id === playerId);
            if (!playerExists) {
              console.warn(`updatePlayerField: Player ${playerId} not found in phase ${phaseIdx}`);
              return state;
            }

            newPhases[phaseIdx] = {
              ...phase,
              players: phase.players.map(p => p.id === playerId ? { ...p, ...fields } : p),
            };
            return { phases: newPhases };
          });
        },

        // ═══════════════════════════════════════════════════════════════
        //  NY: addPlayer – legger til en ny spiller i fasen
        // ═══════════════════════════════════════════════════════════════
        addPlayer: (phaseIdx, player) => {
          set(state => {
            const newPhases = [...state.phases];
            const phase = newPhases[phaseIdx];
            if (!phase) return state;

            newPhases[phaseIdx] = {
              ...phase,
              players: [...phase.players, player],
            };
            return { phases: newPhases };
          });
        },

        updatePlayersInPhase: (phaseIdx, updates) => {
          set(state => {
            const newPhases = [...state.phases];
            const phase = newPhases[phaseIdx];
            if (!phase) return state;
            const updatedPlayers = phase.players.map(p => {
              const update = updates.find(u => u.playerId === p.id);
              return update ? { ...p, ...update.fields } : p;
            });
            newPhases[phaseIdx] = { ...phase, players: updatedPlayers };
            return { phases: newPhases };
          });
        },

        addDrawing: (phaseIdx, drawing) => {
          const d = { id: uid(), ...drawing };
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, drawings: [...ph.drawings, d],
          });
          set({ phases: newPhases });
        },

        clearDrawings: (phaseIdx) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, drawings: [] });
          set({ phases: newPhases });
        },

        updatePhaseName: (phaseIdx, name) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, name });
          set({ phases: newPhases });
        },

        updateStickyNote: (phaseIdx, note) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, stickyNote: note });
          set({ phases: newPhases });
        },

        awayTeamColor: '#ef4444',
        setAwayTeamColor: (color) => set({ awayTeamColor: color }),

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

        events: [],
        addEvent: (ev) => {
          const newEv = { id: uid(), ...ev };
          set(s => ({ events: [...s.events, newEv] }));
        },
        updateEvent: (id, fields) => {
          set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...fields } : e) }));
        },
        deleteEvent: (id) => {
          set(s => ({ events: s.events.filter(e => e.id !== id) }));
        },
        addTrainingNote: (eventId, note) => {
          const n: TrainingNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e
            : { ...e, trainingNotes: [...e.trainingNotes, n] }) }));
        },
        updateTrainingNote: (eventId, noteId, fields) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, trainingNotes: e.trainingNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
          })}));
        },
        deleteTrainingNote: (eventId, noteId) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, trainingNotes: e.trainingNotes.filter(n => n.id !== noteId),
          })}));
        },
        addMatchNote: (eventId, note) => {
          const n: MatchNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e
            : { ...e, matchNotes: [...e.matchNotes, n] }) }));
        },
        updateMatchNote: (eventId, noteId, fields) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, matchNotes: e.matchNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
          })}));
        },
        deleteMatchNote: (eventId, noteId) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, matchNotes: e.matchNotes.filter(n => n.id !== noteId),
          })}));
        },

        rosterNames: [],
        setRosterNames: (names) => {
          const seen = new Set<string>();
          const cleaned = names
            .map(n => n.trim())
            .filter(n => n && !seen.has(n.toLowerCase()) && (seen.add(n.toLowerCase()), true));
          set({ rosterNames: cleaned });
        },
      };
    },
    {
      name: 'taktikkboard-storage',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppStore>;
        return {
          ...current,
          ...saved,
          phases: saved.phases?.length ? cleanPersistedPhases(saved.phases) : current.phases,
          events: saved.events ? cleanPersistedEvents(saved.events) : current.events,
        };
      },
      migrate: (persistedState) => {
        const state = { ...(persistedState as Record<string, unknown>) };
        delete state.coachEmail;
        delete state.coachPassword;
        delete state.refereePin;
        return state;
      },
      // Midlertidig i C2: phases og events lagres nå lokalt, siden appen ikke lenger har noen server.
      // C4 utvider dette til hele den nye modellen.
      partialize: (state) => ({
        phases: state.phases,
        events: state.events,
        rosterNames: state.rosterNames,
        moments: state.moments,
        currentView: state.currentView,
        sport: state.sport,
        ageGroup: state.ageGroup,
        homeTeamName: state.homeTeamName,
        awayTeamName: state.awayTeamName,
        awayTeamColor: state.awayTeamColor,
      })
    }
  )
);
