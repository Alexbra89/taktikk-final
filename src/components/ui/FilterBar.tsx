'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* ────────────────────────────────────────────────────────────
   FilterBar – filterraden over lister.

   Radene ruller horisontalt på mobil i stedet for å brekke over
   fire linjer. Det holder høyden på headeren konstant, slik at
   selve lista beholder plassen sin på en liten skjerm.
   På desktop (sm+) brytes de som vanlig.
   ──────────────────────────────────────────────────────────── */

export const FilterBar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      'flex-shrink-0 bg-surface-panel border-b border-line',
      'bg-panel-grad',
      className,
    )}
  >
    {children}
  </div>
);

/** Én filterrad med valgfri etikett foran. */
export const FilterRow: React.FC<{
  label?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className }) => (
  <div className={cn('flex items-center gap-2 px-4', className)}>
    {label && (
      <span className="text-label uppercase text-fg-faint flex-shrink-0">{label}</span>
    )}
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1.5 sm:flex-wrap sm:overflow-visible">
      {children}
    </div>
  </div>
);

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** Overstyrer aksentfargen når chipen er aktiv (f.eks. vanskelighetsgrad).
   *  'signal' er Kalk-varianten og bruker Kalk-tokens også i hvilende tilstand. */
  accent?: 'brand' | 'ok' | 'warn' | 'bad' | 'neutral' | 'signal';
  /** Liten telling til høyre i chipen. */
  count?: number;
}

const ACTIVE: Record<NonNullable<FilterChipProps['accent']>, string> = {
  brand:   'border-brand-500/60 bg-brand-500/15 text-brand-300',
  ok:      'border-ok-500/60   bg-ok-500/15   text-ok-300',
  warn:    'border-warn-500/60 bg-warn-500/15 text-warn-300',
  bad:     'border-bad-500/60  bg-bad-500/15  text-bad-300',
  neutral: 'border-line-strong bg-surface-hover text-fg',
  signal:  'border-signal/50 bg-signal/10 text-signal',
};

// Kalk-chipen har egen hvilende tilstand – Fase 1-flatene (surface-card) ville
// stått som en blå flekk i et Kalk-panel.
const IDLE_SIGNAL = 'border-rule bg-canvas-raised text-ink-muted hover:text-ink';
const IDLE_FASE1  = 'border-line bg-surface-card text-fg-subtle hover:text-fg-muted hover:border-line-strong';

export const FilterChip: React.FC<FilterChipProps> = ({
  active = false,
  accent = 'brand',
  count,
  className,
  children,
  ...rest
}) => (
  <button
    type="button"
    aria-pressed={active}
    className={cn(
      'tap-auto min-h-[30px] flex-shrink-0 inline-flex items-center gap-1.5',
      'px-3 rounded-pill border text-meta font-bold',
      'transition-all duration-150 focus-ring',
      active
        ? ACTIVE[accent]
        : accent === 'signal' ? IDLE_SIGNAL : IDLE_FASE1,
      className,
    )}
    {...rest}
  >
    {children}
    {count !== undefined && (
      <span className={cn('text-label tabular-nums', active ? 'opacity-70' : 'opacity-50')}>
        {count}
      </span>
    )}
  </button>
);

/** Søkefelt med ikon og nullstill-knapp. */
export const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Søk…', className }) => (
  <div className={cn('relative', className)}>
    <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint text-body pointer-events-none">
      🔍
    </span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-surface-card border border-line rounded-xl',
        'pl-9 pr-9 py-2.5 text-body text-fg placeholder:text-fg-faint',
        'transition-colors focus:outline-none focus:border-brand-500/60',
        'focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]',
      )}
    />
    {value && (
      <button
        type="button"
        aria-label="Tøm søk"
        onClick={() => onChange('')}
        className="tap-auto absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg
                   text-fg-faint hover:text-fg hover:bg-white/5 transition-colors"
      >
        ✕
      </button>
    )}
  </div>
);

/** Tomtilstand for filtrerte lister. */
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}> = ({ icon = '🔍', title, hint, action }) => (
  <div className="flex flex-col items-center text-center py-14 px-6">
    <div aria-hidden className="text-3xl mb-3 opacity-60">{icon}</div>
    <p className="text-lead font-bold text-fg-muted">{title}</p>
    {hint && <p className="text-meta text-fg-faint mt-1.5 max-w-[34ch]">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
