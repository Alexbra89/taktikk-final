'use client';
import React from 'react';
import { Search, X } from 'lucide-react';
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
      'flex-shrink-0 bg-canvas-sunken border-b border-rule',
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
      <span className="text-label uppercase text-ink-faint flex-shrink-0">{label}</span>
    )}
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1.5 sm:flex-wrap sm:overflow-visible">
      {children}
    </div>
  </div>
);

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** Overstyrer aksentfargen når chipen er aktiv (f.eks. vanskelighetsgrad).
   *  'signal' er standard: Kalk har én aksent. */
  accent?: 'signal' | 'ok' | 'warn' | 'bad' | 'neutral';
  /** Liten telling til høyre i chipen. */
  count?: number;
}

const ACTIVE: Record<NonNullable<FilterChipProps['accent']>, string> = {
  signal:  'border-signal/50 bg-signal/10 text-signal',
  ok:      'border-ok-500/60   bg-ok-500/15   text-ok-300',
  warn:    'border-warn-500/60 bg-warn-500/15 text-warn-300',
  bad:     'border-bad-500/60  bg-bad-500/15  text-bad-300',
  neutral: 'border-rule-strong bg-canvas-hover text-ink',
};

const IDLE = 'border-rule bg-canvas-raised text-ink-muted hover:text-ink hover:border-rule-strong';

export const FilterChip: React.FC<FilterChipProps> = ({
  active = false,
  accent = 'signal',
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
      active ? ACTIVE[accent] : IDLE,
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
    <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
      <Search size={15} strokeWidth={1.75} />
    </span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-canvas-panel border border-rule rounded-xl',
        'pl-9 pr-9 py-2.5 text-body text-ink placeholder:text-ink-faint',
        'transition-colors focus:outline-none focus:border-signal/60',
        'focus:shadow-[0_0_0_3px_rgb(var(--k-signal)/0.14)]',
      )}
    />
    {value && (
      <button
        type="button"
        aria-label="Tøm søk"
        onClick={() => onChange('')}
        className="tap-auto absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg
                   text-ink-faint hover:text-ink hover:bg-canvas-hover transition-colors
                   flex items-center justify-center"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    )}
  </div>
);

/** Tomtilstand for filtrerte lister. */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}> = ({ icon, title, hint, action }) => (
  <div className="flex flex-col items-center text-center py-14 px-6">
    <div aria-hidden className="mb-3 text-ink-faint">
      {icon ?? <Search size={26} strokeWidth={1.5} />}
    </div>
    <p className="text-lead font-bold text-ink-muted">{title}</p>
    {hint && <p className="text-meta text-ink-faint mt-1.5 max-w-[34ch]">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
