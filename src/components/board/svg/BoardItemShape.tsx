import React from 'react';
import type { BoardItemType } from '@/types';

// ══════════════════════════════════════════════════════════════
//  UTSTYR – slik hvert element ser ut på banen, sett ovenfra
//
//  Tegnes rundt (0, 0) og flyttes med transform. Farger som må
//  synes på begge banene følger temaet: blekk (--k-ink) for ramme-
//  utstyr og nøytral grå (--k-opponent) for motstandere. Kjegle,
//  stige og dukke har faste signalfarger, med samme tema-kant som
//  draktene (--k-kit-edge). Navn og mål ligger i data/boardItems.ts.
// ══════════════════════════════════════════════════════════════

const INK   = 'rgb(var(--k-ink))';
const PITCH = 'rgb(var(--k-pitch))';
const EDGE  = 'var(--k-kit-edge)';

export const BoardItemShape: React.FC<{ type: BoardItemType }> = ({ type }) => {
  switch (type) {
    case 'cone':
      return (
        <path d="M 0 -9 L 8 7 L -8 7 Z" strokeWidth={1.25} strokeLinejoin="round"
          style={{ fill: '#F97316', stroke: EDGE }}/>
      );

    case 'opponent':
      return (
        <circle r={13} strokeWidth={1.5}
          style={{ fill: 'rgb(var(--k-opponent))', stroke: EDGE }}/>
      );

    case 'minigoal':
      // Mål sett ovenfra: stolper og tverrligger foran, nett bak.
      return (
        <g style={{ stroke: INK }} fill="none" strokeLinecap="round">
          <rect x={-20} y={-7} width={40} height={14} rx={2} strokeWidth={1}
            style={{ fill: INK, fillOpacity: 0.08 }} strokeDasharray="2,2" opacity={0.7}/>
          <line x1={-20} y1={7} x2={20} y2={7} strokeWidth={3}/>
          <line x1={-20} y1={-7} x2={-20} y2={7} strokeWidth={3}/>
          <line x1={20} y1={-7} x2={20} y2={7} strokeWidth={3}/>
        </g>
      );

    case 'mannequin':
      // Frispark-dukke: hode og kropp.
      return (
        <g strokeWidth={1.25} style={{ stroke: EDGE }}>
          <rect x={-6} y={-6} width={12} height={17} rx={4} style={{ fill: '#A855F7' }}/>
          <circle cy={-10} r={4.5} style={{ fill: '#A855F7' }}/>
        </g>
      );

    case 'ladder':
      // Koordinasjonsstige: to vanger og trinn.
      return (
        <g style={{ stroke: '#FACC15' }} strokeWidth={2} strokeLinecap="round">
          <line x1={-42} y1={-9} x2={42} y2={-9}/>
          <line x1={-42} y1={9} x2={42} y2={9}/>
          {[-42, -28, -14, 0, 14, 28, 42].map(x => <line key={x} x1={x} y1={-9} x2={x} y2={9}/>)}
        </g>
      );

    case 'hurdle':
      // Hekk: tverrstang med føtter.
      return (
        <g style={{ stroke: INK }} strokeLinecap="round">
          <line x1={-15} y1={0} x2={15} y2={0} strokeWidth={4}/>
          <line x1={-15} y1={-5} x2={-15} y2={5} strokeWidth={2.5}/>
          <line x1={15} y1={-5} x2={15} y2={5} strokeWidth={2.5}/>
        </g>
      );

    case 'ball':
      // Som ballen, litt mindre, så den ikke forveksles med kampballen.
      return (
        <>
          <circle r={8} style={{ fill: INK }}/>
          <circle r={3} style={{ fill: PITCH }}/>
        </>
      );
  }
};
