import { Sport, Player, TacticPhase } from '../types';

// ViewBox-dimensjoner (fast SVG-koordinatsystem)
export const VW = 880;
export const VH = 560;

function p(
  id: string, num: number, name: string,
  role: Player['role'], x: number, y: number,
  team: 'home' | 'away'
): Player {
  return { id, num, name, role, position: { x, y }, team, notes: '' };
}

// ─── FORMASJONER ────────────────────────────────────────────────

const FOOTBALL_PLAYERS: Player[] = [
  // Hjemmelag – venstre halvdel (x: 55–420)
  p('h1',  1,  'Keeper',       'keeper',     68,  280, 'home'),
  p('h2',  2,  'Høyreback',    'defender',   185, 118, 'home'),
  p('h3',  3,  'Midtback',     'defender',   185, 218, 'home'),
  p('h4',  4,  'Midtback',     'defender',   185, 342, 'home'),
  p('h5',  5,  'Venstreback',  'defender',   185, 442, 'home'),
  p('h6',  6,  'Def. midtb.',  'midfielder', 288, 280, 'home'),
  p('h7',  7,  'Midtbane H',   'midfielder', 305, 175, 'home'),
  p('h8',  8,  'Midtbane V',   'midfielder', 305, 385, 'home'),
  p('h9',  9,  'Spiss',        'forward',    400, 280, 'home'),
  p('h10', 10, 'Høyrekant',    'winger',     385, 148, 'home'),
  p('h11', 11, 'Venstrekan.',  'winger',     385, 412, 'home'),

  // Bortelag – høyre halvdel (x: 460–810)
  p('a1',  1,  'Keeper',       'keeper',     812, 280, 'away'),
  p('a2',  2,  'Høyreback',    'defender',   695, 118, 'away'),
  p('a3',  3,  'Midtback',     'defender',   695, 218, 'away'),
  p('a4',  4,  'Midtback',     'defender',   695, 342, 'away'),
  p('a5',  5,  'Venstreback',  'defender',   695, 442, 'away'),
  p('a6',  6,  'Def. midtb.',  'midfielder', 592, 280, 'away'),
  p('a7',  7,  'Midtbane H',   'midfielder', 575, 175, 'away'),
  p('a8',  8,  'Midtbane V',   'midfielder', 575, 385, 'away'),
  p('a9',  9,  'Spiss',        'forward',    480, 280, 'away'),
  p('a10', 10, 'Høyrekant',    'winger',     495, 148, 'away'),
  p('a11', 11, 'Venstrekan.',  'winger',     495, 412, 'away'),
];

const HANDBALL_PLAYERS: Player[] = [
  // Hjemmelag
  p('h1', 1, 'Keeper',       'hb_keeper',   62,  280, 'home'),
  p('h2', 2, 'V. fløy',      'hb_wing',     175, 108, 'home'),
  p('h3', 3, 'V. bakspill',  'hb_backcourt',225, 215, 'home'),
  p('h4', 4, 'Midtback',     'hb_center',   268, 280, 'home'),
  p('h5', 5, 'H. bakspill',  'hb_backcourt',225, 345, 'home'),
  p('h6', 6, 'H. fløy',      'hb_wing',     175, 452, 'home'),
  p('h7', 7, 'Pivot',        'hb_pivot',    358, 280, 'home'),

  // Bortelag
  p('a1', 1, 'Keeper',       'hb_keeper',   818, 280, 'away'),
  p('a2', 2, 'V. fløy',      'hb_wing',     705, 108, 'away'),
  p('a3', 3, 'V. bakspill',  'hb_backcourt',655, 215, 'away'),
  p('a4', 4, 'Midtback',     'hb_center',   612, 280, 'away'),
  p('a5', 5, 'H. bakspill',  'hb_backcourt',655, 345, 'away'),
  p('a6', 6, 'H. fløy',      'hb_wing',     705, 452, 'away'),
  p('a7', 7, 'Pivot',        'hb_pivot',    522, 280, 'away'),
];

const FLOORBALL_PLAYERS: Player[] = [
  // Hjemmelag
  p('h1', 1, 'Keeper',     'fb_keeper',    62,  280, 'home'),
  p('h2', 2, 'Back V',     'fb_back',      198, 178, 'home'),
  p('h3', 3, 'Back H',     'fb_back',      198, 382, 'home'),
  p('h4', 4, 'Midtbane',   'fb_midfielder',312, 280, 'home'),
  p('h5', 5, 'Forward V',  'fb_forward',   395, 188, 'home'),
  p('h6', 6, 'Forward H',  'fb_forward',   395, 372, 'home'),

  // Bortelag
  p('a1', 1, 'Keeper',     'fb_keeper',    818, 280, 'away'),
  p('a2', 2, 'Back V',     'fb_back',      682, 178, 'away'),
  p('a3', 3, 'Back H',     'fb_back',      682, 382, 'away'),
  p('a4', 4, 'Midtbane',   'fb_midfielder',568, 280, 'away'),
  p('a5', 5, 'Forward V',  'fb_forward',   485, 188, 'away'),
  p('a6', 6, 'Forward H',  'fb_forward',   485, 372, 'away'),
];

export const SPORT_FORMATIONS: Record<Sport, {
  name: string;
  emoji: string;
  teamSize: number;
  players: Player[];
}> = {
  football:  { name: 'Fotball',   emoji: '⚽', teamSize: 11, players: FOOTBALL_PLAYERS },
  handball:  { name: 'Håndball',  emoji: '🤾', teamSize: 7,  players: HANDBALL_PLAYERS },
  floorball: { name: 'Innebandy', emoji: '🏒', teamSize: 6,  players: FLOORBALL_PLAYERS },
};

// Lag en fersk fase med dype kopier av spillerne
export function makePhase(name: string, sport: Sport, sourcePlayers?: Player[], sourceBall?: { x: number; y: number }): TacticPhase {
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
