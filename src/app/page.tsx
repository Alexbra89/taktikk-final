'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from '@/components/ui/Sidebar';
import { TacticBoard } from '@/components/board/TacticBoard';
import { PlayerEditor } from '@/components/ui/PlayerEditor';
import { CalendarView } from '@/components/calendar/CalendarView';
import { PlayerPortal } from '@/components/player-portal/PlayerPortal';
import { PlayerHome, ChatPanel } from '@/components/player-portal/PlayerHome';
import { RefereeView } from '@/components/player-portal/RefereeView';
import { LoginGate } from '@/components/ui/LoginGate';
import { SmartCoach } from '@/components/ui/SmartCoach';
import { MatchReportModal } from '@/components/ui/MatchReport';
import { AppView } from '@/types';

// ─── Live kampklokke ────────────────────────────────────────
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
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px]
        font-mono font-bold transition-all
        ${matchTimer.running
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : display > 0
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
            : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
      {matchTimer.running ? '⏱' : '⏸'} {fmt(display)}
    </button>
  );
};

// ─── Dommer-innlogging modal (for trener-dashboard) ─────────
const RefereeLoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { refereePin } = useAppStore();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(refereePin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-slate-100 text-base">🏁 Dommerinnlogging</h2>
          <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl">✕</button>
        </div>
        <div className="bg-[#0f1a2a] rounded-xl p-4 border border-[#1e3050] mb-4">
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest mb-2">
            Dommer-PIN
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-amber-400 tracking-[6px]">{refereePin}</div>
            <button onClick={copy}
              className="text-[11px] text-[#4a6080] hover:text-sky-400 transition px-2 py-1
                border border-[#1e3050] rounded-lg">
              {copied ? '✓ Kopiert' : 'Kopier'}
            </button>
          </div>
          <p className="text-[10px] text-[#3a5070] mt-2">
            Del denne PIN-en med dommeren. Dommer logger inn fra startsiden → «Logg inn som trener»
            og bruker en egen URL (kommer snart), eller via nettleseren.
          </p>
        </div>

        <div className="bg-[#0f1a2a] rounded-xl p-4 border border-amber-500/20 mb-4">
          <div className="text-[9.5px] font-bold text-amber-400 uppercase tracking-widest mb-2">
            Dommer-URL
          </div>
          <p className="text-[11px] text-slate-300">
            Be dommeren gå til:<br />
            <span className="text-sky-400 font-mono">
              {typeof window !== 'undefined' ? window.location.origin : 'https://din-app.vercel.app'}
              /dommer
            </span>
          </p>
          <p className="text-[10px] text-[#3a5070] mt-1.5">
            (PIN endres under Dommer-fanen etter innlogging)
          </p>
        </div>

        <button onClick={onClose}
          className="w-full py-3 rounded-xl bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold hover:bg-sky-500/25 transition">
          Lukk
        </button>
      </div>
    </div>
  );
};

// ─── Innstillinger-modal ─────────────────────────────────────
const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    coachEmail, coachPassword, refereePin,
    homeTeamName, awayTeamName,
    setCoachEmail, setCoachPassword, setRefereePin,
    setHomeTeamName, setAwayTeamName,
    sport, setSport,
  } = useAppStore();

  const [email, setEmail]   = useState(coachEmail);
  const [pw, setPw]         = useState(coachPassword);
  const [rPin, setRPin]     = useState(refereePin);
  const [home, setHome]     = useState(homeTeamName);
  const [away, setAway]     = useState(awayTeamName);
  const [saved, setSaved]   = useState(false);

  const save = () => {
    if (email.trim()) setCoachEmail(email.trim());
    if (pw.trim())    setCoachPassword(pw.trim());
    if (rPin.length === 4) setRefereePin(rPin);
    if (home.trim()) setHomeTeamName(home.trim());
    if (away.trim()) setAwayTeamName(away.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl p-6 w-full max-w-sm
        shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-slate-100 text-base">⚙️ Innstillinger</h2>
          <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl">✕</button>
        </div>

        {/* Sport */}
        <div className="mb-4">
          <Label>Idrett</Label>
          <div className="flex gap-2 mt-1">
            {[
              { v: 'football',  e: '⚽', l: 'Fotball' },
              { v: 'handball',  e: '🤾', l: 'Håndball' },
              { v: 'floorball', e: '🏑', l: 'Innebandy' },
            ].map(({ v, e, l }) => (
              <button key={v} onClick={() => setSport(v as any)}
                className={`flex-1 py-2 rounded-xl text-[11.5px] font-bold border transition-all
                  ${sport === v
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                    : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
                {e} {l}
              </button>
            ))}
          </div>
        </div>

        {/* Lagnavn */}
        <div className="mb-4">
          <Label>Hjemmelag-navn</Label>
          <input value={home} onChange={e => setHome(e.target.value)} className="inp" />
        </div>
        <div className="mb-4">
          <Label>Bortelag-navn</Label>
          <input value={away} onChange={e => setAway(e.target.value)} className="inp" />
        </div>

        <div className="border-t border-[#1e3050] my-4" />

        {/* Trener-innlogging */}
        <div className="mb-4">
          <Label>Trener e-post</Label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="inp" />
        </div>
        <div className="mb-4">
          <Label>Trener passord</Label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="inp" />
        </div>
        <div className="mb-5">
          <Label>Dommer-PIN (4 siffer)</Label>
          <input
            value={rPin}
            onChange={e => setRPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4} className="inp tracking-widest" placeholder="0000" />
        </div>

        <button onClick={save}
          className={`w-full py-3 rounded-xl font-bold text-[13px] transition min-h-[48px]
            ${saved
              ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
              : 'bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25'}`}>
          {saved ? '✓ Lagret!' : 'Lagre innstillinger'}
        </button>

        <style>{`.inp { width:100%; background:#111c30; border:1px solid #1e3050;
          border-radius:8px; padding:10px 13px; color:#e2e8f0; font-size:13px;
          margin-top:5px; box-sizing:border-box; min-height:44px; }
          .inp:focus { outline:none; border-color:#38bdf8; }`}</style>
      </div>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest">{children}</div>
);

// ─── Navigasjon per rolle ────────────────────────────────────
type NavItem = { view: AppView; label: string; emoji: string };

const COACH_NAV: NavItem[] = [
  { view: 'board',    label: 'Brett',    emoji: '📋' },
  { view: 'calendar', label: 'Kalender', emoji: '📅' },
  { view: 'players',  label: 'Tropp',    emoji: '👤' },
  { view: 'referee',  label: 'Dommer',   emoji: '🏁' },
];

const PLAYER_NAV: NavItem[] = [
  { view: 'player-home', label: 'Hjem', emoji: '🏠' },
];

const REFEREE_NAV: NavItem[] = [
  { view: 'referee', label: 'Dommervisning', emoji: '🏁' },
];

// ─── Hovedside ────────────────────────────────────────────────
export default function Home() {
  const {
    currentView, setView, currentUser, activePhaseIdx,
    chatMessages, sendChat, homeTeamName,
  } = useAppStore();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isMounted, setIsMounted]               = useState(false);
  const [showSmartCoach, setShowSmartCoach]     = useState(false);
  const [showMatchReport, setShowMatchReport]   = useState(false);
  const [showRefModal, setShowRefModal]         = useState(false);
  const [showSettings, setShowSettings]         = useState(false);
  const [showChat, setShowChat]                 = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;
  if (!currentUser) return <LoginGate />;

  const role    = currentUser.role;
  const isCoach = role === 'coach';

  const navItems =
    role === 'coach'   ? COACH_NAV :
    role === 'player'  ? PLAYER_NAV :
    REFEREE_NAV;

  // Alle chat-meldinger for coach
  const allChats = chatMessages as any[];
  const unreadFromPlayers = allChats.filter(m => m.fromRole === 'player').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#060c18]">

      {/* ── TOPBAR ── */}
      <header className="flex-shrink-0 flex items-center gap-1 px-2
        bg-[#08101e] border-b border-[#1a2d46] h-11 min-w-0">

        <div className="mr-2 text-[12px] font-black tracking-tight whitespace-nowrap hidden sm:block"
          style={{ background: 'linear-gradient(90deg,#38bdf8,#34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚽ {homeTeamName || 'TAKTIKKBOARD'}
        </div>

        <nav className="flex gap-0.5 overflow-x-auto">
          {navItems.map(n => (
            <button key={n.view} onClick={() => setView(n.view)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold
                transition-all whitespace-nowrap min-h-[36px]
                ${currentView === n.view
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'text-[#4a6080] hover:text-slate-300 hover:bg-white/5'}`}>
              {n.emoji} {n.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Trener-verktøy */}
        {isCoach && (
          <div className="flex items-center gap-1">
            {currentView === 'board' && (
              <>
                <LiveClock onClick={() => setShowSmartCoach(true)} />
                <button onClick={() => setShowSmartCoach(true)}
                  className="px-2 py-1 rounded-lg text-[10.5px] font-semibold border
                    border-[#1e3050] text-[#4a6080] hover:text-slate-300 hover:bg-white/5
                    transition hidden sm:flex">
                  ⚡ SmartCoach
                </button>
                <button onClick={() => setShowMatchReport(true)}
                  className="px-2 py-1 rounded-lg text-[10.5px] font-semibold border
                    border-[#1e3050] text-[#4a6080] hover:text-amber-400
                    hover:border-amber-500/40 transition hidden sm:flex">
                  📊 Rapport
                </button>
              </>
            )}

            {/* Dommer-knapp → viser modal med PIN */}
            {currentView === 'referee' && (
              <button onClick={() => setShowRefModal(true)}
                className="px-2 py-1 rounded-lg text-[10.5px] border border-amber-500/30
                  text-amber-400 hover:bg-amber-500/10 transition">
                🏁 Dommer-PIN
              </button>
            )}

            {/* Chat-knapp */}
            <button onClick={() => setShowChat(true)}
              className="relative px-2 py-1 rounded-lg text-[10.5px] border
                border-[#1e3050] text-[#4a6080] hover:text-sky-400
                hover:border-sky-500/40 transition">
              💬
              {unreadFromPlayers > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full
                  bg-sky-500 text-white text-[8px] font-black flex items-center justify-center">
                  {unreadFromPlayers}
                </span>
              )}
            </button>

            {/* Innstillinger */}
            <button onClick={() => setShowSettings(true)}
              className="px-2 py-1 rounded-lg text-[10.5px] border border-[#1e3050]
                text-[#4a6080] hover:text-slate-300 hover:bg-white/5 transition">
              ⚙️
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 text-[11px] text-[#4a6080] ml-1">
          <span className="hidden md:inline truncate max-w-[80px]">
            {role === 'coach' ? '🏋️' : role === 'referee' ? '🏁' : '👤'}{' '}
            {currentUser.name}
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* ── INNHOLD ── */}
      <main className="flex flex-1 overflow-hidden">

        {currentView === 'board' && isCoach && (
          <>
            <Sidebar selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
            <div className="flex-1 overflow-hidden">
              <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
            </div>
          </>
        )}

        {currentView === 'calendar' && isCoach && (
          <div className="flex-1 overflow-hidden"><CalendarView /></div>
        )}

        {currentView === 'players' && isCoach && (
          <div className="flex-1 overflow-hidden"><PlayerPortal /></div>
        )}

        {currentView === 'player-home' && role === 'player' && (
          <div className="flex-1 overflow-hidden"><PlayerHome /></div>
        )}

        {currentView === 'referee' && (
          <div className="flex-1 overflow-hidden"><RefereeView /></div>
        )}
      </main>

      {/* ── MODALER ── */}
      {selectedPlayerId && currentView === 'board' && isCoach && (
        <PlayerEditor
          playerId={selectedPlayerId}
          phaseIdx={activePhaseIdx}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
      {showSmartCoach  && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {showMatchReport && <MatchReportModal onClose={() => setShowMatchReport(false)} />}
      {showRefModal    && <RefereeLoginModal onClose={() => setShowRefModal(false)} />}
      {showSettings    && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Coach chat overlay */}
      {showChat && isCoach && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center
          justify-center sm:p-4" onClick={() => setShowChat(false)}>
          <div className="bg-[#0c1525] border border-[#1e3050] rounded-t-2xl sm:rounded-2xl
            w-full sm:max-w-md h-[70vh] sm:h-[560px] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e3050]">
              <h2 className="font-black text-slate-100 text-sm">💬 Chat med spillere</h2>
              <button onClick={() => setShowChat(false)}
                className="text-[#3a5070] hover:text-white text-xl">✕</button>
            </div>
            <ChatPanel
              currentUser={currentUser}
              chatMessages={allChats}
              coachView
              onSend={(text) => sendChat('coach', 'Trener', text)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const LogoutButton: React.FC = () => {
  const { logout } = useAppStore();
  return (
    <button onClick={logout}
      className="px-2 py-1 rounded-lg text-[11px] border border-[#1e3050]
        text-[#3a5070] hover:text-red-400 hover:border-red-500/40 transition min-h-[36px]">
      Logg ut
    </button>
  );
};
