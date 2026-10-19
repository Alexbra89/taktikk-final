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

export const CARDIO_ANIMATIONS = [VENDINGSSTAFETT];
