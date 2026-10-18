// Definerer det uendrede offentlige store-grensesnittet og interne slice-typer.
import type { StateCreator } from 'zustand';
import type { Sport, Tactic, CalendarEvent, AppView, Position, NewDrawing, BoardItemType, TrainingNote, MatchNote, MatchTimer, MatchReport, ReportTag, TacticMoment, DrillExercise } from '../types';
import type { TacticTemplate } from '../data/tacticTemplates';

export interface AppStore {
  customDrills: DrillExercise[];
  saveCustomDrill: (drill: DrillExercise) => DrillExercise;
  deleteCustomDrill: (id: string) => void;
  currentView: AppView;
  setView: (v: AppView) => void;

  homeTeamName: string;
  awayTeamName: string;
  awayTeamColor: string;
  setHomeTeamName: (name: string) => void;
  setAwayTeamName: (name: string) => void;
  setAwayTeamColor: (color: string) => void;

  ageGroup: 'youth' | 'adult';
  setAgeGroup: (age: 'youth' | 'adult') => void;

  // ─── Taktikker ───────────────────────────────────────────
  tactics: Tactic[];
  activeTacticId: string;
  /** Ny taktikk med standardformasjonen – eller tom bane uten spillere (empty). */
  addTactic: (name?: string, opts?: { empty?: boolean }) => void;
  /** Ny taktikk fra en mal: malens sport, formasjon og faser, med nye id-er. */
  addTacticFromTemplate: (template: TacticTemplate) => void;
  removeTactic: (id: string) => void;
  renameTactic: (id: string, name: string) => void;
  setActiveTactic: (id: string) => void;

  // ─── Virker alltid på aktiv taktikk ──────────────────────
  setFormation: (name: string) => void;
  setSport: (sport: Sport) => void;

  setActivePhaseIdx: (i: number) => void;
  addPhase: () => void;
  removePhase: (idx: number) => void;
  renamePhase: (idx: number, name: string) => void;
  // Spiller-, ball- og tegneendringer treffer aktiv fase.
  movePlayer: (playerId: string, pos: Position) => void;
  moveBall: (pos: Position) => void;
  // Navn og draktnummer tilhører spilleren, ikke fasen: gjelder alle faser i taktikken.
  setPlayerName: (playerId: string, name: string) => void;
  setPlayerNum: (playerId: string, num: number) => void;
  addDrawing: (drawing: NewDrawing) => void;
  /**
   * Nytt utstyr legges i aktiv fase og alle fasene etter, med samme id –
   * en kjegle står der gjennom resten av taktikken, og flyttes den i en
   * senere fase, glir den dit. Returnerer id-en, så brettet kan markere det.
   */
  addItem: (type: BoardItemType) => string;
  /**
   * Flytter i aktiv fase og i fasene etter der elementet står likt – ikke
   * der det er flyttet for seg. Tidligere faser røres ikke.
   */
  moveItem: (itemId: string, pos: Position) => void;
  /** Rotasjon i grader, normalisert til 0–359. Følger med framover som moveItem. */
  rotateItem: (itemId: string, deg: number) => void;
  /** Sletter i aktiv fase og alle fasene etter; tidligere faser beholder det. */
  removeItem: (itemId: string) => void;
  removeLastDrawing: () => void;
  clearDrawings: () => void;
  // phaseIdx er valgfri fordi kallet er debouncet og fasen kan ha byttet før det utføres.
  updateStickyNote: (note: string, phaseIdx?: number) => void;

  matchTimer: MatchTimer;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

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
  /** Flytter et punkt ett steg opp (-1) eller ned (1) i treningens liste. */
  moveTrainingNote: (eventId: string, noteId: string, dir: -1 | 1) => void;
  addMatchNote: (eventId: string, note: Omit<MatchNote, 'id' | 'createdAt'>) => void;
  updateMatchNote: (eventId: string, noteId: string, fields: Partial<MatchNote>) => void;
  deleteMatchNote: (eventId: string, noteId: string) => void;

  // Navneliste brukt kun til fremmøte på treninger – ingen kontoer eller profiler.
  rosterNames: string[];
  setRosterNames: (names: string[]) => void;

  moments: TacticMoment[];
  saveMoment: (name: string) => void;
  deleteMoment: (id: string) => void;

  // ─── Visning ───────────────────────────────────────────────
  /** «Vis bevegelse»: stiplet linje fra spillerens posisjon i forrige fase. */
  showMovement: boolean;
  setShowMovement: (on: boolean) => void;

  // ─── Backup ────────────────────────────────────────────────
  /** Når brukeren sist lastet ned en backup. ISO-streng, null hvis aldri. */
  lastExportedAt: string | null;
  /** Lagrede brukerdata og innstillinger, uten enhetens eksporttidspunkt. */
  exportSnapshot: () => Record<string, unknown>;
  markExported: () => void;
  /** Kontrollerer hele kopien før dataene erstattes i én samlet endring. */
  importSnapshot: (data: unknown) => void;
}

export type AppSlice<K extends keyof AppStore> = StateCreator<AppStore, [], [], Pick<AppStore, K>>;
