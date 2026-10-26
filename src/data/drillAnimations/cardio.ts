// src/data/drillAnimations/cardio.ts
// Animasjoner for cardioøvelser. Bare det som står i øvelsesteksten:
// antall spillere, oppsett og forløp. Posisjoner i meter fra banens midtpunkt.
import { defineDrillAnimation } from '@/features/drill-animation/define';

/**
 * cardio-y-02: to og to på en ball. Blå og rød kjegle med ca. 10 m mellom.
 * Første spiller fører opp til blå kjegle og vender, fører til rød og vender,
 * fører tilbake til blå, vender og sentrer til makkeren, og stiller seg
 * bakerst i køa. Ballen er hos spilleren hele veien til sentringen.
 * Minste antall (6): tre par i rekke bak blå kjegle (s1/s2, k1/k2, k3/k4).
 * Brettet har én ball, så bare paret som er i gang har ball.
 * Løpet går 2,2 m ved siden av kjeglene og køa, så ingen går gjennom noen.
 */
const VENDINGSSTAFETT = defineDrillAnimation({
  drillId: 'cardio-y-02',
  name: 'Vendingsstafett',
  sport: 'football5',
  cast: {
    s1: { label: '', family: 'mid' },
    s2: { label: '', family: 'mid' },
    k1: { label: '', family: 'mid' },
    k2: { label: '', family: 'mid' },
    k3: { label: '', family: 'mid' },
    k4: { label: '', family: 'mid' },
  },
  items: [
    { id: 'kjegle-blaa', type: 'cone', at: [-5, 0] },
    { id: 'kjegle-roed', type: 'cone', at: [5, 0] },
  ],
  // Kjeglene er oransje på brettet, så fargen står som tekst.
  labels: [
    { id: 'tekst-blaa', at: [-5, -1.6], text: 'Blå', color: 'blue' },
    { id: 'tekst-roed', at: [5, -1.6], text: 'Rød', color: 'orange' },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'To og to på en ball, i rekke bak blå kjegle. Blå og rød kjegle med ca. 10 m mellom.',
      players: { s1: [-8, 0], s2: [-9.8, 0], k1: [-11.6, 0], k2: [-13.4, 0], k3: [-15.2, 0], k4: [-17, 0] },
      ball: { with: 's1', dir: [1, 0] },
    },
    {
      name: 'Til blå',
      text: 'Første spiller fører ballen opp til blå kjegle og gjør en vending.',
      players: { s1: [-5, 2.2] },
      ball: { with: 's1', dir: [1, 0] },
      turn: true,
    },
    {
      name: 'Til rød',
      text: 'Fører ballen til rød kjegle og vender igjen.',
      players: { s1: [5, 2.2] },
      ball: { with: 's1', dir: [-1, 0] },
      turn: true,
    },
    {
      name: 'Tilbake til blå',
      text: 'Fører tilbake til blå kjegle og gjør en ny vending.',
      players: { s1: [-5, 2.2] },
      ball: { with: 's1', dir: [-1, -0.4] },
      turn: true,
    },
    {
      name: 'Sentring',
      text: 'Sentrer ballen til makkeren.',
      kick: 'cross',
      players: {},
      ball: { with: 's2', dir: [1, 0] },
    },
    {
      name: 'Bakerst i køa',
      text: 'Stiller seg bakerst i køa. Makkeren starter når første spiller er tilbake.',
      // Langs køa, ikke gjennom den.
      players: { s1: [-18.8, 2.2] },
      ball: { with: 's2', dir: [1, 0] },
    },
  ],
});

/**
 * cardio-y-03: to rekker mot hverandre med ca. 10–15 m mellom og en sikk-sakk-
 * løype av kjegler. Fremste spiller fører sikk-sakk over til den fremste på
 * den andre siden, løper over og stiller seg bakerst i motsatt rekke; neste
 * starter med en gang. Minste antall (8): fire i hver rekke. Løpet bakover går
 * ved siden av rekka, ikke gjennom den.
 */
const SIKK_SAKK_REKKE = defineDrillAnimation({
  drillId: 'cardio-y-03',
  name: 'Føre på løpende rekke i sikk-sakk',
  sport: 'football5',
  cast: {
    a1: { label: '', family: 'mid' },
    a2: { label: '', family: 'mid' },
    a3: { label: '', family: 'mid' },
    a4: { label: '', family: 'mid' },
    b1: { label: '', family: 'att' },
    b2: { label: '', family: 'att' },
    b3: { label: '', family: 'att' },
    b4: { label: '', family: 'att' },
  },
  items: [
    { id: 'kjegle-1', type: 'cone', at: [-3.5, -1] },
    { id: 'kjegle-2', type: 'cone', at: [0, 1] },
    { id: 'kjegle-3', type: 'cone', at: [3.5, -1] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'To rekker mot hverandre med ca. 14 m mellom, og en sikk-sakk-løype av kjegler.',
      players: {
        a1: [-7, 0], a2: [-8.8, 0], a3: [-10.6, 0], a4: [-12.4, 0],
        b1: [7, 0], b2: [8.8, 0], b3: [10.6, 0], b4: [12.4, 0],
      },
      ball: { with: 'a1', dir: [1, 0] },
    },
    {
      name: 'Sikk',
      text: 'Fremste spiller fører ballen sikk-sakk mellom kjeglene …',
      players: { a1: [-3.5, 1.2] },
      ball: { with: 'a1', dir: [1, 0] },
    },
    {
      name: 'Sakk',
      text: '… rundt neste kjegle …',
      players: { a1: [0, -1.2] },
      ball: { with: 'a1', dir: [1, 0] },
    },
    {
      name: 'Over',
      text: '… og over mot den fremste på den andre siden.',
      players: { a1: [3.5, 1.2] },
      ball: { with: 'a1', dir: [1, 0] },
    },
    {
      name: 'Levert',
      text: 'Ballen er levert til den fremste på andre siden.',
      players: { a1: [5.2, 1.8] },
      ball: { with: 'b1', dir: [0, -1] },
    },
    {
      name: 'Bakerst',
      text: 'Spilleren løper over og stiller seg bakerst i motsatt rekke. Neste starter med en gang.',
      players: { a1: [14.2, 2.4], b1: [3.5, -2.4] },
      ball: { with: 'b1', dir: [-1, 0] },
    },
  ],
});

/**
 * cardio-y-09: lag på 4–5 i rekke ved starten av en kjeglesløyfe (ca. 15–20 m
 * rundt; her seks kjegler, ca. 19 m). Første spiller fører rundt sløyfen,
 * siste i rekka er jeger uten ball og starter etter føreren. Når føreren er
 * tilbake, blir jegeren fører. Ett lag vises (lag på fire).
 */
const JAKTSTAFETT = defineDrillAnimation({
  drillId: 'cardio-y-09',
  name: 'Jaktstafett med ball',
  sport: 'football5',
  cast: {
    f: { label: 'F', family: 'mid' },
    r2: { label: '', family: 'mid' },
    r3: { label: '', family: 'mid' },
    j: { label: 'J', family: 'att' },
  },
  items: [
    { id: 'kjegle-1', type: 'cone', at: [0, -1.8] },
    { id: 'kjegle-2', type: 'cone', at: [3, -1.8] },
    { id: 'kjegle-3', type: 'cone', at: [6, -1.8] },
    { id: 'kjegle-4', type: 'cone', at: [6, 1.8] },
    { id: 'kjegle-5', type: 'cone', at: [3, 1.8] },
    { id: 'kjegle-6', type: 'cone', at: [0, 1.8] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Laget står i rekke ved starten av kjeglesløyfen. Første spiller har ballen, siste er jeger.',
      players: { f: [-0.8, -2.6], r2: [-2.6, -2.6], r3: [-4.4, -2.6], j: [-6.2, -2.6] },
      ball: { with: 'f', dir: [1, 0] },
    },
    {
      name: 'Start',
      text: 'Føreren fører ballen rundt sløyfen. Jegeren starter etter, uten ball.',
      players: { f: [6.8, -2.6], j: [-6.2, -4.6] },
      ball: { with: 'f', dir: [0, 1] },
    },
    {
      name: 'Jakt',
      text: 'Jegeren prøver å ta igjen føreren før sløyfen er ferdig.',
      players: { f: [6.8, 2.6], j: [4, -4.4] },
      ball: { with: 'f', dir: [-1, 0] },
    },
    {
      name: 'Siste side',
      text: 'Føreren er på siste side av sløyfen, med jegeren etter seg.',
      players: { f: [-0.8, 2.6], j: [7.6, 0] },
      ball: { with: 'f', dir: [0, -1] },
    },
    {
      name: 'Tilbake',
      text: 'Føreren kommer tilbake til starten.',
      players: { f: [-1.2, -0.6], j: [2, 2.8] },
      ball: { with: 'f', dir: [1, 0] },
    },
    {
      name: 'Bytte',
      text: 'Roller byttes: jegeren blir fører, og en ny jeger stiller seg bakerst.',
      players: { j: [0.6, 0.4] },
      ball: { with: 'j', dir: [1, 0] },
    },
  ],
});

/**
 * cardio-a-02: et ledd på 4 spillere på linje, med en kjegle 3–5 m foran hver
 * (her 4 m). Treneren spiller ballen mot én kjegle; spilleren i den sonen går
 * ut i press, de tre andre skyver mot ballsiden. Første forsvarer spiller
 * ballen tilbake, og alle løper tilbake til utgangsposisjonene.
 */
const SONEFORSVAR = defineDrillAnimation({
  drillId: 'cardio-a-02',
  name: "Prepp'n 4 – Soneforsvar: ut av ledd og komprimere",
  sport: 'football5',
  cast: {
    t: { label: 'T', family: 'mid' },
    f1: { label: '', family: 'def' },
    f2: { label: '', family: 'def' },
    f3: { label: '', family: 'def' },
    f4: { label: '', family: 'def' },
  },
  items: [
    { id: 'kjegle-1', type: 'cone', at: [-2, -6] },
    { id: 'kjegle-2', type: 'cone', at: [-2, -2] },
    { id: 'kjegle-3', type: 'cone', at: [-2, 2] },
    { id: 'kjegle-4', type: 'cone', at: [-2, 6] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'Et ledd på fire spillere på linje, med en kjegle foran hver. Treneren har ballen.',
      players: { t: [-12, 0], f1: [2, -6], f2: [2, -2], f3: [2, 2], f4: [2, 6] },
      ball: { with: 't', dir: [1, 0] },
    },
    {
      name: 'Serve og press',
      text: 'Treneren spiller mot én kjegle. Den spilleren går ut i press; de tre andre skyver mot ballsiden.',
      players: { f1: [2.6, -5.2], f2: [-1.4, -2.4], f3: [1.6, -0.4], f4: [2, 3.4] },
      ball: { with: 'f2', dir: [-1, 0] },
    },
    {
      name: 'Tilbake',
      text: 'Første forsvarer spiller ballen tilbake, og alle løper raskt tilbake til utgangsposisjonene.',
      players: { f1: [2, -6], f2: [2, -2], f3: [2, 2], f4: [2, 6] },
      ball: { with: 't', dir: [1, 0] },
    },
  ],
});

/**
 * cardio-a-10: to kjegler A og B ca. 15–20 m fra hverandre (her 17 m).
 * Spiller A fører ballen til motsatt kjegle, vender og fører tilbake.
 * Partneren B hviler ved A.
 */
const PENDELLOP = defineDrillAnimation({
  drillId: 'cardio-a-10',
  name: 'Pendelløp med ball (repetert sprint)',
  sport: 'football5',
  cast: {
    a: { label: 'A', family: 'mid' },
    b: { label: 'B', family: 'mid' },
  },
  items: [
    { id: 'kjegle-a', type: 'cone', at: [-8.5, 0] },
    { id: 'kjegle-b', type: 'cone', at: [8.5, 0] },
  ],
  phases: [
    {
      name: 'Oppsett',
      text: 'To kjegler, A og B, ca. 15–20 m fra hverandre. Spiller A har ballen; B hviler ved A.',
      players: { a: [-8.5, 1.6], b: [-10.7, 4] },
      ball: { with: 'a', dir: [1, 0] },
    },
    {
      name: 'Til B',
      text: 'A fører ballen til motsatt kjegle og vender.',
      turn: true,
      players: { a: [8.5, 1.6] },
      ball: { with: 'a', dir: [-1, 0] },
    },
    {
      name: 'Tilbake',
      text: 'A fører tilbake. Bytt etter 6–8 drag, med pause omtrent dobbelt så lang som arbeidet.',
      players: { a: [-8.5, 1.6] },
      ball: { with: 'a', dir: [-1, 0] },
    },
  ],
});

export const CARDIO_ANIMATIONS = [VENDINGSSTAFETT, SIKK_SAKK_REKKE, JAKTSTAFETT, SONEFORSVAR, PENDELLOP];
