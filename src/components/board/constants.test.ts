import { describe, expect, it } from 'vitest';
import { PITCH_BOX } from './constants';
import { VW, VH } from '@/data/formations';

describe('banens boks', () => {
  // I portrett la preserveAspectRatio tomrom inne i SVG-en under banen, og iOS
  // Safari malte ikke det tomrommet på nytt – en gammel stripe av banen ble
  // stående. Boksen har derfor banens proporsjoner, så tomrommet ikke finnes.
  it('stripe borte i portrett: SVG-en har banens proporsjoner', () => {
    expect(PITCH_BOX.aspectRatio).toBe(`${VW} / ${VH}`);
    expect(PITCH_BOX.height).toBe('auto');
    expect(PITCH_BOX.maxHeight).toBe('100%');
  });
});
