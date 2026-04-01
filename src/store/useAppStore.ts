import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Sport, TacticPhase, CalendarEvent, PlayerAccount,
  CoachMessage, PlayerReply, AppView, Player, Drawing,
  TrainingNote, MatchNote, MatchTimer, MatchReport, ReportTag,
  SubstitutionSuggestion, SpecialRole,
} from '../types';
import { makePhase } from '../data/formations';
import { supabase } from '../lib/supabase';

// ─── Debounced push for drag events ───────────────────────────
let positionPushTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedPushPhases(phases: TacticPhase[]) {
  if (positionPushTimer) clearTimeout(positionPushTimer);
  positionPushTimer = setTimeout(() => pushPhases(phases), 800);
}

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

// ─── Supabase helpers ─────────────────────────────────────────

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
      experience: a.experience ?? null,
      profile_image: a.profileImage ?? null,
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

// ─── Load from Supabase ───────────────────────────────────────

export async function loadFromSupabase(): Promise<Partial<{
  phases: TacticPhase[];
  events: CalendarEvent[];
  playerAccounts: PlayerAccount[];
  coachMessages: CoachMessage[];
  chatMessages: ChatMessage[];
  sport: Sport;
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
        experience: r.experience ?? undefined,
        profileImage: r.profile_image ?? undefined,
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
      }));
    }

    return result;
  } catch (e) {
    console.warn('loadFromSupabase error', e);
    return {};
  }
}

// ─── Realtime subscription ────────────────────────────────────

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

  currentUser: { role: 'coach' | 'player' | 'referee'; playerId?: string; name: string; accountId?: string } | null;
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
  sendChat: (fromRole: 'coach'|'player', fromName: string, content: string, toPlayerId?: string) => void;

  sport: Sport;
  setSport: (s: Sport) => void;
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

  syncFromSupabase: () => Promise<void>;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      loading: false,
      currentView: 'board',
      setView: (v) => set({ currentView: v }),

      currentUser: null,
      coachEmail: 'trener@lag.no',
      coachPassword: 'trener123',
      refereePin: '0000',
      homeTeamName: 'Hjemmelag',
      awayTeamName: 'Bortelag',

      setCoachEmail: (email) => { set({ coachEmail: email }); pushSettings({ coach_email: email }); },
      setCoachPassword: (pw) => { set({ coachPassword: pw }); pushSettings({ coach_password: pw }); },
      setRefereePin: (pin) => { set({ refereePin: pin }); pushSettings({ referee_pin: pin }); },
      setHomeTeamName: (name) => { set({ homeTeamName: name }); pushSettings({ home_team_name: name }); },
      setAwayTeamName: (name) => { set({ awayTeamName: name }); pushSettings({ away_team_name: name }); },

      loginCoach: (email, password) => {
        const state = get();
        console.log('🔐 LoginCoach - Email:', email, 'Password:', password);
        console.log('🔐 Expected:', state.coachEmail, state.coachPassword);
        
        if (email.toLowerCase().trim() === state.coachEmail.toLowerCase().trim() && password === state.coachPassword) {
          set({ 
            currentUser: { role: 'coach', name: 'Trener' }, 
            currentView: 'board' 
          });
          console.log('✅ Coach login SUCCESS');
          return true;
        }
        console.log('❌ Coach login FAILED');
        return false;
      },

      loginPlayer: (emailOrId, passwordOrPin) => {
        const state = get();
        console.log('🔐 LoginPlayer - Email/ID:', emailOrId, 'Password/PIN:', passwordOrPin);
        console.log('🔐 Available players:', state.playerAccounts);
        
        const acc = state.playerAccounts.find(a =>
          (a.id === emailOrId || a.email?.toLowerCase() === emailOrId.toLowerCase()) &&
          (a.password === passwordOrPin || a.pin === passwordOrPin)
        );
        
        if (acc) {
          console.log('✅ Player login SUCCESS:', acc.name);
          set({
            currentUser: { 
              role: 'player', 
              playerId: acc.playerId, 
              name: acc.name, 
              accountId: acc.id 
            },
            currentView: 'player-home',
          });
          return true;
        }
        console.log('❌ Player login FAILED');
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

      setSport: (s) => { set({ sport: s }); pushSettings({ sport: s }); },
      setActivePhaseIdx: (i) => set({ activePhaseIdx: i }),

      addPhase: () => {
        const { phases, activePhaseIdx, sport } = get();
        const cur = phases[activePhaseIdx];
        const pitchSport = (sport === 'football7' ? 'football' : sport) as Sport;
        const np = makePhase(`Fase ${phases.length + 1}`, pitchSport, cur.players, cur.ball);
        const newPhases = [...phases, np];
        set({ phases: newPhases, activePhaseIdx: phases.length });
        pushPhases(newPhases);
      },

      removePhase: (idx) => {
        const { phases, activePhaseIdx } = get();
        if (phases.length <= 1) return;
        const newP = phases.filter((_, i) => i !== idx);
        set({ phases: newP, activePhaseIdx: Math.min(activePhaseIdx, newP.length - 1) });
        pushPhases(newP);
      },

      updatePlayerPosition: (phaseIdx, playerId, pos) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, position: pos } : p),
        });
        set({ phases: newPhases });
        debouncedPushPhases(newPhases);
      },

      updateBallPosition: (phaseIdx, pos) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, ball: pos });
        set({ phases: newPhases });
        debouncedPushPhases(newPhases);
      },

      updatePlayerField: (phaseIdx, playerId, fields) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, ...fields } : p),
        });
        set({ phases: newPhases });
        pushPhases(newPhases);
      },

      addDrawing: (phaseIdx, drawing) => {
        const d = { id: uid(), ...drawing };
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, drawings: [...ph.drawings, d],
        });
        set({ phases: newPhases });
        pushPhases(newPhases);
      },

      clearDrawings: (phaseIdx) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, drawings: [] });
        set({ phases: newPhases });
        pushPhases(newPhases);
      },

      updatePhaseName: (phaseIdx, name) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, name });
        set({ phases: newPhases });
        pushPhases(newPhases);
      },

      updateStickyNote: (phaseIdx, note) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : { ...ph, stickyNote: note });
        set({ phases: newPhases });
        pushPhases(newPhases);
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
        pushPhases(newPhases);
      },

      setPlayerStarter: (phaseIdx, playerId, isStarter) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, isStarter } : p),
        });
        set({ phases: newPhases });
        pushPhases(newPhases);
      },

      awayTeamColor: '#ef4444',
      setAwayTeamColor: (color) => { set({ awayTeamColor: color }); pushSettings({ away_team_color: color }); },

      setPlayerInjury: (phaseIdx, playerId, injured, returnDate) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId
            ? { ...p, injured, injuryReturnDate: returnDate } : p),
        });
        set({ phases: newPhases });
        pushPhases(newPhases);
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
        pushPhases(newPhases);
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
        pushPhases(newPhases);
      },

      togglePlayerOnField: (phaseIdx, playerId) => {
        const newPhases = get().phases.map((ph, i) => i !== phaseIdx ? ph : {
          ...ph, players: ph.players.map(p => p.id === playerId
            ? { ...p, isOnField: !p.isOnField } : p),
        });
        set({ phases: newPhases });
        pushPhases(newPhases);
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
        pushEvents(get().events);
      },
      updateEvent: (id, fields) => {
        set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...fields } : e) }));
        pushEvents(get().events);
      },
      deleteEvent: (id) => {
        set(s => ({ events: s.events.filter(e => e.id !== id) }));
        pushEvents(get().events);
      },
      addTrainingNote: (eventId, note) => {
        const n: TrainingNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e
          : { ...e, trainingNotes: [...e.trainingNotes, n] }) }));
        pushEvents(get().events);
      },
      updateTrainingNote: (eventId, noteId, fields) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, trainingNotes: e.trainingNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
        })}));
        pushEvents(get().events);
      },
      deleteTrainingNote: (eventId, noteId) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, trainingNotes: e.trainingNotes.filter(n => n.id !== noteId),
        })}));
        pushEvents(get().events);
      },
      addMatchNote: (eventId, note) => {
        const n: MatchNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e
          : { ...e, matchNotes: [...e.matchNotes, n] }) }));
        pushEvents(get().events);
      },
      updateMatchNote: (eventId, noteId, fields) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, matchNotes: e.matchNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
        })}));
        pushEvents(get().events);
      },
      deleteMatchNote: (eventId, noteId) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, matchNotes: e.matchNotes.filter(n => n.id !== noteId),
        })}));
        pushEvents(get().events);
      },

      playerAccounts: [],
      addPlayerAccount: (acc) => {
        const newAcc = { id: uid(), ...acc };
        set(s => ({ playerAccounts: [...s.playerAccounts, newAcc] }));
        pushPlayerAccounts(get().playerAccounts);
      },
      removePlayerAccount: (id) => {
        set(s => ({ playerAccounts: s.playerAccounts.filter(a => a.id !== id) }));
        pushPlayerAccounts(get().playerAccounts);
      },
      updatePlayerAccount: (id, fields) => {
        set(s => ({ playerAccounts: s.playerAccounts.map(a => a.id === id ? { ...a, ...fields } : a) }));
        pushPlayerAccounts(get().playerAccounts);
      },

      coachMessages: [],
      sendCoachMessage: (playerId, content, eventId) => {
        const msg: CoachMessage = {
          id: uid(), fromCoach: true, playerId, content, eventId,
          createdAt: new Date().toISOString(), replies: [],
        };
        set(s => ({ coachMessages: [...s.coachMessages, msg] }));
        pushCoachMessages(get().coachMessages);
      },
      replyToMessage: (messageId, playerId, content) => {
        const reply: PlayerReply = { id: uid(), playerId, content, createdAt: new Date().toISOString() };
        set(s => ({ coachMessages: s.coachMessages.map(m => m.id !== messageId ? m : {
          ...m, replies: [...m.replies, reply],
        })}));
        pushCoachMessages(get().coachMessages);
      },
      deleteCoachMessage: (id) => {
        set(s => ({ coachMessages: s.coachMessages.filter(m => m.id !== id) }));
        pushCoachMessages(get().coachMessages);
      },

      chatMessages: [],
      sendChat: async (fromRole, fromName, content, toPlayerId) => {
        const msg: ChatMessage = {
          id: uid(), fromRole, fromName, content, toPlayerId,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ chatMessages: [...s.chatMessages, msg] }));
        try {
          await supabase.from('chat_messages').insert({
            id: msg.id, from_role: fromRole, from_name: fromName,
            content, to_player_id: toPlayerId ?? null,
            created_at: msg.createdAt,
          });
        } catch (e) { console.warn('sendChat error', e); }
      },

      syncFromSupabase: async () => {
        const data = await loadFromSupabase();
        if (Object.keys(data).length > 0) set(data as any);
      },
    }),
    {
      name: 'taktikkboard-v7',
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

export { useAppStore };
export default useAppStore;

export const toBaseSport = (s: Sport): Sport =>
  s === 'football7' ? 'football' : s;