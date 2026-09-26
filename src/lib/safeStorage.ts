import type { StateStorage } from 'zustand/middleware';

// Tynn wrapper rundt localStorage. Alle kall er pakket i try/catch, slik at en
// blokkert, full eller manglende localStorage (privat modus, SSR, slettede
// nettleserdata) aldri kaster en feil inn i appen.

export const STORAGE_ERROR_EVENT = 'taktikk:storage-error';
export const STORAGE_FULL_MESSAGE = 'Lagring full – eksporter backup';
export const STORAGE_BLOCKED_MESSAGE = 'Lagring er blokkert i nettleseren – endringer lagres ikke. Eksporter backup.';

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014
  );
}

function notify(message: string) {
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: message }));
  } catch { /* ingen window – ingenting å varsle */ }
}

export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return getStorage()?.getItem(name) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    const storage = getStorage();
    // Blokkert lagring (informasjonskapsler av, streng personvernmodus): brukeren
    // må få vite at endringene forsvinner. Uten window (SSR, tester) er det ingen å varsle.
    if (!storage) {
      if (typeof window !== 'undefined') notify(STORAGE_BLOCKED_MESSAGE);
      return;
    }
    try {
      storage.setItem(name, value);
    } catch (e) {
      if (isQuotaError(e)) notify(STORAGE_FULL_MESSAGE);
      else {
        console.warn('safeStorage.setItem feilet', e);
        notify(STORAGE_BLOCKED_MESSAGE);
      }
    }
  },
  removeItem: (name) => {
    try {
      getStorage()?.removeItem(name);
    } catch { /* ignoreres */ }
  },
};

/**
 * Hindrer at en fane med gammel state overskriver det en annen fane har lagret.
 * Fanen husker teksten den sist leste eller skrev. Er lagringen endret siden
 * (en annen fane, eller PWA-en ved siden av nettleseren), skrives ingenting:
 * onStale kalles i stedet, og fanen skal da laste inn den nye versjonen.
 * Endringen gjort på den utdaterte skjermen forkastes – den nyere lagringen vinner.
 * Forutsetter synkron lagring (localStorage), slik at sjekk og skriving skjer i samme tick.
 */
export function createTabGuardedStorage(base: StateStorage, onStale: () => void) {
  let lastSeen: string | null = null;
  const read = (name: string) => base.getItem(name) as string | null;
  const storage: StateStorage = {
    getItem: (name) => (lastSeen = read(name)),
    setItem: (name, value) => {
      if (read(name) !== lastSeen) { onStale(); return; }
      base.setItem(name, value);
      // Det som faktisk ligger lagret: feilet skrivingen (full lagring), er det fortsatt det gamle.
      lastSeen = read(name);
    },
    removeItem: (name) => {
      base.removeItem(name);
      lastSeen = read(name);
    },
  };
  return {
    storage,
    /** Har noen andre lagret siden denne fanen sist leste eller skrev? */
    changedElsewhere: (name: string) => read(name) !== lastSeen,
  };
}
