'use client';
import React, { useState } from 'react';
import { Modal } from '../ui';
import { LABEL_CLASS, TEXTAREA_CLASS, PRIMARY_BTN, SECONDARY_BTN } from '../../lib/formClasses';

// ══════════════════════════════════════════════════════════════
//  NOTAT FOR FASEN – lå tidligere i BoardPanel. Ligger nå på verktøy-
//  linja sammen med fasene, fordi notatet hører til fasen man står i.
//  Dialogen for å skrive, lagre og tømme notatet. Brukes av TacticBoard.
// ══════════════════════════════════════════════════════════════
export const PhaseNoteModal: React.FC<{
  phaseName: string;
  note: string;
  onSave: (note: string) => void;
  onClose: () => void;
}> = ({ phaseName, note, onSave, onClose }) => {
  const [draft, setDraft] = useState(note);

  const save = () => { onSave(draft); onClose(); };

  return (
    <Modal
      onClose={onClose}
      size="sm"
      title={<span className="font-serif text-[1.5rem] leading-tight">Notat</span>}
      subtitle={<span className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">{phaseName}</span>}
      footer={
        <div className="flex gap-2">
          <button onClick={save} className={`flex-1 ${PRIMARY_BTN}`}>Lagre</button>
          {note && (
            <button onClick={() => { onSave(''); onClose(); }} className={SECONDARY_BTN}>
              Tøm
            </button>
          )}
        </div>
      }
    >
      <label className={LABEL_CLASS} htmlFor="fase-notat">Hva skal spillerne huske?</label>
      <textarea
        id="fase-notat"
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={5}
        placeholder="F.eks. Hold linja høy til ballen er vunnet."
        className={TEXTAREA_CLASS}
      />
    </Modal>
  );
};
