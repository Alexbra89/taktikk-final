'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META } from '@/data/roleInfo';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from '@/components/board/pitches/FootballPitch';
import { HandballPitch } from '@/components/board/pitches/HandballPitch';

// ═══════════════════════════════════════════════════════════════
//  SPILLERHJEM – Det spilleren ser etter innlogging
//  Faner: Meldinger · Laguttak · Taktikk (SVG read-only) · Chat
// ═══════════════════════════════════════════════════════════════

const SPECIAL_LABELS: Record<string, string> = {
  captain:          '🪖 Kaptein',
  freekick:         '🎯 Frispark',
  penalty:          '⚽ Straffe',
  corner:           '🚩 Corner',
  throwin:          '🤾 Innkast',
  goalkeeper_kicks: '🧤 Keeperutspark',
};

const getMeta = (role: any) => ROLE_META[role as keyof typeof ROLE_META] ?? null;
const getNum  = (p: any): number => p.number ?? p.num ?? 0;

// ═══════════════════════════════════════════════════════════════
//  SVG READ-ONLY TACTIC BOARD — brukes av både spiller og trener
// ═══════════════════════════════════════════════════════════════
export const ReadOnlyTacticBoard: React.FC = () => {
  const { phases, sport } = useAppStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef  = useRef({ from: 0, t: 0 });

  const [activeIdx, setActiveIdx]   = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [playSpeed, setPlaySpeed]   = useState(1);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT, setInterpT]       = useState(0);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function startPlayback() {
    if (phases.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    playRef.current = { from: 0, t: 0 };
    setInterpFrom(0); setInterpT(0); setActiveIdx(0); setIsPlaying(true);
    timerRef.current = setInterval(() => {
      playRef.current.t += 0.025 * playSpeed;
      if (playRef.current.t >= 1) {
        const next = playRef.current.from + 1;
        if (next >= phases.length - 1) {
          clearInterval(timerRef.current!); timerRef.current = null;
          setIsPlaying(false); setActiveIdx(phases.length - 1); setInterpT(0);
          return;
        }
        playRef.current.from = next; playRef.current.t = 0;
        setInterpFrom(next); setInterpT(0); setActiveIdx(next);
      } else {
        setInterpT(playRef.current.t); setInterpFrom(playRef.current.from);
      }
    }, 30);
  }

  function stopPlayback() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsPlaying(false); setInterpT(0);
  }

  const phase = phases[activeIdx];
  if (!phase) return (
    <div className="flex-1 flex items-center justify-center text-[#4a6080]">
      <div className="text-center py-12">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-sm">Ingen taktikk tilgjengelig ennå.</p>
      </div>
    </div>
  );

  const displayPlayers = (() => {
    if (!isPlaying || interpT === 0) return phase.players;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.players;
    return (from.players as any[]).map((fp: any) => {
      const tp = (to.players as any[]).find((p: any) => p.id === fp.id);
      if (!tp) return fp;
      return { ...fp, position: {
        x: fp.position.x + (tp.position.x - fp.position.x) * interpT,
        y: fp.position.y + (tp.position.y - fp.position.y) * interpT,
      }};
    });
  })();

  const displayBall = (() => {
    if (!isPlaying || interpT === 0) return phase.ball;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.ball;
    return {
      x: from.ball.x + (to.ball.x - from.ball.x) * interpT,
      y: from.ball.y + (to.ball.y - from.ball.y) * interpT,
    };
  })();

  const progressFrac = phases.length > 1 ? (interpFrom + interpT) / (phases.length - 1) : 0;
  const homePlayers  = (displayPlayers as any[]).filter((p: any) => p.team === 'home');
  const bench        = (phase.players ?? []).filter((p: any) =>
    p.team === 'home' && (p.isStarter === false || p.isOnField === false)
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Read-only banner */}
      <div className="flex-shrink-0 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20
        flex items-center gap-2">
        <span className="text-amber-400 text-[11px]">🔒</span>
        <span className="text-[10.5px] text-amber-400/80">
          Read-only – du kan se men ikke endre taktikkbrettet
        </span>
      </div>

      {/* Fase-velger + spillekontroller */}
      <div className="flex-shrink-0 px-3 py-2 bg-[#0d1626] border-b border-[#1e3050]">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-[10px] font-bold text-[#4a6080] uppercase tracking-widest">Faser</span>
          {phases.map((ph: any, idx: number) => (
            <button key={ph.id}
              onClick={() => !isPlaying && setActiveIdx(idx)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-all min-h-[36px]
                ${activeIdx === idx
                  ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                  : 'border-[#1e3050] text-[#4a6080]'}
                ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {ph.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#111c30] rounded-lg px-2.5 py-1.5 border border-[#1e3050]">
            <button onClick={() => !isPlaying && setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={isPlaying || activeIdx === 0}
              className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[36px]">⏮</button>
            <button onClick={() => isPlaying ? stopPlayback() : startPlayback()}
              disabled={phases.length < 2}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border transition-all
                ${phases.length < 2
                  ? 'border-[#1e3050] text-[#334155] cursor-not-allowed'
                  : isPlaying
                    ? 'border-red-500 bg-red-500/15 text-red-400'
                    : 'border-sky-500 bg-sky-500/15 text-sky-400'}`}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={() => !isPlaying && setActiveIdx(Math.min(phases.length - 1, activeIdx + 1))}
              disabled={isPlaying || activeIdx === phases.length - 1}
              className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[36px]">⏭</button>
            <select value={playSpeed} onChange={e => setPlaySpeed(Number(e.target.value))}
              className="bg-transparent border-none text-[#4a6080] text-[11px] cursor-pointer ml-1">
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </div>
          {phases.length < 2 && (
            <span className="text-[10px] text-[#3a5070] italic">Trenger minst 2 faser for avspilling</span>
          )}
          {phase.stickyNote && (
            <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
              📌 {phase.stickyNote}
            </span>
          )}
        </div>
      </div>

      {/* SVG-bane — tar all tilgjengelig høyde */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-[#050c18]" style={{ padding: '6px' }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="max-w-full max-h-full rounded-xl touch-none select-none"
          style={{ width: '100%', height: '100%', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="ds2">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.6"/>
            </filter>
            <pattern id="gr2" patternUnits="userSpaceOnUse" width="50" height="50">
              <rect width="50" height="50" fill="#1b5e2a"/>
              <rect width="50" height="25" fill="#1d6430"/>
            </pattern>
          </defs>
          <rect width={VW} height={VH} fill="url(#gr2)"/>

          {(sport === 'football' || sport === 'football7') && <FootballPitch />}
          {sport === 'handball' && <HandballPitch />}

          {/* Tegninger med pilhoder */}
          {(phase.drawings ?? []).map((d: any) => (
            d.pts && d.pts.length >= 2 && (
              <g key={d.id}>
                <polyline
                  points={d.pts.map((p: any) => `${p.x},${p.y}`).join(' ')}
                  stroke={d.color ?? '#f87171'} strokeWidth={3} fill="none"
                  strokeLinecap="round" strokeLinejoin="round" />
                {(() => {
                  const pts = d.pts;
                  const p1 = pts[pts.length - 2];
                  const p2 = pts[pts.length - 1];
                  const a  = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                  const s  = 12;
                  return (
                    <polygon fill={d.color ?? '#f87171'} opacity={0.88}
                      points={`${p2.x},${p2.y} ${p2.x-s*Math.cos(a-Math.PI/6)},${p2.y-s*Math.sin(a-Math.PI/6)} ${p2.x-s*Math.cos(a+Math.PI/6)},${p2.y-s*Math.sin(a+Math.PI/6)}`}
                    />
                  );
                })()}
              </g>
            )
          ))}

          {/* Ball */}
          {displayBall && (
            <g filter="url(#ds2)">
              <circle cx={displayBall.x} cy={displayBall.y} r={11} fill="white" stroke="#ccc" strokeWidth={1}/>
              {[{dx:-3,dy:-3,r:3},{dx:3.5,dy:-1.5,r:2.5},{dx:0,dy:4,r:2.5},{dx:-4,dy:2,r:2}].map((o,i) => (
                <circle key={i} cx={displayBall.x+o.dx} cy={displayBall.y+o.dy} r={o.r} fill="#111" opacity={0.7}/>
              ))}
            </g>
          )}

          {/* Hjemmelag-spillere — kun visning, ingen drag */}
          {homePlayers.map((player: any) => {
            const meta = getMeta(player.role);
            const fill = meta?.color ?? '#64748b';
            const { x, y } = player.position;
            const isBench  = player.isStarter === false || player.isOnField === false;
            if (isBench) return null; // innbyttere vises nedenfor, ikke på banen
            return (
              <g key={player.id} filter="url(#ds2)" opacity={player.injured ? 0.5 : 1}>
                {(player.minutesPlayed ?? 0) > 0 && (
                  <circle cx={x} cy={y} r={24} fill="none"
                    stroke={(player.minutesPlayed ?? 0) > 60 ? '#ef4444' : (player.minutesPlayed ?? 0) > 30 ? '#f59e0b' : '#22c55e'}
                    strokeWidth={2} opacity={0.5} strokeDasharray="4 2" />
                )}
                <circle cx={x} cy={y} r={21} fill="rgba(255,255,255,0.9)"/>
                <circle cx={x} cy={y} r={18} fill={fill} stroke={fill} strokeWidth={1.5}/>
                {/* Kaptein-stjerne */}
                {(player.specialRoles ?? []).includes('captain') && (
                  <text x={x - 13} y={y - 13} fontSize={13} style={{ pointerEvents: 'none' }}>🪖</text>
                )}
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize={11} fontWeight="800"
                  fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
                  {player.num}
                </text>
                {player.name && (
                  <text x={x} y={y + 30} textAnchor="middle"
                    fill="white" fontSize={9} fontWeight="600"
                    fontFamily="system-ui, sans-serif"
                    style={{ pointerEvents: 'none' }}
                    paintOrder="stroke" stroke="rgba(0,0,0,0.75)" strokeWidth={3}>
                    {player.name.length > 9 ? player.name.slice(0, 9) + '…' : player.name}
                  </text>
                )}
                {player.injured && (
                  <text x={x - 10} y={y - 14} fontSize={12} style={{ pointerEvents: 'none' }}>🩹</text>
                )}
                <title>{meta?.label ?? player.role} · #{player.num} {player.name}</title>
              </g>
            );
          })}

          {/* Fremdriftsbar */}
          {isPlaying && (
            <rect x={32} y={VH - 14} rx={3} height={5}
              width={progressFrac * (VW - 64)} fill="#38bdf8" opacity={0.8}/>
          )}
        </svg>
      </div>

      {/* Rollelegende */}
      <div className="flex-shrink-0 px-3 py-1.5 bg-[#0d1626] border-t border-[#1e3050]">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries(ROLE_META).slice(0, 8).map(([key, meta]: [string, any]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.color }}/>
              <span className="text-[8.5px] text-[#4a6080]">{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Innbyttere */}
      {bench.length > 0 && (
        <div className="flex-shrink-0 px-3 py-2 bg-[#0a1422] border-t border-[#1e3050]">
          <div className="text-[9.5px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
            🪑 Innbyttere
          </div>
          <div className="flex flex-wrap gap-2">
            {bench.sort((a: any, b: any) => getNum(a) - getNum(b)).map((p: any) => {
              const meta = getMeta(p.role);
              return (
                <div key={p.id} className="flex items-center gap-1.5 bg-[#0f1a2a] border border-amber-500/20 rounded-lg px-2 py-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: meta?.color ?? '#555' }}>
                    {getNum(p)}
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold text-slate-200 leading-none">{p.name || `#${getNum(p)}`}</div>
                    <div className="text-[8.5px] text-amber-400 mt-0.5">{meta?.label ?? p.role}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PLAYERHOME — selve hjemme-skjermen for innlogget spiller
// ═══════════════════════════════════════════════════════════════
export const PlayerHome: React.FC = () => {
  const {
    currentUser, coachMessages, events, phases,
    playerAccounts, homeTeamName, logout,
    chatMessages, sendChat,
  } = useAppStore();

  const [tab, setTab] = useState<'messages' | 'lineup' | 'board' | 'chat'>('board');

  const playerId  = currentUser?.playerId;
  const myAccount = (playerAccounts as any[]).find((a: any) => a.playerId === playerId);
  const phase     = (phases[0] as any) ?? null;
  const myPlayer  = phase?.players?.find((p: any) => p.id === playerId) ?? null;

  const myMessages = (coachMessages as any[]).filter((m: any) => m.playerId === playerId);

  const myChats = (chatMessages as any[]).filter(
    (m: any) => !m.toPlayerId || m.toPlayerId === playerId ||
    (m.fromRole === 'player' && m.toPlayerId === playerId)
  );

  const today  = new Date().toISOString().slice(0, 10);
  const nextEv = [...(events as any[])]
    .filter((e: any) => e.date >= today)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))[0] ?? null;

  const homeStarters = phase?.players?.filter(
    (p: any) => p.team === 'home' && p.isStarter !== false
  ) ?? [];
  const homeSubs = phase?.players?.filter(
    (p: any) => p.team === 'home' && p.isStarter === false
  ) ?? [];

  const unreadChat = myChats.filter((m: any) => m.fromRole !== 'player').length;

  const tabs = [
    { id: 'board',    label: '📋 Taktikk',   badge: 0 },
    { id: 'lineup',   label: '👥 Laguttak',  badge: 0 },
    { id: 'messages', label: '📩 Meldinger', badge: myMessages.length },
    { id: 'chat',     label: '💬 Chat',       badge: unreadChat },
  ];

  return (
    <div className="flex flex-col h-full bg-[#060c18] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050] flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-slate-100 truncate">{currentUser?.name}</div>
          <div className="text-[10px] text-sky-400 flex items-center gap-1.5 truncate">
            {myPlayer ? (
              <>
                {myPlayer.specialRoles?.includes('captain') && <span>🪖</span>}
                {getMeta(myPlayer.role)?.label ?? myPlayer.role}
                {' · #'}{getNum(myPlayer)}
                {' · '}{homeTeamName || 'Hjemmelag'}
              </>
            ) : 'Spiller'}
          </div>
        </div>
        {/* Spesialroller */}
        <div className="flex flex-wrap gap-1">
          {(myPlayer?.specialRoles ?? []).map((sr: string) => (
            <span key={sr}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full
                bg-amber-500/15 border border-amber-500/30 text-amber-400">
              {SPECIAL_LABELS[sr] ?? sr}
            </span>
          ))}
        </div>
        <button onClick={logout}
          className="text-[11px] text-[#4a6080] hover:text-red-400 transition min-h-[44px] px-2 flex-shrink-0">
          Ut
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e3050] bg-[#0c1525] flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 py-3 text-[11px] font-semibold transition-all relative min-h-[44px]
              ${tab === t.id
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-[#3a5070] hover:text-slate-400'}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="absolute top-1.5 right-0.5 w-4 h-4 rounded-full bg-sky-500
                text-white text-[8px] font-black flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Innhold — VIKTIG: flex-1 min-h-0 for at taktikkbrettet skal fylle skjerm */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* TAKTIKK — SVG fullskjerm read-only */}
        {tab === 'board' && <ReadOnlyTacticBoard />}

        {/* LAGUTTAK */}
        {tab === 'lineup' && (
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">

            {/* Min posisjon øverst */}
            {myPlayer && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4
                flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center
                  font-black text-xl text-white flex-shrink-0 relative"
                  style={{ background: getMeta(myPlayer.role)?.color ?? '#555' }}>
                  {getNum(myPlayer)}
                  {myPlayer.specialRoles?.includes('captain') && (
                    <span className="absolute -top-1 -right-1 text-base">🪖</span>
                  )}
                </div>
                <div>
                  <div className="text-[16px] font-black text-slate-100">
                    {myPlayer.name || `#${getNum(myPlayer)}`}
                    <span className="text-[11px] text-sky-400 ml-2 font-normal">(deg)</span>
                  </div>
                  <div className="text-[12px] text-sky-400">
                    {getMeta(myPlayer.role)?.label ?? myPlayer.role}
                    {myPlayer.isStarter === false && (
                      <span className="ml-2 text-amber-400">· Innbytter</span>
                    )}
                  </div>
                  {/* Spesialroller */}
                  {(myPlayer.specialRoles ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(myPlayer.specialRoles ?? []).map((sr: string) => (
                        <span key={sr} className="text-[9px] font-bold px-2 py-0.5 rounded-full
                          bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          {SPECIAL_LABELS[sr] ?? sr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trenernotat til spilleren */}
            {myPlayer?.notes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                <div className="text-[9.5px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  📝 Trenernotat
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {myPlayer.notes}
                </p>
              </div>
            )}

            {/* Neste arrangement */}
            {nextEv && (
              <div className="bg-[#0c1525] border border-[#1e3050] rounded-xl p-4 mb-5">
                <div className="text-[9.5px] font-bold text-sky-400 uppercase tracking-wider mb-2">
                  📅 Neste arrangement
                </div>
                <div className="text-[14px] font-bold text-slate-100">{nextEv.title}</div>
                <div className="text-[11px] text-[#4a6080] mt-1">
                  {new Date(nextEv.date + 'T12:00:00').toLocaleDateString('nb-NO', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                  {nextEv.time && ` · ${nextEv.time}`}
                  {nextEv.location && ` · 📍${nextEv.location}`}
                </div>
              </div>
            )}

            {/* Startoppstilling */}
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-2">
              {homeTeamName || 'Hjemmelag'} – startoppstilling ({homeStarters.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {homeStarters.sort((a: any, b: any) => getNum(a) - getNum(b)).map((p: any) => (
                <LineupRow key={p.id} player={p} isMe={p.id === playerId} />
              ))}
            </div>

            {/* Innbyttere */}
            {homeSubs.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-[#1e3050]" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2">
                    🪑 Innbyttere ({homeSubs.length})
                  </span>
                  <div className="h-px flex-1 bg-[#1e3050]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {homeSubs.sort((a: any, b: any) => getNum(a) - getNum(b)).map((p: any) => (
                    <LineupRow key={p.id} player={p} isMe={p.id === playerId} isSub />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* MELDINGER */}
        {tab === 'messages' && (
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
            {myAccount?.individualTrainingNote && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
                <div className="text-[9.5px] font-bold text-purple-400 uppercase tracking-wider mb-2">
                  🏃 Individuell treningsplan
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {myAccount.individualTrainingNote}
                </p>
              </div>
            )}
            {myMessages.length === 0 && !myPlayer?.notes && (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📩</div>
                <p className="text-[#4a6080] text-sm">Ingen meldinger fra trener ennå.</p>
              </div>
            )}
            {myMessages.map((msg: any) => (
              <MessageCard key={msg.id} msg={msg} playerId={playerId} />
            ))}
          </div>
        )}

        {/* CHAT */}
        {tab === 'chat' && (
          <ChatPanel
            currentUser={currentUser}
            chatMessages={myChats}
            onSend={(text) => {
              if (!text.trim()) return;
              sendChat('player', currentUser?.name ?? 'Spiller', text.trim());
            }}
          />
        )}
      </div>
    </div>
  );
};

// ═══ CHAT PANEL ══════════════════════════════════════════════

export const ChatPanel: React.FC<{
  currentUser: any;
  chatMessages: any[];
  onSend: (text: string) => void;
  coachView?: boolean;
}> = ({ currentUser, chatMessages, onSend, coachView = false }) => {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-[#4a6080] text-sm">Ingen meldinger ennå.</p>
          </div>
        )}
        {chatMessages.map((msg: any, i: number) => {
          const isMe = coachView ? msg.fromRole === 'coach' : msg.fromRole === 'player';
          return (
            <div key={msg.id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed
                ${isMe
                  ? 'bg-sky-500/20 border border-sky-500/30 text-slate-100 rounded-br-sm'
                  : 'bg-[#0f1a2a] border border-[#1e3050] text-slate-300 rounded-bl-sm'}`}>
                {!isMe && (
                  <div className="text-[9.5px] font-bold text-amber-400 mb-1">{msg.fromName}</div>
                )}
                {msg.content}
                <div className="text-[9px] text-slate-500 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 flex gap-2 p-4 border-t border-[#1e3050] bg-[#0c1525]">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Skriv melding..."
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3
            text-[13px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[48px]"
        />
        <button onClick={send} disabled={!text.trim()}
          className="px-5 py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400
            font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-40 transition min-h-[48px]">
          Send
        </button>
      </div>
    </div>
  );
};

// ═══ HELPERS ════════════════════════════════════════════════

const LineupRow: React.FC<{ player: any; isMe: boolean; isSub?: boolean }> = ({ player, isMe, isSub }) => {
  const meta = getMeta(player.role);
  const num  = getNum(player);
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all
      ${isMe
        ? 'bg-sky-500/10 border-sky-500/40'
        : isSub
          ? 'bg-[#0f1a2a] border-amber-500/15 opacity-80'
          : 'bg-[#0f1a2a] border-[#1e3050]'}`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center
        font-black text-[12px] text-white flex-shrink-0 relative"
        style={{ background: meta?.color ?? '#555' }}>
        {num}
        {(player.specialRoles ?? []).includes('captain') && (
          <span className="absolute -top-1 -right-1 text-[10px]">🪖</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-bold text-slate-200 truncate">
          {player.name || `#${num}`}
          {isMe && <span className="text-[9.5px] text-sky-400 ml-1.5">(deg)</span>}
        </div>
        <div className="text-[10px] text-[#4a6080]">{meta?.label ?? player.role}</div>
      </div>
    </div>
  );
};

const MessageCard: React.FC<{ msg: any; playerId?: string }> = ({ msg, playerId }) => {
  const { replyToMessage } = useAppStore();
  const [reply, setReply]  = useState('');

  const send = () => {
    const txt = reply.trim();
    if (!txt || !playerId) return;
    replyToMessage(msg.id, playerId, txt);
    setReply('');
  };

  return (
    <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl overflow-hidden">
      <div className="p-4 bg-[#0f1a2a]">
        <div className="flex items-center gap-2 mb-2">
          <span>🏋️</span>
          <span className="text-[11px] font-bold text-amber-400">Trener</span>
          <span className="text-[10px] text-[#3a5070] ml-auto">
            {new Date(msg.createdAt).toLocaleDateString('nb-NO')}
          </span>
        </div>
        <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
      {(msg.replies ?? []).map((r: any) => (
        <div key={r.id} className="p-4 border-t border-[#1e3050]">
          <div className="text-[11px] font-bold text-sky-400 mb-1">Ditt svar</div>
          <p className="text-[12.5px] text-slate-300">{r.content}</p>
        </div>
      ))}
      <div className="p-4 border-t border-[#1e3050]">
        <textarea value={reply} onChange={e => setReply(e.target.value)}
          rows={2} placeholder="Skriv svar til trener..."
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2
            text-[12.5px] text-slate-300 resize-none focus:outline-none focus:border-sky-500 mb-2" />
        <button onClick={send}
          className="px-4 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold text-[12px] hover:bg-sky-500/25 min-h-[44px]">
          Send
        </button>
      </div>
    </div>
  );
};
