// src/data/formations.ts
// LANDSCAPE PITCH: W=880 (left=own goal, right=opponent goal), H=560 (top/bottom=sidelines)

import { TacticPhase, Player, Position, PlayerRole } from '../types';

export const VW = 880;
export const VH = 560;

// ─── Landscape positions (x=depth, y=width) ───────────────────
// Own goal at x≈54 (left), Opponent goal at x≈826 (right)
// Vertically centered: y=280

const POS: Record<string, { x: number; y: number }> = {
  // Keeper (eget mål, venstre)
  GK:  { x: 92,  y: 280 },

  // Forsvar
  LB:  { x: 162, y: 100 },   // Venstre back (topp)
  LCB: { x: 162, y: 200 },   // Venstre midtback
  CB:  { x: 162, y: 280 },   // Midtback (senter)
  RCB: { x: 162, y: 360 },   // Høyre midtback
  RB:  { x: 162, y: 460 },   // Høyre back (bunn)

  // Defensive midtbane
  CDM: { x: 260, y: 280 },

  // Midtbane
  LM:  { x: 420, y: 100 },
  LCM: { x: 380, y: 190 },
  CM:  { x: 420, y: 280 },
  RCM: { x: 380, y: 370 },
  RM:  { x: 420, y: 460 },

  // Offensiv midtbane
  CAM: { x: 560, y: 280 },

  // Vingbacker
  LWB: { x: 220, y: 90 },
  RWB: { x: 220, y: 470 },

  // Angrep
  LW:  { x: 680, y: 120 },
  ST:  { x: 750, y: 280 },
  RW:  { x: 680, y: 440 },
  LS:  { x: 740, y: 190 },
  RS:  { x: 740, y: 370 },

  // 7er ekstra
  CM7L: { x: 360, y: 160 },
  CM7R: { x: 360, y: 400 },
  ST7:  { x: 720, y: 280 },
};

interface FormationPlayer {
  role: string;
  position: { x: number; y: number };
}

interface Formation {
  name: string;
  description: string;
  homePlayers: FormationPlayer[];
}

// ═══ 11er formasjoner ═════════════════════════════════════════

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

// ═══ 7er formasjoner ══════════════════════════════════════════

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

// ═══ Hjelpefunksjoner ═════════════════════════════════════════

export const getFormations = (sport: string): Formation[] => {
  if (sport === 'football7') return FORMATIONS_7ER;
  return FORMATIONS_11ER;
};

export const DEFAULT_FORMATION: Record<string, string> = {
  football:  '4-3-3',
  football7: '2-3-1',
  handball:  '6-0',
};

export const getFormationDescription = (formationName: string, sport: string): string => {
  const formations = getFormations(sport);
  const formation = formations.find(f => f.name === formationName);
  return formation?.description || 'Ingen beskrivelse tilgjengelig.';
};

// ═══ makePhase ════════════════════════════════════════════════

export const makePhase = (
  name: string,
  sport: string,
  existingPlayers?: Player[],
  existingBall?: Position
): TacticPhase => {
  const formations = getFormations(sport === 'football7' ? 'football7' : sport);
  const defaultFormation = DEFAULT_FORMATION[sport === 'football7' ? 'football7' : sport] ?? formations[0]?.name;
  const formation = formations.find(f => f.name === defaultFormation) ?? formations[0];

  const players = existingPlayers ?? formation.homePlayers.map((p, idx) => ({
    id: `p-${Date.now()}-${idx}`,
    num: idx + 1,
    name: '',
    role: p.role as PlayerRole,
    position: p.position,
    team: 'home' as const,
    notes: '',
    isStarter: true,
    isOnField: true,
    minutesPlayed: 0,
    specialRoles: [],
  }));

  return {
    id: `phase-${Date.now()}`,
    name,
    players,
    ball: existingBall ?? { x: VW / 2, y: VH / 2 },
    drawings: [],
    stickyNote: '',
  };
};