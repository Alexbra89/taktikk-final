import { afterEach, describe, expect, it } from 'vitest';
import { ALL_DRILLS } from '@/data/drills';
import { emptyDrill, parseAiDrill, parseStepLines, repairCustomDrill } from './customDrills';
import { repairPersisted, useAppStore } from '@/store/useAppStore';

const valid = () => ({ ...emptyDrill('youth'), name: 'Min pasningslek', description: 'To og to med ball.',
  players: '10', steps: [{ id: '1', name: 'Spill', description: 'Spill i korte serier med pauser.' }] });
afterEach(() => useAppStore.setState({ customDrills: [] }));

describe('egne øvelser', () => {
  it('oppretter, redigerer og sletter bare egne data; 78 voksne og 75 barn beholdes', () => {
    const original = JSON.stringify(ALL_DRILLS);
    const tactics = useAppStore.getState().tactics;
    const events = useAppStore.getState().events;
    const saved = useAppStore.getState().saveCustomDrill({ ...valid(), id: ALL_DRILLS[0].id });
    expect(saved.id).toMatch(/^custom-/);
    expect(saved.isCustom).toBe(true);
    useAppStore.getState().saveCustomDrill({ ...saved, name: 'Endret navn' });
    expect(useAppStore.getState().customDrills).toHaveLength(1);
    expect(useAppStore.getState().customDrills[0].name).toBe('Endret navn');
    useAppStore.getState().deleteCustomDrill(ALL_DRILLS[0].id);
    expect(useAppStore.getState().customDrills).toHaveLength(1);
    useAppStore.getState().deleteCustomDrill(saved.id);
    expect(useAppStore.getState().customDrills).toHaveLength(0);
    expect(JSON.stringify(ALL_DRILLS)).toBe(original);
    expect(ALL_DRILLS.filter(d => d.ageGroup === 'adult')).toHaveLength(78);
    expect(ALL_DRILLS.filter(d => d.ageGroup === 'youth')).toHaveLength(75);
    expect(useAppStore.getState().tactics).toBe(tactics);
    expect(useAppStore.getState().events).toBe(events);
  });

  it('tar med egne øvelser og AI-merking i sikkerhetskopi og innlasting', () => {
    const saved = useAppStore.getState().saveCustomDrill({ ...valid(), aiGenerated: true });
    const backup = useAppStore.getState().exportSnapshot();
    const loaded = repairPersisted(JSON.parse(JSON.stringify(backup)), useAppStore.getState());
    expect(loaded.customDrills).toEqual([saved]);
    useAppStore.getState().saveCustomDrill({ ...saved, aiGenerated: false });
    expect(useAppStore.getState().customDrills[0].aiGenerated).toBe(true);
    expect(repairPersisted({ ...backup, customDrills: [null, {}, saved, saved] }, useAppStore.getState()).customDrills)
      .toHaveLength(2);
    const ids = repairPersisted({ ...backup, customDrills: [saved, saved] }, useAppStore.getState()).customDrills!.map(d => d.id);
    expect(new Set(ids).size).toBe(2);
    expect(repairPersisted({ ...backup, customDrills: undefined }, useAppStore.getState()).customDrills).toEqual([]);
  });

  it('avviser ugyldige felter og fjerner kildefelt', () => {
    for (const patch of [{ name: ' ' }, { duration: 0 }, { duration: 2.5 }, { duration: 241 },
      { players: '' }, { ageBand: ['17+'] }, { category: 'ukjent' }]) {
      expect(repairCustomDrill({ ...valid(), ...patch })).toBeNull();
    }
    expect(repairCustomDrill({ ...valid(), source: 'oppdiktet', unverifiedSource: 'falsk' })).not.toHaveProperty('source');
  });

  it('tolker falske AI-svar og avviser tomme, avkortede og kildeholdige svar', () => {
    expect(parseAiDrill(JSON.stringify(valid()))).toMatchObject({ aiGenerated: true, isCustom: true });
    expect(parseAiDrill('```json\n' + JSON.stringify(valid()) + '\n```')).not.toBeNull();
    for (const answer of ['', '{}', '{"name":', JSON.stringify({ ...valid(), description: 'Se https://falsk.no' }),
      JSON.stringify({ ...valid(), description: 'Kilde: oppdiktet bok' }), JSON.stringify({ ...valid(), steps: [] })]) {
      expect(parseAiDrill(answer)).toBeNull();
    }
  });

  it('godtar ordet «ifølge» i AI-svar', () => {
    const drill = parseAiDrill(JSON.stringify({ ...valid(), description: 'Spill ifølge reglene for småbane.' }));
    expect(drill?.description).toBe('Spill ifølge reglene for småbane.');
  });

  it('beholder stegnavn ved redigering ved å dele på første kolon', () => {
    const text = valid().steps.map(s => `${s.name}: ${s.description}`).join('\n') + '\nBytt: hvert 2. minutt: tell høyt\nBare tekst';
    expect(parseStepLines(text)).toEqual([
      { id: 'step-0', name: 'Spill', description: 'Spill i korte serier med pauser.' },
      { id: 'step-1', name: 'Bytt', description: 'hvert 2. minutt: tell høyt' },
      { id: 'step-2', name: '', description: 'Bare tekst' },
    ]);
  });
});
