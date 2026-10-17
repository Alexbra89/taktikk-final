import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ERROR_LOG_KEY, HIDDEN_MESSAGE, MAX_ERRORS, clearErrorLog, formatErrorReport, installGlobalErrorHandlers,
  logError, readErrorLog,
} from './errorLog';
import { buildBackup } from './backup';
import { useAppStore } from '@/store/useAppStore';

// Testene kjører i Node: et lite falskt vindu med localStorage i minnet.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: k => m.get(k) ?? null,
    key: i => [...m.keys()][i] ?? null,
    removeItem: k => { m.delete(k); },
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

let storage: Storage;
beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal('window', Object.assign(new EventTarget(), {
    localStorage: storage, innerWidth: 1400, innerHeight: 900, matchMedia: () => ({ matches: false }),
  }));
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0' });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('feilloggen', () => {
  it('skjuler tilgangskoden også når den ligner et teknisk kodenavn', () => {
    storage.setItem('taktikk:ai-access-code', 'hemmeligkode');
    const error = new TypeError('hemmeligkode is not a function');
    error.stack = 'TypeError: hemmeligkode is not a function\n at hemmeligkode (https://app.example/app.js?kode=hemmeligkode:1:2)';
    logError(error, 'ai');
    const saved = storage.getItem(ERROR_LOG_KEY)!;
    expect(saved).not.toContain('hemmeligkode');
    expect(formatErrorReport(readErrorLog())).not.toContain('hemmeligkode');
  });
  it('lagrer tidspunkt, versjon, del, melding, kort stack og enhet – og ikke mer', () => {
    logError(new TypeError("Cannot read properties of undefined (reading 'phases')"), 'board');
    const [e] = readErrorLog();
    expect(Object.keys(e).sort()).toEqual(['area', 'at', 'device', 'message', 'source', 'stack', 'version']);
    expect(e.area).toBe('board');
    expect(e.source).toBe('skjerm');
    expect(e.message).toBe("TypeError: Cannot read properties of undefined (reading '…')");
    expect(e.version).toBeTruthy();
    expect(e.device).toBe('Edge 140 · Windows · 1400×900');
    expect(e.stack.split('\n').length).toBeLessThanOrEqual(6);
    expect(e.stack).toMatch(/^at /);
    expect(Number.isNaN(Date.parse(e.at))).toBe(false);
  });

  it(`beholder bare de siste ${MAX_ERRORS}, nyeste først`, () => {
    for (let i = 0; i < 45; i++) logError(new TypeError(`fn${i} is not a function`), 'calendar');
    const list = readErrorLog();
    expect(list).toHaveLength(MAX_ERRORS);
    expect(list[0].message).toBe('TypeError: fn44 is not a function');
    expect(list[MAX_ERRORS - 1].message).toBe('TypeError: fn15 is not a function');
    expect(JSON.parse(storage.getItem(ERROR_LOG_KEY)!)).toHaveLength(MAX_ERRORS);
  });

  it('lagrer ikke navn, taktikker, notater, e-post, telefonnummer eller mappestier', () => {
    const err = new Error('Fant ikke «Høyt press mot Brann» for "Ola Nordmann" (ola@lag.no, 912 34 567): notat \'Husk Kari på venstre\'');
    err.stack = [
      `Error: ${err.message}`,
      '    at TrainingDetail (https://taktikk.example.no/_next/static/chunks/app/page-abc.js?navn=Ola:12:345)',
      '    at renderWithHooks (C:\\Users\\olanordmann\\taktikk\\node_modules\\react-dom\\cjs\\react-dom.development.js:1:2)',
      '    at Object.<anonymous> (/home/kari/app/src/x.ts:3:4)',
    ].join('\n');
    logError(err, 'training');
    const saved = storage.getItem(ERROR_LOG_KEY)!;
    for (const secret of ['Ola', 'Nordmann', 'olanordmann', 'Kari', 'kari', 'Brann', 'Høyt press', 'ola@lag.no', '912 34 567', 'navn=', 'taktikk.example.no', 'Users']) {
      expect(saved, secret).not.toContain(secret);
    }
    const [e] = readErrorLog();
    expect(e.message).toBe(`Error: ${HIDDEN_MESSAGE}`);
    expect(e.stack).toContain('page-abc.js:12:345');
    expect(e.stack).toContain('react-dom.development.js:1:2');
  });

  it('fritekst uten anførselstegn og korte navn i anførselstegn skjules', () => {
    const cases: unknown[] = [
      new Error('Ola Nordmann møter sent'),
      new Error("Fant ikke 'ola'"),
      new Error('ola'),
      new RangeError('Kari er skadet, se notat om høyre kant'),
      'Uncaught Error: Ola Nordmann møter sent',
      'Ola Nordmann møter sent',
      Object.assign(new Error('x'), { name: 'Ola Nordmann' }),
    ];
    for (const err of cases) logError(err, 'training', 'vindu');
    const saved = storage.getItem(ERROR_LOG_KEY)!;
    for (const secret of ['Ola', 'ola', 'Nordmann', 'Kari', 'notat', 'høyre']) {
      expect(saved, secret).not.toContain(secret);
    }
    for (const e of readErrorLog()) expect(e.message).toContain(HIDDEN_MESSAGE);
  });

  it('egenskapsnavn fra kjøringen (obj[navn]) skjules i kjente meldinger', () => {
    const cases: [unknown, string][] = [
      [new TypeError("Cannot read properties of undefined (reading 'Ola')"), "TypeError: Cannot read properties of undefined (reading '…')"],
      [new TypeError("Cannot read properties of null (reading 'ola')"), "TypeError: Cannot read properties of null (reading '…')"],
      [new TypeError("Cannot set properties of undefined (setting 'ola')"), "TypeError: Cannot set properties of undefined (setting '…')"],
      [new TypeError('can\'t access property "Ola", t.players is undefined'), 'TypeError: can\'t access property "…", t.players is undefined'],
      ["Uncaught TypeError: Cannot read properties of undefined (reading 'Ola')", "TypeError: Cannot read properties of undefined (reading '…')"],
    ];
    for (const [err, expected] of cases) {
      storage.clear();
      logError(err, 'board', 'vindu');
      expect(readErrorLog()[0].message).toBe(expected);
      const saved = storage.getItem(ERROR_LOG_KEY)!;
      expect(saved).not.toContain('Ola');
      expect(saved).not.toContain('ola');
    }
  });

  it('kjente tekniske meldinger beholdes; innhold og adresser i dem gjør det ikke', () => {
    const cases: [unknown, string][] = [
      [new TypeError("Cannot read properties of null (reading 'phases')"), "TypeError: Cannot read properties of null (reading '…')"],
      [new TypeError('t.players.map is not a function'), 'TypeError: t.players.map is not a function'],
      [new TypeError("undefined is not an object (evaluating 'e.tactic.phases')"), "TypeError: undefined is not an object (evaluating 'e.tactic.phases')"],
      [new RangeError('Maximum call stack size exceeded'), 'RangeError: Maximum call stack size exceeded'],
      [new SyntaxError('Unexpected token \'O\', "Ola Nordmann" is not valid JSON'), 'SyntaxError: Ugyldig JSON (innholdet er skjult)'],
      [Object.assign(new Error('Loading chunk 123 failed.\n(error: http://localhost:3000/_next/static/chunks/123.js)'), { name: 'ChunkLoadError' }), 'ChunkLoadError: Loading chunk 123 failed …'],
      [new Error("Failed to execute 'setItem' on 'Storage': Setting the value of 'Ola' exceeded the quota."), "Error: Failed to execute 'setItem' on 'Storage' …"],
      ['Uncaught TypeError: x is not a function', 'TypeError: x is not a function'],
      [new Error('WebGL 2 støttes ikke eller er slått av i nettleseren'), 'Error: WebGL 2 støttes ikke eller er slått av i nettleseren'],
    ];
    for (const [err, expected] of cases) {
      storage.clear();
      logError(err, 'board');
      expect(readErrorLog()[0].message).toBe(expected);
    }
  });

  it('feil som ikke er Error-objekter lagres uten innholdet', () => {
    logError({ tactic: { name: 'Hemmelig plan' } }, 'board', 'promise');
    expect(readErrorLog()[0].message).toBe('Ukjent feil (ikke et Error-objekt)');
    expect(storage.getItem(ERROR_LOG_KEY)).not.toContain('Hemmelig');
  });

  it('samme feil fra vinduet og feilskjermen blir én oppføring med riktig del', () => {
    const err = new Error('Krasj');
    logError(err, 'drills', 'vindu');
    logError(err, 'drills', 'skjerm');
    logError(err, 'drills', 'skjerm');
    const list = readErrorLog();
    expect(list).toHaveLength(1);
    expect(list[0].source).toBe('skjerm');
  });

  it('tåler ødelagt og blokkert lagring uten å kaste', () => {
    storage.setItem(ERROR_LOG_KEY, '{ikke json');
    expect(readErrorLog()).toEqual([]);
    logError(new Error('Etter ødelagt logg'), 'app');
    expect(readErrorLog()).toHaveLength(1);

    const blocked = new EventTarget();
    Object.defineProperty(blocked, 'localStorage', { get() { throw new DOMException('blokkert', 'SecurityError'); } });
    vi.stubGlobal('window', blocked);
    expect(() => logError(new Error('Blokkert'), 'app')).not.toThrow();
    expect(readErrorLog()).toEqual([]);
  });

  it('fanger window.onerror og unhandledrejection, merket med visningen', () => {
    let view = 'calendar';
    const uninstall = installGlobalErrorHandlers(() => view);
    window.dispatchEvent(Object.assign(new Event('error'), { error: new TypeError('ufanget is not a function'), message: 'x' }));
    view = 'training';
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new TypeError('Failed to fetch') }));
    // Lastefeil for en fil (uten error og melding) er ikke en kodefeil.
    window.dispatchEvent(new Event('error'));
    uninstall();
    window.dispatchEvent(Object.assign(new Event('error'), { error: new Error('Etter opprydding'), message: 'x' }));

    expect(readErrorLog().map(e => [e.message, e.area, e.source])).toEqual([
      ['TypeError: Failed to fetch', 'training', 'promise'],
      ['TypeError: ufanget is not a function', 'calendar', 'vindu'],
    ]);
  });

  it('rapporten er lesbar tekst, og «Tøm logg» tømmer den', () => {
    logError(new Error('WebGL 2 støttes ikke eller er slått av i nettleseren'), '3d');
    const text = formatErrorReport(readErrorLog());
    expect(text).toContain('Feilrapport – Taktikkboard');
    expect(text).toContain('Taktikk (3D)');
    expect(text).toContain('Error: WebGL 2 støttes ikke');
    expect(text).toContain('Edge 140 · Windows');
    expect(text).not.toContain('{');

    clearErrorLog();
    expect(readErrorLog()).toEqual([]);
    expect(storage.getItem(ERROR_LOG_KEY)).toBeNull();
    expect(formatErrorReport([])).toContain('Ingen feil er registrert.');
  });

  it('er ikke med i backupen', () => {
    logError(new TypeError('skalIkkeIBackup is not a function'), 'settings');
    expect(readErrorLog()).toHaveLength(1);
    const s = useAppStore.getState();
    const backup = JSON.stringify(buildBackup({ data: s.exportSnapshot(), teamName: s.homeTeamName, theme: 'dark' }));
    expect(backup).not.toContain(ERROR_LOG_KEY);
    expect(backup).not.toContain('skalIkkeIBackup');
  });
});
