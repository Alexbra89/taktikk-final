import type { BoardItemType } from '../types';

// Utstyret som kan settes på banen. Utseendet ligger i
// components/board/svg/BoardItemShape.tsx; her er bare navn og mål,
// som også storen trenger når den finner plass til et nytt element.

export const BOARD_ITEMS: { type: BoardItemType; label: string }[] = [
  { type: 'cone',      label: 'Kjegle' },
  { type: 'opponent',  label: 'Motstander' },
  { type: 'minigoal',  label: 'Minimål' },
  { type: 'mannequin', label: 'Dukke' },
  { type: 'ladder',    label: 'Stige' },
  { type: 'hurdle',    label: 'Hekk' },
  { type: 'ball',      label: 'Ekstra ball' },
];

export const BOARD_ITEM_TYPES: BoardItemType[] = BOARD_ITEMS.map(i => i.type);

export const itemLabel = (type: BoardItemType) => BOARD_ITEMS.find(i => i.type === type)?.label ?? 'Utstyr';

/** Halv bredde – til treffflate, markeringsring og plassering. I SVG-enheter. */
export const ITEM_RADIUS: Record<BoardItemType, number> = {
  cone: 12, opponent: 15, minigoal: 22, mannequin: 14, ladder: 44, hurdle: 18, ball: 10,
};
