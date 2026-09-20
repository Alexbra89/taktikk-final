'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

/* ────────────────────────────────────────────────────────────
   Modal – ett flytende lag, brukt til dialoger.

   På mobil (<640px) glir den opp fra bunnen som en bunn-sheet:
   nærmere tommelen, og kjent mønster fra native apper.
   På desktop er den sentrert.

   Håndterer Escape, klikk utenfor, scroll-lås og fokus tilbake
   til elementet som åpnet den.
   ──────────────────────────────────────────────────────────── */

export interface ModalProps {
  open?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Innhold nederst, f.eks. Lagre/Avbryt. Ligger fast under scroll-området. */
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Slå av bunn-sheet på mobil (for små bekreftelsesdialoger). */
  centerOnMobile?: boolean;
  children: React.ReactNode;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export const Modal: React.FC<ModalProps> = ({
  open = true,
  onClose,
  title,
  subtitle,
  footer,
  size = 'md',
  centerOnMobile = false,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => setMounted(true), []);

  // Escape lukker, og fokus føres tilbake dit brukeren kom fra.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panelRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  const onBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      // Lag som ligger over alt annet. Paneler under kan spørre etter
      // [data-modal-layer] for å la Escape gjelde den øverste dialogen.
      data-modal-layer
      className={cn(
        'fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fade-in',
        'flex justify-center p-0 sm:p-4',
        centerOnMobile ? 'items-center p-4' : 'items-end sm:items-center',
      )}
      onClick={onBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'w-full flex flex-col outline-none',
          'bg-canvas-panel border border-rule shadow-pop',
          SIZES[size],
          centerOnMobile
            ? 'rounded-panel max-h-[85vh] animate-pop'
            : 'rounded-t-panel sm:rounded-panel max-h-[92vh] sm:max-h-[85vh] animate-sheet-up sm:animate-pop',
        )}
      >
        {/* Draghåndtak – visuell bekreftelse på at dette er en sheet */}
        {!centerOnMobile && (
          <div aria-hidden className="sm:hidden flex justify-center pt-2.5 pb-1">
            <span className="h-1 w-9 rounded-full bg-rule-strong" />
          </div>
        )}

        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-rule flex-shrink-0">
            <div className="min-w-0">
              {title && <h2 className="text-h3 text-ink">{title}</h2>}
              {subtitle && <div className="mt-1">{subtitle}</div>}
            </div>
            <IconButton aria-label="Lukk" onClick={onClose} size="sm" className="mt-0.5">✕</IconButton>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex-shrink-0 border-t border-rule px-5 py-3 sheet-safe sm:pb-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
