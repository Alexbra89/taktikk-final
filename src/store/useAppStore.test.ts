import { beforeEach, describe, expect, it } from 'vitest';
import {
  useAppStore, repairDrawing, repairEvent, repairItem, repairPersisted, repairTactic,
} from './useAppStore';
import { ITEM_RADIUS } from '@/data/boardItems';
import { TACTIC_TEMPLATES } from '@/data/tacticTemplates';
import type { BoardItem, Tactic } from '@/types';

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
