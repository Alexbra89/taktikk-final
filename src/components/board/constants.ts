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

export const GLASS = {
  panel:  'rgba(8, 15, 35, 0.75)',
  border: 'rgba(56, 189, 248, 0.12)',
  hover:  'rgba(56, 189, 248, 0.07)',
  active: 'rgba(56, 189, 248, 0.15)',
};
