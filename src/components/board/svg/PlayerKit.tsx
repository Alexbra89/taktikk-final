import React from 'react';
import type { RoleFamily } from '@/data/roleInfo';

// Spilleren som fotballdrakt. Fargen viser rollefamilien: keeper gul,
// forsvar blå, midtbane grønn, angrep rød. Fargene er like i begge
// temaene; en tynn kant som følger temaet (--k-kit-edge) gjør at gul og
// grønn drakt synes på den lyse banen, og blå og rød på den mørke.
// Tallet har minst 4,5:1 mot drakten.

export const KIT_COLORS: Record<RoleFamily, { fill: string; fg: string }> = {
  gk:  { fill: '#FACC15', fg: '#1A1A1A' },
  def: { fill: '#2563EB', fg: '#FFFFFF' },
  mid: { fill: '#22C55E', fg: '#0B2E13' },
  att: { fill: '#DC2626', fg: '#FFFFFF' },
};

/**
 * Drakt med korte ermer og rund hals, rundt (0, 0). Ermene går ut til ±20,
 * fra skuldrene (−17) til nederste kant (+18) – omtrent like stor som
 * sirkelen (r 17), litt høyere.
 */
const KIT_PATH =
  'M -7 -17 Q 0 -10 7 -17 L 13 -16 L 20 -8 L 15 -2 L 12 -5 L 12 17 ' +
  'Q 0 19.5 -12 17 L -12 -5 L -15 -2 L -20 -8 L -13 -16 Z';

/** Hvor langt under midtpunktet rolleetiketten står, så den går fri av drakten. */
export const KIT_BADGE_OFFSET = 25;

const INK = 'rgb(var(--k-ink))';

/** Selve drakten med tall, rundt (0, 0). Brukes også av drag-skyggen. */
export const KitShape: React.FC<{ family: RoleFamily; num: number }> = ({ family, num }) => {
  const kit = KIT_COLORS[family];
  return (
    <>
      {/* Skygge: en forskjøvet kopi, ikke et filter – filtre gjør drag tregt på mobil. */}
      <path d={KIT_PATH} transform="translate(0.5 1.8)" fill="#000" opacity={0.28}/>
      <path d={KIT_PATH} strokeWidth={1.25} strokeLinejoin="round"
        style={{ fill: kit.fill, stroke: 'var(--k-kit-edge)' }}/>
      <text x={0} y={2.5} textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fontWeight="700"
        fontFamily="var(--font-mono), ui-monospace, monospace"
        style={{ pointerEvents: 'none', fill: kit.fg }}>{num}</text>
    </>
  );
};

export const PlayerKit = React.memo<{
  x: number; y: number; num: number; family: RoleFamily;
  selected: boolean;
  isDragging: boolean; isTarget: boolean; isOutOfPos: boolean;
  /** Hvor mye drakten dempes under drag. Fullskjerm flytter selve drakten og demper mindre. */
  dragOpacity?: number;
}>(({ x, y, num, family, selected, isDragging, isTarget, isOutOfPos, dragOpacity = 0.3 }) => (
  <g opacity={isDragging ? dragOpacity : 1} style={{ transition: 'opacity 0.1s' }}>
    {/* Samme arbeidsmarkeringer som sirkelen, litt større – ikke med i eksportert bilde. */}
    {selected && (
      <circle data-export="skip" cx={x} cy={y} r={27} fill="none" strokeWidth={1.5}
        style={{ stroke: INK }} opacity={0.65}/>
    )}
    {isTarget && !selected && (
      <circle data-export="skip" cx={x} cy={y} r={29} fill="none" strokeWidth={1.5}
        strokeDasharray="5,4" style={{ stroke: INK }} opacity={0.5}/>
    )}
    {isOutOfPos && (
      <line x1={x - 6} y1={y + 22.5} x2={x + 6} y2={y + 22.5}
        strokeWidth={1.5} strokeLinecap="round" style={{ stroke: INK }} opacity={0.4}/>
    )}
    <g transform={`translate(${x} ${y})`}>
      <KitShape family={family} num={num}/>
    </g>
  </g>
));
PlayerKit.displayName = 'PlayerKit';
