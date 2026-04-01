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

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registreringsfelter
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTeamName, setRegTeamName] = useState('');
  const [regSport, setRegSport] = useState<'football' | 'football7' | 'handball'>('football');

  const playersWithEmail = (playerAccounts as any[]).filter((p: any) => p.email);

  const handleCoachLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = loginCoach(email.trim(), password);
    if (!success) {
      setError(`Feil e-post eller passord. Standard: ${coachEmail} / ${coachPassword}`);
    }
    setLoading(false);
  };

  const handlePlayerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = loginPlayer(email.trim(), password);
    if (!success) {
      setError('Feil e-post eller passord. Spør treneren om innloggingsdetaljer.');
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

    // Registrer direkte i store
    setHomeTeamName(regTeamName.trim());
    setCoachEmail(regEmail.trim());
    setCoachPassword(regPassword);
    setSport(regSport);

    const success = loginCoach(regEmail.trim(), regPassword);
    if (!success) {
      setError('Kunne ikke logge inn etter registrering. Prøv igjen.');
    }
  };

  const resetToLogin = () => {
    setIsRegistering(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-[100dvh] bg-[#060c18] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽🏋️</div>
          <h1 className="text-2xl font-black mb-1"
            style={{ background: 'linear-gradient(100deg,#38bdf8,#34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TAKTIKKBOARD
          </h1>
          <p className="text-[11px] text-[#4a6080]">Taktikk og kommunikasjon for lagidretter</p>
        </div>

        {/* Registreringsskjema */}
        {isRegistering ? (
          <form onSubmit={handleRegister}
            className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
            
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-100">✨ Registrer nytt lag</h2>
              <button
                type="button"
                onClick={resetToLogin}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-[#1e3050] text-[#4a6080] hover:text-white transition"
              >
                ← Tilbake
              </button>
            </div>

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
        ) : (
          /* Innloggingsskjema */
          <div className="space-y-4">
            {/* Trener-innlogging */}
            <form onSubmit={handleCoachLogin}
              className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
              <h2 className="text-base font-bold text-slate-100 mb-5">🏋️ Trener-innlogging</h2>
              
              <div className="mb-4">
                <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                  E-post
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              {error && <ErrBox msg={error} />}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-50 min-h-[52px] transition"
              >
                {loading ? 'Logger inn...' : 'Logg inn som trener'}
              </button>
              
              <p className="text-[10px] text-[#3a5070] mt-3 text-center">
                Standard: {coachEmail} / {coachPassword}
              </p>
            </form>

            {/* Spiller-innlogging */}
            <form onSubmit={handlePlayerLogin}
              className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
              <h2 className="text-base font-bold text-slate-100 mb-5">👤 Spiller-innlogging</h2>
              
              <div className="mb-4">
                <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                  E-post
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                  placeholder="ola@spiller.no"
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
              
              {error && <ErrBox msg={error} />}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-50 min-h-[52px] transition"
              >
                {loading ? 'Logger inn...' : 'Logg inn som spiller'}
              </button>
              
              {playersWithEmail.length > 0 && (
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
                setIsRegistering(true);
                setError('');
                setEmail('');
                setPassword('');
              }}
              className="w-full py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 transition min-h-[52px]"
            >
              ✨ Nytt lag? Registrer deg her
            </button>
          </div>
        )}
      </div>

      <style>{`
        .lg-inp { display:block; width:100%; background:#111c30; border:1px solid #1e3050;
          border-radius:10px; padding:13px 16px; color:#e2e8f0; font-size:14px;
          box-sizing:border-box; min-height:52px; }
        .lg-inp:focus { outline:none; border-color:#38bdf8; }
      `}</style>
    </div>
  );
};

const ErrBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[12px] text-red-400">
    {msg}
  </div>
);