// src/data/drillAnimations/index.ts
// Alle animerte øvelser, én fil per kategori. Koblet til øvelsen via
// drillId. Ligger fast i appen og lagres aldri hos brukeren.
import type { DrillAnimation } from '@/features/drill-animation/types';
import { KEEPER_ANIMATIONS } from './keeper';
import { FORSVAR_ANIMATIONS } from './forsvar';
import { MIDTBANE_ANIMATIONS } from './midtbane';
import { ANGREP_ANIMATIONS } from './angrep';
import { CARDIO_ANIMATIONS } from './cardio';

export const ALL_DRILL_ANIMATIONS: DrillAnimation[] = [
  ...KEEPER_ANIMATIONS,
  ...FORSVAR_ANIMATIONS,
  ...MIDTBANE_ANIMATIONS,
  ...ANGREP_ANIMATIONS,
  ...CARDIO_ANIMATIONS,
];

const BY_DRILL = new Map(ALL_DRILL_ANIMATIONS.map(animation => [animation.drillId, animation]));

export function getDrillAnimation(drillId: string): DrillAnimation | undefined {
  return BY_DRILL.get(drillId);
}

export const hasDrillAnimation = (drillId: string) => BY_DRILL.has(drillId);
