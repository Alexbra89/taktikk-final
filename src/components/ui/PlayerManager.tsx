'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';
import { getSquadCapacity } from '@/data/formations';
import { PlayerProfile } from '@/components/player-portal/PlayerProfile';
import type { PlayerRole } from '@/types';

// FIX 2: Importerer PlayerProfile og viser den i modal ved klikk på spiller

export const PlayerManager: React.FC = () => {
  const {
    playerAccounts, addPlayerAccount, addPlayerWithAccount, seedTestSquad, removePlayerAccount,
    updatePlayerAccount, sport, phases, activePhaseIdx,
  } = useAppStore();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [newRole,  setNewRole]  = useState<PlayerRole>('midfielder');
  const [newNum,   setNewNum]   = useState('');
  const [editId,   setEditId]   = useState<string | null>(null);
  const [search,   setSearch]   = useState('');
  const [error,    setError]    = useState('');
  const [notice,   setNotice]   = useState('');

  // FIX 2: State for å vise spillerprofil
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);

  const phase        = phases[activePhaseIdx] ?? phases[0];
  const boardPlayers = (phase?.players ?? []).filter((p: any) => p.team === 'home');
  const { total: squadCapacity } = getSquadCapacity(sport);
  const squadIsFull = boardPlayers.length >= squadCapacity;

  const accounts = (playerAccounts as any[]).filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const roles = getRolesForSport(sport === 'football7' ? 'football' : sport);

  const create = () => {
    setError(''); setNotice('');
    if (!name.trim())                         { setError('Fyll inn navn'); return; }
    if (!email.trim())                        { setError('Fyll inn e-post'); return; }
    if (!password.trim() || password.length < 4) { setError('Passord må være minst 4 tegn'); return; }

    // Kobler til en eksisterende, ulinket spiller på brettet
    if (playerId) {
      const success = addPlayerAccount({
        name: name.trim(), email: email.trim(), password: password.trim(),
        pin: '', playerId, team: 'home',
      });
      if (success) { setName(''); setEmail(''); setPassword(''); setPlayerId(''); setError(''); }
      else         { setError('E-post er allerede i bruk'); }
      return;
    }

    // Oppretter en helt ny spiller – legges automatisk på benken i
    // aktiv fase med ledig draktnummer og valgt rolle.
    const result = addPlayerWithAccount({
      name: name.trim(), email: email.trim(), password: password.trim(),
      role: newRole, num: newNum ? parseInt(newNum, 10) : undefined,
    });

    if (!result.success) {
      if (result.reason === 'squad_full') {
        setError(`Stallen er full (${squadCapacity} spillere for denne idretten). Fjern en spiller før du legger til flere.`);
      } else if (result.reason === 'duplicate_email') {
        setError('E-post er allerede i bruk');
      } else {
        setError('Kunne ikke legge til spiller');
      }
      return;
    }

    setName(''); setEmail(''); setPassword(''); setNewNum(''); setNewRole('midfielder');
    setNotice(
      result.numberWasTaken
        ? `✓ ${name.trim()} lagt til på benken med draktnummer ${result.assignedNum} (ønsket nummer var opptatt).`
        : `✓ ${name.trim()} lagt til på benken med draktnummer ${result.assignedNum}.`
    );
  };

  const handleSeedTestSquad = () => {
    setError(''); setNotice('');
    const { added } = seedTestSquad();
    setNotice(added > 0
      ? `✓ La til ${added} testspiller${added === 1 ? '' : 'e'} (navn, konto og innlogging) på benken.`
      : 'Stallen har allerede maks antall spillere (minus én ledig plass) – ingen ble lagt til.');
  };

  const roleLabel = (r: string) => ROLE_META[r as keyof typeof ROLE_META]?.label ?? r;
  const roleColor = (r: string) => ROLE_META[r as keyof typeof ROLE_META]?.color ?? '#555';

  const getPlayerRole = (acc: any) => {
    const bp = boardPlayers.find((p: any) => p.id === acc.playerId);
    return bp?.role ?? null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0c1525] border-b border-[#1e3050] flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-slate-100">👥 Spilleradmin</h2>
          <p className="text-[9px] sm:text-[10px] text-[#4a6080] mt-0.5">
            Legg til spillere med e-post + passord for innlogging
          </p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleSeedTestSquad}
            title="Fyller stallen med testspillere (navn, draktnummer, rolle, konto) – beholder én ledig plass"
            className="flex-shrink-0 px-2.5 py-2 rounded-lg text-[9px] sm:text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition min-h-[36px]"
          >
            🧪 Seed testspillere
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-32 space-y-4 sm:space-y-5">

        {/* Legg til ny spiller */}
        <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="text-[9px] sm:text-[10px] font-bold text-sky-400 uppercase tracking-widest">
              ＋ Legg til spiller
            </div>
            <div className={`text-[9px] sm:text-[10px] font-bold ${squadIsFull ? 'text-red-400' : 'text-[#4a6080]'}`}>
              {boardPlayers.length}/{squadCapacity} i stallen
            </div>
          </div>

          <div className="mb-3">
            <SmLabel>Navn *</SmLabel>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ola Nordmann" className="pm-inp" />
          </div>
          <div className="mb-3">
            <SmLabel>E-post (brukes til innlogging) *</SmLabel>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ola@spiller.no" className="pm-inp" />
          </div>
          <div className="mb-3">
            <SmLabel>Passord (min 4 tegn) *</SmLabel>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pm-inp" />
          </div>
          <div className="mb-3">
            <SmLabel>Koble til eksisterende spiller på brettet (valgfritt)</SmLabel>
            <select value={playerId} onChange={e => setPlayerId(e.target.value)} className="pm-inp">
              <option value="">– Ingen kobling / ny spiller –</option>
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

          {!playerId && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <SmLabel>Rolle</SmLabel>
                <select value={newRole} onChange={e => setNewRole(e.target.value as PlayerRole)} className="pm-inp">
                  {roles.map(r => (
                    <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>
                  ))}
                </select>
              </div>
              <div>
                <SmLabel>Draktnummer (valgfritt)</SmLabel>
                <input type="number" min={1} value={newNum}
                  onChange={e => setNewNum(e.target.value.replace(/\D/g, ''))}
                  placeholder="Auto" className="pm-inp" />
              </div>
            </div>
          )}
          {!playerId && (
            <p className="text-[9px] sm:text-[10px] text-[#3a5070] -mt-2 mb-4">
              Legges automatisk på benken. Er nummeret opptatt, tildeles nærmeste ledige og du varsles om det.
            </p>
          )}

          {notice && (
            <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] sm:text-[11px] text-emerald-400">
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] sm:text-[11px] text-red-400">
              {error}
            </div>
          )}
          {!playerId && squadIsFull && !error && (
            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] sm:text-[11px] text-amber-400">
              ⚠️ Stallen er full ({squadCapacity} spillere for denne idretten) – fjern en spiller for å legge til flere.
            </div>
          )}

          <button
            onClick={create}
            disabled={!name.trim() || !email.trim() || password.length < 4 || (!playerId && squadIsFull)}
            className="w-full py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12px] sm:text-[13px]
              hover:bg-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] transition"
          >
            ✓ Legg til spiller
          </button>
        </div>

        {/* Spillerliste */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#3a5070] uppercase tracking-widest">
              Registrerte spillere ({(playerAccounts as any[]).length})
            </div>
            <div className="flex-1" />
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder="Søk..."
              className="bg-[#111c30] border border-[#1e3050] rounded-lg px-2 py-1.5 text-[11px] text-slate-300
                focus:outline-none focus:border-sky-500 w-24 sm:w-32 min-h-[36px]"
            />
          </div>

          {accounts.length === 0 && (
            <p className="text-[11px] sm:text-[12px] text-[#4a6080] italic text-center py-6">
              {search ? 'Ingen treff.' : 'Ingen spillere registrert ennå.'}
            </p>
          )}

          <div className="space-y-2">
            {accounts.map((acc: any) => {
              const bpRole = getPlayerRole(acc);
              const bp     = boardPlayers.find((p: any) => p.id === acc.playerId);
              return (
                <div key={acc.id}
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-[#0c1525] rounded-xl border border-[#1e3050]"
                >
                  {/* FIX 2: Klikk på avatar/navn åpner profil */}
                  <button
                    onClick={() => setProfilePlayerId(acc.playerId || acc.id)}
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                      text-[10px] sm:text-[11px] font-bold text-white flex-shrink-0 hover:ring-2 hover:ring-sky-500/50 transition-all"
                    style={{ background: bpRole ? roleColor(bpRole) : '#3b82f6' }}
                    title={bp?.injury ? 'Skadet – vis spillerprofil' : 'Vis spillerprofil'}
                  >
                    {bp?.num ?? '?'}
                    {bp?.injury && (
                      <span className="absolute -top-1 -right-1 text-[9px] leading-none">🩹</span>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editId === acc.id ? (
                      <EditRow acc={acc} onDone={() => setEditId(null)} />
                    ) : (
                      // FIX 2: Klikk på navn åpner også profil
                      <button
                        onClick={() => setProfilePlayerId(acc.playerId || acc.id)}
                        className="w-full text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="text-[11px] sm:text-[12.5px] font-bold text-slate-200 truncate">
                          {acc.name}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-[#4a6080]">
                          {acc.email || '—'}
                          {bpRole && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold"
                              style={{ background: roleColor(bpRole) + '20', color: roleColor(bpRole) }}>
                              {roleLabel(bpRole)}
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {/* FIX 2: Profilknapp */}
                    <button
                      onClick={() => setProfilePlayerId(acc.playerId || acc.id)}
                      className="text-[#4a6080] hover:text-sky-400 px-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[12px]"
                      title="Vis profil"
                    >
                      👤
                    </button>
                    <button
                      onClick={() => setEditId(editId === acc.id ? null : acc.id)}
                      className="text-[#4a6080] hover:text-sky-400 px-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[12px]"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => removePlayerAccount(acc.id)}
                      className="text-red-400/50 hover:text-red-400 px-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FIX 2: PlayerProfile-modal */}
      {profilePlayerId && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setProfilePlayerId(null)}
        >
          <div
            className="bg-[#0c1525] border border-[#1e3050] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md
              max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle / lukk-rad */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto sm:hidden" />
              <div className="hidden sm:block text-sm font-black text-slate-100">👤 Spillerprofil</div>
              <button
                onClick={() => setProfilePlayerId(null)}
                className="text-slate-400 hover:text-white text-xl min-h-[44px] px-2 transition ml-auto"
              >
                ✕
              </button>
            </div>
            <div className="px-2 pb-6">
              <PlayerProfile playerId={profilePlayerId} onClose={() => setProfilePlayerId(null)} readOnlyName={false} />
            </div>
          </div>
        </div>
      )}

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
  <div className="text-[8px] sm:text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest mb-1.5">
    {children}
  </div>
);

const EditRow: React.FC<{ acc: any; onDone: () => void }> = ({ acc, onDone }) => {
  const { updatePlayerAccount } = useAppStore();
  const [name,         setName]         = useState(acc.name);
  const [email,        setEmail]        = useState(acc.email || '');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Navn"
        className="bg-[#111c30] border border-[#1e3050] rounded px-2 py-2 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[40px]" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-post"
        className="bg-[#111c30] border border-[#1e3050] rounded px-2 py-2 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[40px]" />
      <div className="flex gap-2 items-center">
        <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Nytt passord (valgfritt)"
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded px-2 py-2 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[40px]" />
        <button type="button" onClick={() => setShowPassword(!showPassword)}
          className="text-[#4a6080] hover:text-sky-400 text-[12px] px-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      <button
        onClick={() => {
          if (name.trim()) {
            const updates: any = { name: name.trim() };
            if (email.trim()) updates.email = email.trim();
            if (password.trim() && password.length >= 4) updates.password = password.trim();
            updatePlayerAccount(acc.id, updates);
            onDone();
          }
        }}
        className="text-emerald-400 px-2 min-h-[44px] text-[12px] font-bold"
      >
        ✓ Lagre
      </button>
    </div>
  );
};
