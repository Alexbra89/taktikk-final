import { describe, expect, it } from 'vitest';
import { formationLabel, tacticSetupLabel } from './selectors';

describe('visningstekst for formasjon', () => {
  it('vanlig taktikk: formasjon og spillformat som før', () => {
    const t = { formation: '4-3-3', sport: 'football' as const };
    expect(formationLabel(t)).toBe('4-3-3');
    expect(tacticSetupLabel(t)).toBe('4-3-3 · 11er');
  });

  it('tom bane: verken arvet formasjon eller spillformat', () => {
    const t = { formation: '4-3-3', sport: 'football' as const, empty: true };
    expect(formationLabel(t)).toBe('Tom bane');
    expect(tacticSetupLabel(t)).toBe('Tom bane');
  });
});
