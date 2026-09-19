// ═══════════════════════════════════════════════════════════════
//  TAKTIKKBOARD – Type-definisjoner (v6) – FM PRO EDITION
// ═══════════════════════════════════════════════════════════════

export type Sport = 'football' | 'football5' | 'football7' | 'football9';

export type PlayerRole =
  | 'keeper' | 'defender' | 'midfielder' | 'forward'
  | 'winger' | 'false9' | 'playmaker'
  | 'sweeper' | 'wingback' | 'box2box' | 'trequartista' | 'targetman';

export interface Position { x: number; y: number; }

// Rollen lagres ikke på spilleren. Den utledes fra tactic.formation + slotIdx
// (se getSlot i store/selectors.ts), slik at rolle og formasjon aldri kommer ut av synk.
export interface Player {
  id: string;
  num: number;
  name: string;          // valgfritt visningsnavn, tom streng som standard
  slotIdx: number;       // indeks i formasjonens homePlayers[]
  position: Position;
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
  stickyNote?: string;
}

export interface Tactic {
  id: string;
  name: string;              // «Høyt press», «Kontring»
  sport: Sport;
  formation: string;         // «4-4-2», må finnes i getFormations(sport)
  phases: TacticPhase[];     // minst én
  activePhaseIdx: number;
  createdAt: string;
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
  tactics: Tactic[];         // minst én
  activeTacticId: string;
  // globale innstillinger
  ageGroup: 'youth' | 'adult';   // standardfilter i øvelsesbiblioteket
  homeTeamName: string;
  awayTeamName: string;
  awayTeamColor: string;
  rosterNames: string[];         // bare for fremmøte
  // øvrig
  events: CalendarEvent[];
  matchReports: MatchReport[];
  moments: TacticMoment[];
  currentView: AppView;
}

// ═══════════════════════════════════════════════════════════════
//  TAKTISKE MOMENTER
// ═══════════════════════════════════════════════════════════════

export interface TacticMoment {
  id: string;
  name: string;
  timestamp: string;
  tacticId?: string;
  snapshot: TacticPhase;
}