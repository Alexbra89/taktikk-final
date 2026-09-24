'use client';
import React, { useState } from 'react';
import { TrafficCone, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { EquipmentPalette } from './EquipmentPalette';
import { itemLabel } from '@/data/boardItems';
import { ROT_STEP } from '@/hooks/useBoardItems';
import { cn } from '@/lib/cn';
import type { BoardItem, BoardItemType } from '@/types';

// Utstyrsknappene i verktøylinja, felles for brett og fullskjerm:
// «Utstyr» åpner paletten; når et element er markert kommer ↺, ↻ og
// søppelbøtta i tillegg.

export const ItemControls: React.FC<{
  selectedItem: BoardItem | null;
  onAdd: (type: BoardItemType) => void;
  onRotate: (delta: number) => void;
  onRemove: () => void;
  disabled?: boolean;
  /** Klassen brettet bruker på ikonknappene sine. */
  buttonClass: string;
  /** Kalles ved hvert trykk – fullskjerm bruker det til å holde kontrollene synlige. */
  onInteract?: () => void;
}> = ({ selectedItem, onAdd, onRotate, onRemove, disabled, buttonClass, onInteract }) => {
  const [open, setOpen] = useState(false);
  const act = (fn: () => void) => () => { fn(); onInteract?.(); };
  const name = selectedItem ? itemLabel(selectedItem.type).toLowerCase() : '';

  return (
    <>
      <button onClick={act(() => setOpen(true))} disabled={disabled}
        aria-label="Utstyr" title="Legg til utstyr: kjegler, motstandere og mer" className={buttonClass}>
        <TrafficCone size={16} strokeWidth={1.75} />
      </button>
      {selectedItem && (<>
        <button onClick={act(() => onRotate(-ROT_STEP))} disabled={disabled}
          aria-label="Roter mot klokka" title={`Roter ${ROT_STEP}° mot klokka`} className={buttonClass}>
          <RotateCcw size={16} strokeWidth={1.75} />
        </button>
        <button onClick={act(() => onRotate(ROT_STEP))} disabled={disabled}
          aria-label="Roter med klokka" title={`Roter ${ROT_STEP}° med klokka`} className={buttonClass}>
          <RotateCw size={16} strokeWidth={1.75} />
        </button>
        <button onClick={act(onRemove)} disabled={disabled}
          aria-label={`Slett ${name}`} title={`Slett ${name} (Delete)`}
          className={cn(buttonClass, 'text-signal hover:text-signal')}>
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      </>)}
      {open && (
        <EquipmentPalette onPick={type => { onAdd(type); setOpen(false); }} onClose={() => setOpen(false)}/>
      )}
    </>
  );
};
