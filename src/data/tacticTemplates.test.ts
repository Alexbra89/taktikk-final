import { describe, expect, it } from 'vitest';
import { TACTIC_TEMPLATES, buildTemplatePhases } from './tacticTemplates';
import { getFormations } from './formations';
import { CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM } from '@/components/board/constants';
import { VW, VH } from './formations';

let n = 0;
const newId = () => `t${++n}`;

describe('taktikk-maler', () => {
  it('det finnes 15 maler med unike id-er', () => {
    expect(TACTIC_TEMPLATES).toHaveLength(15);
    expect(new Set(TACTIC_TEMPLATES.map(t => t.id)).size).toBe(15);
  });

  it.each(TACTIC_TEMPLATES.map(t => [t.name, t] as const))('%s: formasjonen finnes for sporten', (_, tpl) => {
    expect(getFormations(tpl.sport).some(f => f.name === tpl.formation)).toBe(true);
  });

  it.each(TACTIC_TEMPLATES.map(t => [t.name, t] as const))('%s: alle spillere innenfor banen, ballen synlig, ingen overlapp', (_, tpl) => {
    for (const ph of buildTemplatePhases(tpl, newId)) {
      for (const p of ph.players) {
        expect(p.position.x).toBeGreaterThanOrEqual(CLAMP_X);
        expect(p.position.x).toBeLessThanOrEqual(VW - CLAMP_X);
        expect(p.position.y).toBeGreaterThanOrEqual(CLAMP_Y_TOP);
        expect(p.position.y).toBeLessThanOrEqual(VH - CLAMP_Y_BOTTOM);
      }
      // Ballen ligger aldri under en brikke, og brikkene ligger ikke oppå hverandre.
      const near = Math.min(...ph.players.map(p => Math.hypot(p.position.x - ph.ball.x, p.position.y - ph.ball.y)));
      expect(near, `ballen i «${ph.name}»`).toBeGreaterThanOrEqual(24);
      ph.players.forEach((a, i) => ph.players.slice(i + 1).forEach(b => {
        expect(Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y), `#${a.num} og #${b.num} i «${ph.name}»`)
          .toBeGreaterThanOrEqual(44);
      }));
    }
  });

  it('spillerne har samme id i alle fasene, så avspillingen kan følge dem', () => {
    const phases = buildTemplatePhases(TACTIC_TEMPLATES.find(t => t.id === 'f11-433-kontring')!, newId);
    const ids = phases[0].players.map(p => p.id).join();
    expect(phases.every(ph => ph.players.map(p => p.id).join() === ids)).toBe(true);
  });

  it('løpene får piler i fasen spilleren går fra, ikke i siste fase', () => {
    const phases = buildTemplatePhases(TACTIC_TEMPLATES.find(t => t.id === 'f11-433-press')!, newId);
    expect(phases[0].drawings.some(d => 'type' in d && d.type === 'arrow')).toBe(true);
    // Siste fase har bare malens egne tegninger (skuddpila), ingen løp videre.
    expect(phases[phases.length - 1].drawings).toHaveLength(1);
  });
});
