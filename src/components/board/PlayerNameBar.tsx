'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Player } from '../../types';

// Valgfritt kallenavn på den valgte spilleren. Tomt felt = brikken viser bare nummer.
// Bruk `key={player.id}` slik at feltet nullstilles når en annen spiller velges.

const MAX_LENGTH = 12;   // NameLabel kutter lengre navn

export const PlayerNameBar: React.FC<{ player: Player; label: string; onClose: () => void }> = ({ player, label, onClose }) => {
  const setPlayerName = useAppStore(s => s.setPlayerName);
  const [value, setValue] = useState(player.name);
  const latest  = useRef(player.name);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = () => {
    if (!pending.current) return;
    clearTimeout(pending.current);
    pending.current = null;
    setPlayerName(player.id, latest.current);
  };

  // Lagre det som ble skrevet også når feltet forsvinner (annen spiller valgt, ✕).
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (v: string) => {
    setValue(v);
    latest.current = v;
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(flush, 300);
  };

  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-canvas-sunken border-t border-rule">
      <span className="flex-shrink-0 font-mono text-body text-signal">
        #{player.num} <span className="text-ink-muted">{label}</span>
      </span>
      <label className="flex-1 min-w-0 flex items-center gap-2">
        <span className="flex-shrink-0 font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">
          Kallenavn
        </span>
        <input
          value={value}
          maxLength={MAX_LENGTH}
          placeholder="f.eks. Tommy"
          onChange={e => onChange(e.target.value)}
          onBlur={flush}
          onKeyDown={e => { if (e.key === 'Enter') { flush(); e.currentTarget.blur(); } }}
          className="flex-1 min-w-0 rounded-ctl px-2.5 min-h-[40px] bg-canvas-raised text-body text-ink placeholder-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal"
        />
      </label>
      <button onClick={onClose} aria-label="Lukk kallenavn-feltet"
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors">
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
};
