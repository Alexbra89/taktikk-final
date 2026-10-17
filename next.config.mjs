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
  swcMinify: true,
  images: {
    domains: [], 
  },
  // ESLint er en egen sjekk (npm run lint), ikke en del av bygget: en lint-regel
  // skal ikke kunne stoppe en deploy. Typene sjekkes fortsatt av bygget.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // 3D-modellene (ca. 2,3 MB) forhåndslastes ikke for alle; de caches først når 3D åpnes.
  // Cachen under er CacheFirst: en endret modell må få nytt filnavn (spiller-v2.glb osv.).
  publicExcludes: ['!noprecache/**/*', '!models/**/*'],
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