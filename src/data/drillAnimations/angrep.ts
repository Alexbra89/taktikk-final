// src/data/drillAnimations/angrep.ts
// Animasjoner for angrepsøvelser. Bare det som står i øvelsesteksten:
// antall spillere, oppsett og forløp. Posisjoner i meter fra banens midtpunkt.
import { defineDrillAnimation } from '@/features/drill-animation/define';

/**
 * angrep-y-15: to lag i stafett, hvert med sin rekke og sitt mål. Første
 * spiller fører ballen til kjegla og skyter på mål. Lagene gjør det samme
 * samtidig med hver sin ball; brettet har én ball, så ett lag vises.
 * Minste antall (6) er to lag på tre.
 */
const SKYTESTAFETT = defineDrillAnimation({
  drillId: 'angrep-y-15',
  name: 'Skyting på mål – stafett',
  sport: 'football5',
  cast: {
    s1: { label: '', family: 'att' },
    s2: { label: '', family: 'att' },
    s3: { label: '', family: 'att' },
  },
  items: [{ id: 'kjegle', type: 'cone', at: [9, 0] }],
  phases: [
    {
      name: 'Oppsett',
      text: 'Laget står i rekke med jevn avstand til målet. En kjegle foran målet.',
      players: { s1: [-1, 0], s2: [-2.8, 0], s3: [-4.7, 0] },
      ball: { with: 's1', dir: [1, 0] },
    },
    {
      name: 'Føring',
      text: 'Første spiller fører ballen til kjegla.',
      players: { s1: [8, -1.4] },
      ball: { with: 's1', dir: [1, 0.4] },
    },
    {
      name: 'Skudd',
      text: 'Skudd på mål. Skytteren henter ballen og stiller seg bakerst; neste går når skytteren er tilbake.',
      highlight: 'MÅL!',
      players: {},
      ball: { goal: 'right' },
    },
  ],
});

/**
 * angrep-a-09: halv bane med mål, keeper, to stoppere og en kjegle på kanten.
 * Sentral midtbanespiller slår opp på feilvendt spiss, som vinkler ut på kant
 * (teksten gir også valget å legge igjen). Kantspilleren utfordrer kjegla og
 * slår innlegg; to spisser og motsatt kant angriper boksen mot stopperne og keeperen.
 * 5 angrepsspillere: SM, to spisser (S) og to kanter (K).
 */
const FEILVENDT_SPISS = defineDrillAnimation({
  drillId: 'angrep-a-09',
  name: 'A3: Spill til feilvendt spiss – innlegg og duell',
  sport: 'football',
  cast: {
    sm: { label: 'SM', family: 'mid' },
    s1: { label: 'S', family: 'att' },
    s2: { label: 'S', family: 'att' },
    k1: { label: 'K', family: 'att' },
    k2: { label: 'K', family: 'att' },
    st1: { label: 'ST', family: 'def' },
    st2: { label: 'ST', family: 'def' },
    kv: { label: 'KV', family: 'gk' },
  },
  items: [{ id: 'kjegle', type: 'cone', at: [40, -22] }],
  phases: [
    {
      name: 'Oppsett',
      text: 'Halv bane med mål, keeper og to stoppere. En kjegle på kanten. Sentral midtbanespiller har ballen.',
      players: {
        sm: [16, 0], s1: [33, -2], s2: [32, 6], k1: [28, -24], k2: [28, 24],
        st1: [40, -4], st2: [40, 5], kv: [51.5, 0],
      },
      ball: { with: 'sm', dir: [1, 0] },
    },
    {
      name: 'Oppspill',
      text: 'Midtbanespilleren slår opp på feilvendt spiss.',
      players: { s1: [31, -2] },
      ball: { with: 's1', dir: [-1, 0] },
    },
    {
      name: 'Ut på kant',
      text: 'Spissen vinkler ut på kanten (eller legger igjen).',
      players: { k1: [31, -23] },
      ball: { with: 'k1', dir: [1, 0] },
    },
    {
      name: 'Utfordrer kjegla',
      text: 'Kantspilleren utfordrer kjegla før innlegget. Spissene og motsatt kant gjør seg klare.',
      players: { k1: [44, -21], s1: [36, -8], s2: [35.5, 9], k2: [36, 18] },
      ball: { with: 'k1', dir: [1, 0.4] },
    },
    {
      name: 'Innlegg og duell',
      text: 'Innlegg. To spisser og motsatt kant angriper boksen mot to stoppere og keeper.',
      kick: 'cross',
      players: {
        s1: [44, -6], s2: [45.5, 5], k2: [42, 12],
        st1: [47, -2.5], st2: [48.5, 2], kv: [52, -1.5],
      },
      ball: { with: 's2', dir: [0, -1] },
    },
  ],
});

/**
 * angrep-y-01: to rekker står mot hverandre, og første spiller på hver side
 * starter samtidig med hver sin ball. De fører i sikk-sakk gjennom en
 * kjeglerekke til midten, rundt en kjegle, og avslutter på mål.
 * Hvordan løypa ligger, står ikke i detalj; her går de to kjeglerekkene mot
 * hverandre fra hver sin rekke inn mot én kjegle i midten, med målet i enden.
 * Den andre ballen er utstyr som følger spilleren (brettet har én spillball).
 * Minste antall (6): tre i hver rekke.
 */
const SIKK_SAKK_AVSLUTNING = defineDrillAnimation({
  drillId: 'angrep-y-01',
  name: 'Føring i sikk sakk med avslutning',
  sport: 'football5',
  cast: {
    t1: { label: '', family: 'att' },
    t2: { label: '', family: 'att' },
    t3: { label: '', family: 'att' },
    b1: { label: '', family: 'mid' },
    b2: { label: '', family: 'mid' },
    b3: { label: '', family: 'mid' },
  },
  items: [
    { id: 'ovre-1', type: 'cone', at: [0.8, -9.5] },
    { id: 'ovre-2', type: 'cone', at: [-0.8, -7] },
    { id: 'ovre-3', type: 'cone', at: [0.8, -4.5] },
    { id: 'nedre-1', type: 'cone', at: [0.8, 9.5] },
    { id: 'nedre-2', type: 'cone', at: [-0.8, 7] },
    { id: 'nedre-3', type: 'cone', at: [0.8, 4.5] },
    { id: 'midten', type: 'cone', at: [0, 0] },
    { id: 'ball-2', type: 'ball', at: [0, 11.2] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'To rekker mot hverandre, hver med en sikk-sakk-løype inn mot midten og et mål i enden.',
      players: { t1: [0, -12.1], t2: [-1.8, -12.1], t3: [-3.6, -12.1], b1: [0, 12.1], b2: [-1.8, 12.1], b3: [-3.6, 12.1] },
      ball: { with: 't1', dir: [0, 1] },
    },
    {
      name: 'Start',
      text: 'Første spiller på hver side starter samtidig med hver sin ball.',
      players: { t1: [-1, -9.5], b1: [-1, 9.5] },
      ball: { with: 't1', dir: [0, 1] },
      moveItems: { 'ball-2': [-1, 8.4] },
    },
    {
      name: 'Sikk',
      text: 'De fører ballen i sikk-sakk mellom kjeglene …',
      players: { t1: [1, -7], b1: [1, 7] },
      ball: { with: 't1', dir: [0, 1] },
      moveItems: { 'ball-2': [1, 5.9] },
    },
    {
      name: 'Sakk',
      text: '… inn mot midten.',
      players: { t1: [-1, -4.5], b1: [-1, 4.5] },
      ball: { with: 't1', dir: [0, 1] },
      moveItems: { 'ball-2': [-1, 3.4] },
    },
    {
      name: 'Rundt kjegla',
      text: 'Rundt kjegla i midten og mot mål.',
      turn: true,
      players: { t1: [1.8, -1.6], b1: [1.8, 1.6] },
      ball: { with: 't1', dir: [1, 0] },
      moveItems: { 'ball-2': [2.7, 1.6] },
    },
    {
      name: 'Avslutning',
      text: 'Begge avslutter på mål. Skytteren henter ballen og stiller seg bakerst i motsatt rekke.',
      highlight: 'MÅL!',
      players: {},
      ball: { goal: 'right' },
      moveItems: { 'ball-2': [20, 0.6] },
    },
  ],
});

/**
 * angrep-y-10: to mål med keepere. Ballen starter likt på begge sider: rød
 * spiller spiller til rød i midten, som vender rundt en kjegle og angriper
 * motsatt mål; blå gjør det samme den andre veien. Den som slår pasningen,
 * blir forsvarer for angriperen fra motsatt side. Den blå ballen er utstyr
 * som følger spillerne (brettet har én spillball). Teksten sier at
 * angriperen scorer; hvordan driblingen går, står ikke, så den er enkel.
 */
const VENDE_DRIBLE_SKYTE = defineDrillAnimation({
  drillId: 'angrep-y-10',
  name: '1 mot 1 – vende, drible og skyte',
  sport: 'football5',
  cast: {
    r1: { label: 'P', family: 'att' },
    r2: { label: 'A', family: 'att' },
    b1: { label: 'P', family: 'def' },
    b2: { label: 'A', family: 'def' },
    kv: { label: 'K', family: 'gk' },
    kh: { label: 'K', family: 'gk' },
  },
  items: [
    { id: 'kjegle-rod', type: 'cone', at: [0, -3] },
    { id: 'kjegle-bla', type: 'cone', at: [0, 3] },
    { id: 'ball-bla', type: 'ball', at: [11.1, 3] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'To mål med keepere. Ballen starter likt på begge sider: rød og blå pasningsgiver, rød og blå i midten.',
      players: { r1: [-12, -3], r2: [-1.5, -3], b1: [12, 3], b2: [1.5, 3], kv: [-19.4, 0], kh: [19.4, 0] },
      ball: { with: 'r1', dir: [1, 0] },
    },
    {
      name: 'Pasning',
      text: 'Rød spiller spiller til rød i midten. Blå gjør det samme fra den andre siden.',
      players: {},
      ball: { with: 'r2', dir: [-1, 0] },
      moveItems: { 'ball-bla': [2.4, 3] },
    },
    {
      name: 'Vending',
      text: 'Midtspilleren vender rundt kjegla. Pasningsgiveren blir forsvarer for angriperen fra motsatt side.',
      turn: true,
      players: { r2: [1.2, -4.2], b2: [-1.2, 4.2], r1: [-8, 1.5], b1: [8, -1.5] },
      ball: { with: 'r2', dir: [1, 0] },
      moveItems: { 'ball-bla': [-2.1, 4.2] },
    },
    {
      name: '1 mot 1',
      text: 'Angriperen tar på forsvareren fra motsatt side.',
      players: { r2: [8, -3.4], b2: [-8, 3.4], r1: [-10.5, 1.6], b1: [10.5, -1.6] },
      ball: { with: 'r2', dir: [1, 0] },
      moveItems: { 'ball-bla': [-8.9, 3.4] },
    },
    {
      name: 'Forbi',
      text: 'Angriperen dribler forbi forsvareren.',
      players: { r2: [13, -4.6], b2: [-13, 4.6] },
      ball: { with: 'r2', dir: [1, 0.3] },
      moveItems: { 'ball-bla': [-13.9, 4.3] },
    },
    {
      name: 'Avslutning',
      text: 'Angriperen scorer på motsatt mål. Den som var forsvarer, blir angriper neste runde.',
      highlight: 'MÅL!',
      players: {},
      ball: { goal: 'right' },
      moveItems: { 'ball-bla': [-20, -0.6] },
    },
  ],
});

export const ANGREP_ANIMATIONS = [SKYTESTAFETT, FEILVENDT_SPISS, SIKK_SAKK_AVSLUTNING, VENDE_DRIBLE_SKYTE];
