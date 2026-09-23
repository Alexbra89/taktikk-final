import type React from 'react';
import { VW, VH } from '@/data/formations';

// ─── KONSTANTER ───────────────────────────────────────────────
export const MIN_DIST     = 46;
export const SNAP_R       = 15;
export const LONG_PRESS   = 100;
export const DRAG_THRESH  = 6;
export const MAX_UNDO     = 25;
// Minimal bounds – kun stort nok til at trøyeikon/navnelapp ikke klippes
// av SVG-en. Spillere skal ellers kunne flyttes fritt over hele banen,
// helt ut til sidelinjer og mål-/dødlinjer.
export const CLAMP_X        = 24;
export const CLAMP_Y_TOP    = 22;
export const CLAMP_Y_BOTTOM = 56;

/**
 * Stilen til bane-SVG-en: boksen har banens proporsjoner og sentreres i
 * forelderen (en flex-kolonne). Smalt brett: bredden bestemmer. Bredt brett:
 * max-height begrenser, og tomrommet havner på sidene.
 */
export const PITCH_BOX: React.CSSProperties = {
  display: 'block', flex: 'none',
  width: '100%', height: 'auto', maxHeight: '100%',
  aspectRatio: `${VW} / ${VH}`,
  margin: 'auto 0',
};
