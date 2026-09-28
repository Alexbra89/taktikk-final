import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoardStage } from './BoardStage';
import { videoFrameElement } from '@/hooks/useVideoExport';
import { frameAt, videoDurationMs } from '@/lib/exportVideo';
import { useAppStore } from '@/store/useAppStore';
import type { Tactic } from '@/types';

// Tom bane med spiller og kjegle lagt til via utstyr. Brettet, fullskjerm og
// PNG-eksporten tegner banen med BoardStage (PNG serialiserer den samme SVG-en),
// og videoen med videoFrameElement. Spilleren er utstyrstypen «player»: drakten
// i signalfarge.
const PLAYER = 'fill:rgb(var(--k-signal))';
const CONE = 'fill:#F97316';

describe('tom bane: spillere og utstyr i brett, fullskjerm, PNG og video', () => {
  const s = useAppStore.getState;
  const initial = s();
  let tactic: Tactic;

  beforeAll(() => {
    // Se useVideoExport.test.ts: React 18s server-renderer advarer om <feDropShadow>.
    const original = console.error;
    vi.spyOn(console, 'error').mockImplementation((msg, ...rest) => {
      if (String(msg).includes('incorrect casing') && rest[0] === 'feDropShadow') return;
      original(msg, ...rest);
    });
    s().addTactic(undefined, { empty: true });
    const p = s().addItem('player');
    s().addItem('cone');
    s().moveItem(p, { x: 200, y: 300 });
    s().addPhase();
    s().moveItem(p, { x: 600, y: 300 });
    tactic = s().tactics.find(t => t.id === s().activeTacticId)!;
  });
  afterAll(() => { useAppStore.setState(initial, true); vi.restoreAllMocks(); });

  it('brettet (og dermed fullskjerm og PNG) viser spilleren og utstyret, ingen formasjonsspillere', () => {
    const ph = tactic.phases[1];
    const m = renderToStaticMarkup(React.createElement(BoardStage, {
      players: [], ball: ph.ball, drawings: ph.drawings, items: ph.items,
    }));
    expect(m).toContain(PLAYER);
    expect(m).toContain(CONE);
    expect(m).toContain('translate(600 300)');
    expect(m).not.toContain('data-player');
  });

  it('videoen viser spilleren og utstyret, og spilleren glir mellom fasene', () => {
    const at = (elapsed: number) =>
      renderToStaticMarkup(videoFrameElement(tactic, frameAt(tactic.phases, elapsed), 'kit'));
    const start = at(0), mid = at(videoDurationMs(2) / 2), end = at(videoDurationMs(2));
    for (const m of [start, mid, end]) {
      expect(m).toContain(PLAYER);
      expect(m).toContain(CONE);
      expect(m).not.toContain('data-player');
    }
    expect(start).toContain('translate(200 300)');
    expect(mid).toContain('translate(400 300)');
    expect(end).toContain('translate(600 300)');
  });
});
