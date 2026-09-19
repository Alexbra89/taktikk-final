import type { Metadata, Viewport } from 'next';
import { Barlow, Schibsted_Grotesk, Instrument_Serif, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

// Kalk-typografi. next/font selvhoster filene, så PWA-en fungerer offline.
// Schibsted Grotesk er variabel – én fil dekker alle vekter.
const sans = Schibsted_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap', variable: '--font-serif' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-mono' });

// FASE 1: Barlow på text-h1…h4/display/label. Fjernes når skjermene er over på Kalk.
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-barlow',
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
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

// 2. Viewport - themeColor er PLASSERT her (riktig for Next.js 14.2+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B0B0C',
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
      className={`${sans.variable} ${serif.variable} ${mono.variable} ${barlow.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA / Mobile optimalisering - beholdes for eldre nettlesere */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-icon" content="/icon-192.png" />
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
      </body>
    </html>
  );
}