'use client';
import React, { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// ═══════════════════════════════════════════════════════════════
//  TAKTIKK-FANER – én fane per taktikk, rulles horisontalt på mobil.
//  Dobbeltklikk (eller ✎ på aktiv fane) gir nytt navn. × ber om bekreftelse.
// ═══════════════════════════════════════════════════════════════

export const TacticTabs: React.FC = () => {
  const tactics         = useAppStore(s => s.tactics);
  const activeTacticId  = useAppStore(s => s.activeTacticId);
  const addTactic       = useAppStore(s => s.addTactic);
  const removeTactic    = useAppStore(s => s.removeTactic);
  const renameTactic    = useAppStore(s => s.renameTactic);
  const setActiveTactic = useAppStore(s => s.setActiveTactic);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft]         = useState('');
  const cancelled = useRef(false);

  const startEdit = (id: string, name: string) => {
    cancelled.current = false;
    setDraft(name);
    setEditingId(id);
  };

  const finishEdit = () => {
    if (editingId && !cancelled.current) renameTactic(editingId, draft);
    setEditingId(null);
  };

  const askRemove = (id: string, name: string) => {
    if (tactics.length <= 1) return;
    if (window.confirm(`Slette taktikken «${name}»? Alle fasene i den forsvinner.`)) removeTactic(id);
  };

  const onlyOne = tactics.length <= 1;

  return (
    <div
      role="tablist"
      aria-label="Taktikker"
      style={{ background: 'rgba(5,10,25,0.82)', borderBottom: '1px solid rgba(56,189,248,0.1)' }}
      className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 overflow-x-auto whitespace-nowrap"
    >
      {tactics.map(t => {
        const active = t.id === activeTacticId;
        return (
          <div
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => setActiveTactic(t.id)}
            onDoubleClick={() => startEdit(t.id, t.name)}
            style={{
              background: active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
              border: active ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.07)',
            }}
            className={`flex-shrink-0 flex items-center gap-1 rounded-lg pl-3 pr-1 min-h-[40px] cursor-pointer select-none
              ${active ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {editingId === t.id ? (
              <input
                autoFocus
                value={draft}
                maxLength={30}
                onChange={e => setDraft(e.target.value)}
                onClick={e => e.stopPropagation()}
                onFocus={e => e.currentTarget.select()}
                onBlur={finishEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter') finishEdit();
                  if (e.key === 'Escape') { cancelled.current = true; finishEdit(); }
                }}
                aria-label="Nytt navn på taktikk"
                className="w-32 bg-transparent border-b border-sky-500/60 text-[12px] font-semibold text-slate-100 focus:outline-none"
              />
            ) : (
              <span className="text-[12px] font-semibold max-w-[160px] truncate" title="Dobbeltklikk for å endre navn">
                {t.name}
              </span>
            )}
            {active && editingId !== t.id && (
              <button
                onClick={e => { e.stopPropagation(); startEdit(t.id, t.name); }}
                title="Endre navn"
                aria-label={`Endre navn på ${t.name}`}
                className="w-7 h-7 flex items-center justify-center rounded text-[11px] text-slate-500 hover:text-sky-300"
              >✎</button>
            )}
            <button
              onClick={e => { e.stopPropagation(); askRemove(t.id, t.name); }}
              disabled={onlyOne}
              title={onlyOne ? 'Den siste taktikken kan ikke slettes' : 'Slett taktikk'}
              aria-label={`Slett ${t.name}`}
              className="w-7 h-7 flex items-center justify-center rounded text-[14px] text-slate-500 hover:text-red-400 disabled:opacity-25 disabled:hover:text-slate-500 disabled:cursor-not-allowed"
            >×</button>
          </div>
        );
      })}

      <button
        onClick={() => addTactic()}
        style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
        className="flex-shrink-0 px-3 rounded-lg min-h-[40px] text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/15"
      >＋ Lag taktikk</button>
    </div>
  );
};
