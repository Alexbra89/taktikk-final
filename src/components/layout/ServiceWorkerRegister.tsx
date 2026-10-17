'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { watchAppUpdate } from '@/lib/appUpdate';

// ═══════════════════════════════════════════════════════════════
//  SERVICE WORKER – gjør at appen virker uten nett.
//  next-pwa legger registreringen i main.js, men App Router laster
//  bare main-app.js. Her kjøres next-pwa sitt eget skript fra appen:
//  det registrerer /sw.js og legger startsiden i cachen.
//  Innstillingene (sw, scope, reloadOnOnline) står i next.config.mjs.
// ═══════════════════════════════════════════════════════════════

export function ServiceWorkerRegister() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const currentView = useAppStore(state => state.currentView);
  const watcher = useRef<ReturnType<typeof watchAppUpdate> | null>(null);
  useEffect(() => {
    // PWA er av i utvikling (next.config.mjs). Da mangler konstantene skriptet bruker.
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    watcher.current = watchAppUpdate(navigator.serviceWorker, () => setReady(true));
    // Feiler registreringen, virker appen som før, bare ikke uten nett.
    import('next-pwa/register').catch(() => {});
    return () => { watcher.current?.dispose(); watcher.current = null; };
  }, []);
  useEffect(() => {
    setDismissed(false);
    watcher.current?.check();
  }, [currentView]);
  if (!ready || dismissed) return null;
  return (
    <div role="status" aria-label="Appoppdatering"
      className="fixed left-3 right-3 sm:left-auto sm:right-4 z-[160] flex items-center gap-3 rounded-lg border border-rule bg-canvas-panel px-3 py-2 text-caption text-ink shadow-tile"
      style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
      <span>Ny versjon er klar</span>
      <button type="button" onClick={() => watcher.current?.update()}
        className="min-h-[44px] px-2 font-bold text-ink underline underline-offset-4">Oppdater</button>
      <button type="button" aria-label="Lukk oppdateringsmelding" onClick={() => setDismissed(true)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-muted">
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
