import { afterEach, expect, it, vi } from 'vitest';

// To faner = to instanser av storen med samme localStorage.
// Fanene får ikke storage-hendelser her: det er nettopp det verste tilfellet
// (en frosset fane, eller en endring før hendelsen rekker fram).
const ls = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => ls.get(k) ?? null,
  setItem: (k: string, v: string) => { ls.set(k, v); },
  removeItem: (k: string) => { ls.delete(k); },
};

async function openTab() {
  vi.resetModules();
  vi.stubGlobal('window', { localStorage, addEventListener() {}, dispatchEvent() { return true; } });
  vi.stubGlobal('document', { addEventListener() {}, visibilityState: 'visible' });
  return (await import('./useAppStore')).useAppStore;
}

afterEach(() => { vi.unstubAllGlobals(); ls.clear(); });

it('en fane med gammel state skriver ikke over det en annen fane har lagret', async () => {
  const a = await openTab();
  a.getState().setHomeTeamName('Start');        // lagret, A har sett det
  const b = await openTab();                     // B laster det samme
  expect(b.getState().homeTeamName).toBe('Start');

  b.getState().addEvent({ type: 'training', title: 'Fra B', date: '2026-10-01', teamNote: '', trainingNotes: [], matchNotes: [] });
  a.getState().setAwayTeamName('Endret i A');    // A har ikke sett B sin endring

  const stored = JSON.parse(ls.get('taktikkboard-storage')!).state;
  expect(stored.events.map((e: { title: string }) => e.title)).toEqual(['Fra B']);

  await Promise.resolve();                       // A laster inn B sin versjon
  expect(a.getState().events.map(e => e.title)).toEqual(['Fra B']);

  a.getState().setAwayTeamName('Nå går det');    // og kan lagre igjen, uten å miste B
  const after = JSON.parse(ls.get('taktikkboard-storage')!).state;
  expect(after.awayTeamName).toBe('Nå går det');
  expect(after.events).toHaveLength(1);
});
