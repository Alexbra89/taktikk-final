'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* ────────────────────────────────────────────────────────────
   Button – én knapp, fem betydninger.

   primary   hovedhandlingen på skjermen. Maks én synlig om gangen.
   secondary sideordnet handling
   ghost     lavvekts handling i tette rader
   danger    sletting og annet uopprettelig
   success   bekreftet tilstand («Lagt til»)

   Størrelse sm holder seg under 44px og bruker derfor .tap-auto
   for å overstyre den globale min-height-regelen i globals.css.
   ──────────────────────────────────────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-signal text-signal-fg hover:brightness-110 ' +
    'disabled:bg-canvas-raised disabled:text-ink-faint',
  secondary:
    'bg-canvas-raised text-ink-muted border border-rule ' +
    'hover:border-rule-strong hover:text-ink',
  ghost:
    'text-ink-subtle hover:text-ink hover:bg-canvas-hover',
  danger:
    'bg-bad-500/15 text-bad-300 border border-bad-500/40 hover:bg-bad-500/25',
  success:
    'bg-ok-500/15 text-ok-300 border border-ok-500/40 hover:bg-ok-500/25',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'tap-auto min-h-[32px] px-2.5 text-meta font-bold rounded-lg gap-1.5',
  md: 'min-h-[44px] px-4 text-body font-bold rounded-xl gap-2',
  lg: 'min-h-[52px] px-5 text-lead font-bold rounded-xl gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ikon eller emoji foran teksten. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, fullWidth, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap',
        'transition-all duration-150 focus-ring',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon && <span aria-hidden className="leading-none">{icon}</span>}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

/** Kvadratisk knapp for kun ikon. Krever alltid aria-label. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'icon' | 'fullWidth'> & { 'aria-label': string }
>(({ variant = 'ghost', size = 'md', className, children, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'inline-flex items-center justify-center flex-shrink-0',
      'transition-all duration-150 focus-ring',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      VARIANTS[variant],
      size === 'sm'
        ? 'tap-auto h-8 w-8 rounded-lg text-body'
        : size === 'lg'
          ? 'h-12 w-12 rounded-xl text-lead'
          : 'h-11 w-11 rounded-xl text-body',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
));
IconButton.displayName = 'IconButton';
