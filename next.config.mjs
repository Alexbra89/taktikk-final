import { readFileSync } from 'node:fs';
import withPWA from 'next-pwa';
import defaultCache from 'next-pwa/cache.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Appversjonen står i den lokale feilrapporten (lib/errorLog.ts).
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Appen bruker ikke next/image. Da trengs ikke bildeoptimaliseringen
  // (/_next/image), og den svarer 404 i stedet for å stå åpen.
  images: {
    unoptimized: true,
  },
  // ESLint er en egen sjekk (npm run lint), ikke en del av bygget: en lint-regel
  // skal ikke kunne stoppe en deploy. Typene sjekkes fortsatt av bygget.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA({
  dest: 'public',
  // Registreringen kjøres av ServiceWorkerRegister i layout.tsx (App Router laster ikke main.js).
  register: true,
  // En ny worker venter til brukeren selv velger «Oppdater».
  skipWaiting: false,
  // Ikke last siden på nytt når nettet kommer tilbake: det ville avbrutt
  // tegning eller video-eksport som er i gang. Standard i next-pwa er true.
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development',
  // 3D-modellene (ca. 2,3 MB) forhåndslastes ikke for alle; de caches først når 3D åpnes.
  // Cachen under er CacheFirst: en endret modell må få nytt filnavn (spiller-v2.glb osv.).
  publicExcludes: ['!noprecache/**/*', '!models/**/*'],
  // Next 15 lager dette interne manifestet, men serverer det ikke som en URL.
  // En 404 i forhåndslageret avbryter hele installasjonen av service workeren.
  buildExcludes: [/app-build-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /\/models\/[^/?]+\.(?:glb|hdr)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: '3d-models',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dager
        },
      },
    },
    // Resten er next-pwa sitt standardoppsett, uendret.
    ...defaultCache,
  ],
})(nextConfig);
