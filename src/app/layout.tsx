import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taktikkboard',
  description: 'Profesjonell lagstrategi for fotball, håndball og innebandy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
