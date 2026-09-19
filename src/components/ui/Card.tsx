'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* ────────────────────────────────────────────────────────────
   Card – bærende flate for innhold.

   variant:
     solid   standardkort på mørk bakgrunn
     sunken  innfelt/rolig (bakgrunnsseksjoner, tomtilstander)
     float   flytende lag (modal, popover) – ikke i lister
     outline stiplet ramme, brukes til «legg til»-flater
   accent: valgfri venstrestripe (kategori-identitet)
   ──────────────────────────────────────────────────────────── */

export type CardVariant = 'solid' | 'sunken' | 'float' | 'outline';

const VARIANTS: Record<CardVariant, string> = {
  solid:   'bg-canvas-panel border border-rule shadow-hair',
  sunken:  'bg-canvas-sunken border border-rule',
  float:   'bg-canvas-panel border border-rule shadow-pop',
  outline: 'bg-canvas-sunken/60 border border-dashed border-rule',
};

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  /** Gjør kortet klikkbart: hover-løft, peker og tastaturfokus. */
  interactive?: boolean;
  /** Fargestripe langs venstre kant, f.eks. kategorifarge. */
  accent?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'li' | 'article' | 'section';
}

const PADDING = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' } as const;

export const Card: React.FC<CardProps> = ({
  variant = 'solid',
  interactive = false,
  accent,
  padding = 'md',
  as = 'div',
  className,
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;
  return (
  <Tag
    className={cn(
      'relative rounded-panel overflow-hidden transition-all duration-150',
      VARIANTS[variant],
      PADDING[padding],
      accent && 'pl-[calc(theme(spacing.4)+3px)]',
      interactive &&
        'cursor-pointer hover:border-rule-strong hover:bg-canvas-raised ' +
        'active:scale-[0.995] focus-ring',
      className,
    )}
    {...(interactive ? { tabIndex: 0, role: 'button' } : {})}
    {...rest}
  >
    {accent && (
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accent }}
      />
    )}
    {children}
  </Tag>
  );
};

/** Tittelrad i et kort: overskrift, valgfri undertekst og høyrestilt innhold. */
export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className }) => (
  <div className={cn('flex items-start justify-between gap-3', className)}>
    <div className="min-w-0">
      <h3 className="text-h4 text-ink truncate">{title}</h3>
      {subtitle && <p className="text-meta text-ink-subtle mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

/** Liten seksjonsoverskrift – versaler, brukes over lister og grupper. */
export const SectionLabel: React.FC<{
  children: React.ReactNode;
  tone?: string;
  className?: string;
}> = ({ children, tone = 'text-ink-subtle', className }) => (
  <div className={cn('text-label uppercase', tone, className)}>{children}</div>
);
