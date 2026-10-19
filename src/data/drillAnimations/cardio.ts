// src/data/drillAnimations/cardio.ts
// Animasjoner for cardioøvelser. Bare det som står i øvelsesteksten:
// antall spillere, oppsett og forløp. Posisjoner i meter fra banens midtpunkt.
import { defineDrillAnimation } from '@/features/drill-animation/define';

/**
 * cardio-y-02: to og to på en ball. Blå og rød kjegle med ca. 10 m mellom.
 * Fører til rød, vender, fører tilbake til blå, vender og sentrer til makkeren.
 * Minste antall (6): tre par i rekke bak blå kjegle. Brettet har én ball,
 * så bare paret som er i gang har ball; de andre venter i køa.
 */
const VENDINGSSTAFETT = defineDrillAnimation({
  drillId: 'cardio-y-02',
  name: 'Vendingsstafett',
  sport: 'football5',
  cast: {
    s1: { label: '1', family: 'mid' },
    s2: { label: '2', family: 'mid' },
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
      players: { s1: [-4, 0], s2: [-6.5, 0], k1: [-8.5, 0], k2: [-10.5, 0], k3: [-12.5, 0], k4: [-14.5, 0] },
      ball: { with: 's1', dir: [1, 0] },
    },
    {
      name: 'Til rød',
      text: 'Første spiller fører ballen til rød kjegle og vender.',
      players: { s1: [4, 0] },
      ball: { with: 's1', dir: [-1, 0] },
    },
    {
      name: 'Tilbake',
      text: 'Fører tilbake til blå kjegle og gjør en vending.',
      players: { s1: [-3.6, 2] },
      ball: { with: 's1', dir: [-1, 0] },
    },
    {
      name: 'Veksling',
      text: 'Sentrer til makkeren og still deg bakerst i køa.',
      // Langs køa, ikke gjennom den.
      players: { s1: [-16.5, 2] },
      ball: { with: 's2', dir: [1, 0] },
    },
    {
      name: 'Makkeren starter',
      text: 'Makkeren starter når første spiller er tilbake.',
      players: { s2: [-2, 0] },
      ball: { with: 's2', dir: [1, 0] },
    },
  ],
});

export const CARDIO_ANIMATIONS = [VENDINGSSTAFETT];
