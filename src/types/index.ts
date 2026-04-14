// ═══════════════════════════════════════════════════════════════
//  TAKTIKKBOARD – Type-definisjoner (v6) – FM PRO EDITION
// ═══════════════════════════════════════════════════════════════

export type Sport = 'football' | 'football7' | 'football9' | 'handball';

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
  secondaryRoles?: PlayerRole[]; // NYTT: sekundære posisjoner
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
  currentSlotId?: string;  // ← LEGG TIL DENNE
  playerAccountId?: string; // ✅ Knytter spilleren til en PlayerAccount
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
  sort_order?: number;
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
  email?: string;
  password?: string;
  team: 'home' | 'away';
  individualTrainingNote?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  positionPreferences?: string; // Primær posisjon
  secondaryPositions?: string;  // NYTT: sekundære posisjoner (komma-separert)
  experience?: string;
  profileImage?: string;
  preferredFoot?: string;
  strongFoot?: string;
  preferredLanguage?: string;
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

export interface ChatMessage {
  id: string;
  fromRole: 'coach' | 'player';
  fromName: string;      // ← riktig navn (matcher storen)
  content: string;
  createdAt: string;
  toPlayerId?: string;
  fromCaptain?: boolean; // valgfritt, men finnes i storen
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

export type AppView = 'dashboard' | 'board' | 'calendar' | 'players' | 'stats' | 'admin' | 'training' | 'referee' | 'player-home' | 'messages';

export interface AppState {
  sport: Sport;
  ageGroup: 'youth' | 'adult';
  phases: TacticPhase[];
  activePhaseIdx: number;
  events: CalendarEvent[];
  playerAccounts: PlayerAccount[];
  coachMessages: CoachMessage[];
  currentView: AppView;
  currentUser: { role: UserRole; playerId?: string; name: string; accountId?: string } | null;
}

// ═══════════════════════════════════════════════════════════════
//  FM PRO TILLEGG – FORMASJONSSLOT & TAKTISKE MOMENTER
// ═══════════════════════════════════════════════════════════════

export interface FormationSlot {
  id: string;
  x: number;
  y: number;
  role: PlayerRole;
}

export interface TacticMoment {
  id: string;
  name: string;
  timestamp: string;
  snapshot: TacticPhase;
}