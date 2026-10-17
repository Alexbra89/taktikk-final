'use client';
import dynamic from 'next/dynamic';
import React from 'react';
import { Board3DBoundary } from '../layout/ErrorBoundary';

// ══════════════════════════════════════════════════════════════
//  3D-PLASSEN I TACTICBOARD – lå før inne i TacticBoard.
//  3D-visningen lastes først når brukeren velger 3D, med egen
//  feilskjerm som foreslår 2D. Det skjulte 2D-brettet holdes stille
//  mens 3D spiller av (HoldWhileHidden).
// ══════════════════════════════════════════════════════════════

// Three and the video encoder stay out of the initial 2D bundle.
const Board3D = dynamic(() => import('./Board3D'), {
  ssr: false,
  loading: () => <div role="status" className="flex-1 flex items-center justify-center text-caption text-ink-subtle">Laster 3D-visning …</div>,
});

// Hopper over nye tegninger så lenge `hold` er sann. Brukes på det skjulte
// 2D-brettet under 3D-avspilling: klokka og fasen ligger i TacticBoard, så
// brettet tegnes med gjeldende tilstand straks det vises igjen eller
// avspillingen stopper.
export const HoldWhileHidden = React.memo(
  function HoldWhileHidden({ children }: { hold: boolean; children: React.ReactNode }) { return <>{children}</>; },
  (_prev, next) => next.hold,
);

type Board3DSlotProps = React.ComponentProps<typeof Board3D> & { onSwitchTo2D: () => void };

export const Board3DSlot: React.FC<Board3DSlotProps> = ({ onSwitchTo2D, ...props }) => (
  <Board3DBoundary onSwitchTo2D={onSwitchTo2D}><Board3D {...props} /></Board3DBoundary>
);
