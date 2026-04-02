'use client';
import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// ═══════════════════════════════════════════════════════════════
//  TYPER FOR STATISTIKK
// ═══════════════════════════════════════════════════════════════

export interface PlayerStats {
  playerId: string;
  playerName: string;
  playerNumber: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

export interface MatchStats {
  matchId: string;
  matchTitle: string;
  date: string;
  opponent: string;
  result: string;
  stats: {
    playerId: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════
//  STATISTIKK VIEW
// ═══════════════════════════════════════════════════════════════

export const StatsView: React.FC = () => {
  const { currentUser, events, playerAccounts, phases, activePhaseIdx, homeTeamName, sport } = useAppStore();
  const isCoach = currentUser?.role === 'coach';
  const myPlayerId = currentUser?.playerId;

  const [tab, setTab] = useState<'overview' | 'attendance' | 'playtime' | 'goals' | 'player'>('overview');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showStatForm, setShowStatForm] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // All events
  const trainings = useMemo(() =>
    events.filter(e => e.type === 'training').sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  );
  const matches = useMemo(() =>
    events.filter(e => e.type === 'match').sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  );

  const phase = phases[activePhaseIdx] ?? phases[0];
  const homePlayers = (phase?.players ?? []).filter((p: any) => p.team === 'home');

  // Hent lagrede statistikker fra localStorage
  const [matchStats, setMatchStats] = useState<MatchStats[]>(() => {
    const saved = localStorage.getItem('taktikkboard_match_stats');
    return saved ? JSON.parse(saved) : [];
  });

  // Beregn totalstatistikk for hver spiller
  const playerStats = useMemo(() => {
    const statsMap: Record<string, PlayerStats> = {};

    homePlayers.forEach((p: any) => {
      const acc = playerAccounts.find((a: any) => a.playerId === p.id);
      statsMap[p.id] = {
        playerId: p.id,
        playerName: acc?.name || p.name || `#${p.num}`,
        playerNumber: p.num,
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: p.minutesPlayed || 0,
      };
    });

    matchStats.forEach(match => {
      match.stats.forEach(stat => {
        if (statsMap[stat.playerId]) {
          statsMap[stat.playerId].matchesPlayed++;
          statsMap[stat.playerId].goals += stat.goals;
          statsMap[stat.playerId].assists += stat.assists;
          statsMap[stat.playerId].yellowCards += stat.yellowCards;
          statsMap[stat.playerId].redCards += stat.redCards;
          statsMap[stat.playerId].minutesPlayed += stat.minutesPlayed;
        }
      });
    });

    return Object.values(statsMap).sort((a, b) => b.goals - a.goals);
  }, [homePlayers, playerAccounts, matchStats]);

  // Finn spillerens egne statistikker
  const myStats = myPlayerId ? playerStats.find(s => s.playerId === myPlayerId) : null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrainings = trainings.filter(e => e.date >= today).length;
  const completedTrainings = trainings.filter(e => e.date < today).length;

  // Legg til statistikk for en kamp
  const addMatchStats = (matchId: string, playerId: string, stats: { goals: number; assists: number; yellowCards: number; redCards: number; minutesPlayed: number }) => {
    const existingMatch = matchStats.find(m => m.matchId === matchId);
    
    if (existingMatch) {
      const existingStat = existingMatch.stats.find(s => s.playerId === playerId);
      if (existingStat) {
        existingStat.goals += stats.goals;
        existingStat.assists += stats.assists;
        existingStat.yellowCards += stats.yellowCards;
        existingStat.redCards += stats.redCards;
        existingStat.minutesPlayed = stats.minutesPlayed;
      } else {
        existingMatch.stats.push({ playerId, ...stats });
      }
      setMatchStats([...matchStats]);
    } else {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const newMatchStats: MatchStats = {
          matchId,
          matchTitle: match.title,
          date: match.date,
          opponent: match.opponent || 'Ukjent',
          result: match.result || '0-0',
          stats: [{ playerId, ...stats }],
        };
        setMatchStats([...matchStats, newMatchStats]);
      }
    }
    
    localStorage.setItem('taktikkboard_match_stats', JSON.stringify(matchStats));
    setShowStatForm(false);
    setSelectedMatchId(null);
  };

  // Hent toppscorere (top 5)
  const topScorers = playerStats.filter(s => s.goals > 0).slice(0, 5);
  const topAssists = playerStats.filter(s => s.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 5);

  const selectedPlayer = selectedPlayerId ? playerStats.find(s => s.playerId === selectedPlayerId) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060c18]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <h2 className="text-sm font-black text-slate-100">
          📊 Statistikk — {homeTeamName || 'Laget'}
        </h2>
        {!isCoach && myStats && (
          <p className="text-[10px] text-[#4a6080] mt-0.5">
            Du ser kun din egen statistikk
          </p>
        )}
        {isCoach && (
          <button
            onClick={() => setShowStatForm(true)}
            className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/25 transition"
          >
            ✏️ Registrer kampstatistikk
          </button>
        )}
      </div>

      {/* Tabs - Fikset type-feil */}
      <div className="flex-shrink-0 flex border-b border-[#1e3050] bg-[#0c1525] overflow-x-auto">
        {([
          ['overview', '📋 Oversikt'],
          ['goals', '⚽ Mål & Assists'],
          ['attendance', '✅ Fremmøte'],
          ['playtime', '⏱ Spilletid'],
          ...(isCoach ? [['player', '👤 Spiller']] : []),
        ] as const).map(([id, label]) => (
          <button 
            key={id} 
            onClick={() => setTab(id as 'overview' | 'attendance' | 'playtime' | 'goals' | 'player')}
            className={`px-3 py-3 text-[11px] font-semibold transition-all min-h-[44px] whitespace-nowrap
              ${tab === id ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── OVERSIKT ── */}
        {tab === 'overview' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Nøkkeltall */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Treninger totalt', value: trainings.length, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                { label: 'Gjennomført', value: completedTrainings, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { label: 'Kommende', value: upcomingTrainings, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { label: 'Kamper', value: matches.length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-[#4a6080] mt-1 font-semibold uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Toppscorer og assists */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">⚽ Toppscorer</div>
                {topScorers.length > 0 ? (
                  topScorers.map((s, i) => (
                    <div key={s.playerId} className="flex items-center justify-between py-1 border-b border-[#1e3050] last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#4a6080]">#{i + 1}</span>
                        <span className="text-[11px] text-slate-200">{s.playerName}</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400">{s.goals} mål</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-[#4a6080] italic">Ingen mål registrert</p>
                )}
              </div>
              <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">🎯 Flest assists</div>
                {topAssists.length > 0 ? (
                  topAssists.map((s, i) => (
                    <div key={s.playerId} className="flex items-center justify-between py-1 border-b border-[#1e3050] last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#4a6080]">#{i + 1}</span>
                        <span className="text-[11px] text-slate-200">{s.playerName}</span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-400">{s.assists} assists</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-[#4a6080] italic">Ingen assists registrert</p>
                )}
              </div>
            </div>

            {/* Siste kamper */}
            <div>
              <h3 className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">📅 Siste kamper</h3>
              {matches.slice(0, 5).map(match => (
                <div key={match.id} className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-bold text-slate-200">{match.title}</div>
                      <div className="text-[10px] text-[#4a6080]">
                        {new Date(match.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {match.opponent && ` · vs ${match.opponent}`}
                      </div>
                    </div>
                    <div className="text-[13px] font-bold text-red-400">{match.result || '0-0'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MÅL & ASSISTS (Full tabell) ── */}
        {tab === 'goals' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] overflow-hidden">
              <div className="grid grid-cols-5 gap-2 p-3 bg-[#0c1525] border-b border-[#1e3050] text-[9px] font-bold text-[#4a6080] uppercase tracking-wider">
                <div className="col-span-2">Spiller</div>
                <div className="text-center">⚽ Mål</div>
                <div className="text-center">🎯 Assist</div>
                <div className="text-center">🟨🟥</div>
              </div>
              {isCoach ? (
                playerStats.map(s => (
                  <div 
                    key={s.playerId} 
                    onClick={() => { setSelectedPlayerId(s.playerId); setTab('player'); }}
                    className="grid grid-cols-5 gap-2 p-3 border-b border-[#1e3050] hover:bg-[#111c30] cursor-pointer transition"
                  >
                    <div className="col-span-2">
                      <div className="text-[12px] font-bold text-slate-200">{s.playerName}</div>
                      <div className="text-[9px] text-[#4a6080]">#{s.playerNumber}</div>
                    </div>
                    <div className="text-center text-[13px] font-bold text-emerald-400 self-center">{s.goals}</div>
                    <div className="text-center text-[13px] font-bold text-sky-400 self-center">{s.assists}</div>
                    <div className="text-center text-[11px] text-amber-400 self-center">
                      {s.yellowCards > 0 && <span>🟨{s.yellowCards} </span>}
                      {s.redCards > 0 && <span>🟥{s.redCards}</span>}
                      {s.yellowCards === 0 && s.redCards === 0 && <span className="text-[#4a6080]">-</span>}
                    </div>
                  </div>
                ))
              ) : myStats ? (
                <div className="p-4 text-center">
                  <div className="text-3xl font-black text-emerald-400 mb-1">{myStats.goals}</div>
                  <div className="text-[10px] text-[#4a6080] mb-3">MÅL</div>
                  <div className="text-3xl font-black text-sky-400 mb-1">{myStats.assists}</div>
                  <div className="text-[10px] text-[#4a6080]">ASSISTS</div>
                  {(myStats.yellowCards > 0 || myStats.redCards > 0) && (
                    <div className="mt-3 text-amber-400 text-[11px]">
                      {myStats.yellowCards > 0 && <span>🟨 {myStats.yellowCards} </span>}
                      {myStats.redCards > 0 && <span>🟥 {myStats.redCards}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[#4a6080] italic text-center py-8">Ingen statistikk tilgjengelig.</p>
              )}
            </div>
          </div>
        )}

        {/* ── FREMMØTE ── */}
        {tab === 'attendance' && (
          <div className="max-w-2xl mx-auto">
            <p className="text-[12px] text-[#4a6080] text-center py-8">Fremmøte-statistikk vises her</p>
          </div>
        )}

        {/* ── SPILLETID ── */}
        {tab === 'playtime' && (
          <div className="max-w-2xl mx-auto">
            <p className="text-[12px] text-[#4a6080] text-center py-8">Spilletid-statistikk vises her</p>
          </div>
        )}

        {/* ── SPILLERDETALJ (trener) ── */}
        {tab === 'player' && selectedPlayer && isCoach && (
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={() => setSelectedPlayerId(null)}
              className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-4 flex items-center gap-1"
            >
              ‹ Tilbake til oversikt
            </button>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-black text-white">#{selectedPlayer.playerNumber}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-1">{selectedPlayer.playerName}</h3>
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="bg-[#0f1a2a] rounded-xl p-2">
                  <div className="text-2xl font-black text-emerald-400">{selectedPlayer.goals}</div>
                  <div className="text-[9px] text-[#4a6080]">Mål</div>
                </div>
                <div className="bg-[#0f1a2a] rounded-xl p-2">
                  <div className="text-2xl font-black text-sky-400">{selectedPlayer.assists}</div>
                  <div className="text-[9px] text-[#4a6080]">Assists</div>
                </div>
                <div className="bg-[#0f1a2a] rounded-xl p-2">
                  <div className="text-2xl font-black text-amber-400">{selectedPlayer.matchesPlayed}</div>
                  <div className="text-[9px] text-[#4a6080]">Kamper</div>
                </div>
                <div className="bg-[#0f1a2a] rounded-xl p-2">
                  <div className="text-2xl font-black text-indigo-400">{Math.floor(selectedPlayer.minutesPlayed / 90)}</div>
                  <div className="text-[9px] text-[#4a6080]">Hele kamper</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── REGISTRER STATISTIKK MODAL (trener) ── */}
      {showStatForm && isCoach && (
        <StatRegistrationModal
          matches={matches}
          players={homePlayers.map(p => {
            const acc = playerAccounts.find((a: any) => a.playerId === p.id);
            return {
              id: p.id,
              name: acc?.name || p.name || `#${p.num}`,
              number: p.num,
            };
          })}
          onSave={(matchId, playerId, stats) => {
            addMatchStats(matchId, playerId, stats);
          }}
          onClose={() => setShowStatForm(false)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  STATISTIKK-REGISTRERING MODAL
// ═══════════════════════════════════════════════════════════════

interface StatRegistrationModalProps {
  matches: any[];
  players: { id: string; name: string; number: number }[];
  onSave: (matchId: string, playerId: string, stats: any) => void;
  onClose: () => void;
}

const StatRegistrationModal: React.FC<StatRegistrationModalProps> = ({ matches, players, onSave, onClose }) => {
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [yellowCards, setYellowCards] = useState(0);
  const [redCards, setRedCards] = useState(0);
  const [minutesPlayed, setMinutesPlayed] = useState(90);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !selectedPlayerId) {
      alert('Velg både kamp og spiller');
      return;
    }
    onSave(selectedMatchId, selectedPlayerId, { goals, assists, yellowCards, redCards, minutesPlayed });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#1e3050]">
          <h3 className="text-sm font-bold text-slate-200">✏️ Registrer kampstatistikk</h3>
          <button onClick={onClose} className="text-[#4a6080] hover:text-slate-300 text-xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Velg kamp */}
          <div>
            <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">Kamp</label>
            <select
              value={selectedMatchId}
              onChange={e => setSelectedMatchId(e.target.value)}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              required
            >
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} ({new Date(m.date).toLocaleDateString('nb-NO')})
                </option>
              ))}
            </select>
          </div>

          {/* Velg spiller */}
          <div>
            <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">Spiller</label>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">Velg spiller...</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
              ))}
            </select>
          </div>

          {/* Statistikkfelter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">⚽ Mål</label>
              <input
                type="number"
                min="0"
                max="10"
                value={goals}
                onChange={e => setGoals(parseInt(e.target.value) || 0)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">🎯 Målgivende</label>
              <input
                type="number"
                min="0"
                max="10"
                value={assists}
                onChange={e => setAssists(parseInt(e.target.value) || 0)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">🟨 Gule kort</label>
              <input
                type="number"
                min="0"
                max="2"
                value={yellowCards}
                onChange={e => setYellowCards(parseInt(e.target.value) || 0)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">🟥 Røde kort</label>
              <input
                type="number"
                min="0"
                max="1"
                value={redCards}
                onChange={e => setRedCards(parseInt(e.target.value) || 0)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">⏱ Spilte minutter</label>
              <input
                type="number"
                min="0"
                max="120"
                value={minutesPlayed}
                onChange={e => setMinutesPlayed(parseInt(e.target.value) || 0)}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 transition"
            >
              Lagre statistikk
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[13px] hover:text-slate-300"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};