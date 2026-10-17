import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import { ACCESS_LINK_SCRIPT } from '@/lib/ai/accessCode';
import './globals.css';

// Samme Kalk-skrifter, lagret i prosjektet: heller ikke byggingen krever nett.
// Latin-utgavene inkluderer æ, ø og å. Lisens og opphav står i fonts/.
const sans = localFont({
  src: './fonts/schibsted-grotesk-latin.woff2',
  weight: '400 900', style: 'normal', display: 'swap', variable: '--font-sans',
});
const serif = localFont({
  src: [
    { path: './fonts/instrument-serif-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/instrument-serif-italic-latin.woff2', weight: '400', style: 'italic' },
  ],
  display: 'swap', variable: '--font-serif',
});
const mono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-500-latin.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap', variable: '--font-mono',
});

// 1. Metadata - themeColor er FJERNET herfra (flyttet til viewport)
export const metadata: Metadata = {
  title: {
    default: 'Taktikkboard',
    template: '%s | Taktikkboard',
  },
  description: 'Profesjonell lagstrategi for fotball – Football Manager-stil',
  manifest: '/manifest.json',
  applicationName: 'Taktikkboard',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Taktikkboard',
  },
  icons: {
    icon: [
      { url: '/icon.svg?v=pitch-2', type: 'image/svg+xml' },
      { url: '/favicon-pitch-v2.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
    ],
    apple: { url: '/apple-touch-icon-pitch-v2.png', sizes: '180x180' },
  },
};

// 2. Viewport - themeColor er PLASSERT her (riktig for Next.js 14.2+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0A0D13',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="no"
      data-theme="dark"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCESS_LINK_SCRIPT }} />
        <meta name="referrer" content="no-referrer" />
        {/* PWA / Mobile optimalisering - beholdes for eldre nettlesere */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        {/* Kalk-tema settes før første maling, så dagslys ikke blinker mørkt. Nøkkel: useTheme.ts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('taktikk:theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}`,
          }}
        />
      </head>

      <body
        className="
          min-h-screen
          bg-canvas
          text-ink
          font-sans
          antialiased
          overscroll-none
          selection:bg-signal/25
        "
      >
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
