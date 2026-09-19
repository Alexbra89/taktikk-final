// Felles skjemaklasser i Kalk. Erstattet styled-jsx-blokkene (CalStyle) som lå
// både i kalenderen og i treningsvisningen med hver sin kopi av hardkodet hex.

export const INPUT_CLASS =
  'w-full mt-1.5 rounded-ctl px-3 min-h-[44px] bg-canvas-raised text-body text-ink ' +
  'placeholder:text-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal';

export const TEXTAREA_CLASS =
  'w-full mt-1.5 rounded-ctl px-3 py-2.5 bg-canvas-raised text-body text-ink leading-relaxed resize-y ' +
  'placeholder:text-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal';

export const LABEL_CLASS =
  'block font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle';

/** Valgknapp som ikke er en handling: ukedag, fokusområde, omgang, filter. */
export function toggleClass(active: boolean): string {
  return active
    ? 'bg-signal/10 text-signal shadow-hair-signal'
    : 'bg-canvas-raised text-ink-muted hover:text-ink shadow-hair';
}

/** Primærhandling: én per skjerm. */
export const PRIMARY_BTN =
  'min-h-[44px] px-4 rounded-ctl bg-signal text-signal-fg text-body font-bold ' +
  'hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all ' +
  'inline-flex items-center justify-center gap-1.5';

/** Sideordnet handling. */
export const SECONDARY_BTN =
  'min-h-[44px] px-4 rounded-ctl bg-canvas-raised text-ink-muted hover:text-ink text-body font-bold ' +
  'shadow-hair transition-colors inline-flex items-center justify-center gap-1.5';

/** Liten ikonknapp i lister og rader. */
export const ICON_BTN =
  'tap-auto w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-ctl ' +
  'text-ink-faint hover:text-ink hover:bg-canvas-hover transition-colors';
