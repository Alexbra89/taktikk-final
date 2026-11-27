import { describe, expect, it } from 'vitest';
import { buildReport, checksStatus, monthTitle, parsePlaywright, parseVitest, updateType, updatesOf, versionAtLeast } from './maanedsrapport.mjs';

const ok = { outcome: 'success' };
const tests = (over = {}) => ({ lint: ok, unit: { ...ok, result: { passed: 712, failed: 0, failedNames: [] } }, build: ok,
  e2e: { ...ok, result: { passed: 29, failed: 0, flaky: [], failedNames: [] } }, ...over });
const base = { month: 'November 2026', runUrl: 'https://example.test/run', prs: [], alerts: [], alertsError: '' };

describe('månedlig rapport', () => {
  it('lager tittel med norsk måned og stor forbokstav', () => {
    expect(monthTitle(new Date('2026-11-15T12:00:00Z'))).toBe('November 2026');
    expect(monthTitle(new Date('2026-12-01T05:00:00Z'))).toBe('Desember 2026');
  });

  it('kjenner igjen stor og liten oppdatering', () => {
    expect(updateType('Bump next from 16.4.2 to 16.4.3 in the production-dependencies group')).toBe('gruppe');
    expect(updateType('Bump the development-dependencies group with 2 updates')).toBe('gruppe');
    expect(updateType('Bump next from 16.4.2 to 16.4.3')).toBe('patch');
    expect(updateType('Bump eslint from 9.39.5 to 9.40.0')).toBe('minor');
    expect(updateType('Bump eslint from 9.39.5 to 10.13.0')).toBe('major');
    expect(updateType('Bump lucide-react from 0.400.0 to 0.401.0')).toBe('major');
    expect(updateType('Bump actions/checkout from 4 to 7')).toBe('major');
    expect(updateType('Noe helt annet')).toBe('ukjent');
  });

  it('leser sjekkene på en PR', () => {
    expect(checksStatus([{ status: 'completed', conclusion: 'success' }], [{ state: 'success' }])).toBe('grønn');
    expect(checksStatus([{ status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'skipped' }])).toBe('grønn');
    expect(checksStatus([{ status: 'completed', conclusion: 'failure' }, { status: 'in_progress' }])).toBe('rød');
    expect(checksStatus([{ status: 'queued' }])).toBe('venter');
    expect(checksStatus([], [{ state: 'pending' }])).toBe('venter');
    expect(checksStatus([], [])).toBe('ingen');
  });

  it('finner feilede enhetstester, også filer som ikke kunne kjøres', () => {
    const r = parseVitest({ numPassedTests: 3, numFailedTests: 1, testResults: [
      { name: '/runner/work/x/src/a.test.ts', status: 'failed', assertionResults: [{ status: 'failed', fullName: 'a gjør b' }, { status: 'passed', fullName: 'ok' }] },
      { name: '/runner/work/x/src/b.test.ts', status: 'failed', assertionResults: [] },
    ] });
    expect(r.failedNames).toEqual(['src/a.test.ts: a gjør b', 'src/b.test.ts: filen kunne ikke kjøres']);
    expect(r.failed).toBe(2);
    expect(parseVitest(null)).toBeNull();
  });

  it('finner feilede og ustabile nettlesertester, og feil ved oppstart', () => {
    const r = parsePlaywright({ stats: { expected: 5 }, errors: [{ message: 'Process from config.webServer was not able to start.\nmer' }], suites: [
      { title: 'smoke.spec.ts', file: 'smoke.spec.ts', specs: [
        { title: 'tegn', file: 'smoke.spec.ts', tests: [{ status: 'unexpected' }] },
        { title: 'angre', file: 'smoke.spec.ts', tests: [{ status: 'flaky' }] },
        { title: 'ok', file: 'smoke.spec.ts', tests: [{ status: 'expected' }] },
      ], suites: [{ title: 'gruppe', specs: [{ title: 'inni', file: 'smoke.spec.ts', tests: [{ status: 'unexpected' }] }] }] },
    ] });
    expect(r.failedNames).toEqual(['smoke.spec.ts: tegn', 'smoke.spec.ts: gruppe › inni', 'Oppstart: Process from config.webServer was not able to start.']);
    expect(r.flaky).toEqual(['smoke.spec.ts: angre']);
    expect(r.passed).toBe(5);
  });

  it('anbefaler ingenting når alt er i orden', () => {
    const text = buildReport({ ...base, tests: tests() });
    expect(text).toContain('Enhetstester (712 bestått, 0 feilet) | ✅ bestått');
    expect(text).toContain('Ingen åpne Dependabot-PR-er.');
    expect(text).toContain('Ingen åpne sikkerhetsvarsler.');
    expect(text).toContain('Alt ser bra ut.');
  });

  it('sier hva som skal merges, sjekkes, fikses og hva som må vente', () => {
    const text = buildReport({ ...base,
      tests: tests({ unit: { outcome: 'failure', result: { passed: 711, failed: 1, failedNames: ['src/a.test.ts: a gjør b'] } } }),
      prs: [
        { number: 50, title: 'Bump next from 16.4.2 to 16.4.3', url: 'u', type: 'patch', status: 'grønn', conflict: false },
        { number: 53, title: 'Bump lucide-react from 0.400.0 to 1.62.0', url: 'u', type: 'major', status: 'grønn', conflict: false },
        { number: 52, title: 'Bump typescript from 5.9.3 to 7.0.2', url: 'u', type: 'major', status: 'rød', conflict: false },
        { number: 54, title: 'Bump x from 1.0.0 to 1.0.1', url: 'u', type: 'patch', status: 'grønn', conflict: true },
      ],
      alerts: [
        { number: 1, package: 'minimatch', severity: 'medium', summary: 'DoS', fixedIn: '11.0.1', url: 'u' },
        { number: 2, package: 'next', severity: 'high', summary: 'Lekkasje', fixedIn: '16.4.6', url: 'u' },
      ],
    });
    expect(text).toContain('**Feilet:**\n- src/a.test.ts: a gjør b');
    expect(text).toContain('**Testene feiler på `main`.**');
    expect(text).toContain('**Merge:** #50 ');
    expect(text).toContain('**Sjekk før merge:** #53 ');
    expect(text).toContain('**Ikke merge:** #52 ');
    expect(text).toContain('**Konflikt:** #54.');
    expect(text).toContain('**Må fikses snart:** 1 sikkerhetsvarsel med høy eller kritisk alvorlighet (next)');
    expect(text).toContain('**Kan vente litt:** 1 varsel med middels eller lav alvorlighet (minimatch)');
    // Mest alvorlige varsel først.
    expect(text.indexOf('| høy | `next`')).toBeLessThan(text.indexOf('| middels | `minimatch`'));
  });

  it('forklarer oppsettet når varslene ikke kunne leses', () => {
    const text = buildReport({ ...base, tests: tests(), alerts: null, alertsError: 'ingen tilgang (HTTP 403)' });
    expect(text).toContain('Varslene kunne ikke leses: ingen tilgang (HTTP 403)');
    expect(text).toContain('`DEPENDABOT_ALERTS_TOKEN`');
    expect(text).not.toContain('Alt ser bra ut.');
  });

  it('knytter et sikkerhetsvarsel til Dependabot-PR-en som oppdaterer pakken', () => {
    const text = buildReport({ ...base, tests: tests(),
      prs: [{ number: 60, title: 'Bump next from 16.4.3 to 16.4.6', url: 'u', type: 'patch', status: 'grønn', conflict: false, updates: [{ name: 'next', to: '16.4.6' }] },
        { number: 63, title: 'Bump next-auth from 4.0.0 to 4.0.1', url: 'u', type: 'patch', status: 'grønn', conflict: false, updates: [{ name: 'next-auth', to: '4.0.1' }] }],
      alerts: [{ number: 3, package: 'next', severity: 'medium', summary: 'Cache leak', fixedIn: '16.4.6', url: 'a' }],
    });
    expect(text).toContain('| 16.4.6 (PR #60) |');
    expect(text).toContain('**Sikkerhet:** #60 retter sikkerhetsvarsler.');
  });

  it('leser pakkene en Dependabot-PR oppdaterer, også i en samle-PR', () => {
    expect(updatesOf({ title: 'Bump next from 16.4.3 to 16.4.6', body: 'Bumps [next](https://github.com/vercel/next.js) from 16.4.3 to 16.4.6.\n- [Release notes]' }))
      .toEqual([{ name: 'next', to: '16.4.6' }]);
    expect(updatesOf({ title: 'Bump the production-dependencies group with 2 updates',
      body: 'Updates `next` from 16.4.3 to 16.4.6\n- [Release notes]\n\nUpdates `@types/node` from 24.19.2 to 24.20.0' }))
      .toEqual([{ name: 'next', to: '16.4.6' }, { name: '@types/node', to: '24.20.0' }]);
    expect(versionAtLeast('16.4.6', '16.4.6')).toBe(true);
    expect(versionAtLeast('16.10.0', '16.4.6')).toBe(true);
    expect(versionAtLeast('16.4.5', '16.4.6')).toBe(false);
  });

  it('kaller ikke en oppdatering under rettet versjon for en rettelse, men finner pakken i en samle-PR', () => {
    const alerts = [{ number: 3, package: 'next', severity: 'medium', summary: 'Cache leak', fixedIn: '16.4.6', url: 'a' }];
    const below = buildReport({ ...base, tests: tests(), alerts,
      prs: [{ number: 60, title: 'Bump next from 16.4.3 to 16.4.5', url: 'u', type: 'patch', status: 'grønn', conflict: false, updates: [{ name: 'next', to: '16.4.5' }] }] });
    expect(below).toContain('| 16.4.6 |');
    expect(below).not.toContain('retter sikkerhetsvarsler');
    const group = buildReport({ ...base, tests: tests(), alerts,
      prs: [{ number: 70, title: 'Bump the production-dependencies group with 2 updates', url: 'u', type: 'gruppe', status: 'grønn', conflict: false, updates: [{ name: 'next', to: '16.4.6' }] }] });
    expect(group).toContain('| 16.4.6 (PR #70) |');
  });

  it('anbefaler ikke merge når GitHub ikke vet om PR-en kan merges', () => {
    const text = buildReport({ ...base, tests: tests(),
      prs: [{ number: 60, title: 'Bump next from 16.4.3 to 16.4.6', url: 'u', type: 'patch', status: 'grønn', conflict: null, updates: [] }] });
    expect(text).toContain('· ukjent om den kan merges');
    expect(text).not.toContain('**Merge:**');
    expect(text).toContain('**Sjekk selv:** #60 har grønne tester');
  });

  it('ber deg sjekke et varsel uten kjent alvorlighet, og sorterer det sist', () => {
    const text = buildReport({ ...base, tests: tests(), alerts: [
      { number: 1, package: 'rar', severity: 'ukjent', summary: 'Ukjent', fixedIn: null, url: 'a' },
      { number: 2, package: 'next', severity: 'low', summary: 'Lav', fixedIn: '16.4.6', url: 'b' },
    ] });
    expect(text).toContain('**Sjekk selv:** 1 varsel uten kjent alvorlighet (rar)');
    expect(text).toContain('**Kan vente litt:** 1 varsel med middels eller lav alvorlighet (next)');
    expect(text.indexOf('`next`')).toBeLessThan(text.indexOf('`rar`'));
  });

  it('forklarer at testene ikke ble kjørt når installasjonen feilet', () => {
    const skipped = { outcome: 'skipped' };
    const text = buildReport({ ...base, tests: { lint: skipped, unit: skipped, build: skipped, e2e: skipped, setup: { packages: 'failure', chromium: 'skipped' } } });
    expect(text).toContain('Pakkene kunne ikke installeres');
    expect(text).toContain('**Testene feiler på `main`.**');
  });
});
