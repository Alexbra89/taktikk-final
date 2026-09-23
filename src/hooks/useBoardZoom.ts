'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ══════════════════════════════════════════════════════════════
//  ZOOM OG PANORERING PÅ BRETTET
//
//  Zoomen er en CSS-transform på en wrapper rundt SVG-en, ikke en
//  endring av viewBox. Det er et bevisst valg: toSVG i TacticBoard
//  regner om klientkoordinater via getBoundingClientRect(), som
//  allerede rapporterer den transformerte boksen. Både bredden og
//  venstrekanten skaleres da i takt, forholdet localX/renderedW blir
//  uendret, og hele koordinatkjeden – drag, ball, tegning, snapping –
//  virker uten en eneste endring. En smalere viewBox ville brutt
//  nettopp den sammenhengen.
// ══════════════════════════════════════════════════════════════

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
const STEP = 0.25;

export interface Pan { x: number; y: number }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Hvor langt panoreringen kan gå før vi drar tomrom inn i bildet. */
function clampPan(pan: Pan, zoom: number, el: HTMLElement | null): Pan {
  if (!el || zoom <= 1) return { x: 0, y: 0 };
  const { width, height } = el.getBoundingClientRect();
  // Bredden er allerede skalert, så det synlige overskuddet er (w - w/zoom) / 2.
  const maxX = (width - width / zoom) / 2;
  const maxY = (height - height / zoom) / 2;
  return { x: clamp(pan.x, -maxX, maxX), y: clamp(pan.y, -maxY, maxY) };
}

export interface BoardZoom {
  zoom: number;
  pan: Pan;
  /** Settes på elementet som omslutter SVG-en. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** style for wrapperen som skal transformeres. */
  transformStyle: React.CSSProperties;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isZoomed: boolean;
  /** True mens brukeren panorerer eller kniper – da skal drag ligge unna. */
  isGesturing: boolean;
  /** True når mellomrom holdes nede på desktop (panoreringsmodus). */
  spaceHeld: boolean;
  /** Kobles på wrapperen. Returnerer true hvis hendelsen ble spist av zoom. */
  onPointerDown: (e: React.PointerEvent) => boolean;
  onPointerMove: (e: React.PointerEvent) => boolean;
  onPointerUp: (e: React.PointerEvent) => void;
}

export function useBoardZoom(): BoardZoom {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Aktive pekere for knipebevegelsen. To fingre = pinch + panorering.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; zoom: number; mid: { x: number; y: number }; pan: Pan } | null>(null);
  const panStart = useRef<{ x: number; y: number; pan: Pan } | null>(null);

  const zoomAt = useCallback((next: number) => {
    setZoom(prev => {
      const z = clamp(next, MIN_ZOOM, MAX_ZOOM);
      if (z === 1) setPan({ x: 0, y: 0 });
      else setPan(p => clampPan(p, z, containerRef.current));
      return z;
    });
  }, []);

  const zoomIn  = useCallback(() => zoomAt(zoom + STEP), [zoom, zoomAt]);
  const zoomOut = useCallback(() => zoomAt(zoom - STEP), [zoom, zoomAt]);
  const reset   = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // ─── Ctrl+scroll på desktop ─────────────────────────────────
  // Må være en ikke-passiv listener for at preventDefault skal stoppe
  // nettleserens egen sidezoom.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoomAt(zoom - Math.sign(e.deltaY) * STEP);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, zoomAt]);

  // ─── Mellomrom = panoreringsmodus på desktop ────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ─── Pekere ─────────────────────────────────────────────────
  // Returnerer true når zoomen tar hendelsen, slik at TacticBoard vet
  // at den ikke skal starte eller fortsette et spillerdrag.
  const onPointerDown = useCallback((e: React.PointerEvent): boolean => {
    // Bare berøring teller som «finger». En mus kan aldri være den andre
    // fingeren i et knip, og lot vi den bli liggende i kartet ville neste
    // museklikk bli lest som knip og blokkere alle videre drag.
    if (e.pointerType !== 'mouse') {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        zoom,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        pan,
      };
      setIsGesturing(true);
      return true;
    }

    if (spaceHeld && e.pointerType === 'mouse') {
      panStart.current = { x: e.clientX, y: e.clientY, pan };
      setIsGesturing(true);
      return true;
    }
    return false;
  }, [zoom, pan, spaceHeld]);

  const onPointerMove = useCallback((e: React.PointerEvent): boolean => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // To fingre: knip og flytt samtidig, slik folk forventer.
    if (pinchStart.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const start = pinchStart.current;
      const z = clamp(start.zoom * (dist / (start.dist || 1)), MIN_ZOOM, MAX_ZOOM);
      setZoom(z);
      const moved = { x: start.pan.x + (mid.x - start.mid.x), y: start.pan.y + (mid.y - start.mid.y) };
      setPan(z <= 1 ? { x: 0, y: 0 } : clampPan(moved, z, containerRef.current));
      return true;
    }

    if (panStart.current) {
      const s = panStart.current;
      const moved = { x: s.pan.x + (e.clientX - s.x), y: s.pan.y + (e.clientY - s.y) };
      setPan(clampPan(moved, zoom, containerRef.current));
      return true;
    }
    return false;
  }, [zoom]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (e.pointerType === 'mouse') panStart.current = null;
    // Knipet er over så snart den andre fingeren slipper – ikke først når
    // begge er borte, ellers blir den siste fingeren hengende som «gest».
    if (pointers.current.size < 2) {
      pinchStart.current = null;
      if (!panStart.current) setIsGesturing(false);
    }
  }, []);

  return {
    zoom, pan, containerRef,
    // Ingen transform når brettet ikke er zoomet. Selv en identitetstransform
    // legger banen i et eget lag, og iOS Safari tegner ikke det laget på nytt
    // når høyden endres (verktøylinja kommer og går). Da viste skjermen en
    // gammel kopi av banen, mens berøringen traff banen der den faktisk lå.
    transformStyle: zoom > 1 ? {
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: 'center center',
      // Uten dette blir kantene hakkete mens man kniper.
      willChange: 'transform',
    } : {},
    zoomIn, zoomOut, reset,
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
    isZoomed: zoom > 1,
    isGesturing,
    spaceHeld,
    onPointerDown, onPointerMove, onPointerUp,
  };
}
