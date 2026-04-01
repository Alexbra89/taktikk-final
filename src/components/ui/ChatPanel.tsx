'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface ChatPanelProps {
  currentUser: any;
  chatMessages: any[];
  onSend: (text: string, targetPlayerId?: string) => void;
  coachView?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentUser,
  chatMessages,
  onSend,
  coachView = false,
}) => {
  const [text, setText] = useState('');
  const [targetPlayer, setTargetPlayer] = useState<string | null>(null);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { playerAccounts } = useAppStore();

  // Hent alle spillere for coach
  const players = (playerAccounts as any[]).filter(p => p.team === 'home');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim(), targetPlayer || undefined);
    setText('');
    // Reset target etter sending hvis det er individuell chat
    if (targetPlayer) {
      setTargetPlayer(null);
      setShowPlayerSelector(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.playerId === playerId);
    return player?.name || playerId;
  };

  // Filtrer meldinger for coach-view
  const displayedMessages = coachView
    ? chatMessages
    : chatMessages.filter((m: any) => !m.toPlayerId || m.toPlayerId === currentUser?.playerId);

  const getMessageTarget = (msg: any) => {
    if (!msg.toPlayerId) return '👥 Alle';
    const player = players.find(p => p.playerId === msg.toPlayerId);
    return `👤 ${player?.name || 'Spiller'}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header med mottaker-velger for coach */}
      {coachView && (
        <div className="flex-shrink-0 p-3 border-b border-[#1e3050] bg-[#0c1525]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTargetPlayer(null);
                setShowPlayerSelector(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all
                ${!targetPlayer
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-[#111c30] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
            >
              👥 Alle spillere
            </button>
            <button
              onClick={() => setShowPlayerSelector(!showPlayerSelector)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all
                ${targetPlayer || showPlayerSelector
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-[#111c30] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
            >
              🎯 Enkeltspiller
            </button>
          </div>

          {/* Spiller-velger dropdown */}
          {showPlayerSelector && (
            <div className="mt-2">
              <div className="text-[9px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
                Velg spiller
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {players.map(player => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setTargetPlayer(player.playerId);
                      setShowPlayerSelector(false);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all
                      ${targetPlayer === player.playerId
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vis valgt mottaker */}
          {targetPlayer && (
            <div className="mt-2 text-[10px] text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5 inline-block">
              🎯 Sender til: {getPlayerName(targetPlayer)}
            </div>
          )}
        </div>
      )}

      {/* Meldinger */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayedMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-[#4a6080] text-sm">
              {coachView ? 'Ingen meldinger i chatten ennå.' : 'Ingen meldinger.'}
            </p>
          </div>
        )}
        {displayedMessages.map((msg: any, i: number) => {
          const isMe = coachView
            ? msg.fromRole === 'coach'
            : msg.fromRole === 'player' && msg.fromName === currentUser?.name;

          const isPrivate = msg.toPlayerId && msg.toPlayerId !== currentUser?.playerId && !isMe;

          return (
            <div key={msg.id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed
                  ${isMe
                    ? 'bg-sky-500/20 border border-sky-500/30 text-slate-100 rounded-br-sm'
                    : msg.fromRole === 'coach'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100'
                      : 'bg-[#0f1a2a] border border-[#1e3050] text-slate-300 rounded-bl-sm'}
                  ${isPrivate ? 'opacity-60' : ''}`}
              >
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9.5px] font-bold text-amber-400">
                      {msg.fromRole === 'coach' ? '🏋️ ' : '👤 '}{msg.fromName}
                    </span>
                    {coachView && msg.toPlayerId && (
                      <span className="text-[8px] text-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        → {getPlayerName(msg.toPlayerId)}
                      </span>
                    )}
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <div className="text-[9px] text-slate-500 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2 p-4 border-t border-[#1e3050] bg-[#0c1525]">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={
            coachView
              ? targetPlayer
                ? `Skriv melding til ${getPlayerName(targetPlayer)}...`
                : 'Skriv melding til hele laget...'
              : 'Skriv melding...'
          }
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3
            text-[13px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[48px]"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="px-5 py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400
            font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-40 transition min-h-[48px]"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;