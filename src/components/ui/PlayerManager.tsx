'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';

// ═══════════════════════════════════════════════════════════════
//  SPILLERADMIN — Trener legger til/fjerner spillere
//  Vises som egen fane på mobil og i PlayerPortal på PC
// ═══════════════════════════════════════════════════════════════

export const PlayerManager: React.FC = () => {
  const {
    playerAccounts, addPlayerAccount, removePlayerAccount,
    updatePlayerAccount, sport, phases, activePhaseIdx,
  } = useAppStore();

  const [name, setName]     = useState('');
  const [pin, setPin]       = useState('');
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError]   = useState('');

  const roles = getRolesForSport(sport);
  const phase = phases[activePhaseIdx] ?? phases[0];
  const boardPlayers = (phase?.players ?? []).filter((p: any) => p.team === 'home');

  // Filter accounts by search
  const accounts = (playerAccounts as any[]).filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const create = () => {
    setError('');
    
    if (!name.trim()) {
      setError('Fyll inn navn');
      return;
    }
    
    if (pin.length !== 4) {
      setError('PIN må være 4 siffer');
      return;
    }
    
    if (!email.trim()) {
      setError('Fyll inn e-post');
      return;
    }
    
    if (!password.trim() || password.length < 4) {
      setError('Passord må være minst 4 tegn');
      return;
    }
    
    const success = addPlayerAccount({
      name: name.trim(),
      pin,
      email: email.trim(),
      password: password.trim(),
      playerId: playerId || `player-${Date.now()}`,
      team: 'home',
    });
    
    if (success) {
      setName(''); setPin(''); setEmail(''); setPassword(''); setPlayerId('');
      setError('');
    } else {
      setError('E-post er allerede i bruk');
    }
  };

  const roleLabel = (r: string) => ROLE_META[r as keyof typeof ROLE_META]?.label ?? r;
  const roleColor = (r: string) => ROLE_META[r as keyof typeof ROLE_META]?.color ?? '#555';

  // Get board player's role for display
  const getPlayerRole = (acc: any) => {
    const bp = boardPlayers.find((p: any) => p.id === acc.playerId);
    return bp?.role ?? null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <h2 className="text-sm font-black text-slate-100">👥 Spilleradmin</h2>
        <p className="text-[10px] text-[#4a6080] mt-0.5">
          Legg til spillere med e-post + passord for innlogging
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Legg til ny spiller ── */}
        <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-4">
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-4">
            ＋ Legg til spiller
          </div>

          {/* Navn */}
          <div className="mb-3">
            <SmLabel>Navn *</SmLabel>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ola Nordmann"
              className="pm-inp" />
          </div>

          {/* E-post (obligatorisk nå) */}
          <div className="mb-3">
            <SmLabel>E-post (brukes til innlogging) *</SmLabel>
            <input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="ola@spiller.no"
              className="pm-inp" />
          </div>

          {/* Passord */}
          <div className="mb-3">
            <SmLabel>Passord (min 4 tegn) *</SmLabel>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="pm-inp" />
          </div>

          {/* PIN (behold for bakoverkompatibilitet) */}
          <div className="mb-3">
            <SmLabel>PIN-kode (4 siffer) *</SmLabel>
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4} placeholder="••••" type="password" inputMode="numeric"
              className="pm-inp" />
            {pin.length > 0 && pin.length < 4 && (
              <p className="text-[10px] text-amber-400 mt-1">{4 - pin.length} siffer til</p>
            )}
          </div>

          {/* Koble til brett-posisjon */}
          <div className="mb-4">
            <SmLabel>Posisjon på brettet (valgfritt)</SmLabel>
            <select value={playerId} onChange={e => setPlayerId(e.target.value)} className="pm-inp">
              <option value="">– Ingen kobling –</option>
              {boardPlayers.map((p: any) => {
                const meta = ROLE_META[p.role as keyof typeof ROLE_META];
                return (
                  <option key={p.id} value={p.id}>
                    #{p.num} {p.name || 'Navnløs'} — {meta?.label ?? p.role}
                  </option>
                );
              })}
            </select>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[11px] text-red-400">
              {error}
            </div>
          )}

          <button onClick={create}
            disabled={!name.trim() || pin.length !== 4 || !email.trim() || password.length < 4}
            className="w-full py-3 rounded-xl bg-sky-500/15 border border-sky-500/30
              text-sky-400 font-bold text-[13px] hover:bg-sky-500/25
              disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] transition">
            ✓ Legg til spiller
          </button>
        </div>

        {/* ── Spillerliste ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest">
              Registrerte spillere ({(playerAccounts as any[]).length})
            </div>
            <div className="flex-1" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Søk..." className="bg-[#111c30] border border-[#1e3050] rounded-lg
                px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 w-24" />
          </div>

          {accounts.length === 0 && (
            <p className="text-[12px] text-[#4a6080] italic text-center py-6">
              {search ? 'Ingen treff.' : 'Ingen spillere registrert ennå.'}
            </p>
          )}

          <div className="space-y-2">
            {accounts.map((acc: any) => {
              const bpRole = getPlayerRole(acc);
              const bp = boardPlayers.find((p: any) => p.id === acc.playerId);
              return (
                <div key={acc.id}
                  className="flex items-center gap-3 p-3 bg-[#0c1525] rounded-xl border border-[#1e3050]">
                  {/* Rolle-sirkel */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center
                    text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: bpRole ? roleColor(bpRole) : '#3b82f6' }}>
                    {bp?.num ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    {editId === acc.id ? (
                      <EditRow acc={acc} onDone={() => setEditId(null)} />
                    ) : (
                      <>
                        <div className="text-[12.5px] font-bold text-slate-200 truncate">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-[#4a6080]">
                          E-post: {acc.email || '—'} · PIN: {acc.pin}
                          {bpRole && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                              style={{ background: roleColor(bpRole) + '20', color: roleColor(bpRole) }}>
                              {roleLabel(bpRole)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditId(editId === acc.id ? null : acc.id)}
                      className="text-[#4a6080] hover:text-sky-400 px-2 min-h-[36px] text-[12px]">
                      ✎
                    </button>
                    <button onClick={() => removePlayerAccount(acc.id)}
                      className="text-red-400/50 hover:text-red-400 px-2 min-h-[36px] text-sm">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .pm-inp { display:block; width:100%; background:#111c30; border:1px solid #1e3050;
          border-radius:8px; padding:10px 12px; color:#e2e8f0; font-size:13px;
          box-sizing:border-box; min-height:44px; }
        .pm-inp:focus { outline:none; border-color:#38bdf8; }
      `}</style>
    </div>
  );
};

const SmLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest mb-1.5">
    {children}
  </div>
);

const EditRow: React.FC<{ acc: any; onDone: () => void }> = ({ acc, onDone }) => {
  const { updatePlayerAccount } = useAppStore();
  const [name, setName] = useState(acc.name);
  const [pin, setPin]   = useState(acc.pin);
  const [email, setEmail] = useState(acc.email || '');
  const [password, setPassword] = useState('');
  
  return (
    <div className="flex flex-col gap-2">
      <input value={name} onChange={e => setName(e.target.value)}
        className="bg-[#111c30] border border-[#1e3050] rounded px-2 py-1.5
          text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[36px]" 
        placeholder="Navn" />
      <input value={email} onChange={e => setEmail(e.target.value)}
        className="bg-[#111c30] border border-[#1e3050] rounded px-2 py-1.5
          text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[36px]"
        placeholder="E-post" />
      <div className="flex gap-2">
        <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
          maxLength={4} placeholder="PIN" type="password"
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded px-2 py-1.5
            text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[36px]" />
        <input value={password} onChange={e => setPassword(e.target.value)}
          type="password" placeholder="Nytt passord"
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded px-2 py-1.5
            text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[36px]" />
      </div>
      <button onClick={() => {
        if (name.trim() && pin.length === 4) {
          const updates: any = { name: name.trim(), pin };
          if (email.trim()) updates.email = email.trim();
          if (password.trim() && password.length >= 4) updates.password = password.trim();
          updatePlayerAccount(acc.id, updates);
          onDone();
        }
      }} className="text-emerald-400 px-2 min-h-[36px] text-[12px] font-bold">✓ Lagre</button>
    </div>
  );
};