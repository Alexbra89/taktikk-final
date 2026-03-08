// ═══════════════════════════════════════════════════════════════
//  ØVELSESBIBLIOTEK v2 – roterer ukentlig per sport
// ═══════════════════════════════════════════════════════════════
import { Drill, Sport } from '../types';

// Hjelper: ISO uke-nummer
export function getISOWeek(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

export const DRILL_LIBRARY: Drill[] = [
  // ══════════ FOTBALL – BARNEIDRETT ════════════════════════════
  {
    id: 'youth-rondo', name: 'Rondo 4+1', ageGroup: 'youth', sport: 'football',
    description: '4 spillere holder ballen mot 1 i midten. Raske touch og kommunikasjon.',
    steps: [
      { id: 's1', name: 'Oppstart', description: 'Plasser 4 spillere i firkant, 1 jager midt i.' },
      { id: 's2', name: 'Pasning', description: 'Spill rundt: maks 2 touch per spiller.' },
      { id: 's3', name: 'Bytte', description: 'Den som mister ballen går i midten.' },
    ],
  },
  {
    id: 'youth-pressing', name: 'Mini-pressing 3v3', ageGroup: 'youth', sport: 'football',
    description: 'Liten bane, tre mot tre. Gjenvinning er målet – ikke mål.',
    steps: [
      { id: 's1', name: 'Oppstart', description: 'Sett opp 3v3 på 15×10m bane.' },
      { id: 's2', name: 'Balltap = press', description: 'Laget som mister ballen presser øyeblikkelig.' },
      { id: 's3', name: 'Variasjon', description: 'Prøv med to berøringer maks.' },
    ],
  },
  {
    id: 'youth-triangle', name: 'Pasnings-triangel', ageGroup: 'youth', sport: 'football',
    description: 'Tre spillere løper og passer i triangel. Bygger automatikk.',
    steps: [
      { id: 's1', name: 'Grunnform', description: 'A passer til B, løper til Bs plass. B passer til C. Gjenta.' },
      { id: 's2', name: 'Tempo', description: 'Øk hastigheten, ett touch.' },
      { id: 's3', name: 'Med motstand', description: 'Legg inn en passiv forsvarspiller.' },
    ],
  },
  {
    id: 'youth-dribbling', name: 'Hinderløype – dribbling', ageGroup: 'youth', sport: 'football',
    description: 'Kjegler i slalåm. Fokus på ballkontroll og fotkjensle.',
    steps: [
      { id: 's1', name: 'Oppsett', description: 'Sett 8 kjegler med 1m mellomrom.' },
      { id: 's2', name: 'Driblekurs', description: 'Dribl gjennom med foretrukket fot.' },
      { id: 's3', name: 'Svak fot', description: 'Gjenta med svakeste fot.' },
      { id: 's4', name: 'Race', description: 'Konkurranse: hvem er raskest?' },
    ],
  },

  // ══════════ FOTBALL – VOKSEN ══════════════════════════════════
  {
    id: 'adult-gegenpressing', name: 'Gegenpressing 5v5', ageGroup: 'adult', sport: 'football',
    description: 'Umiddelbar gjenvinning etter balltap på halvplan. Klopp-stil.',
    steps: [
      { id: 's1', name: 'Posisjonering', description: 'Angripere komprimerer rommet rundt ballen.' },
      { id: 's2', name: 'Balltap = signal', description: 'Alle 5 løper mot ballen innen 3 sek.' },
      { id: 's3', name: 'Ut av press', description: 'Forsvar øver på å spille seg ut.' },
      { id: 's4', name: 'Overgang', description: 'Når gjenvinning: raskt framover i 3 touch.' },
    ],
  },
  {
    id: 'adult-433', name: 'Oppbygging 4-3-3', ageGroup: 'adult', sport: 'football',
    description: 'Strukturert oppbygging fra keeperen med 4-3-3. Triangler og frigjøring.',
    steps: [
      { id: 's1', name: 'Keeper + back 4', description: 'Keeper spiller til midtback. Backs brer seg bredt.' },
      { id: 's2', name: 'Midtbane åpner', description: 'Defensiv midtbane faller ned, skaper 3-mann bak.' },
      { id: 's3', name: 'Frigjør 8er', description: '8er roterer til indre korridor. Combo-spill.' },
      { id: 's4', name: 'Innspill til 9', description: 'Avslutning: innspill til spiss etter 5+ pasninger.' },
    ],
  },

  // ══════════ HÅNDBALL – BARNEIDRETT ════════════════════════════
  {
    id: 'hb-youth-passing', name: 'Grunnpasninger', ageGroup: 'youth', sport: 'handball',
    description: 'Enkle kastøvelser for nybegynnere. Rett arm, snapping i håndledd.',
    steps: [
      { id: 's1', name: 'Stående kast', description: 'Par vis: kast med dominant arm, 4m avstand.' },
      { id: 's2', name: 'Steg + kast', description: 'Ta tre steg, stopp, kast. Riktig fotarbeid.' },
      { id: 's3', name: 'Beveg mål', description: 'Kast mot mål fra 6m: midtskudd.' },
    ],
  },

  // ══════════ HÅNDBALL – VOKSEN ══════════════════════════════════
  {
    id: 'hb-adult-631', name: '6-3-1 forsvar', ageGroup: 'adult', sport: 'handball',
    description: 'Sone 6-0 med aggressive utbrekk. Koordinert rotasjon.',
    steps: [
      { id: 's1', name: 'Grunnsone', description: '6 forsvarsspillere på 6m-linjen, kompakt.' },
      { id: 's2', name: 'Utbrekk', description: 'Ytterste spiller bryter ut mot kantspiller ved innkast.' },
      { id: 's3', name: 'Rotasjon', description: 'Naboer fyller inn hullet etter utbrekk.' },
      { id: 's4', name: 'Gjenvinn', description: 'Hele sone reorganiseres innen 3 sek etter gjenvinning.' },
    ],
  }
]; // <--- Her var feilen i forrige forsøk, denne lukkende ] manglet!

// ─── Uke-rotasjon: velger 4 øvelser basert på ISO-ukenummer ──
export function getWeeklyDrills(sport: Sport, ageGroup: 'youth' | 'adult'): Drill[] {
  const pool = DRILL_LIBRARY.filter(d => d.sport === sport && d.ageGroup === ageGroup);
  if (pool.length === 0) return [];
  const week = getISOWeek();
  const offset = week % pool.length;
  const result: Drill[] = [];
  for (let i = 0; i < Math.min(4, pool.length); i++) {
    result.push(pool[(offset + i) % pool.length]);
  }
  return result;
}

// ─── Hent alle øvelser for kontekst ──────────────────────────
export function getDrillsForContext(sport: Sport, ageGroup: 'youth' | 'adult'): Drill[] {
  return DRILL_LIBRARY.filter(
    d => (d.sport === sport || d.sport === 'all') && d.ageGroup === ageGroup
  );
}