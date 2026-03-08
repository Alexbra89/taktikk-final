'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Sport } from '@/types';

const SPORT_OPTIONS: { value: Sport; label: string; emoji: string; desc: string }[] = [
  { value: 'football',  label: 'Fotball',   emoji: '⚽', desc: '11v11 · Offside · Frispark' },
  { value: 'handball',  label: 'Håndball',  emoji: '🤾', desc: '7v7 · 60 min · Tidsstraff' },
  { value: 'floorball', label: 'Innebandy', emoji: '🏑', desc: '5+1v5+1 · 3×20 min' },
];

type Mode = 'choose' | 'coach-sport' | 'coach-login' | 'player';

export const LoginGate: React.FC = () => {
  const [mode, setMode]       = useState<Mode>('choose');
  const [sport, setSport]     = useState<Sport | null>(null);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');

  const {
    loginCoach, playerAccounts, loginPlayer,
    setSport: storeSetSport,
  } = useAppStore();

  const clearErr = () => setError('');

  // ── Velg rolle (kun Trener og Spiller) ──────────────────────
  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060c18] gap-5 p-6">
        <div className="text-center mb-2">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-4xl font-black tracking-tight"
            style={{ background: 'linear-gradient(100deg,#38bdf8,#34d399,#a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TAKTIKKBOARD
          </h1>
          <p className="text-[13px] text-[#4a6080] mt-2">Profesjonell lagstrategi · Fotball · Håndball · Innebandy</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button onClick={() => { clearErr(); setMode('coach-sport'); }}
            className="py-4 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400
              font-bold text-[16px] hover:bg-sky-500/25 active:scale-95 transition-all
              flex items-center justify-center gap-3 min-h-[60px]">
            🏋️ Logg inn som trener
          </button>
          <button onClick={() => { clearErr(); setMode('player'); }}
            className="py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30
              text-emerald-400 font-bold text-[16px] hover:bg-emerald-500/25 active:scale-95
              transition-all flex items-center justify-center gap-3 min-h-[60px]">
            👤 Logg inn som spiller
          </button>
        </div>

        <p className="text-[10px] text-[#1e3050] mt-4">
          Dommer-innlogging er tilgjengelig via trener-dashboardet
        </p>
      </div>
    );
  }

  // ── Trener – velg sport ──────────────────────────────────────
  if (mode === 'coach-sport') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060c18] p-6">
        <div className="w-full max-w-sm">
          <BackBtn onClick={() => setMode('choose')} />
          <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-7 shadow-2xl">
            <h2 className="text-lg font-black text-slate-100 mb-1">⚽ Velg sport</h2>
            <p className="text-[11.5px] text-[#4a6080] mb-6">
              Valget lagrer seg — du kan bytte inne i appen.
            </p>
            <div className="flex flex-col gap-3">
              {SPORT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => {
                    setSport(opt.value);
                    storeSetSport(opt.value);
                    setMode('coach-login');
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#1e3050]
                    bg-[#0f1a2a] hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-left
                    min-h-[64px]">
                  <span className="text-3xl">{opt.emoji}</span>
                  <div>
                    <div className="font-bold text-slate-200 text-[15px]">{opt.label}</div>
                    <div className="text-[11px] text-[#4a6080]">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Trener – e-post/passord ──────────────────────────────────
  if (mode === 'coach-login') {
    const submit = () => {
      if (!email.trim()) { setError('Fyll inn e-post.'); return; }
      if (!password) { setError('Fyll inn passord.'); return; }
      const ok = loginCoach(email, password);
      if (!ok) setError('Feil e-post eller passord.');
    };
    return (
      <LoginCard title="🏋️ Trener-innlogging"
        subtitle={`Standard: trener@lag.no · trener123${sport ? `  ·  ${SPORT_OPTIONS.find(s=>s.value===sport)?.emoji} ${SPORT_OPTIONS.find(s=>s.value===sport)?.label}` : ''}`}
        onBack={() => { setMode('coach-sport'); clearErr(); setPassword(''); }}
        error={error}>
        <label className="block mb-3">
          <LabelSm>E-post</LabelSm>
          <input type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="inp" placeholder="trener@lag.no" autoFocus />
        </label>
        <label className="block mb-5">
          <LabelSm>Passord</LabelSm>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="inp" placeholder="••••••••" />
        </label>
        <button onClick={submit} className="btn-primary w-full">Logg inn</button>
        <style>{STYLES}</style>
      </LoginCard>
    );
  }

  // ── Spiller – velg konto + PIN ───────────────────────────────
  const [accountId, setAccountId] = useState('');
  const [pin, setPin]             = useState('');

  const submitPlayer = () => {
    if (!accountId) { setError('Velg en konto.'); return; }
    const ok = loginPlayer(accountId, pin);
    if (!ok) setError('Feil PIN. Prøv igjen.');
  };

  return (
    <LoginCard title="👤 Spillerinnlogging"
      subtitle="Velg deg fra listen og tast PIN"
      onBack={() => { setMode('choose'); clearErr(); setPin(''); setAccountId(''); }}
      error={error}>
      <label className="block mb-3">
        <LabelSm>Din konto</LabelSm>
        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="inp">
          <option value="">– Velg navn –</option>
          {playerAccounts.map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </label>
      <label className="block mb-5">
        <LabelSm>PIN-kode</LabelSm>
        <input type="password" maxLength={4} value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && submitPlayer()}
          className="inp tracking-widest text-center text-[20px]" placeholder="••••" />
      </label>
      {playerAccounts.length === 0 && (
        <p className="text-[11px] text-amber-400/70 mb-3 text-center">
          Ingen spillerkontoer er opprettet ennå. Be treneren om å opprette en konto til deg.
        </p>
      )}
      <button onClick={submitPlayer} className="btn-primary w-full">Logg inn</button>
      <style>{STYLES}</style>
    </LoginCard>
  );
};

// ─── Hjelpere ────────────────────────────────────────────────

const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick}
    className="text-[#4a6080] hover:text-sky-400 text-[12px] mb-6 flex items-center gap-1 transition">
    ‹ Tilbake
  </button>
);

const LabelSm: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest mt-1 mb-1">
    {children}
  </div>
);

const LoginCard: React.FC<{
  title: string; subtitle: string; onBack: () => void;
  error: string; children: React.ReactNode;
}> = ({ title, subtitle, onBack, error, children }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#060c18] p-6">
    <div className="w-full max-w-sm">
      <BackBtn onClick={onBack} />
      <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-7 shadow-2xl">
        <h2 className="text-lg font-black text-slate-100 mb-1">{title}</h2>
        <p className="text-[11px] text-[#4a6080] mb-5 leading-relaxed">{subtitle}</p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5
            text-red-400 text-[12px] mb-4 text-center">{error}</div>
        )}
        {children}
      </div>
    </div>
  </div>
);

const STYLES = `
  .inp { width:100%; background:#111c30; border:1px solid #1e3050; border-radius:10px;
    padding:12px 14px; color:#e2e8f0; font-size:14px; box-sizing:border-box;
    min-height:48px; margin-top:4px; }
  .inp:focus { outline:none; border-color:#38bdf8; }
  .btn-primary { display:block; padding:14px; border-radius:12px;
    background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.3);
    color:#38bdf8; font-size:15px; font-weight:700; cursor:pointer;
    transition:all 0.15s; min-height:52px; }
  .btn-primary:hover { background:rgba(56,189,248,0.22); }
`;
