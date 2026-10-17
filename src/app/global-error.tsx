'use client';

import { useEffect, type CSSProperties } from 'react';
import { logError } from '@/lib/errorLog';

// Feil i selve rotoppsettet (layout.tsx). Da erstatter denne hele siden,
// og appens stilark er ikke sikkert lastet – derfor egne, enkle stiler.
// Next viser den bare i produksjonsbygget; under utvikling kommer feiloverlegget.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { logError(error, 'global'); }, [error]);

  const button: CSSProperties = {
    minHeight: 44, padding: '0 16px', borderRadius: 8, border: '1px solid #2A3140',
    font: 'inherit', fontWeight: 700, cursor: 'pointer', flex: 1,
  };
  return (
    <html lang="no">
      <body style={{
        margin: 0, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: '#0A0D13', color: '#E8ECF2', fontFamily: 'system-ui, sans-serif',
      }}>
        <div role="alert" style={{ maxWidth: 420, width: '100%', padding: 20, borderRadius: 12, background: '#121722', border: '1px solid #2A3140' }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Noe gikk galt i denne delen</h1>
          <p style={{ margin: '8px 0 0', lineHeight: 1.5, color: '#A9B2C1' }}>
            Appen kunne ikke vises. Dataene dine ligger fortsatt lagret på enheten. Prøv igjen, eller gå til forsiden.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#7D8696' }}>
            Feilen er notert i feilrapporten under Innstillinger.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" onClick={reset} style={{ ...button, background: '#E8ECF2', color: '#0A0D13' }}>Prøv igjen</button>
            <button type="button" onClick={() => window.location.assign('/')} style={{ ...button, background: 'transparent', color: '#E8ECF2' }}>Gå til forsiden</button>
          </div>
        </div>
      </body>
    </html>
  );
}
