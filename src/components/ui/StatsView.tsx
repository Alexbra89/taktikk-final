'use client';
import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// ═══════════════════════════════════════════════════════════════
//  STATISTIKK — Fremmøte, treninger, spilletid
// ═══════════════════════════════════════════════════════════════

export const StatsView: React.FC = () => {
  const { currentUser, events, playerAccounts, phases, activePhaseIdx, homeTeamName } = useAppStore();
  const isCoach = currentUser?.role === 'coach';
  const myPlayerId = currentUser?.playerId;

  const [tab, setTab] = useState<'overview' | 'attendance' | 'playtime'>('overview');

  // All training events
  const trainings = useMemo(() =>
    events.filter(e => e.type === 'training').sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  );
  const matches = useMemo(() =>
    events.filter(e => e.type === 'match').sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  );

  const phase = phases[activePhaseIdx] ?? phases[0];
  const homePlayers = (phase?.players ?? []).filter((p: any) => p.team === 'home');

  // Build attendance data from trainingNotes targetPlayerIds
  const attendanceByPlayer = useMemo(() => {
    const map: Record<string, { attended: number; total: number; name: string }> = {};

    // Init all players
    homePlayers.forEach((p: any) => {
      const acc = playerAccounts.find((a: any) => a.playerId === p.id);
      map[p.id] = { attended: 0, total: trainings.length, name: acc?.name || p.name || `#${p.num}` };
    });

    // Count attendance from training notes
    trainings.forEach(ev => {
      ev.trainingNotes.forEach(tn => {
        tn.targetPlayerIds?.forEach(pid => {
          if (map[pid]) map[pid].attended++;
        });
      });
    });

    return map;
  }, [homePlayers, trainings, playerAccounts]);

  // For player: only show own stats
  const myStats = myPlayerId ? attendanceByPlayer[myPlayerId] : null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrainings = trainings.filter(e => e.date >= today).length;
  const completedTrainings = trainings.filter(e => e.date < today).length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060c18]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <h2 className="text-sm font-black text-slate-100">
          📊 Statistikk — {homeTeamName || 'Laget'}
        </h2>
        {!isCoach && myStats && (
          <p className="text-[10px] text-[#4a6080] mt-0.5">
            Du ser kun din egen statistikk
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-[#1e3050] bg-[#0c1525]">
        {([
          ['overview', '📋 Oversikt'],
          ['attendance', '✅ Fremmøte'],
          ['playtime', '⏱ Spilletid'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-3 text-[11px] font-semibold transition-all min-h-[44px]
              ${tab === id ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── OVERSIKT ── */}
        {tab === 'overview' && (
          <div className="space-y-4 max-w-2xl mx-auto">

            {/* Nøkkeltall */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Treninger totalt', value: trainings.length, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                { label: 'Gjennomført', value: completedTrainings, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { label: 'Kommende', value: upcomingTrainings, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { label: 'Kamper', value: matches.length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-[#4a6080] mt-1 font-semibold uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Siste treninger */}
            <div>
              <h3 className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
                Siste treninger
              </h3>
              {trainings.slice(0, 5).map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] mb-2">
                  <div className={`w-2 h-10 rounded-full flex-shrink-0 ${ev.date < today ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-slate-200 truncate">{ev.title}</div>
                    <div className="text-[10px] text-[#4a6080]">
                      {new Date(ev.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {ev.location && ` · 📍 ${ev.location}`}
                    </div>
                    {ev.trainingNotes.length > 0 && (
                      <div className="text-[10px] text-emerald-400/70 mt-0.5">
                        📋 {ev.trainingNotes[0].title}
                      </div>
                    )}
                  </div>
                  <div className={`text-[9px] font-bold px-2 py-1 rounded-full
                    ${ev.date < today ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {ev.date < today ? 'Ferdig' : 'Kommende'}
                  </div>
                </div>
              ))}
              {trainings.length === 0 && (
                <p className="text-[12px] text-[#4a6080] italic text-center py-8">
                  Ingen treninger registrert ennå.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── FREMMØTE ── */}
        {tab === 'attendance' && (
          <div className="max-w-2xl mx-auto">
            {isCoach ? (
              <>
                <p className="text-[10px] text-[#4a6080] mb-4">
                  Fremmøte beregnes fra treningsnotater. Merk spillere i notater for å registrere oppmøte.
                </p>
                <div className="space-y-2">
                  {Object.entries(attendanceByPlayer)
                    .sort(([,a], [,b]) => b.attended - a.attended)
                    .map(([pid, data]) => {
                      const pct = data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0;
                      const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <div key={pid} className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-[12.5px] font-bold text-slate-200 flex-1">{data.name}</div>
                            <div className="text-[11px] font-bold" style={{ color }}>
                              {data.attended}/{data.total} ({pct}%)
                            </div>
                          </div>
                          <div className="h-2 bg-[#1e3050] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
                {Object.keys(attendanceByPlayer).length === 0 && (
                  <p className="text-[12px] text-[#4a6080] italic text-center py-8">
                    Ingen spillere registrert ennå.
                  </p>
                )}
              </>
            ) : myStats ? (
              // Spiller ser kun sitt eget
              <div>
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 mb-4">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">Ditt fremmøte</div>
                  <div className="text-3xl font-black text-slate-100 mb-1">
                    {myStats.attended}/{myStats.total}
                  </div>
                  <div className="text-[12px] text-[#4a6080]">
                    {myStats.total > 0
                      ? `${Math.round((myStats.attended / myStats.total) * 100)}% oppmøte`
                      : 'Ingen treninger registrert'}
                  </div>
                  {myStats.total > 0 && (
                    <div className="h-3 bg-[#1e3050] rounded-full overflow-hidden mt-3">
                      <div className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${Math.round((myStats.attended / myStats.total) * 100)}%` }} />
                    </div>
                  )}
                </div>
                {myStats.total - myStats.attended > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <div className="text-[11px] text-amber-400">
                      ⚠️ Du har {myStats.total - myStats.attended} fravær registrert
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-[#4a6080] italic text-center py-8">
                Ingen statistikk tilgjengelig for din konto.
              </p>
            )}
          </div>
        )}

        {/* ── SPILLETID ── */}
        {tab === 'playtime' && (
          <div className="max-w-2xl mx-auto">
            {isCoach ? (
              <div className="space-y-2">
                <p className="text-[10px] text-[#4a6080] mb-4">
                  Spilletid registreres via Smart Coach under kamp.
                </p>
                {[...homePlayers]
                  .sort((a: any, b: any) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0))
                  .map((p: any) => {
                    const min = p.minutesPlayed ?? 0;
                    const acc = playerAccounts.find((a: any) => a.playerId === p.id);
                    const name = acc?.name || p.name || `#${p.num}`;
                    const color = min > 60 ? '#22c55e' : min > 30 ? '#f59e0b' : '#64748b';
                    const maxMin = Math.max(...homePlayers.map((pl: any) => pl.minutesPlayed ?? 0), 1);
                    return (
                      <div key={p.id} className="flex items-center gap-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                          style={{ background: color }}>
                          {p.num}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-slate-200 truncate">{name}</div>
                          <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden mt-1.5">
                            <div className="h-full rounded-full"
                              style={{ width: `${(min / maxMin) * 100}%`, background: color }} />
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-right w-14 flex-shrink-0" style={{ color }}>
                          {min} min
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              // Spiller ser kun sitt eget
              <div>
                {(() => {
                  const myP = homePlayers.find((p: any) => p.id === myPlayerId);
                  const min = myP?.minutesPlayed ?? 0;
                  return (
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5">
                      <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">
                        Din spilletid
                      </div>
                      <div className="text-3xl font-black text-slate-100">{min} min</div>
                      {min === 0 && (
                        <p className="text-[11px] text-[#4a6080] mt-2">
                          Ingen spilletid registrert ennå.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
