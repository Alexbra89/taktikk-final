'use client';
import React, { useEffect, useRef, useState } from 'react';
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
    <div
      style={{ background: 'rgba(5,10,28,0.92)', borderTop: '1px solid rgba(56,189,248,0.12)' }}
      className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5"
    >
      <span className="flex-shrink-0 text-[11px] font-black text-sky-400 tabular-nums">
        #{player.num} <span className="text-slate-500 font-bold">{label}</span>
      </span>
      <label className="flex-1 min-w-0 flex items-center gap-2">
        <span className="flex-shrink-0 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">
          Kallenavn (valgfritt)
        </span>
        <input
          value={value}
          maxLength={MAX_LENGTH}
          placeholder="f.eks. Tommy"
          onChange={e => onChange(e.target.value)}
          onBlur={flush}
          onKeyDown={e => { if (e.key === 'Enter') { flush(); e.currentTarget.blur(); } }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          className="flex-1 min-w-0 rounded-lg px-2.5 py-1 text-[13px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 min-h-[40px]"
        />
      </label>
      <button onClick={onClose} aria-label="Lukk kallenavn-feltet"
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300">✕</button>
    </div>
  );
};
