import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Sport, Tactic, TacticPhase, CalendarEvent,
  AppView, Player, Position, Drawing,
  TrainingNote, MatchNote, MatchTimer, MatchReport, ReportTag,
  TacticMoment
} from '../types';
import { VW, VH, DEFAULT_FORMATION, getFormations, getFormationSlots } from '../data/formations';
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

// ═══════════════════════════════════════════════════════════════
//  TAKTIKK-HJELPERE (rene funksjoner)
// ═══════════════════════════════════════════════════════════════

type Slots = ReturnType<typeof getFormationSlots>;

const SPORTS: Sport[] = ['football', 'football5', 'football7', 'football9'];
const isSport = (v: unknown): v is Sport => SPORTS.includes(v as Sport);
const isPos = (p: unknown): p is Position =>
  !!p && Number.isFinite((p as Position).x) && Number.isFinite((p as Position).y);
const centerBall = (): Position => ({ x: VW / 2, y: VH / 2 });
const newPlayerId = () => `p-${uid()}`;

function createPhase(name: string, slots: Slots): TacticPhase {
  return {
    id: `phase-${uid()}`,
    name,
    players: slots.map((slot, i) => ({
      id: newPlayerId(), num: i + 1, name: '', slotIdx: i,
      position: { ...slot.position }, notes: '',
    })),
    ball: centerBall(),
    drawings: [],
    stickyNote: '',
  };
}

function createTactic(name: string, sport: Sport): Tactic {
  const formation = DEFAULT_FORMATION[sport] ?? getFormations(sport)[0].name;
  return {
    id: `tactic-${uid()}`,
    name, sport, formation,
    phases: [createPhase('Fase 1', getFormationSlots(sport, formation))],
    activePhaseIdx: 0,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sørger for at hver fase har nøyaktig én spiller per slot (0 ≤ slotIdx < slots.length).
 * Overflødige spillere fjernes. Manglende legges til på slotens posisjon, med samme
 * id og draktnummer i alle faser, slik at en spiller kan følges gjennom fasene.
 */
function syncPlayers(phases: TacticPhase[], slots: Slots): TacticPhase[] {
  const n = slots.length;
  const shared = new Map<number, { id: string; num: number }>();
  const usedNums = new Set<number>();
  phases.forEach(ph => ph.players.forEach(p => usedNums.add(p.num)));

  return phases.map(ph => {
    const seen = new Set<number>();
    const kept = ph.players.filter(p => {
      const ok = Number.isInteger(p.slotIdx) && p.slotIdx >= 0 && p.slotIdx < n && !seen.has(p.slotIdx);
      if (ok) seen.add(p.slotIdx);
      return ok;
    });
    const added: Player[] = [];
    for (let i = 0; i < n; i++) {
      if (seen.has(i)) continue;
      let t = shared.get(i);
      if (!t) {
        let num = i + 1;
        while (usedNums.has(num)) num++;
        usedNums.add(num);
        t = { id: newPlayerId(), num };
        shared.set(i, t);
      }
      added.push({ id: t.id, num: t.num, name: '', slotIdx: i, position: { ...slots[i].position }, notes: '' });
    }
    return { ...ph, players: [...kept, ...added].sort((a, b) => a.slotIdx - b.slotIdx) };
  });
}

/** Alle spillere i fasen går til posisjonen til sin egen slot. */
const resetToSlots = (ph: TacticPhase, slots: Slots): TacticPhase => ({
  ...ph,
  players: ph.players.map(p => slots[p.slotIdx] ? { ...p, position: { ...slots[p.slotIdx].position } } : p),
});

const patchActiveTactic = (s: AppStore, fn: (t: Tactic) => Tactic): Pick<AppStore, 'tactics'> => ({
  tactics: s.tactics.map(t => t.id === s.activeTacticId ? fn(t) : t),
});

const patchPhase = (t: Tactic, idx: number, fn: (ph: TacticPhase) => TacticPhase): Tactic => ({
  ...t, phases: t.phases.map((ph, i) => i === idx ? fn(ph) : ph),
});

// ═══════════════════════════════════════════════════════════════
//  LAGRING: v1-migrering og reparasjon ved lasting
// ═══════════════════════════════════════════════════════════════

const LEGACY_ATTENDANCE_TITLE = '✅ Fremmøte';
const VALID_VIEWS: AppView[] = ['board', 'calendar', 'training'];

function cleanPersistedEvents(events: CalendarEvent[]): CalendarEvent[] {
  const stripTargets = <T extends { title: string }>(notes: T[] | undefined) =>
    (notes ?? []).map(n => { const rest: Record<string, unknown> = { ...n }; delete rest.targetPlayerIds; return rest as unknown as T; });
  return events.map(e => ({
    ...e,
    trainingNotes: stripTargets(e.trainingNotes).filter(n => n.title !== LEGACY_ATTENDANCE_TITLE),
    matchNotes: stripTargets(e.matchNotes),
  }));
}

// v1 → v2: bare innstillinger, hendelser og navneliste tas med. Taktikkene starter på nytt.
function migrateV1(old: Record<string, unknown>): Record<string, unknown> {
  const keep = ['homeTeamName', 'awayTeamName', 'awayTeamColor', 'ageGroup', 'moments', 'events', 'rosterNames', 'currentView'];
  const out: Record<string, unknown> = {};
  keep.forEach(k => { if (old[k] !== undefined) out[k] = old[k]; });
  return out;
}

function repairTactic(raw: unknown): Tactic | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Partial<Tactic>;
  const sport: Sport = isSport(t.sport) ? t.sport : 'football';
  const formation = getFormations(sport).some(f => f.name === t.formation)
    ? (t.formation as string) : DEFAULT_FORMATION[sport];
  const slots = getFormationSlots(sport, formation);

  const phases = (Array.isArray(t.phases) ? t.phases : [])
    .filter((ph): ph is TacticPhase => !!ph && typeof ph === 'object')
    .map((ph, i): TacticPhase => ({
      id: typeof ph.id === 'string' ? ph.id : `phase-${uid()}`,
      name: typeof ph.name === 'string' ? ph.name : `Fase ${i + 1}`,
      players: (Array.isArray(ph.players) ? ph.players : [])
        .filter((p): p is Player => !!p && typeof p.id === 'string' && isPos(p.position))
        .map(p => ({
          id: p.id, slotIdx: p.slotIdx, position: p.position,
          num: Number.isFinite(p.num) ? p.num : (Number.isInteger(p.slotIdx) ? p.slotIdx + 1 : 0),
          name: typeof p.name === 'string' ? p.name : '',
          notes: typeof p.notes === 'string' ? p.notes : '',
        })),
      ball: isPos(ph.ball) ? ph.ball : centerBall(),
      drawings: Array.isArray(ph.drawings) ? ph.drawings : [],
      stickyNote: typeof ph.stickyNote === 'string' ? ph.stickyNote : '',
    }));
  const safePhases = syncPlayers(phases.length ? phases : [createPhase('Fase 1', slots)], slots);

  return {
    id: typeof t.id === 'string' ? t.id : `tactic-${uid()}`,
    name: typeof t.name === 'string' && t.name.trim() ? t.name : 'Taktikk',
    sport, formation,
    phases: safePhases,
    activePhaseIdx: Number.isInteger(t.activePhaseIdx)
      ? Math.max(0, Math.min(t.activePhaseIdx as number, safePhases.length - 1)) : 0,
    createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
  };
}

// Et korrupt lager skal aldri gi hvit skjerm: alt som ikke er gyldig erstattes med `current`.
function repairPersisted(persisted: unknown, current: AppStore): Partial<AppStore> {
  const p = (persisted && typeof persisted === 'object' ? persisted : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) => typeof v === 'string' && v ? v : fallback;
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];

  const tactics = arr<unknown>(p.tactics).map(repairTactic).filter((t): t is Tactic => t !== null);
  const safeTactics = tactics.length ? tactics : current.tactics;

  return {
    tactics: safeTactics,
    activeTacticId: safeTactics.some(t => t.id === p.activeTacticId) ? p.activeTacticId as string : safeTactics[0].id,
    ageGroup: p.ageGroup === 'youth' || p.ageGroup === 'adult' ? p.ageGroup : current.ageGroup,
    homeTeamName: str(p.homeTeamName, current.homeTeamName),
    awayTeamName: str(p.awayTeamName, current.awayTeamName),
    awayTeamColor: str(p.awayTeamColor, current.awayTeamColor),
    rosterNames: arr<unknown>(p.rosterNames).filter((n): n is string => typeof n === 'string'),
    events: cleanPersistedEvents(arr<CalendarEvent>(p.events)),
    matchReports: arr<MatchReport>(p.matchReports),
    moments: arr<TacticMoment>(p.moments),
    currentView: VALID_VIEWS.includes(p.currentView as AppView) ? p.currentView as AppView : current.currentView,
  };
}

// ═══════════════════════════════════════════════════════════════
//  ZUSTAND STORE
// ═══════════════════════════════════════════════════════════════

interface AppStore {
  currentView: AppView;
  setView: (v: AppView) => void;

  homeTeamName: string;
  awayTeamName: string;
  awayTeamColor: string;
  setHomeTeamName: (name: string) => void;
  setAwayTeamName: (name: string) => void;
  setAwayTeamColor: (color: string) => void;

  ageGroup: 'youth' | 'adult';
  setAgeGroup: (age: 'youth' | 'adult') => void;

  // ─── Taktikker ───────────────────────────────────────────
  tactics: Tactic[];
  activeTacticId: string;
  addTactic: (name?: string) => void;
  removeTactic: (id: string) => void;
  renameTactic: (id: string, name: string) => void;
  setActiveTactic: (id: string) => void;

  // ─── Virker alltid på aktiv taktikk ──────────────────────
  setFormation: (name: string) => void;
  setSport: (sport: Sport) => void;

  setActivePhaseIdx: (i: number) => void;
  addPhase: () => void;
  removePhase: (idx: number) => void;
  renamePhase: (idx: number, name: string) => void;
  // Spiller-, ball- og tegneendringer treffer aktiv fase.
  movePlayer: (playerId: string, pos: Position) => void;
  moveBall: (pos: Position) => void;
  // Navn og draktnummer tilhører spilleren, ikke fasen: gjelder alle faser i taktikken.
  setPlayerName: (playerId: string, name: string) => void;
  setPlayerNum: (playerId: string, num: number) => void;
  addDrawing: (drawing: Omit<Drawing, 'id'>) => void;
  clearDrawings: () => void;
  // phaseIdx er valgfri fordi kallet er debouncet og fasen kan ha byttet før det utføres.
  updateStickyNote: (note: string, phaseIdx?: number) => void;

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
  saveMoment: (name: string) => void;
  deleteMoment: (id: string) => void;
}

const initialTactic = createTactic('Taktikk 1', 'football');

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentView: 'board',
      setView: (v) => set({ currentView: v }),

      homeTeamName: 'Hjemmelag',
      awayTeamName: 'Bortelag',
      awayTeamColor: '#ef4444',
      setHomeTeamName: (name) => set({ homeTeamName: name }),
      setAwayTeamName: (name) => set({ awayTeamName: name }),
      setAwayTeamColor: (color) => set({ awayTeamColor: color }),

      ageGroup: 'adult',
      setAgeGroup: (age) => set({ ageGroup: age }),

      // ─── Taktikker ─────────────────────────────────────────
      tactics: [initialTactic],
      activeTacticId: initialTactic.id,

      addTactic: (name) => {
        const { tactics, activeTacticId } = get();
        const sport = tactics.find(t => t.id === activeTacticId)?.sport ?? 'football';
        const tactic = createTactic(name?.trim() || `Taktikk ${tactics.length + 1}`, sport);
        set({ tactics: [...tactics, tactic], activeTacticId: tactic.id });
      },

      removeTactic: (id) => {
        const { tactics, activeTacticId } = get();
        const idx = tactics.findIndex(t => t.id === id);
        if (idx === -1 || tactics.length <= 1) return;
        const rest = tactics.filter(t => t.id !== id);
        // Neste taktikk tar over; var den siste, blir det forrige.
        const nextActive = id === activeTacticId ? rest[Math.min(idx, rest.length - 1)].id : activeTacticId;
        set({ tactics: rest, activeTacticId: nextActive });
      },

      renameTactic: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set(s => ({ tactics: s.tactics.map(t => t.id === id ? { ...t, name: trimmed } : t) }));
      },

      setActiveTactic: (id) => {
        if (get().tactics.some(t => t.id === id)) set({ activeTacticId: id });
      },

      // ─── Formasjon og sport ────────────────────────────────
      // Rollene utledes fra formasjon + slotIdx og følger derfor med i alle faser.
      // Posisjonene nullstilles bare i aktiv fase.
      setFormation: (name) => set(s => ({
        tactics: s.tactics.map(t => {
          if (t.id !== s.activeTacticId) return t;
          if (!getFormations(t.sport).some(f => f.name === name)) return t;
          const slots = getFormationSlots(t.sport, name);
          return patchPhase({ ...t, formation: name }, t.activePhaseIdx, ph => resetToSlots(ph, slots));
        }),
      })),

      // Ny sport gir standardformasjonen for sporten. Spillere som ikke har en slot
      // lenger fjernes fra alle faser, og manglende slots fylles opp i alle faser.
      setSport: (sport) => set(s => ({
        tactics: s.tactics.map(t => {
          if (t.id !== s.activeTacticId || t.sport === sport || !isSport(sport)) return t;
          const formation = DEFAULT_FORMATION[sport];
          const slots = getFormationSlots(sport, formation);
          const synced = { ...t, sport, formation, phases: syncPlayers(t.phases, slots) };
          return patchPhase(synced, t.activePhaseIdx, ph => resetToSlots(ph, slots));
        }),
      })),

      // ─── Faser ─────────────────────────────────────────────
      setActivePhaseIdx: (i) => set(s => patchActiveTactic(s, t =>
        i >= 0 && i < t.phases.length ? { ...t, activePhaseIdx: i } : t)),

      addPhase: () => set(s => patchActiveTactic(s, t => {
        const cur = t.phases[t.activePhaseIdx];
        const copy: TacticPhase = {
          id: `phase-${uid()}`,
          name: `Fase ${t.phases.length + 1}`,
          players: cur.players.map(p => ({ ...p, position: { ...p.position } })),
          ball: { ...cur.ball },
          drawings: [],
          stickyNote: '',
        };
        return { ...t, phases: [...t.phases, copy], activePhaseIdx: t.phases.length };
      })),

      removePhase: (idx) => set(s => patchActiveTactic(s, t => {
        if (t.phases.length <= 1 || idx < 0 || idx >= t.phases.length) return t;
        const phases = t.phases.filter((_, i) => i !== idx);
        const active = idx < t.activePhaseIdx ? t.activePhaseIdx - 1 : t.activePhaseIdx;
        return { ...t, phases, activePhaseIdx: Math.min(active, phases.length - 1) };
      })),

      renamePhase: (idx, name) => set(s => patchActiveTactic(s, t => patchPhase(t, idx, ph => ({ ...ph, name })))),

      movePlayer: (playerId, pos) => set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, position: pos } : p),
        })))),

      moveBall: (pos) => set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({ ...ph, ball: pos })))),

      setPlayerName: (playerId, name) => set(s => patchActiveTactic(s, t => ({
        ...t, phases: t.phases.map(ph => ({
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, name: name.trim() } : p),
        })),
      }))),

      setPlayerNum: (playerId, num) => set(s => patchActiveTactic(s, t => {
        if (!Number.isInteger(num) || num < 1 || num > 99) return t;
        return {
          ...t, phases: t.phases.map(ph => ({
            ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, num } : p),
          })),
        };
      })),

      addDrawing: (drawing) => set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({ ...ph, drawings: [...ph.drawings, { id: uid(), ...drawing }] })))),

      clearDrawings: () => set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({ ...ph, drawings: [] })))),

      updateStickyNote: (note, phaseIdx) => set(s => patchActiveTactic(s, t =>
        patchPhase(t, phaseIdx ?? t.activePhaseIdx, ph => ({ ...ph, stickyNote: note })))),

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

      // ─── Kalender og trening ───────────────────────────────
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
    }),
    {
      name: 'taktikkboard-storage',
      version: 2,
      storage: createJSONStorage(() => safeStorage),
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
        matchReports: state.matchReports,
        moments: state.moments,
        currentView: state.currentView,
      }),
    }
  )
);
