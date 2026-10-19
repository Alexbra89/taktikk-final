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

export const MIDTBANE_ANIMATIONS = [TRE_HJORNER, VENDESPILL];
