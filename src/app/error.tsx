'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/layout/ErrorBoundary';
import { logError } from '@/lib/errorLog';

// Siste skanse for appskallet (sidefelt, menyer): feil som ingen av
// visningenes egne feilskjermer fanger. Erstatter Next sin engelske standardside.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { logError(error, 'app'); }, [error]);
  return (
    <div className="flex h-[100dvh] bg-canvas text-ink">
      <ErrorFallback onRetry={reset} />
    </div>
  );
}
