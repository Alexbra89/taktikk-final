import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Sport, TacticPhase, CalendarEvent, PlayerAccount,
  CoachMessage, PlayerReply, AppView, Player, Drawing,
  TrainingNote, MatchNote, MatchTimer, MatchReport, ReportTag,
  SubstitutionSuggestion, SpecialRole,
} from '../types';
import { makePhase } from '../data/formations';

interface ChatMessage {
  id: string;
  fromRole: 'coach' | 'player';
  fromName: string;
  content: string;
  createdAt: string;
  toPlayerId?: string;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ─── Rapport-tekst-generator ──────────────────────────────────
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

function suggestSubstitutions(
  players: Player[],
  totalPlayers: number,
  teamSize: number,
  currentMinute: number,
  intervalMinutes = 10,
): SubstitutionSuggestion[] {
  if (totalPlayers <= teamSize) return [];
  const bench = players.filter(p => !p.isOnField);
  const field = players.filter(p => p.isOnField);
  if (!bench.length || !field.length) return [];
  const suggestions: SubstitutionSuggestion[] = [];
  const sortedField = [...field].sort((a, b) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0));
  const sortedBench = [...bench].sort((a, b) => (a.minutesPlayed ?? 0) - (b.minutesPlayed ?? 0));
  const slots = Math.min(sortedField.length, sortedBench.length, 3);
  for (let i = 0; i < slots; i++) {
    suggestions.push({
      outPlayerId: sortedField[i].id,
      inPlayerId:  sortedBench[i].id,
      atMinute:    currentMinute + intervalMinutes * (i + 1),
      reason:      `${sortedField[i].name || '#' + sortedField[i].num} har spilt ${sortedField[i].minutesPlayed ?? 0} min`,
    });
  }
  return suggestions;
}

// Extend Sport type to include football7
type ExtendedSport = Sport | 'football7';

interface AppStore {
  currentView: AppView;
  setView: (v: AppView) => void;

  currentUser: { role: 'coach' | 'player' | 'referee'; playerId?: string; name: string; accountId?: string } | null;
  loginCoach: (email: string, password: string) => boolean;
  loginPlayer: (accountId: string, pin: string) => boolean;
  loginReferee: (pin: string) => boolean;
  logout: () => void;
  coachEmail: string;
  coachPassword: string;
  refereePin: string;
  homeTeamName: string;
  awayTeamName: string;
  setCoachEmail: (email: string) => void;
  setCoachPassword: (pw: string) => void;
  setRefereePin: (pin: string) => void;
  setHomeTeamName: (name: string) => void;
  setAwayTeamName: (name: string) => void;

  chatMessages: ChatMessage[];
  sendChat: (fromRole: 'coach'|'player', fromName: string, content: string, toPlayerId?: string) => void;

  sport: ExtendedSport;
  setSport: (s: ExtendedSport) => void;
  phases: TacticPhase[];
  activePhaseIdx: number;
  setActivePhaseIdx: (i: number) => void;
  addPhase: () => void;
  removePhase: (idx: number) => void;
  updatePlayerPosition: (phaseIdx: number, playerId: string, pos: { x: number; y: number }) => void;
  updateBallPosition: (phaseIdx: number, pos: { x: number; y: number }) => void;
  updatePlayerField: (phaseIdx: number, playerId: string, fields: Partial<Player>) => void;
  addDrawing: (phaseIdx: number, drawing: Omit<Drawing, 'id'>) => void;
  clearDrawings: (phaseIdx: number) => void;
  updatePhaseName: (phaseIdx: number, name: string) => void;
  updateStickyNote: (phaseIdx: number, note: string) => void;

  setSpecialRole: (phaseIdx: number, playerId: string, role: SpecialRole, active: boolean) => void;

  awayTeamColor: string;
  setAwayTeamColor: (color: string) => void;

  setPlayerInjury: (phaseIdx: number, playerId: string, injured: boolean, returnDate?: string) => void;
  checkAndHealInjuries: (phaseIdx: number) => void;

  setPlayerStarter: (phaseIdx: number, playerId: string, isStarter: boolean) => void;

  matchTimer: MatchTimer;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  addMinutesPlayed: (phaseIdx: number, playerId: string, minutes: number) => void;
  togglePlayerOnField: (phaseIdx: number, playerId: string) => void;
  getSubstitutionSuggestions: (phaseIdx: number, intervalMinutes?: number) => SubstitutionSuggestion[];

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

  playerAccounts: PlayerAccount[];
  addPlayerAccount: (acc: Omit<PlayerAccount, 'id'>) => void;
  removePlayerAccount: (id: string) => void;
  updatePlayerAccount: (id: string, fields: Partial<PlayerAccount>) => void;

  coachMessages: CoachMessage[];
  sendCoachMessage: (playerId: string, content: string, eventId?: string) => void;
  replyToMessage: (messageId: string, playerId: string, content: string) => void;
  deleteCoachMessage: (messageId: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({

      currentView: 'board',
      setView: (v) => set({ currentView: v }),

      currentUser: null,
      coachEmail: 'trener@lag.no',
      coachPassword: 'trener123',
      refereePin: '0000',
      homeTeamName: 'Hjemmelag',
      awayTeamName: 'Bortelag',
      setCoachEmail: (email) => set({ coachEmail: email }),
      setCoachPassword: (pw) => set({ coachPassword: pw }),
      setRefereePin: (pin) => set({ refereePin: pin }),
      setHomeTeamName: (name) => set({ homeTeamName: name }),
      setAwayTeamName: (name) => set({ awayTeamName: name }),

      loginCoach: (email, password) => {
        const { coachEmail, coachPassword } = get();
        if (email.toLowerCase().trim() === coachEmail.toLowerCase().trim() && password === coachPassword) {
          set({ currentUser: { role: 'coach', name: 'Trener' }, currentView: 'board' });
          return true;
        }
        return false;
      },
      loginPlayer: (accountId, pin) => {
        const acc = get().playerAccounts.find(a => a.id === accountId && a.pin === pin);
        if (acc) {
          set({ currentUser: { role: 'player', playerId: acc.playerId, name: acc.name, accountId: acc.id }, currentView: 'player-home' });
          return true;
        }
        return false;
      },
      loginReferee: (pin) => {
        if (pin === get().refereePin) {
          set({ currentUser: { role: 'referee', name: 'Dommer' }, currentView: 'referee' });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null, currentView: 'board' }),

      sport: 'football',
      phases: [makePhase('Fase 1', 'football')],
      activePhaseIdx: 0,

      // football7 maps to football pitch but with youth settings
      setSport: (s) => set({ sport: s }),
      setActivePhaseIdx: (i) => set({ activePhaseIdx: i }),

      addPhase: () => {
        const { phases, activePhaseIdx, sport } = get();
        const cur = phases[activePhaseIdx];
        // football7 uses football pitch
        const pitchSport = sport === 'football7' ? 'football' : sport as Sport;
        const np = makePhase(`Fase ${phases.length + 1}`, pitchSport, cur.players, cur.ball);
        set({ phases: [...phases, np], activePhaseIdx: phases.length });
      },

      removePhase: (idx) => {
        const { phases, activePhaseIdx } = get();
        if (phases.length <= 1) return;
        const newP = phases.filter((_, i) => i !== idx);
        set({ phases: newP, activePhaseIdx: Math.min(activePhaseIdx, newP.length - 1) });
      },

      updatePlayerPosition: (phaseIdx, playerId, pos) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, position: pos } : p),
        })})),

      updateBallPosition: (phaseIdx, pos) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, ball: pos }) })),

      updatePlayerField: (phaseIdx, playerId, fields) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, ...fields } : p),
        })})),

      addDrawing: (phaseIdx, drawing) => {
        const d = { id: uid(), ...drawing };
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, drawings: [...ph.drawings, d],
        })}));
      },

      clearDrawings: (phaseIdx) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, drawings: [] }) })),

      updatePhaseName: (phaseIdx, name) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, name }) })),

      updateStickyNote: (phaseIdx, note) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, stickyNote: note }) })),

      setSpecialRole: (phaseIdx, playerId, role, active) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => {
            if (p.id !== playerId) return p;
            const current = p.specialRoles ?? [];
            const updated = active
              ? current.includes(role) ? current : [...current, role]
              : current.filter(r => r !== role);
            return { ...p, specialRoles: updated };
          }),
        })})),

      setPlayerStarter: (phaseIdx, playerId, isStarter) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, isStarter } : p),
        })})),

      awayTeamColor: '#ef4444',
      setAwayTeamColor: (color) => set({ awayTeamColor: color }),

      setPlayerInjury: (phaseIdx, playerId, injured, returnDate) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? {
            ...p, injured, injuryReturnDate: returnDate,
          } : p),
        })})),

      checkAndHealInjuries: (phaseIdx) => {
        const today = new Date().toISOString().slice(0, 10);
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => {
            if (p.injured && p.injuryReturnDate && p.injuryReturnDate <= today) {
              return { ...p, injured: false, injuryReturnDate: undefined };
            }
            return p;
          }),
        })}));
      },

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

      addMinutesPlayed: (phaseIdx, playerId, minutes) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? {
            ...p, minutesPlayed: (p.minutesPlayed ?? 0) + minutes,
          } : p),
        })})),

      togglePlayerOnField: (phaseIdx, playerId) =>
        set(s => ({ phases: s.phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? {
            ...p, isOnField: !p.isOnField,
          } : p),
        })})),

      getSubstitutionSuggestions: (phaseIdx, intervalMinutes = 10) => {
        const { phases, sport, matchTimer } = get();
        const ph = phases[phaseIdx];
        if (!ph) return [];
        const elapsed = matchTimer.elapsed + (
          matchTimer.running && matchTimer.startedAt
            ? Math.floor((Date.now() - matchTimer.startedAt) / 1000) : 0
        );
        const currentMinute = Math.floor(elapsed / 60);
        const teamSizes: Record<string, number> = { football: 11, football7: 7, handball: 7, floorball: 6 };
        return suggestSubstitutions(ph.players, ph.players.length, teamSizes[sport] ?? 11, currentMinute, intervalMinutes);
      },

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
      addEvent: (ev) => set(s => ({ events: [...s.events, { id: uid(), ...ev }] })),
      updateEvent: (id, fields) => set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...fields } : e) })),
      deleteEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),

      addTrainingNote: (eventId, note) => {
        const n: TrainingNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : { ...e, trainingNotes: [...e.trainingNotes, n] }) }));
      },
      updateTrainingNote: (eventId, noteId, fields) =>
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, trainingNotes: e.trainingNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
        })})),
      deleteTrainingNote: (eventId, noteId) =>
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, trainingNotes: e.trainingNotes.filter(n => n.id !== noteId),
        })})),

      addMatchNote: (eventId, note) => {
        const n: MatchNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : { ...e, matchNotes: [...e.matchNotes, n] }) }));
      },
      updateMatchNote: (eventId, noteId, fields) =>
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, matchNotes: e.matchNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
        })})),
      deleteMatchNote: (eventId, noteId) =>
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, matchNotes: e.matchNotes.filter(n => n.id !== noteId),
        })})),

      playerAccounts: [],
      addPlayerAccount: (acc) => set(s => ({ playerAccounts: [...s.playerAccounts, { id: uid(), ...acc }] })),
      removePlayerAccount: (id) => set(s => ({ playerAccounts: s.playerAccounts.filter(a => a.id !== id) })),
      updatePlayerAccount: (id, fields) =>
        set(s => ({ playerAccounts: s.playerAccounts.map(a => a.id === id ? { ...a, ...fields } : a) })),

      coachMessages: [],
      sendCoachMessage: (playerId, content, eventId) => {
        const msg: CoachMessage = {
          id: uid(), fromCoach: true, playerId, content, eventId,
          createdAt: new Date().toISOString(), replies: [],
        };
        set(s => ({ coachMessages: [...s.coachMessages, msg] }));
      },
      replyToMessage: (messageId, playerId, content) => {
        const reply: PlayerReply = { id: uid(), playerId, content, createdAt: new Date().toISOString() };
        set(s => ({ coachMessages: s.coachMessages.map(m => m.id !== messageId ? m : {
          ...m, replies: [...m.replies, reply],
        })}));
      },
      deleteCoachMessage: (id) =>
        set(s => ({ coachMessages: s.coachMessages.filter(m => m.id !== id) })),

      chatMessages: [],
      sendChat: (fromRole, fromName, content, toPlayerId) => {
        const msg: ChatMessage = {
          id: uid(), fromRole, fromName, content, toPlayerId,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ chatMessages: [...s.chatMessages, msg] }));
      },
    }),
    {
      name: 'taktikkboard-v6',
      partialize: (s) => ({
        sport: s.sport,
        phases: s.phases,
        activePhaseIdx: s.activePhaseIdx,
        events: s.events,
        playerAccounts: s.playerAccounts,
        coachMessages: s.coachMessages,
        chatMessages: s.chatMessages,
        coachEmail: s.coachEmail,
        coachPassword: s.coachPassword,
        refereePin: s.refereePin,
        homeTeamName: s.homeTeamName,
        awayTeamName: s.awayTeamName,
        awayTeamColor: s.awayTeamColor,
        matchReports: s.matchReports,
      }),
    }
  )
);

export const useSafeAppStore = <T,>(selector: (state: AppStore) => T): T | undefined => {
  const result = useAppStore(selector);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  return mounted ? result : undefined;
};