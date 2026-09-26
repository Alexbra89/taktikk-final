'use client';
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  DOKKET PANEL – et sidepanel til høyre som deler plassen med
//  visningen (ikke over den). Samme props som Modal, så en komponent
//  kan velge ramme uten å endre innholdet. Brukes av AI-treneren på
//  brede skjermer: brettet krymper, men er fortsatt i bruk ved siden av.
// ═══════════════════════════════════════════════════════════════

export interface DockPanelProps {
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  /** Godtas for å dele props med Modal; panelet har fast bredde. */
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const DockPanel: React.FC<DockPanelProps> = ({ onClose, title, subtitle, footer, children }) => {
  const ref = useRef<HTMLElement>(null);

  // Escape lukker bare når fokus står i panelet, og ikke når en dialog ligger over.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[data-modal-layer]')) return;
      if (ref.current?.contains(document.activeElement)) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside
      ref={ref}
      aria-label="AI-trener"
      className="flex-shrink-0 w-[380px] xl:w-[420px] h-full flex flex-col bg-canvas-panel border-l border-rule animate-fade-in"
    >
      {(title || subtitle) && (
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-rule">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 text-h3 text-ink">{title}</div>
            <button
              onClick={onClose}
              aria-label="Lukk AI-treneren"
              className="tap-auto w-8 h-8 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
          {subtitle && <div className="mt-2">{subtitle}</div>}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex-shrink-0 border-t border-rule px-5 py-3">{footer}</div>}
    </aside>
  );
};
