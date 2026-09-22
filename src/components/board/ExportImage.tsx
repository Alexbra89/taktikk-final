'use client';
import React from 'react';
import { AlertTriangle, ImageDown, Info, Loader2, Video, X } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Ikonknapp med spinner og «Laster ned …» ved siden av mens bildet lages.
 * Knappen deaktiveres ikke under eksport (da ville spinneren blitt dempet);
 * useImageExport ignorerer nye trykk til den forrige er ferdig.
 */
export const ExportImageButton: React.FC<{
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  className: string;
}> = ({ busy, disabled, onClick, className }) => (
  <>
    <button onClick={onClick} disabled={disabled}
      aria-label={busy ? 'Laster ned bilde' : 'Eksporter bilde'}
      aria-busy={busy}
      title="Eksporter fasen som bilde (PNG)"
      className={className}>
      {busy
        ? <Loader2 size={16} strokeWidth={1.75} className="animate-spin" aria-hidden />
        : <ImageDown size={16} strokeWidth={1.75} />}
    </button>
    {busy && (
      <span aria-hidden className="flex-shrink-0 pr-1 text-caption text-ink-subtle whitespace-nowrap">Laster ned …</span>
    )}
  </>
);

/**
 * Samme knapp for video: spiller inn avspillingen og laster den ned.
 * Viser fremdrift i prosent mens opptaket går.
 */
export const ExportVideoButton: React.FC<{
  busy: boolean;
  progress: number;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  className: string;
}> = ({ busy, progress, disabled, onClick, title, className }) => (
  <>
    <button onClick={onClick} disabled={disabled}
      aria-label={busy ? 'Spiller inn video' : 'Eksporter video'}
      aria-busy={busy}
      title={title}
      className={className}>
      {busy
        ? <Loader2 size={16} strokeWidth={1.75} className="animate-spin" aria-hidden />
        : <Video size={16} strokeWidth={1.75} />}
    </button>
    {busy && (
      <span aria-hidden className="flex-shrink-0 pr-1 text-caption text-ink-subtle whitespace-nowrap">
        Spiller inn … {Math.round(progress * 100)} %
      </span>
    )}
  </>
);

/**
 * Beskjed der knappen er, ikke i en dialog. «info» brukes til ting som ikke
 * gikk galt, men som brukeren bør vite – f.eks. at formatet ikke virker på iPhone.
 */
export const ExportError: React.FC<{
  message: string;
  onClose: () => void;
  tone?: 'error' | 'info';
  className?: string;
}> = ({ message, onClose, tone = 'error', className }) => (
  <div role={tone === 'error' ? 'alert' : 'status'}
    className={cn('flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-canvas-sunken border-rule text-caption',
      tone === 'error' ? 'text-signal' : 'text-ink-muted', className)}>
    {tone === 'error'
      ? <AlertTriangle size={14} strokeWidth={2} aria-hidden className="flex-shrink-0" />
      : <Info size={14} strokeWidth={2} aria-hidden className="flex-shrink-0" />}
    <span className="flex-1 min-w-0">{message}</span>
    <button onClick={onClose} aria-label="Lukk feilmeldingen"
      className="tap-auto flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover">
      <X size={14} strokeWidth={2} aria-hidden />
    </button>
  </div>
);
