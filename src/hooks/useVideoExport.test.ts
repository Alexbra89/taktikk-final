import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { videoFrameElement } from './useVideoExport';
import { frameAt } from '@/lib/exportVideo';
import { useAppStore } from '@/store/useAppStore';

describe('videobildet', () => {
  const tactic = useAppStore.getState().tactics[0];
  const markup = renderToStaticMarkup(videoFrameElement(tactic, frameAt(tactic.phases, 0), 'kit'));

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
