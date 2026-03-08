'use client';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const LoginGate: React.FC = () => {
  // 1. Alle "hooks" samlet på toppen
  const [mode, setMode] = useState<'choose' | 'coach' | 'player'>('choose');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // LEGG TIL DISSE TO HER:
  const [accountId, setAccountId] = useState('');
  const [pin, setPin] = useState('');

  const { loginCoach, playerAccounts, loginPlayer } = useAppStore();

  // ── Velg rolle ──────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#060c18] gap-6 p-8">
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-black tracking-tight"
            style={{ background:'linear-gradient(100deg,#38bdf8,#34d399,#a78bfa)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            TAKTIKKBOARD
          </h1>
          <p className="text-[12px] text-[#4a6080] mt-1">Profesjonell lagstrategi</p>
        </div>

        <div className="flex flex-col gap-3 w-64">
          <button onClick={() => setMode('coach')}
            className="py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400
              font-bold text-[14px] hover:bg-sky-500/25 transition-all flex items-center justify-center gap-2">
            🏋️ Logg inn som trener
          </button>
          <button onClick={() => setMode('player')}
            className="py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400
              font-bold text-[14px] hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2">
            👤 Logg inn som spiller
          </button>
        </div>
      </div>
    );
  }

  // ── Trener-innlogging ───────────────────────────────────────
  if (mode === 'coach') {
    const submit = () => {
      const ok = loginCoach(password);
      if (!ok) setError('Feil passord. Prøv igjen.');
    };
    return (
      <LoginCard
        title="🏋️ Trener-innlogging"
        subtitle="Passord er som standard: trener123"
        onBack={() => { setMode('choose'); setError(''); setPassword(''); }}
        error={error}
      >
        <label className="block mb-4">
          <div className="label-sm">Passord</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="inp"
            placeholder="••••••••"
            autoFocus
          />
        </label>
        <button onClick={submit} className="btn-primary w-full">Logg inn</button>
        <style>{STYLES}</style>
      </LoginCard>
    );
  }

  // ── Spiller-innlogging ──────────────────────────────────────

  const submitPlayer = () => {
    if (!accountId) { setError('Velg en konto.'); return; }
    const ok = loginPlayer(accountId, pin);
    if (!ok) setError('Feil PIN. Prøv igjen.');
  };

  return (
    <LoginCard
      title="👤 Spillerinnlogging"
      subtitle="Velg deg fra listen og tast inn PIN-koden din"
      onBack={() => { setMode('choose'); setError(''); setPin(''); setAccountId(''); }}
      error={error}
    >
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
        <input
          type="password"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitPlayer()}
          className="inp tracking-widest"
          placeholder="••••"
        />
      </label>

      {playerAccounts.length === 0 && (
        <p className="text-[11px] text-amber-400/70 mb-3 text-center">
          Ingen spillerkontoer er opprettet ennå.<br />
          Be treneren opprette en konto til deg under Spillerportal.
        </p>
      )}

      <button onClick={submitPlayer} className="btn-primary w-full">Logg inn</button>
      <style>{STYLES}</style>
    </LoginCard>
  );
};

// ─── Hjelpere ─────────────────────────────────────────────────

const LoginCard: React.FC<{
  title: string;
  subtitle: string;
  onBack: () => void;
  error: string;
  children: React.ReactNode;
}> = ({ title, subtitle, onBack, error, children }) => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#060c18] p-8">
    <div className="w-full max-w-sm">
      <button onClick={onBack}
        className="text-[#4a6080] hover:text-sky-400 text-[12px] mb-6 flex items-center gap-1 transition">
        ‹ Tilbake
      </button>

      <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-7 shadow-2xl">
        <h2 className="text-lg font-black text-slate-100 mb-1">{title}</h2>
        <p className="text-[11.5px] text-[#4a6080] mb-5">{subtitle}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2
            text-red-400 text-[11.5px] mb-4 text-center">
            {error}
          </div>
        )}

        {children}
      </div>
    </div>
  </div>
);

const STYLES = `
  .inp {
    width: 100%;
    background: #111c30;
    border: 1px solid #1e3050;
    border-radius: 8px;
    padding: 9px 12px;
    color: #e2e8f0;
    font-size: 13px;
    margin-top: 5px;
    box-sizing: border-box;
  }
  .inp:focus { outline: none; border-color: #38bdf8; }
  .label-sm {
    font-size: 9.5px;
    font-weight: 700;
    color: #3a5070;
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }
  .btn-primary {
    padding: 10px;
    border-radius: 10px;
    background: rgba(56,189,248,0.12);
    border: 1px solid rgba(56,189,248,0.3);
    color: #38bdf8;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-primary:hover { background: rgba(56,189,248,0.2); }
`;
