'use client';

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  Trophy, 
  Users, 
  Mail, 
  Lock, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  Layout,
  ClipboardList
} from 'lucide-react';

// ─── TYPER ───────────────────────────────────────────────────

interface InputGroupProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

interface RoleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color: 'sky' | 'emerald';
}

// ─── SUB-KOMPONENTER ─────────────────────────────────────────

// Bruk forwardRef for å kunne sende ref til input
const InputGroup = forwardRef<HTMLInputElement, InputGroupProps>(
  ({ label, icon, value, onChange, type = "text", placeholder, autoFocus }, ref) => (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors">
          {icon}
        </div>
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-[#060c18] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 transition-all"
          required
        />
      </div>
    </div>
  )
);

InputGroup.displayName = 'InputGroup';

const RoleButton = ({ active, onClick, label, icon }: RoleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon} {label}
  </button>
);

const ToggleButton = ({ active, onClick, label, color }: ToggleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
      active 
        ? `${color === 'sky' ? 'bg-sky-500 border-sky-500' : 'bg-emerald-500 border-emerald-500'} text-white` 
        : 'border-slate-800 text-slate-500 hover:text-slate-300'
    }`}
  >
    {label}
  </button>
);

// ─── HOVED-KOMPONENT ─────────────────────────────────────────

export const LoginGate: React.FC = () => {
  const {
    loginCoach,
    loginPlayer,
    setHomeTeamName,
    setCoachEmail,
    setCoachPassword,
    setSport,
    setAgeGroup,
    syncFromSupabase,
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
  const [regSport, setRegSport] = useState<'football' | 'football9' | 'football7' | 'handball'>('football');
  const [regAgeGroup, setRegAgeGroup] = useState<'youth' | 'adult'>('adult');

  // Refs for autoFocus
  const emailInputRef = useRef<HTMLInputElement>(null);
  const regNameInputRef = useRef<HTMLInputElement>(null);

  // Auto-fokus ved switching mellom login/register
  useEffect(() => {
    if (!showRegister && emailInputRef.current) {
      emailInputRef.current.focus();
    }
    if (showRegister && regNameInputRef.current) {
      regNameInputRef.current.focus();
    }
  }, [showRegister]);

  // Keyboard shortcut (Enter for login)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showRegister && e.key === 'Enter' && !loading && email && password) {
        handleLogin(e as any);
      }
    };
    window.addEventListener('keypress', handleKey);
    return () => window.removeEventListener('keypress', handleKey);
  }, [showRegister, loading, email, password, loginType]);

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
    if (!regName.trim() || !regEmail.trim() || !regTeamName.trim() || regPassword.length < 6) {
      return setError('Vennligst fyll ut alle felt korrekt. Passord må være minst 6 tegn.');
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taktikkboard-v7');
      }
      setHomeTeamName(regTeamName.trim());
      setCoachEmail(regEmail.trim());
      setCoachPassword(regPassword);
      setSport(regSport);
      setAgeGroup(regAgeGroup);
      setTimeout(() => syncFromSupabase(), 100);
      const success = loginCoach(regEmail.trim(), regPassword);
      if (!success) setError('Registrert, men innlogging feilet');
    } catch {
      setError('Noe gikk galt under registrering');
    }
  };

  const handleForgotPassword = () => {
    alert('Kontakt administrator for å tilbakestille passord. 📧');
  };

  // Spinner-komponent
  const Spinner = () => (
    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  return (
    <div className="min-h-screen w-full bg-[#060c18] relative overflow-x-hidden flex flex-col items-center">
      
      {/* Bakgrunnsglow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md px-4 pt-16 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="relative inline-flex mb-8">
            <div className="absolute inset-0 bg-sky-500/30 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-sky-400 via-sky-500 to-emerald-500 p-[3px] shadow-[0_0_40px_rgba(14,165,233,0.3)]">
              <div className="w-full h-full bg-[#08101e] rounded-[calc(2.5rem-3px)] flex items-center justify-center">
                <ClipboardList className="w-12 h-12 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter text-white mb-3">
            TAKTIKK<span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">BOARD</span>
          </h1>
          <p className="text-slate-400 font-semibold text-sm tracking-widest uppercase opacity-80">Pro Dashboard</p>
        </div>

        {/* Hovedpanel */}
        <div className="bg-[#0c1525]/90 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
          {showRegister ? (
            // ─── REGISTRERING ─────────────────────────────────
            <form onSubmit={handleRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition mb-6"
              >
                <ArrowLeft className="w-4 h-4" /> Tilbake
              </button>

              <div className="space-y-4">
                <InputGroup 
                  label="Ditt navn" 
                  icon={<Users className="w-5 h-5" />} 
                  value={regName} 
                  onChange={setRegName} 
                  placeholder="Trenerens navn"
                  autoFocus={true}
                  ref={regNameInputRef}
                />
                <InputGroup label="Lagnavn" icon={<Layout className="w-5 h-5" />} value={regTeamName} onChange={setRegTeamName} placeholder="Eks: Brann IL" />
                <InputGroup label="E-post" type="email" icon={<Mail className="w-5 h-5" />} value={regEmail} onChange={setRegEmail} placeholder="din@epost.no" />
                <InputGroup label="Passord" type="password" icon={<Lock className="w-5 h-5" />} value={regPassword} onChange={setRegPassword} placeholder="•••••••• (min 6 tegn)" />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Velg Sport</label>
                  <select 
                    value={regSport} 
                    onChange={e => setRegSport(e.target.value as any)}
                    className="w-full bg-[#060c18] border border-slate-800 rounded-2xl py-4 px-4 text-slate-200 focus:outline-none focus:border-sky-500/50 appearance-none transition-all"
                  >
                    <option value="football">Fotball 11er</option>
                    <option value="football9">Fotball 9er</option>
                    <option value="football7">Fotball 7er</option>
                    <option value="handball">Håndball</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Aldersgruppe</label>
                  <div className="flex gap-2">
                    <ToggleButton active={regAgeGroup === 'adult'} onClick={() => setRegAgeGroup('adult')} label="Voksen" color="sky" />
                    <ToggleButton active={regAgeGroup === 'youth'} onClick={() => setRegAgeGroup('youth')} label="Barn" color="emerald" />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs font-bold text-center mt-4">{error}</p>}

              <button type="submit" disabled={loading} className="pro-btn pro-btn-emerald mt-6 w-full">
                {loading ? <Spinner /> : '✨ Kom i gang'}
              </button>
            </form>
          ) : (
            // ─── INNLOGGING ───────────────────────────────────
            <>
              <div className="flex p-1 bg-[#060c18] rounded-2xl mb-8 border border-slate-800">
                <RoleButton active={loginType === 'coach'} onClick={() => setLoginType('coach')} label="Trener" icon={<Trophy className="w-4 h-4" />} />
                <RoleButton active={loginType === 'player'} onClick={() => setLoginType('player')} label="Spiller" icon={<Users className="w-4 h-4" />} />
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <InputGroup 
                  label="E-post" 
                  type="email" 
                  icon={<Mail className="w-5 h-5" />} 
                  value={email} 
                  onChange={setEmail} 
                  placeholder="Skriv din e-post"
                  autoFocus={true}
                  ref={emailInputRef}
                />
                <InputGroup label="Passord" type="password" icon={<Lock className="w-5 h-5" />} value={password} onChange={setPassword} placeholder="••••••••" />
                
                {/* Glemt passord lenke - fungerende */}
                <div className="text-right">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] text-slate-500 hover:text-sky-400 transition"
                  >
                    Glemt passord?
                  </button>
                </div>

                {error && <p className="text-red-400 text-xs font-bold text-center mt-2">{error}</p>}

                <button type="submit" disabled={loading} className="pro-btn pro-btn-sky w-full mt-4 shadow-xl shadow-sky-500/20">
                  {loading ? (
                    <Spinner />
                  ) : (
                    <>
                      Logg inn som {loginType === 'coach' ? 'trener' : 'spiller'}
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-[#0c1525] px-4 text-slate-500 font-bold">Ny bruker?</span>
                </div>
              </div>

              <button 
                onClick={() => setShowRegister(true)}
                className="w-full py-4 rounded-2xl border border-emerald-500/20 bg-emerald-400/5 hover:bg-emerald-400/10 text-emerald-400 text-sm font-bold transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Registrer ditt lag her
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .pro-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem;
          padding: 1.1rem;
          border-radius: 1.25rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.85rem;
          transition: all 0.25s ease;
          border: none;
          cursor: pointer;
        }
        .pro-btn:active { transform: scale(0.96); }
        .pro-btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed;
          transform: none;
        }
        .pro-btn-sky { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; }
        .pro-btn-emerald { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
      `}</style>
    </div>
  );
};