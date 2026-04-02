// src/data/formations.ts

export const VW = 880;
export const VH = 560;

// Posisjoner for 11er fotball
const POS_11ER = {
  // Keeper
  GK: { x: VW/2, y: VH - 45 },
  
  // Forsvar (4)
  LB: { x: VW/2 - 180, y: VH - 110 },
  LCB: { x: VW/2 - 70, y: VH - 110 },
  RCB: { x: VW/2 + 70, y: VH - 110 },
  RB: { x: VW/2 + 180, y: VH - 110 },
  
  // Midtbane (3-4-5)
  CDM: { x: VW/2, y: VH - 180 },
  LCM: { x: VW/2 - 100, y: VH - 220 },
  RCM: { x: VW/2 + 100, y: VH - 220 },
  CAM: { x: VW/2, y: VH - 260 },
  LM: { x: VW/2 - 200, y: VH - 200 },
  RM: { x: VW/2 + 200, y: VH - 200 },
  
  // Angrep (2-3)
  LW: { x: VW/2 - 160, y: VH - 330 },
  RW: { x: VW/2 + 160, y: VH - 330 },
  ST: { x: VW/2, y: VH - 350 },
  LS: { x: VW/2 - 80, y: VH - 340 },
  RS: { x: VW/2 + 80, y: VH - 340 },
  
  // Vingbacker (for 3-5-2)
  LWB: { x: VW/2 - 220, y: VH - 130 },
  RWB: { x: VW/2 + 220, y: VH - 130 },
};

// Roller mapping
const ROLE_MAP: Record<string, string> = {
  GK: 'keeper',
  LB: 'defender', LCB: 'defender', RCB: 'defender', RB: 'defender',
  LWB: 'wingback', RWB: 'wingback',
  CDM: 'midfielder', LCM: 'midfielder', RCM: 'midfielder', CAM: 'playmaker',
  LM: 'midfielder', RM: 'midfielder',
  LW: 'winger', RW: 'winger',
  ST: 'forward', LS: 'forward', RS: 'forward',
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

// Alle formasjoner for 11er fotball
export const FORMATIONS_11ER: Formation[] = [
  {
    name: '4-3-3',
    description: 'Offensiv fotball med tre spisser. Gir gode muligheter for gjennombrudd og press høyt i banen.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LB },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'defender', position: POS_11ER.RB },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.LCM },
      { role: 'midfielder', position: POS_11ER.RCM },
      { role: 'winger', position: POS_11ER.LW },
      { role: 'forward', position: POS_11ER.ST },
      { role: 'winger', position: POS_11ER.RW },
    ],
  },
  {
    name: '4-4-2',
    description: 'Klassisk, balansert formasjon. Bra for forsvarsspill og raske overganger via kantene.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LB },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'defender', position: POS_11ER.RB },
      { role: 'midfielder', position: POS_11ER.LM },
      { role: 'midfielder', position: POS_11ER.LCM },
      { role: 'midfielder', position: POS_11ER.RCM },
      { role: 'midfielder', position: POS_11ER.RM },
      { role: 'forward', position: POS_11ER.LS },
      { role: 'forward', position: POS_11ER.RS },
    ],
  },
  {
    name: '4-2-3-1',
    description: 'Solid defensiv struktur med to defensive midtbanespillere. Bra for kontroll og ballbesittelse.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LB },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'defender', position: POS_11ER.RB },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.LM },
      { role: 'playmaker', position: POS_11ER.CAM },
      { role: 'midfielder', position: POS_11ER.RM },
      { role: 'forward', position: POS_11ER.ST },
    ],
  },
  {
    name: '3-5-2',
    description: 'Sentral midtbanekontroll med vingbacker som dekker bredden. Bra for å dominere midtbanen.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: { x: VW/2, y: VH - 110 } },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'wingback', position: POS_11ER.LWB },
      { role: 'wingback', position: POS_11ER.RWB },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.LCM },
      { role: 'midfielder', position: POS_11ER.RCM },
      { role: 'forward', position: POS_11ER.LS },
      { role: 'forward', position: POS_11ER.RS },
    ],
  },
  {
    name: '5-3-2',
    description: 'Defensiv solid formasjon med fem backer. Bra for kontringer og mot sterke lag.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LB },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: { x: VW/2, y: VH - 110 } },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'defender', position: POS_11ER.RB },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.LCM },
      { role: 'midfielder', position: POS_11ER.RCM },
      { role: 'forward', position: POS_11ER.LS },
      { role: 'forward', position: POS_11ER.RS },
    ],
  },
  {
    name: '3-4-3',
    description: 'Offensivt og presshøyt. Bra for lag som vil dominere og skape mange sjanser.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: { x: VW/2, y: VH - 110 } },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'midfielder', position: POS_11ER.LM },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.CAM },
      { role: 'midfielder', position: POS_11ER.RM },
      { role: 'winger', position: POS_11ER.LW },
      { role: 'forward', position: POS_11ER.ST },
      { role: 'winger', position: POS_11ER.RW },
    ],
  },
  {
    name: '4-1-4-1',
    description: 'Defensivt kompakt med en defensiv midtbanespiller. Bra mot sterke lag.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LB },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'defender', position: POS_11ER.RB },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.LM },
      { role: 'midfielder', position: POS_11ER.LCM },
      { role: 'midfielder', position: POS_11ER.RCM },
      { role: 'midfielder', position: POS_11ER.RM },
      { role: 'forward', position: POS_11ER.ST },
    ],
  },
  {
    name: '4-5-1',
    description: 'Maksimal kontroll på midtbanen. Bra for å holde på ballen og kontrollere tempo.',
    homePlayers: [
      { role: 'keeper', position: POS_11ER.GK },
      { role: 'defender', position: POS_11ER.LB },
      { role: 'defender', position: POS_11ER.LCB },
      { role: 'defender', position: POS_11ER.RCB },
      { role: 'defender', position: POS_11ER.RB },
      { role: 'midfielder', position: POS_11ER.LM },
      { role: 'midfielder', position: POS_11ER.LCM },
      { role: 'midfielder', position: POS_11ER.CDM },
      { role: 'midfielder', position: POS_11ER.RCM },
      { role: 'midfielder', position: POS_11ER.RM },
      { role: 'forward', position: POS_11ER.ST },
    ],
  },
];

// For 7er fotball
const POS_7ER = {
  GK: { x: VW/2, y: VH - 45 },
  CB: { x: VW/2, y: VH - 130 },
  LWB: { x: VW/2 - 150, y: VH - 130 },
  RWB: { x: VW/2 + 150, y: VH - 130 },
  CM: { x: VW/2, y: VH - 220 },
  CAM: { x: VW/2, y: VH - 300 },
  ST: { x: VW/2, y: VH - 380 },
  LW: { x: VW/2 - 120, y: VH - 300 },
  RW: { x: VW/2 + 120, y: VH - 300 },
};

export const FORMATIONS_7ER: Formation[] = [
  {
    name: '2-3-1',
    description: 'Balansert formasjon for 7er fotball. Bra for både forsvar og angrep.',
    homePlayers: [
      { role: 'keeper', position: POS_7ER.GK },
      { role: 'defender', position: POS_7ER.CB },
      { role: 'defender', position: POS_7ER.CB },
      { role: 'midfielder', position: POS_7ER.LWB },
      { role: 'midfielder', position: POS_7ER.CM },
      { role: 'midfielder', position: POS_7ER.RWB },
      { role: 'forward', position: POS_7ER.ST },
    ],
  },
  {
    name: '2-2-2',
    description: 'Jevn fordeling mellom forsvar, midtbane og angrep.',
    homePlayers: [
      { role: 'keeper', position: POS_7ER.GK },
      { role: 'defender', position: POS_7ER.CB },
      { role: 'defender', position: POS_7ER.CB },
      { role: 'midfielder', position: POS_7ER.CM },
      { role: 'midfielder', position: POS_7ER.CM },
      { role: 'forward', position: POS_7ER.LW },
      { role: 'forward', position: POS_7ER.RW },
    ],
  },
  {
    name: '3-2-1',
    description: 'Defensivt solid, bra for kontringer.',
    homePlayers: [
      { role: 'keeper', position: POS_7ER.GK },
      { role: 'defender', position: POS_7ER.CB },
      { role: 'defender', position: POS_7ER.CB },
      { role: 'defender', position: POS_7ER.CB },
      { role: 'midfielder', position: POS_7ER.CM },
      { role: 'midfielder', position: POS_7ER.CM },
      { role: 'forward', position: POS_7ER.ST },
    ],
  },
];

export const getFormations = (sport: string): Formation[] => {
  if (sport === 'football7') return FORMATIONS_7ER;
  return FORMATIONS_11ER;
};

export const DEFAULT_FORMATION: Record<string, string> = {
  football: '4-3-3',
  football7: '2-3-1',
  handball: '6-0',
};

// For å hente formasjonsbeskrivelse
export const getFormationDescription = (formationName: string, sport: string): string => {
  const formations = getFormations(sport);
  const formation = formations.find(f => f.name === formationName);
  return formation?.description || 'Ingen beskrivelse tilgjengelig.';
};