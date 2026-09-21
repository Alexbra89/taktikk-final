'use client';
import React, { useState } from 'react';
import { Modal } from '../ui';
import { LABEL_CLASS, INPUT_CLASS, PRIMARY_BTN } from '../../lib/formClasses';
import { LABEL_MAX_LENGTH } from './drawTools';

/** Innholdet i en tekst-merkelapp. Posisjonen er allerede valgt med et trykk på banen. */
export const TextLabelModal: React.FC<{
  onSave: (text: string) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [text, setText] = useState('');
  const save = () => { onSave(text); };

  return (
    <Modal
      onClose={onClose}
      size="sm"
      title={<span className="font-serif text-[1.5rem] leading-tight">Tekst på banen</span>}
      footer={
        <button onClick={save} disabled={!text.trim()} className={`w-full ${PRIMARY_BTN}`}>
          Legg til
        </button>
      }
    >
      <label className={LABEL_CLASS} htmlFor="tegning-tekst">Merkelapp</label>
      <input
        id="tegning-tekst"
        // Virker bare så lenge onClose har stabil identitet – se cancelLabel i useDrawingInput.
        autoFocus
        value={text}
        maxLength={LABEL_MAX_LENGTH}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { e.preventDefault(); save(); } }}
        placeholder="F.eks. Press her"
        className={INPUT_CLASS}
      />
    </Modal>
  );
};
