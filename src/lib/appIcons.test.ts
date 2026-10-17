import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const file = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url));

describe('installerbare appikoner', () => {
  it('manifestet peker til ekte PNG i 192/512 og eget maskable 512', () => {
    const manifest = JSON.parse(file('public/manifest.json').toString());
    expect(manifest.icons.map((i: { sizes: string; purpose: string }) => [i.sizes, i.purpose]))
      .toEqual([['192x192', 'any'], ['512x512', 'any'], ['512x512', 'maskable']]);
    for (const icon of manifest.icons) {
      const png = file(`public${icon.src}`);
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
    }
    const apple = file('public/apple-touch-icon-pitch-v2.png');
    expect([apple.readUInt32BE(16), apple.readUInt32BE(20)]).toEqual([180, 180]);
  });
  it('favicon er ICO med 16/32/48, og Next-ruten har samme bilde', () => {
    const ico = file('public/favicon-pitch-v2.ico');
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(3);
    expect([ico[6], ico[22], ico[38]]).toEqual([16, 32, 48]);
    expect(file('src/app/favicon.ico')).toEqual(ico);
  });
});
