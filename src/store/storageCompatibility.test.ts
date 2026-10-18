// Sammenligner gamle testdata med faste SHA-256-resultater fra storen før oppdelingen.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const oldBackup = JSON.parse(readFileSync(new URL('../lib/__fixtures__/backup-v1.json', import.meta.url), 'utf8'));
const key = 'taktikkboard-storage';
const saved = new Map<string, string>();

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-18T10:00:00Z'));
  let random = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => (++random % 1000) / 1000);
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => saved.get(k) ?? null,
      setItem: (k: string, v: string) => { saved.set(k, v); },
      removeItem: (k: string) => { saved.delete(k); },
    },
    addEventListener() {}, dispatchEvent() { return true; },
  });
  vi.stubGlobal('document', { addEventListener() {}, visibilityState: 'visible' });
});

afterEach(() => {
  saved.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

it.each([0, 1, 2])('laster og lagrer eldre lokale data, lagringsversjon %i, identisk med før oppdelingen', async version => {
  saved.set(key, JSON.stringify({ state: oldBackup.data, version }));
  const { useAppStore } = await import('./useAppStore');
  expect(useAppStore.persist.hasHydrated()).toBe(true);
  const state = useAppStore.getState();
  state.setView(state.currentView); // Skriv gjennom ekte partialize og fanebeskyttelse.
  expect([...saved.keys()]).toEqual([key]);
  expect(JSON.parse(saved.get(key)!).version).toBe(2);
  const result = fingerprint({ snapshot: state.exportSnapshot(), stored: saved.get(key), timer: state.matchTimer });
  if (version === 0) expect(result).toMatchInlineSnapshot(`"5946f8d49182a94b3d36a44501bacb10b8a1973bc5c946b5dbc82768dbc66a86"`);
  if (version === 1) expect(result).toMatchInlineSnapshot(`"5946f8d49182a94b3d36a44501bacb10b8a1973bc5c946b5dbc82768dbc66a86"`);
  if (version === 2) expect(result).toMatchInlineSnapshot(`"2305bcb77bf50a0bb36e93511a405ed66eaedf80b7d6487467c1b82d7d225a83"`);
});

it.each([0, 1])('leser og importerer eldre sikkerhetskopi, konvoluttversjon %i, identisk med før oppdelingen', async version => {
  const { useAppStore } = await import('./useAppStore');
  const { parseBackup, buildBackup } = await import('../lib/backup');
  useAppStore.getState().setShowMovement(true);
  useAppStore.getState().markExported();
  useAppStore.getState().startTimer();
  const parsed = parseBackup(JSON.stringify({ ...oldBackup, version }), 'gammel.json');
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.error);
  useAppStore.getState().importSnapshot(parsed.backup.data);
  const state = useAppStore.getState();
  const result = fingerprint({
    parsed, snapshot: state.exportSnapshot(), stored: saved.get(key), timer: state.matchTimer,
    exportedAt: state.lastExportedAt,
    backup: buildBackup({ data: state.exportSnapshot(), teamName: state.homeTeamName, theme: parsed.backup.theme }),
  });
  if (version === 0) expect(result).toMatchInlineSnapshot(`"4ed593b87fc0816b179493c0c99e0c7040c50b4ea71a19766c5df800c60e4c6f"`);
  if (version === 1) expect(result).toMatchInlineSnapshot(`"f9daf8ed2c77204ca28c813ec836b7fd6b9fc1e5e6e67fafda60c6c9bdfb90e1"`);
});
