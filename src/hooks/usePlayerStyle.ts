'use client';

import { useCallback, useSyncExternalStore } from 'react';

// Spillerne som drakt (standard) eller som sirkel. Et visningsvalg, ikke
// taktikkdata: lagres i localStorage som temaet, og følges av brettet,
// fullskjerm og videoeksporten. Bildeeksporten tar det som vises.

export type PlayerStyle = 'kit' | 'chip';

const STORAGE_KEY = 'taktikk:player-style';
const CHANGE_EVENT = 'taktikk:player-style';

let current: PlayerStyle | null = null;

/** Valget nå. Blokkert lagring gir standard, og valget gjelder da bare denne økten. */
export function readPlayerStyle(): PlayerStyle {
  if (current === null) {
    try {
      current = window.localStorage.getItem(STORAGE_KEY) === 'chip' ? 'chip' : 'kit';
    } catch {
      current = 'kit';
    }
  }
  return current;
}

function subscribe(onChange: () => void) {
  // Endret i en annen fane: les på nytt.
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) { current = null; onChange(); } };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function usePlayerStyle() {
  const style = useSyncExternalStore(subscribe, readPlayerStyle, (): PlayerStyle => 'kit');
  const setStyle = useCallback((next: PlayerStyle) => {
    current = next;
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* gjelder bare denne økten */ }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [style, setStyle] as const;
}
