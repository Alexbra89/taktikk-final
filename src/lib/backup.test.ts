import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildBackup, parseBackup, describeBackup, backupFilename, downloadJson, isBackupDue, BACKUP_VERSION } from './backup';
import { useAppStore } from '@/store/useAppStore';
import { emptyDrill } from './customDrills';
import { BOARD_ITEM_TYPES } from '@/data/boardItems';
import type { NewDrawing, Sport } from '@/types';

const initial = useAppStore.getState();
const s = () => useAppStore.getState();
const json = (v: unknown) => JSON.parse(JSON.stringify(v));
beforeEach(() => useAppStore.setState(initial, true));
afterEach(() => vi.unstubAllGlobals());

function fillData(count = 4) {
  const sports: Sport[] = ['football', 'football5', 'football7', 'football9'];
  const pts = [{ x: 120, y: 150 }, { x: 250, y: 200 }, { x: 300, y: 240 }];
  const ink = { color: '#6E93E6', colorKey: 'blue' as const };
  const drawings: NewDrawing[] = [
    ...(['freehand', 'arrow', 'curved-arrow', 'dashed'] as const).map(type => ({ ...ink, type, pts })),
    ...(['circle', 'rectangle'] as const).map(type => ({ ...ink, type, start: pts[0], end: pts[1] })),
    { ...ink, type: 'label', at: pts[0], text: 'Press her – æøå ⚽' },
  ];
  for (let i = 0; i < count; i++) {
    if (i) s().addTactic(`Taktikk ${i + 1}`, { empty: i === count - 1 });
    s().setSport(sports[i % sports.length]);
    const tactic = s().tactics.find(t => t.id === s().activeTacticId)!;
    if (tactic.phases[0].players.length) {
      const id = tactic.phases[0].players[0].id;
      s().setPlayerName(id, 'Åse'); s().setPlayerNum(id, 42);
      s().movePlayer(id, { x: 140, y: 280 });
    }
    for (const type of BOARD_ITEM_TYPES) {
      const id = s().addItem(type); s().rotateItem(id, 90);
    }
    drawings.forEach(d => s().addDrawing(d));
    s().updateStickyNote('Første fase\nBehold hele notatet.');
    s().addPhase();
    drawings.forEach(d => s().addDrawing(d));
    s().moveBall({ x: 333, y: 222 });
    s().updateStickyNote('Andre fase');
  }
  s().setHomeTeamName('Sotra æøå'); s().setAwayTeamName(''); s().setAwayTeamColor('#123456');
  s().setAgeGroup('adult'); s().setRosterNames(['Åse', 'Øyvind']); s().setShowMovement(true);
  for (const aiGenerated of [false, true]) s().saveCustomDrill({
    ...emptyDrill('youth'), name: `Egen øvelse ${aiGenerated}`, description: 'Pasning med finter.',
    players: '8–12', aiGenerated, why: 'Mye ballkontakt', warning: 'Ta pauser', sketch: 'To soner',
    equipment: ['Baller', 'Kjegler'], coachingPoints: ['Se opp'], commonMistakes: ['For trangt'],
    variations: ['Større bane'], steps: [{ id: 'mitt-steg', name: 'Spill', description: 'Tre minutter.' }],
  });
  s().addEvent({ type: 'training', title: 'Tirsdagstrening', date: '2026-10-20', time: '18:00',
    location: 'Banen', teamNote: 'Ta med ball', attendance: ['Åse'], trainingNotes: [], matchNotes: [] });
  const trainingId = s().events[0].id;
  s().addTrainingNote(trainingId, { title: 'Taktikkpunkt', content: 'Høyt press', focus: ['Press', 'Samspill'],
    duration: 0, completed: true, tacticId: s().activeTacticId });
  s().addTrainingNote(trainingId, { title: 'Egen øvelse', content: 'Pasning med finter.', focus: [], duration: 15 });
  s().addTrainingNote(trainingId, { title: '✅ Fremmøte', content: 'Åse og Øyvind møtte.', focus: [] });
  s().addEvent({ type: 'match', title: 'Seriekamp', date: '2026-10-21', time: '19:00', location: 'Stadion',
    opponent: 'Ørn', result: '2–1', teamNote: 'Bortedrakt', trainingNotes: [], matchNotes: [] });
  const matchId = s().events[1].id;
  for (const half of [1, 2, 3] as const) s().addMatchNote(matchId, { half, title: `Omgang ${half}`, content: 'Godt press.' });
  s().createReport(['god_pressing', 'fin_pasningsspill'], 'Hele rapporten\nmed linjeskift.', 'Mot Ørn', matchId);
  s().saveMoment('Avgjørende øyeblikk'); s().setView('settings');
}

describe('sikkerhetskopi gjennom ekte eksport, JSON og import', () => {
  it('utelater tilgangskode både ved eksport og lesing av eldre kopier', () => {
    const settings = { playerStyle: 'chip' as const, aiAccessCode: 'HEMMELIG-KODE' };
    const backup = buildBackup({ data: s().exportSnapshot(), teamName: 'Lag', theme: null, settings });
    expect(JSON.stringify(backup)).not.toMatch(/aiAccessCode|HEMMELIG-KODE/);
    const parsed = parseBackup(JSON.stringify({ ...backup, settings }));
    expect(parsed.ok).toBe(true);
    expect(JSON.stringify(parsed)).not.toMatch(/aiAccessCode|HEMMELIG-KODE/);
  });
  it('beholder også standardtaktikk uten utstyr og et utstyrselement med rotasjon 0', () => {
    const check = () => {
      const before = json(s().exportSnapshot());
      const parsed = parseBackup(JSON.stringify(buildBackup({ data: before, teamName: '', theme: null })));
      expect(parsed.ok).toBe(true);
      if (parsed.ok) s().importSnapshot(parsed.backup.data);
      expect(json(s().exportSnapshot())).toEqual(before);
    };
    check();
    const id = s().addItem('cone'); s().rotateItem(id, 0); check();
  });

  it.each([4, 50])('beholder ALLE data nøyaktig med %i taktikker', count => {
    fillData(count);
    const before = json(s().exportSnapshot());
    const backup = buildBackup({ data: s().exportSnapshot(), teamName: s().homeTeamName, theme: 'light',
      settings: { playerStyle: 'chip' } });
    // Importen skal faktisk erstatte en annen samling, ikke sammenligne mot seg selv.
    useAppStore.setState(initial, true);
    s().markExported(); const deviceExportDate = s().lastExportedAt;
    s().startTimer();
    const parsed = parseBackup(JSON.stringify(backup), 'kopi.json');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.error);
    s().importSnapshot(parsed.backup.data);
    expect(json(s().exportSnapshot())).toEqual(before);
    expect(s().tactics).toHaveLength(count);
    expect(s().customDrills.map(d => d.aiGenerated)).toEqual([false, true]);
    expect(s().customDrills[0].steps[0].id).toBe('mitt-steg');
    expect(parsed.backup.theme).toBe('light');
    expect(parsed.backup.settings).toEqual({ playerStyle: 'chip' });
    expect(s().lastExportedAt).toBe(deviceExportDate);
    expect(s().matchTimer).toEqual({ running: false, startedAt: null, elapsed: 0 });
    expect(json(s().exportSnapshot())).not.toHaveProperty('lastExportedAt');
  });

  it('bygger et frittstående øyeblikksbilde uten feillogg eller andre lokale nøkler', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => 'HEMMELIG FEILLOGG' } });
    const backup = buildBackup({ data: s().exportSnapshot(), teamName: 'Lag', theme: null });
    const before = JSON.stringify(backup);
    s().renameTactic(s().activeTacticId, 'Endret etter at kopien ble laget');
    expect(JSON.stringify(backup)).toBe(before);
    expect(before).not.toMatch(/HEMMELIG FEILLOGG|error-log|errorLog|matchTimer|lastExportedAt/);
  });

  it('leser opprinnelig versjon 1 før utstyr, temafarger, egne øvelser og nye innstillinger', () => {
    const old = JSON.parse(readFileSync(new URL('./__fixtures__/backup-v1.json', import.meta.url), 'utf8'));
    const parsed = parseBackup(JSON.stringify(old));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.error);
    s().setShowMovement(true); s().importSnapshot(parsed.backup.data);
    expect(s().tactics[0]).toMatchObject(old.data.tactics[0]);
    expect(json(s().events)).toEqual(old.data.events);
    expect(json(s().matchReports)).toEqual(old.data.matchReports);
    expect(json(s().moments)).toEqual(old.data.moments);
    for (const key of ['ageGroup', 'homeTeamName', 'awayTeamName', 'awayTeamColor', 'rosterNames', 'currentView']) {
      expect(s().exportSnapshot()[key]).toEqual(old.data[key]);
    }
    expect(s().customDrills).toEqual([]);
    expect(s().showMovement).toBe(true);
    expect(parsed.backup.settings).toBeUndefined();
    expect(parsed.backup.theme).toBe('light');
    const again = parseBackup(JSON.stringify(buildBackup({ data: s().exportSnapshot(), teamName: 'Eldre lag', theme: 'light' })));
    expect(again.ok).toBe(true);
  });

  it('beholder også den tidligere tillatte konvoluttversjonen 0', () => {
    const old = JSON.parse(readFileSync(new URL('./__fixtures__/backup-v1.json', import.meta.url), 'utf8'));
    old.version = 0;
    const parsed = parseBackup(JSON.stringify(old));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      s().importSnapshot(parsed.backup.data);
      expect(s().tactics[0]).toMatchObject(old.data.tactics[0]);
      expect(json(s().events)).toEqual(old.data.events);
    }
  });
});

describe('avviser filer uten å røre eksisterende data', () => {
  const envelope = (patch: object) => JSON.stringify({ format: 'taktikkboard-backup', version: 1,
    data: s().exportSnapshot(), ...patch });
  it.each([
    ['', 'tom'], ['   \n', 'tom'], ['{"format":', 'skadet'], ['null', 'sikkerhetskopi'],
    ['[]', 'sikkerhetskopi'], ['{}', 'Taktikkboard'], ['{"format":"annen-app"}', 'Taktikkboard'],
  ])('gir norsk feil for %j', (text, message) => {
    fillData(); const before = s();
    const res = parseBackup(text, 'fil.json');
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining(message) });
    if (!res.ok) expect(res.error).toContain('Dataene dine er ikke endret.');
    expect(s()).toBe(before);
  });

  it('forklarer feil filtype, nyere versjon og ugyldige versjonsnumre', () => {
    const before = s();
    expect(parseBackup(envelope({}), 'bilde.png')).toMatchObject({ ok: false, error: expect.stringContaining('.json') });
    expect(parseBackup(envelope({ version: BACKUP_VERSION + 1 }))).toMatchObject({ ok: false, error: expect.stringContaining('nyere versjon') });
    for (const version of [null, '1', -1, 0.5]) expect(parseBackup(envelope({ version })))
      .toMatchObject({ ok: false, error: expect.stringContaining('ugyldig versjonsnummer') });
    expect(s()).toBe(before);
  });

  it('avviser også skader dypt i dataene i stedet for å importere bare resten', () => {
    fillData();
    const mutations = [
      (d: any) => { d.tactics = []; }, (d: any) => { d.tactics[0] = {}; },
      (d: any) => { d.tactics[0].phases[0].drawings.push({ type: 'arrow', pts: [] }); },
      (d: any) => { d.tactics[0].phases[0].players[0].position.x = 'feil'; },
      (d: any) => { d.tactics[0].phases[0].items[0].type = 'bil'; },
      (d: any) => { d.events.push(null); }, (d: any) => { d.events = {}; },
      (d: any) => { d.events[0].trainingNotes.push({ content: 'Mangler tittel' }); },
      (d: any) => { d.events[1].matchNotes = 'feil'; },
      (d: any) => { d.matchReports.push({ tags: [] }); },
      (d: any) => { d.moments.push({ name: 'Mangler snapshot' }); },
      (d: any) => { d.customDrills[0].duration = 999; },
      (d: any) => { d.customDrills[0].steps.push(null); },
      (d: any) => { d.ageGroup = 'feil'; },
    ];
    for (const mutate of mutations) {
      const before = s(); const damaged = json(s().exportSnapshot()); mutate(damaged);
      expect(parseBackup(envelope({ data: damaged })).ok).toBe(false);
      expect(() => s().importSnapshot(damaged)).toThrow('Dataene dine er ikke endret');
      expect(s()).toBe(before);
    }
    for (const patch of [{ data: null }, { data: [] }, { data: {} }, { theme: 'rosa' }, { settings: [] },
      { settings: { playerStyle: 'ukjent', aiAccessCode: '' } }]) {
      const before = s(); expect(parseBackup(envelope(patch)).ok).toBe(false); expect(s()).toBe(before);
    }
  });
});

describe('fil og påminnelse', () => {
  it('gir forståelig filnavn og beskriver alle samlinger', () => {
    fillData();
    expect(backupFilename('Æ Ø Å', new Date('2026-10-17T10:00:00Z'))).toBe('taktikk-ae-oe-aa-2026-10-17.json');
    expect(backupFilename('!!!', new Date('2026-10-17Z'))).toBe('taktikk-lag-2026-10-17.json');
    const backup = buildBackup({ data: s().exportSnapshot(), teamName: '', theme: null });
    expect(describeBackup(backup)).toBe('4 taktikker · 2 hendelser · 1 rapporter · 1 øyeblikk · 2 egne øvelser');
    expect(describeBackup({ ...backup, data: { tactics: [{}] } })).toContain('1 taktikk ·');
  });

  it('laster ned JSON og rydder opp i objektadressen etterpå', async () => {
    vi.useFakeTimers();
    const a = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    const appendChild = vi.fn(); const createObjectURL = vi.fn((_blob: Blob) => 'blob:backup'); const revokeObjectURL = vi.fn();
    vi.stubGlobal('document', { createElement: () => a, body: { appendChild } });
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    try {
      downloadJson('kopi.json', '{"test":true}');
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe('application/json'); expect(await blob.text()).toBe('{"test":true}');
      expect(a.download).toBe('kopi.json'); expect(a.click).toHaveBeenCalledOnce(); expect(a.remove).toHaveBeenCalledOnce();
      expect(revokeObjectURL).not.toHaveBeenCalled(); vi.advanceTimersByTime(10_000);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup');
    } finally { vi.useRealTimers(); }
  });

  it('minner rolig om aldri eksportert, ugyldig dato og mer enn 30 dager', () => {
    const now = Date.parse('2026-10-17T12:00:00Z'); const day = 86_400_000;
    expect(isBackupDue(null, now)).toBe(true); expect(isBackupDue('ugyldig', now)).toBe(true);
    expect(isBackupDue(new Date(now - 30 * day).toISOString(), now)).toBe(false);
    expect(isBackupDue(new Date(now - 30 * day - 1).toISOString(), now)).toBe(true);
    expect(isBackupDue(new Date(now + day).toISOString(), now)).toBe(false);
  });
});
