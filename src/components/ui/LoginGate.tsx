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
      <div style={{ 
        minHeight: '100vh', 
        background: '#060c18', 
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚽🏋️</div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '900', 
              background: 'linear-gradient(100deg,#38bdf8,#34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '4px'
            }}>
              TAKTIKKBOARD
            </h1>
            <p style={{ fontSize: '11px', color: '#4a6080' }}>Opprett nytt lag</p>
          </div>

          <form onSubmit={handleRegister} style={{ 
            background: '#0c1525', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #1e3050'
          }}>
            
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              style={{
                marginBottom: '16px',
                fontSize: '11px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #1e3050',
                background: 'transparent',
                color: '#4a6080',
                cursor: 'pointer'
              }}
            >
              ← Tilbake til innlogging
            </button>

            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '20px' }}>✨ Registrer nytt lag</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4a6080', display: 'block', marginBottom: '6px' }}>
                Ditt navn (trener)
              </label>
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111c30',
                  border: '1px solid #1e3050',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
                placeholder="Ola Nordmann"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4a6080', display: 'block', marginBottom: '6px' }}>
                Lagnavn
              </label>
              <input
                type="text"
                value={regTeamName}
                onChange={e => setRegTeamName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111c30',
                  border: '1px solid #1e3050',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
                placeholder="Sotra SK"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4a6080', display: 'block', marginBottom: '6px' }}>
                E-post (innlogging)
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111c30',
                  border: '1px solid #1e3050',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
                placeholder="trener@lag.no"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4a6080', display: 'block', marginBottom: '6px' }}>
                Passord
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111c30',
                  border: '1px solid #1e3050',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
                placeholder="Minst 4 tegn"
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4a6080', display: 'block', marginBottom: '6px' }}>
                Sport
              </label>
              <select
                value={regSport}
                onChange={e => setRegSport(e.target.value as any)}
                style={{
                  width: '100%',
                  background: '#111c30',
                  border: '1px solid #1e3050',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="football">⚽ Fotball 11er</option>
                <option value="football7">⚽ Fotball 7er (barn)</option>
                <option value="handball">🤾 Håndball</option>
              </select>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', fontSize: '12px', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ✨ Opprett lag og logg inn
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#060c18', 
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚽🏋️</div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '900', 
            background: 'linear-gradient(100deg,#38bdf8,#34d399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '4px'
          }}>
            TAKTIKKBOARD
          </h1>
          <p style={{ fontSize: '11px', color: '#4a6080' }}>Taktikk og kommunikasjon for lagidretter</p>
        </div>

        {/* Velg innloggingstype */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setLoginType('coach'); setError(''); setEmail(''); setPassword(''); }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: loginType === 'coach' ? 'rgba(14,165,233,0.2)' : '#0c1525',
              border: loginType === 'coach' ? '1px solid rgba(14,165,233,0.3)' : '1px solid #1e3050',
              color: loginType === 'coach' ? '#38bdf8' : '#4a6080',
              cursor: 'pointer'
            }}
          >
            🏋️ Trener
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('player'); setError(''); setEmail(''); setPassword(''); }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: loginType === 'player' ? 'rgba(14,165,233,0.2)' : '#0c1525',
              border: loginType === 'player' ? '1px solid rgba(14,165,233,0.3)' : '1px solid #1e3050',
              color: loginType === 'player' ? '#38bdf8' : '#4a6080',
              cursor: 'pointer'
            }}
          >
            👤 Spiller
          </button>
        </div>

        {/* Innloggingsskjema */}
        <form onSubmit={handleLogin} style={{ 
          background: '#0c1525', 
          borderRadius: '16px', 
          padding: '24px',
          border: '1px solid #1e3050'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '20px' }}>
            {loginType === 'coach' ? '🏋️ Trener-innlogging' : '👤 Spiller-innlogging'}
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4a6080', display: 'block', marginBottom: '6px' }}>
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: '#111c30',
                border: '1px solid #1e3050',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#e2e8f0',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
              placeholder={loginType === 'coach' ? 'trener@lag.no' : 'ola@spiller.no'}
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#4a6080', display: 'block', marginBottom: '6px' }}>
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                background: '#111c30',
                border: '1px solid #1e3050',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#e2e8f0',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', fontSize: '12px', color: '#f87171' }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(14,165,233,0.15)',
              border: '1px solid rgba(14,165,233,0.3)',
              color: '#38bdf8',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Logger inn...' : `Logg inn som ${loginType === 'coach' ? 'trener' : 'spiller'}`}
          </button>

          {loginType === 'coach' && (
            <p style={{ fontSize: '10px', color: '#3a5070', marginTop: '12px', textAlign: 'center' }}>
              Standard: {coachEmail} / {coachPassword}
            </p>
          )}

          {loginType === 'player' && playersWithEmail.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e3050' }}>
              <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#3a5070', marginBottom: '8px' }}>
                Spillere i laget
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {playersWithEmail.slice(0, 6).map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEmail(p.email)}
                    style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '999px',
                      background: '#111c30',
                      border: '1px solid #1e3050',
                      color: '#4a6080',
                      cursor: 'pointer'
                    }}
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
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          ✨ Nytt lag? Registrer deg her
        </button>
      </div>
    </div>
  );
};