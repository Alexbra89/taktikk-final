import type { Metadata, Viewport } from 'next';
import './globals.css';
import NotificationProvider from '@/components/NotificationProvider';

export const metadata: Metadata = {
  title: {
    default: 'Taktikkboard',
    template: '%s | Taktikkboard',
  },
  description: 'Profesjonell lagstrategi for fotball og håndball',
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
        {/* PWA / Mobile optimalisering */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />

        {/* Fiks viewport på iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />

        {/* Theme */}
        <meta name="theme-color" content="#060c18" />
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