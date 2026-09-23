// ══════════════════════════════════════════════════════════════
//  MIDLERTIDIG: diagnose av tegning på iOS. Fjernes etter diagnosen.
//  Aktiv bare med ?debug=draw i URL-en. Uten den gjør ingenting her noe.
// ══════════════════════════════════════════════════════════════

export interface DrawDebugState {
  pointerdown: number;
  pointermove: number;
  pointerup: number;
  pointercancel: number;
  /** onPointerLeave fra berøring midt i en strek – avsluttet streken før fiksen. */
  leaveIgnored: number;
  touchstart: number;
  touchmove: number;
  touchend: number;
  touchAction: string;
  pointerType: string;
  capture: boolean | null;
  lastStrokePts: number;
}

const initial = (): DrawDebugState => ({
  pointerdown: 0, pointermove: 0, pointerup: 0, pointercancel: 0, leaveIgnored: 0,
  touchstart: 0, touchmove: 0, touchend: 0,
  touchAction: '–', pointerType: '–', capture: null, lastStrokePts: 0,
});

let state = initial();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const isDrawDebug = (): boolean =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'draw';

export const drawDebug = {
  get: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  set: (patch: Partial<DrawDebugState>) => { state = { ...state, ...patch }; emit(); },
  bump: (key: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'leaveIgnored' | 'touchstart' | 'touchmove' | 'touchend') => {
    state = { ...state, [key]: state[key] + 1 }; emit();
  },
  reset: () => { state = initial(); emit(); },
};

const EVENTS = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend'] as const;

/** Teller hendelser på brettet. Passive lyttere i capture-fasen: de endrer ingenting. */
export function attachDrawDebug(svg: SVGSVGElement): () => void {
  const onEvent = (e: Event) => {
    drawDebug.bump(e.type as (typeof EVENTS)[number]);
    if (e.type === 'pointerdown') {
      drawDebug.set({
        pointerType: (e as PointerEvent).pointerType || '–',
        touchAction: getComputedStyle(svg).touchAction || '–',
      });
    }
  };
  drawDebug.set({ touchAction: getComputedStyle(svg).touchAction || '–' });
  EVENTS.forEach(t => svg.addEventListener(t, onEvent, { capture: true, passive: true }));
  return () => EVENTS.forEach(t => svg.removeEventListener(t, onEvent, { capture: true }));
}
