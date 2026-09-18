import type { StateStorage } from 'zustand/middleware';

// Tynn wrapper rundt localStorage. Alle kall er pakket i try/catch, slik at en
// blokkert, full eller manglende localStorage (privat modus, SSR, slettede
// nettleserdata) aldri kaster en feil inn i appen.

export const STORAGE_ERROR_EVENT = 'taktikk:storage-error';
export const STORAGE_FULL_MESSAGE = 'Lagring full – eksporter backup';

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

function notifyStorageFull() {
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: STORAGE_FULL_MESSAGE }));
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
    if (!storage) return;
    try {
      storage.setItem(name, value);
    } catch (e) {
      if (isQuotaError(e)) notifyStorageFull();
      else console.warn('safeStorage.setItem feilet', e);
    }
  },
  removeItem: (name) => {
    try {
      getStorage()?.removeItem(name);
    } catch { /* ignoreres */ }
  },
};
