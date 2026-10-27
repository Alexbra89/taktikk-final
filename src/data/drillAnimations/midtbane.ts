// src/data/drillAnimations/midtbane.ts
// Animasjoner for midtbaneøvelser. Bare det som står i øvelsesteksten:
// antall spillere, oppsett og forløp. Posisjoner i meter fra banens midtpunkt.
import { defineDrillAnimation } from '@/features/drill-animation/define';

/**
 * midtbane-y-14: trekant med 8–10 m mellom kjeglene og mål bak kjegle 3.
 * 1 spiller til 2, 2 til 3, 3 tar imot og avslutter. Alle løper etter
 * pasningen til neste kjegle. Minste antall (6): to ved hver kjegle.
 */
const TRE_HJORNER = defineDrillAnimation({
  drillId: 'midtbane-y-14',
  name: 'Pasning til mål – tre hjørner',
  sport: 'football7',
  cast: {
    s1: { label: '1', family: 'mid' },
    s2: { label: '2', family: 'mid' },
    s3: { label: '3', family: 'mid' },
    k1: { label: '', family: 'mid' },
    k2: { label: '', family: 'mid' },
    k3: { label: '', family: 'mid' },
  },
  items: [
    { id: 'kjegle-1', type: 'cone', at: [11.5, 4.5] },
    { id: 'kjegle-2', type: 'cone', at: [11.5, -4.5] },
    { id: 'kjegle-3', type: 'cone', at: [19, 0] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Tre kjegler i en trekant med 8–10 m mellom. Mål bak kjegle 3. Spillerne står ved kjeglene.',
      players: {
        s1: [11, 5.6], k1: [8.8, 6.8],
        s2: [11, -5.6], k2: [8.8, -6.8],
        s3: [18.2, 1.4], k3: [19.5, 3.8],
      },
      ball: { with: 's1', dir: [0, -1] },
    },
    {
      name: 'Pasning 1–2',
      text: 'Spiller 1 spiller til 2 og løper etter pasningen.',
      players: { s1: [11, 0] },
      ball: { with: 's2', dir: [0, 1] },
    },
    {
      name: 'Pasning 2–3',
      text: 'Spiller 2 spiller til 3 og løper etter pasningen. Spiller 1 er fremme ved kjegle 2.',
      players: { s1: [10, -4], s2: [15, -2.8] },
      ball: { with: 's3', dir: [-1, -1] },
    },
    {
      name: 'Mottak',
      text: 'Spiller 3 tar imot med første touch mot mål. Spiller 2 er fremme ved kjegle 3.',
      players: { s2: [17, -1.8], s3: [19.8, 1] },
      ball: { with: 's3', dir: [1, 0] },
    },
    {
      name: 'Avslutning',
      text: 'Spiller 3 avslutter mot mål.',
      highlight: 'MÅL!',
      players: {},
      ball: { goal: 'right' },
    },
  ],
});

/**
 * midtbane-a-10: bane 20×10 m, tre spillere i hver ende. A spiller til B,
 * som har en passiv motstander i ryggen. B vender og spiller ut til C.
 */
const VENDESPILL = defineDrillAnimation({
  drillId: 'midtbane-a-10',
  name: 'Vendespill – ut av press',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'mid' },
    b: { label: 'B', family: 'mid' },
    c: { label: 'C', family: 'mid' },
    m: { label: 'M', family: 'def' },
    a2: { label: '', family: 'mid' },
    a3: { label: '', family: 'mid' },
    c2: { label: '', family: 'mid' },
    c3: { label: '', family: 'mid' },
  },
  // Hjørnene på banen (20 × 10 m).
  items: [
    { id: 'hjorne-1', type: 'cone', at: [-10, -5] },
    { id: 'hjorne-2', type: 'cone', at: [10, -5] },
    { id: 'hjorne-3', type: 'cone', at: [-10, 5] },
    { id: 'hjorne-4', type: 'cone', at: [10, 5] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Bane 20×10 m i tre soner. Tre spillere i hver ende. B i midten har en passiv motstander i ryggen.',
      players: {
        a: [-8, 0], a2: [-9, -3], a3: [-9, 3],
        c: [8, 0], c2: [9, -3], c3: [9, 3],
        b: [-0.5, 0], m: [1.2, 0],
      },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Pasning',
      text: 'A spiller til B i midten. Motstanderen presser passivt bakfra.',
      players: { m: [1.1, 0] },
      ball: { with: 'b', dir: [-1, 0] },
    },
    {
      name: 'Vending',
      text: 'B sjekker over skulderen, åpner og vender bort fra presset.',
      players: { b: [0, 1.8] },
      ball: { with: 'b', dir: [1, 0] },
    },
    {
      name: 'Utspill',
      text: 'B spiller ut til C i motsatt ende.',
      players: {},
      ball: { with: 'c', dir: [-1, 0] },
    },
  ],
});

/**
 * midtbane-y-04: firkant 10×10 m med en spiller i hvert hjørne (A, B, C, D).
 * A spiller til B, B støttepasser tilbake, A vender bort fra pasningen og
 * spiller til C. Teksten har to baller, men sier ikke hvor den andre er, så
 * bare ballen i denne kombinasjonen vises.
 */
const FIRE_HJORNER = defineDrillAnimation({
  drillId: 'midtbane-y-04',
  name: 'Fire hjørner – vending og pasning',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'mid' },
    b: { label: 'B', family: 'mid' },
    c: { label: 'C', family: 'mid' },
    d: { label: 'D', family: 'mid' },
  },
  items: [
    { id: 'hjorne-a', type: 'cone', at: [-5, 5] },
    { id: 'hjorne-b', type: 'cone', at: [-5, -5] },
    { id: 'hjorne-c', type: 'cone', at: [5, 5] },
    { id: 'hjorne-d', type: 'cone', at: [5, -5] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Firkant 10×10 m med en spiller i hvert hjørne. A har ballen.',
      players: { a: [-5.6, 5.6], b: [-5.6, -5.6], c: [5.6, 5.6], d: [5.6, -5.6] },
      ball: { with: 'a', dir: [0, -1] },
    },
    {
      name: 'Pasning',
      text: 'A spiller til B.',
      players: {},
      ball: { with: 'b', dir: [0, 1] },
    },
    {
      name: 'Støttepasning',
      text: 'B gir støttepasning tilbake til A. A møter pasningen.',
      players: { a: [-5.6, 3.8] },
      ball: { with: 'a', dir: [0, -1] },
    },
    {
      name: 'Vending',
      text: 'A vender bort fra pasningen.',
      turn: true,
      players: { a: [-4.6, 4.4] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Pasning til C',
      text: 'A spiller til C.',
      players: {},
      ball: { with: 'c', dir: [-1, 0] },
    },
  ],
});

/**
 * midtbane-y-05: firkant 8×8 m med en kjegle i hvert hjørne og 2–3 spillere
 * ved hvert hjørne; én ball. Spilleren spiller til hjørnet til høyre og løper
 * etter pasningen for å ta plassen bak. Mottakeren kontrollerer og spiller videre.
 * Minste antall (8): to ved hvert hjørne. Køene står utenfor hjørnene.
 */
const PASNINGSFIRKANT = defineDrillAnimation({
  drillId: 'midtbane-y-05',
  name: 'Pasningsfirkant – pass og følg',
  sport: 'football5',
  cast: {
    s1: { label: '', family: 'mid' },
    s2: { label: '', family: 'mid' },
    s3: { label: '', family: 'mid' },
    s4: { label: '', family: 'mid' },
    k1: { label: '', family: 'mid' },
    k2: { label: '', family: 'mid' },
    k3: { label: '', family: 'mid' },
    k4: { label: '', family: 'mid' },
  },
  items: [
    { id: 'hjorne-1', type: 'cone', at: [-4, 4] },
    { id: 'hjorne-2', type: 'cone', at: [4, 4] },
    { id: 'hjorne-3', type: 'cone', at: [4, -4] },
    { id: 'hjorne-4', type: 'cone', at: [-4, -4] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Firkant 8×8 m med en kjegle i hvert hjørne og spillere ved hvert hjørne. Én ball starter.',
      players: {
        s1: [-4.6, 4.6], k1: [-7.2, 4.6],
        s2: [4.6, 4.6], k2: [4.6, 7],
        s3: [4.6, -4.6], k3: [7, -4.6],
        s4: [-4.6, -4.6], k4: [-4.6, -7],
      },
      ball: { with: 's1', dir: [1, 0] },
    },
    {
      name: 'Pass og følg',
      text: 'Spilleren spiller til hjørnet til høyre og løper etter pasningen.',
      players: { s1: [4.6, 9.4] },
      ball: { with: 's2', dir: [0, -1] },
    },
    {
      name: 'Mottak og videre',
      text: 'Mottakeren kontrollerer, spiller videre til neste hjørne og løper etter.',
      players: { s2: [9.4, -4.6] },
      ball: { with: 's3', dir: [-1, 0] },
    },
    {
      name: 'Videre',
      text: 'Slik fortsetter det rundt firkanten. Bytt retning etter 2 minutter.',
      players: { s3: [-4.6, -9.5] },
      ball: { with: 's4', dir: [0, 1] },
    },
  ],
});

/**
 * midtbane-y-11: en rekke kjegler med 3 m mellom. To spillere på én ball
 * beveger seg sidelengs mellom kjeglene og spiller pasninger frem og tilbake
 * med innsiden av foten. Minste antall (4) er to par med hver sin ball;
 * brettet har én ball, så ett par vises.
 */
const PASNINGSSLALAM = defineDrillAnimation({
  drillId: 'midtbane-y-11',
  name: 'Pasningsslalåm – to og to',
  sport: 'football5',
  cast: {
    p1: { label: '', family: 'mid' },
    p2: { label: '', family: 'mid' },
  },
  items: [
    { id: 'kjegle-1', type: 'cone', at: [-7.5, 0] },
    { id: 'kjegle-2', type: 'cone', at: [-4.5, 0] },
    { id: 'kjegle-3', type: 'cone', at: [-1.5, 0] },
    { id: 'kjegle-4', type: 'cone', at: [1.5, 0] },
    { id: 'kjegle-5', type: 'cone', at: [4.5, 0] },
    { id: 'kjegle-6', type: 'cone', at: [7.5, 0] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'En rekke kjegler med 3 m mellom. To spillere på én ball, én på hver side.',
      players: { p1: [-9, -2.5], p2: [-9, 2.5] },
      ball: { with: 'p1', dir: [0, 1] },
    },
    {
      name: 'Pasning',
      text: 'De beveger seg sidelengs og spiller pasning mellom kjeglene med innsiden av foten.',
      players: { p1: [-6, -2.5], p2: [-6, 2.5] },
      ball: { with: 'p2', dir: [0, -1] },
    },
    {
      name: 'Tilbake',
      text: 'Pasning tilbake i neste åpning.',
      players: { p1: [-3, -2.5], p2: [-3, 2.5] },
      ball: { with: 'p1', dir: [0, 1] },
    },
    {
      name: 'Videre',
      text: 'Frem og tilbake gjennom hele løypa.',
      players: { p1: [0, -2.5], p2: [0, 2.5] },
      ball: { with: 'p2', dir: [0, -1] },
    },
    {
      name: 'Mot enden',
      text: 'Tell pasningene uten feil. Snu ved enden og gå tilbake.',
      players: { p1: [3, -2.5], p2: [3, 2.5] },
      ball: { with: 'p1', dir: [0, 1] },
    },
  ],
});

/**
 * midtbane-a-14: bane 25×15 m med tre soner og mål. A spiller til B, B legger
 * av til C som kommer bakfra i tredjemannsløp, og C avslutter mot mål.
 * De som venter (6–9 spillere) har ingen rolle i teksten og er utelatt.
 */
const TREDJEMANNSLOP = defineDrillAnimation({
  drillId: 'midtbane-a-14',
  name: 'Tredjemannsløp – veggspill og kombinasjon',
  sport: 'football7',
  cast: {
    a: { label: 'A', family: 'mid' },
    b: { label: 'B', family: 'att' },
    c: { label: 'C', family: 'mid' },
  },
  // Banen 25 × 15 m mot målet, delt i tre soner.
  items: [
    { id: 'sone-1a', type: 'cone', at: [5, -7.5] },
    { id: 'sone-1b', type: 'cone', at: [5, 7.5] },
    { id: 'sone-2a', type: 'cone', at: [13.3, -7.5] },
    { id: 'sone-2b', type: 'cone', at: [13.3, 7.5] },
    { id: 'sone-3a', type: 'cone', at: [21.7, -7.5] },
    { id: 'sone-3b', type: 'cone', at: [21.7, 7.5] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Bane 25×15 m med tre soner og mål. A har ballen, B står foran, C bak.',
      players: { a: [9, -2], b: [19, 0], c: [7, 3] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Pasning til B',
      text: 'A spiller til B. C starter løpet bakfra.',
      players: { c: [11, 3.5] },
      ball: { with: 'b', dir: [-1, 0] },
    },
    {
      name: 'Legger av',
      text: 'B legger av til C, som kommer i tredjemannsløp.',
      players: { c: [16, 4] },
      ball: { with: 'c', dir: [1, 0] },
    },
    {
      name: 'Avslutning',
      text: 'C avslutter mot mål.',
      highlight: 'MÅL!',
      players: {},
      ball: { goal: 'right' },
    },
  ],
});

export const MIDTBANE_ANIMATIONS = [
  TRE_HJORNER, VENDESPILL, FIRE_HJORNER, PASNINGSFIRKANT, PASNINGSSLALAM, TREDJEMANNSLOP,
];
