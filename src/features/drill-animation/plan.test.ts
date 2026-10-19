import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALL_DRILLS } from '@/data/drills';
import { ALL_DRILL_ANIMATIONS } from '@/data/drillAnimations';

// docs/animasjon-plan.md sorterer alle øvelsene i «Egnet» og «Ikke egnet».
// Testen holder lista i takt med biblioteket og animasjonene.
const plan = readFileSync(fileURLToPath(new URL('../../../docs/animasjon-plan.md', import.meta.url)), 'utf8');
const [, suitablePart = '', unsuitablePart = ''] = plan.split(/^## (?:Egnet|Ikke egnet).*$/m);
const idsIn = (text: string) => Array.from(text.matchAll(/^- `([a-z]+-[ya]-\d{2})`/gm), m => m[1]);
const suitable = idsIn(suitablePart);
const unsuitable = idsIn(unsuitablePart);

describe('docs/animasjon-plan.md', () => {
  it('har hver øvelse nøyaktig én gang', () => {
    const listed = [...suitable, ...unsuitable];
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual(ALL_DRILLS.map(d => d.id).sort());
  });

  it('oppgir riktige antall', () => {
    expect(plan).toContain(`## Egnet (${suitable.length})`);
    expect(plan).toContain(`## Ikke egnet (${unsuitable.length})`);
    expect(plan).toContain(`${suitable.length} egnet og ${unsuitable.length} ikke egnet`);
  });

  it('har alle animerte øvelser under «Egnet», merket animert', () => {
    for (const animation of ALL_DRILL_ANIMATIONS) {
      expect(suitable).toContain(animation.drillId);
      expect(plan).toMatch(new RegExp(`\`${animation.drillId}\`.*\\(animert\\)`));
    }
  });
});
