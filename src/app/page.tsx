'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from '@/components/ui/Sidebar';
import { TacticBoard } from '@/components/board/TacticBoard';
import { PlayerEditor } from '@/components/ui/PlayerEditor';
import { CalendarView } from '@/components/calendar/CalendarView';
import { PlayerPortal } from '@/components/player-portal/PlayerPortal';
import { RefereeView } from '@/components/player-portal/RefereeView';
import { LoginGate } from '@/components/ui/LoginGate';
import { SmartCoach } from '@/components/ui/SmartCoach';
import { MatchReportModal } from '@/components/ui/MatchReport';
import { AppView } from '@/types';

// ─── Live kampklokke i topbar ─────────────────────────────────
const LiveClock: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { matchTimer } = useAppStore();
  const [display, setDisplay] = useState(matchTimer.elapsed);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const { matchTimer: mt } = useAppStore.getState();
      setDisplay(
        mt.running && mt.startedAt
          ? mt.elapsed + Math.floor((Date.now() - mt.startedAt) / 1000)
          : mt.elapsed
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border
        text-[11px] font-mono font-bold transition-all
        ${matchTimer.running
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : display > 0
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
            : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}
      title="Åpne Smart Coach">
      {matchTimer.running ? '⏱' : '⏸'} {fmt(display)}
    </button>
  );
};

// ─── Hovedside ────────────────────────────────────────────────
export default function Home() {
  const { currentView, setView, currentUser, activePhaseIdx } = useAppStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isMounted, setIsMounted]               = useState(false);
  const [showSmartCoach, setShowSmartCoach]     = useState(false);
  const [showMatchReport, setShowMatchReport]   = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;
  if (!currentUser) return <LoginGate />;

  const isCoach = currentUser.role === 'coach';

  // 'referee' er tilgjengelig for alle roller (ingen coachOnly)
  const NAV_ITEMS: { view: AppView; label: string; emoji: string; coachOnly?: boolean }[] = [
    { view: 'board',    label: 'Taktikkbrett',  emoji: '📋', coachOnly: true },
    { view: 'calendar', label: 'Kalender',       emoji: '📅', coachOnly: true },
    { view: 'players',  label: 'Spillerportal',  emoji: '👤' },
    { view: 'referee',  label: 'Dommer',         emoji: '🏁' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#060c18]">

      {/* ── TOPBAR ── */}
      <header className="flex-shrink-0 flex items-center gap-1.5 px-3
        bg-[#08101e] border-b border-[#1a2d46] h-11 min-w-0">

        {/* Logo */}
        <div className="mr-3 text-[13px] font-black tracking-tight whitespace-nowrap"
          style={{
            background: 'linear-gradient(90deg,#38bdf8,#34d399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
          ⚽ TAKTIKKBOARD
        </div>

        {/* Navigasjon */}
        <nav className="flex gap-0.5 overflow-x-auto">
          {NAV_ITEMS
            .filter(n => !n.coachOnly || isCoach)
            .map(n => (
              <button key={n.view} onClick={() => setView(n.view)}
                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold
                  transition-all whitespace-nowrap
                  ${currentView === n.view
                    ? 'bg-sky-500/15 text-sky-400'
                    : 'text-[#4a6080] hover:text-slate-300 hover:bg-white/5'}`}>
                {n.emoji} {n.label}
              </button>
            ))}
        </nav>

        <div className="flex-1" />

        {/* Høyre-verktøy — kun trener på brett-view */}
        {isCoach && currentView === 'board' && (
          <div className="flex items-center gap-1.5">
            <LiveClock onClick={() => setShowSmartCoach(true)} />
            <button onClick={() => setShowSmartCoach(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border
                border-[#1e3050] text-[#4a6080] hover:text-slate-300
                hover:bg-white/5 transition whitespace-nowrap">
              ⚡ Smart Coach
            </button>
            <button onClick={() => setShowMatchReport(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border
                border-[#1e3050] text-[#4a6080] hover:text-amber-400
                hover:border-amber-500/40 transition whitespace-nowrap">
              📊 Rapport
            </button>
          </div>
        )}

        {/* Brukerinfo */}
        <div className="flex items-center gap-2 text-[11px] text-[#4a6080] ml-2">
          <span className="hidden sm:inline">
            {currentUser.role === 'coach' ? '🏋️ Trener' : `👤 ${currentUser.name}`}
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* ── INNHOLD ── */}
      <main className="flex flex-1 overflow-hidden">

        {/* Taktikkbrett (trener) */}
        {currentView === 'board' && (
          <>
            <Sidebar
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={setSelectedPlayerId}
            />
            <div className="flex-1 overflow-hidden">
              <TacticBoard
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={setSelectedPlayerId}
              />
            </div>
          </>
        )}

        {/* Kalender (trener) */}
        {currentView === 'calendar' && isCoach && (
          <div className="flex-1 overflow-hidden">
            <CalendarView />
          </div>
        )}

        {/* Spillerportal */}
        {currentView === 'players' && (
          <div className="flex-1 overflow-hidden">
            <PlayerPortal />
          </div>
        )}

        {/* Dommer-visning — tilgjengelig for alle */}
        {currentView === 'referee' && (
          <div className="flex-1 overflow-hidden">
            <RefereeView />
          </div>
        )}
      </main>

      {/* ── MODALER ── */}

      {selectedPlayerId && currentView === 'board' && (
        <PlayerEditor
          playerId={selectedPlayerId}
          phaseIdx={activePhaseIdx}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {showSmartCoach && (
        <SmartCoach onClose={() => setShowSmartCoach(false)} />
      )}

      {showMatchReport && (
        <MatchReportModal onClose={() => setShowMatchReport(false)} />
      )}
    </div>
  );
}

const LogoutButton: React.FC = () => {
  const { logout } = useAppStore();
  return (
    <button onClick={logout}
      className="px-2 py-0.5 rounded text-[10px] border border-[#1e3050]
        text-[#3a5070] hover:text-red-400 hover:border-red-500/40 transition">
      Logg ut
    </button>
  );
};
