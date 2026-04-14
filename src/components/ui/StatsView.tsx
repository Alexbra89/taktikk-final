'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { PlayerProfile } from '@/components/player-portal/PlayerProfile';
import { ROLE_META } from '@/data/roleInfo';

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
  attendance: number;
  totalTrainings: number;
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
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);

  // Last statistikk fra localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taktikkboard_match_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMatchStats(parsed);
      } catch (e) {
        console.error('Kunne ikke laste statistikk', e);
      }
    }
  }, []);

  // Lagre statistikk
  useEffect(() => {
    if (matchStats.length > 0) {
      localStorage.setItem('taktikkboard_match_stats', JSON.stringify(matchStats));
    }
  }, [matchStats]);

  const trainings = useMemo(() =>
    events.filter(e => e.type === 'training').sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  );
  const matches = useMemo(() =>
    events.filter(e => e.type === 'match').sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  );

  // ═══════════════════════════════════════════════════════════════
  //  SESONGSTATISTIKK – V-U-T, MÅLFORSKJELL, POENG, FORM
  // ═══════════════════════════════════════════════════════════════
  const seasonStats = useMemo(() => {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    const formArray: ('V' | 'U' | 'T')[] = [];
    
    // Sorter kamper kronologisk (eldste først) for form-beregning
    const chronologicalMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date));
    
    chronologicalMatches.forEach(match => {
      if (!match.result) return;
      
      // Parse resultat (f.eks. "3-1")
      const parts = match.result.split('-').map(n => parseInt(n.trim(), 10));
      if (parts.length !== 2) return;
      
      const [score1, score2] = parts;
      
      // Anta at hjemmelaget alltid er listet først i resultatet
      // Treneren må manuelt sørge for at resultatet skrives som "Våre mål - Deres mål"
      const ourGoals = score1;
      const theirGoals = score2;
      
      goalsFor += ourGoals;
      goalsAgainst += theirGoals;
      
      if (ourGoals > theirGoals) {
        wins++;
        formArray.push('V');
      } else if (ourGoals < theirGoals) {
        losses++;
        formArray.push('T');
      } else {
        draws++;
        formArray.push('U');
      }
    });
    
    const points = wins * 3 + draws;
    const goalDifference = goalsFor - goalsAgainst;
    const formString = formArray.slice(-5).join(' · ');
    
    return { wins, draws, losses, goalsFor, goalsAgainst, goalDifference, points, formArray, formString };
  }, [matches]);

  const phase = phases[activePhaseIdx] ?? phases[0];
  const homePlayers = (phase?.players ?? []).filter((p: any) => p.team === 'home');

  // ALLE spillere (fra playerAccounts + board)
  const allClubPlayers = useMemo(() => {
    const result: Array<{ id: string; name: string; num?: number; role?: string; minutesPlayed: number }> = [];
    
    (playerAccounts as any[]).filter((a: any) => a.team === 'home').forEach((acc: any) => {
      const bp = homePlayers.find((p: any) => p.id === acc.playerId);
      result.push({
        id: acc.playerId,
        name: acc.name,
        num: bp?.num,
        role: bp?.role,
        minutesPlayed: bp?.minutesPlayed ?? 0,
      });
    });
    
    homePlayers.forEach((p: any) => {
      if (!result.find(r => r.id === p.id)) {
        result.push({ id: p.id, name: p.name || `#${p.num}`, num: p.num, role: p.role, minutesPlayed: p.minutesPlayed ?? 0 });
      }
    });
    return result;
  }, [playerAccounts, homePlayers]);

  // Fremmøte data
  const attendanceData = useMemo(() => {
    const map: Record<string, { attended: number; total: number; name: string; number: number }> = {};
    allClubPlayers.forEach(p => {
      map[p.id] = {
        attended: 0,
        total: trainings.length,
        name: p.name,
        number: p.num ?? 0,
      };
    });
    trainings.forEach(training => {
      training.trainingNotes.forEach(note => {
        note.targetPlayerIds?.forEach(playerId => {
          if (map[playerId]) map[playerId].attended++;
        });
      });
    });
    return map;
  }, [allClubPlayers, trainings]);

  // Statistikk for hver spiller
  const playerStats = useMemo(() => {
    const statsMap: Record<string, PlayerStats> = {};

    allClubPlayers.forEach((p: any) => {
      statsMap[p.id] = {
        playerId: p.id,
        playerName: p.name,
        playerNumber: p.num ?? 0,
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: p.minutesPlayed,
        attendance: attendanceData[p.id]?.attended || 0,
        totalTrainings: trainings.length,
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
  }, [allClubPlayers, matchStats, attendanceData, trainings.length]);

  const myStats = myPlayerId ? playerStats.find(s => s.playerId === myPlayerId) : null;
  const myAttendance = myPlayerId ? attendanceData[myPlayerId] : null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrainings = trainings.filter(e => e.date >= today).length;
  const completedTrainings = trainings.filter(e => e.date < today).length;

  const addMatchStats = (matchId: string, playerId: string, stats: { goals: number; assists: number; yellowCards: number; redCards: number; minutesPlayed: number }) => {
    setMatchStats(prevStats => {
      const existingMatchIndex = prevStats.findIndex(m => m.matchId === matchId);
      
      if (existingMatchIndex !== -1) {
        const updatedStats = [...prevStats];
        const match = updatedStats[existingMatchIndex];
        const existingStatIndex = match.stats.findIndex(s => s.playerId === playerId);
        
        if (existingStatIndex !== -1) {
          match.stats[existingStatIndex].goals += stats.goals;
          match.stats[existingStatIndex].assists += stats.assists;
          match.stats[existingStatIndex].yellowCards += stats.yellowCards;
          match.stats[existingStatIndex].redCards += stats.redCards;
          match.stats[existingStatIndex].minutesPlayed = stats.minutesPlayed;
        } else {
          match.stats.push({ playerId, ...stats });
        }
        return updatedStats;
      } else {
        const match = matches.find(m => m.id === matchId);
        if (match) {
          return [...prevStats, {
            matchId,
            matchTitle: match.title,
            date: match.date,
            opponent: match.opponent || 'Ukjent',
            result: match.result || '0-0',
            stats: [{ playerId, ...stats }],
          }];
        }
        return prevStats;
      }
    });
    setShowStatForm(false);
  };

  const topScorers = playerStats.filter(s => s.goals > 0).slice(0, 5);
  const topAssists = playerStats.filter(s => s.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 5);
  const selectedPlayer = selectedPlayerId ? playerStats.find(s => s.playerId === selectedPlayerId) : null;

  // Hent ut valgt spiller for profil
  const selectedPlayerForProfile = selectedPlayerId ? allClubPlayers.find(p => p.id === selectedPlayerId) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060c18]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <h2 className="text-sm font-black text-slate-100">
          📊 Statistikk — {homeTeamName || 'Laget'}
        </h2>
        {!isCoach && myStats && (
          <p className="text-[10px] text-[#4a6080] mt-0.5">Du ser kun din egen statistikk</p>
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

      {/* Tabs */}
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
            onClick={() => {
              setTab(id as 'overview' | 'attendance' | 'playtime' | 'goals' | 'player');
              setShowPlayerProfile(false);
              if (id !== 'player') setSelectedPlayerId(null);
            }}
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
            {/* V-U-T Statistikk */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-400">{seasonStats.wins}</div>
                <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mt-1">Seire (V)</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-amber-400">{seasonStats.draws}</div>
                <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mt-1">Uavgjort (U)</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-red-400">{seasonStats.losses}</div>
                <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mt-1">Tap (T)</div>
              </div>
            </div>

            {/* Målforskjell og Poeng */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-black text-sky-400">
                  {seasonStats.goalsFor}-{seasonStats.goalsAgainst}
                </div>
                <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mt-1">
                  Målforskjell {seasonStats.goalDifference > 0 ? '+' : ''}{seasonStats.goalDifference}
                </div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-black text-purple-400">{seasonStats.points}</div>
                <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mt-1">Poeng</div>
              </div>
            </div>

            {/* Form-graf */}
            {seasonStats.formArray.length > 0 && (
              <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-4">
                <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
                  📈 Form (siste 5 kamper)
                </div>
                <div className="flex items-center justify-center gap-2">
                  {seasonStats.formArray.slice(-5).map((result, idx) => {
                    const colors = {
                      'V': 'bg-emerald-500 text-white',
                      'U': 'bg-amber-500 text-white',
                      'T': 'bg-red-500 text-white',
                    };
                    return (
                      <div
                        key={idx}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${colors[result]}`}
                      >
                        {result}
                      </div>
                    );
                  })}
                  {seasonStats.formArray.length === 0 && (
                    <span className="text-[11px] text-[#4a6080]">Ingen kamper spilt</span>
                  )}
                </div>
                {seasonStats.formArray.length > 0 && (
                  <div className="text-center text-[10px] text-[#4a6080] mt-3">
                    {seasonStats.formString}
                  </div>
                )}
              </div>
            )}

            {/* Kortstatistikk - Treninger/Kamper */}
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

            {/* Toppscorer og Assists */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">⚽ Toppscorer</div>
                {topScorers.length > 0 ? (
                  topScorers.map((s, i) => (
                    <div 
                      key={s.playerId} 
                      onClick={() => { setSelectedPlayerId(s.playerId); setTab('player'); setShowPlayerProfile(false); }}
                      className="flex items-center justify-between py-1 border-b border-[#1e3050] last:border-0 cursor-pointer hover:bg-[#111c30] transition"
                    >
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
                    <div 
                      key={s.playerId} 
                      onClick={() => { setSelectedPlayerId(s.playerId); setTab('player'); setShowPlayerProfile(false); }}
                      className="flex items-center justify-between py-1 border-b border-[#1e3050] last:border-0 cursor-pointer hover:bg-[#111c30] transition"
                    >
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
              {matches.slice(0, 5).map(match => {
                const matchStat = matchStats.find(ms => ms.matchId === match.id);
                
                // Beregn resultattype (V/U/T) for visning
                let resultType: 'V' | 'U' | 'T' | null = null;
                if (match.result) {
                  const parts = match.result.split('-').map(n => parseInt(n.trim(), 10));
                  if (parts.length === 2) {
                    const [our, their] = parts;
                    if (our > their) resultType = 'V';
                    else if (our < their) resultType = 'T';
                    else resultType = 'U';
                  }
                }
                
                const resultColors = {
                  'V': 'text-emerald-400',
                  'U': 'text-amber-400',
                  'T': 'text-red-400',
                };
                
                return (
                  <div key={match.id} className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[12px] font-bold text-slate-200">{match.title}</div>
                        <div className="text-[10px] text-[#4a6080]">
                          {new Date(match.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {match.opponent && ` · vs ${match.opponent}`}
                        </div>
                        {matchStat && matchStat.stats.length > 0 && (
                          <div className="text-[9px] text-emerald-400/70 mt-1">
                            📊 {matchStat.stats.reduce((sum, s) => sum + s.goals, 0)} mål, {matchStat.stats.reduce((sum, s) => sum + s.assists, 0)} assists
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {resultType && (
                          <span className={`text-[11px] font-bold ${resultColors[resultType]}`}>
                            ({resultType})
                          </span>
                        )}
                        <div className="text-[13px] font-bold text-slate-200">{match.result || '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {matches.length === 0 && (
                <p className="text-[12px] text-[#4a6080] italic text-center py-4">Ingen kamper registrert</p>
              )}
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
                    onClick={() => { setSelectedPlayerId(s.playerId); setTab('player'); setShowPlayerProfile(false); }}
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
            {isCoach ? (
              <div className="space-y-2">
                <p className="text-[10px] text-[#4a6080] mb-4">
                  Fremmøte registreres via treningsnotater. ✅ markerer oppmøte.
                </p>
                {Object.values(attendanceData)
                  .sort((a, b) => b.attended - a.attended)
                  .map(data => {
                    const pct = data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0;
                    const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div 
                        key={data.name} 
                        onClick={() => {
                          const player = allClubPlayers.find(p => p.name === data.name);
                          if (player) { setSelectedPlayerId(player.id); setTab('player'); setShowPlayerProfile(false); }
                        }}
                        className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3 cursor-pointer hover:bg-[#111c30] transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-[12px] font-bold text-slate-200">{data.name}</div>
                            <div className="text-[9px] text-[#4a6080]">#{data.number}</div>
                          </div>
                          <div className="text-[11px] font-bold" style={{ color }}>
                            {data.attended}/{data.total} ({pct}%)
                          </div>
                        </div>
                        <div className="h-2 bg-[#1e3050] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : myAttendance ? (
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 text-center">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">Ditt fremmøte</div>
                <div className="text-3xl font-black text-slate-100 mb-1">
                  {myAttendance.attended}/{myAttendance.total}
                </div>
                <div className="text-[12px] text-[#4a6080]">
                  {myAttendance.total > 0 ? `${Math.round((myAttendance.attended / myAttendance.total) * 100)}% oppmøte` : 'Ingen treninger registrert'}
                </div>
                {myAttendance.total > 0 && (
                  <div className="h-3 bg-[#1e3050] rounded-full overflow-hidden mt-3">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.round((myAttendance.attended / myAttendance.total) * 100)}%` }} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-[#4a6080] italic text-center py-8">Ingen fremmøtedata tilgjengelig.</p>
            )}
          </div>
        )}

        {/* ── SPILLETID ── */}
        {tab === 'playtime' && (
          <div className="max-w-2xl mx-auto">
            {isCoach ? (
              <div className="space-y-2">
                <p className="text-[10px] text-[#4a6080] mb-4">
                  Spilletid registreres via Smart Coach under kamp eller manuelt i spillereditoren.
                </p>
                {[...allClubPlayers]
                  .sort((a, b) => b.minutesPlayed - a.minutesPlayed)
                  .map(p => {
                    const min = p.minutesPlayed;
                    const color = min > 60 ? '#22c55e' : min > 30 ? '#f59e0b' : '#64748b';
                    const maxMin = Math.max(...allClubPlayers.map(pl => pl.minutesPlayed), 1);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => { setSelectedPlayerId(p.id); setTab('player'); setShowPlayerProfile(false); }}
                        className="flex items-center gap-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3 cursor-pointer hover:bg-[#111c30] transition"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                          style={{ background: color }}>
                          {p.num ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-slate-200 truncate">{p.name}</div>
                          <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden mt-1.5">
                            <div className="h-full rounded-full" style={{ width: `${(min / maxMin) * 100}%`, background: color }} />
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-right w-14 flex-shrink-0" style={{ color }}>
                          {min > 0 ? `${min} min` : '—'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 text-center">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">Din spilletid</div>
                <div className="text-3xl font-black text-slate-100">{myStats?.minutesPlayed ?? 0} min</div>
                {(myStats?.minutesPlayed ?? 0) === 0 && (
                  <p className="text-[11px] text-[#4a6080] mt-2">Ingen spilletid registrert ennå.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SPILLERPROFILER (trener) ── */}
        {tab === 'player' && isCoach && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100">👤 Spillere i laget</h3>
              <span className="text-[10px] text-[#4a6080]">{allClubPlayers.length} spillere</span>
            </div>
            
            {selectedPlayerId && selectedPlayerForProfile ? (
              <>
                <button 
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-4 flex items-center gap-1"
                >
                  ‹ Tilbake til oversikt
                </button>
                <PlayerProfile playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
              </>
            ) : (
              <div className="space-y-2">
                {allClubPlayers.map(player => {
                  const playerStatsData = playerStats.find(s => s.playerId === player.id);
                  const account = playerAccounts.find((a: any) => a.playerId === player.id);
                  
                  return (
                    <div 
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] cursor-pointer hover:border-sky-500/50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 bg-gradient-to-br from-sky-500 to-emerald-500">
                        {player.num || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-slate-200 truncate">{player.name}</div>
                        <div className="text-[10px] text-[#4a6080] flex flex-wrap gap-2 mt-0.5">
                          <span>{ROLE_META[player.role as keyof typeof ROLE_META]?.label || player.role}</span>
                          {account?.height && <span>📏 {account.height} cm</span>}
                          {account?.weight && <span>⚖️ {account.weight} kg</span>}
                          {account?.preferredFoot && (
                            <span>
                              {account.preferredFoot === 'left' && '👈 Venstre'}
                              {account.preferredFoot === 'right' && '👉 Høyre'}
                              {account.preferredFoot === 'both' && '🤝 Begge'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {playerStatsData && (
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-emerald-400">{playerStatsData.goals} mål</div>
                            <div className="text-[9px] text-[#4a6080]">{playerStatsData.assists} assists</div>
                          </div>
                        )}
                        <span className="text-[#4a6080] text-[14px]">›</span>
                      </div>
                    </div>
                  );
                })}
                
                {allClubPlayers.length === 0 && (
                  <p className="text-[12px] text-[#4a6080] italic text-center py-8">
                    Ingen spillere registrert ennå.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REGISTRER STATISTIKK MODAL ── */}
      {showStatForm && isCoach && (
        <StatRegistrationModal
          matches={matches}
          players={allClubPlayers.map(p => ({
            id: p.id,
            name: p.name,
            number: p.num ?? 0,
          }))}
          onSave={(matchId, playerId, stats) => addMatchStats(matchId, playerId, stats)}
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
    setGoals(0);
    setAssists(0);
    setYellowCards(0);
    setRedCards(0);
    setMinutesPlayed(90);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#1e3050]">
          <h3 className="text-sm font-bold text-slate-200">✏️ Registrer kampstatistikk</h3>
          <button onClick={onClose} className="text-[#4a6080] hover:text-slate-300 text-xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">Kamp</label>
            <select value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)} className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500" required>
              {matches.map(m => <option key={m.id} value={m.id}>{m.title} ({new Date(m.date).toLocaleDateString('nb-NO')})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">Spiller</label>
            <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500" required>
              <option value="">Velg spiller...</option>
              {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">⚽ Mål</label>
              <input type="number" min="0" max="10" value={goals} onChange={e => setGoals(parseInt(e.target.value) || 0)} className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">🎯 Målgivende</label>
              <input type="number" min="0" max="10" value={assists} onChange={e => setAssists(parseInt(e.target.value) || 0)} className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">🟨 Gule kort</label>
              <input type="number" min="0" max="2" value={yellowCards} onChange={e => setYellowCards(parseInt(e.target.value) || 0)} className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">🟥 Røde kort</label>
              <input type="number" min="0" max="1" value={redCards} onChange={e => setRedCards(parseInt(e.target.value) || 0)} className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1">⏱ Spilte minutter</label>
              <input type="number" min="0" max="120" value={minutesPlayed} onChange={e => setMinutesPlayed(parseInt(e.target.value) || 0)} className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 transition">Lagre statistikk</button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[13px] hover:text-slate-300">Avbryt</button>
          </div>
        </form>
      </div>
    </div>
  );
};