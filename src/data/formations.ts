import { Sport, Player, TacticPhase } from '../types';

export const VW = 880;
export const VH = 560;

function p(
  id: string, num: number, name: string,
  role: Player['role'], x: number, y: number,
  team: 'home' | 'away'
): Player {
  return { id, num, name, role, position: { x, y }, team, notes: '' };
}

// ─── FOTBALL 11er - ULIKE FORMASJONER ─────────────────────────

// 4-3-3 (standard)
const FOOTBALL_433_HOME: Player[] = [
  p('h1',  1,  'Keeper',      'keeper',     68,  280, 'home'),
  p('h2',  2,  'Høyreback',   'defender',   185, 118, 'home'),
  p('h3',  3,  'Midtback',    'defender',   185, 218, 'home'),
  p('h4',  4,  'Midtback',    'defender',   185, 342, 'home'),
  p('h5',  5,  'Venstreback', 'defender',   185, 442, 'home'),
  p('h6',  6,  'Def. midtb.', 'midfielder', 288, 280, 'home'),
  p('h7',  7,  'Midtbane H',  'midfielder', 305, 175, 'home'),
  p('h8',  8,  'Midtbane V',  'midfielder', 305, 385, 'home'),
  p('h9',  9,  'Spiss',       'forward',    400, 280, 'home'),
  p('h10', 10, 'Høyrekant',   'winger',     385, 148, 'home'),
  p('h11', 11, 'Venstrekant', 'winger',     385, 412, 'home'),
];

// 4-4-2
const FOOTBALL_442_HOME: Player[] = [
  p('h1',  1,  'Keeper',      'keeper',     68,  280, 'home'),
  p('h2',  2,  'Høyreback',   'defender',   185, 118, 'home'),
  p('h3',  3,  'Midtback',    'defender',   185, 218, 'home'),
  p('h4',  4,  'Midtback',    'defender',   185, 342, 'home'),
  p('h5',  5,  'Venstreback', 'defender',   185, 442, 'home'),
  p('h6',  6,  'Høyre midt',  'midfielder', 288, 175, 'home'),
  p('h7',  7,  'Sentral midt', 'midfielder', 288, 280, 'home'),
  p('h8',  8,  'Sentral midt', 'midfielder', 288, 385, 'home'),
  p('h9',  9,  'Venstre midt', 'midfielder', 305, 490, 'home'),
  p('h10', 10, 'Spiss',       'forward',    400, 218, 'home'),
  p('h11', 11, 'Spiss',       'forward',    400, 342, 'home'),
];

// 3-5-2
const FOOTBALL_352_HOME: Player[] = [
  p('h1',  1,  'Keeper',      'keeper',     68,  280, 'home'),
  p('h2',  2,  'Midtstopper', 'defender',   185, 148, 'home'),
  p('h3',  3,  'Midtstopper', 'defender',   185, 280, 'home'),
  p('h4',  4,  'Midtstopper', 'defender',   185, 412, 'home'),
  p('h5',  5,  'Vingback V',  'wingback',   268, 442, 'home'),
  p('h6',  6,  'Vingback H',  'wingback',   268, 118, 'home'),
  p('h7',  7,  'Sentral midt', 'midfielder', 345, 215, 'home'),
  p('h8',  8,  'Sentral midt', 'midfielder', 345, 345, 'home'),
  p('h9',  9,  'Playmaker',   'playmaker',  345, 280, 'home'),
  p('h10', 10, 'Spiss',       'forward',    450, 218, 'home'),
  p('h11', 11, 'Spiss',       'forward',    450, 342, 'home'),
];

// 5-3-2
const FOOTBALL_532_HOME: Player[] = [
  p('h1',  1,  'Keeper',      'keeper',     68,  280, 'home'),
  p('h2',  2,  'Høyreback',   'defender',   185, 118, 'home'),
  p('h3',  3,  'Midtstopper', 'defender',   185, 215, 'home'),
  p('h4',  4,  'Midtstopper', 'defender',   185, 280, 'home'),
  p('h5',  5,  'Midtstopper', 'defender',   185, 345, 'home'),
  p('h6',  6,  'Venstreback', 'defender',   185, 442, 'home'),
  p('h7',  7,  'Sentral midt', 'midfielder', 305, 215, 'home'),
  p('h8',  8,  'Sentral midt', 'midfielder', 305, 345, 'home'),
  p('h9',  9,  'Playmaker',   'playmaker',  325, 280, 'home'),
  p('h10', 10, 'Spiss',       'forward',    420, 218, 'home'),
  p('h11', 11, 'Spiss',       'forward',    420, 342, 'home'),
];

// 4-2-3-1
const FOOTBALL_4231_HOME: Player[] = [
  p('h1',  1,  'Keeper',      'keeper',     68,  280, 'home'),
  p('h2',  2,  'Høyreback',   'defender',   185, 118, 'home'),
  p('h3',  3,  'Midtstopper', 'defender',   185, 215, 'home'),
  p('h4',  4,  'Midtstopper', 'defender',   185, 345, 'home'),
  p('h5',  5,  'Venstreback', 'defender',   185, 442, 'home'),
  p('h6',  6,  'Def. midt',   'midfielder', 288, 218, 'home'),
  p('h7',  7,  'Def. midt',   'midfielder', 288, 342, 'home'),
  p('h8',  8,  'Høyre kant',  'winger',     345, 118, 'home'),
  p('h9',  9,  'Playmaker',   'playmaker',  345, 280, 'home'),
  p('h10', 10, 'Venstre kant', 'winger',    345, 442, 'home'),
  p('h11', 11, 'Spiss',       'forward',    450, 280, 'home'),
];

// ─── FOTBALL 7er - FORMASJONER ───────────────────────────────

// 3-2-1 (standard)
const FOOTBALL7_321_HOME: Player[] = [
  p('h1', 1, 'Keeper',      'keeper',     68,  280, 'home'),
  p('h2', 2,  'Back V',     'defender',   190, 178, 'home'),
  p('h3', 3,  'Back M',     'defender',   190, 280, 'home'),
  p('h4', 4,  'Back H',     'defender',   190, 382, 'home'),
  p('h5', 5,  'Midtbane V', 'midfielder', 300, 215, 'home'),
  p('h6', 6,  'Midtbane H', 'midfielder', 300, 345, 'home'),
  p('h7', 7,  'Spiss',      'forward',    400, 280, 'home'),
];

// 2-3-1
const FOOTBALL7_231_HOME: Player[] = [
  p('h1', 1, 'Keeper',      'keeper',     68,  280, 'home'),
  p('h2', 2,  'Back V',     'defender',   190, 215, 'home'),
  p('h3', 3,  'Back H',     'defender',   190, 345, 'home'),
  p('h4', 4,  'Midtbane V', 'midfielder', 300, 148, 'home'),
  p('h5', 5,  'Midtbane M', 'midfielder', 300, 280, 'home'),
  p('h6', 6,  'Midtbane H', 'midfielder', 300, 412, 'home'),
  p('h7', 7,  'Spiss',      'forward',    400, 280, 'home'),
];

// 2-2-2
const FOOTBALL7_222_HOME: Player[] = [
  p('h1', 1, 'Keeper',      'keeper',     68,  280, 'home'),
  p('h2', 2,  'Back V',     'defender',   190, 215, 'home'),
  p('h3', 3,  'Back H',     'defender',   190, 345, 'home'),
  p('h4', 4,  'Midtbane V', 'midfielder', 300, 175, 'home'),
  p('h5', 5,  'Midtbane H', 'midfielder', 300, 385, 'home'),
  p('h6', 6,  'Spiss V',    'forward',    400, 215, 'home'),
  p('h7', 7,  'Spiss H',    'forward',    400, 345, 'home'),
];

// ─── HÅNDBALL - FORMASJONER ───────────────────────────────────

// 6-0 (standard)
const HANDBALL_60_HOME: Player[] = [
  p('h1', 1, 'Keeper',       'hb_keeper',    62,  280, 'home'),
  p('h2', 2, 'V. fløy',      'hb_wing',      175, 108, 'home'),
  p('h3', 3, 'V. bakspill',  'hb_backcourt', 225, 215, 'home'),
  p('h4', 4, 'Midtback',     'hb_center',    268, 280, 'home'),
  p('h5', 5, 'H. bakspill',  'hb_backcourt', 225, 345, 'home'),
  p('h6', 6, 'H. fløy',      'hb_wing',      175, 452, 'home'),
  p('h7', 7, 'Pivot',        'hb_pivot',     358, 280, 'home'),
];

// 5-1
const HANDBALL_51_HOME: Player[] = [
  p('h1', 1, 'Keeper',       'hb_keeper',    62,  280, 'home'),
  p('h2', 2, 'V. fløy',      'hb_wing',      175, 108, 'home'),
  p('h3', 3, 'V. bakspill',  'hb_backcourt', 225, 215, 'home'),
  p('h4', 4, 'Midtback',     'hb_center',    268, 280, 'home'),
  p('h5', 5, 'H. bakspill',  'hb_backcourt', 225, 345, 'home'),
  p('h6', 6, 'H. fløy',      'hb_wing',      175, 452, 'home'),
  p('h7', 7, 'Spiss',        'hb_center',    358, 280, 'home'),
];

// 3-2-1 (håndball)
const HANDBALL_321_HOME: Player[] = [
  p('h1', 1, 'Keeper',       'hb_keeper',    62,  280, 'home'),
  p('h2', 2, 'V. bakspill',  'hb_backcourt', 185, 148, 'home'),
  p('h3', 3, 'Midtback',     'hb_center',    225, 280, 'home'),
  p('h4', 4, 'H. bakspill',  'hb_backcourt', 185, 412, 'home'),
  p('h5', 5, 'V. fløy',      'hb_wing',      280, 108, 'home'),
  p('h6', 6, 'H. fløy',      'hb_wing',      280, 452, 'home'),
  p('h7', 7, 'Pivot',        'hb_pivot',     340, 280, 'home'),
];

// ─── BORTELAG-POSISJONER (speilvendt) ─────────────────────────

function mirrorPlayers(players: Player[], team: 'away'): Player[] {
  return players.map(p => ({
    ...p,
    team,
    position: { x: VW - p.position.x, y: p.position.y },
  }));
}

// ─── FORMASJONSKONFIGURASJON ─────────────────────────────────

export interface Formation {
  name: string;
  emoji: string;
  homePlayers: Player[];
  awayPlayers: Player[];
}

// Fotball 11er formasjoner
export const FOOTBALL_FORMATIONS: Formation[] = [
  { name: '4-3-3', emoji: '⚽', homePlayers: FOOTBALL_433_HOME, awayPlayers: mirrorPlayers(FOOTBALL_433_HOME, 'away') },
  { name: '4-4-2', emoji: '⚽', homePlayers: FOOTBALL_442_HOME, awayPlayers: mirrorPlayers(FOOTBALL_442_HOME, 'away') },
  { name: '3-5-2', emoji: '⚽', homePlayers: FOOTBALL_352_HOME, awayPlayers: mirrorPlayers(FOOTBALL_352_HOME, 'away') },
  { name: '5-3-2', emoji: '⚽', homePlayers: FOOTBALL_532_HOME, awayPlayers: mirrorPlayers(FOOTBALL_532_HOME, 'away') },
  { name: '4-2-3-1', emoji: '⚽', homePlayers: FOOTBALL_4231_HOME, awayPlayers: mirrorPlayers(FOOTBALL_4231_HOME, 'away') },
];

// Fotball 7er formasjoner
export const FOOTBALL7_FORMATIONS: Formation[] = [
  { name: '3-2-1', emoji: '⚽', homePlayers: FOOTBALL7_321_HOME, awayPlayers: mirrorPlayers(FOOTBALL7_321_HOME, 'away') },
  { name: '2-3-1', emoji: '⚽', homePlayers: FOOTBALL7_231_HOME, awayPlayers: mirrorPlayers(FOOTBALL7_231_HOME, 'away') },
  { name: '2-2-2', emoji: '⚽', homePlayers: FOOTBALL7_222_HOME, awayPlayers: mirrorPlayers(FOOTBALL7_222_HOME, 'away') },
];

// Håndball formasjoner
export const HANDBALL_FORMATIONS: Formation[] = [
  { name: '6-0', emoji: '🤾', homePlayers: HANDBALL_60_HOME, awayPlayers: mirrorPlayers(HANDBALL_60_HOME, 'away') },
  { name: '5-1', emoji: '🤾', homePlayers: HANDBALL_51_HOME, awayPlayers: mirrorPlayers(HANDBALL_51_HOME, 'away') },
  { name: '3-2-1', emoji: '🤾', homePlayers: HANDBALL_321_HOME, awayPlayers: mirrorPlayers(HANDBALL_321_HOME, 'away') },
];

// Hent formasjoner basert på sport
export function getFormations(sport: Sport): Formation[] {
  if (sport === 'handball') return HANDBALL_FORMATIONS;
  if (sport === 'football7') return FOOTBALL7_FORMATIONS;
  return FOOTBALL_FORMATIONS;
}

// Hent posisjoner for en formasjon
export function getFormationPositions(formationName: string, sport: Sport): { x: number; y: number }[] {
  const formations = getFormations(sport);
  const formation = formations.find(f => f.name === formationName);
  if (!formation) return [];
  
  return formation.homePlayers.map(p => ({ x: p.position.x, y: p.position.y }));
}

// Standard formasjon per sport
export const DEFAULT_FORMATION: Record<Sport, string> = {
  football: '4-3-3',
  football7: '3-2-1',
  handball: '6-0',
};

// ─── SPORT-FORMASJONER (for bakoverkompatibilitet) ───────────

export const SPORT_FORMATIONS: Record<Sport, {
  name: string;
  emoji: string;
  teamSize: number;
  players: Player[];
}> = {
  football:  { name: 'Fotball 11er', emoji: '⚽', teamSize: 11, players: FOOTBALL_433_HOME },
  football7: { name: 'Fotball 7er',  emoji: '⚽', teamSize: 7,  players: FOOTBALL7_321_HOME },
  handball:  { name: 'Håndball',     emoji: '🤾', teamSize: 7,  players: HANDBALL_60_HOME },
};

export function makePhase(
  name: string,
  sport: Sport,
  sourcePlayers?: Player[],
  sourceBall?: { x: number; y: number },
): TacticPhase {
  const base = SPORT_FORMATIONS[sport];
  return {
    id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    players: (sourcePlayers ?? base.players).map(pl => ({
      ...pl,
      position: { ...pl.position },
    })),
    ball: sourceBall ? { ...sourceBall } : { x: VW / 2, y: VH / 2 },
    drawings: [],
    description: '',
  };
}