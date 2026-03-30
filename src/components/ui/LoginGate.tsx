'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

type Mode = 'choose' | 'coach-register' | 'coach-login' | 'player';

export const LoginGate: React.FC = () => {
  const [mode, setMode]     = useState<Mode>('choose');
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [teamName, setTeamName] = useState('');
  const [sport, setSport]   = useState<'football' | 'football7' | 'handball'>('football');
  const [error, setError]   = useState('');
  const [accountId, setAccountId] = useState('');
  const [pin, setPin]       = useState('');

  const {
    loginCoach, playerAccounts, loginPlayer,
    setSport: storeSport, setHomeTeamName,
    setCoachEmail, setCoachPassword,
    coachEmail, coachPassword,
  } = useAppStore();

  const clearErr = () => setError('');

  // ── Velg rolle ───────────────────────────────────────────────
  if (mode === 'choose') return (
    <Screen>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚽</div>
        <h1 className="text-3xl font-black tracking-tight mb-1"
          style={{ background: 'linear-gradient(100deg,#38bdf8,#34d399,#a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TAKTIKKBOARD
        </h1>
        <p className="text-[12px] text-[#4a6080]">Fotball · Håndball · Lagstrategi</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <BigBtn emoji="🏋️" label="Logg inn som trener" color="sky"
          onClick={() => { clearErr(); setMode('coach-login'); }} />
        <BigBtn emoji="✨" label="Registrer nytt lag" color="emerald"
          onClick={() => { clearErr(); setMode('coach-register'); }} />
        <BigBtn emoji="👤" label="Logg inn som spiller" color="purple"
          onClick={() => { clearErr(); setMode('player'); }} />
      </div>
    </Screen>
  );

  // ── Ny trener: registrer lag ─────────────────────────────────
  if (mode === 'coach-register') {
    const register = () => {
      if (!teamName.trim()) { setError('Fyll inn lagnavn.'); return; }
      if (!email.trim())    { setError('Fyll inn e-post.'); return; }
      if (password.length < 4) { setError('Passord må være minst 4 tegn.'); return; }
      setHomeTeamName(teamName.trim());
      setCoachEmail(email.trim());
      setCoachPassword(password);
      storeSport(sport);
      loginCoach(email.trim(), password);
    };
    return (
      <Screen>
        <Card title="✨ Registrer nytt lag" onBack={() => { setMode('choose'); clearErr(); }}>
          {error && <ErrBox msg={error} />}

          <Label>Lagnavn</Label>
          <Inp type="text" value={teamName} onChange={setTeamName} onEnter={register}
            placeholder="Eks: Sotra SK U16" autoFocus />

          <Label>Sport</Label>
          <div className="flex gap-2 mb-4">
            {([
              { v: 'football',  e: '⚽', l: '11er' },
              { v: 'football7', e: '⚽', l: '7er' },
              { v: 'handball',  e: '🤾', l: 'Håndball' },
            ] as const).map(o => (
              <button key={o.v} onClick={() => setSport(o.v)}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all min-h-[44px]
                  ${sport === o.v ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
                {o.e} {o.l}
              </button>
            ))}
          </div>

          <Label>Din e-post (brukes til innlogging)</Label>
          <Inp type="email" value={email} onChange={setEmail} onEnter={register}
            placeholder="trener@lag.no" />

          <Label>Passord</Label>
          <Inp type="password" value={password} onChange={setPass} onEnter={register}
            placeholder="Minst 4 tegn" />

          <SubmitBtn onClick={register} label="Opprett lag og logg inn" />
        </Card>
      </Screen>
    );
  }

  // ── Trener: logg inn ─────────────────────────────────────────
  if (mode === 'coach-login') {
    const submit = () => {
      if (!email.trim()) { setError('Fyll inn e-post.'); return; }
      if (!password)     { setError('Fyll inn passord.'); return; }
      if (!loginCoach(email, password)) setError('Feil e-post eller passord.');
    };
    return (
      <Screen>
        <Card title="🏋️ Trener-innlogging"
          subtitle={`Standard: ${coachEmail} / ${coachPassword}`}
          onBack={() => { setMode('choose'); clearErr(); setPass(''); }}>
          {error && <ErrBox msg={error} />}
          <Label>E-post</Label>
          <Inp type="email" value={email} onChange={setEmail} onEnter={submit}
            placeholder={coachEmail} autoFocus />
          <Label>Passord</Label>
          <Inp type="password" value={password} onChange={setPass} onEnter={submit}
            placeholder="••••••••" />
          <SubmitBtn onClick={submit} label="Logg inn" />
          <button onClick={() => { clearErr(); setMode('coach-register'); }}
            className="w-full mt-3 py-2 text-[12px] text-[#4a6080] hover:text-sky-400 transition">
            Nytt lag? Registrer her →
          </button>
        </Card>
      </Screen>
    );
  }

  // ── Spiller: PIN ─────────────────────────────────────────────
  const submitPlayer = () => {
    if (!accountId) { setError('Velg din konto.'); return; }
    if (pin.length < 4) { setError('PIN er 4 siffer.'); return; }
    if (!loginPlayer(accountId, pin)) setError('Feil PIN. Prøv igjen.');
  };
  return (
    <Screen>
      <Card title="👤 Spillerinnlogging"
        subtitle="Velg deg fra listen og tast PIN"
        onBack={() => { setMode('choose'); clearErr(); setPin(''); setAccountId(''); }}>
        {error && <ErrBox msg={error} />}
        <Label>Din konto</Label>
        <select value={accountId} onChange={e => setAccountId(e.target.value)}
          className="lg-inp mb-4">
          <option value="">– Velg navn –</option>
          {(playerAccounts as any[]).map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        {(playerAccounts as any[]).length === 0 && (
          <p className="text-[11px] text-amber-400/70 mb-4 text-center">
            Be treneren opprette en konto til deg.
          </p>
        )}
        <Label>PIN-kode</Label>
        <input type="password" inputMode="numeric" maxLength={4}
          value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && submitPlayer()}
          className="lg-inp text-center tracking-[10px] text-[22px] mb-6"
          placeholder="••••" />
        {pin.length > 0 && pin.length < 4 && (
          <p className="text-[10px] text-amber-400 -mt-4 mb-4 text-center">{4 - pin.length} siffer til</p>
        )}
        <SubmitBtn onClick={submitPlayer} label="Logg inn" />
      </Card>
    </Screen>
  );
};

// ─── UI helpers ──────────────────────────────────────────────

const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#060c18] p-5">
    {children}
  </div>
);

const BigBtn: React.FC<{
  emoji: string; label: string; color: 'sky'|'emerald'|'purple'; onClick: () => void;
}> = ({ emoji, label, color, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl
      font-bold text-[15px] min-h-[60px] active:scale-[0.97] transition-all touch-manipulation
      ${color === 'sky'    ? 'bg-sky-500/15 border border-sky-500/40 text-sky-400'
      : color === 'emerald' ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
      :                       'bg-purple-500/15 border border-purple-500/40 text-purple-400'}`}>
    {emoji} {label}
  </button>
);

const Card: React.FC<{
  title: string; subtitle?: string; onBack?: () => void; children: React.ReactNode;
}> = ({ title, subtitle, onBack, children }) => (
  <div className="w-full max-w-sm">
    {onBack && (
      <button onClick={onBack} className="text-[#4a6080] hover:text-sky-400 text-[13px] mb-4 flex items-center gap-1 min-h-[44px]">
        ‹ Tilbake
      </button>
    )}
    <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-6 shadow-2xl">
      <h2 className="text-lg font-black text-slate-100 mb-1">{title}</h2>
      {subtitle && <p className="text-[11px] text-[#4a6080] mb-4">{subtitle}</p>}
      {children}
    </div>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-1.5">{children}</div>
);

const ErrBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-[12px] mb-4 text-center">{msg}</div>
);

const Inp: React.FC<{
  type: string; value: string; onChange: (v: string) => void;
  onEnter: () => void; placeholder: string; autoFocus?: boolean;
}> = ({ type, value, onChange, onEnter, placeholder, autoFocus }) => (
  <input type={type} value={value} autoFocus={autoFocus}
    onChange={e => onChange(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && onEnter()}
    placeholder={placeholder}
    className="lg-inp mb-4" />
);

const SubmitBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick}
    className="w-full py-4 rounded-xl bg-sky-500/15 border border-sky-500/30
      text-sky-400 font-bold text-[15px] hover:bg-sky-500/25
      transition min-h-[56px] active:scale-[0.98] touch-manipulation">
    {label}
  </button>
);

if (typeof document !== 'undefined' && !document.getElementById('lg-styles')) {
  const el = document.createElement('style');
  el.id = 'lg-styles';
  el.textContent = `.lg-inp { display:block; width:100%; background:#111c30;
    border:1px solid #1e3050; border-radius:10px; padding:13px 16px;
    color:#e2e8f0; font-size:15px; box-sizing:border-box; min-height:52px; }
    .lg-inp:focus { outline:none; border-color:#38bdf8; }`;
  document.head.appendChild(el);
}
