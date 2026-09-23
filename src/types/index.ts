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

export type DrawingType =
  | 'freehand' | 'arrow' | 'curved-arrow' | 'dashed'
  | 'circle' | 'rectangle' | 'label';

interface DrawingBase {
  id: string;
  color: string;
}

/** Streker som følger punkter. Uten type = frihånd: slik er alle tegninger fra før verktøyene kom. */
export interface PathDrawing extends DrawingBase {
  type?: 'freehand' | 'arrow' | 'curved-arrow' | 'dashed';
  // frihånd: alle punkter · pil og stiplet: [start, slutt] · buet pil: [start, kontrollpunkt, slutt]
  pts: Position[];
}

export interface ShapeDrawing extends DrawingBase {
  type: 'circle' | 'rectangle';
  start: Position;   // sirkel: sentrum · rektangel: ett hjørne
  end: Position;     // sirkel: punkt på radien · rektangel: motsatt hjørne
}

export interface LabelDrawing extends DrawingBase {
  type: 'label';
  at: Position;      // midtpunktet til teksten
  text: string;
}

export type Drawing = PathDrawing | ShapeDrawing | LabelDrawing;
/** En tegning før storen har gitt den id. */
export type NewDrawing = Omit<PathDrawing, 'id'> | Omit<ShapeDrawing, 'id'> | Omit<LabelDrawing, 'id'>;

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
  /** Minutter. Mangler på eldre notater; de regnes som 5. 0 = uten tid. */
  duration?: number;
  completed?: boolean;
  /**
   * Satt når punktet er en taktikk fra brettet. Navnet ligger i title, så
   * punktet står igjen som notat om taktikken senere slettes.
   */
  tacticId?: string;
}

export interface MatchNote {
  id: string;
  createdAt: string;
  half: 1 | 2 | 3;
  title: string;
  content: string;
}

export type DrillCategory = 'keeper' | 'forsvar' | 'midtbane' | 'angrep' | 'cardio' | 'styrke';

export type DrillDifficulty = 'enkel' | 'middels' | 'avansert';

export type DrillAgeBand = '6-7' | '8-9' | '10-12' | '13-16' | '17+';

export interface DrillStep {
  id: string;
  name: string;
  description: string;
}

export interface DrillExercise {
  id: string;
  name: string;
  category: DrillCategory;
  ageGroup: 'youth' | 'adult';
  ageBand: DrillAgeBand[];
  difficulty: DrillDifficulty;
  duration: number;
  players: string;
  description: string;
  why: string;
  steps: DrillStep[];
  coachingPoints: string[];
  commonMistakes: string[];
  variations: string[];
  equipment: string[];
  source?: string;
  background?: string;
  unverifiedSource?: string;
  sketch?: string;
  warning?: string;
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

export type AppView = 'board' | 'drills' | 'calendar' | 'training';

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