'use client';
import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// Sjekker (reaktivt, fra app-oppstart og videre) om noen spillere har
// en forventet returdato som har passert uten at de er markert friske,
// og tilbyr trener å bekrefte at spilleren er tilbake.
export const InjuryReturnBanner: React.FC = () => {
  const { phases, playerAccounts, currentUser, markPlayerHealed, addEvent } = useAppStore();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const isCoach = currentUser?.role === 'coach';
  const todayStr = new Date().toISOString().slice(0, 10);

  const overdue = useMemo(() => {
    if (!isCoach) return [];
    const seen = new Set<string>();
    const result: { playerId: string; name: string; expectedReturn: string }[] = [];
    for (const phase of phases) {
      for (const p of phase.players) {
        if (seen.has(p.id) || !p.injury?.expectedReturn) continue;
        if (p.injury.expectedReturn >= todayStr) continue;
        seen.add(p.id);
        const acc = (playerAccounts as any[]).find(a => a.playerId === p.id);
        result.push({
          playerId: p.id,
          name: acc?.name || p.name || `#${p.num}`,
          expectedReturn: p.injury.expectedReturn,
        });
      }
    }
    return result;
  }, [phases, playerAccounts, isCoach, todayStr]);

  const visible = overdue.filter(o => !dismissed.includes(o.playerId));
  if (visible.length === 0) return null;

  const confirmHealthy = (playerId: string, name: string) => {
    markPlayerHealed(playerId);
    addEvent({
      type: 'return',
      title: `Frisk igjen: ${name}`,
      date: todayStr,
      teamNote: '',
      trainingNotes: [],
      matchNotes: [],
    });
    setDismissed(d => [...d, playerId]);
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-[200] flex flex-col items-center gap-2 px-3 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      {visible.map(o => (
        <div
          key={o.playerId}
          className="pointer-events-auto w-full max-w-xl flex items-center gap-3 bg-amber-500/15 border border-amber-500/40 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-2xl"
        >
          <span className="text-lg flex-shrink-0">🩹</span>
          <div className="flex-1 min-w-0 text-[12px] text-amber-100 leading-snug">
            Forventet retur for <b>{o.name}</b> var{' '}
            {new Date(o.expectedReturn + 'T12:00:00').toLocaleDateString('nb-NO')} – er han tilbake?
          </div>
          <button
            onClick={() => confirmHealthy(o.playerId, o.name)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/30 transition whitespace-nowrap"
          >
            ✅ Bekreft frisk
          </button>
          <button
            onClick={() => setDismissed(d => [...d, o.playerId])}
            className="flex-shrink-0 text-amber-300/60 hover:text-amber-100 text-sm px-1 min-h-[32px] min-w-[32px]"
            title="Lukk (spør igjen senere)"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
