// ═══════════════════════════════════════════════════════════════
//  ØVELSESBIBLIOTEK – ferdigdefinerte drills
// ═══════════════════════════════════════════════════════════════
import { Drill } from '../types';

export const DRILL_LIBRARY: Drill[] = [

  // ─── BARNEIDRETT (5er/7er) ───────────────────────────────────

  {
    id: 'youth-rondo',
    name: 'Rondo 4+1',
    ageGroup: 'youth',
    sport: 'football',
    description: '4 spillere holder ballen mot 1 i midten. Fokus på raske touch og kommunikasjon.',
    steps: [
      { id: 's1', name: 'Oppstart', description: 'Plasser 4 spillere i firkant, 1 jager midt i.' },
      { id: 's2', name: 'Pasning', description: 'Spill rundt: maks 2 touch per spiller.' },
      { id: 's3', name: 'Bytte', description: 'Den som mister ballen går i midten.' },
    ],
  },
  {
    id: 'youth-pressing',
    name: 'Mini-pressing 3v3',
    ageGroup: 'youth',
    sport: 'football',
    description: 'Liten bane, tre mot tre. Gjenvinning er målet – ikke mål.',
    steps: [
      { id: 's1', name: 'Oppstart', description: 'Sett opp 3v3 på 15×10m bane.' },
      { id: 's2', name: 'Balltap = press', description: 'Laget som mister ballen presser øyeblikkelig.' },
      { id: 's3', name: 'Belønning', description: 'Laget som vinner ballen tilbake: 1 poeng.' },
    ],
  },
  {
    id: 'youth-passing-triangle',
    name: 'Pasnings-triangel',
    ageGroup: 'youth',
    sport: 'football',
    description: 'Grunnleggende triangelpasning for 7er-fotball.',
    steps: [
      { id: 's1', name: 'Form triangel', description: 'A passer til B, løper til Bs posisjon.' },
      { id: 's2', name: 'Kombinasjon', description: 'B passer til C, løper fremover.' },
      { id: 's3', name: 'Avslutning', description: 'C avslutter mot mål etter kombinasjonen.' },
    ],
  },
  {
    id: 'youth-gk-distribution',
    name: 'Keeper-utspark 5er',
    ageGroup: 'youth',
    sport: 'football',
    description: 'Keeper øver på å spille ut til back i 5er-fotball.',
    steps: [
      { id: 's1', name: 'Keeper klarer ball', description: 'Keeper tar ball fra angriper, stiller seg.' },
      { id: 's2', name: 'Se opp', description: 'Keeper ser etter åpen back i sidene.' },
      { id: 's3', name: 'Kort utspark', description: 'Rull ball til nærmeste back – ikke kast langt.' },
    ],
  },

  // ─── VOKSENIDRETT ────────────────────────────────────────────

  {
    id: 'adult-gegenpressing',
    name: 'Gegenpressing-struktur',
    ageGroup: 'adult',
    sport: 'football',
    description: 'Organisert pressing etter balltap basert på Klopp-prinsippet.',
    steps: [
      { id: 's1', name: 'Balltap', description: 'Øyeblikket du mister ballen: 3 nærmeste presser.' },
      { id: 's2', name: 'Blokkering', description: 'Press slik at motstander ikke kan spille fremover.' },
      { id: 's3', name: 'Komprimering', description: 'Resten av laget trekker seg inn og komprimerer.' },
      { id: 's4', name: 'Gjenvinning', description: 'Press inntil ball er gjenvunnet eller utgangslinje er nådd.' },
    ],
  },
  {
    id: 'adult-buildupplay',
    name: 'Oppbygging bakfra 4-3-3',
    ageGroup: 'adult',
    sport: 'football',
    description: 'Strukturert oppbygging fra keeper i 4-3-3-formasjon.',
    steps: [
      { id: 's1', name: 'Keeper starter', description: 'Keeper spiller kort til CB. Senterback tar imot vendt.' },
      { id: 's2', name: 'CB splitter', description: 'CB passer ut til fullback som er kommet høyt.' },
      { id: 's3', name: 'Fullback fremover', description: 'Fullback kombinerer med kantspiller i overlapping.' },
      { id: 's4', name: 'Innlegg eller kutt inn', description: 'Kantspiller velger: innlegg til spiss eller kutt inn.' },
    ],
  },
  {
    id: 'adult-setplay-corner',
    name: 'Corner-rutine (variant A)',
    ageGroup: 'adult',
    sport: 'football',
    description: 'Innøvd corner-rutine med to bevegelsesalternativer.',
    steps: [
      { id: 's1', name: 'Oppstilling', description: '2 spillere nær bortre stolpe, 2 ved 16m-linjen, 1 i bakkant.' },
      { id: 's2', name: 'Signal', description: 'Cornertaker løfter arm = variant A settes i gang.' },
      { id: 's3', name: 'Bevegelse', description: 'Nære stolpe-spillere krysser – en mot første stolpe, en mot bakkant.' },
      { id: 's4', name: 'Ball inn', description: 'Hard, flat ball til første stolpe for avslutningsmulighet.' },
    ],
  },
  {
    id: 'adult-hb-fastbreak',
    name: 'Kontring 7v6 (Håndball)',
    ageGroup: 'adult',
    sport: 'handball',
    description: 'Rask kontring etter redning – 7 mot 6 situasjon.',
    steps: [
      { id: 's1', name: 'Keeper redder', description: 'Keeper reder og ser opp øyeblikkelig.' },
      { id: 's2', name: 'Lang ball til fløy', description: 'Keeper kaster langt til fri fløy i full fart.' },
      { id: 's3', name: 'Senterlinje-support', description: 'Midtback løper parallelt som støttealternativ.' },
      { id: 's4', name: 'Avslutning', description: 'Fløy avslutter direkte eller spiller tilbake til midtback.' },
    ],
  },
  {
    id: 'adult-floorball-powerplay',
    name: 'Powerplay-posisjonering (Innebandy)',
    ageGroup: 'adult',
    sport: 'floorball',
    description: 'Effektiv 5v4-posisjonering i powerplay.',
    steps: [
      { id: 's1', name: 'Diamant-oppstilling', description: 'Sett opp diamant: 1 høy, 2 i siden, 1 nær mål.' },
      { id: 's2', name: 'Sirkulasjon', description: 'Spill raskt rundt i diamanten – tving forsvarerne å flytte.' },
      { id: 's3', name: 'Hull søkes', description: 'Når forsvarer er ute av posisjon: direkte skudd eller gjennomspill.' },
      { id: 's4', name: 'Rebounds', description: 'Nær-mål-spilleren er alltid klar for retur.' },
    ],
  },
];

export function getDrillsForContext(sport: string, ageGroup: 'youth' | 'adult'): Drill[] {
  return DRILL_LIBRARY.filter(d =>
    (d.sport === sport || d.sport === 'all') && d.ageGroup === ageGroup
  );
}
