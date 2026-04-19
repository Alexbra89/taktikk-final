import type { Metadata, Viewport } from 'next';
import './globals.css';
import NotificationProvider from '@/components/NotificationProvider';

// 1. Metadata - themeColor er FJERNET herfra (flyttet til viewport)
export const metadata: Metadata = {
  title: {
    default: 'Taktikkboard',
    template: '%s | Taktikkboard',
  },
  description: 'Profesjonell lagstrategi for fotball og håndball – Football Manager-stil',
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
  themeColor: '#060c18',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" suppressHydrationWarning>
      <head>
        {/* PWA / Mobile optimalisering - beholdes for eldre nettlesere */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-icon" content="/icon-192.png" />
      </head>

      <body
        className="
          min-h-screen
          bg-[#060c18]
          text-slate-200
          antialiased
          overscroll-none
          selection:bg-sky-500/30
        "
      >
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}