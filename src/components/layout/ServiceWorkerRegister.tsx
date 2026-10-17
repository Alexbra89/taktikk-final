'use client';
import { useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
//  SERVICE WORKER – gjør at appen virker uten nett.
//  next-pwa legger registreringen i main.js, men App Router laster
//  bare main-app.js. Her kjøres next-pwa sitt eget skript fra appen:
//  det registrerer /sw.js og legger startsiden i cachen.
//  Innstillingene (sw, scope, reloadOnOnline) står i next.config.mjs.
// ═══════════════════════════════════════════════════════════════

export function ServiceWorkerRegister() {
  useEffect(() => {
    // PWA er av i utvikling (next.config.mjs). Da mangler konstantene skriptet bruker.
    if (process.env.NODE_ENV !== 'production') return;
    // Feiler registreringen, virker appen som før, bare ikke uten nett.
    import('next-pwa/register').catch(() => {});
  }, []);
  return null;
}
