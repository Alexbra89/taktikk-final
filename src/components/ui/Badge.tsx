'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* ────────────────────────────────────────────────────────────
   Badge – leser status, ikke handling. Aldri klikkbar.
   ──────────────────────────────────────────────────────────── */

export type BadgeTone =
  | 'neutral' | 'brand' | 'ok' | 'warn' | 'bad' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-canvas-raised text-ink-muted border-rule',
  brand:   'bg-signal/15 text-signal border-signal/35',
  ok:      'bg-ok-500/15  text-ok-300  border-ok-500/35',
  warn:    'bg-warn-500/15 text-warn-300 border-warn-500/35',
  bad:     'bg-bad-500/15  text-bad-300  border-bad-500/35',
  info:    'bg-canvas-raised text-ink-muted border-rule',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  /** Farget prikk foran teksten, f.eks. kategorifarge. */
  dot?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  size = 'sm',
  dot,
  className,
  children,
  ...rest
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-pill border font-bold whitespace-nowrap',
      size === 'sm' ? 'px-2 py-0.5 text-label' : 'px-2.5 py-1 text-meta',
      TONES[tone],
      className,
    )}
    {...rest}
  >
    {dot && (
      <span aria-hidden className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
    )}
    {children}
  </span>
);

/** Nøkkeltall-rad: «20 min · 8 spillere». Ett ledd per Meta.
 *  icon er et lucide-ikon, ikke emoji – Kalk holder ikonene monokrome. */
export const Meta: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  icon, children, className,
}) => (
  <span className={cn('inline-flex items-center gap-1 text-meta text-ink-subtle', className)}>
    {icon && <span aria-hidden className="flex-shrink-0 text-ink-faint">{icon}</span>}
    {children}
  </span>
);
