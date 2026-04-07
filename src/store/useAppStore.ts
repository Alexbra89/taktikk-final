import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Sport, TacticPhase, CalendarEvent, PlayerAccount,
  CoachMessage, PlayerReply, AppView, Player, Drawing,
  TrainingNote, MatchNote, MatchTimer, MatchReport, ReportTag,
  SubstitutionSuggestion, SpecialRole, PlayerRole,
  TacticMoment
} from '../types';
import { makePhase } from '../data/formations';
import { supabase } from '../lib/supabase';
import { FormationSlot } from '../types';
import {
  initSyncQueue,
  markPhasesDirty,
  markEventsDirty,
  markPlayerAccountsDirty,
  markCoachMessagesDirty,
  markChatMessagesDirty,
  registerSyncCallbacks,
  forceSync
} from './syncQueue';
import { signUp as authSignUp, signIn as authSignIn, signOut as authSignOut, getCurrentUser } from '../lib/auth';

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

// ─── Supabase push-funksjoner (brukes av syncQueue) ──────────
async function pushPhases(phases: TacticPhase[]) {
  try {
    const rows = phases.map((ph, i) => ({
      id: ph.id, name: ph.name, players: ph.players as any,
      ball: ph.ball as any, drawings: ph.drawings as any,
      description: ph.description ?? '', sticky_note: ph.stickyNote ?? '',
      sort_order: i, updated_at: new Date().toISOString(),
    }));
    await supabase.from('phases').upsert(rows, { onConflict: 'id' });
    const { data: existing } = await supabase.from('phases').select('id');
    const currentIds = phases.map(p => p.id);
    const toDelete = (existing ?? []).filter((r: any) => !currentIds.includes(r.id)).map((r: any) => r.id);
    if (toDelete.length) await supabase.from('phases').delete().in('id', toDelete);
  } catch (e) { console.warn('pushPhases error', e); }
}

async function pushSettings(fields: Record<string, any>) {
  try {
    await supabase.from('team_settings').upsert(
      { id: 'default', ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  } catch (e) { console.warn('pushSettings error', e); }
}

async function pushEvents(events: CalendarEvent[]) {
  try {
    const rows = events.map(e => ({
      id: e.id, type: e.type, title: e.title, date: e.date,
      time: e.time ?? null, location: e.location ?? null,
      opponent: e.opponent ?? '', result: e.result ?? '',
      team_note: e.teamNote, training_notes: e.trainingNotes as any,
      match_notes: e.matchNotes as any, lineup_locked_at: e.lineupLockedAt ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) await supabase.from('events').upsert(rows, { onConflict: 'id' });
    const { data: existing } = await supabase.from('events').select('id');
    const currentIds = events.map(e => e.id);
    const toDelete = (existing ?? []).filter((r: any) => !currentIds.includes(r.id)).map((r: any) => r.id);
    if (toDelete.length) await supabase.from('events').delete().in('id', toDelete);
  } catch (e) { console.warn('pushEvents error', e); }
}

async function pushPlayerAccounts(accounts: PlayerAccount[]) {
  try {
    const rows = accounts.map(a => ({
      id: a.id, name: a.name, player_id: a.playerId, pin: a.pin,
      email: a.email ?? null, password: a.password ?? null,
      team: a.team,
      individual_training_note: a.individualTrainingNote ?? null,
      birth_date: a.birthDate ?? null,
      height: a.height ?? null,
      weight: a.weight ?? null,
      position_preferences: a.positionPreferences ?? null,
      secondary_positions: a.secondaryPositions ?? null,
      experience: a.experience ?? null,
      profile_image: a.profileImage ?? null,
      preferred_foot: a.preferredFoot ?? null,
      strong_foot: a.strongFoot ?? null,
      preferred_language: a.preferredLanguage ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) await supabase.from('player_accounts').upsert(rows, { onConflict: 'id' });
    const { data: existing } = await supabase.from('player_accounts').select('id');
    const currentIds = accounts.map(a => a.id);
    const toDelete = (existing ?? []).filter((r: any) => !currentIds.includes(r.id)).map((r: any) => r.id);
    if (toDelete.length) await supabase.from('player_accounts').delete().in('id', toDelete);
  } catch (e) { console.warn('pushPlayerAccounts error', e); }
}

async function pushCoachMessages(msgs: CoachMessage[]) {
  try {
    const rows = msgs.map(m => ({
      id: m.id, player_id: m.playerId, event_id: m.eventId ?? null,
      content: m.content, replies: m.replies as any,
      from_captain: m.fromCaptain ?? false,
      created_at: m.createdAt, updated_at: new Date().toISOString(),
    }));
    if (rows.length) await supabase.from('coach_messages').upsert(rows, { onConflict: 'id' });
    const { data: existing } = await supabase.from('coach_messages').select('id');
    const currentIds = msgs.map(m => m.id);
    const toDelete = (existing ?? []).filter((r: any) => !currentIds.includes(r.id)).map((r: any) => r.id);
    if (toDelete.length) await supabase.from('coach_messages').delete().in('id', toDelete);
  } catch (e) { console.warn('pushCoachMessages error', e); }
}

async function pushChatMessages(msgs: ChatMessage[]) {
  try {
    const rows = msgs.map(m => ({
      id: m.id, from_role: m.fromRole, from_name: m.fromName,
      content: m.content, to_player_id: m.toPlayerId ?? null,
      from_captain: m.fromCaptain ?? false,
      created_at: m.createdAt, updated_at: new Date().toISOString(),
    }));
    if (rows.length) await supabase.from('chat_messages').upsert(rows, { onConflict: 'id' });
  } catch (e) { console.warn('pushChatMessages error', e); }
}

// ─── Load from Supabase (uendret) ─────────────────────────────
export async function loadFromSupabase(): Promise<Partial<{
  phases: TacticPhase[];
  events: CalendarEvent[];
  playerAccounts: PlayerAccount[];
  coachMessages: CoachMessage[];
  chatMessages: ChatMessage[];
  sport: Sport;
  ageGroup: 'youth' | 'adult';
  homeTeamName: string;
  awayTeamName: string;
  awayTeamColor: string;
  coachEmail: string;
  coachPassword: string;
  refereePin: string;
}>> {
  try {
    const [settRes, phRes, evRes, paRes, cmRes, chatRes] = await Promise.all([
      supabase.from('team_settings').select('*').eq('id', 'default').single(),
      supabase.from('phases').select('*').order('sort_order'),
      supabase.from('events').select('*').order('date'),
      supabase.from('player_accounts').select('*'),
      supabase.from('coach_messages').select('*').order('created_at'),
      supabase.from('chat_messages').select('*').order('created_at'),
    ]);

    const result: any = {};

    if (settRes.data) {
      const s = settRes.data;
      result.sport         = s.sport ?? 'football';
      result.ageGroup      = s.age_group ?? 'adult';
      result.homeTeamName  = s.home_team_name;
      result.awayTeamName  = s.away_team_name;
      result.awayTeamColor = s.away_team_color;
      result.coachEmail    = s.coach_email;
      result.coachPassword = s.coach_password;
      result.refereePin    = s.referee_pin;
    }

    if (phRes.data?.length) {
      result.phases = phRes.data.map((r: any): TacticPhase => ({
        id: r.id, name: r.name,
        players: r.players ?? [],
        ball: r.ball ?? { x: 440, y: 280 },
        drawings: r.drawings ?? [],
        description: r.description ?? '',
        stickyNote: r.sticky_note ?? '',
      }));
    }

    if (evRes.data?.length) {
      result.events = evRes.data.map((r: any): CalendarEvent => ({
        id: r.id, type: r.type, title: r.title, date: r.date,
        time: r.time ?? undefined, location: r.location ?? undefined,
        opponent: r.opponent ?? '', result: r.result ?? '',
        teamNote: r.team_note ?? '',
        trainingNotes: r.training_notes ?? [],
        matchNotes: r.match_notes ?? [],
        lineupLockedAt: r.lineup_locked_at ?? undefined,
      }));
    }

    if (paRes.data?.length) {
      result.playerAccounts = paRes.data.map((r: any): PlayerAccount => ({
        id: r.id, name: r.name, playerId: r.player_id,
        pin: r.pin, team: r.team,
        email: r.email ?? undefined,
        password: r.password ?? undefined,
        individualTrainingNote: r.individual_training_note ?? undefined,
        birthDate: r.birth_date ?? undefined,
        height: r.height ?? undefined,
        weight: r.weight ?? undefined,
        positionPreferences: r.position_preferences ?? undefined,
        secondaryPositions: r.secondary_positions ?? undefined,
        experience: r.experience ?? undefined,
        profileImage: r.profile_image ?? undefined,
        preferredFoot: r.preferred_foot ?? undefined,
        strongFoot: r.strong_foot ?? undefined,
        preferredLanguage: r.preferred_language ?? undefined,
      }));
    }

    if (cmRes.data?.length) {
      result.coachMessages = cmRes.data.map((r: any): CoachMessage => ({
        id: r.id, fromCoach: true, playerId: r.player_id,
        eventId: r.event_id ?? undefined, content: r.content,
        createdAt: r.created_at, replies: r.replies ?? [],
        fromCaptain: r.from_captain ?? false,
      }));
    }

    if (chatRes.data?.length) {
      result.chatMessages = chatRes.data.map((r: any): ChatMessage => ({
        id: r.id, fromRole: r.from_role, fromName: r.from_name,
        content: r.content, createdAt: r.created_at,
        toPlayerId: r.to_player_id ?? undefined,
        fromCaptain: r.from_captain ?? false,
      }));
    }

    return result;
  } catch (e) {
    console.warn('loadFromSupabase error', e);
    return {};
  }
}

// ─── Realtime subscription (uendret) ──────────────────────────
export function subscribeToSupabase(onUpdate: () => void) {
  const channel = supabase
    .channel('taktikkboard-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'phases' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'player_accounts' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_messages' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_settings' }, onUpdate)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ═══════════════════════════════════════════════════════════════
//  ZUSTAND STORE
// ═══════════════════════════════════════════════════════════════

interface AppStore {
  loading: boolean;
  currentView: AppView;
  setView: (v: AppView) => void;

  currentUser: { role: 'coach' | 'player' | 'referee'; playerId?: string; name: string; accountId?: string; email?: string } | null;
  
  // Auth actions (nye)
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string, role: 'coach' | 'player') => Promise<boolean>;
  signOut: () => Promise<void>;

  // Beholdes for bakoverkompatibilitet? Fjernes fra UI, men beholdes internt en stund
  loginCoach: (email: string, password: string) => boolean;
  loginPlayer: (emailOrId: string, passwordOrPin: string) => boolean;
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
  addPlayerAccount: (acc: Omit<PlayerAccount, 'id'>) => boolean;
  removePlayerAccount: (id: string) => void;
  updatePlayerAccount: (id: string, fields: Partial<PlayerAccount>) => void;

  coachMessages: CoachMessage[];
  sendCoachMessage: (playerId: string, content: string, eventId?: string, fromCaptain?: boolean) => void;
  replyToMessage: (messageId: string, playerId: string, content: string) => void;
  deleteCoachMessage: (messageId: string) => void;

  syncFromSupabase: () => Promise<void>;

  moments: TacticMoment[];
  saveMoment: (phaseIdx: number, name: string) => void;
  deleteMoment: (id: string) => void;
  applyFormation: (phaseIdx: number, newSlots: FormationSlot[]) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      // ─── Registrer syncQueue callbacks ───────────────────────
      registerSyncCallbacks({
        pushPhases,
        pushEvents,
        pushPlayerAccounts,
        pushCoachMessages,
        pushChatMessages,
      });

      return {
        loading: false,
        currentView: 'board',
        setView: (v) => set({ currentView: v }),

        currentUser: null,
        coachEmail: 'trener@lag.no',
        coachPassword: 'trener123',
        refereePin: '0000',
        homeTeamName: 'Hjemmelag',
        awayTeamName: 'Bortelag',

        // ─── Nye auth actions ──────────────────────────────────
        signUp: async (email, password) => {
          try {
            const user = await authSignUp(email, password);
            if (!user) return false;
            // Opprett standard coach-innstillinger
            set({
              coachEmail: email,
              coachPassword: password,
              currentUser: { role: 'coach', name: email.split('@')[0], email },
              currentView: 'board',
            });
            pushSettings({ coach_email: email, coach_password: password });
            return true;
          } catch (error) {
            console.warn('SignUp failed', error);
            return false;
          }
        },

        signIn: async (email, password, role) => {
          try {
            const user = await authSignIn(email, password);
            if (!user) return false;
            // Finn spiller-konto hvis player
            let playerAccount: PlayerAccount | undefined;
            if (role === 'player') {
              playerAccount = get().playerAccounts.find(a => a.email?.toLowerCase() === email.toLowerCase());
            }
            set({
              currentUser: {
                role,
                name: playerAccount?.name || email.split('@')[0],
                playerId: playerAccount?.playerId,
                accountId: playerAccount?.id,
                email: user.email,
              },
              currentView: role === 'coach' ? 'board' : 'player-home',
            });
            return true;
          } catch (error) {
            console.warn('SignIn failed', error);
            return false;
          }
        },

        signOut: async () => {
          try {
            await authSignOut();
            set({ currentUser: null, currentView: 'board' });
          } catch (error) {
            console.warn('SignOut failed', error);
          }
        },

        // ─── Behold gamle login-metoder (kan fases ut senere) ──
        loginCoach: (email, password) => {
          const state = get();
          if (email.toLowerCase().trim() === state.coachEmail.toLowerCase().trim() && password === state.coachPassword) {
            set({ currentUser: { role: 'coach', name: 'Trener' }, currentView: 'board' });
            return true;
          }
          return false;
        },

        loginPlayer: (emailOrId, passwordOrPin) => {
          const state = get();
          const acc = state.playerAccounts.find(a =>
            (a.id === emailOrId || a.email?.toLowerCase() === emailOrId.toLowerCase()) &&
            (a.password === passwordOrPin || a.pin === passwordOrPin)
          );
          if (acc) {
            set({
              currentUser: { role: 'player', playerId: acc.playerId, name: acc.name, accountId: acc.id },
              currentView: 'player-home',
            });
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

        setCoachEmail: (email) => { set({ coachEmail: email }); pushSettings({ coach_email: email }); },
        setCoachPassword: (pw) => { set({ coachPassword: pw }); pushSettings({ coach_password: pw }); },
        setRefereePin: (pin) => { set({ refereePin: pin }); pushSettings({ referee_pin: pin }); },
        setHomeTeamName: (name) => { set({ homeTeamName: name }); pushSettings({ home_team_name: name }); },
        setAwayTeamName: (name) => { set({ awayTeamName: name }); pushSettings({ away_team_name: name }); },

        chatMessages: [],
        sendChat: (fromRole, fromName, content, toPlayerId, fromCaptain) => {
          const msg: ChatMessage = {
            id: uid(), fromRole, fromName, content,
            createdAt: new Date().toISOString(), toPlayerId, fromCaptain
          };
          set(s => ({ chatMessages: [...s.chatMessages, msg] }));
          markChatMessagesDirty();
        },

        sport: 'football',
        ageGroup: 'adult',
        phases: [makePhase('Fase 1', 'football')],
        activePhaseIdx: 0,
        moments: [],

        setSport: (s) => { set({ sport: s }); pushSettings({ sport: s }); },
        setAgeGroup: (age) => { set({ ageGroup: age }); pushSettings({ age_group: age }); },
        setActivePhaseIdx: (i) => set({ activePhaseIdx: i }),

        addPhase: () => {
          const { phases, activePhaseIdx, sport } = get();
          const cur = phases[activePhaseIdx];
          const pitchSport = (sport === 'football7' ? 'football' : sport) as Sport;
          const np = makePhase(`Fase ${phases.length + 1}`, pitchSport, cur.players, cur.ball);
          const newPhases = [...phases, np];
          set({ phases: newPhases, activePhaseIdx: phases.length });
          markPhasesDirty();
        },

        removePhase: (idx) => {
          const { phases, activePhaseIdx } = get();
          if (phases.length <= 1) return;
          const newP = phases.filter((_, i) => i !== idx);
          set({ phases: newP, activePhaseIdx: Math.min(activePhaseIdx, newP.length - 1) });
          markPhasesDirty();
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
          markPhasesDirty();
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
            // Bruk markPhasesDirty uten debounce; syncQueue tar seg av batching
            markPhasesDirty();
            return { phases: newPhases };
          });
        },

        updateBallPosition: (phaseIdx, pos) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, ball: pos });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        updatePlayerField: (phaseIdx, playerId, fields) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, ...fields } : p),
          });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        addDrawing: (phaseIdx, drawing) => {
          const d = { id: uid(), ...drawing };
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, drawings: [...ph.drawings, d],
          });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        clearDrawings: (phaseIdx) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, drawings: [] });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        updatePhaseName: (phaseIdx, name) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, name });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        updateStickyNote: (phaseIdx, note) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, stickyNote: note });
          set({ phases: newPhases });
          markPhasesDirty();
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
          markPhasesDirty();
        },

        setSecondaryRoles: (phaseIdx, playerId, roles) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => 
              p.id === playerId ? { ...p, secondaryRoles: roles } : p
            ),
          });
          set({ phases: newPhases });
          markPhasesDirty();
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
          markPhasesDirty();
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
          markPhasesDirty();
        },

        setPlayerStarter: (phaseIdx, playerId, isStarter) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, isStarter } : p),
          });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        awayTeamColor: '#ef4444',
        setAwayTeamColor: (color) => { set({ awayTeamColor: color }); pushSettings({ away_team_color: color }); },

        setPlayerInjury: (phaseIdx, playerId, injured, returnDate) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId
              ? { ...p, injured, injuryReturnDate: returnDate } : p),
          });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        checkAndHealInjuries: (phaseIdx) => {
          const today = new Date().toISOString().slice(0, 10);
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => {
              if (p.injured && p.injuryReturnDate && p.injuryReturnDate <= today)
                return { ...p, injured: false, injuryReturnDate: undefined };
              return p;
            }),
          });
          set({ phases: newPhases });
          markPhasesDirty();
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

        addMinutesPlayed: (phaseIdx, playerId, minutes) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId
              ? { ...p, minutesPlayed: (p.minutesPlayed ?? 0) + minutes } : p),
          });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        togglePlayerOnField: (phaseIdx, playerId) => {
          const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
            ...ph, players: ph.players.map(p => p.id === playerId
              ? { ...p, isOnField: !p.isOnField } : p),
          });
          set({ phases: newPhases });
          markPhasesDirty();
        },

        getSubstitutionSuggestions: (phaseIdx, intervalMinutes = 10) => {
          const { phases, sport, matchTimer } = get();
          const ph = phases[phaseIdx];
          if (!ph) return [];
          const elapsed = matchTimer.elapsed + (
            matchTimer.running && matchTimer.startedAt
              ? Math.floor((Date.now() - matchTimer.startedAt) / 1000) : 0
          );
          const teamSizes: Record<string, number> = { football: 11, football7: 7, handball: 7 };
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
          markEventsDirty();
        },
        updateEvent: (id, fields) => {
          set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...fields } : e) }));
          markEventsDirty();
        },
        deleteEvent: (id) => {
          set(s => ({ events: s.events.filter(e => e.id !== id) }));
          markEventsDirty();
        },
        addTrainingNote: (eventId, note) => {
          const n: TrainingNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e
            : { ...e, trainingNotes: [...e.trainingNotes, n] }) }));
          markEventsDirty();
        },
        updateTrainingNote: (eventId, noteId, fields) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, trainingNotes: e.trainingNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
          })}));
          markEventsDirty();
        },
        deleteTrainingNote: (eventId, noteId) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, trainingNotes: e.trainingNotes.filter(n => n.id !== noteId),
          })}));
          markEventsDirty();
        },
        addMatchNote: (eventId, note) => {
          const n: MatchNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e
            : { ...e, matchNotes: [...e.matchNotes, n] }) }));
          markEventsDirty();
        },
        updateMatchNote: (eventId, noteId, fields) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, matchNotes: e.matchNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
          })}));
          markEventsDirty();
        },
        deleteMatchNote: (eventId, noteId) => {
          set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
            ...e, matchNotes: e.matchNotes.filter(n => n.id !== noteId),
          })}));
          markEventsDirty();
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
          markPlayerAccountsDirty();
          return true;
        },
        removePlayerAccount: (id) => {
          set(s => ({ playerAccounts: s.playerAccounts.filter(a => a.id !== id) }));
          markPlayerAccountsDirty();
        },
        updatePlayerAccount: (id, fields) => {
          set(s => ({ playerAccounts: s.playerAccounts.map(a => a.id === id ? { ...a, ...fields } : a) }));
          markPlayerAccountsDirty();
        },

        coachMessages: [],
        sendCoachMessage: (playerId, content, eventId, fromCaptain = false) => {
          const msg: CoachMessage = {
            id: uid(), fromCoach: true, playerId, content, eventId,
            createdAt: new Date().toISOString(), replies: [], fromCaptain,
          };
          set(s => ({ coachMessages: [...s.coachMessages, msg] }));
          markCoachMessagesDirty();
        },
        replyToMessage: (messageId, playerId, content) => {
          const reply: PlayerReply = { id: uid(), playerId, content, createdAt: new Date().toISOString() };
          set(s => ({ coachMessages: s.coachMessages.map(m => m.id !== messageId ? m : {
            ...m, replies: [...m.replies, reply],
          })}));
          markCoachMessagesDirty();
        },
        deleteCoachMessage: (messageId) => {
          set(s => ({ coachMessages: s.coachMessages.filter(m => m.id !== messageId) }));
          markCoachMessagesDirty();
        },

        syncFromSupabase: async () => {
          set({ loading: true });
          try {
            const data = await loadFromSupabase();
            set(state => ({ ...state, ...data, loading: false }));
            // Initialiser syncQueue med getState-funksjon
            initSyncQueue(() => get());
          } catch (error) {
            console.error('Sync failed:', error);
            set({ loading: false });
          }
        }
      };
    },
    {
      name: 'taktikkboard-storage',
      partialize: (state) => ({
        moments: state.moments,
        currentView: state.currentView,
        sport: state.sport,
        ageGroup: state.ageGroup,
        homeTeamName: state.homeTeamName,
        awayTeamName: state.awayTeamName,
        awayTeamColor: state.awayTeamColor,
        coachEmail: state.coachEmail,
        coachPassword: state.coachPassword,
        refereePin: state.refereePin,
      })
    }
  )
);