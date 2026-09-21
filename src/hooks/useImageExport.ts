'use client';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic } from '@/store/selectors';
import { exportScale, imageFilename, svgToPngBlob } from '@/lib/exportImage';
import { downloadBlob } from '@/lib/download';

/**
 * Last ned fasen som vises i `svgRef` som PNG. Felles for vanlig brett og
 * fullskjerm; fullskjerm har sin egen fase-indeks, derfor tas den inn.
 */
export function useImageExport(svgRef: React.RefObject<SVGSVGElement>, phaseIdx: number) {
  const teamName = useAppStore(s => s.homeTeamName);
  const tactic   = useActiveTactic();

  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const exportPng = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const blob = await svgToPngBlob(svg, exportScale());
      const phase = tactic.phases[phaseIdx];
      downloadBlob(imageFilename(teamName, tactic.name, phase?.name || `Fase ${phaseIdx + 1}`), blob);
    } catch (e) {
      setError(`Kunne ikke lage bildet.${e instanceof Error && e.message ? ' ' + e.message : ''}`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [svgRef, tactic, phaseIdx, teamName]);

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, exportPng, clearError };
}
