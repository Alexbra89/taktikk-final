'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// ═══ LOGINGATE — e-post/passord for trener, PIN for spiller ═══════
// Dommer er FJERNET fra forsiden. Ingen Innebandy.

type Mode = 'choose' | 'coach-sport' | 'coach-login' | 'player';

export const LoginGate: React.FC = () => {
  const [mode, setMode]     = useState<Mode>('choose');
  const [sport, setSport]   = useState<'football' | 'handball'>('football');
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [error, setError]   = useState('');

  const { loginCoach, playerAccounts, loginPlayer, setSport: storeSport } = useAppStore();

  const clearErr = () => setError('');

  // ── Velg rolle ───────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <Screen>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-4xl font-black tracking-tight mb-2"
            style={{ background: 'linear-gradient(100deg,#38bdf8,#34d399,#a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TAKTIKKBOARD
          </h1>
          <p className="text-[13px] text-[#4a6080]">Profesjonell lagstrategi · Fotball & Håndball</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <BigBtn
            emoji="🏋️"
            label="Logg inn som trener"
            color="sky"
            onClick={() => { clearErr(); setMode('coach-sport'); }}
          />
          <BigBtn
            emoji="👤"
            label="Logg inn som spiller"
            color="emerald"
            onClick={() => { clearErr(); setMode('player'); }}
          />
        </div>
      </Screen>
    );
  }

  // ── Trener: velg sport ───────────────────────────────────────
  if (mode === 'coach-sport') {
    return (
      <Screen>
        <Card title="⚽ Velg sport" onBack={() => { setMode('choose'); clearErr(); }}>
          <p className="text-[12px] text-[#4a6080] mb-5">
            Kan endres i innstillinger etter innlogging.
          </p>
          <div className="flex flex-col gap-3">
            {([
              { v: 'football', e: '⚽', l: 'Fotball', d: '11v11 · Offside · Frispark' },
              { v: 'handball', e: '🤾', l: 'Håndball', d: '7v7 · 60 min · Tidsstraff' },
            ] as const).map(opt => (
              <button key={opt.v}
                onClick={() => {
                  setSport(opt.v);
                  storeSport(opt.v);
                  setMode('coach-login');
                  clearErr();
                }}
                className="flex items-center gap-4 p-4 rounded-xl border border-[#1e3050]
                  bg-[#0f1a2a] hover:border-sky-500/50 hover:bg-sky-500/5
                  transition-all text-left min-h-[68px] active:scale-[0.98]">
                <span className="text-3xl">{opt.e}</span>
                <div>
                  <div className="font-bold text-slate-200 text-[15px]">{opt.l}</div>
                  <div className="text-[11px] text-[#4a6080]">{opt.d}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </Screen>
    );
  }

  // ── Trener: e-post + passord ─────────────────────────────────
  if (mode === 'coach-login') {
    const submit = () => {
      if (!email.trim()) { setError('Fyll inn e-post.'); return; }
      if (!password)     { setError('Fyll inn passord.'); return; }
      if (!loginCoach(email, password)) setError('Feil e-post eller passord.');
    };
    const sportEmoji = sport === 'football' ? '⚽' : '🤾';
    return (
      <Screen>
        <Card
          title={`${sportEmoji} Trener-innlogging`}
          subtitle={`Standard: trener@lag.no · trener123`}
          onBack={() => { setMode('coach-sport'); clearErr(); setPass(''); }}>
          {error && <ErrorBox msg={error} />}
          <Inp label="E-post" type="email" value={email}
            onChange={setEmail} onEnter={submit} placeholder="trener@lag.no" autoFocus />
          <Inp label="Passord" type="password" value={password}
            onChange={setPass} onEnter={submit} placeholder="••••••••" />
          <SubmitBtn onClick={submit} label="Logg inn" />
        </Card>
      </Screen>
    );
  }

  // ── Spiller: konto + PIN ─────────────────────────────────────
  const [accountId, setAccountId] = useState('');
  const [pin, setPin]             = useState('');

  const submitPlayer = () => {
    if (!accountId) { setError('Velg din konto.'); return; }
    if (pin.length < 4) { setError('PIN er 4 siffer.'); return; }
    if (!loginPlayer(accountId, pin)) setError('Feil PIN. Prøv igjen.');
  };

  return (
    <Screen>
      <Card
        title="👤 Spillerinnlogging"
        subtitle="Velg deg fra listen og tast PIN"
        onBack={() => { setMode('choose'); clearErr(); setPin(''); setAccountId(''); }}>
        {error && <ErrorBox msg={error} />}

        <div className="mb-4">
          <FieldLabel>Din konto</FieldLabel>
          <select value={accountId} onChange={e => setAccountId(e.target.value)}
            className="lg-inp">
            <option value="">– Velg navn –</option>
            {(playerAccounts as any[]).map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {(playerAccounts as any[]).length === 0 && (
            <p className="text-[11px] text-amber-400/70 mt-2 text-center">
              Be treneren opprette en spillerkonto til deg under Tropp-fanen.
            </p>
          )}
        </div>

        <div className="mb-6">
          <FieldLabel>PIN-kode</FieldLabel>
          <input type="password" inputMode="numeric" maxLength={4} value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={e => e.key === 'Enter' && submitPlayer()}
            className="lg-inp text-center tracking-[10px] text-[22px]"
            placeholder="••••" />
          {pin.length > 0 && pin.length < 4 && (
            <p className="text-[10px] text-amber-400 mt-1 text-center">
              {4 - pin.length} siffer til
            </p>
          )}
        </div>

        <SubmitBtn onClick={submitPlayer} label="Logg inn" />
      </Card>
    </Screen>
  );
};

// ─── UI-byggeklosser ─────────────────────────────────────────

const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center
    bg-[#060c18] p-5 sm:p-8">
    {children}
  </div>
);

const BigBtn: React.FC<{
  emoji: string; label: string; color: 'sky'|'emerald'; onClick: () => void;
}> = ({ emoji, label, color, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl
      font-bold text-[16px] min-h-[64px] active:scale-[0.97] transition-all
      touch-manipulation
      ${color === 'sky'
        ? 'bg-sky-500/15 border border-sky-500/40 text-sky-400 hover:bg-sky-500/25'
        : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'}`}>
    {emoji} {label}
  </button>
);

const Card: React.FC<{
  title: string; subtitle?: string; onBack?: () => void; children: React.ReactNode;
}> = ({ title, subtitle, onBack, children }) => (
  <div className="w-full max-w-sm">
    {onBack && (
      <button onClick={onBack}
        className="text-[#4a6080] hover:text-sky-400 text-[13px] mb-5 flex items-center
          gap-1 transition min-h-[44px]">
        ‹ Tilbake
      </button>
    )}
    <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-6 sm:p-8 shadow-2xl">
      <h2 className="text-lg font-black text-slate-100 mb-1">{title}</h2>
      {subtitle && (
        <p className="text-[11.5px] text-[#4a6080] mb-5 leading-relaxed">{subtitle}</p>
      )}
      {children}
    </div>
  </div>
);

const ErrorBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3
    text-red-400 text-[12px] mb-4 text-center">
    {msg}
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-1.5">
    {children}
  </div>
);

const Inp: React.FC<{
  label: string; type: string; value: string;
  onChange: (v: string) => void; onEnter: () => void;
  placeholder: string; autoFocus?: boolean;
}> = ({ label, type, value, onChange, onEnter, placeholder, autoFocus }) => (
  <div className="mb-4">
    <FieldLabel>{label}</FieldLabel>
    <input type={type} value={value} autoFocus={autoFocus}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter()}
      placeholder={placeholder}
      className="lg-inp" />
  </div>
);

const SubmitBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick}
    className="w-full py-4 rounded-xl bg-sky-500/15 border border-sky-500/30
      text-sky-400 font-bold text-[15px] hover:bg-sky-500/25
      transition min-h-[56px] active:scale-[0.98] touch-manipulation">
    {label}
  </button>
);

// Globale input-stiler
const _styles = `
  <style>
    .lg-inp { display:block; width:100%; background:#111c30; border:1px solid #1e3050;
      border-radius:10px; padding:13px 16px; color:#e2e8f0; font-size:15px;
      box-sizing:border-box; min-height:52px; }
    .lg-inp:focus { outline:none; border-color:#38bdf8; }
  </style>
`;
// Injiserer globale stiler i head
if (typeof document !== 'undefined' && !document.getElementById('lg-styles')) {
  const el = document.createElement('style');
  el.id = 'lg-styles';
  el.textContent = `.lg-inp { display:block; width:100%; background:#111c30;
    border:1px solid #1e3050; border-radius:10px; padding:13px 16px;
    color:#e2e8f0; font-size:15px; box-sizing:border-box; min-height:52px; }
    .lg-inp:focus { outline:none; border-color:#38bdf8; }`;
  document.head.appendChild(el);
}
