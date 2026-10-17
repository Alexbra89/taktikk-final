'use client';
import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { TEXTAREA_CLASS, LABEL_CLASS } from '@/lib/formClasses';

// ═══ NAVNELISTE (KUN FOR FREMMØTE) ═════════════════════════════
// Redigering av spillerlista som fremmøtet krysses av mot.

export const RosterEditor: React.FC<{
  rosterNames: string[];
  onSave: (names: string[]) => void;
}> = ({ rosterNames, onSave }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const openEditor = () => { setText(rosterNames.join('\n')); setOpen(true); };
  const save = () => { onSave(text.split('\n')); setOpen(false); };

  if (!open) {
    return (
      <button onClick={openEditor}
        className="mt-2 text-meta text-signal hover:brightness-110 font-semibold min-h-[44px]">
        <Pencil size={13} strokeWidth={1.75} aria-hidden className="inline -mt-px" /> Rediger navneliste
      </button>
    );
  }

  return (
    <div className="mt-3 bg-canvas-sunken border border-dashed border-rule rounded-panel p-3">
      <div className={LABEL_CLASS + ' mb-1.5'}>Navneliste – ett navn per linje</div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
        placeholder={'Ola\nKari\nPer'}
        className={TEXTAREA_CLASS} />
      <div className="flex gap-2 mt-2">
        <button onClick={save}
          className="flex-1 py-2.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal font-bold text-body hover:bg-signal/15 min-h-[44px]">
          Lagre navneliste
        </button>
        <button onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-ctl border border-rule text-ink-subtle text-body min-h-[44px]">
          Avbryt
        </button>
      </div>
    </div>
  );
};
