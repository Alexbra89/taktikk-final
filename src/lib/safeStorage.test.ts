import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import {
  createTabGuardedStorage, safeStorage,
  STORAGE_ERROR_EVENT, STORAGE_FULL_MESSAGE, STORAGE_BLOCKED_MESSAGE,
} from './safeStorage';

// Et felles lager, som localStorage delt mellom to faner.
function sharedStorage(opts: { failWrites?: boolean } = {}): StateStorage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => { if (!opts.failWrites) m.set(k, v); },
    removeItem: (k) => { m.delete(k); },
  };
}

describe('createTabGuardedStorage – to faner', () => {
  it('fane med gammel state overskriver ikke det en annen fane har lagret', () => {
    const base = sharedStorage();
    base.setItem('k', 'v1');
    const staleA = vi.fn();
    const a = createTabGuardedStorage(base, staleA);
    const b = createTabGuardedStorage(base, vi.fn());
    a.storage.getItem('k');                   // A laster v1
    b.storage.getItem('k');                   // B laster v1
    b.storage.setItem('k', 'v2-fra-B');       // B lagrer
    a.storage.setItem('k', 'v1-endret-i-A');  // A endrer før den har sett B sin lagring

    expect(base.getItem('k')).toBe('v2-fra-B');
    expect(staleA).toHaveBeenCalledOnce();
    expect(a.changedElsewhere('k')).toBe(true);
  });

  it('etter innlasting av det nye kan fanen lagre igjen', () => {
    const base = sharedStorage();
    const a = createTabGuardedStorage(base, vi.fn());
    const b = createTabGuardedStorage(base, vi.fn());
    a.storage.getItem('k');
    b.storage.getItem('k');
    b.storage.setItem('k', 'fra-B');  // lagringen fantes ikke før – også det er en endring
    a.storage.getItem('k');           // rehydrering
    a.storage.setItem('k', 'fra-A');
    expect(base.getItem('k')).toBe('fra-A');
    expect(b.changedElsewhere('k')).toBe(true);
  });

  it('egne skrivinger regnes ikke som endringer fra andre', () => {
    const base = sharedStorage();
    const onStale = vi.fn();
    const a = createTabGuardedStorage(base, onStale);
    a.storage.getItem('k');
    a.storage.setItem('k', '1');
    a.storage.setItem('k', '2');
    expect(base.getItem('k')).toBe('2');
    expect(onStale).not.toHaveBeenCalled();
  });

  it('en skriving som feiler (full lagring) gjør ikke fanen «utdatert»', () => {
    const base = sharedStorage({ failWrites: true });
    const onStale = vi.fn();
    const a = createTabGuardedStorage(base, onStale);
    a.storage.getItem('k');
    a.storage.setItem('k', '1');
    a.storage.setItem('k', '2');
    expect(onStale).not.toHaveBeenCalled();
  });
});

describe('safeStorage varsler når lagringen feiler', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** window med gitt localStorage; returnerer meldingene som ble sendt. */
  function stubWindow(localStorage: unknown): string[] {
    const sent: string[] = [];
    vi.stubGlobal('window', {
      get localStorage() {
        if (localStorage instanceof Error) throw localStorage;
        return localStorage;
      },
      dispatchEvent: (e: CustomEvent<string>) => {
        if (e.type === STORAGE_ERROR_EVENT) sent.push(e.detail);
        return true;
      },
    });
    return sent;
  }

  it('localStorage blokkert (tilgang kaster) gir varsel', () => {
    const sent = stubWindow(new DOMException('blokkert', 'SecurityError'));
    safeStorage.setItem('k', 'v');
    expect(sent).toEqual([STORAGE_BLOCKED_MESSAGE]);
  });

  it('localStorage mangler (null) gir varsel', () => {
    const sent = stubWindow(null);
    safeStorage.setItem('k', 'v');
    expect(sent).toEqual([STORAGE_BLOCKED_MESSAGE]);
  });

  it('full lagring gir samme varsel som før', () => {
    const sent = stubWindow({ setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } });
    safeStorage.setItem('k', 'v');
    expect(sent).toEqual([STORAGE_FULL_MESSAGE]);
  });

  it('annen skrivefeil gir varsel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sent = stubWindow({ setItem: () => { throw new Error('ukjent'); } });
    safeStorage.setItem('k', 'v');
    expect(sent).toEqual([STORAGE_BLOCKED_MESSAGE]);
    warn.mockRestore();
  });

  it('vellykket lagring gir ikke varsel', () => {
    const m = new Map<string, string>();
    const sent = stubWindow({ setItem: (k: string, v: string) => m.set(k, v) });
    safeStorage.setItem('k', 'v');
    expect(sent).toEqual([]);
    expect(m.get('k')).toBe('v');
  });

  it('uten window (SSR) skjer ingenting', () => {
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow();
  });
});
