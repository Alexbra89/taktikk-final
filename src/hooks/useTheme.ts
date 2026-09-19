'use client';

import { useCallback, useState } from 'react';

// Kalk-tema: kveld (standard) eller dagslys. Lagres i localStorage og
// settes som data-theme på <html>. Et lite skript i layout.tsx leser den
// samme nøkkelen før første maling, så dagslys ikke blinker mørkt ved last.

export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'taktikk:theme';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch { /* blokkert lagring – temaet gjelder bare denne økten */ }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === 'light' ? 'dark' : 'light');
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
