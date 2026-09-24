import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { videoFrameElement } from './useVideoExport';
import { frameAt } from '@/lib/exportVideo';
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
