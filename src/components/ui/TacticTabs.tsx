'use client';
import React, { useRef, useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/cn';
import { TemplateModal } from './TemplateModal';

// ═══════════════════════════════════════════════════════════════
//  TAKTIKK-FANER – én fane per taktikk.
//  bar:  vannrett rad som rulles (mobil).
//  list: loddrett liste i sidefeltet (desktop).
//  Dobbeltklikk (eller ✎ på aktiv fane) gir nytt navn. × ber om bekreftelse.
//  «Ny taktikk» åpner malvelgeren, som også har «Tom taktikk».
// ═══════════════════════════════════════════════════════════════

interface TacticTabsProps {
  variant?: 'bar' | 'list';
  /** Kalles når en taktikk velges eller opprettes – sidefeltet bruker den til å åpne brettet. */
  onActivate?: () => void;
}

export const TacticTabs: React.FC<TacticTabsProps> = ({ variant = 'bar', onActivate }) => {
  const tactics         = useAppStore(s => s.tactics);
  const activeTacticId  = useAppStore(s => s.activeTacticId);
  const removeTactic    = useAppStore(s => s.removeTactic);
  const renameTactic    = useAppStore(s => s.renameTactic);
  const setActiveTactic = useAppStore(s => s.setActiveTactic);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [picking, setPicking]     = useState(false);
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
  const isList  = variant === 'list';

  return (
    <div
      role="tablist"
      aria-label="Taktikker"
      aria-orientation={isList ? 'vertical' : 'horizontal'}
      className={isList
        ? 'flex flex-col gap-px'
        : 'flex-shrink-0 flex items-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar'}
    >
      {tactics.map(t => {
        const active = t.id === activeTacticId;
        return (
          <div
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => { setActiveTactic(t.id); onActivate?.(); }}
            onDoubleClick={() => startEdit(t.id, t.name)}
            className={cn(
              'group relative flex items-center gap-1 rounded-ctl pr-1 cursor-pointer select-none transition-colors',
              isList ? 'pl-3 min-h-[36px]' : 'flex-shrink-0 pl-3 min-h-[40px] shadow-hair',
              active
                ? 'bg-canvas-raised text-ink'
                : 'text-ink-muted hover:text-ink hover:bg-canvas-hover',
            )}
          >
            {isList && active && (
              <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-signal" />
            )}
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
                className={cn(
                  'bg-transparent border-b border-signal-line text-body text-ink focus:outline-none',
                  isList ? 'tap-auto flex-1 min-w-0' : 'w-32',
                )}
              />
            ) : (
              <span
                className={cn('text-body truncate', isList ? 'flex-1 min-w-0' : 'max-w-[160px]')}
                title="Dobbeltklikk for å endre navn"
              >
                {t.name}
              </span>
            )}
            {active && editingId !== t.id && (
              <button
                onClick={e => { e.stopPropagation(); startEdit(t.id, t.name); }}
                title="Endre navn"
                aria-label={`Endre navn på ${t.name}`}
                className={cn('w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink', isList && 'tap-auto')}
              ><Pencil size={13} strokeWidth={1.75} /></button>
            )}
            <button
              onClick={e => { e.stopPropagation(); askRemove(t.id, t.name); }}
              disabled={onlyOne}
              title={onlyOne ? 'Den siste taktikken kan ikke slettes' : 'Slett taktikk'}
              aria-label={`Slett ${t.name}`}
              className={cn(
                'w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink',
                'disabled:opacity-30 disabled:hover:text-ink-subtle disabled:cursor-not-allowed',
                // I lista vises × bare på den aktive raden og ved hover, så den ikke støyer.
                isList && 'tap-auto',
                isList && !active && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              )}
            ><X size={14} strokeWidth={1.75} /></button>
          </div>
        );
      })}

      <button
        onClick={() => setPicking(true)}
        className={cn(
          'flex items-center gap-2 rounded-ctl text-body text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors',
          isList ? 'tap-auto min-h-[36px] px-3' : 'flex-shrink-0 min-h-[40px] px-3',
        )}
      ><Plus size={14} strokeWidth={1.75} /> Ny taktikk</button>

      {picking && <TemplateModal onClose={() => setPicking(false)} onCreated={onActivate} />}
    </div>
  );
};
