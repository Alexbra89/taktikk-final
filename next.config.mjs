import { readFileSync } from 'node:fs';

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
  // Workeren må alltid kunne oppdage et nytt bygg. Appen velger selv når
  // oppdateringen tas i bruk; ikke la HTTP-cachen holde på gammel worker.
  async headers() {
    return [{
      // Sikkerhetshoder på alle svar. Ingen streng innholdspolicy (CSP) for
      // skript: 3D, service worker og innebygde skript i layout.tsx trenger dem.
      source: '/:path*',
      headers: [
        // Appen skal ikke kunne bygges inn i andres sider (clickjacking).
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Appen bruker verken kamera, mikrofon, posisjon eller betaling.
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
      ],
    }, {
      source: '/sw.js',
      headers: [
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Cache-Control', value: 'no-store, max-age=0' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    }];
  },
};

export default nextConfig;
