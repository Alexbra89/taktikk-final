'use client';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { DrawingType, Position } from '@/types';
import { buildDrawing, DRAW_COLORS } from '@/components/board/drawTools';

// ══════════════════════════════════════════════════════════════
//  TEGNING MED PEKER – felles for TacticBoard og FullscreenBoard
//  Håndtererne kobles på <svg>. Koordinatomregningen (toSVG) eies av
//  brettet, fordi den må speile brettets egen letterbox og zoom.
// ══════════════════════════════════════════════════════════════

interface Options {
  /** Tegnemodus er på, og ingenting annet (avspilling) eier brettet. */
  enabled: boolean;
  /** Brettet håndtererne kobles på. Trengs for touch-sperren under, som React ikke kan sette opp. */
  svgRef: React.RefObject<SVGSVGElement>;
  toSVG: (clientX: number, clientY: number) => Position;
  /** Knip eller panorering eier pekeren. En funksjon, så verdien leses ved hvert trykk. */
  isGesturing: () => boolean;
}

export function useDrawingInput({ enabled, svgRef, toSVG, isGesturing }: Options) {
  const addDrawing = useAppStore(s => s.addDrawing);

  const [tool,         setTool]         = useState<DrawingType>('freehand');
  const [color,        setColor]        = useState(DRAW_COLORS[0]);
  const [livePts,      setLivePts]      = useState<Position[]>([]);
  // Tekst trenger innhold før den kan lagres: trykket husker bare hvor.
  const [pendingLabel, setPendingLabel] = useState<Position | null>(null);

  const ptsRef    = useRef<Position[]>([]);
  const activeRef = useRef(false);

  // iOS Safari respekterer ikke alltid touch-action: none på <svg>. Da tar
  // nettleseren fingeren til rulling eller zoom etter noen få punkter, sender
  // pointercancel, og streken stopper. Tegningen går fortsatt bare via
  // pekerhendelser; dette hindrer kun nettleseren i å ta over mens en strek
  // pågår. Lytteren må være ikke-passiv, og det kan ikke Reacts onTouchMove.
  // Android og desktop har allerede touch-action, så der endrer det ingenting.
  useEffect(() => {
    const svg = svgRef.current;
    if (!enabled || !svg) return;
    const block = (e: TouchEvent) => { if (activeRef.current && e.cancelable) e.preventDefault(); };
    svg.addEventListener('touchmove', block, { passive: false });
    return () => svg.removeEventListener('touchmove', block);
  }, [enabled, svgRef]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled || isGesturing()) return;
    if ((e.target as Element).closest('[data-player]')) return;
    e.preventDefault();
    activeRef.current = true;
    const pt = toSVG(e.clientX, e.clientY);
    ptsRef.current = [pt]; setLivePts([pt]);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled || !activeRef.current) return;
    e.preventDefault();
    ptsRef.current.push(toSVG(e.clientX, e.clientY));
    setLivePts([...ptsRef.current]);
  };

  /** Avbryter en påbegynt strek uten å lagre den, f.eks. når en andre finger lander. */
  const cancel = useCallback(() => {
    activeRef.current = false;
    ptsRef.current = [];
    setLivePts([]);
  }, []);

  const onPointerUp = () => {
    if (enabled && activeRef.current) {
      if (tool === 'label') {
        setPendingLabel(ptsRef.current[0]);
      } else {
        const d = buildDrawing(tool, ptsRef.current, color);
        if (d) addDrawing(d);
      }
    }
    cancel();
  };

  // Bare musen avslutter streken ved å forlate brettet. Berøring og penn
  // får alltid pointerup eller pointercancel. iOS Safari sender dessuten
  // pointerout midt i et strøk, og React gjør det om til onPointerLeave.
  // Da ble streken lagret etter første bevegelse: to punkter, resten tapt.
  const onPointerLeave = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') onPointerUp();
  };

  const commitLabel = (text: string) => {
    const t = text.trim();
    if (t && pendingLabel) addDrawing({ type: 'label', at: pendingLabel, text: t, color });
    setPendingLabel(null);
  };

  // Stabil identitet: Modal flytter fokus til panelet hver gang onClose endres,
  // og ville ellers stjele fokus fra tekstfeltet ved hver render av brettet.
  const cancelLabel = useCallback(() => setPendingLabel(null), []);

  /** Det som tegnes mens pekeren fortsatt er nede. */
  const preview = useMemo(
    () => (livePts.length > 1 ? buildDrawing(tool, livePts, color) : null),
    [tool, livePts, color],
  );

  return {
    tool, setTool, color, setColor,
    preview, pendingLabel, commitLabel, cancelLabel,
    // Nettleseren tok pekeren: forkast streken. Å lagre de få punktene
    // som rakk å komme, var det som ga prikker i stedet for streker på iOS.
    onPointerCancel: cancel,
    onPointerDown, onPointerMove, onPointerUp, onPointerLeave, cancel,
  };
}
