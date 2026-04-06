'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  Trophy, 
  Users, 
  Mail, 
  Lock, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  UserPlus, 
  Layout,
  ChevronDown
} from 'lucide-react';

export const LoginGate: React.FC = () => {
  const {
    loginCoach,
    loginPlayer,
    setHomeTeamName,
    setCoachEmail,
    setCoachPassword,
    setSport,
    setAgeGroup,
    coachEmail,
    coachPassword,
    syncFromSupabase,
  } = useAppStore();

  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'coach' | 'player'>('coach');

  // Registrerings-states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTeamName, setRegTeamName] = useState('');
  const [regSport, setRegSport] = useState<'football' | 'football7' | 'handball'>('football');
  const [regAgeGroup, setRegAgeGroup] = useState<'youth' | 'adult'>('adult');

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
        setError(loginType === 'coach' ? 'Feil e-post eller passord.' : 'Feil e-post eller passord. Spør treneren.');
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taktikkboard-v7');
      }
      
      setHomeTeamName(regTeamName.trim());
      setCoachEmail(regEmail.trim());
      setCoachPassword(regPassword);
      setSport(regSport);
      setAgeGroup(regAgeGroup);

      setTimeout(() => {
        syncFromSupabase();
      }, 100);

      const success = loginCoach(regEmail.trim(), regPassword);
      if (!success) setError('Registrert, men innlogging feilet');
    } catch {
      setError('Noe gikk galt under registrering');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#060c18] overflow-y-auto px-4 py-10">
      {/* Bakgrunns-effekter */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-emerald-500 p-[1px] mb-6 shadow-2xl">
            <div className="w-full h-full bg-[#08101e] rounded-[23px] flex items-center justify-center">
              <TacticLogoIcon />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            TAKTIKK<span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">BOARD</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">Profesjonell styring for ditt lag</p>
        </div>

        <div className="bg-[#0c1525]/80 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-8 shadow-2xl">
          {showRegister ? (
            /* --- REGISTRERINGSSKJEMA --- */
            <form onSubmit={handleRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Tilbake til innlogging
              </button>

              <div className="space-y-4">
                <InputGroup label="Ditt navn" icon={<Users className="w-5 h-5" />} value={regName} onChange={setRegName} placeholder="Eks: Ola Nordmann" />
                <InputGroup label="Lagnavn" icon={<Layout className="w-5 h-5" />} value={regTeamName} onChange={setRegTeamName} placeholder="Eks: Bergen SK" />
                <InputGroup label="E-post" type="email" icon={<Mail className="w-5 h-5" />} value={regEmail} onChange={setRegEmail} placeholder="navn@klubb.no" />
                <InputGroup label="Passord" type="password" icon={<Lock className="w-5 h-5" />} value={regPassword} onChange={setRegPassword} placeholder="••••••••" />
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Velg Sport</label>
                   <div className="relative group">
                     <select 
                        value={regSport} 
                        onChange={e => setRegSport(e.target.value as any)}
                        className="w-full bg-[#060c18] border border-slate-800 rounded-2xl py-4 px-4 text-slate-200 focus:outline-none focus:border-sky-500/50 appearance-none transition-all"
                     >
                       <option value="football">Fotball 11er</option>
                       <option value="football7">Fotball 7er</option>
                       <option value="handball">Håndball</option>
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Aldersgruppe</label>
                  <div className="flex gap-2">
                    <ToggleButton active={regAgeGroup === 'adult'} onClick={() => setRegAgeGroup('adult')} label="Voksen" color="sky" />
                    <ToggleButton active={regAgeGroup === 'youth'} onClick={() => setRegAgeGroup('youth')} label="Barn/Junior" color="emerald" />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

              <button type="submit" disabled={loading} className="pro-btn pro-btn-emerald mt-4 w-full">
                {loading ? 'Oppretter...' : '✨ Opprett lag og logg inn'}
              </button>
            </form>
          ) : (
            /* --- INNLOGGINGSSKJEMA --- */
            <>
              <div className="flex p-1 bg-[#060c18] rounded-2xl mb-8 border border-slate-800">
                <RoleButton active={loginType === 'coach'} onClick={() => setLoginType('coach')} label="Trener" icon={<Trophy className="w-4 h-4" />} />
                <RoleButton active={loginType === 'player'} onClick={() => setLoginType('player')} label="Spiller" icon={<Users className="w-4 h-4" />} />
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <InputGroup label="E-post" type="email" icon={<Mail className="w-5 h-5" />} value={email} onChange={setEmail} placeholder="navn@klubb.no" />
                <InputGroup label="Passord" type="password" icon={<Lock className="w-5 h-5" />} value={password} onChange={setPassword} placeholder="••••••••" />
                
                {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

                <button type="submit" disabled={loading} className="pro-btn pro-btn-sky w-full">
                  {loading ? 'Logger inn...' : `Logg inn som ${loginType === 'coach' ? 'trener' : 'spiller'}`}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </form>

              <button 
                onClick={() => setShowRegister(true)}
                className="w-full mt-8 py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-sm font-bold transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Nytt lag? Registrer deg her
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .pro-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; border-radius: 1rem; font-weight: 900;
          transition: all 0.2s ease; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .pro-btn:active { transform: scale(0.98); }
        .pro-btn-sky { background: #0ea5e9; color: white; }
        .pro-btn-sky:hover { background: #38bdf8; box-shadow: 0 0 20px rgba(14, 165, 233, 0.3); }
        .pro-btn-emerald { background: #10b981; color: white; }
        .pro-btn-emerald:hover { background: #34d399; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
      `}</style>
    </div>
  );
};

/* --- HJELPEKOMPONENTER FOR RYDDIGERE KODE --- */

const TacticLogoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" className="fill-sky-400" />
  </svg>
);

const InputGroup = ({ label, icon, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#060c18] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 transition-all"
        required
      />
    </div>
  </div>
);

const RoleButton = ({ active, onClick, label, icon }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
      active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon} {label}
  </button>
);

const ToggleButton = ({ active, onClick, label, color }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase border transition-all ${
      active 
        ? `bg-${color}-500/20 border-${color}-500 text-${color}-400` 
        : 'border-slate-800 text-slate-500 hover:text-slate-300'
    }`}
  >
    {label}
  </button>
);