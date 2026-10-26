// src/data/drillAnimations/forsvar.ts
// Animasjoner for forsvarsøvelser. Bare det som står i øvelsesteksten:
// antall spillere, oppsett og forløp. Posisjoner i meter fra banens midtpunkt.
import { defineDrillAnimation } from '@/features/drill-animation/define';

/**
 * forsvar-y-05: en angriper prøver å score i et småmål fra 8–10 m, mens en
 * forsvarer ved siden av målet rykker ut og blokkerer skuddet med kroppen.
 * Forsvareren rykker ut samtidig som angriperen tar touchen frem; så kommer
 * skuddet, og forsvareren blokkerer det med fremsiden av kroppen.
 * Minste antall (4): én angriper og én forsvarer om gangen, de to andre venter ved startplassene.
 */
const MURBYGGERNE = defineDrillAnimation({
  drillId: 'forsvar-y-05',
  name: 'Murbyggerne (blokkere skudd)',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'att' },
    f: { label: 'F', family: 'def' },
    a2: { label: '', family: 'att' },
    f2: { label: '', family: 'def' },
  },
  // Åpningen mot angriperen (høyre).
  items: [{ id: 'smaamaal', type: 'minigoal', at: [-8, 0], rotation: 270 }],
  phases: [
    {
      name: 'Start',
      text: 'Angriperen står klar med ball 10 m fra småmålet. Forsvareren står ved siden av målet.',
      players: { a: [2, 0], f: [-8, 2.5], a2: [4, 0], f2: [-8, 4.6] },
      ball: { with: 'a', dir: [-1, 0] },
    },
    {
      name: 'Touch og utrykning',
      text: 'Angriperen tar et touch frem og gjør seg klar til skudd. Samtidig rykker forsvareren ut.',
      players: { a: [1, 0], f: [-4.6, 0.9] },
      ball: { with: 'a', dir: [-1, 0] },
    },
    {
      name: 'Skudd og blokk',
      text: 'Angriperen skyter mot småmålet. Forsvareren gjør seg stor og blokkerer med fremsiden av kroppen.',
      highlight: 'Blokk!',
      kick: 'shot',
      players: { f: [-5, 0.2] },
      ball: { with: 'f', dir: [1, 0] },
    },
  ],
});

/** forsvar-y-09: pasningslegger 12–15 m unna, forsvareren bak angriperen kommer foran og bryter. */
const BRYTEREN = defineDrillAnimation({
  drillId: 'forsvar-y-09',
  name: 'Bryteren (komme foran og bryte pasningen)',
  sport: 'football5',
  cast: {
    p: { label: 'P', family: 'mid' },
    a: { label: 'A', family: 'att' },
    f: { label: 'F', family: 'def' },
  },
  phases: [
    {
      name: 'Oppstilling',
      text: 'Pasningsleggeren står 12–15 m unna. Forsvareren står tett bak angriperen.',
      players: { p: [-8, 0], a: [5, 0], f: [6.6, 0] },
      ball: { with: 'p', dir: [1, 0] },
    },
    {
      name: 'Møteløp',
      text: 'Angriperen gjør et lite møteløp mot pasningen. Forsvareren har tett kontakt i ryggen.',
      players: { a: [3.5, 0], f: [5.1, 0] },
      ball: { with: 'p', dir: [1, 0] },
    },
    // Forsvareren går rundt angriperen i to steg, så figurene ikke glir gjennom hverandre.
    {
      name: 'Orienterer seg',
      text: 'Forsvareren leser pasningen og orienterer seg.',
      players: { f: [4.8, 2.1] },
      ball: { with: 'p', dir: [1, 0] },
    },
    {
      name: 'Brudd',
      text: 'Pasningen slås. Forsvareren går eksplosivt foran angriperen og bryter pasningen.',
      highlight: 'Brudd!',
      players: { a: [3.2, 0], f: [1.5, 1.75] },
      ball: { with: 'f', dir: [-1, -1] },
    },
    {
      name: 'Ut av sonen',
      text: 'Forsvareren fører ballen ut av sonen.',
      players: { f: [1, 6] },
      ball: { with: 'f', dir: [0, 1] },
    },
  ],
});

/**
 * forsvar-y-02: sone 10×10 m med to kjegler på bakkantlinjen, ca. 4 m fra
 * hverandre. Forsvareren står 3 m foran angriperen, spiller ballen til
 * angriperen og rykker ut. Angriperen prøver å nå en kjegle; forsvareren
 * nekter nærmeste kjegle og tvinger angriperen ut mot kanten.
 * Minste antall (4): én angriper og én forsvarer om gangen, de to andre venter.
 */
const KJEGLEFANGEREN = defineDrillAnimation({
  drillId: 'forsvar-y-02',
  name: 'Kjeglefangeren (1 mot 1: lede og skjerme)',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'att' },
    f: { label: 'F', family: 'def' },
    a2: { label: '', family: 'att' },
    f2: { label: '', family: 'def' },
  },
  items: [
    { id: 'kjegle-1', type: 'cone', at: [5, -2] },
    { id: 'kjegle-2', type: 'cone', at: [5, 2] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Sone 10×10 m med to kjegler på bakkantlinjen. Forsvareren står 3 m foran angriperen med ballen.',
      players: { a: [-4.5, 0], f: [-1.5, 0], a2: [-6.5, 0], f2: [-1.5, -6.5] },
      ball: { with: 'f', dir: [-1, 0.5] },
    },
    {
      name: 'Start',
      text: 'Forsvareren spiller ballen til angriperen og rykker ut for å presse.',
      players: { f: [-2.6, 0.4] },
      ball: { with: 'a', dir: [0.6, -1] },
    },
    {
      name: 'Angrep',
      text: 'Angriperen prøver å finne en luke mot en av kjeglene.',
      players: { a: [-2.2, -2.2], f: [-0.6, -1.4] },
      ball: { with: 'a', dir: [1, -1] },
    },
    {
      name: 'Ledning',
      text: 'Forsvareren vrir kroppen, nekter nærmeste kjegle og tvinger angriperen ut mot kanten.',
      players: { a: [0.5, -4.4], f: [1.8, -2.6] },
      ball: { with: 'a', dir: [1, -0.3] },
    },
  ],
});

/**
 * forsvar-y-04: korridor 12×5 m. Angriperen starter i den ene enden,
 * forsvareren i den andre. Forsvareren rykker frem, bremser 1–2 m foran og
 * avventer. Slår angriperen ballen for langt frem, går forsvareren inn med en
 * ren takling og fører ballen ut av korridoren.
 * Minste antall (4): ett par om gangen, de to andre venter i hver sin ende.
 */
const TALMODIGHETEN = defineDrillAnimation({
  drillId: 'forsvar-y-04',
  name: 'Tålmodigheten (vinne ballen i riktig øyeblikk)',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'att' },
    f: { label: 'F', family: 'def' },
    a2: { label: '', family: 'att' },
    f2: { label: '', family: 'def' },
  },
  items: [
    { id: 'hjorne-1', type: 'cone', at: [-6, -2.5] },
    { id: 'hjorne-2', type: 'cone', at: [6, -2.5] },
    { id: 'hjorne-3', type: 'cone', at: [-6, 2.5] },
    { id: 'hjorne-4', type: 'cone', at: [6, 2.5] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Korridor 12×5 m. Angriperen starter med ball i den ene enden, forsvareren i den andre.',
      players: { a: [-5.5, 0], f: [5.5, 0], a2: [-7.8, 0], f2: [7.8, 0] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Avvent',
      text: 'Forsvareren rykker frem, bremser 1–2 m foran angriperen og avventer.',
      players: { a: [-3, 0], f: [-1.1, 0.5] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Takling',
      text: 'Angriperen slår ballen for langt frem. Forsvareren går inn med en ren takling med innsiden av foten.',
      players: { a: [-2.8, -0.1], f: [-1.2, 0.3] },
      ball: { with: 'f', dir: [0.6, 1] },
    },
    {
      name: 'Ut av korridoren',
      text: 'Forsvareren fører ballen ut av korridoren.',
      players: { f: [-0.6, 3.6] },
      ball: { with: 'f', dir: [0, 1] },
    },
  ],
});

/**
 * forsvar-y-06: angriperen starter 20 m fra mål, forsvareren 3 m bak og litt
 * til siden. Treneren triller ballen frem til angriperen, som løper mot mål.
 * Forsvareren spurter tilbake, kommer inn på rett side (mellom angriper og
 * mål) og tar ballen rent.
 * Minste antall (4): ett par om gangen, det andre paret venter. Pluss treneren.
 */
const RASK_HJEMJOBB = defineDrillAnimation({
  drillId: 'forsvar-y-06',
  name: 'Rask hjemjobb (returløp og takling)',
  sport: 'football7',
  cast: {
    t: { label: 'T', family: 'mid' },
    a: { label: 'A', family: 'att' },
    f: { label: 'F', family: 'def' },
    a2: { label: '', family: 'att' },
    f2: { label: '', family: 'def' },
  },
  phases: [
    {
      name: 'Start',
      text: 'Angriperen starter 20 m fra mål, forsvareren 3 m bak og litt til siden. Treneren har ballen.',
      players: { t: [4, -3.5], a: [10, 0], f: [7, 1], a2: [8, -8], f2: [5.5, -8] },
      ball: { with: 't', dir: [1, 0.6] },
    },
    {
      name: 'Serve',
      text: 'Treneren triller ballen frem til angriperen, som løper mot mål. Forsvareren spurter tilbake.',
      players: { a: [14, 0], f: [11.5, 2.4] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Returløp',
      text: 'Forsvareren spurter tilbake ved siden av angriperen.',
      players: { a: [19, 0], f: [19.5, 2.8] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Rett side',
      text: 'Forsvareren kommer inn på rett side, mellom angriperen og mål.',
      players: { a: [21, 0], f: [24.5, 0.6] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Takling',
      text: 'Forsvareren tar ballen rent (eller presser den over dødlinjen).',
      highlight: 'Ren takling!',
      players: {},
      ball: { with: 'f', dir: [-0.3, 1] },
    },
  ],
});

/**
 * forsvar-y-07: bane 12×12 m med ett mål i enden. Angriperen starter med
 * ball i motsatt ende. Forsvarer 1 rykker ut og støter, forsvarer 2 sikrer
 * 3–4 m bak, på skrå. Dribler angriperen forbi forsvarer 1, tar forsvarer 2 over.
 * 6 spillere: én angriper og to forsvarere om gangen, de tre andre venter.
 */
const DOBBELTMUREN = defineDrillAnimation({
  drillId: 'forsvar-y-07',
  name: 'Dobbeltmuren (2 mot 1: press og sikring)',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'att' },
    f1: { label: 'F1', family: 'def' },
    f2: { label: 'F2', family: 'def' },
    a2: { label: '', family: 'att' },
    f3: { label: '', family: 'def' },
    f4: { label: '', family: 'def' },
  },
  // Åpningen mot angriperen (venstre).
  items: [
    { id: 'maal', type: 'minigoal', at: [6, 0], rotation: 90 },
    { id: 'hjorne-1', type: 'cone', at: [-6, -6] },
    { id: 'hjorne-2', type: 'cone', at: [6, -6] },
    { id: 'hjorne-3', type: 'cone', at: [-6, 6] },
    { id: 'hjorne-4', type: 'cone', at: [6, 6] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Bane 12×12 m med mål i enden. Angriperen starter med ball i motsatt ende.',
      players: { a: [-5.5, 0], f1: [2.5, 0], f2: [4.5, 1.5], a2: [-8, 0], f3: [8, 3], f4: [8, -3] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Press og sikring',
      text: 'Forsvarer 1 rykker ut og støter på ballføreren. Forsvarer 2 sikrer 3–4 m bak, på skrå.',
      players: { a: [-3.5, 0], f1: [-1.5, 0.3], f2: [1.7, 2.3] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Dribling',
      text: 'Angriperen prøver å drible forbi Forsvarer 1.',
      players: { a: [-3, -2], f1: [-1.6, -0.4] },
      ball: { with: 'a', dir: [1, -0.3] },
    },
    {
      name: 'Forbi',
      text: 'Angriperen kommer forbi Forsvarer 1.',
      players: { a: [0.4, -2.6] },
      ball: { with: 'a', dir: [1, 0.3] },
    },
    {
      name: 'Overtakelse',
      text: 'Forsvarer 2 tar over og støter på angriperen.',
      players: { f2: [2.2, -1.4] },
      ball: { with: 'a', dir: [1, 0.3] },
    },
  ],
});

/**
 * forsvar-y-08: bane 15×12 m med to små kjegleporter i hver ende. Angriper A
 * og B spiller til hverandre. Har A ballen, støter forsvarer 1 på A og
 * forsvarer 2 faller av i sikring mot B. Spilles ballen til B, støter
 * forsvarer 2 på B og forsvarer 1 sikrer.
 */
const KOMPAKT = defineDrillAnimation({
  drillId: 'forsvar-y-08',
  name: '2 mot 2 kompakt (sidelengs forflytning)',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'att' },
    b: { label: 'B', family: 'att' },
    f1: { label: 'F1', family: 'def' },
    f2: { label: 'F2', family: 'def' },
  },
  items: [
    { id: 'port-1a', type: 'cone', at: [-7.5, -4] },
    { id: 'port-1b', type: 'cone', at: [-7.5, -2] },
    { id: 'port-2a', type: 'cone', at: [-7.5, 2] },
    { id: 'port-2b', type: 'cone', at: [-7.5, 4] },
    { id: 'port-3a', type: 'cone', at: [7.5, -4] },
    { id: 'port-3b', type: 'cone', at: [7.5, -2] },
    { id: 'port-4a', type: 'cone', at: [7.5, 2] },
    { id: 'port-4b', type: 'cone', at: [7.5, 4] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Bane 15×12 m med to små kjegleporter i hver ende. Angriper A og B mot to forsvarere i midten.',
      players: { a: [-4, -3], b: [-4, 3], f1: [2, -3], f2: [2, 3] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Press på A',
      text: 'A har ballen: Forsvarer 1 støter på A, og Forsvarer 2 faller av i sikring mot B.',
      players: { f1: [-2, -2.6], f2: [2, 0.5] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Press på B',
      text: 'Ballen spilles til B: Forsvarer 2 støter på B, og Forsvarer 1 sikrer.',
      players: { f1: [2, -0.5], f2: [-2, 2.6] },
      ball: { with: 'b', dir: [1, 0] },
    },
    {
      name: 'Tilbake til A',
      text: 'Ballen spilles tilbake til A, og forsvarerne flytter seg sidelengs igjen.',
      players: { f1: [-2, -2.6], f2: [2, 0.5] },
      ball: { with: 'a', dir: [1, 0] },
    },
  ],
});

/**
 * forsvar-y-13: angriper og forsvarer løper side om side i moderat tempo,
 * med ballen mellom seg. Treneren roper «NÅ!», og forsvareren gjør en
 * støttakling med innsiden av foten mens angriperen gir moderat motstand.
 * 4 spillere er to par med hver sin ball; brettet har én ball, så ett par vises.
 */
const TAKLINGSMESTEREN = defineDrillAnimation({
  drillId: 'forsvar-y-13',
  name: 'Taklingsmesteren (timing av støttakling)',
  sport: 'football5',
  cast: {
    t: { label: 'T', family: 'mid' },
    a: { label: 'A', family: 'att' },
    f: { label: 'F', family: 'def' },
  },
  phases: [
    {
      name: 'Oppstilling',
      text: 'Angriper og forsvarer står side om side, med ballen mellom seg. Treneren står ved siden av.',
      players: { t: [-1, 5.5], a: [-8, -1.4], f: [-8, 1.4] },
      ball: { with: 'f', dir: [1, -1] },
    },
    {
      name: 'Løp',
      text: 'De løper side om side i moderat tempo, med ballen mellom seg.',
      players: { a: [-3, -1.4], f: [-3, 1.4] },
      ball: { with: 'f', dir: [1, -1] },
    },
    {
      name: 'Signal',
      text: 'Treneren roper «NÅ!».',
      highlight: 'NÅ!',
      players: { a: [1.5, -1.4], f: [1.5, 1.4] },
      ball: { with: 'f', dir: [1, -1] },
    },
    {
      name: 'Takling',
      text: 'Forsvareren setter standfoten ved ballen og går stivt gjennom den. Angriperen gir moderat motstand.',
      players: { a: [2.5, -1.4], f: [2.5, 1.4] },
      ball: { with: 'f', dir: [1, -1] },
    },
  ],
});

/**
 * forsvar-a-01: korridor 15×8 m langs sidelinjen. Angriperen starter i den
 * ene enden med ball, forsvareren møter fra motsatt ende og står mellom
 * angriperen og banen. Forsvareren bremser 1,5 m foran, leder angriperen ut
 * mot sidelinjen og vinner ballen når den slippes for langt frem.
 * Minste antall (4): ett par om gangen, de to andre venter i hver sin ende.
 */
const KANALFORSVAR = defineDrillAnimation({
  drillId: 'forsvar-a-01',
  name: '1 mot 1 kanalforsvar (lede og tvinge feil)',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'att' },
    f: { label: 'F', family: 'def' },
    a2: { label: '', family: 'att' },
    f2: { label: '', family: 'def' },
  },
  // Korridoren langs øvre sidelinje (y = -15).
  items: [
    { id: 'hjorne-1', type: 'cone', at: [-7.5, -7] },
    { id: 'hjorne-2', type: 'cone', at: [7.5, -7] },
    { id: 'hjorne-3', type: 'cone', at: [-7.5, -14.9] },
    { id: 'hjorne-4', type: 'cone', at: [7.5, -14.9] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Korridor 15×8 m langs sidelinjen. Angriperen starter med ball, forsvareren i motsatt ende.',
      players: { a: [-7, -11], f: [7, -10], a2: [-9.3, -5], f2: [9.5, -5] },
      ball: { with: 'a', dir: [1, -0] },
    },
    {
      name: 'Utrykning',
      text: 'Forsvareren støter ut i høy fart, bremser 1,5 m foran angriperen og står halvåpen.',
      players: { a: [-4.5, -11.2], f: [-3, -10.4] },
      ball: { with: 'a', dir: [1, -0.8] },
    },
    {
      name: 'Lede',
      text: 'Kroppsstillingen lukker sporet inn mot banen og tvinger angriperen ut mot sidelinjen.',
      players: { a: [-1.5, -13.4], f: [-0.4, -12] },
      ball: { with: 'a', dir: [1, -0.4] },
    },
    {
      name: 'Vinne ball',
      text: 'Angriperen slipper ballen for langt frem, og forsvareren går inn og vinner den.',
      players: { a: [-0.8, -13.6], f: [1.4, -12.6] },
      ball: { with: 'f', dir: [0.6, -1] },
    },
  ],
});

/**
 * forsvar-a-03: sone 30×20 m. En forsvarsfirer (to backer, to stoppere) med
 * 8–10 m mellom hver, og linja aldri over 25–30 m. Fire angripere på
 * midtbanen spiller ballen på tvers uten press. Fireren skyver samlet mot
 * ballsiden. Får kantspilleren ballen, støter backen ut, nærmeste stopper
 * sikrer, og motsatt back trekker inn.
 */
const FIRERLINJEN = defineDrillAnimation({
  drillId: 'forsvar-a-03',
  name: 'Firerlinjen som enhet (kollektiv sideforskyvning)',
  sport: 'football',
  cast: {
    b1: { label: 'B', family: 'def' },
    s1: { label: 'S', family: 'def' },
    s2: { label: 'S', family: 'def' },
    b2: { label: 'B', family: 'def' },
    k1: { label: 'A', family: 'att' },
    m1: { label: 'A', family: 'att' },
    m2: { label: 'A', family: 'att' },
    k2: { label: 'A', family: 'att' },
  },
  items: [
    { id: 'hjorne-1', type: 'cone', at: [-10, -14.5] },
    { id: 'hjorne-2', type: 'cone', at: [10, -14.5] },
    { id: 'hjorne-3', type: 'cone', at: [-10, 14.5] },
    { id: 'hjorne-4', type: 'cone', at: [10, 14.5] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Sone 30×20 m. Forsvarsfireren står med ca. 8 m mellom hver. Fire angripere foran.',
      players: {
        b1: [6, -12], s1: [6, -4], s2: [6, 4], b2: [6, 12],
        k1: [-4, -12], m1: [-4, -4], m2: [-4, 4], k2: [-4, 12],
      },
      ball: { with: 'm2', dir: [0, -1] },
    },
    {
      name: 'På tvers',
      text: 'Angriperne spiller ballen på tvers. Fireren skyver samlet mot den siden ballen er på.',
      players: { b1: [6, -14.5], s1: [6, -6.5], s2: [6, 1.5], b2: [6, 9.5] },
      ball: { with: 'm1', dir: [0, -1] },
    },
    {
      name: 'Press på kant',
      text: 'Kantspilleren får ballen: backen støter ut, nærmeste stopper sikrer, motsatt back trekker inn.',
      players: { b1: [1, -12.5], s1: [5, -9], s2: [6, -2], b2: [6.5, 5] },
      ball: { with: 'k1', dir: [1, 0] },
    },
    {
      name: 'Inn igjen',
      text: 'Ballen spilles inn igjen. Fireren samler seg og skyver mot ballen.',
      players: { b1: [6, -14.5], s1: [6, -6.5], s2: [6, 1.5], b2: [6, 9.5] },
      ball: { with: 'm1', dir: [0, 1] },
    },
    {
      name: 'Andre siden',
      text: 'Ballen spilles over til den andre siden, og fireren skyver samlet etter.',
      players: { b1: [6, -9.5], s1: [6, -1.5], s2: [6, 6.5], b2: [6, 14.5] },
      ball: { with: 'm2', dir: [0, 1] },
    },
  ],
});

export const FORSVAR_ANIMATIONS = [
  MURBYGGERNE, BRYTEREN, KJEGLEFANGEREN, TALMODIGHETEN, RASK_HJEMJOBB, DOBBELTMUREN, KOMPAKT, TAKLINGSMESTEREN,
  KANALFORSVAR, FIRERLINJEN,
];
