import withPWA from 'next-pwa';
import defaultCache from 'next-pwa/cache.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // 3D-modellene (ca. 9 MB) forhåndslastes ikke for alle; de caches først når 3D åpnes.
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