// src/data/drillAnimations/keeper.ts
// Animasjoner for keeperøvelser. Bare det som står i øvelsesteksten:
// antall spillere, oppsett og forløp. Posisjoner i meter fra banens midtpunkt.
// Målet er det store målet til høyre (x = halve banelengden).
import { defineDrillAnimation } from '@/features/drill-animation/define';

/**
 * keeper-y-02: lite mål (3–4 m) laget med kjegler. Treneren står 8 m unna
 * med 5–6 baller og triller dem én og én langs bakken. Keeperen rykker frem,
 * setter kroppen bak ballen og trekker den inn til brystet.
 * Minste antall (2): trener og keeper. Fire av ballene ligger klare hos treneren.
 */
const BALLSKJOLDET = defineDrillAnimation({
  drillId: 'keeper-y-02',
  name: 'Ballskjoldet (gripe ball langs bakken)',
  sport: 'football5',
  cast: {
    t: { label: 'T', family: 'mid' },
    k: { label: 'K', family: 'gk' },
  },
  items: [
    { id: 'stolpe-1', type: 'cone', at: [6, -1.75] },
    { id: 'stolpe-2', type: 'cone', at: [6, 1.75] },
    { id: 'ball-1', type: 'ball', at: [-3.4, -0.9] },
    { id: 'ball-2', type: 'ball', at: [-3.4, 0.9] },
    { id: 'ball-3', type: 'ball', at: [-4.2, -0.4] },
    { id: 'ball-4', type: 'ball', at: [-4.2, 0.4] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Lite mål (3–4 m) laget med kjegler. Treneren står 8 m unna med 5–6 baller.',
      players: { t: [-2, 0], k: [5.2, 0] },
      ball: { with: 't', dir: [1, 0] },
    },
    {
      name: 'Trilling',
      text: 'Treneren triller en ball langs bakken, rett på keeperen. Keeperen rykker frem.',
      players: { k: [3.6, 0] },
      ball: { with: 'k', dir: [-1, 0] },
    },
    {
      name: 'Grep',
      text: 'Keeperen setter kroppen bak ballen, går evt. ned på ett kne og trekker ballen inn til brystet.',
      highlight: 'Grep!',
      held: true,
      players: {},
      ball: { with: 'k', dir: [-1, 0] },
    },
  ],
});

/**
 * keeper-y-03: 7er-mål med et lite felt. En servitør på kanten av feltet,
 * skrått foran til siden, slår myke innlegg. En angriper starter samtidig
 * ved 5-meteren og lager litt press. Keeperen roper og fanger ballen.
 * Minste antall (4): servitør, angriper, keeper og neste angriper som venter.
 */
const KATT_OG_MUS = defineDrillAnimation({
  drillId: 'keeper-y-03',
  name: 'Katt og mus i feltet (feltarbeid og kommunikasjon)',
  sport: 'football7',
  cast: {
    s: { label: 'S', family: 'mid' },
    a: { label: 'A', family: 'att' },
    k: { label: 'K', family: 'gk' },
    a2: { label: '', family: 'att' },
  },
  phases: [
    {
      name: 'Oppsett',
      text: 'Servitøren står på kanten av feltet, skrått foran til siden. Angriperen står ved 5-meteren.',
      players: { s: [23, -9.5], a: [26.2, 1.6], k: [29.3, 0], a2: [20.5, 3] },
      ball: { with: 's', dir: [1, 0.6] },
    },
    {
      name: 'Innlegg',
      text: 'Servitøren slår et mykt innlegg. Angriperen starter samtidig og lager litt press. Keeperen roper og går ut.',
      kick: 'high',
      held: true,
      players: { a: [25.2, 0.2], k: [27.3, -1.6] },
      ball: { with: 'k', dir: [-0.6, -0.8] },
    },
    {
      name: 'Fanget',
      text: 'Keeperen møter ballen på høyeste punkt og fanger den foran angriperen.',
      highlight: 'Fanget!',
      held: true,
      players: {},
      ball: { with: 'k', dir: [-0.6, -0.8] },
    },
  ],
});

/**
 * keeper-y-08: keeperen står midt i et 5er-mål. Treneren står 5–6 m unna og
 * kaster lave og halvhøye baller mot sidene, litt utenfor rekkevidde.
 * Keeperen skyver fra og strekker seg, litt offensivt fremover.
 * 3 spillere: trener, keeper og en keeper til som hviler mellom seriene.
 * Kastet vises som et lavt skudd.
 */
const REKKEVIDDE = defineDrillAnimation({
  drillId: 'keeper-y-08',
  name: 'Rekkevidde og skyv – kast først',
  sport: 'football5',
  cast: {
    t: { label: 'T', family: 'mid' },
    k: { label: 'K', family: 'gk' },
    k2: { label: '', family: 'gk' },
  },
  phases: [
    {
      name: 'Oppsett',
      text: 'Keeperen står midt i et 5er-mål. Treneren står 5–6 m unna med ballen. Neste keeper hviler.',
      players: { t: [14, 0], k: [19.4, 0], k2: [5.5, 4] },
      ball: { with: 't', dir: [1, 0] },
    },
    {
      name: 'Kast og skyv',
      text: 'Treneren kaster ballen lavt mot siden. Keeperen skyver fra, slenger seg og strekker seg mot ballen.',
      kick: 'shot',
      dive: ['k'],
      held: true,
      players: { k: [18.9, -1.3] },
      ball: { with: 'k', dir: [0, -1] },
    },
    {
      name: 'Litt fremover',
      text: 'Vær bestemt, og la slenget til siden være litt offensivt fremover. Tren begge sider, med nok hvile.',
      dive: ['k'],
      held: true,
      players: {},
      ball: { with: 'k', dir: [0, -1] },
    },
  ],
});

/**
 * keeper-a-01: angriperen starter ca. 20 m fra mål med ball og fører i
 * kontrollert tempo. Keeperen leser touch og avstand. Her vises valget
 * «angriperen er nær: gå i blokk», og keeperen holder posisjonen til skuddet.
 * Minste antall (3): angriper, keeper og neste angriper som venter.
 */
const NAERDUELL = defineDrillAnimation({
  drillId: 'keeper-a-01',
  name: '1 mot 1 – nærduell og blokk',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'att' },
    k: { label: 'K', family: 'gk' },
    a2: { label: '', family: 'att' },
  },
  phases: [
    {
      name: 'Start',
      text: 'Angriperen starter ca. 20 m fra mål med ball. Keeperen står i mål.',
      players: { a: [0, 0], k: [19.4, 0], a2: [-2.4, 2] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Føring',
      text: 'Angriperen fører i kontrollert tempo. Keeperen leser touch og avstand.',
      players: { a: [10, 0] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Blokk',
      text: 'Angriperen er nær, så keeperen går i blokk og gjør seg størst mulig.',
      players: { a: [13.5, 0], k: [18.5, 0] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Skudd',
      text: 'Keeperen holder posisjonen til skuddet er avfyrt, og blokkerer det.',
      highlight: 'Blokk!',
      kick: 'shot',
      players: {},
      ball: { with: 'k', dir: [-1, 0] },
    },
  ],
});

/**
 * keeper-a-02: to dukker ca. 11 m fra mål, litt fra hverandre. Skytteren
 * står ca. 16 m unna og skyter mellom dukkene. Keeperen leser ballbanen
 * sent og reagerer eksplosivt. Her kan ballen tas trygt.
 * Minste antall (3): skytter, keeper og neste skytter som venter.
 */
const KORT_HOLD = defineDrillAnimation({
  drillId: 'keeper-a-02',
  name: 'Reaksjon på kort hold (skudd gjennom skjerming)',
  sport: 'football',
  cast: {
    s: { label: 'S', family: 'att' },
    k: { label: 'K', family: 'gk' },
    s2: { label: '', family: 'att' },
  },
  items: [
    { id: 'dukke-1', type: 'mannequin', at: [41.5, -2] },
    { id: 'dukke-2', type: 'mannequin', at: [41.5, 2] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'To dukker ca. 11 m fra mål, litt fra hverandre. Skytteren står ca. 16 m unna.',
      players: { s: [36.5, 0], k: [51.8, 0], s2: [32, 3] },
      ball: { with: 's', dir: [1, 0] },
    },
    {
      name: 'Skudd',
      text: 'Skytteren skyter mellom dukkene. Keeperen leser ballbanen sent og slenger seg eksplosivt.',
      kick: 'shot',
      dive: ['k'],
      held: true,
      players: { k: [51.6, -2.4] },
      ball: { with: 'k', dir: [0, -1] },
    },
    {
      name: 'Redning',
      text: 'Kan ballen tas trygt, tar keeperen den. Ellers styres den ut mot sidene, bort fra sonen foran mål.',
      dive: ['k'],
      held: true,
      players: {},
      ball: { with: 'k', dir: [0, -1] },
    },
  ],
});

/**
 * keeper-a-07: en trener på kanten av feltet slår høye baller inn mot
 * 5-meteren. En forsvarer og en angriper lager trangt rom foran keeperen.
 * Her kan ballen fanges, så keeperen fanger den.
 */
const FELT_DUELLEN = defineDrillAnimation({
  drillId: 'keeper-a-07',
  name: 'Felt-duellen – fange eller bokse',
  sport: 'football',
  cast: {
    t: { label: 'T', family: 'mid' },
    f: { label: 'F', family: 'def' },
    a: { label: 'A', family: 'att' },
    k: { label: 'K', family: 'gk' },
  },
  phases: [
    {
      name: 'Oppsett',
      text: 'Treneren står på kanten av feltet. En forsvarer og en angriper står foran keeperen.',
      players: { t: [37.5, -13], f: [46.6, 3.4], a: [45.2, -3.4], k: [51.8, 0] },
      ball: { with: 't', dir: [1, 0.6] },
    },
    {
      name: 'Innlegg',
      text: 'Treneren slår en høy ball inn mot 5-meteren. Forsvareren og angriperen gjør rommet trangt.',
      kick: 'high',
      held: true,
      players: { f: [47.6, 3.4], a: [46, -3.4], k: [50.6, 0] },
      ball: { with: 'k', dir: [-0.6, -0.8] },
    },
    {
      name: 'Bokse',
      text: 'For trangt til å fange: keeperen roper tydelig og bokser ballen høyt og langt ut mot siden.',
      highlight: 'Bokset!',
      kick: 'punch',
      players: {},
      ball: [43, -16],
    },
  ],
});

/**
 * keeper-a-08: en medspiller står ca. 8–10 m foran mål (i stedet for
 * sprettbrett). Treneren skyter fra ca. 16 m inn i medspilleren, som
 * avbøyer ballen. Keeperen står nøytralt til retningsendringen, og reagerer da.
 */
const AVBOYNING = defineDrillAnimation({
  drillId: 'keeper-a-08',
  name: 'Reaksjon via avbøyning (sprettbrett eller partner)',
  sport: 'football',
  cast: {
    t: { label: 'T', family: 'mid' },
    m: { label: 'M', family: 'mid' },
    k: { label: 'K', family: 'gk' },
  },
  phases: [
    {
      name: 'Oppsett',
      text: 'En medspiller står ca. 8–10 m foran mål. Treneren står ca. 16 m unna med ballen.',
      players: { t: [36.5, 0], m: [43.5, 0], k: [51.8, 0] },
      ball: { with: 't', dir: [1, 0] },
    },
    {
      name: 'Skudd',
      text: 'Treneren skyter inn i medspilleren. Keeperen står i nøytral utgangsstilling.',
      kick: 'shot',
      players: {},
      ball: { with: 'm', dir: [1, 0] },
    },
    {
      name: 'Avbøyning',
      text: 'Ballen treffer medspilleren og skifter retning. Keeperen reagerer først da, og slenger seg.',
      kick: 'deflect',
      dive: ['k'],
      players: { k: [51.6, 2.6] },
      ball: { with: 'k', dir: [0, 1] },
    },
  ],
});

/**
 * keeper-a-09: kjeglerekke 5 m foran mål (her tre kjegler). Keeperen løper
 * gjennom rekka med rask retningsendring. Treneren slår umiddelbart et
 * innlegg fra sidekorridoren, og to angripere og to forsvarere angriper
 * rommet i 5-meteren. Keeperen roper og eier feltet; her fanger keeperen.
 * Minste antall (6): keeper, trener, to angripere og to forsvarere.
 */
const FELTKOMMANDO = defineDrillAnimation({
  drillId: 'keeper-a-09',
  name: 'Feltkommando etter løp (lett belastning)',
  sport: 'football',
  cast: {
    k: { label: 'K', family: 'gk' },
    t: { label: 'T', family: 'mid' },
    a1: { label: 'A', family: 'att' },
    a2: { label: 'A', family: 'att' },
    f1: { label: 'F', family: 'def' },
    f2: { label: 'F', family: 'def' },
  },
  items: [
    { id: 'kjegle-1', type: 'cone', at: [47.5, -6] },
    { id: 'kjegle-2', type: 'cone', at: [47.5, -2] },
    { id: 'kjegle-3', type: 'cone', at: [47.5, 2] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Kjeglerekke 5 m foran mål. Treneren står i sidekorridoren. To angripere og to forsvarere foran mål.',
      players: {
        k: [47.5, -9.5], t: [40, -26.6],
        a1: [36, -5], f1: [41, -2.5], a2: [36, 5], f2: [41, 2.5],
      },
      ball: { with: 't', dir: [1, 0.6] },
    },
    {
      name: 'Kjegle 1',
      text: 'Keeperen løper gjennom kjeglerekka …',
      players: { k: [45.8, -6] },
      ball: { with: 't', dir: [1, 0.6] },
    },
    {
      name: 'Kjegle 2',
      text: '… med rask retningsendring …',
      players: { k: [49.2, -2] },
      ball: { with: 't', dir: [1, 0.6] },
    },
    {
      name: 'Kjegle 3',
      text: '… gjennom hele rekka.',
      players: { k: [45.8, 2] },
      ball: { with: 't', dir: [1, 0.6] },
    },
    {
      name: 'Innlegg',
      text: 'Treneren slår umiddelbart et høyt innlegg. To angripere og to forsvarere angriper rommet i 5-meteren.',
      kick: 'high',
      held: true,
      players: {
        k: [50.8, 0.5],
        a1: [45, -4], f1: [49.5, -9.5], a2: [45, 4], f2: [49.5, 8],
      },
      ball: { with: 'k', dir: [-0.6, -0.8] },
    },
    {
      name: 'Eie feltet',
      text: 'Keeperen roper tydelig og eier feltet: her fanger keeperen ballen (ellers bokses den ut).',
      highlight: 'Fanget!',
      held: true,
      players: {},
      ball: { with: 'k', dir: [-0.6, -0.8] },
    },
  ],
});

/**
 * keeper-a-10: skytteren stiller opp ballen på 11-metersmerket. Keeperen
 * står med begge beina på mållinjen, leser tilløp, hofter og plantefot,
 * bestemmer seg sent og kaster seg eksplosivt.
 * Minste antall (3): skytter, keeper og neste skytter som venter utenfor feltet.
 */
const STRAFFESPARK = defineDrillAnimation({
  drillId: 'keeper-a-10',
  name: 'Straffespark – les og reager',
  sport: 'football',
  cast: {
    s: { label: 'S', family: 'att' },
    k: { label: 'K', family: 'gk' },
    s2: { label: '', family: 'att' },
  },
  phases: [
    {
      name: 'Oppsett',
      text: 'Skytteren stiller opp ballen på 11-metersmerket. Keeperen står med begge beina på mållinjen.',
      // Ballen ligger på merket. Skytteren står klar til tilløp, skrått bak ballen.
      players: { s: [38.6, -1.2], k: [52.2, 0], s2: [34, 6.1] },
      ball: [41.5, 0],
    },
    {
      name: 'Lesing',
      text: 'Keeperen står klar på linja og leser skytterens tilløp, hofter og plantefot.',
      players: {},
      ball: [41.5, 0],
    },
    {
      name: 'Reaksjon',
      text: 'Skytteren skyter. Keeperen bestemmer seg sent og kaster seg eksplosivt.',
      kick: 'shot',
      dive: ['k'],
      players: { s: [40.2, -0.6], k: [52, -2.6] },
      ball: { with: 'k', dir: [0, -1] },
    },
  ],
});

export const KEEPER_ANIMATIONS = [
  BALLSKJOLDET, KATT_OG_MUS, REKKEVIDDE, NAERDUELL, KORT_HOLD, FELT_DUELLEN, AVBOYNING, FELTKOMMANDO, STRAFFESPARK,
];
