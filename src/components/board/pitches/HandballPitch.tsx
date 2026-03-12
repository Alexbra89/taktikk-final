'use client';
import React from 'react';
import { VW, VH } from '../../../data/formations';

/**
 * KORREKT HÅNDBALLBANE — IHF-standard
 * Offisiell bane: 40m × 20m
 * SVG-koordinatsystem: 880 × 560
 *
 * Skaleringsfaktorer:
 *   scaleX = spilleflate-bredde / 40m
 *   scaleY = spilleflate-høyde  / 20m
 *
 * IHF-mål fra hver bakvegg:
 *   6m — målvaktsone (hel linje langs bakvegg + ellipse-bue)
 *   9m — frisparklinje (stiplet ellipse-bue)
 *   7m — straffekast-strek
 *   4m — målvaktslinje (stiplet halvmåne)
 *   Mål: 3m bredt, plassert midt på kortvegg
 */
export const HandballPitch: React.FC = () => {
  const M  = 28;
  const PW = VW - M * 2;   // 824
  const PH = VH - M * 2;   // 504
  const L  = M;
  const R  = M + PW;
  const T  = M;
  const B  = M + PH;
  const CX = VW / 2;
  const CY = VH / 2;

  // Skala: 40m → PW horisontalt, 20m → PH vertikalt
  const sx = PW / 40;
  const sy = PH / 20;

  // Ellipse-radier for soner
  const r6x = 6 * sx;  const r6y = 6 * sy;
  const r9x = 9 * sx;  const r9y = 9 * sy;
  const p7  = 7 * sx;
  const r4x = 4 * sx;  const r4y = 4 * sy;

  // Mål: 3m bredt
  const goalHalf = (3 * sy) / 2;
  const goalD    = 20; // visuell dybde

  const midR = 3 * Math.min(sx, sy);

  const W  = 'rgba(255,255,255,0.82)';
  const WG = 'rgba(255,255,255,0.50)';
  const WD = 'rgba(255,255,255,0.78)';

  return (
    <g fill="none">

      {/* Ytre ramme */}
      <rect x={L} y={T} width={PW} height={PH}
        stroke={W} strokeWidth={2.2} />

      {/* Midtlinje */}
      <line x1={CX} y1={T} x2={CX} y2={B}
        stroke={W} strokeWidth={1.8} />

      {/* Midtsirkel */}
      <circle cx={CX} cy={CY} r={midR}
        stroke={W} strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={3} fill={W} />

      {/* ══ VENSTRE MÅL ══ */}
      <rect x={L - goalD} y={CY - goalHalf} width={goalD} height={goalHalf * 2}
        fill="rgba(0,0,0,0.35)" stroke={WG} strokeWidth={1.5} />
      <line x1={L} y1={CY - goalHalf} x2={L} y2={CY + goalHalf}
        stroke="rgba(255,255,255,0.95)" strokeWidth={4.5} />

      {/* 6m sone venstre — ellipse-bue */}
      <line x1={L} y1={CY - goalHalf} x2={L} y2={CY - r6y} stroke={W} strokeWidth={2.2} />
      <path d={`M ${L} ${CY - r6y} A ${r6x} ${r6y} 0 0 1 ${L} ${CY + r6y}`}
        stroke={W} strokeWidth={2.2} />
      <line x1={L} y1={CY + r6y} x2={L} y2={CY + goalHalf} stroke={W} strokeWidth={2.2} />

      {/* 9m frispark venstre */}
      <path d={`M ${L} ${CY - r9y} A ${r9x} ${r9y} 0 0 1 ${L} ${CY + r9y}`}
        stroke={WD} strokeWidth={1.8} strokeDasharray="11,6" />

      {/* 7m venstre */}
      <line x1={L + p7} y1={CY - 14} x2={L + p7} y2={CY + 14}
        stroke={W} strokeWidth={2.8} />

      {/* 4m keeperlinje venstre */}
      <path d={`M ${L + r4x} ${CY - 13} A ${r4x} ${r4y} 0 0 1 ${L + r4x} ${CY + 13}`}
        stroke={WG} strokeWidth={1.3} strokeDasharray="5,4" />

      {/* ══ HØYRE MÅL ══ */}
      <rect x={R} y={CY - goalHalf} width={goalD} height={goalHalf * 2}
        fill="rgba(0,0,0,0.35)" stroke={WG} strokeWidth={1.5} />
      <line x1={R} y1={CY - goalHalf} x2={R} y2={CY + goalHalf}
        stroke="rgba(255,255,255,0.95)" strokeWidth={4.5} />

      {/* 6m sone høyre */}
      <line x1={R} y1={CY - goalHalf} x2={R} y2={CY - r6y} stroke={W} strokeWidth={2.2} />
      <path d={`M ${R} ${CY - r6y} A ${r6x} ${r6y} 0 0 0 ${R} ${CY + r6y}`}
        stroke={W} strokeWidth={2.2} />
      <line x1={R} y1={CY + r6y} x2={R} y2={CY + goalHalf} stroke={W} strokeWidth={2.2} />

      {/* 9m frispark høyre */}
      <path d={`M ${R} ${CY - r9y} A ${r9x} ${r9y} 0 0 0 ${R} ${CY + r9y}`}
        stroke={WD} strokeWidth={1.8} strokeDasharray="11,6" />

      {/* 7m høyre */}
      <line x1={R - p7} y1={CY - 14} x2={R - p7} y2={CY + 14}
        stroke={W} strokeWidth={2.8} />

      {/* 4m keeperlinje høyre */}
      <path d={`M ${R - r4x} ${CY - 13} A ${r4x} ${r4y} 0 0 0 ${R - r4x} ${CY + 13}`}
        stroke={WG} strokeWidth={1.3} strokeDasharray="5,4" />

    </g>
  );
};
