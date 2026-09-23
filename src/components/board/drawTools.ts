import type { DrawColorKey, DrawingType, NewDrawing, Position } from '../../types';

// ══════════════════════════════════════════════════════════════
//  TEGNEVERKTØY – fra pekerbevegelse til lagret tegning
//  Pekeren gir alltid en rekke punkter. Hvert verktøy bestemmer selv
//  hvilke av dem det bruker: frihånd tar alt, pil tar første og siste,
//  sirkel og rektangel tar ytterpunktene av draget.
// ══════════════════════════════════════════════════════════════

// ─── Tegnefarger ──────────────────────────────────────────────
// Strekene er notater oppå banen, og må kunne skilles fra hverandre og fra
// de røde brikkene. Hver farge har to varianter: lys på kveldsbanen, mørk
// på dagslysbanen, begge med minst 4,5:1 mot banen. Tegningen males med
// CSS-variabelen, så den følger temaet – også i PNG og video, der var()
// byttes ut med verdien temaet har når eksporten lages.
// Verdiene står også i globals.css (--k-draw-*). Hold dem like.
export const DRAW_PALETTE: { key: DrawColorKey; label: string; night: string; day: string }[] = [
  { key: 'white',  label: 'Hvit',    night: '#FFFFFF', day: '#1A1A1A' },
  { key: 'blue',   label: 'Blå',     night: '#5B9BF8', day: '#1E40AF' },
  { key: 'green',  label: 'Grønn',   night: '#22C55E', day: '#14713A' },
  { key: 'yellow', label: 'Gul',     night: '#EAB308', day: '#8A5A06' },
  { key: 'orange', label: 'Oransje', night: '#F97316', day: '#B03A0B' },
];

/** Fargen som følger temaet. */
export const drawPaint = (key: DrawColorKey) => `rgb(var(--k-draw-${key}))`;

/** Feltene en ny tegning får: nøkkelen, og kveldsfargen som hex for eldre versjoner. */
export const colorFields = (key: DrawColorKey) =>
  ({ colorKey: key, color: DRAW_PALETTE.find(c => c.key === key)!.night });

const isKey = (v: unknown): v is DrawColorKey => DRAW_PALETTE.some(c => c.key === v);

/** Paletten før temafargene. De fleste lagrede tegninger har en av disse. */
const LEGACY: [string, DrawColorKey][] = [
  ['#EDEDEF', 'white'], ['#6E93E6', 'blue'], ['#5BAE84', 'green'], ['#D9A93E', 'yellow'], ['#E8834A', 'orange'],
];

function rgbOf(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Nærmeste palettfarge til en hex – for tegninger lagret før temafargene. Ukjent blir hvit. */
export function nearestColorKey(hex: string): DrawColorKey {
  const rgb = rgbOf(hex);
  if (!rgb) return 'white';
  const known: [string, DrawColorKey][] = [
    ...LEGACY,
    ...DRAW_PALETTE.flatMap(c => [[c.night, c.key], [c.day, c.key]] as [string, DrawColorKey][]),
  ];
  let best: DrawColorKey = 'white', bestD = Infinity;
  for (const [h, key] of known) {
    const [r, g, b] = rgbOf(h)!;
    const d = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
}

/** Palettfargen en tegning skal males med. */
export const drawingColorKey = (d: { colorKey?: unknown; color?: unknown }): DrawColorKey =>
  isKey(d.colorKey) ? d.colorKey : typeof d.color === 'string' ? nearestColorKey(d.color) : 'white';

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
export function buildDrawing(tool: DrawingType, pts: Position[], colorKey: DrawColorKey): NewDrawing | null {
  if (pts.length < 2) return null;
  const color = colorFields(colorKey);
  const a = pts[0], b = pts[pts.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);

  switch (tool) {
    case 'freehand':
      // Samme terskel som før verktøyene kom. Uten type, som alle eldre streker.
      return pts.length > 2 ? { pts: [...pts], ...color } : null;
    case 'arrow':
    case 'dashed':
      return len >= MIN_SIZE ? { type: tool, pts: [a, b], ...color } : null;
    case 'curved-arrow':
      return len >= MIN_SIZE ? { type: tool, pts: [a, curveControl(pts), b], ...color } : null;
    case 'circle':
      return len >= MIN_SIZE ? { type: tool, start: a, end: b, ...color } : null;
    case 'rectangle':
      return Math.abs(b.x - a.x) >= MIN_SIZE && Math.abs(b.y - a.y) >= MIN_SIZE
        ? { type: tool, start: a, end: b, ...color } : null;
    case 'label':
      return null;
  }
}
