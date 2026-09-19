// ═══════════════════════════════════════════════════════════════
//  TAKTIKKBOARD – Type-definisjoner (v6) – FM PRO EDITION
// ═══════════════════════════════════════════════════════════════

export type Sport = 'football' | 'football5' | 'football7' | 'football9';

export type PlayerRole =
  | 'keeper' | 'defender' | 'midfielder' | 'forward'
  | 'winger' | 'false9' | 'libero' | 'playmaker'
  | 'sweeper' | 'wingback' | 'box2box' | 'trequartista' | 'targetman' | 'pressforward';

export interface Position { x: number; y: number; }

export interface Player {
  id: string;
  num: number;
  name: string;
  role: PlayerRole;
  position: Position;
  team: 'home' | 'away';
  notes: string;
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
  attendance?: string[]; // navn fra rosterNames som møtte (kun treninger)
}

export interface TrainingNote {
  id: string;
  createdAt: string;
  title: string;
  content: string;
  focus: string[];
}

export interface MatchNote {
  id: string;
  createdAt: string;
  half: 1 | 2 | 3;
  title: string;
  content: string;
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

export type AppView = 'dashboard' | 'board' | 'calendar' | 'training';

export interface AppState {
  sport: Sport;
  ageGroup: 'youth' | 'adult';
  phases: TacticPhase[];
  activePhaseIdx: number;
  events: CalendarEvent[];
  rosterNames: string[];
  currentView: AppView;
}

// ═══════════════════════════════════════════════════════════════
//  TAKTISKE MOMENTER
// ═══════════════════════════════════════════════════════════════

export interface TacticMoment {
  id: string;
  name: string;
  timestamp: string;
  snapshot: TacticPhase;
}