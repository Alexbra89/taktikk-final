'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ITEM_RADIUS, normalizeRotation } from '@/data/boardItems';
import type { BoardItem, BoardItemType, Position, TacticPhase } from '@/types';

// ══════════════════════════════════════════════════════════════
//  UTSTYR PÅ BRETTET – dra, marker, roter, slett
//  Felles for TacticBoard og FullscreenBoard. Brettet eier
//  koordinatomregningen (toSVG) og bestemmer når utstyret kan røres.
//
//  Posisjon og rotasjon lever lokalt mens de endres, og skrives til
//  storen først ved slipp – ellers ville hver pekerbevegelse lagret hele
//  appens tilstand.
// ══════════════════════════════════════════════════════════════

/** Knappene roterer så mange grader per trykk. */
export const ROT_STEP = 15;

interface Options {
  /** Fasen utstyret hører til: den storen står i. */
  phase: TacticPhase | null | undefined;
  /** Utstyret kan røres (ikke under avspilling eller tegning). */
  enabled: boolean;
  /** Klemt til banen – til posisjon. */
  toSVG: (cx: number, cy: number) => Position;
  /** Uklemt – til vinkelen i rotasjonshåndtaket. */
  toSVGRaw: (cx: number, cy: number) => Position;
  /** Knip eller panorering eier pekeren. */
  isGesturing: () => boolean;
  /** Så langt pekeren må flytte seg før et trykk blir et drag, i skjermpiksler. */
  dragThreshold: number;
}

export function useBoardItems({ phase, enabled, toSVG, toSVGRaw, isGesturing, dragThreshold }: Options) {
  const addItem    = useAppStore(s => s.addItem);
  const moveItem   = useAppStore(s => s.moveItem);
  const rotateItem = useAppStore(s => s.rotateItem);
  const removeItem = useAppStore(s => s.removeItem);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragPos, setDragPos]       = useState<{ id: string; x: number; y: number } | null>(null);
  const [rotPreview, setRotPreview] = useState<{ id: string; deg: number } | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number; startX: number; startY: number; started: boolean } | null>(null);
  const rotRef  = useRef<{ id: string; pointerId: number } | null>(null);
  // Håndtaket er for mus og penn. På berøring er knappene tryggere enn et lite punkt.
  const [finePointer] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches);

  const items = phase?.items;
  const findItem = useCallback((id: string) => items?.find(i => i.id === id), [items]);

  // Markeringen hører til fasen det står i.
  const phaseId = phase?.id;
  useEffect(() => { setSelectedId(null); }, [phaseId]);

  /** Avbryter et pågående drag, f.eks. når en andre finger lander. */
  const cancel = useCallback(() => {
    dragRef.current = null;
    rotRef.current = null;
    setDragPos(null);
    setRotPreview(null);
  }, []);

  // ─── Dra og marker ──────────────────────────────────────────
  const onDown = useCallback((e: React.PointerEvent, id: string) => {
    if (!enabled || isGesturing()) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { id, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, started: false };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, [enabled, isGesturing]);

  const onMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId || isGesturing()) return;
    e.preventDefault();
    if (!d.started && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) <= dragThreshold) return;
    d.started = true;
    const p = toSVG(e.clientX, e.clientY);
    setDragPos({ id: d.id, x: p.x, y: p.y });
  }, [toSVG, isGesturing, dragThreshold]);

  const onUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    e.preventDefault();
    dragRef.current = null;
    if (d.started) {
      moveItem(d.id, toSVG(e.clientX, e.clientY));
      setDragPos(null);
      setSelectedId(d.id);
    } else {
      // Et trykk uten bevegelse markerer – eller fjerner markeringen.
      setSelectedId(id => id === d.id ? null : d.id);
    }
  }, [toSVG, moveItem]);

  const itemGroupProps = useCallback((item: BoardItem): React.SVGProps<SVGGElement> => ({
    onPointerDown: (e: React.PointerEvent) => onDown(e, item.id),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
    style: { cursor: enabled ? 'grab' : 'default', touchAction: 'none' },
  }), [onDown, onMove, onUp, enabled]);

  // ─── Roter ──────────────────────────────────────────────────
  const rotateBy = useCallback((delta: number) => {
    const it = selectedId ? findItem(selectedId) : undefined;
    if (it) rotateItem(it.id, (it.rotation ?? 0) + delta);
  }, [selectedId, findItem, rotateItem]);

  // Håndtaket roterer fritt, men låser seg til nærmeste 45° innenfor 4°,
  // så en stige lett blir helt rett.
  const angleTo = useCallback((id: string, cx: number, cy: number): number | null => {
    const it = findItem(id);
    if (!it) return null;
    const p = toSVGRaw(cx, cy);
    // Håndtaket sitter rett over elementet ved 0°, så «opp» er 0°.
    let deg = Math.atan2(p.y - it.position.y, p.x - it.position.x) * 180 / Math.PI + 90;
    const snap = Math.round(deg / 45) * 45;
    if (Math.abs(deg - snap) <= 4) deg = snap;
    return normalizeRotation(deg);
  }, [findItem, toSVGRaw]);

  const onRotDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    rotRef.current = { id, pointerId: e.pointerId };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, []);

  const onRotMove = useCallback((e: React.PointerEvent) => {
    const r = rotRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    e.preventDefault();
    const deg = angleTo(r.id, e.clientX, e.clientY);
    if (deg !== null) setRotPreview({ id: r.id, deg });
  }, [angleTo]);

  const onRotUp = useCallback((e: React.PointerEvent) => {
    const r = rotRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    e.preventDefault();
    rotRef.current = null;
    const deg = angleTo(r.id, e.clientX, e.clientY);
    if (deg !== null) rotateItem(r.id, deg);
    setRotPreview(null);
  }, [angleTo, rotateItem]);

  // ─── Legg til og slett ──────────────────────────────────────
  const add = useCallback((type: BoardItemType) => { setSelectedId(addItem(type)); }, [addItem]);

  const removeSelected = useCallback(() => {
    if (selectedId) removeItem(selectedId);
    setSelectedId(null);
  }, [selectedId, removeItem]);

  // Delete/Backspace på tastaturet sletter det markerte elementet.
  useEffect(() => {
    if (!enabled || !selectedId) return;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [enabled, selectedId, removeSelected]);

  // ─── Det som vises ──────────────────────────────────────────
  // Elementet som dras eller roteres står der pekeren er.
  const displayItems = useMemo(() => (items ?? []).map(it => {
    let out = it;
    if (dragPos && dragPos.id === it.id) out = { ...out, position: { x: dragPos.x, y: dragPos.y } };
    if (rotPreview && rotPreview.id === it.id) out = { ...out, rotation: rotPreview.deg };
    return out;
  }), [items, dragPos, rotPreview]);

  const selectedItem = selectedId ? findItem(selectedId) ?? null : null;
  const shown = selectedId ? displayItems.find(it => it.id === selectedId) ?? null : null;

  // Rotasjonshåndtaket: en liten ring over det markerte elementet, som følger
  // rotasjonen. Arbeidsmarkering – ikke med i eksportert bilde.
  const rotHandle = (!finePointer || !enabled || !shown || dragPos) ? null : (() => {
    const { x, y } = shown.position;
    const rad = ((shown.rotation ?? 0) - 90) * Math.PI / 180;
    const dist = ITEM_RADIUS[shown.type] + 18;
    const hx = x + Math.cos(rad) * dist, hy = y + Math.sin(rad) * dist;
    return (
      <g data-export="skip" data-item="true">
        <line x1={x} y1={y} x2={hx} y2={hy} strokeWidth={1} strokeDasharray="3,3"
          style={{ stroke: 'rgb(var(--k-ink))', pointerEvents: 'none' }} opacity={0.5}/>
        <circle cx={hx} cy={hy} r={6} strokeWidth={1.5}
          style={{ fill: 'rgb(var(--k-pitch))', stroke: 'rgb(var(--k-ink))', cursor: 'grab', touchAction: 'none' }}
          onPointerDown={e => onRotDown(e, shown.id)}
          onPointerMove={onRotMove} onPointerUp={onRotUp} onPointerCancel={onRotUp}>
          <title>Dra for å rotere</title>
        </circle>
      </g>
    );
  })();

  return {
    displayItems, selectedItem, selectedId: selectedItem ? selectedId : null,
    itemGroupProps, rotHandle,
    add, rotateBy, removeSelected, cancel,
  };
}
