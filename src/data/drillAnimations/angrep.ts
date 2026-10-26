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

export const ANGREP_ANIMATIONS = [SKYTESTAFETT, FEILVENDT_SPISS];
