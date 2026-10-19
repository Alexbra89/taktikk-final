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

export const FORSVAR_ANIMATIONS = [MURBYGGERNE, BRYTEREN];
