import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Sport, TacticPhase, CalendarEvent, PlayerAccount,
  CoachMessage, PlayerReply, AppView, Player, Drawing,
  TrainingNote, MatchNote, MatchTimer, MatchReport, ReportTag,
  SubstitutionSuggestion, SpecialRole, PlayerRole,
  TacticMoment
} from '../types';
import { makePhase, getSquadCapacity } from '../data/formations';
import { FormationSlot } from '../types';
import { safeStorage } from '../lib/safeStorage';

// ─── Types for ChatMessage (beholdes) ────────────────────────
interface ChatMessage {
  id: string;
  fromRole: 'coach' | 'player';
  fromName: string;
  content: string;
  createdAt: string;
  toPlayerId?: string;
  fromCaptain?: boolean;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export interface NewPlayerResult {
  success: boolean;
  reason?: 'squad_full' | 'duplicate_email' | 'no_active_phase';
  assignedNum?: number;
  numberWasTaken?: boolean;
}

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

function suggestSubstitutions(
  players: Player[], totalPlayers: number, teamSize: number,
  currentMinute: number, intervalMinutes = 10,
): SubstitutionSuggestion[] {
  if (totalPlayers <= teamSize) return [];
  const bench = players.filter(p => !p.isOnField);
  const field = players.filter(p => p.isOnField);
  if (!bench.length || !field.length) return [];
  const sortedField = [...field].sort((a, b) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0));
  const sortedBench = [...bench].sort((a, b) => (a.minutesPlayed ?? 0) - (b.minutesPlayed ?? 0));
  const slots = Math.min(sortedField.length, sortedBench.length, 3);
  return Array.from({ length: slots }, (_, i) => ({
    outPlayerId: sortedField[i].id,
    inPlayerId:  sortedBench[i].id,
    atMinute:    currentMinute + intervalMinutes * (i + 1),
    reason:      `${sortedField[i].name || '#' + sortedField[i].num} har spilt ${sortedField[i].minutesPlayed ?? 0} min`,
  }));
}

// ═══════════════════════════════════════════════════════════════
//  ZUSTAND STORE
// ═══════════════════════════════════════════════════════════════

interface AppStore {
  currentView: AppView;
  setView: (v: AppView) => void;

  // Midlertidig: ingen innlogging, brukeren er alltid trener. Fjernes i C3 sammen med isCoach-sjekkene.
  currentUser: { role: 'coach'; playerId?: string; name: string; accountId?: string } | null;

  homeTeamName: string;
  awayTeamName: string;
  setHomeTeamName: (name: string) => void;
  setAwayTeamName: (name: string) => void;

  chatMessages: ChatMessage[];
  sendChat: (fromRole: 'coach'|'player', fromName: string, content: string, toPlayerId?: string, fromCaptain?: boolean) => void;

  sport: Sport;
  ageGroup: 'youth' | 'adult';
  setSport: (s: Sport) => void;
  setAgeGroup: (age: 'youth' | 'adult') => void;
  
  phases: TacticPhase[];
  activePhaseIdx: number;
  setActivePhaseIdx: (i: number) => void;
  addPhase: () => void;
  removePhase: (idx: number) => void;
  updatePlayerPosition: (phaseIdx: number, playerId: string, pos: { x: number; y: number }, slotId?: string) => void;
  updateBallPosition: (phaseIdx: number, pos: { x: number; y: number }) => void;
  updatePlayerField: (phaseIdx: number, playerId: string, fields: Partial<Player>) => void;
  addPlayer: (phaseIdx: number, player: Player) => void; // <-- NY
  updatePlayersInPhase: (phaseIdx: number, updates: Array<{ playerId: string; fields: Partial<Player> }>) => void;
  reorderBenchPlayers: (phaseIdx: number, fromIndex: number, toIndex: number) => void;
  addDrawing: (phaseIdx: number, drawing: Omit<Drawing, 'id'>) => void;
  clearDrawings: (phaseIdx: number) => void;
  updatePhaseName: (phaseIdx: number, name: string) => void;
  updateStickyNote: (phaseIdx: number, note: string) => void;
  setSpecialRole: (phaseIdx: number, playerId: string, role: SpecialRole, active: boolean) => void;
  setSecondaryRoles: (phaseIdx: number, playerId: string, roles: PlayerRole[]) => void;
  addSecondaryRole: (phaseIdx: number, playerId: string, role: PlayerRole) => void;
  removeSecondaryRole: (phaseIdx: number, playerId: string, role: PlayerRole) => void;
  awayTeamColor: string;
  setAwayTeamColor: (color: string) => void;
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
  addPlayerAccount: (acc: Omit<PlayerAccount, 'id'>) => boolean;
  removePlayerAccount: (id: string) => void;
  updatePlayerAccount: (id: string, fields: Partial<PlayerAccount>) => void;
  addPlayerWithAccount: (input: {
    name: string; email: string; password: string; role: PlayerRole; num?: number;
  }) => NewPlayerResult;
  seedTestSquad: () => { added: number };

  coachMessages: CoachMessage[];
  sendCoachMessage: (playerId: string, content: string, eventId?: string, fromCaptain?: boolean) => void;
  replyToMessage: (messageId: string, playerId: string, content: string) => void;
  deleteCoachMessage: (messageId: string) => void;

  moments: TacticMoment[];
  saveMoment: (phaseIdx: number, name: string) => void;
  deleteMoment: (id: string) => void;
  applyFormation: (phaseIdx: number, newSlots: FormationSlot[]) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      return {
        currentView: 'board',
        setView: (v) => set({ currentView: v }),

        // Midlertidig: ingen innlogging, brukeren er alltid trener. Fjernes i C3.
        currentUser: { role: 'coach', name: 'Trener' },
        homeTeamName: 'Hjemmelag',
        awayTeamName: 'Bortelag',

        setHomeTeamName: (name) => set({ homeTeamName: name }),
        setAwayTeamName: (name) => set({ awayTeamName: name }),

        chatMessages: [],
        sendChat: (fromRole, fromName, content, toPlayerId, fromCaptain) => {
          const msg: ChatMessage = {
            id: uid(), fromRole, fromName, content,
            createdAt: new Date().toISOString(), toPlayerId, fromCaptain
          };
          set(s => ({ chatMessages: [...s.chatMessages, msg] }));
        },

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

        applyFormation: (phaseIdx, newSlots) => {
          const { phases } = get();
          const phase = phases[phaseIdx];
          if (!phase) return;

          const onField = phase.players.filter(p => p.isOnField);
          const bench = phase.players.filter(p => !p.isOnField);

          const updatedOnField = onField.map((player, index) => {
            let bestSlot = newSlots.find(s => 
              s.role === player.role && !onField.slice(0, index).some(p => p.currentSlotId === s.id)
            );
            if (!bestSlot) {
              bestSlot = newSlots.find(s => !onField.slice(0, index).some(p => p.currentSlotId === s.id));
            }
            return {
              ...player,
              currentSlotId: bestSlot?.id,
              position: bestSlot ? { x: bestSlot.x, y: bestSlot.y } : player.position
            };
          });

          const newPhases = [...phases];
          newPhases[phaseIdx] = {
            ...phase,
            players: [...updatedOnField, ...bench]
          };

          set({ phases: newPhases });
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

        updatePlayerPosition: (phaseIdx, playerId, pos, slotId) => {
          set((state) => {
            const newPhases = [...state.phases];
            newPhases[phaseIdx] = {
              ...newPhases[phaseIdx],
              players: newPhases[phaseIdx].players.map(p => 
                p.id === playerId ? { ...p, position: pos, currentSlotId: slotId ?? p.currentSlotId } : p
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

        reorderBenchPlayers: (phaseIdx, fromIndex, toIndex) => {
          set(state => {
            const newPhases = [...state.phases];
            const phase = newPhases[phaseIdx];
            if (!phase) return state;
            const benchPlayers = phase.players.filter(p => p.team === 'home' && p.isStarter !== true);
            if (fromIndex < 0 || fromIndex >= benchPlayers.length || toIndex < 0 || toIndex >= benchPlayers.length) return state;
            const fromPlayer = benchPlayers[fromIndex];
            const toPlayer = benchPlayers[toIndex];
            if (!fromPlayer || !toPlayer) return state;
            const playersCopy = [...phase.players];
            const fromGlobalIdx = playersCopy.findIndex(p => p.id === fromPlayer.id);
            const toGlobalIdx = playersCopy.findIndex(p => p.id === toPlayer.id);
            if (fromGlobalIdx === -1 || toGlobalIdx === -1) return state;
            [playersCopy[fromGlobalIdx], playersCopy[toGlobalIdx]] = [playersCopy[toGlobalIdx], playersCopy[fromGlobalIdx]];
            newPhases[phaseIdx] = { ...phase, players: playersCopy };
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

        setSpecialRole: (phaseIdx, playerId, role, active) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => {
              if (p.id !== playerId) return p;
              const current = p.specialRoles ?? [];
              const updated = active
                ? current.includes(role) ? current : [...current, role]
                : current.filter(r => r !== role);
              return { ...p, specialRoles: updated };
            }),
          });
          set({ phases: newPhases });
        },

        setSecondaryRoles: (phaseIdx, playerId, roles) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => 
              p.id === playerId ? { ...p, secondaryRoles: roles } : p
            ),
          });
          set({ phases: newPhases });
        },

        addSecondaryRole: (phaseIdx, playerId, role) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => {
              if (p.id !== playerId) return p;
              const current = p.secondaryRoles ?? [];
              if (current.includes(role)) return p;
              return { ...p, secondaryRoles: [...current, role] };
            }),
          });
          set({ phases: newPhases });
        },

        removeSecondaryRole: (phaseIdx, playerId, role) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => {
              if (p.id !== playerId) return p;
              const current = p.secondaryRoles ?? [];
              return { ...p, secondaryRoles: current.filter(r => r !== role) };
            }),
          });
          set({ phases: newPhases });
        },

        setPlayerStarter: (phaseIdx, playerId, isStarter) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, isStarter } : p),
          });
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

        addMinutesPlayed: (phaseIdx, playerId, minutes) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId
              ? { ...p, minutesPlayed: (p.minutesPlayed ?? 0) + minutes } : p),
          });
          set({ phases: newPhases });
        },

        togglePlayerOnField: (phaseIdx, playerId) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId
              ? { ...p, isOnField: !p.isOnField } : p),
          });
          set({ phases: newPhases });
        },

        getSubstitutionSuggestions: (phaseIdx, intervalMinutes = 10) => {
          const { phases, sport, matchTimer } = get();
          const ph = phases[phaseIdx];
          if (!ph) return [];
          const elapsed = matchTimer.elapsed + (
            matchTimer.running && matchTimer.startedAt
              ? Math.floor((Date.now() - matchTimer.startedAt) / 1000) : 0
          );
          const teamSizes: Record<string, number> = { football: 11, football5: 5, football7: 7, football9: 9 };
          return suggestSubstitutions(
            ph.players, ph.players.length,
            teamSizes[sport] ?? 11,
            Math.floor(elapsed / 60),
            intervalMinutes
          );
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

        playerAccounts: [],
        addPlayerAccount: (acc) => {
          const existingEmail = get().playerAccounts.find(a =>
            acc.email && a.email?.toLowerCase() === acc.email.toLowerCase()
          );
          if (existingEmail) {
            console.warn('E-post allerede i bruk');
            return false;
          }
          const newAcc = {
            id: uid(),
            ...acc,
            password: acc.password || acc.pin,
          };
          set(s => ({ playerAccounts: [...s.playerAccounts, newAcc] }));
          return true;
        },
        removePlayerAccount: (id) => {
          const acc = get().playerAccounts.find(a => a.id === id);
          set(s => ({
            playerAccounts: s.playerAccounts.filter(a => a.id !== id),
            phases: acc
              ? s.phases.map(ph => ({ ...ph, players: ph.players.filter(p => p.id !== acc.playerId) }))
              : s.phases,
          }));
        },
        updatePlayerAccount: (id, fields) => {
          set(s => ({ playerAccounts: s.playerAccounts.map(a => a.id === id ? { ...a, ...fields } : a) }));
        },

        // Oppretter en spillerkonto OG en tilhørende spiller på
        // taktikkbrettet i samme steg, slik at PlayerManager aldri kan
        // lage en "foreldreløs" konto med en playerId som ikke finnes i
        // noen fase (dette var årsaken til at nye spillere ikke dukket
        // opp på brettet/benken). Legges alltid til på benken i aktiv
        // fase, med ledig draktnummer og rolle valgt av treneren.
        addPlayerWithAccount: (input) => {
          const state = get();
          const phaseIdx = state.activePhaseIdx;
          const phase = state.phases[phaseIdx];
          if (!phase) return { success: false, reason: 'no_active_phase' };

          const existingEmail = state.playerAccounts.find(a =>
            input.email && a.email?.toLowerCase() === input.email.toLowerCase()
          );
          if (existingEmail) return { success: false, reason: 'duplicate_email' };

          const homePlayers = phase.players.filter(p => p.team === 'home');
          const { total: capacity } = getSquadCapacity(state.sport);
          if (homePlayers.length >= capacity) return { success: false, reason: 'squad_full' };

          const takenNums = new Set(homePlayers.map(p => p.num));
          const requestedNum = input.num;
          const numberWasTaken = !!requestedNum && takenNums.has(requestedNum);
          let assignedNum = requestedNum && !numberWasTaken ? requestedNum : 1;
          while (takenNums.has(assignedNum)) assignedNum++;

          const playerId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const newPlayer: Player = {
            id: playerId,
            num: assignedNum,
            name: input.name,
            role: input.role,
            position: { x: 120, y: 120 + (homePlayers.length % 8) * 40 },
            team: 'home',
            notes: '',
            isStarter: false,
            isOnField: false,
            minutesPlayed: 0,
            specialRoles: [],
          };

          get().addPlayer(phaseIdx, newPlayer);
          const accountCreated = get().addPlayerAccount({
            name: input.name,
            email: input.email,
            password: input.password,
            pin: '',
            playerId,
            team: 'home',
          });
          if (!accountCreated) return { success: false, reason: 'duplicate_email' };

          return { success: true, assignedNum, numberWasTaken };
        },

        // Fyller opp stallen med testspillere for utvikling/testing –
        // oppretter BÅDE en phase.players-oppføring OG en PlayerAccount
        // per spiller (via addPlayerWithAccount), slik at de dukker opp
        // både på taktikkbrettet og i Spillerstall-visningen. Navngis
        // tydelig som testdata og fyller opp til én ledig plass i stallen.
        seedTestSquad: () => {
          const state = get();
          const phase = state.phases[state.activePhaseIdx];
          if (!phase) return { added: 0 };

          const { teamSize, maxSubs } = getSquadCapacity(state.sport);
          const targetSquadSize = teamSize + maxSubs - 1; // behold én ledig plass
          const currentCount = phase.players.filter(p => p.team === 'home').length;
          const needed = Math.max(0, targetSquadSize - currentCount);
          if (needed === 0) return { added: 0 };

          const TEST_NAMES = [
            'Ola Nordmann', 'Kari Hansen', 'Per Olsen', 'Lise Berg', 'Morten Dahl',
            'Ingrid Haug', 'Anders Vik', 'Marte Solberg', 'Erik Nygård', 'Silje Aas',
            'Knut Moe', 'Anne Bakken', 'Jonas Strand', 'Hedda Lie', 'Svein Rud',
            'Live Iversen', 'Geir Sandvik', 'Tuva Eide', 'Vidar Skog', 'Frida Fjeld',
          ];
          const TEST_ROLES: PlayerRole[] = ['keeper', 'defender', 'midfielder', 'forward'];

          const existingTestNums = state.playerAccounts
            .map(a => /^test(\d+)@testil\.local$/i.exec(a.email ?? ''))
            .filter((m): m is RegExpExecArray => !!m)
            .map(m => parseInt(m[1], 10));
          let emailCounter = existingTestNums.length ? Math.max(...existingTestNums) + 1 : 1;

          let added = 0;
          for (let i = 0; i < needed; i++) {
            const result = get().addPlayerWithAccount({
              name: `TEST: ${TEST_NAMES[i % TEST_NAMES.length]}`,
              email: `test${emailCounter}@testil.local`,
              password: 'test1234',
              role: TEST_ROLES[i % TEST_ROLES.length],
            });
            if (!result.success) break; // stallen er full e.l. – stopp der
            added++;
            emailCounter++;
          }
          return { added };
        },

        coachMessages: [],
        sendCoachMessage: (playerId, content, eventId, fromCaptain = false) => {
          const msg: CoachMessage = {
            id: uid(), fromCoach: true, playerId, content, eventId,
            createdAt: new Date().toISOString(), replies: [], fromCaptain,
          };
          set(s => ({ coachMessages: [...s.coachMessages, msg] }));
        },
        replyToMessage: (messageId, playerId, content) => {
          const reply: PlayerReply = { id: uid(), playerId, content, createdAt: new Date().toISOString() };
          set(s => ({ coachMessages: s.coachMessages.map(m => m.id !== messageId ? m : {
            ...m, replies: [...m.replies, reply],
          })}));
        },
        deleteCoachMessage: (messageId) => {
          set(s => ({ coachMessages: s.coachMessages.filter(m => m.id !== messageId) }));
        },

      };
    },
    {
      name: 'taktikkboard-storage',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
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
