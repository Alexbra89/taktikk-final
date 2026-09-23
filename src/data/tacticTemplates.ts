import type { Drawing, NewDrawing, Position, Sport, TacticPhase } from '../types';
import { getFormationSlots } from './formations';
import { colorFields } from '../components/board/drawTools';

// ══════════════════════════════════════════════════════════════
//  TAKTIKK-MALER – ferdige taktikker å starte fra
//
//  En mal lagrer bare det som endrer seg: hvilke spillere som flytter
//  seg fra fasen før (slotIdx → posisjon) og hvor ballen er. Første fase
//  tar utgangspunkt i formasjonens standardposisjoner.
//
//  Løpepilene og ballens stiplede vei lages automatisk fra flyttene,
//  så de peker alltid dit spilleren og ballen faktisk går. En pil ligger
//  i fasen spilleren går FRA: det er den fasen avspilling og video viser
//  mens bevegelsen skjer.
//
//  Banen: 880 × 560, linjene går fra (32, 32) til (848, 528). Eget lag
//  angriper mot høyre; motstandermålet er ved x = 848, y 244–316.
//  Spillere holdes innenfor klemmegrensene i constants.ts.
// ══════════════════════════════════════════════════════════════

export interface TemplatePhase {
  name: string;
  /** Spillere som flytter seg fra fasen før: slotIdx → ny posisjon. */
  moves?: Record<number, Position>;
  ball: Position;
  /** Tegninger utover løpene og ballens vei: innlegg, skudd, soner, linjer. */
  extra?: NewDrawing[];
}

export interface TacticTemplate {
  id: string;
  name: string;
  description: string;
  sport: Sport;
  formation: string;     // må finnes i getFormations(sport)
  phases: TemplatePhase[];
}

/** Blå: skiller seg fra de røde brikkene, og følger temaet som alle tegnefargene. */
const C = colorFields('blue');

const p = (x: number, y: number): Position => ({ x, y });

// Små byggeklosser for ekstra tegninger.
const pass  = (a: Position, b: Position): NewDrawing => ({ type: 'dashed', pts: [a, b], ...C });
const arrow = (a: Position, b: Position): NewDrawing => ({ type: 'arrow', pts: [a, b], ...C });
const curve = (a: Position, c: Position, b: Position): NewDrawing => ({ type: 'curved-arrow', pts: [a, c, b], ...C });
const zone  = (a: Position, b: Position): NewDrawing => ({ type: 'rectangle', start: a, end: b, ...C });
const label = (at: Position, text: string): NewDrawing => ({ type: 'label', at, text, ...C });

const CENTER = p(440, 280);
/** Der sentral midtbane står på midtpunktet, ligger ballen ved siden av – ellers skjules den. */
const BESIDE_CM = p(462, 292);

export const TACTIC_TEMPLATES: TacticTemplate[] = [
  // ═══ 11-er ═════════════════════════════════════════════════
  // 4-4-2 slots: 0 K · 1 VB · 2 VMS · 3 HMS · 4 HB · 5 VM · 6 VSM · 7 HSM · 8 HM · 9 VS · 10 HS
  // 4-3-3 slots: 0 K · 1 VB · 2 VMS · 3 HMS · 4 HB · 5 VSM · 6 SM · 7 HSM · 8 VK · 9 S · 10 HK
  // 5-3-2 slots: 0 K · 1 VB · 2 VMS · 3 MS · 4 HMS · 5 HB · 6 VSM · 7 SM · 8 HSM · 9 VS · 10 HS
  {
    id: 'f11-442',
    name: '4-4-2 grunnoppstilling',
    description: 'Klassisk og balansert. To firere som ligger kompakt, og to spisser som samarbeider.',
    sport: 'football', formation: '4-4-2',
    phases: [{ name: 'Start', ball: CENTER }],
  },
  {
    id: 'f11-433',
    name: '4-3-3 grunnoppstilling',
    description: 'Tre på topp og tre sentralt. Gir bredde i angrep og mange trekanter å spille i.',
    sport: 'football', formation: '4-3-3',
    phases: [{ name: 'Start', ball: BESIDE_CM }],
  },
  {
    id: 'f11-433-press',
    name: '4-3-3 høyt press',
    description: 'Presset starter når motstanderens keeper spiller ut. Spissen stenger tilbakespillet, kanten går på ballfører.',
    sport: 'football', formation: '4-3-3',
    phases: [
      {
        name: 'Utgangspunkt',
        moves: {
          0: p(150, 280),
          1: p(330, 110), 2: p(300, 220), 3: p(300, 340), 4: p(330, 450),
          5: p(500, 190), 6: p(470, 280), 7: p(500, 370),
          8: p(640, 150), 9: p(660, 280), 10: p(640, 410),
        },
        ball: p(815, 280),
      },
      {
        name: 'Press på midtstopper',
        moves: {
          0: p(190, 280),
          1: p(420, 110), 2: p(360, 230), 3: p(360, 340), 4: p(400, 440),
          5: p(610, 150), 6: p(580, 260), 7: p(570, 360),
          8: p(745, 170), 9: p(735, 250), 10: p(710, 390),
        },
        ball: p(775, 175),
      },
      {
        name: 'Ballvinning',
        moves: {
          6: p(660, 250), 7: p(640, 340),
          8: p(785, 150), 9: p(790, 265), 10: p(790, 350),
        },
        ball: p(803, 166),
        extra: [arrow(p(808, 176), p(835, 270))],
      },
    ],
  },
  {
    id: 'f11-433-kontring',
    name: '4-3-3 kontring',
    description: 'Ballvinning dypt i egen banehalvdel. Første pasning fremover, kantene sprinter, og angrepet avsluttes på fire trekk.',
    sport: 'football', formation: '4-3-3',
    phases: [
      {
        name: 'Ballvinning',
        moves: {
          1: p(175, 140), 2: p(160, 230), 3: p(160, 330), 4: p(175, 420),
          5: p(270, 200), 6: p(255, 280), 7: p(270, 360),
          8: p(400, 140), 9: p(470, 280), 10: p(400, 420),
        },
        ball: p(273, 296),
      },
      {
        name: 'Pasning til spiss',
        moves: { 7: p(330, 360), 8: p(520, 120), 9: p(450, 290), 10: p(520, 440) },
        ball: p(468, 306),
      },
      {
        name: 'Kanten i bakrom',
        moves: { 6: p(360, 280), 7: p(430, 360), 8: p(650, 140), 9: p(600, 280), 10: p(680, 430) },
        ball: p(698, 446),
      },
      {
        name: 'Innlegg og avslutning',
        moves: { 7: p(660, 340), 8: p(770, 195), 9: p(770, 270), 10: p(790, 400) },
        ball: p(808, 416),
        extra: [pass(p(795, 395), p(775, 282)), arrow(p(780, 270), p(840, 280))],
      },
    ],
  },
  {
    id: 'f11-442-innlegg',
    name: '4-4-2 innlegg og avslutning',
    description: 'Ytre midtbane trekker inn, backen overlapper på utsiden og slår innlegg. Spissene deler nærstolpe og bakre stolpe.',
    sport: 'football', formation: '4-4-2',
    phases: [
      {
        name: 'Ballen til kant',
        moves: {
          0: p(120, 280),
          1: p(310, 110), 2: p(260, 230), 3: p(260, 330), 4: p(340, 450),
          5: p(560, 100), 6: p(470, 210), 7: p(480, 350), 8: p(600, 460),
          9: p(680, 220), 10: p(680, 340),
        },
        ball: p(498, 366),
      },
      {
        name: 'Backen overlapper',
        moves: { 4: p(560, 480), 8: p(650, 425) },
        ball: p(668, 441),
      },
      {
        name: 'Innlegg',
        moves: {
          4: p(790, 480), 8: p(700, 410),
          5: p(720, 160), 7: p(660, 330),
          9: p(780, 225), 10: p(795, 300),
        },
        ball: p(808, 496),
        extra: [pass(p(806, 484), p(795, 312))],
      },
    ],
  },
  {
    id: 'f11-532-lav-blokk',
    name: '5-3-2 lav blokk',
    description: 'Fem bak og tre foran, tett sammen foran eget felt. Blokken forskyver seg samlet mot ballsiden.',
    sport: 'football', formation: '5-3-2',
    phases: [
      {
        name: 'Blokk på plass',
        moves: {
          1: p(195, 120), 2: p(175, 205), 3: p(170, 280), 4: p(175, 355), 5: p(195, 440),
          6: p(285, 200), 7: p(275, 280), 8: p(285, 360),
          9: p(400, 240), 10: p(400, 320),
        },
        ball: p(480, 150),
        extra: [zone(p(150, 95), p(425, 465))],
      },
      {
        name: 'Forskyv mot ballside',
        moves: {
          1: p(240, 90), 2: p(185, 170), 3: p(170, 240), 4: p(175, 310), 5: p(190, 390),
          6: p(300, 140), 7: p(290, 220), 8: p(290, 300),
          9: p(390, 190), 10: p(400, 265),
        },
        ball: p(330, 60),
        extra: [zone(p(150, 50), p(420, 415))],
      },
    ],
  },
  {
    id: 'f11-offside',
    name: 'Offside-felle',
    description: 'Spesialsituasjon, ikke en standardformasjon. Bygget på 4-4-2: backlinjen holder én linje og går samlet opp i det pasningen slås.',
    sport: 'football', formation: '4-4-2',
    phases: [
      {
        name: 'Linjen holder',
        moves: {
          0: p(170, 280),
          1: p(305, 120), 2: p(295, 230), 3: p(295, 330), 4: p(305, 440),
          5: p(430, 110), 6: p(410, 220), 7: p(410, 340), 8: p(430, 450),
          9: p(560, 240), 10: p(560, 330),
        },
        ball: p(500, 285),
        extra: [pass(p(300, 70), p(300, 490)), label(p(300, 55), 'Linje')],
      },
      {
        name: 'Linjen går opp',
        moves: {
          0: p(210, 280),
          1: p(385, 120), 2: p(380, 230), 3: p(380, 330), 4: p(385, 440),
          6: p(470, 230), 7: p(470, 330),
        },
        ball: p(320, 282),
        extra: [pass(p(382, 70), p(382, 490)), label(p(300, 318), 'Offside')],
      },
    ],
  },
  {
    id: 'f11-corner-angrep',
    name: 'Corner angrep',
    description: 'Spesialsituasjon, ikke en standardformasjon. Bygget på 4-4-2: tre løp inn i feltet, én på kanten av feltet og ett kort alternativ.',
    sport: 'football', formation: '4-4-2',
    phases: [
      {
        name: 'Corner',
        moves: {
          0: p(200, 280),
          1: p(470, 160), 4: p(470, 400), 7: p(560, 280),
          2: p(700, 290), 3: p(720, 350),
          5: p(826, 64),  6: p(720, 60),
          8: p(690, 400), 9: p(720, 230), 10: p(690, 170),
        },
        ball: p(842, 36),
        extra: [
          curve(p(838, 46), p(800, 150), p(792, 272)),
          arrow(p(730, 228), p(800, 252)),
          arrow(p(710, 290), p(775, 285)),
          arrow(p(730, 350), p(795, 330)),
        ],
      },
    ],
  },
  {
    id: 'f11-corner-forsvar',
    name: 'Corner forsvar',
    description: 'Spesialsituasjon, ikke en standardformasjon. Bygget på 4-4-2: sone i femmeteren, en på nærstolpen og én spiss igjen til kontring.',
    sport: 'football', formation: '4-4-2',
    phases: [
      {
        name: 'Corner mot',
        moves: {
          0: p(50, 285),
          5: p(48, 226), 8: p(48, 342),
          9: p(100, 215), 2: p(100, 280), 3: p(100, 345),
          1: p(150, 170), 6: p(152, 250), 7: p(152, 330), 4: p(160, 410),
          10: p(420, 290),
        },
        ball: p(40, 38),
        extra: [zone(p(30, 192), p(124, 372)), label(p(77, 176), 'Sone')],
      },
    ],
  },

  // ═══ 9-er ══════════════════════════════════════════════════
  // 3-3-2 slots: 0 K · 1 VMS · 2 MS · 3 HMS · 4 VSM · 5 SM · 6 HSM · 7 VS · 8 HS
  // 3-4-1 slots: 0 K · 1 VMS · 2 MS · 3 HMS · 4 VM · 5 VSM · 6 HSM · 7 HM · 8 S
  {
    id: 'f9-332',
    name: '3-3-2 grunnoppstilling',
    description: 'Tre bak, tre på midten og to spisser. Enkel å forstå, og gir to å spille på fremover.',
    sport: 'football9', formation: '3-3-2',
    phases: [{ name: 'Start', ball: CENTER }],
  },
  {
    id: 'f9-341',
    name: '3-4-1 grunnoppstilling',
    description: 'Fire på midten gir kontroll. Kantene må jobbe hele banen, og spissen holder ballen oppe.',
    sport: 'football9', formation: '3-4-1',
    phases: [{ name: 'Start', ball: CENTER }],
  },
  {
    id: 'f9-kontring',
    name: 'Kontring fra egen bane',
    description: 'Ballvinning foran egne midtstoppere, rask pasning til den ene spissen og gjennombrudd for den andre.',
    sport: 'football9', formation: '3-3-2',
    phases: [
      {
        name: 'Ballvinning',
        moves: {
          1: p(170, 200), 2: p(160, 280), 3: p(170, 360),
          4: p(260, 200), 5: p(250, 280), 6: p(260, 360),
          7: p(420, 220), 8: p(420, 340),
        },
        ball: p(268, 296),
      },
      {
        name: 'Pasning til spiss',
        moves: { 4: p(360, 180), 6: p(360, 380), 7: p(560, 200), 8: p(445, 330) },
        ball: p(463, 346),
      },
      {
        name: 'Gjennombrudd',
        moves: { 4: p(480, 200), 6: p(520, 380), 7: p(720, 250), 8: p(640, 330) },
        ball: p(738, 266),
        extra: [arrow(p(746, 270), p(840, 280))],
      },
    ],
  },

  // ═══ 7-er ══════════════════════════════════════════════════
  // 2-3-1 slots: 0 K · 1 VB · 2 HB · 3 VM · 4 SM · 5 HM · 6 S
  {
    id: 'f7-231',
    name: '2-3-1 grunnoppstilling',
    description: 'To bak, tre på midten og én spiss. Gir trekanter over hele banen.',
    sport: 'football7', formation: '2-3-1',
    phases: [{ name: 'Start', ball: BESIDE_CM }],
  },
  {
    id: 'f7-press',
    name: 'Høyt press',
    description: 'Spissen styrer presset mot den ene siden, og laget skyver opp bak. Backene følger over midtbanen.',
    sport: 'football7', formation: '2-3-1',
    phases: [
      {
        name: 'Utgangspunkt',
        moves: {
          0: p(170, 280),
          1: p(330, 200), 2: p(330, 360),
          3: p(560, 170), 4: p(520, 280), 5: p(560, 390),
          6: p(640, 280),
        },
        ball: p(815, 280),
      },
      {
        name: 'Press',
        moves: {
          0: p(220, 280),
          1: p(430, 200), 2: p(430, 340),
          3: p(720, 145), 4: p(620, 245), 5: p(640, 360),
          6: p(730, 205),
        },
        ball: p(768, 150),
      },
    ],
  },

  // ═══ 5-er ══════════════════════════════════════════════════
  {
    id: 'f5-121',
    name: '1-2-1 grunnoppstilling',
    description: 'Diamant: én bak, to på sidene og én på topp. Alle er med både i angrep og forsvar.',
    sport: 'football5', formation: '1-2-1',
    phases: [{ name: 'Start', ball: CENTER }],
  },
];

/** Løp kortere enn dette får ingen pil. I SVG-enheter. */
const MIN_RUN = 20;
/** Pilen starter og slutter litt unna brikken, så den ikke skjules under den. */
const GAP_START = 16, GAP_END = 20;

/** Løp og pasninger mellom to faser, kortet litt inn i begge ender. */
function between(a: Position, b: Position, make: typeof arrow): NewDrawing | null {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  if (len < MIN_RUN + GAP_START + GAP_END) return null;
  const ux = dx / len, uy = dy / len;
  return make(
    p(Math.round(a.x + ux * GAP_START), Math.round(a.y + uy * GAP_START)),
    p(Math.round(b.x - ux * GAP_END),   Math.round(b.y - uy * GAP_END)),
  );
}

/**
 * Malens faser som ekte faser, med nye id-er. Spillerne har samme id i alle
 * fasene, slik at avspillingen kan følge dem fra fase til fase.
 */
export function buildTemplatePhases(tpl: TacticTemplate, newId: () => string): TacticPhase[] {
  const slots = getFormationSlots(tpl.sport, tpl.formation);
  const ids = slots.map(() => `p-${newId()}`);

  // Posisjonene i hver fase: fasen før, pluss denne fasens flytt.
  const positions: Position[][] = [];
  tpl.phases.forEach((ph, i) => {
    const prev = i === 0 ? slots.map(s => s.position) : positions[i - 1];
    positions.push(prev.map((pos, slot) => ({ ...(ph.moves?.[slot] ?? pos) })));
  });

  return tpl.phases.map((ph, i) => {
    const next = positions[i + 1];
    const drawings: NewDrawing[] = [];
    if (next) {
      // Løp er piler, ballens vei er stiplet – slik trenere tegner det på tavla.
      positions[i].forEach((pos, slot) => {
        const run = between(pos, next[slot], arrow);
        if (run) drawings.push(run);
      });
      const ballPath = between(ph.ball, tpl.phases[i + 1].ball, pass);
      if (ballPath) drawings.push(ballPath);
    }
    drawings.push(...(ph.extra ?? []));

    return {
      id: `phase-${newId()}`,
      name: ph.name,
      players: slots.map((_, slot) => ({
        id: ids[slot], num: slot + 1, name: '', slotIdx: slot,
        position: positions[i][slot], notes: '',
      })),
      ball: { ...ph.ball },
      drawings: drawings.map(d => ({ ...d, id: newId() }) as Drawing),
      stickyNote: '',
    };
  });
}
