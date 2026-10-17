'use client';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Position, TacticPhase } from '@/types';
import { MAX_UNDO } from '@/components/board/constants';

// ══════════════════════════════════════════════════════════════
//  ANGRE / GJØR OM FOR SPILLERFLYTT – lå før inne i TacticBoard.
//  Stablene, knappenes dybde og hurtigtastene Ctrl+Z / Ctrl+Y.
//  Brettet bestemmer når historikken nullstilles (resetHistory).
// ══════════════════════════════════════════════════════════════

/**
 * Én handling som kan angres. Et bytte flytter to spillere og må angres
 * samlet – ellers går bare den ene tilbake, og de havner oppå hverandre.
 */
export interface UndoEntry {
  moves: { playerId: string; prevPos: { x: number; y: number } }[];
}

export function useUndoRedo(
  phase: TacticPhase | null,
  movePlayer: (playerId: string, pos: Position) => void,
  /** Hurtigtastene er av (3D-visningen). */
  keysDisabled: boolean,
) {
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);
  const [undoDepth, setUndoDepth] = useState(0);
  const [redoDepth, setRedoDepth] = useState(0);

  // Stablene ligger i refs (de skal ikke utløse ny tegning under drag), men
  // knappene må vite om det finnes noe å angre. Dybden speiles derfor i state.
  const syncDepths = useCallback(() => {
    setUndoDepth(undoStack.current.length);
    setRedoDepth(redoStack.current.length);
  }, []);

  const pushUndo = useCallback((e:UndoEntry) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO+1), e];
    redoStack.current = [];
    syncDepths();
  }, [syncDepths]);

  /** Flytter alle spillerne i øverste oppføring tilbake, og legger stillingen nå på den andre stakken. */
  const restore = useCallback((from: React.MutableRefObject<UndoEntry[]>, to: React.MutableRefObject<UndoEntry[]>) => {
    const e = from.current.pop();
    if (e && phase) {
      const moves = e.moves.flatMap(m => {
        const p = phase.players.find(pl => pl.id === m.playerId);
        return p ? [{ m, now: { ...p.position } }] : [];
      });
      if (moves.length) {
        to.current.push({ moves: moves.map(({ m, now }) => ({ playerId: m.playerId, prevPos: now })) });
        moves.forEach(({ m }) => movePlayer(m.playerId, m.prevPos));
      }
    }
    syncDepths();
  }, [phase, movePlayer, syncDepths]);

  const doUndo = useCallback(() => restore(undoStack, redoStack), [restore]);
  const doRedo = useCallback(() => restore(redoStack, undoStack), [restore]);

  useEffect(() => {
    const h = (e:KeyboardEvent) => {
      if (keysDisabled) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable)) return;
      if ((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey) { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); doRedo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [doUndo, doRedo, keysDisabled]);

  /** Tømmer begge stablene. */
  const resetHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    syncDepths();
  }, [syncDepths]);

  return { undoDepth, redoDepth, pushUndo, doUndo, doRedo, resetHistory };
}
