'use client';
import React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

// ═══════════════════════════════════════════════════════════════
//  PLATTFORM-FLATER – byggeklossene for sider og dashbord.
//  Rene visningskomponenter: ingen store, ingen logikk.
// ═══════════════════════════════════════════════════════════════

/** Kvadratisk ikonflate i områdefargen (se NAV[...].tile). */
export const IconTile: React.FC<{
  icon: LucideIcon;
  tone: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ icon: Icon, tone, size = 'md', className }) => (
  <span
    aria-hidden
    className={cn(
      'flex-shrink-0 inline-flex items-center justify-center',
      size === 'sm' && 'w-7 h-7 rounded-ctl',
      size === 'md' && 'w-9 h-9 rounded-panel',
      size === 'lg' && 'w-11 h-11 rounded-panel',
      tone,
      className,
    )}
  >
    <Icon size={size === 'sm' ? 14 : size === 'md' ? 17 : 20} strokeWidth={1.9} />
  </span>
);

/** Kortet på dashbord og sider. */
export const Tile: React.FC<{
  as?: 'div' | 'section' | 'article' | 'li';
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}> = ({ as = 'section', className, children, ...rest }) => {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={cn('rounded-tile bg-canvas-panel border border-rule shadow-tile p-4 sm:p-5 min-w-0', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

/** Tittelrad i et kort, med valgfri «Vis alle»-lenke. */
export const TileHeader: React.FC<{
  icon?: LucideIcon;
  tone?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}> = ({ icon, tone = 'bg-canvas-raised text-ink-muted', title, subtitle, action, className }) => (
  <div className={cn('flex items-center gap-3 mb-4', className)}>
    {icon && <IconTile icon={icon} tone={tone} />}
    <div className="flex-1 min-w-0">
      <h2 className="text-h4 text-ink truncate">{title}</h2>
      {subtitle && <p className="text-meta text-ink-subtle truncate">{subtitle}</p>}
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="flex-shrink-0 inline-flex items-center gap-0.5 min-h-[32px] px-2 -mr-2 rounded-ctl text-caption font-semibold text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors"
      >
        {action.label} <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
      </button>
    )}
  </div>
);

/**
 * Sidehode for en hovedvisning: tittel, undertekst og handlinger.
 * Skjules på mobil som standard – der viser topplinja sidetittelen.
 */
export const ViewHeader: React.FC<{
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Innhold under tittelraden, f.eks. faner. */
  children?: React.ReactNode;
  showOnMobile?: boolean;
  className?: string;
}> = ({ eyebrow, title, subtitle, actions, children, showOnMobile, className }) => (
  <header
    className={cn(
      'flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-rule bg-canvas',
      !showOnMobile && 'hidden sm:block',
      className,
    )}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">{eyebrow}</div>
        )}
        <h1 className="text-h1 text-ink truncate">{title}</h1>
        {subtitle && <p className="text-caption text-ink-subtle mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
    {children && <div className="mt-3">{children}</div>}
  </header>
);

/** Nøkkeltall: stort tall, kort etikett. */
export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: string;
  className?: string;
}> = ({ label, value, hint, icon, tone = 'bg-canvas-raised text-ink-muted', className }) => (
  <div className={cn('rounded-panel bg-canvas-raised/60 border border-rule p-3 sm:p-4 min-w-0', className)}>
    <div className="flex items-center gap-2">
      {icon && <IconTile icon={icon} tone={tone} size="sm" />}
      <span className="text-meta text-ink-subtle truncate">{label}</span>
    </div>
    <div className="mt-2 font-mono text-[1.625rem] leading-none text-ink tabular-nums">{value}</div>
    {hint && <div className="mt-1.5 text-meta text-ink-subtle truncate">{hint}</div>}
  </div>
);

/** Tomtilstand inne i et kort. */
export const TileEmpty: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="rounded-panel border border-dashed border-rule-strong px-4 py-5 text-center">
    <p className="text-body text-ink-subtle">{children}</p>
    {action && <div className="mt-3 flex justify-center">{action}</div>}
  </div>
);

/** Appens merke: en liten bane i signalfargen. Eget, ikke lånt. */
export const BrandMark: React.FC<{ size?: number; className?: string }> = ({ size = 34, className }) => (
  <span
    aria-hidden
    className={cn('flex-shrink-0 inline-flex items-center justify-center rounded-panel bg-signal text-signal-fg', className)}
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M3 9.5h2.5v5H3M21 9.5h-2.5v5H21" />
    </svg>
  </span>
);
