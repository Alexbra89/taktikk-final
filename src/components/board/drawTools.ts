import type { DrawingType, NewDrawing, Position } from '../../types';

// ══════════════════════════════════════════════════════════════
//  TEGNEVERKTØY – fra pekerbevegelse til lagret tegning
//  Pekeren gir alltid en rekke punkter. Hvert verktøy bestemmer selv
//  hvilke av dem det bruker: frihånd tar alt, pil tar første og siste,
//  sirkel og rektangel tar ytterpunktene av draget.
// ══════════════════════════════════════════════════════════════

// Tegnefargene er bevisst ikke Kalk-tokens: strekene er notater oppå banen,
// og må kunne skilles fra hverandre og fra de røde brikkene.
export const DRAW_COLORS = ['#EDEDEF', '#6E93E6', '#5BAE84', '#D9A93E', '#E8834A'];

export const DRAW_TOOLS: { type: DrawingType; label: string }[] = [
  { type: 'freehand',     label: 'Frihånd' },
  { type: 'arrow',        label: 'Rett pil' },
  { type: 'curved-arrow', label: 'Buet pil' },
  { type: 'dashed',       label: 'Stiplet linje' },
  { type: 'circle',       label: 'Sirkel' },
  { type: 'rectangle',    label: 'Rektangel' },
  { type: 'label',        label: 'Tekst' },
];

export const LABEL_MAX_LENGTH = 40;

/** Kortere drag enn dette er et trykk, ikke en figur. I SVG-enheter. */
const MIN_SIZE = 12;
/** Buet pil: et drag som avviker mindre enn dette fra rett linje får standardbuen. */
const MIN_BEND = 10;
/** Standardbuen, som andel av pilens lengde. */
const DEFAULT_BEND = 0.2;

/**
 * Kontrollpunktet til en kvadratisk Bézier som følger draget.
 * Punktet i draget som ligger lengst fra den rette linja brukes som
 * kurvens toppunkt (t = 0,5). Da gir C = 2·topp − midtpunkt en kurve som
 * går gjennom det punktet brukeren faktisk dro via.
 */
function curveControl(pts: Position[]): Position {
  const a = pts[0], b = pts[pts.length - 1];
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

  let peak = mid, peakDist = 0;
  for (const p of pts) {
    const dist = ((p.x - a.x) * dy - (p.y - a.y) * dx) / len; // fortegnet avstand fra linja
    if (Math.abs(dist) > Math.abs(peakDist)) { peakDist = dist; peak = p; }
  }

  if (Math.abs(peakDist) < MIN_BEND) {
    // Rett drag: bøy mot venstre sett i pilens retning.
    const h = len * DEFAULT_BEND;
    peak = { x: mid.x + (dy / len) * h, y: mid.y - (dx / len) * h };
  }
  return { x: 2 * peak.x - mid.x, y: 2 * peak.y - mid.y };
}

/**
 * Gjør et drag om til en tegning, eller null hvis draget er for lite til å bli noe.
 * Brukes både til forhåndsvisning under draget og til det som lagres.
 * Tekst lages ikke her: den trenger innhold fra brukeren først.
 */
export function buildDrawing(tool: DrawingType, pts: Position[], color: string): NewDrawing | null {
  if (pts.length < 2) return null;
  const a = pts[0], b = pts[pts.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);

  switch (tool) {
    case 'freehand':
      // Samme terskel som før verktøyene kom. Uten type, som alle eldre streker.
      return pts.length > 2 ? { pts: [...pts], color } : null;
    case 'arrow':
    case 'dashed':
      return len >= MIN_SIZE ? { type: tool, pts: [a, b], color } : null;
    case 'curved-arrow':
      return len >= MIN_SIZE ? { type: tool, pts: [a, curveControl(pts), b], color } : null;
    case 'circle':
      return len >= MIN_SIZE ? { type: tool, start: a, end: b, color } : null;
    case 'rectangle':
      return Math.abs(b.x - a.x) >= MIN_SIZE && Math.abs(b.y - a.y) >= MIN_SIZE
        ? { type: tool, start: a, end: b, color } : null;
    case 'label':
      return null;
  }
}
