// src/data/formations.ts
// LANDSCAPE PITCH: W=880 (left=own goal, right=opponent goal), H=560 (top/bottom=sidelines)

import { TacticPhase, Player, Position, PlayerRole } from '../types';

export const VW = 880;
export const VH = 560;

// ──────────────────────────────────────────────────────────────
//  FELLES POSISJONER (basert på relative koordinater)
// ──────────────────────────────────────────────────────────────
// Alle posisjoner er sentrert rundt midtlinjen (y=280)
// Fotball 11er / 9er / 7er

const POS = {
  // Keeper
  GK:  { x: 92,  y: 280 },

  // Forsvar 4-back
  LB:  { x: 162, y: 100 },
  LCB: { x: 162, y: 200 },
  CB:  { x: 162, y: 280 },
  RCB: { x: 162, y: 360 },
  RB:  { x: 162, y: 460 },

  // Forsvar 3-back / vingback
  LWB: { x: 220, y: 90 },
  RWB: { x: 220, y: 470 },

  // Defensiv midtbane
  CDM: { x: 260, y: 280 },

  // Midtbane (sentral)
  LCM: { x: 380, y: 190 },
  CM:  { x: 420, y: 280 },
  RCM: { x: 380, y: 370 },

  // Midtbane (vid)
  LM:  { x: 420, y: 100 },
  RM:  { x: 420, y: 460 },

  // Offensiv midtbane
  CAM: { x: 560, y: 280 },

  // Angrep
  LW:  { x: 680, y: 120 },
  ST:  { x: 750, y: 280 },
  RW:  { x: 680, y: 440 },
  LS:  { x: 740, y: 190 },
  RS:  { x: 740, y: 370 },

  // 7er fotball
  CM7L: { x: 360, y: 160 },
  CM7R: { x: 360, y: 400 },
  ST7:  { x: 720, y: 280 },
};

// ──────────────────────────────────────────────────────────────
//  HÅNDBALL POSISJONER (tilpasset 40x20m bane i landscape)
// ──────────────────────────────────────────────────────────────
// Håndball: keeper på x=92, feltspillere fra x=180 til x=700

const POS_HB = {
  GK:  { x: 92,  y: 280 },           // Keeper

  // Midtbacker (forsvarsrekke)
  CB_L: { x: 200, y: 140 },          // Venstre midtback
  CB_C: { x: 200, y: 280 },          // Senter midtback
  CB_R: { x: 200, y: 420 },          // Høyre midtback

  // Backer (bredde)
  LB:   { x: 260, y: 80 },           // Venstre back
  RB:   { x: 260, y: 480 },          // Høyre back

  // Playmaker / sentral
  PM:   { x: 360, y: 280 },          // Playmaker

  // Kantspillere
  LW:   { x: 520, y: 120 },          // Venstre kant
  RW:   { x: 520, y: 440 },          // Høyre kant

  // Pivot
  PIV:  { x: 640, y: 280 },          // Pivot (sentral spiss)

  // Ekstra offensiv
  ST:   { x: 700, y: 280 },          // Spiss (alternativ)
};

// ──────────────────────────────────────────────────────────────
//  FORMASJONSTYPER
// ──────────────────────────────────────────────────────────────

export interface Formation {
  name: string;
  description: string;
  homePlayers: { role: string; position: Position }[];
}

// ═══ 11er FOTBALL FORMASJONER ═════════════════════════════════

export const FORMATIONS_11ER: Formation[] = [
  {
    name: '4-3-3',
    description: 'Offensiv fotball med tre spisser. Gir gode muligheter for gjennombrudd og press høyt i banen.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LB },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.RCB },
      { role: 'defender',   position: POS.RB },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.CM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'winger',     position: POS.LW },
      { role: 'forward',    position: POS.ST },
      { role: 'winger',     position: POS.RW },
    ],
  },
  {
    name: '4-4-2',
    description: 'Klassisk, balansert formasjon. Bra for forsvarsspill og raske overganger via kantene.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LB },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.RCB },
      { role: 'defender',   position: POS.RB },
      { role: 'midfielder', position: POS.LM },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'midfielder', position: POS.RM },
      { role: 'forward',    position: POS.LS },
      { role: 'forward',    position: POS.RS },
    ],
  },
  {
    name: '4-2-3-1',
    description: 'Solid defensiv struktur med to defensive midtbanespillere.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LB },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.RCB },
      { role: 'defender',   position: POS.RB },
      { role: 'midfielder', position: { x: 270, y: 210 } },
      { role: 'midfielder', position: { x: 270, y: 350 } },
      { role: 'midfielder', position: POS.LM },
      { role: 'playmaker',  position: POS.CAM },
      { role: 'midfielder', position: POS.RM },
      { role: 'forward',    position: POS.ST },
    ],
  },
  {
    name: '3-5-2',
    description: 'Sentral midtbanekontroll med vingbacker som dekker bredden.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.CB },
      { role: 'defender',   position: POS.RCB },
      { role: 'wingback',   position: POS.LWB },
      { role: 'wingback',   position: POS.RWB },
      { role: 'midfielder', position: POS.CDM },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'forward',    position: POS.LS },
      { role: 'forward',    position: POS.RS },
    ],
  },
  {
    name: '5-3-2',
    description: 'Defensiv solid formasjon med fem backer. Bra for kontringer.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LB },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.CB },
      { role: 'defender',   position: POS.RCB },
      { role: 'defender',   position: POS.RB },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.CM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'forward',    position: POS.LS },
      { role: 'forward',    position: POS.RS },
    ],
  },
  {
    name: '3-4-3',
    description: 'Offensivt og presshøyt. Bra for lag som vil dominere.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.CB },
      { role: 'defender',   position: POS.RCB },
      { role: 'midfielder', position: POS.LM },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'midfielder', position: POS.RM },
      { role: 'winger',     position: POS.LW },
      { role: 'forward',    position: POS.ST },
      { role: 'winger',     position: POS.RW },
    ],
  },
  {
    name: '4-1-4-1',
    description: 'Defensivt kompakt med en defensiv midtbanespiller.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LB },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.RCB },
      { role: 'defender',   position: POS.RB },
      { role: 'midfielder', position: POS.CDM },
      { role: 'midfielder', position: POS.LM },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'midfielder', position: POS.RM },
      { role: 'forward',    position: POS.ST },
    ],
  },
  {
    name: '4-5-1',
    description: 'Maksimal kontroll på midtbanen.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: POS.LB },
      { role: 'defender',   position: POS.LCB },
      { role: 'defender',   position: POS.RCB },
      { role: 'defender',   position: POS.RB },
      { role: 'midfielder', position: POS.LM },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.CDM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'midfielder', position: POS.RM },
      { role: 'forward',    position: POS.ST },
    ],
  },
];

// ═══ 7er FOTBALL FORMASJONER ══════════════════════════════════

export const FORMATIONS_7ER: Formation[] = [
  {
    name: '2-3-1',
    description: 'Balansert formasjon for 7er fotball.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: { x: 180, y: 180 } },
      { role: 'defender',   position: { x: 180, y: 380 } },
      { role: 'midfielder', position: POS.CM7L },
      { role: 'midfielder', position: POS.CM },
      { role: 'midfielder', position: POS.CM7R },
      { role: 'forward',    position: POS.ST7 },
    ],
  },
  {
    name: '2-2-2',
    description: 'Jevn fordeling mellom forsvar, midtbane og angrep.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: { x: 180, y: 180 } },
      { role: 'defender',   position: { x: 180, y: 380 } },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'forward',    position: { x: 700, y: 180 } },
      { role: 'forward',    position: { x: 700, y: 380 } },
    ],
  },
  {
    name: '3-2-1',
    description: 'Defensivt solid, bra for kontringer.',
    homePlayers: [
      { role: 'keeper',     position: POS.GK },
      { role: 'defender',   position: { x: 180, y: 140 } },
      { role: 'defender',   position: { x: 180, y: 280 } },
      { role: 'defender',   position: { x: 180, y: 420 } },
      { role: 'midfielder', position: POS.LCM },
      { role: 'midfielder', position: POS.RCM },
      { role: 'forward',    position: POS.ST7 },
    ],
  },
];

// ═══ 9er FOTBALL FORMASJONER ══════════════════════════════════

const POS_9ER = {
  GK:  { x: 92,  y: 280 },
  LB:  { x: 180, y: 120 },
  LCB: { x: 180, y: 200 },
  CB:  { x: 180, y: 280 },
  RCB: { x: 180, y: 360 },
  RB:  { x: 180, y: 440 },
  LM:  { x: 380, y: 120 },
  LCM: { x: 350, y: 200 },
  CM:  { x: 380, y: 280 },
  RCM: { x: 350, y: 360 },
  RM:  { x: 380, y: 440 },
  CAM: { x: 520, y: 280 },
  LW:  { x: 650, y: 140 },
  ST:  { x: 720, y: 280 },
  RW:  { x: 650, y: 420 },
  LS:  { x: 700, y: 200 },
  RS:  { x: 700, y: 360 },
};

export const FORMATIONS_9ER: Formation[] = [
  {
    name: '3-4-1',
    description: '3 backer, 4 midtbanespillere, 1 spiss. Balansert formasjon for 9er fotball.',
    homePlayers: [
      { role: 'keeper',     position: POS_9ER.GK },
      { role: 'defender',   position: POS_9ER.LCB },
      { role: 'defender',   position: POS_9ER.CB },
      { role: 'defender',   position: POS_9ER.RCB },
      { role: 'midfielder', position: POS_9ER.LM },
      { role: 'midfielder', position: POS_9ER.LCM },
      { role: 'midfielder', position: POS_9ER.RCM },
      { role: 'midfielder', position: POS_9ER.RM },
      { role: 'forward',    position: POS_9ER.ST },
    ],
  },
  {
    name: '3-3-2',
    description: '3 backer, 3 midtbane, 2 spisser. Offensivt og balansert.',
    homePlayers: [
      { role: 'keeper',     position: POS_9ER.GK },
      { role: 'defender',   position: POS_9ER.LCB },
      { role: 'defender',   position: POS_9ER.CB },
      { role: 'defender',   position: POS_9ER.RCB },
      { role: 'midfielder', position: POS_9ER.LCM },
      { role: 'midfielder', position: POS_9ER.CM },
      { role: 'midfielder', position: POS_9ER.RCM },
      { role: 'forward',    position: POS_9ER.LS },
      { role: 'forward',    position: POS_9ER.RS },
    ],
  },
  {
    name: '4-3-1',
    description: '4 backer, 3 midtbane, 1 spiss. Defensivt solid.',
    homePlayers: [
      { role: 'keeper',     position: POS_9ER.GK },
      { role: 'defender',   position: POS_9ER.LB },
      { role: 'defender',   position: POS_9ER.LCB },
      { role: 'defender',   position: POS_9ER.RCB },
      { role: 'defender',   position: POS_9ER.RB },
      { role: 'midfielder', position: POS_9ER.LCM },
      { role: 'midfielder', position: POS_9ER.CM },
      { role: 'midfielder', position: POS_9ER.RCM },
      { role: 'forward',    position: POS_9ER.ST },
    ],
  },
  {
    name: '4-2-2',
    description: '4 backer, 2 midtbane, 2 spisser. Bra for kontringer.',
    homePlayers: [
      { role: 'keeper',     position: POS_9ER.GK },
      { role: 'defender',   position: POS_9ER.LB },
      { role: 'defender',   position: POS_9ER.LCB },
      { role: 'defender',   position: POS_9ER.RCB },
      { role: 'defender',   position: POS_9ER.RB },
      { role: 'midfielder', position: POS_9ER.CM },
      { role: 'midfielder', position: POS_9ER.CAM },
      { role: 'forward',    position: POS_9ER.LS },
      { role: 'forward',    position: POS_9ER.RS },
    ],
  },
];

// ═══ HÅNDBALL FORMASJONER (FLERE) ═════════════════════════════

export const FORMATIONS_HANDBALL: Formation[] = [
  {
    name: '6-0',
    description: 'Klassisk 6-0 forsvar – alle seks utespillere på en linje. Mest brukte defensiv formasjon.',
    homePlayers: [
      { role: 'hb_keeper',   position: POS_HB.GK },
      { role: 'hb_backcourt', position: POS_HB.CB_L },
      { role: 'hb_backcourt', position: POS_HB.CB_C },
      { role: 'hb_backcourt', position: POS_HB.CB_R },
      { role: 'hb_backcourt', position: POS_HB.LB },
      { role: 'hb_backcourt', position: POS_HB.RB },
      { role: 'hb_playmaker', position: POS_HB.PM },
    ],
  },
  {
    name: '5-1',
    description: 'Fem utespillere i forsvar og en playmaker. Ofte brukt i angrep for å skape overtall.',
    homePlayers: [
      { role: 'hb_keeper',   position: POS_HB.GK },
      { role: 'hb_backcourt', position: POS_HB.CB_L },
      { role: 'hb_backcourt', position: POS_HB.CB_C },
      { role: 'hb_backcourt', position: POS_HB.CB_R },
      { role: 'hb_backcourt', position: POS_HB.LB },
      { role: 'hb_backcourt', position: POS_HB.RB },
      { role: 'hb_pivot',     position: POS_HB.PIV },
    ],
  },
  {
    name: '4-2',
    description: 'Fire forsvarsspillere og to playmakere. Offensivt og god ballfordeling.',
    homePlayers: [
      { role: 'hb_keeper',   position: POS_HB.GK },
      { role: 'hb_backcourt', position: POS_HB.CB_L },
      { role: 'hb_backcourt', position: POS_HB.CB_C },
      { role: 'hb_backcourt', position: POS_HB.CB_R },
      { role: 'hb_playmaker', position: POS_HB.PM },
      { role: 'hb_playmaker', position: POS_HB.LW },
      { role: 'hb_pivot',     position: POS_HB.PIV },
    ],
  },
  {
    name: '3-3',
    description: 'Tre bakspillere og tre angripere. Svært offensiv formasjon for å presse høyt.',
    homePlayers: [
      { role: 'hb_keeper',   position: POS_HB.GK },
      { role: 'hb_backcourt', position: POS_HB.CB_L },
      { role: 'hb_backcourt', position: POS_HB.CB_C },
      { role: 'hb_backcourt', position: POS_HB.CB_R },
      { role: 'hb_wing',      position: POS_HB.LW },
      { role: 'hb_wing',      position: POS_HB.RW },
      { role: 'hb_pivot',     position: POS_HB.PIV },
    ],
  },
  {
    name: '3-2-1',
    description: 'Tre bak, to playmakere, en pivot. Moderne formasjon for rask omstilling.',
    homePlayers: [
      { role: 'hb_keeper',   position: POS_HB.GK },
      { role: 'hb_backcourt', position: POS_HB.CB_L },
      { role: 'hb_backcourt', position: POS_HB.CB_C },
      { role: 'hb_backcourt', position: POS_HB.CB_R },
      { role: 'hb_playmaker', position: POS_HB.PM },
      { role: 'hb_playmaker', position: POS_HB.LW },
      { role: 'hb_pivot',     position: POS_HB.PIV },
    ],
  },
  {
    name: '7-0',
    description: 'Ekstremt defensivt – alle syv utespillere i forsvar. Brukes sjelden, men for å beskytte ledelse.',
    homePlayers: [
      { role: 'hb_keeper',   position: POS_HB.GK },
      { role: 'hb_backcourt', position: POS_HB.CB_L },
      { role: 'hb_backcourt', position: POS_HB.CB_C },
      { role: 'hb_backcourt', position: POS_HB.CB_R },
      { role: 'hb_backcourt', position: POS_HB.LB },
      { role: 'hb_backcourt', position: POS_HB.RB },
      { role: 'hb_playmaker', position: POS_HB.PM },
    ],
  },
];

// ═══ HENT FORMASJONER BASERT PÅ SPORT ════════════════════════

export const getFormations = (sport: string): Formation[] => {
  if (sport === 'football7') return FORMATIONS_7ER;
  if (sport === 'football9') return FORMATIONS_9ER;
  if (sport === 'handball') return FORMATIONS_HANDBALL;
  return FORMATIONS_11ER;
};

export const DEFAULT_FORMATION: Record<string, string> = {
  football:   '4-3-3',
  football7:  '2-3-1',
  football9:  '3-4-1',
  handball:   '6-0',
};

export const getFormationDescription = (formationName: string, sport: string): string => {
  const formations = getFormations(sport);
  const formation = formations.find(f => f.name === formationName);
  return formation?.description || 'Ingen beskrivelse tilgjengelig.';
};

// ══════════════════════════════════════════════════════════════
//  FORBEDRET makePhase – EKSAKT KOPI UTEN ENDRING
// ══════════════════════════════════════════════════════════════

/**
 * Lager en ny taktisk fase.
 * @param name – navn på fasen
 * @param sport – sport ('football', 'football7', 'football9', 'handball')
 * @param existingPlayers – valgfri liste over eksisterende spillere (fra forrige fase)
 * @param existingBall – valgfri ballposisjon
 * @returns en fullstendig TacticPhase
 */
export const makePhase = (
  name: string,
  sport: string,
  existingPlayers?: Player[],
  existingBall?: Position
): TacticPhase => {
  const formations = getFormations(sport);
  const defaultFormation = DEFAULT_FORMATION[sport] ?? formations[0]?.name;
  const formation = formations.find(f => f.name === defaultFormation) ?? formations[0];

  let players: Player[];
  if (existingPlayers && existingPlayers.length > 0) {
    // 🔥 EKSAKT KOPI – ingen rollebasert matching, bare dyp kopi
    players = existingPlayers.map(p => ({ ...p }));
  } else {
    // Første gang – opprett fra formasjonen
    players = formation.homePlayers.map((p, idx) => ({
      id: `p-${Date.now()}-${idx}`,
      num: idx + 1,
      name: '',
      role: p.role as PlayerRole,
      position: p.position,
      team: 'home',
      notes: '',
      isStarter: true,
      isOnField: true,
      minutesPlayed: 0,
      specialRoles: [],
    }));
  }

  return {
    id: `phase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    players,
    ball: existingBall ?? { x: VW / 2, y: VH / 2 },
    drawings: [],
    stickyNote: '',
  };
};