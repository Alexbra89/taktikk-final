'use client';
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Home, RotateCcw, Square } from 'lucide-react';
import { cn } from '@/lib/cn';
import { logError } from '@/lib/errorLog';
import { isChunkLoadError, reloadApp, UPDATE_ERROR_TITLE } from '@/lib/appUpdate';
import { PRIMARY_BTN, SECONDARY_BTN } from '@/lib/formClasses';

// ═══════════════════════════════════════════════════════════════
//  FEILSKJERM – én del av appen kan feile uten at resten blir hvit.
//  Feilen lagres i den lokale feilloggen (se lib/errorLog.ts).
//  Innholdet inni pakkes bare inn; det endres ikke.
// ═══════════════════════════════════════════════════════════════

export const ERROR_TITLE = 'Noe gikk galt i denne delen';

/** Full omlasting til startsiden: nullstiller også det som feilet. Dataene ligger i lagringen. */
export function goHome() {
  // Full dokumentnavigering må også nullstille en feil i appens rot.
  window.location.assign(new URL('/', window.location.href).href);
}

/** Kan nettleseren lage en WebGL 2-flate? Three krever WebGL 2; uten den kan 3D ikke vises. */
export function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    if (!gl) return false;
    // Gi flaten tilbake med én gang; 3D lager sin egen.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

interface FallbackProps {
  error?: unknown;
  onRetry: () => void;
  onHome?: () => void;
  /** 3D: foreslå 2D, som virker uten WebGL. */
  onSwitchTo2D?: () => void;
  /** Over resten av appen (dialoger og fullskjerm) i stedet for i flaten. */
  overlay?: boolean;
}

export const ErrorFallback: React.FC<FallbackProps> = ({ error, onRetry, onHome = goHome, onSwitchTo2D, overlay }) => (
  <div
    role="alert"
    className={cn(
      'flex items-center justify-center p-4 sm:p-6 bg-canvas text-ink',
      overlay ? 'fixed inset-0 z-[150] bg-black/70' : 'flex-1 min-h-0 h-full w-full overflow-y-auto',
    )}
  >
    <div className="w-full max-w-md rounded-tile bg-canvas-panel border border-rule shadow-tile p-5">
      <div className="flex gap-3">
        <AlertTriangle size={20} strokeWidth={1.75} aria-hidden className="flex-shrink-0 mt-0.5 text-warn-400" />
        <div className="min-w-0">
          <h2 className="text-h4 text-ink">{isChunkLoadError(error) ? UPDATE_ERROR_TITLE : ERROR_TITLE}</h2>
          {isChunkLoadError(error) ? (
            <p className="mt-1.5 text-body text-ink-muted leading-relaxed">
              En del av appen kunne ikke lastes. Last inn på nytt når du er klar. Er du uten nett, prøv igjen når nettet er tilbake.
            </p>
          ) : onSwitchTo2D ? (
            <p className="mt-1.5 text-body text-ink-muted leading-relaxed">
              3D-visningen kan ikke vises her. Nettleseren eller enheten støtter kanskje ikke 3D (WebGL),
              eller grafikkortet er opptatt. Bytt til 2D for å jobbe videre med taktikken.
            </p>
          ) : (
            <p className="mt-1.5 text-body text-ink-muted leading-relaxed">
              Resten av appen virker som før. Prøv igjen, eller gå til forsiden.
            </p>
          )}
          <p className="mt-1.5 text-meta text-ink-subtle">
            Feilen er notert i feilrapporten under Innstillinger.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onSwitchTo2D && (
          <button type="button" onClick={onSwitchTo2D} className={cn('flex-1', PRIMARY_BTN)}>
            <Square size={15} strokeWidth={1.75} aria-hidden /> Bytt til 2D
          </button>
        )}
        <button type="button" onClick={isChunkLoadError(error) ? reloadApp : onRetry} className={cn('flex-1', onSwitchTo2D ? SECONDARY_BTN : PRIMARY_BTN)}>
          <RotateCcw size={15} strokeWidth={1.75} aria-hidden /> {isChunkLoadError(error) ? 'Last inn på nytt' : 'Prøv igjen'}
        </button>
        <button type="button" onClick={onHome} className={cn('flex-1', SECONDARY_BTN)}>
          <Home size={15} strokeWidth={1.75} aria-hidden /> Gå til forsiden
        </button>
      </div>
    </div>
  </div>
);

interface BoundaryProps extends Omit<FallbackProps, 'onRetry'> {
  /** Nøkkel i AREA_LABELS: hvilken del feilen skjedde i. */
  area: string;
  children: React.ReactNode;
}

export class SectionErrorBoundary extends React.Component<BoundaryProps, { failed: boolean; error?: unknown }> {
  state: { failed: boolean; error?: unknown } = { failed: false };

  static getDerivedStateFromError(error?: unknown) {
    return { failed: true, error };
  }

  componentDidCatch(error: unknown) {
    logError(error, this.props.area);
  }

  private retry = () => this.setState({ failed: false });

  // Forsiden kan være den som feilet; da skal den tegnes på nytt.
  private home = () => { this.setState({ failed: false }); (this.props.onHome ?? goHome)(); };

  private switchTo2D = () => { this.setState({ failed: false }); this.props.onSwitchTo2D?.(); };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ErrorFallback
        error={this.state.error}
        onRetry={this.retry}
        onHome={this.home}
        onSwitchTo2D={this.props.onSwitchTo2D ? this.switchTo2D : undefined}
        overlay={this.props.overlay}
      />
    );
  }
}

/**
 * Rundt 3D-visningen. Uten WebGL 2 monteres den ikke i det hele tatt, og
 * brukeren får tilbud om 2D. Feiler den underveis, gjelder det samme.
 */
export const Board3DBoundary: React.FC<{ onSwitchTo2D: () => void; children: React.ReactNode }> = ({ onSwitchTo2D, children }) => {
  const [supported, setSupported] = useState(webglSupported);
  useEffect(() => {
    if (!supported) logError(new Error('WebGL 2 støttes ikke eller er slått av i nettleseren'), '3d');
  }, [supported]);
  if (!supported) return <ErrorFallback onRetry={() => setSupported(webglSupported())} onSwitchTo2D={onSwitchTo2D} />;
  return <SectionErrorBoundary area="3d" onSwitchTo2D={onSwitchTo2D}>{children}</SectionErrorBoundary>;
};
