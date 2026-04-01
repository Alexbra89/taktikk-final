'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const LoginGate: React.FC = () => {
  const {
    loginCoach,
    loginPlayer,
    playerAccounts,
    setHomeTeamName,
    setCoachEmail,
    setCoachPassword,
    setSport,
    coachEmail,
    coachPassword,
  } = useAppStore();

  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'coach' | 'player'>('coach');

  // Registreringsfelter
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTeamName, setRegTeamName] = useState('');
  const [regSport, setRegSport] = useState<'football' | 'football7' | 'handball'>('football');

  const playersWithEmail = (playerAccounts as any[]).filter((p: any) => p.email);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const success = loginType === 'coach' 
      ? loginCoach(email.trim(), password)
      : loginPlayer(email.trim(), password);
    
    if (!success) {
      if (loginType === 'coach') {
        setError(`Feil e-post eller passord. Standard: ${coachEmail} / ${coachPassword}`);
      } else {
        setError('Feil e-post eller passord. Spør treneren om innloggingsdetaljer.');
      }
    }
    setLoading(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim())     { setError('Fyll inn ditt navn.'); return; }
    if (!regEmail.trim())    { setError('Fyll inn e-post.'); return; }
    if (!regTeamName.trim()) { setError('Fyll inn lagnavn.'); return; }
    if (regPassword.length < 4) { setError('Passordet må være minst 4 tegn.'); return; }

    setHomeTeamName(regTeamName.trim());
    setCoachEmail(regEmail.trim());
    setCoachPassword(regPassword);
    setSport(regSport);

    const success = loginCoach(regEmail.trim(), regPassword);
    if (!success) {
      setError('Kunne ikke logge inn etter registrering. Prøv igjen.');
    }
  };

  if (showRegister) {
    return (
      <div className="min-h-screen bg-[#060c18] flex items-start justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md my-8">
          
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⚽🏋️</div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              TAKTIKKBOARD
            </h1>
            <p className="text-[11px] text-[#4a6080] mt-2">Opprett nytt lag</p>
          </div>

          <form onSubmit={handleRegister} className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
            
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="mb-4 text-[11px] px-3 py-1.5 rounded-lg border border-[#1e3050] text-[#4a6080] hover:text-white transition"
            >
              ← Tilbake til innlogging
            </button>

            <h2 className="text-base font-bold text-slate-100 mb-5">✨ Registrer nytt lag</h2>

            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                Ditt navn (trener)
              </label>
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                placeholder="Ola Nordmann"
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                Lagnavn
              </label>
              <input
                type="text"
                value={regTeamName}
                onChange={e => setRegTeamName(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                placeholder="Sotra SK"
                required
              />
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                E-post (innlogging)
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                placeholder="trener@lag.no"
                required
              />
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                Passord
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                placeholder="Minst 4 tegn"
                required
              />
            </div>

            <div className="mb-5">
              <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                Sport
              </label>
              <select
                value={regSport}
                onChange={e => setRegSport(e.target.value as any)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="football">⚽ Fotball 11er</option>
                <option value="football7">⚽ Fotball 7er (barn)</option>
                <option value="handball">🤾 Håndball</option>
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[12px] text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 min-h-[52px] transition"
            >
              ✨ Opprett lag og logg inn
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060c18] flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-8">
        
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽🏋️</div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            TAKTIKKBOARD
          </h1>
          <p className="text-[11px] text-[#4a6080] mt-2">Taktikk og kommunikasjon for lagidretter</p>
        </div>

        {/* Velg innloggingstype */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setLoginType('coach'); setError(''); setEmail(''); setPassword(''); }}
            className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all min-h-[48px]
              ${loginType === 'coach' 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'bg-[#0c1525] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
          >
            🏋️ Trener
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('player'); setError(''); setEmail(''); setPassword(''); }}
            className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all min-h-[48px]
              ${loginType === 'player' 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'bg-[#0c1525] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
          >
            👤 Spiller
          </button>
        </div>

        {/* Innloggingsskjema */}
        <form onSubmit={handleLogin} className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
          <h2 className="text-base font-bold text-slate-100 mb-5">
            {loginType === 'coach' ? '🏋️ Trener-innlogging' : '👤 Spiller-innlogging'}
          </h2>
          
          <div className="mb-4">
            <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              placeholder={loginType === 'coach' ? 'trener@lag.no' : 'ola@spiller.no'}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[12px] text-red-400">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-50 min-h-[52px] transition"
          >
            {loading ? 'Logger inn...' : `Logg inn som ${loginType === 'coach' ? 'trener' : 'spiller'}`}
          </button>

          {loginType === 'coach' && (
            <p className="text-[10px] text-[#3a5070] mt-3 text-center">
              Standard: {coachEmail} / {coachPassword}
            </p>
          )}

          {loginType === 'player' && playersWithEmail.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1e3050]">
              <p className="text-[9px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">
                Spillere i laget
              </p>
              <div className="flex flex-wrap gap-1.5">
                {playersWithEmail.slice(0, 6).map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEmail(p.email)}
                    className="text-[10px] px-2 py-1 rounded-full bg-[#111c30] border border-[#1e3050] text-[#4a6080] hover:text-sky-400 hover:border-sky-500/30 transition"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Registreringsknapp */}
        <button
          onClick={() => {
            setShowRegister(true);
            setError('');
          }}
          className="w-full mt-4 py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 transition min-h-[52px]"
        >
          ✨ Nytt lag? Registrer deg her
        </button>
      </div>
    </div>
  );
};