'use client';
import { useEffect, useState } from 'react';
import { ACCESS_CODE_EVENT, readCode, writeCode } from '@/lib/ai/accessCode';

/** Samme kode i trenerpanelet, øvelsesdialogen og Innstillinger. Aldri i app-storen. */
export function useAiAccessCode() {
  const [code, setCode] = useState('');
  useEffect(() => {
    const update = () => {
      // En annen fane kan ha glemt eller byttet koden.
      setCode(readCode());
    };
    const onStorage = () => { delete window.__taktikkAiCode; update(); };
    update();
    window.addEventListener(ACCESS_CODE_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ACCESS_CODE_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return [code, writeCode] as const;
}
