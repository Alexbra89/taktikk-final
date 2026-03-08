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
  {
    id: 'adult-corner', name: 'Corner-rutine A', ageGroup: 'adult', sport: 'football',
    description: 'Innøvd cornerrutine med blokkere og fri-løper.',
    steps: [
      { id: 's1', name: 'Blokkere', description: '2 spillere setter blokker ved 5-meteren og 11-meteren.' },
      { id: 's2', name: 'Fri-løper', description: 'Nr. 9 starter i bakre post, eksploderer mot fri-løp.' },
      { id: 's3', name: 'Signal', description: 'Cornerslår viser med arm: innsvinger eller utsvinger.' },
      { id: 's4', name: 'Drill 10x', description: 'Repeter til alle treffer rett zone.' },
    ],
  },
  {
    id: 'adult-highline', name: 'Høy forsvarslinje', ageGroup: 'adult', sport: 'football',
    description: 'Presser angripere med høy off-side-linje og koordinert pressing.',
    steps: [
      { id: 's1', name: 'Linjeplassering', description: 'Back 4 holder linje 35m fra egen mål.' },
      { id: 's2', name: 'Signal', description: 'Midtback leder linjen med stemme.' },
      { id: 's3', name: 'Off-side drill', description: 'Assistent flaggøvelse med løpende angripere.' },
      { id: 's4', name: 'Pressing trigger', description: 'Motspiller bakover = rykk fremover av hele linjen.' },
    ],
  },
  {
    id: 'adult-setpiece-free', name: 'Frispark-variasjon', ageGroup: 'adult', sport: 'football',
    description: 'To frispark-varianter: direkte og indirekte opplegg.',
    steps: [
      { id: 's1', name: 'Direkte', description: 'Skytter øver på mur + keeper: kurving over mur.' },
      { id: 's2', name: 'Variant B', description: '2-mann: A spiller til B som skyter første touch.' },
      { id: 's3', name: 'Variant C', description: 'A finter skudd, B løper forbi og skyter.' },
      { id: 's4', name: 'Gjennomgang', description: 'Velg primær og backup-variant for neste kamp.' },
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
  {
    id: 'hb-youth-fastbreak', name: 'Kontring 3v2', ageGroup: 'youth', sport: 'handball',
    description: 'Rask overgang: 3 angripere mot 2 forsvarere.',
    steps: [
      { id: 's1', name: 'Start', description: 'Tre angripere løper fra midtlinje mot 2 forsvarere.' },
      { id: 's2', name: 'Pasningsspill', description: 'Bruk bredde: kant til kant via midtspiller.' },
      { id: 's3', name: 'Avslutning', description: 'Skudd når forsvar er ute av posisjon.' },
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
  },
  {
    id: 'hb-adult-pivot', name: 'Strek-spill', ageGroup: 'adult', sport: 'handball',
    description: 'Frigjøring av strekspiller med krysninger og blokkspill.',
    steps: [
      { id: 's1', name: 'Blokkspill', description: 'Strek setter blokk for kant. Kant løper fri.' },
      { id: 's2', name: 'Kryss', description: 'Høyre back og strek krysser. Strek mottar ved 6m.' },
      { id: 's3', name: 'Gjennombrudd', description: 'Back driver mot mål, strek blokkerer sin forsvarer.' },
      { id: 's4', name: 'Skudd', description: 'Strek mottar og skyter fall-skudd eller vrist.' },
    ],
  },
  {
    id: 'hb-adult-fastbreak', name: 'Kontring etter gjenvinning', ageGroup: 'adult', sport: 'handball',
    description: 'Organisert overgang fra forsvar til angrep på 5 sek.',
    steps: [
      { id: 's1', name: 'Keeper + 1', description: 'Keeper kaster umiddelbart til løpende kant.' },
      { id: 's2', name: '3-mann kontring', description: 'Kant + 2 løper forbi motstanders forsvar.' },
      { id: 's3', name: 'Avslutning', description: 'Tomgang: kast til strek eller direkte på keeper.' },
    ],
  },

// ─── Uke-rotasjon: velger 4 øvelser basert på ISO-ukenummer ──
export function getWeeklyDrills(sport: Sport, ageGroup: 'youth' | 'adult'): Drill[] {
  const pool    = DRILL_LIBRARY.filter(d => d.sport === sport && d.ageGroup === ageGroup);
  if (pool.length === 0) return [];
  const week    = getISOWeek();
  const offset  = week % pool.length;
  // Roter gjennom biblioteket, vis 4 per uke
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
