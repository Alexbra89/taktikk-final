'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Sport } from '@/types';

// Sport-ikoner og label
const SPORT_OPTIONS: { value: Sport; label: string; emoji: string; desc: string }[] = [
  { value: 'football',  label: 'Fotball',   emoji: '⚽', desc: '11v11 · Offside · Frispark' },
  { value: 'handball',  label: 'Håndball',  emoji: '🤾', desc: '7v7 · 60 min · Tidsstraff' },
  { value: 'floorball', label: 'Innebandy', emoji: '🏑', desc: '5+1v5+1 · 3×20 min' },
];

export const LoginGate: React.FC = () => {
  const [mode, setMode] = useState<'choose' | 'coach' | 'player' | 'referee'>('choose');
  const [sport, setSport] = useState<Sport | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const { loginCoach, playerAccounts, loginPlayer, loginReferee, setSport: storeSetSport } = useAppStore();

  // ── Velg rolle ───────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060c18] gap-5 p-6">
        {/* Logo */}
        <div className="text-center mb-2">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-black tracking-tight"
            style={{ background: 'linear-gradient(100deg,#38bdf8,#34d399,#a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TAKTIKKBOARD
          </h1>
          <p className="text-[12px] text-[#4a6080] mt-1">Profesjonell lagstrategi</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => setMode('coach')}
            className="py-4 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400
              font-bold text-[15px] hover:bg-sky-500/25 transition-all flex items-center
              justify-center gap-2.5 min-h-[56px]">
            🏋️ Trener
          </button>
          <button onClick={() => setMode('player')}
            className="py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30
              text-emerald-400 font-bold text-[15px] hover:bg-emerald-500/25 transition-all
              flex items-center justify-center gap-2.5 min-h-[56px]">
            👤 Spiller
          </button>
          <button onClick={() => setMode('referee')}
            className="py-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400
              font-bold text-[15px] hover:bg-amber-500/25 transition-all flex items-center
              justify-center gap-2.5 min-h-[56px]">
            🏁 Dommer
          </button>
        </div>

        <p className="text-[10px] text-[#2a3f58] mt-2">
          Fotball · Håndball · Innebandy
        </p>
      </div>
    );
  }

  // ── Trener: velg sport først ─────────────────────────────────
  if (mode === 'coach' && !sport) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060c18] p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setMode('choose')}
            className="text-[#4a6080] hover:text-sky-400 text-[12px] mb-6 flex items-center gap-1">
            ‹ Tilbake
          </button>
          <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-7 shadow-2xl">
            <h2 className="text-lg font-black text-slate-100 mb-1">🏋️ Velg sport</h2>
            <p className="text-[11.5px] text-[#4a6080] mb-6">
              Velg hvilken sport du trener. Dette styrer taktikkbrettet.
            </p>
            <div className="flex flex-col gap-3">
              {SPORT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { setSport(opt.value); storeSetSport(opt.value); }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-[#1e3050]
                    bg-[#0f1a2a] hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-left">
                  <span className="text-3xl">{opt.emoji}</span>
                  <div>
                    <div className="font-bold text-slate-200 text-[14px]">{opt.label}</div>
                    <div className="text-[10.5px] text-[#4a6080]">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Trener: passord ──────────────────────────────────────────
  if (mode === 'coach' && sport) {
    const submit = () => {
      const ok = loginCoach(password);
      if (!ok) setError('Feil passord. Prøv igjen.');
    };
    return (
      <LoginCard
        title="🏋️ Trener-innlogging"
        subtitle="Standard passord: trener123"
        onBack={() => { setSport(null); setError(''); setPassword(''); }}
        error={error}>
        <label className="block mb-4">
          <div className="label-sm">Passord</div>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="inp" placeholder="••••••••" autoFocus />
        </label>
        <button onClick={submit} className="btn-primary w-full">Logg inn</button>
        <style>{STYLES}</style>
      </LoginCard>
    );
  }

  // ── Spiller ──────────────────────────────────────────────────
  if (mode === 'player') {
    const [accountId, setAccountId] = useState('');
    const [pin, setPin]             = useState('');
    const submitPlayer = () => {
      if (!accountId) { setError('Velg en konto.'); return; }
      const ok = loginPlayer(accountId, pin);
      if (!ok) setError('Feil PIN. Prøv igjen.');
    };
    return (
      <LoginCard
        title="👤 Spillerinnlogging"
        subtitle="Velg deg fra listen og tast PIN"
        onBack={() => { setMode('choose'); setError(''); setPin(''); setAccountId(''); }}
        error={error}>
        <label className="block mb-3">
          <div className="label-sm">Din konto</div>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} className="inp">
            <option value="">– Velg navn –</option>
            {playerAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
        <label className="block mb-4">
          <div className="label-sm">PIN-kode</div>
          <input type="password" maxLength={4} value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitPlayer()}
            className="inp tracking-widest" placeholder="••••" />
        </label>
        {playerAccounts.length === 0 && (
          <p className="text-[11px] text-amber-400/70 mb-3 text-center">
            Ingen spillerkontoer er opprettet ennå.
          </p>
        )}
        <button onClick={submitPlayer} className="btn-primary w-full">Logg inn</button>
        <style>{STYLES}</style>
      </LoginCard>
    );
  }

  // ── Dommer ───────────────────────────────────────────────────
  const [refPin, setRefPin] = useState('');
  const submitRef = () => {
    const ok = loginReferee(refPin);
    if (!ok) setError('Feil PIN. Standard er 0000.');
  };
  return (
    <LoginCard
      title="🏁 Dommer-innlogging"
      subtitle="Standard PIN: 0000"
      onBack={() => { setMode('choose'); setError(''); setRefPin(''); }}
      error={error}>
      <label className="block mb-4">
        <div className="label-sm">PIN-kode</div>
        <input type="password" maxLength={4} value={refPin}
          onChange={e => setRefPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && submitRef()}
          className="inp tracking-widest text-center text-[20px]" placeholder="••••" autoFocus />
      </label>
      <button onClick={submitRef} className="btn-primary w-full">Logg inn som dommer</button>
      <style>{STYLES}</style>
    </LoginCard>
  );
};

// ─── Hjelpere ─────────────────────────────────────────────────

const LoginCard: React.FC<{
  title: string; subtitle: string; onBack: () => void;
  error: string; children: React.ReactNode;
}> = ({ title, subtitle, onBack, error, children }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#060c18] p-6">
    <div className="w-full max-w-sm">
      <button onClick={onBack}
        className="text-[#4a6080] hover:text-sky-400 text-[12px] mb-6 flex items-center gap-1">
        ‹ Tilbake
      </button>
      <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-7 shadow-2xl">
        <h2 className="text-lg font-black text-slate-100 mb-1">{title}</h2>
        <p className="text-[11.5px] text-[#4a6080] mb-5">{subtitle}</p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2
            text-red-400 text-[11.5px] mb-4 text-center">{error}</div>
        )}
        {children}
      </div>
    </div>
  </div>
);

const STYLES = `
  .inp { width:100%; background:#111c30; border:1px solid #1e3050; border-radius:8px;
    padding:11px 13px; color:#e2e8f0; font-size:14px; margin-top:5px;
    box-sizing:border-box; min-height:48px; }
  .inp:focus { outline:none; border-color:#38bdf8; }
  .label-sm { font-size:9.5px; font-weight:700; color:#3a5070;
    text-transform:uppercase; letter-spacing:0.09em; }
  .btn-primary { padding:13px; border-radius:10px; background:rgba(56,189,248,0.12);
    border:1px solid rgba(56,189,248,0.3); color:#38bdf8; font-size:14px;
    font-weight:700; cursor:pointer; transition:all 0.15s; min-height:48px; }
  .btn-primary:hover { background:rgba(56,189,248,0.22); }
`;
