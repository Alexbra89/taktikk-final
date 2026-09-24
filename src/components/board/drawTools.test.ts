import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DRAW_PALETTE, buildDrawing, colorFields, drawingColorKey, nearestColorKey } from './drawTools';

// ── WCAG-kontrast, som i fargearbeidet ──────────────────────────
const channel = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

// ── Temaverdiene slik de står i globals.css ─────────────────────
const css = readFileSync(fileURLToPath(new URL('../../app/globals.css', import.meta.url)), 'utf8');
function themeBlock(selector: string): string {
  const start = css.indexOf(selector);
  return css.slice(start, css.indexOf('}', start));
}
const triplet = (block: string, name: string) => {
  const m = new RegExp(`--${name}:\\s*(\\d+) (\\d+) (\\d+)`).exec(block);
  if (!m) throw new Error(`fant ikke --${name}`);
  return [+m[1], +m[2], +m[3]];
};
const THEMES = {
  night: themeBlock(":root[data-theme='dark']"),
  day:   themeBlock(":root[data-theme='light']"),
};

describe('tegnefarger', () => {
  it('globals.css og DRAW_PALETTE har samme verdier («hold dem like»)', () => {
    for (const c of DRAW_PALETTE) {
      expect(triplet(THEMES.night, `k-draw-${c.key}`), `${c.key} kveld`).toEqual(hex(c.night));
      expect(triplet(THEMES.day, `k-draw-${c.key}`), `${c.key} dagslys`).toEqual(hex(c.day));
    }
  });

  it('alle tegnefarger har minst 4,5:1 mot banen i begge temaer', () => {
    for (const [theme, block] of Object.entries(THEMES)) {
      const pitch = triplet(block, 'k-pitch');
      for (const c of DRAW_PALETTE) {
        const color = triplet(block, `k-draw-${c.key}`);
        expect(contrast(color, pitch), `${c.key} i ${theme}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('gammel palett og ukjente farger får nærmeste palettfarge', () => {
    expect(nearestColorKey('#EDEDEF')).toBe('white');
    expect(nearestColorKey('#6E93E6')).toBe('blue');
    expect(nearestColorKey('#fff')).toBe('white');
    expect(nearestColorKey('#ff0000')).toBe('orange');
    expect(nearestColorKey('ikke-en-farge')).toBe('white');
  });

  it('colorKey går foran color', () => {
    expect(drawingColorKey({ colorKey: 'green', color: '#6E93E6' })).toBe('green');
    expect(drawingColorKey({ colorKey: 'lilla', color: '#6E93E6' })).toBe('blue');
  });

  it('nye streker får nøkkel og kveldshex', () => {
    expect(colorFields('blue')).toEqual({ colorKey: 'blue', color: DRAW_PALETTE[1].night });
  });
});

describe('buildDrawing', () => {
  const line = (n: number, len = 100) => Array.from({ length: n }, (_, i) => ({ x: (i * len) / Math.max(1, n - 1), y: 0 }));

  it('frihånd trenger mer enn to punkter', () => {
    expect(buildDrawing('freehand', line(2), 'white')).toBeNull();
    expect(buildDrawing('freehand', line(3), 'white')).toMatchObject({ colorKey: 'white' });
  });

  it('pil under minstelengden blir ingenting', () => {
    expect(buildDrawing('arrow', line(5, 8), 'blue')).toBeNull();
    expect(buildDrawing('arrow', line(5, 80), 'blue')).toMatchObject({ type: 'arrow', colorKey: 'blue' });
  });
});
