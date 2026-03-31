'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const LoginGate: React.FC = () => {
  const store = useAppStore();
  const { 
    loginCoach, 
    loginPlayer, 
    playerAccounts, 
    registerNewTeam,
    sport: currentSport,
    loading: storeLoading
  } = store;

  const [mode, setMode] = useState<'coach' | 'player' | 'register'>('coach');
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

  // Hent spillere med e-post
  const playersWithEmail = (playerAccounts as any[]).filter((p: any) => p.email);

  const handleCoachLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = loginCoach(email, password);
      if (!success) {
        setError('Feil e-post eller passord. Prøv: trener@lag.no / trener123');
      }
    } catch (err) {
      setError('Innlogging feilet. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = loginPlayer(email, password);
      if (!success) {
        setError('Feil e-post eller passord. Spør treneren om innloggingsdetaljer.');
      }
    } catch (err) {
      setError('Innlogging feilet. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Sjekk om registerNewTeam finnes
    if (!registerNewTeam) {
      setError('Registreringsfunksjonen er ikke tilgjengelig. Vennligst kontakt utvikler.');
      setLoading(false);
      return;
    }
    
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regTeamName.trim()) {
      setError('Fyll ut alle felt');
      setLoading(false);
      return;
    }
    
    if (regPassword.length < 4) {
      setError('Passordet må være minst 4 tegn');
      setLoading(false);
      return;
    }
    
    try {
      const success = await registerNewTeam(regName, regEmail, regPassword, regSport);
      if (!success) {
        setError('E-post er allerede i bruk eller kunne ikke registrere lag');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Kunne ikke registrere lag. Sjekk at Supabase er koblet til.');
    } finally {
      setLoading(false);
    }
  };

  // Debug: Sjekk om registerNewTeam finnes
  console.log('registerNewTeam exists:', !!registerNewTeam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060c18] to-[#0a1220] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏋️⚽</div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            TAKTIKKBOARD
          </h1>
          <p className="text-[11px] text-[#4a6080] mt-2">Taktikk og kommunikasjon for lagidretter</p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-6 bg-[#0c1525] rounded-xl p-1 border border-[#1e3050]">
          <button
            onClick={() => { setMode('coach'); setError(''); }}
            className={`flex-1 py-3 rounded-lg text-[13px] font-bold transition-all min-h-[48px]
              ${mode === 'coach' 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'text-[#4a6080] hover:text-slate-300'}`}
          >
            🏋️ Trener
          </button>
          <button
            onClick={() => { setMode('player'); setError(''); }}
            className={`flex-1 py-3 rounded-lg text-[13px] font-bold transition-all min-h-[48px]
              ${mode === 'player' 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'text-[#4a6080] hover:text-slate-300'}`}
          >
            👤 Spiller
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-3 rounded-lg text-[13px] font-bold transition-all min-h-[48px]
              ${mode === 'register' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-[#4a6080] hover:text-slate-300'}`}
          >
            ✨ Nytt lag
          </button>
        </div>

        {/* Coach Login */}
        {mode === 'coach' && (
          <form onSubmit={handleCoachLogin} className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
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
            
            <div className="mb-5">
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
              disabled={loading || storeLoading}
              className="w-full py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-50 transition min-h-[48px]"
            >
              {loading ? 'Logger inn...' : 'Logg inn som trener'}
            </button>
            
            <div className="mt-4 text-center text-[10px] text-[#3a5070]">
              Standard: trener@lag.no / trener123
            </div>
          </form>
        )}

        {/* Player Login */}
        {mode === 'player' && (
          <form onSubmit={handlePlayerLogin} className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
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
            
            <div className="mb-5">
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
              disabled={loading || storeLoading}
              className="w-full py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-50 transition min-h-[48px]"
            >
              {loading ? 'Logger inn...' : 'Logg inn som spiller'}
            </button>
            
            {playersWithEmail.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#1e3050]">
                <div className="text-[9px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">
                  Eksisterende spillere
                </div>
                <div className="flex flex-wrap gap-2">
                  {playersWithEmail.slice(0, 5).map((player: any) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setEmail(player.email)}
                      className="text-[10px] px-2 py-1 rounded-full bg-[#111c30] border border-[#1e3050] text-[#4a6080] hover:text-sky-400 hover:border-sky-500/30 transition"
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-[#3a5070] mt-2">
                  Trykk på navnet for å fylle inn e-post. Spør treneren om passord.
                </p>
              </div>
            )}
          </form>
        )}

        {/* Register New Team */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="bg-[#0c1525] rounded-2xl p-6 border border-[#1e3050]">
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
              />
            </div>
            
            <div className="mb-4">
              <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                E-post (brukes som innlogging)
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
                placeholder="•••••••• (min 4 tegn)"
                required
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
            
            <div className="mb-5">
              <label className="text-[10px] font-bold text-[#4a6080] uppercase tracking-wider block mb-1.5">
                Sport
              </label>
              <select
                value={regSport}
                onChange={e => setRegSport(e.target.value as any)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="football">Fotball 11er</option>
                <option value="football7">Fotball 7er (barn)</option>
                <option value="handball">Håndball</option>
              </select>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[12px] text-red-400">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || storeLoading}
              className="w-full py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 disabled:opacity-50 transition min-h-[48px]"
            >
              {loading ? 'Oppretter...' : '✨ Opprett nytt lag'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};