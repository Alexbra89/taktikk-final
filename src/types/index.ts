// ═══════════════════════════════════════════════════════════════
//  TAKTIKKBOARD – Type-definisjoner (v4)
// ═══════════════════════════════════════════════════════════════

export type Sport = 'football' | 'handball' | 'floorball';

export type PlayerRole =
  | 'keeper' | 'defender' | 'midfielder' | 'forward'
  | 'winger' | 'false9' | 'libero' | 'playmaker'
  | 'sweeper' | 'wingback' | 'box2box' | 'trequartista' | 'targetman' | 'pressforward'
  | 'hb_keeper' | 'hb_pivot' | 'hb_backcourt' | 'hb_wing' | 'hb_center' | 'hb_playmaker'
  | 'fb_keeper' | 'fb_back' | 'fb_forward' | 'fb_midfielder';

export type UserRole = 'coach' | 'player' | 'referee';

export interface Position { x: number; y: number; }

// Spesialrolle på banen
export type SpecialRole =
  | 'captain'           // kaptein
  | 'freekick'          // frispark
  | 'penalty'           // straffe
  | 'corner'            // corner
  | 'throwin'           // innkast
  | 'goalkeeper_kicks'; // keeperutspark (håndball/innebandy)

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
  // Nye felt v4
  isStarter?: boolean;           // true = starter, false = innbytter
  specialRoles?: SpecialRole[];  // kaptein, frispark etc.
  individualTraining?: string;   // notat om individuell trening
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
  // Laguttak låst 30 min før kamp
  lineupLockedAt?: string; // ISO timestamp
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
  // Individuelle treningsnotater synlige kun for denne spilleren
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
  // Kan også sendes fra kaptein
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
  weekNumber?: number; // roteres ukentlig
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

export type AppView = 'board' | 'calendar' | 'players' | 'referee' | 'player-home';

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