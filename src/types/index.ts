// ═══════════════════════════════════════════════════════════════
//  TAKTIKKBOARD – Type-definisjoner (v5)
// ═══════════════════════════════════════════════════════════════

export type Sport = 'football' | 'football7' | 'handball';

export type PlayerRole =
  | 'keeper' | 'defender' | 'midfielder' | 'forward'
  | 'winger' | 'false9' | 'libero' | 'playmaker'
  | 'sweeper' | 'wingback' | 'box2box' | 'trequartista' | 'targetman' | 'pressforward'
  | 'hb_keeper' | 'hb_pivot' | 'hb_backcourt' | 'hb_wing' | 'hb_center' | 'hb_playmaker';

export type UserRole = 'coach' | 'player' | 'referee';

export interface Position { x: number; y: number; }

export type SpecialRole =
  | 'captain'
  | 'freekick'
  | 'penalty'
  | 'corner'
  | 'throwin'
  | 'goalkeeper_kicks';

export interface Player {
  id: string;
  num: number;
  name: string;
  role: PlayerRole;
  position: Position;
  team: 'home' | 'away';
  notes: string;
  playerReply?: string;
  injured?: boolean;
  injuryReturnDate?: string;
  minutesPlayed?: number;
  isOnField?: boolean;
  isStarter?: boolean;
  specialRoles?: SpecialRole[];
  individualTraining?: string;
}

export interface Drawing {
  id: string;
  pts: Position[];
  color: string;
  label?: string;
}

export interface TacticPhase {
  id: string;
  name: string;
  players: Player[];
  ball: Position;
  drawings: Drawing[];
  description?: string;
  stickyNote?: string;
}

export type EventType = 'training' | 'match';

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  time?: string;
  location?: string;
  opponent?: string;
  result?: string;
  teamNote: string;
  trainingNotes: TrainingNote[];
  matchNotes: MatchNote[];
  lineupLockedAt?: string;
}

export interface TrainingNote {
  id: string;
  createdAt: string;
  title: string;
  content: string;
  focus: string[];
  targetPlayerIds: string[];
}

export interface MatchNote {
  id: string;
  createdAt: string;
  half: 1 | 2 | 3;
  title: string;
  content: string;
  targetPlayerIds: string[];
}

export interface PlayerAccount {
  id: string;
  name: string;
  playerId: string;
  pin: string;
  team: 'home' | 'away';
  individualTrainingNote?: string;
}

export interface CoachMessage {
  id: string;
  fromCoach: true;
  playerId: string;
  eventId?: string;
  content: string;
  createdAt: string;
  replies: PlayerReply[];
  fromCaptain?: boolean;
}

export interface PlayerReply {
  id: string;
  playerId: string;
  content: string;
  createdAt: string;
}

export interface DrillStep {
  id: string;
  name: string;
  description: string;
}

export interface Drill {
  id: string;
  name: string;
  ageGroup: 'youth' | 'adult';
  sport: Sport | 'all';
  description: string;
  steps: DrillStep[];
  weekNumber?: number;
}

export interface SubstitutionSuggestion {
  outPlayerId: string;
  inPlayerId: string;
  atMinute: number;
  reason: string;
}

export interface MatchTimer {
  running: boolean;
  startedAt: number | null;
  elapsed: number;
}

export type ReportTag =
  | 'god_gjennomforing' | 'manglet_konsentrasjon'
  | 'god_pressing' | 'svak_forsvarsstilling'
  | 'fin_pasningsspill' | 'mange_balltap'
  | 'god_kommunikasjon' | 'manglet_tempo'
  | 'sterk_defensiv' | 'misset_sjanser';

export interface MatchReport {
  id: string;
  eventId?: string;
  matchTitle?: string;
  createdAt: string;
  tags: ReportTag[];
  freeText: string;
  generatedText: string;
}

export type AppView = 'board' | 'calendar' | 'players' | 'stats' | 'referee' | 'player-home';

export interface AppState {
  sport: Sport;
  phases: TacticPhase[];
  activePhaseIdx: number;
  events: CalendarEvent[];
  playerAccounts: PlayerAccount[];
  coachMessages: CoachMessage[];
  currentView: AppView;
  currentUser: { role: UserRole; playerId?: string; name: string } | null;
}