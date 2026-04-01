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

    try {
      let success = false;

      if (loginType === 'coach') {
        success = loginCoach(email.trim(), password);
      } else {
        success = loginPlayer(email.trim(), password);
      }

      if (!success) {
        setError(
          loginType === 'coach'
            ? `Feil e-post eller passord. Standard: ${coachEmail} / ${coachPassword}`
            : 'Feil e-post eller passord. Spør treneren.'
        );
      }
    } catch (err) {
      setError('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim()) return setError('Fyll inn navn');
    if (!regEmail.trim()) return setError('Fyll inn e-post');
    if (!regTeamName.trim()) return setError('Fyll inn lagnavn');
    if (regPassword.length < 4) return setError('Minst 4 tegn passord');

    try {
      setHomeTeamName(regTeamName.trim());
      setCoachEmail(regEmail.trim());
      setCoachPassword(regPassword);
      setSport(regSport);

      const success = loginCoach(regEmail.trim(), regPassword);

      if (!success) {
        setError('Registrert, men innlogging feilet');
      }
    } catch {
      setError('Noe gikk galt under registrering');
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#060c18]">
      <div className="min-h-full py-8 px-4">
        <div className="max-w-md mx-auto">

          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⚽🏋️</div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              TAKTIKKBOARD
            </h1>
          </div>

          {/* REGISTER */}
          {showRegister ? (
            <form onSubmit={handleRegister} className="bg-[#0c1525] p-6 rounded-2xl border border-[#1e3050] space-y-3">

              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="mb-2 text-xs text-[#4a6080] hover:text-white transition"
              >
                ← Tilbake til innlogging
              </button>

              <input
                placeholder="Ditt navn (trener)"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />

              <input
                placeholder="Lagnavn"
                value={regTeamName}
                onChange={e => setRegTeamName(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />

              <input
                placeholder="E-post (innlogging)"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />

              <input
                type="password"
                placeholder="Passord (min 4 tegn)"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />

              <select
                value={regSport}
                onChange={e => setRegSport(e.target.value as any)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="football">⚽ Fotball 11er</option>
                <option value="football7">⚽ Fotball 7er (barn)</option>
                <option value="handball">🤾 Håndball</option>
              </select>

              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 disabled:opacity-50 transition"
              >
                {loading ? 'Oppretter...' : '✨ Opprett lag og logg inn'}
              </button>
            </form>
          ) : (
            <>
              {/* SWITCH */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setLoginType('coach')}
                  className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all
                    ${loginType === 'coach' 
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                      : 'bg-[#0c1525] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
                >
                  🏋️ Trener
                </button>
                <button
                  onClick={() => setLoginType('player')}
                  className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all
                    ${loginType === 'player' 
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                      : 'bg-[#0c1525] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
                >
                  👤 Spiller
                </button>
              </div>

              {/* LOGIN */}
              <form onSubmit={handleLogin} className="bg-[#0c1525] p-6 rounded-2xl border border-[#1e3050] space-y-3">

                <input
                  type="email"
                  placeholder="E-post"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                />

                <input
                  type="password"
                  placeholder="Passord"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                />

                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-50 transition"
                >
                  {loading ? 'Logger inn...' : `Logg inn som ${loginType === 'coach' ? 'trener' : 'spiller'}`}
                </button>

                {loginType === 'coach' && (
                  <p className="text-xs text-[#4a6080] text-center mt-2">
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

              <button
                onClick={() => setShowRegister(true)}
                className="w-full mt-4 py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 transition"
              >
                ✨ Nytt lag? Registrer deg her
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ekstra padding for scrolling på mobil */}
      <div className="h-10" />
    </div>
  );
};