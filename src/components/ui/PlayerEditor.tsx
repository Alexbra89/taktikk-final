'use client';
import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLE_META, getRolesForSport } from '../../data/roleInfo';
import { Player } from '../../types';

interface PlayerEditorProps {
  playerId: string;
  phaseIdx: number;
  onClose: () => void;
}

export const PlayerEditor: React.FC<PlayerEditorProps> = ({ playerId, phaseIdx, onClose }) => {
  const { phases, sport, updatePlayerField, sendCoachMessage,
    setPlayerInjury, checkAndHealInjuries, togglePlayerOnField, currentUser } = useAppStore();

  // Auto-sjekk og hel skader når editoren åpnes
  useEffect(() => { checkAndHealInjuries(phaseIdx); }, []);

  const phase  = phases[phaseIdx];
  const player = phase?.players.find(p => p.id === playerId);
  const roles  = getRolesForSport(sport);

  if (!player) return null;

  const meta = ROLE_META[player.role] ?? ROLE_META['midfielder'];
  const upd  = (fields: Partial<Player>) => updatePlayerField(phaseIdx, playerId, fields);

  const getPlaytimeColor = (min: number) => {
    if (min > 60) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (min > 30) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl p-5 w-[400px] max-w-full max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0 relative"
            style={{ background: meta.color, border: `3px solid ${player.team==='home'?'white':'#1e293b'}` }}>
            {player.num}
            {player.injured && <span className="absolute -top-1 -right-1 text-sm">🩹</span>}
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-slate-100">{player.name || 'Navnløs'}</div>
            <div className="text-[11px] text-[#4a6080]">
              {meta.label} · {player.team==='home'?'Hjemmelag':'Bortelag'}
              {player.injured && <span className="ml-2 text-red-400 font-bold">SKADET</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl ml-auto">✕</button>
        </div>

        {/* Navn */}
        <Field label="SPILLERNAVN">
          <input value={player.name}
            onChange={e => upd({ name: e.target.value })}
            className="inp" />
        </Field>

        {/* Nummer */}
        <Field label="DRAKTNUMMER">
          <input type="number" value={player.num}
            onChange={e => upd({ num: Number(e.target.value) })}
            className="inp w-20" />
        </Field>

        {/* Rolle */}
        <Field label="ROLLE">
          <div className="flex flex-wrap gap-1.5">
            {roles.map(r => {
              const rm = ROLE_META[r]; if (!rm) return null;
              const sel = player.role === r;
              return (
                <button key={r} onClick={() => upd({ role: r })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all
                    ${sel ? 'text-white' : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}
                  style={sel ? { background: rm.color, borderColor: rm.border } : undefined}>
                  {rm.emoji} {rm.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* ── Skademodul ── */}
        <div className="bg-[#0f1a2a] rounded-xl p-3.5 border border-[#1e3050] mb-4">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">🩹 Skadestatus</div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setPlayerInjury(phaseIdx, playerId, !player.injured, player.injuryReturnDate)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all
                ${player.injured
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'border-[#1e3050] text-[#4a6080] hover:border-red-500/50 hover:text-red-400'}`}>
              {player.injured ? '🩹 Markert som skadet' : 'Marker som skadet'}
            </button>
            {player.injured && (
              <span className="text-[10px] text-[#4a6080]">Blir halvtransparent på banen</span>
            )}
          </div>
          {player.injured && (
            <label className="block">
              <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">FORVENTET RETUR</div>
              <input type="date" value={player.injuryReturnDate ?? ''}
                onChange={e => setPlayerInjury(phaseIdx, playerId, true, e.target.value)}
                className="inp"
                min={new Date().toISOString().slice(0,10)} />
              {player.injuryReturnDate && (
                <div className="text-[10.5px] text-[#4a6080] mt-1">
                  Retur: {new Date(player.injuryReturnDate + 'T12:00:00').toLocaleDateString('nb-NO', { weekday:'short', day:'numeric', month:'long' })}
                  {' · '}
                  <span className="text-amber-400">Auto-fjernes på returdato</span>
                </div>
              )}
            </label>
          )}
        </div>

        {/* ── Spilletid ── */}
        <div className="bg-[#0f1a2a] rounded-xl p-3.5 border border-[#1e3050] mb-4">
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">⏱ Spilletid</div>
          <div className="flex items-center justify-between mb-2">
            <div className={`px-3 py-1.5 rounded-lg text-[13px] font-black border ${getPlaytimeColor(player.minutesPlayed ?? 0)}`}>
              {player.minutesPlayed ?? 0} min
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => upd({ minutesPlayed: Math.max(0, (player.minutesPlayed ?? 0) - 10) })}
                className="w-7 h-7 rounded bg-[#1a2a3a] border border-[#1e3050] text-slate-300 text-sm hover:bg-[#1e3050]">－</button>
              <button onClick={() => upd({ minutesPlayed: (player.minutesPlayed ?? 0) + 10 })}
                className="w-7 h-7 rounded bg-[#1a2a3a] border border-[#1e3050] text-slate-300 text-sm hover:bg-[#1e3050]">＋</button>
              <button onClick={() => upd({ minutesPlayed: 0 })}
                className="px-2 h-7 rounded bg-[#1a2a3a] border border-[#1e3050] text-[#4a6080] text-[10px] hover:text-red-400">Null</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => togglePlayerOnField(phaseIdx, playerId)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all
                ${player.isOnField
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
              {player.isOnField ? '✅ På banen' : '⬜ Benken'}
            </button>
            <span className="text-[10px] text-[#3a5070]">Fargeindikator: 🟢 &lt;30m · 🟡 30-60m · 🔴 &gt;60m</span>
          </div>
        </div>

        {/* Trener-notat */}
        <Field label="TRENER-NOTAT">
          <textarea value={player.notes} rows={3}
            onChange={e => upd({ notes: e.target.value })}
            placeholder="Instruksjoner, observasjoner om spilleren..."
            className="inp resize-y leading-relaxed" />
        </Field>

        {/* Send melding til spiller */}
        {currentUser?.role === 'coach' && (
          <div className="mb-4">
            <div className="text-[9.5px] font-bold text-[#4a6080] uppercase tracking-widest mb-2">
              SEND MELDING TIL SPILLER
            </div>
            <MessageComposer playerId={playerId} />
          </div>
        )}

        {/* Rolleinfo */}
        <div className="bg-[#111c30] rounded-xl p-3.5 border border-[#1e3050]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{meta.emoji}</span>
            <span className="text-[13px] font-bold text-slate-200">{meta.label}</span>
          </div>
          <p className="text-[11.5px] text-[#7a9ab8] leading-relaxed mb-2">{meta.description}</p>
          <ul className="space-y-1">
            {meta.responsibilities.map((r, i) => (
              <li key={i} className="text-[11px] text-[#4a6080] flex gap-1.5">
                <span className="text-sky-500">·</span>{r}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 transition">
          ✓ Lagre og lukk
        </button>

        <style>{`.inp { width:100%; background:#111c30; border:1px solid #1e3050; border-radius:8px; padding:8px 11px; color:#e2e8f0; font-size:12.5px; box-sizing:border-box; } .inp:focus { outline:none; border-color:#38bdf8; }`}</style>
      </div>
    </div>
  );
};

const MessageComposer: React.FC<{ playerId: string }> = ({ playerId }) => {
  const [msg, setMsg] = React.useState('');
  const { sendCoachMessage } = useAppStore();
  const send = () => { if (!msg.trim()) return; sendCoachMessage(playerId, msg.trim()); setMsg(''); };
  return (
    <div className="flex gap-2">
      <input value={msg} onChange={e => setMsg(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder="Skriv melding til spiller..."
        className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12px] text-slate-300 focus:outline-none focus:border-sky-500" />
      <button onClick={send}
        className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[12px] font-bold">Send</button>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-4">
    <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest mb-1.5">{label}</div>
    {children}
  </div>
);
