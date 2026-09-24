'use client';
import React from 'react';
import { Modal } from '../ui/Modal';
import { BoardItemShape } from './svg/BoardItemShape';
import { BOARD_ITEMS } from '@/data/boardItems';
import type { BoardItemType } from '@/types';

// Utstyrspaletten: ett trykk legger elementet på banen i fasen man står i.
// Derfra dras det dit det skal, som spillerne.

export const EquipmentPalette: React.FC<{
  onPick: (type: BoardItemType) => void;
  onClose: () => void;
}> = ({ onPick, onClose }) => (
  <Modal onClose={onClose} size="sm" title="Utstyr"
    subtitle={<p className="text-meta text-ink-muted">Legges på banen i denne fasen. Dra det dit det skal.</p>}>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {BOARD_ITEMS.map(item => (
        <button key={item.type} onClick={() => onPick(item.type)}
          className="flex flex-col items-center gap-1.5 rounded-ctl bg-canvas-raised shadow-hair px-2 py-3 hover:bg-canvas-hover transition-colors min-h-[88px]">
          {/* Forhåndsvisning på en bit bane, så fargene blir som på brettet. */}
          <svg viewBox="-50 -22 100 44" className="w-20 h-9 rounded-ctl" aria-hidden>
            <rect x={-50} y={-22} width={100} height={44} style={{ fill: 'rgb(var(--k-pitch))' }}/>
            <BoardItemShape type={item.type}/>
          </svg>
          <span className="text-caption text-ink">{item.label}</span>
        </button>
      ))}
    </div>
  </Modal>
);
