import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { videoFrameElement } from './useVideoExport';
import { frameAt, videoDurationMs, VIDEO_TAIL_MS } from '@/lib/exportVideo';
import { useAppStore } from '@/store/useAppStore';

describe('videobildet', () => {
  const tactic = useAppStore.getState().tactics[0];
  let markup = '';

  // React 18s server-renderer kjenner ikke SVG-elementet <feDropShadow> og
  // advarer om «incorrect casing». I nettleseren lages det i SVG-navnerommet
  // uten advarsel (røyktestene i e2e/ feiler på feil i konsollen). Bare denne
  // ene advarselen holdes unna; alt annet slipper gjennom.
  beforeAll(() => {
    const original = console.error;
    vi.spyOn(console, 'error').mockImplementation((msg, ...rest) => {
      // React sender den som formatstreng: «<%s /> is using incorrect casing», 'feDropShadow'.
      if (String(msg).includes('incorrect casing') && rest[0] === 'feDropShadow') return;
      original(msg, ...rest);
    });
    markup = renderToStaticMarkup(videoFrameElement(tactic, frameAt(tactic.phases, 0), 'kit'));
  });
  afterAll(() => { vi.restoreAllMocks(); });

  it('ballen vises i video på iOS: filteret ballen bruker finnes i bildet', () => {
    // WebKit tegner ikke et element som peker på et filter som mangler.
    const used = /filter="url\(#([\w-]+)\)"/.exec(markup)?.[1];
    expect(used).toBeDefined();
    expect(markup).toContain(`id="${used}"`);
  });

  it('bildet har alle spillerne og ballen', () => {
    expect((markup.match(/data-player="true"/g) ?? []).length).toBe(tactic.phases[0].players.length);
    expect(markup).toContain('r="10"');   // ballen
  });
});

describe('tegningene i videoen', () => {
  // Første fase har en blå pil, siste fase et oransje rektangel. Fargen
  // skiller dem i markupen (style="stroke: rgb(var(--k-draw-…))").
  const s = useAppStore.getState;
  const initial = s();
  let tactic = initial.tactics[0];

  beforeAll(() => {
    const original = console.error;
    vi.spyOn(console, 'error').mockImplementation((msg, ...rest) => {
      if (String(msg).includes('incorrect casing') && rest[0] === 'feDropShadow') return;
      original(msg, ...rest);
    });
    s().addDrawing({ type: 'arrow', pts: [{ x: 100, y: 100 }, { x: 300, y: 200 }], color: '#5B9BF8', colorKey: 'blue' });
    s().addPhase();
    s().addDrawing({ type: 'rectangle', start: { x: 400, y: 100 }, end: { x: 600, y: 300 }, color: '#F97316', colorKey: 'orange' });
    tactic = s().tactics.find(t => t.id === s().activeTacticId)!;
  });
  afterAll(() => { useAppStore.setState(initial, true); vi.restoreAllMocks(); });

  const frame = (elapsed: number) =>
    renderToStaticMarkup(videoFrameElement(tactic, frameAt(tactic.phases, elapsed), 'kit'));

  it('underveis vises tegningene i fasen spillerne kommer fra', () => {
    const m = frame(0);
    expect(m).toContain('--k-draw-blue');
    expect(m).not.toContain('--k-draw-orange');
  });

  it('i slutten og halen vises tegningene i siste fase', () => {
    const end = videoDurationMs(tactic.phases.length);
    for (const elapsed of [end, end + VIDEO_TAIL_MS]) {
      const m = frame(elapsed);
      expect(m).toContain('--k-draw-orange');
      expect(m).not.toContain('--k-draw-blue');
    }
  });
});
