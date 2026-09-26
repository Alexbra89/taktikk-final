import { beforeEach, describe, expect, it } from 'vitest';
import {
  useAppStore, repairDrawing, repairEvent, repairItem, repairPersisted, repairTactic,
  repairReport, repairMoment,
} from './useAppStore';
import { ITEM_RADIUS } from '@/data/boardItems';
import { VW, VH } from '@/data/formations';
import { TACTIC_TEMPLATES } from '@/data/tacticTemplates';
import type { BoardItem, Position, Tactic } from '@/types';

// Storen kjører i Node: safeStorage finner ingen localStorage og lagrer ingenting,
// så hver test starter fra samme utgangspunkt.
const initial = useAppStore.getState();
beforeEach(() => useAppStore.setState(initial, true));

const s = () => useAppStore.getState();
const active = (): Tactic => s().tactics.find(t => t.id === s().activeTacticId)!;
const itemsIn = (phaseIdx: number): BoardItem[] => active().phases[phaseIdx].items ?? [];

/** Aktiv taktikk med n faser, stående i fasen idx. */
function withPhases(n: number, idx = 0) {
  for (let i = 1; i < n; i++) s().addPhase();
  s().setActivePhaseIdx(idx);
}

// ══ Vasking ════════════════════════════════════════════════════
describe('repairDrawing', () => {
  const arrow = (color: unknown) => repairDrawing({ id: 'd', type: 'arrow', color, pts: [{ x: 0, y: 0 }, { x: 50, y: 0 }] });

  it('gamle tegnefarger mappes til palettfarger', () => {
    expect(arrow('#EDEDEF')?.colorKey).toBe('white');
    expect(arrow('#6E93E6')?.colorKey).toBe('blue');
    expect(arrow('#5BAE84')?.colorKey).toBe('green');
    expect(arrow('#D9A93E')?.colorKey).toBe('yellow');
    expect(arrow('#E8834A')?.colorKey).toBe('orange');
  });

  it('ukjent hex får nærmeste palettfarge, ugyldig blir hvit', () => {
    expect(arrow('#ff0000')?.colorKey).toBe('orange');
    expect(arrow('tull')?.colorKey).toBe('white');
  });

  it('beholder den opprinnelige hexen for eldre versjoner', () => {
    expect(arrow('#ff0000')?.color).toBe('#ff0000');
  });

  it('forkaster tegninger som ikke kan tegnes', () => {
    expect(repairDrawing({ type: 'arrow', pts: [{ x: 0, y: 0 }] })).toBeNull();
    expect(repairDrawing({ type: 'label', at: { x: 1, y: 1 }, text: '   ' })).toBeNull();
    expect(repairDrawing({ type: 'ukjent', pts: [{ x: 0, y: 0 }, { x: 1, y: 1 }] })).toBeNull();
  });

  it('frihånd uten type forblir uten type', () => {
    const d = repairDrawing({ pts: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 9, y: 9 }] });
    expect(d).not.toBeNull();
    expect('type' in d!).toBe(false);
  });
});

describe('repairItem', () => {
  it('ugyldig type eller posisjon forkastes', () => {
    expect(repairItem({ type: 'bil', position: { x: 1, y: 1 } })).toBeNull();
    expect(repairItem({ type: 'cone', position: { x: 'a', y: 1 } })).toBeNull();
    expect(repairItem(null)).toBeNull();
  });

  it('rotasjonen normaliseres til 0–359', () => {
    expect(repairItem({ type: 'ladder', position: { x: 1, y: 1 }, rotation: 370 })?.rotation).toBe(10);
    expect(repairItem({ type: 'ladder', position: { x: 1, y: 1 }, rotation: -15 })?.rotation).toBe(345);
    expect(repairItem({ type: 'ladder', position: { x: 1, y: 1 } })?.rotation).toBeUndefined();
  });
});

describe('repairEvent', () => {
  it('forkaster det som ikke kan plasseres i kalenderen', () => {
    expect(repairEvent(null)).toBeNull();
    expect(repairEvent('tull')).toBeNull();
    expect(repairEvent({ title: 'uten dato' })).toBeNull();
    expect(repairEvent({ date: '24.09.2026' })).toBeNull();
  });

  it('reparerer felt og hvitlister notatene', () => {
    const e = repairEvent({
      id: 'x', date: '2026-10-01', type: 'rart', trainingNotes: 'ikke en liste',
      matchNotes: [null, { content: 'god omgang', half: 2 }],
    })!;
    expect(e.type).toBe('training');
    expect(e.teamNote).toBe('');
    expect(e.trainingNotes).toEqual([]);
    expect(e.matchNotes).toHaveLength(1);
    expect(e.matchNotes[0].half).toBe(2);
  });

  it('beholder taktikkpunkter, forkaster notater uten tittel og gamle felt', () => {
    const e = repairEvent({
      date: '2026-10-01',
      trainingNotes: [
        { title: 'Høyt press', tacticId: 't1', duration: 20, targetPlayerIds: ['p1'] },
        { title: 7 },
        { title: '✅ Fremmøte' },
      ],
    })!;
    expect(e.trainingNotes).toHaveLength(1);
    expect(e.trainingNotes[0]).toMatchObject({ title: 'Høyt press', tacticId: 't1', duration: 20 });
    expect('targetPlayerIds' in e.trainingNotes[0]).toBe(false);
  });
});

describe('repairTactic', () => {
  it('ukjent sport og formasjon får standardverdier, og spillerne fylles opp', () => {
    const t = repairTactic({ sport: 'håndball', formation: '9-9-9', phases: [{ players: [] }] })!;
    expect(t.sport).toBe('football');
    expect(t.formation).toBe('4-3-3');
    expect(t.phases[0].players).toHaveLength(11);
  });

  it('aktiv fase holdes innenfor fasene', () => {
    const t = repairTactic({ phases: [{}, {}], activePhaseIdx: 9 })!;
    expect(t.activePhaseIdx).toBe(1);
  });
});

// ══ Kjente feil ════════════════════════════════════════════════
describe('ødelagt import og lagring', () => {
  it('ødelagt import skal ikke slette data', () => {
    s().addTacticFromTemplate(TACTIC_TEMPLATES.find(t => t.id === 'f11-433-kontring')!);
    const tacticsBefore = s().tactics.length;
    s().importSnapshot({
      tactics: s().tactics,
      events: [null, 'tull', { title: 'uten dato' }, { date: '2026-10-01', title: 'Trening' }],
    });
    expect(s().tactics).toHaveLength(tacticsBefore);
    expect(s().tactics.some(t => t.name === '4-3-3 kontring')).toBe(true);
    expect(s().events.map(e => e.title)).toEqual(['Trening']);
  });

  it('en ødelagt hendelse i lagringen gir ikke standarddata ved lasting', () => {
    const saved = { tactics: [{ ...initial.tactics[0], name: 'Min taktikk' }], events: [null] };
    const repaired = repairPersisted(saved, initial);
    expect(repaired.tactics?.[0].name).toBe('Min taktikk');
    expect(repaired.events).toEqual([]);
  });
});

// ══ Maler ══════════════════════════════════════════════════════
describe('addTacticFromTemplate', () => {
  it('gir nye id-er hver gang og gjør taktikken aktiv', () => {
    const tpl = TACTIC_TEMPLATES.find(t => t.id === 'f11-433-press')!;
    s().addTacticFromTemplate(tpl);
    const a = active();
    s().addTacticFromTemplate(tpl);
    const b = active();
    expect(a.id).not.toBe(b.id);
    expect(a.phases[0].players[0].id).not.toBe(b.phases[0].players[0].id);
    expect(b.phases).toHaveLength(tpl.phases.length);
  });
});

// ══ Utstyr ═════════════════════════════════════════════════════
describe('utstyr på tvers av faser', () => {
  it('«+» kopierer utstyret med samme id-er', () => {
    const id = s().addItem('cone');
    s().addPhase();
    expect(itemsIn(1).map(i => i.id)).toEqual([id]);
  });

  it('nytt utstyr legges i aktiv fase og fasene etter, ikke før', () => {
    withPhases(4, 2);
    const id = s().addItem('opponent');
    expect([0, 1, 2, 3].map(i => itemsIn(i).some(it => it.id === id))).toEqual([false, false, true, true]);
  });

  it('sletting fjerner fra aktiv fase og fasene etter, ikke før', () => {
    withPhases(4, 0);
    const id = s().addItem('cone');
    s().setActivePhaseIdx(2);
    s().removeItem(id);
    expect([0, 1, 2, 3].map(i => itemsIn(i).length)).toEqual([1, 1, 0, 0]);
  });

  it('utstyr hopper ikke ved fasebytte: flytting følger med framover', () => {
    withPhases(3, 0);
    const id = s().addItem('cone');
    s().moveItem(id, { x: 352, y: 308 });
    expect([0, 1, 2].map(i => itemsIn(i)[0].position)).toEqual([
      { x: 352, y: 308 }, { x: 352, y: 308 }, { x: 352, y: 308 },
    ]);
  });

  it('følger med bare til første fase som er flyttet for seg', () => {
    withPhases(3, 0);
    const id = s().addItem('cone');
    s().setActivePhaseIdx(1);
    s().moveItem(id, { x: 600, y: 170 });        // Fase 2 (og 3) flyttet for seg
    s().setActivePhaseIdx(0);
    s().moveItem(id, { x: 400, y: 470 });        // Fase 1 flyttes igjen
    expect([0, 1, 2].map(i => itemsIn(i)[0].position)).toEqual([
      { x: 400, y: 470 }, { x: 600, y: 170 }, { x: 600, y: 170 },
    ]);
  });

  it('rotasjon følger samme regel og normaliseres', () => {
    withPhases(3, 0);
    const id = s().addItem('ladder');
    s().setActivePhaseIdx(2);
    s().rotateItem(id, 30);                        // egen rotasjon i Fase 3
    s().setActivePhaseIdx(0);
    s().rotateItem(id, -15);
    expect([0, 1, 2].map(i => itemsIn(i)[0].rotation)).toEqual([345, 345, 30]);
  });

  it('nye elementer legges ikke oppå hverandre eller på spillerne', () => {
    const types = ['cone', 'opponent', 'minigoal', 'mannequin', 'ladder', 'hurdle', 'ball'] as const;
    types.forEach(t => s().addItem(t));
    const items = itemsIn(0);
    const players = active().phases[0].players;
    items.forEach((a, i) => {
      items.slice(i + 1).forEach(b => {
        const apart = Math.abs(a.position.x - b.position.x) > ITEM_RADIUS[a.type] + ITEM_RADIUS[b.type]
          || Math.abs(a.position.y - b.position.y) > 30;
        expect(apart, `${a.type} og ${b.type}`).toBe(true);
      });
      players.forEach(p => {
        const apart = Math.abs(a.position.x - p.position.x) > ITEM_RADIUS[a.type] + 20
          || Math.abs(a.position.y - p.position.y) > 30;
        expect(apart, `${a.type} og spiller ${p.num}`).toBe(true);
      });
    });
  });
});

// ══ Treninger ══════════════════════════════════════════════════
describe('moveTrainingNote', () => {
  it('flytter ett steg og stopper i endene', () => {
    s().addEvent({ type: 'training', title: 'T', date: '2026-10-01', teamNote: '', trainingNotes: [], matchNotes: [] });
    const ev = s().events[0];
    ['A', 'B', 'C'].forEach(title => s().addTrainingNote(ev.id, { title, content: '', focus: [] }));
    const titles = () => s().events[0].trainingNotes.map(n => n.title).join('');
    const idOf = (t: string) => s().events[0].trainingNotes.find(n => n.title === t)!.id;
    s().moveTrainingNote(ev.id, idOf('C'), -1);
    expect(titles()).toBe('ACB');
    s().moveTrainingNote(ev.id, idOf('A'), -1);   // allerede først
    expect(titles()).toBe('ACB');
  });
});

// ══ Produksjonsreview: beskyttelse mot korrupte data ═══════════
describe('rapporter og øyeblikk vaskes', () => {
  it('gyldige rapporter og øyeblikk er uendret', () => {
    s().createReport(['god_pressing'], 'Bra', 'Mot Ørn', 'ev-1');
    s().saveMoment('Press');
    const repaired = repairPersisted(s().exportSnapshot(), initial);
    expect(repaired.matchReports).toEqual(s().matchReports);
    expect(repaired.moments).toEqual(s().moments);
  });

  it('ødelagte rapporter forkastes eller får riktige typer', () => {
    const r = repairPersisted({ tactics: s().tactics, matchReports: [
      null, 5, 'tull', { id: 'x' },
      { id: 'y', generatedText: 'Tekst', tags: 'god_pressing', freeText: 7, matchTitle: {} },
      { id: 'z', generatedText: 'Tekst', tags: ['god_pressing', 'ukjent', 3, 'toString'] },
    ] }, initial);
    expect(r.matchReports).toHaveLength(2);
    const [y, z] = r.matchReports!;
    expect(y.tags).toEqual([]);
    expect(y.freeText).toBe('');
    expect(y.matchTitle).toBeUndefined();
    expect(z.tags).toEqual(['god_pressing']);
  });

  it('ødelagte øyeblikk forkastes', () => {
    expect(repairMoment(null)).toBeNull();
    expect(repairMoment({ name: 'x', snapshot: 'x' })).toBeNull();
    expect(repairMoment({ name: {}, snapshot: {} })).toBeNull();
    const m = repairMoment({ name: 'ok', snapshot: {}, tacticId: 5, timestamp: null });
    expect(m?.name).toBe('ok');
    expect(m?.tacticId).toBeUndefined();
    expect(typeof m?.timestamp).toBe('string');
    expect(repairReport({ generatedText: 'x' })?.tags).toEqual([]);
  });
});

describe('duplikate id-er ved lasting og import', () => {
  const ev = (id: string, title: string) => ({ id, title, date: '2026-10-01' });

  it('gyldige data (ingen duplikater) er uendret', () => {
    s().addPhase();
    s().addItem('cone');
    s().addEvent({ type: 'training', title: 'T', date: '2026-10-01', teamNote: '', trainingNotes: [], matchNotes: [] });
    const repaired = repairPersisted(s().exportSnapshot(), initial);
    const ids = (ts: Tactic[]) => ts.map(t => [t.id, t.phases.map(ph =>
      [ph.id, ph.players.map(p => [p.id, p.num]), (ph.items ?? []).map(i => i.id), ph.drawings.map(d => d.id)])]);
    expect(ids(repaired.tactics!)).toEqual(ids(s().tactics));
    expect(repaired.events).toEqual(s().events);
  });

  it('to taktikker med samme id blir to taktikker, og sletting krasjer ikke', () => {
    const t = s().tactics[0];
    s().importSnapshot({ tactics: [t, { ...t, name: 'Kopi' }], activeTacticId: t.id });
    const [a, b] = s().tactics;
    expect(a.id).toBe(t.id);
    expect(b.id).not.toBe(t.id);
    expect(s().activeTacticId).toBe(t.id);
    expect(() => s().removeTactic(t.id)).not.toThrow();
    expect(s().tactics.map(x => x.name)).toEqual(['Kopi']);
  });

  it('hendelser og notater med samme id endres ikke sammen', () => {
    s().importSnapshot({
      tactics: s().tactics,
      events: [ev('X', 'En'), { ...ev('X', 'To'), trainingNotes: [{ id: 'n', title: 'a' }, { id: 'n', title: 'b' }] }],
    });
    const [e1, e2] = s().events;
    expect(e1.id).not.toBe(e2.id);
    expect(new Set(e2.trainingNotes.map(n => n.id)).size).toBe(2);
    s().updateEvent(e1.id, { title: 'Endret' });
    expect(s().events.map(e => e.title)).toEqual(['Endret', 'To']);
  });

  it('to spillere med samme id i én fase: duplikaten fjernes, sloten får riktig spiller', () => {
    s().addPhase();
    const t = active();
    const [p0, p1] = t.phases[0].players;
    const broken = { ...t, phases: [
      { ...t.phases[0], players: t.phases[0].players.map(p => p.slotIdx === 1 ? { ...p, id: p0.id } : p) },
      t.phases[1],
    ] };
    const rep = repairTactic(broken)!;
    const ids = rep.phases[0].players.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Sloten fylles med spilleren som står der i fase 2 – samme id som før.
    expect(rep.phases[0].players[1].id).toBe(p1.id);
  });

  it('faser, tegninger og utstyr med samme id i én fase får unike id-er', () => {
    const t = active();
    const ph = { ...t.phases[0],
      drawings: [{ id: 'd', pts: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 9, y: 9 }] }, { id: 'd', pts: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 9, y: 9 }] }],
      items: [{ id: 'i', type: 'cone', position: { x: 10, y: 10 } }, { id: 'i', type: 'cone', position: { x: 20, y: 20 } }],
    };
    const rep = repairTactic({ ...t, phases: [ph, ph] })!;
    expect(rep.phases[0].id).not.toBe(rep.phases[1].id);
    expect(new Set(rep.phases[0].drawings.map(d => d.id)).size).toBe(2);
    expect(new Set(rep.phases[0].items!.map(i => i.id)).size).toBe(2);
    // Samme utstyr i ulike faser beholder id-en: det er slik det glir mellom fasene.
    expect(rep.phases[1].items![0].id).toBe('i');
  });

  it('rapporter og øyeblikk med samme id får unike id-er', () => {
    const r = repairPersisted({ tactics: s().tactics,
      matchReports: [{ id: 'r', generatedText: 'a' }, { id: 'r', generatedText: 'b' }],
      moments: [{ id: 'm', name: 'a', snapshot: {} }, { id: 'm', name: 'b', snapshot: {} }],
    }, initial);
    expect(new Set(r.matchReports!.map(x => x.id)).size).toBe(2);
    expect(new Set(r.moments!.map(x => x.id)).size).toBe(2);
  });
});

describe('syncPlayers: samme spiller har samme id i alle faser', () => {
  it('en manglende spiller får id og nummer fra samme slot i de andre fasene', () => {
    s().addPhase();
    s().setPlayerName(active().phases[0].players[3].id, 'Ola');
    const t = active();
    const p3 = t.phases[0].players[3];
    const broken = { ...t, phases: [t.phases[0], { ...t.phases[1], players: t.phases[1].players.filter(p => p.slotIdx !== 3) }] };
    const rep = repairTactic(broken)!;
    const filled = rep.phases[1].players.find(p => p.slotIdx === 3)!;
    expect(filled.id).toBe(p3.id);
    expect(filled.num).toBe(p3.num);
    // Spilleren kan dermed følges: navn satt senere gjelder begge fasene.
    s().importSnapshot({ tactics: [rep], activeTacticId: rep.id });
    s().setPlayerName(p3.id, 'Kari');
    expect(active().phases.map(ph => ph.players.find(p => p.slotIdx === 3)!.name)).toEqual(['Kari', 'Kari']);
  });

  it('slot som mangler i alle faser får samme nye spiller i alle faser', () => {
    s().addPhase();
    const t = active();
    const rep = repairTactic({ ...t, phases: t.phases.map(ph => ({ ...ph, players: ph.players.filter(p => p.slotIdx !== 5) })) })!;
    const [a, b] = rep.phases.map(ph => ph.players.find(p => p.slotIdx === 5)!);
    expect(a.id).toBe(b.id);
    expect(a.num).toBe(b.num);
  });

  it('sportbytte gir fortsatt samme nye spillere i alle faser', () => {
    s().setSport('football7');
    s().addPhase();
    s().setSport('football');
    const [ph1, ph2] = active().phases;
    expect(ph1.players.map(p => [p.id, p.num])).toEqual(ph2.players.map(p => [p.id, p.num]));
    expect(ph1.players).toHaveLength(11);
  });
});

describe('ugyldige koordinater avvises', () => {
  const bad = [{ x: NaN, y: 10 }, { x: 10, y: Infinity }, { x: -Infinity, y: 0 }, null, { x: '5', y: 5 }] as unknown as Position[];

  it('movePlayer, moveBall og moveItem ignorerer NaN/Infinity/ugyldig', () => {
    const id = s().addItem('cone');
    const before = active().phases[0];
    const pid = before.players[0].id;
    for (const pos of bad) {
      s().movePlayer(pid, pos);
      s().moveBall(pos);
      s().moveItem(id, pos);
    }
    expect(active().phases[0]).toEqual(before);
  });

  it('gyldige flytt virker som før', () => {
    const id = s().addItem('cone');
    const pid = active().phases[0].players[0].id;
    s().movePlayer(pid, { x: 100, y: 200 });
    s().moveBall({ x: 50, y: 60 });
    s().moveItem(id, { x: 300, y: 300 });
    const ph = active().phases[0];
    expect(ph.players[0].position).toEqual({ x: 100, y: 200 });
    expect(ph.ball).toEqual({ x: 50, y: 60 });
    expect(ph.items![0].position).toEqual({ x: 300, y: 300 });
  });
});

describe('import uten gyldige taktikker', () => {
  it('avbrytes og endrer ingenting', () => {
    s().addEvent({ type: 'training', title: 'Min', date: '2026-10-01', teamNote: '', trainingNotes: [], matchNotes: [] });
    const before = s().exportSnapshot();
    for (const tactics of [[], [null], ['tull', 5]]) {
      expect(() => s().importSnapshot({ tactics, events: [{ date: '2026-11-01', title: 'Fra fil' }] })).toThrow();
    }
    expect(s().exportSnapshot()).toEqual(before);
  });

  it('import med gyldige taktikker virker som før', () => {
    const t = { ...s().tactics[0], id: 'annen', name: 'Fra fil' };
    s().importSnapshot({ tactics: [t], events: [] });
    expect(s().tactics.map(x => x.name)).toEqual(['Fra fil']);
  });
});

describe('ekstreme posisjoner og draktnumre ved lasting', () => {
  it('posisjoner utenfor brettet flyttes til kanten, ugyldige numre får slotnummeret', () => {
    const t = active();
    const ph = { ...t.phases[0],
      players: t.phases[0].players.map((p, i) =>
        i === 0 ? { ...p, num: 1e21, position: { x: 1e300, y: -5e9 } }
        : i === 1 ? { ...p, num: 3.5 }
        : i === 2 ? { ...p, num: -1 }
        : i === 3 ? { ...p, num: 0 } : p),
      ball: { x: -100, y: 9999 },
      items: [{ id: 'i', type: 'cone', position: { x: 1e9, y: 1e9 } }],
    };
    const rep = repairTactic({ ...t, phases: [ph] })!.phases[0];
    expect(rep.players[0].position).toEqual({ x: VW, y: 0 });
    expect(rep.players.slice(0, 4).map(p => p.num)).toEqual([1, 2, 3, 4]);
    expect(rep.ball).toEqual({ x: 0, y: VH });
    expect(rep.items![0].position).toEqual({ x: VW, y: VH });
  });

  it('alle maler og en vanlig taktikk er uendret (posisjoner og numre)', () => {
    TACTIC_TEMPLATES.forEach(tpl => s().addTacticFromTemplate(tpl));
    s().addItem('ladder');
    for (const t of s().tactics) {
      const rep = repairTactic(t)!;
      const view = (x: Tactic) => x.phases.map(ph => [ph.ball, ph.players.map(p => [p.num, p.position]), ph.items ?? []]);
      expect(view(rep)).toEqual(view(t));
    }
  });
});
