'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META } from '@/data/roleInfo';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from '@/components/board/pitches/FootballPitch';
import { HandballPitch } from '@/components/board/pitches/HandballPitch';

// ─── Helpers ──────────────────────────────────────────────────
const getMeta = (role: any) => ROLE_META[role as keyof typeof ROLE_META] ?? null;
const getNum  = (p: any): number => p.number ?? p.num ?? 0;

// ═══════════════════════════════════════════════════════════════
//  SPILLERPORTAL  (trener + spiller)
// ═══════════════════════════════════════════════════════════════
export const PlayerPortal: React.FC = () => {
  const {
    currentUser, playerAccounts, coachMessages, events,
    phases, sport, replyToMessage, logout, chatMessages, sendChat,
    homeTeamName, awayTeamName, activePhaseIdx, deleteEvent,
  } = useAppStore();

  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'messages' | 'squad' | 'tactics' | 'chat' | 'accounts' | 'calendar'>('tactics');
  const [chatInput, setChatInput] = useState('');

  const isCoach  = currentUser?.role === 'coach';
  const playerId = currentUser?.playerId;

  const tabs = [
    { id: 'tactics',  label: '📋 Taktikk' },
    { id: 'squad',    label: '👥 Tropp' },
    { id: 'calendar', label: '📅 Kalender' },
    { id: 'messages', label: '💬 Meldinger' },
    { id: 'chat',     label: '🗨️ Chat' },
    ...(isCoach ? [{ id: 'accounts', label: '⚙️ Kontoer' }] : []),
  ];

  const myMessages = (coachMessages as any[]).filter((m: any) =>
    isCoach ? true : m.playerId === playerId
  );

  // Bruk aktiv fase fra store (synkronisert med trenerens taktikkbrett)
  const phase = phases[activePhaseIdx] ?? phases[0] ?? null;

  const sendChatMsg = () => {
    const txt = chatInput.trim();
    if (!txt || !currentUser) return;
    sendChat(currentUser.role as 'coach' | 'player', currentUser.name, txt);
    setChatInput('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060c18]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050] flex-shrink-0">
        <div className="text-2xl">{isCoach ? '🏋️' : '👤'}</div>
        <div>
          <div className="text-sm font-black text-slate-100">{currentUser?.name}</div>
          <div className="text-[10px] text-[#3a5070]">
            {isCoach ? 'Trener · Full tilgang' : 'Spiller'}
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={logout}
          className="text-[11px] text-[#4a6080] hover:text-red-400 transition px-2 min-h-[44px]">
          Logg ut
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e3050] bg-[#0c1525] overflow-x-auto flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-all min-h-[44px]
              ${tab === t.id
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-[#3a5070] hover:text-slate-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Innhold — MOBILE FIX: flex-1 min-h-0 for korrekt overflow ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* TAKTIKK */}
        {tab === 'tactics' && (
          <ReadOnlyTacticBoard />
        )}

        {/* TROPP */}
        {tab === 'squad' && (
          <div className="flex-1 overflow-y-auto p-4">
            {phase
              ? <SquadView phase={phase} />
              : <EmptyState icon="👥" text="Ingen data." />}
          </div>
        )}

        {/* MELDINGER */}
        {tab === 'messages' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            {myMessages.length === 0
              ? <EmptyState icon="💬" text="Ingen meldinger ennå." />
              : myMessages.map((msg: any) => (
                <MessageCard key={msg.id} msg={msg} playerId={playerId}
                  replyText={replyText} setReplyText={setReplyText}
                  replyToMessage={replyToMessage} />
              ))}
          </div>
        )}

        {/* CHAT */}
        {tab === 'chat' && (
          <ChatView
            messages={chatMessages as any[]}
            currentUser={currentUser}
            input={chatInput}
            setInput={setChatInput}
            onSend={sendChatMsg}
          />
        )}

        {/* KONTOER (trener only) */}
        {tab === 'calendar' && (
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl w-full mx-auto">
            <PlayerCalendarView events={events as any[]} sport={sport} />
          </div>
        )}

        {tab === 'accounts' && isCoach && (
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl w-full mx-auto">
            <AccountManager />
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ READ-ONLY TACTIC BOARD WITH PLAYBACK ════════════════════

const ReadOnlyTacticBoard: React.FC = () => {
  const { phases, sport, awayTeamColor } = useAppStore();

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
  if (!phase) return <EmptyState icon="📋" text="Ingen taktikk tilgjengelig ennå." />;

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

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
            <button
              onClick={() => !isPlaying && setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={isPlaying || activeIdx === 0}
              className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[36px]">⏮</button>
            <button
              onClick={() => isPlaying ? stopPlayback() : startPlayback()}
              disabled={phases.length < 2}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border transition-all
                ${phases.length < 2
                  ? 'border-[#1e3050] text-[#334155] cursor-not-allowed'
                  : isPlaying
                    ? 'border-red-500 bg-red-500/15 text-red-400'
                    : 'border-sky-500 bg-sky-500/15 text-sky-400'}`}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              onClick={() => !isPlaying && setActiveIdx(Math.min(phases.length - 1, activeIdx + 1))}
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

      {/* SVG bane — MOBILE FIX: flex-1 min-h-0 */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2 bg-[#050c18]">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="max-w-full max-h-full rounded-xl touch-none"
          style={{
            width: '100%',
            height: '100%',
            boxShadow: '0 0 60px rgba(0,0,0,0.9)',
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="dropShadow2">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.6"/>
            </filter>
            <pattern id="grass2" patternUnits="userSpaceOnUse" width="50" height="50">
              <rect width="50" height="50" fill="#1b5e2a"/>
              <rect width="50" height="25" fill="#1d6430"/>
            </pattern>
          </defs>
          <rect width={VW} height={VH} fill="url(#grass2)"/>

          {sport === 'football' && <FootballPitch />}
          {sport === 'handball' && <HandballPitch />}

          {/* Tegninger */}
          {(phase.drawings ?? []).map((d: any) => (
            d.pts && d.pts.length >= 2 && (
              <g key={d.id}>
                <polyline
                  points={d.pts.map((p: any) => `${p.x},${p.y}`).join(' ')}
                  stroke={d.color ?? '#f87171'} strokeWidth={3} fill="none"
                  strokeLinecap="round" strokeLinejoin="round" />
                {/* Pilhode */}
                {(() => {
                  const pts = d.pts;
                  const p1 = pts[pts.length - 2];
                  const p2 = pts[pts.length - 1];
                  const a  = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                  const s  = 12;
                  return (
                    <polygon fill={d.color ?? '#f87171'} opacity={0.88}
                      points={`${p2.x},${p2.y} ${p2.x - s * Math.cos(a - Math.PI/6)},${p2.y - s * Math.sin(a - Math.PI/6)} ${p2.x - s * Math.cos(a + Math.PI/6)},${p2.y - s * Math.sin(a + Math.PI/6)}`}
                    />
                  );
                })()}
              </g>
            )
          ))}

          {/* Ball */}
          {displayBall && (
            <g filter="url(#dropShadow2)">
              <circle cx={displayBall.x} cy={displayBall.y} r={11} fill="white" stroke="#ccc" strokeWidth={1}/>
              {[{dx:-3,dy:-3,r:3},{dx:3.5,dy:-1.5,r:2.5},{dx:0,dy:4,r:2.5},{dx:-4,dy:2,r:2}].map((o,i) => (
                <circle key={i} cx={displayBall.x+o.dx} cy={displayBall.y+o.dy} r={o.r} fill="#111" opacity={0.7}/>
              ))}
            </g>
          )}

          {/* Spillere — kun visning, ingen drag — BARE HJEMMELAG */}
          {(displayPlayers as any[]).filter((player: any) => player.team === 'home').map((player: any) => {
            const meta  = getMeta(player.role);
            const fill  = player.team === 'away'
              ? (awayTeamColor ?? '#ef4444')
              : (meta?.color ?? '#64748b');
            const ring  = player.team === 'away' ? 'rgba(15,25,40,0.9)' : 'rgba(255,255,255,0.9)';
            const { x, y } = player.position;
            return (
              <g key={player.id} filter="url(#dropShadow2)" opacity={player.injured ? 0.5 : 1}>
                {/* Playtime ring */}
                {(player.minutesPlayed ?? 0) > 0 && (
                  <circle cx={x} cy={y} r={24} fill="none"
                    stroke={(player.minutesPlayed ?? 0) > 60 ? '#ef4444' : (player.minutesPlayed ?? 0) > 30 ? '#f59e0b' : '#22c55e'}
                    strokeWidth={2} opacity={0.5} strokeDasharray="4 2" />
                )}
                <circle cx={x} cy={y} r={21} fill={ring}/>
                <circle cx={x} cy={y} r={18} fill={fill} stroke={fill} strokeWidth={1.5}/>
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

          {/* Fremdriftsbar under avspilling */}
          {isPlaying && (
            <rect x={32} y={VH - 14} rx={3} height={5}
              width={progressFrac * (VW - 64)} fill="#38bdf8" opacity={0.8}/>
          )}
        </svg>
      </div>

      {/* Rollelegende */}
      <div className="flex-shrink-0 px-3 py-2 bg-[#0d1626] border-t border-[#1e3050]">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(ROLE_META).slice(0, 8).map(([key, meta]: [string, any]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: meta.color }}/>
              <span className="text-[9px] text-[#4a6080]">{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Innbyttere under brettet */}
      {(() => {
        const bench = (phase.players ?? []).filter((p: any) => p.team === 'home' && (p.isStarter === false || p.isOnField === false));
        if (!bench.length) return null;
        return (
          <div className="flex-shrink-0 px-3 py-2 bg-[#0a1422] border-t border-[#1e3050]">
            <div className="text-[9.5px] font-bold text-amber-400 uppercase tracking-widest mb-2">
              🪑 Innbyttere
            </div>
            <div className="flex flex-wrap gap-2">
              {bench.sort((a: any, b: any) => getNum(a) - getNum(b)).map((p: any) => {
                const meta = getMeta(p.role);
                return (
                  <div key={p.id} className="flex items-center gap-1.5 bg-[#0f1a2a] border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{ background: meta?.color ?? '#555' }}>
                      {getNum(p)}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-200 leading-none">{p.name || `#${getNum(p)}`}</div>
                      <div className="text-[9px] text-amber-400 mt-0.5">{meta?.label ?? p.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ═══ TROPP VIEW — kun hjemmelag ══════════════════════════════

const SquadView: React.FC<{ phase: any }> = ({ phase }) => {
  const { homeTeamName } = useAppStore();
  const players: any[] = phase.players ?? [];
  const home       = players.filter((p: any) => p.team === 'home');
  const starters   = home.filter((p: any) => p.isStarter !== false && p.isOnField !== false);
  const substitutes = home.filter((p: any) => p.isStarter === false || p.isOnField === false);

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-base font-bold text-slate-100 mb-4">
        👥 {homeTeamName || 'Hjemmelag'} – Tropp
      </h3>

      <div className="mb-2">
        <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">
          ⚽ Startoppstilling ({starters.length})
        </div>
        {starters.length === 0 ? (
          <p className="text-[12px] text-[#3a5070] italic">Ingen spillere i startoppstillingen</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {starters.sort((a: any, b: any) => getNum(a) - getNum(b)).map((p: any) => (
              <PlayerRow key={p.id} player={p} />
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 my-3">
          <div className="h-px flex-1 bg-[#1e3050]"/>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2">
            🪑 Innbyttere ({substitutes.length})
          </span>
          <div className="h-px flex-1 bg-[#1e3050]"/>
        </div>
        {substitutes.length === 0 ? (
          <p className="text-[12px] text-[#3a5070] italic px-2">
            Ingen innbyttere — trener markerer spillere som innbyttere i spillereditor.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {substitutes.sort((a: any, b: any) => getNum(a) - getNum(b)).map((p: any) => (
              <PlayerRow key={p.id} player={p} isBench />
            ))}
          </div>
        )}
      </div>

      <PlaytimeBar players={home} />
    </div>
  );
};

const PlayerRow: React.FC<{ player: any; isBench?: boolean }> = ({ player, isBench }) => {
  const meta = getMeta(player.role);
  const num  = getNum(player);
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl border
      ${isBench ? 'bg-[#0f1a2a] border-amber-500/20' : 'bg-[#0f1a2a] border-[#1e3050]'}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center
        text-[13px] font-black text-white flex-shrink-0 relative"
        style={{ background: meta?.color ?? '#555', opacity: player.injured ? 0.5 : 1 }}>
        {num}
        {player.injured && <span className="absolute -top-1 -right-1 text-[10px]">🩹</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-bold text-slate-200 truncate">
          {player.name || `#${num}`}
        </div>
        <div className="text-[10px] text-[#4a6080]">{meta?.label ?? player.role}</div>
        {isBench && <div className="text-[9.5px] text-amber-400 font-semibold">Innbytter</div>}
      </div>
    </div>
  );
};

const PlaytimeBar: React.FC<{ players: any[] }> = ({ players }) => {
  const withTime = players.filter((p: any) => (p.minutesPlayed ?? 0) > 0);
  if (!withTime.length) return null;
  return (
    <div className="mt-4">
      <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
        ⏱ Spilletid
      </div>
      <div className="space-y-2">
        {[...withTime].sort((a: any, b: any) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0))
          .map((p: any) => {
            const min  = p.minutesPlayed ?? 0;
            const bar  = min > 60 ? '#ef4444' : min > 30 ? '#f59e0b' : '#22c55e';
            const meta = getMeta(p.role);
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center
                  text-[9px] font-black text-white flex-shrink-0"
                  style={{ background: meta?.color ?? '#555' }}>{getNum(p)}</div>
                <div className="w-20 sm:w-28 truncate text-[11px] text-slate-300">
                  {p.name || `#${getNum(p)}`}
                </div>
                <div className="flex-1 h-2 bg-[#1e3050] rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (min / 90) * 100)}%`, background: bar }}/>
                </div>
                <div className="text-[11px] font-bold w-12 text-right" style={{ color: bar }}>
                  {min} min
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ═══ CHAT VIEW ═══════════════════════════════════════════════

const ChatView: React.FC<{
  messages: any[];
  currentUser: any;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}> = ({ messages, currentUser, input, setInput, onSend }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0
          ? <EmptyState icon="🗨️" text="Ingen meldinger i chatten ennå." />
          : messages.map((msg: any) => {
            const isMe = msg.fromName === currentUser?.name;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5
                  ${isMe
                    ? 'bg-sky-500/20 border border-sky-500/30 text-sky-100'
                    : msg.fromRole === 'coach'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100'
                      : 'bg-[#0f1a2a] border border-[#1e3050] text-slate-200'}`}>
                  {!isMe && (
                    <div className="text-[9px] font-bold text-[#4a6080] mb-1 uppercase tracking-wider">
                      {msg.fromRole === 'coach' ? '🏋️ ' : '👤 '}{msg.fromName}
                    </div>
                  )}
                  <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  <div className="text-[9px] text-[#3a5070] mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef}/>
      </div>

      <div className="flex-shrink-0 p-3 bg-[#0c1525] border-t border-[#1e3050] flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder="Skriv melding..."
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5
            text-[13px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[44px]"
        />
        <button onClick={onSend}
          className="px-4 rounded-xl bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 min-h-[44px]">
          Send
        </button>
      </div>
    </div>
  );
};

// ═══ MESSAGE CARD ════════════════════════════════════════════

const MessageCard: React.FC<{
  msg: any; playerId?: string;
  replyText: Record<string, string>;
  setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  replyToMessage: (id: string, pid: string, content: string) => void;
}> = ({ msg, playerId, replyText, setReplyText, replyToMessage }) => (
  <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl overflow-hidden">
    <div className="p-4 bg-[#0f1a2a]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🏋️</span>
        <span className="text-[11px] font-bold text-amber-400">Trener</span>
        <span className="text-[10px] text-[#3a5070] ml-auto">
          {new Date(msg.createdAt).toLocaleDateString('nb-NO')}
        </span>
      </div>
      <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
    </div>
    {(msg.replies ?? []).map((r: any) => (
      <div key={r.id} className="p-4 border-t border-[#1e3050]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold text-sky-400">Svar</span>
          <span className="text-[10px] text-[#3a5070] ml-auto">
            {new Date(r.createdAt).toLocaleDateString('nb-NO')}
          </span>
        </div>
        <p className="text-[12.5px] text-slate-300 leading-relaxed">{r.content}</p>
      </div>
    ))}
    {playerId && (
      <div className="p-4 border-t border-[#1e3050]">
        <textarea
          value={replyText[msg.id] ?? ''}
          onChange={e => setReplyText(p => ({ ...p, [msg.id]: e.target.value }))}
          rows={2} placeholder="Skriv ditt svar..."
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2
            text-[12.5px] text-slate-300 resize-none focus:outline-none focus:border-sky-500 mb-2"
        />
        <button
          onClick={() => {
            const txt = replyText[msg.id]?.trim();
            if (!txt || !playerId) return;
            replyToMessage(msg.id, playerId, txt);
            setReplyText(p => ({ ...p, [msg.id]: '' }));
          }}
          className="px-4 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold text-[12px] hover:bg-sky-500/25 min-h-[44px]">
          Send svar
        </button>
      </div>
    )}
  </div>
);

// ═══ ACCOUNT MANAGER ═════════════════════════════════════════

const AccountManager: React.FC = () => {
  const { playerAccounts, addPlayerAccount, removePlayerAccount, phases, activePhaseIdx } = useAppStore();

  const [name, setName]     = useState('');
  const [pin, setPin]       = useState('');
  const [linkId, setLinkId] = useState('');

  const allPlayers: any[] = (phases[activePhaseIdx] as any)?.players ?? [];
  const homePlayers = allPlayers.filter((p: any) => p.team === 'home');

  const create = () => {
    if (!name.trim() || pin.length !== 4) return;
    addPlayerAccount({
      name: name.trim(),
      pin,
      playerId: linkId || `custom-${Date.now()}`,
      team: 'home',
    });
    setName(''); setPin(''); setLinkId('');
  };

  return (
    <div>
      <h3 className="text-base font-bold text-slate-100 mb-4">⚙️ Spillerkontoer</h3>

      {(playerAccounts as any[]).length > 0 && (
        <div className="space-y-2 mb-5">
          {(playerAccounts as any[]).map((acc: any) => {
            const pl   = allPlayers.find((p: any) => p.id === acc.playerId);
            const meta = pl ? getMeta(pl.role) : null;
            return (
              <div key={acc.id}
                className="flex items-center gap-3 p-3 bg-[#0c1525] rounded-xl border border-[#1e3050]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center
                  text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: meta?.color ?? '#3b82f6' }}>
                  {pl ? getNum(pl) : '?'}
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-slate-200">{acc.name}</div>
                  <div className="text-[10.5px] text-[#4a6080]">
                    PIN: {acc.pin} · {meta?.label ?? (pl?.role ?? '–')}
                  </div>
                </div>
                <button onClick={() => removePlayerAccount(acc.id)}
                  className="text-red-400/50 hover:text-red-400 px-3 min-h-[44px] text-sm">✕</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-2xl p-5">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-4">
          Opprett ny spillerkonto
        </div>
        <div className="mb-3">
          <label className="label-sm2">Koble til spiller på brettet (valgfritt)</label>
          <select value={linkId}
            onChange={e => {
              setLinkId(e.target.value);
              const pl = homePlayers.find((p: any) => p.id === e.target.value);
              if (pl?.name && !name) setName(pl.name);
            }}
            className="inp2">
            <option value="">– Ingen kobling / ny spiller –</option>
            {homePlayers.map((p: any) => (
              <option key={p.id} value={p.id}>
                #{getNum(p)} {p.name || 'Navnløs'} – {getMeta(p.role)?.label ?? p.role}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#3a5070] mt-1.5">
            Samme posisjon kan ha flere kontoer (f.eks. 3 keepere).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <label className="label-sm2">Navn</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ola Nordmann" className="inp2"/>
          </div>
          <div>
            <label className="label-sm2">4-sifret PIN</label>
            <input value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4} placeholder="••••" type="password" className="inp2"/>
            {pin.length > 0 && pin.length < 4 && (
              <div className="text-[10px] text-amber-400 mt-1">{4 - pin.length} siffer til</div>
            )}
          </div>
        </div>
        <button onClick={create}
          disabled={!name.trim() || pin.length !== 4}
          className="w-full py-3 rounded-xl bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold text-[13px] hover:bg-sky-500/25
            disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
          ✓ Opprett konto
        </button>
      </div>

      <style>{`
        .inp2 { width:100%; background:#111c30; border:1px solid #1e3050;
          border-radius:8px; padding:10px 12px; color:#e2e8f0; font-size:13px;
          margin-top:5px; box-sizing:border-box; min-height:44px; }
        .inp2:focus { outline:none; border-color:#38bdf8; }
        .label-sm2 { font-size:9.5px; font-weight:700; color:#3a5070;
          text-transform:uppercase; letter-spacing:0.08em; display:block; }
      `}</style>
    </div>
  );
};

// ═══ PLAYER CALENDAR VIEW ════════════════════════════════════

const PlayerCalendarView: React.FC<{ events: any[]; sport: string }> = ({ events, sport }) => {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 15);

  const past = events
    .filter(e => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (events.length === 0) return <EmptyState icon="📅" text="Ingen arrangementer planlagt ennå." />;

  return (
    <div>
      <h3 className="text-base font-bold text-slate-100 mb-4">📅 Kommende</h3>
      <div className="space-y-2 mb-6">
        {upcoming.map(ev => (
          <PlayerEventCard key={ev.id} event={ev} />
        ))}
        {upcoming.length === 0 && <p className="text-[#4a6080] text-sm italic">Ingen kommende arrangementer.</p>}
      </div>

      {past.length > 0 && (
        <>
          <h3 className="text-[11px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">Tidligere</h3>
          <div className="space-y-2 opacity-60">
            {past.map(ev => (
              <PlayerEventCard key={ev.id} event={ev} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const PlayerEventCard: React.FC<{ event: any }> = ({ event }) => {
  const [open, setOpen] = React.useState(false);
  const isMatch    = event.type === 'match';
  const dateStr    = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  return (
    <div className="bg-[#0f1a2a] border border-[#1e3050] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className={`w-2 h-10 rounded-full flex-shrink-0 ${isMatch ? 'bg-red-400' : 'bg-emerald-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold text-slate-200">{event.title}</div>
          <div className="text-[10.5px] text-[#4a6080]">
            {isMatch ? '⚽ Kamp' : '🏃 Trening'} · {dateStr}
            {event.time && ` · ${event.time}`}
            {event.location && ` · 📍 ${event.location}`}
          </div>
        </div>
        <span className="text-[#4a6080] text-[11px]">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-[#1e3050] pt-3 space-y-2">
          {event.teamNote ? (
            <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">{event.teamNote}</p>
          ) : (
            <p className="text-[11px] text-[#3a5070] italic">Ingen notat fra trener.</p>
          )}
          {(event.trainingNotes ?? []).map((tn: any) => (
            <div key={tn.id} className="bg-[#0c1525] rounded-lg p-3 border border-[#1e3050]">
              <div className="text-[11px] font-bold text-emerald-400 mb-1">📋 {tn.title}</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{tn.content}</p>
              {tn.focus?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {tn.focus.map((f: string, i: number) => (
                    <span key={i} className="text-[9.5px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══ HELPERS ═════════════════════════════════════════════════

const EmptyState: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="text-center py-12">
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-[#4a6080] text-sm">{text}</p>
  </div>
);
