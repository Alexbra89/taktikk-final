'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useNotification } from '@/components/NotificationProvider';

interface ChatPanelProps {
  currentUser: any;
  chatMessages: any[];
  onSend: (text: string, targetPlayerId?: string) => void;
  coachView?: boolean;
  isCaptain?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentUser,
  chatMessages,
  onSend,
  coachView = false,
  isCaptain = false,
}) => {
  const [text, setText] = useState('');
  const [targetPlayer, setTargetPlayer] = useState<string | null>(null);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const { playerAccounts, phases, activePhaseIdx } = useAppStore();
  const { sendNotification, permission, requestPermission } = useNotification();

  const phase = phases[activePhaseIdx];
  const allPlayers = phase?.players?.filter(p => p.team === 'home') ?? [];
  const players = (playerAccounts as any[]).filter(p => p.team === 'home');
  
  const isCurrentUserCaptain = isCaptain || (() => {
    if (!phase) return false;
    const player = phase.players.find(p => 
      p.id === currentUser?.playerId || 
      (players.find(acc => acc.playerId === p.id && acc.id === currentUser?.accountId))
    );
    return player?.specialRoles?.includes('captain') ?? false;
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  // LYTT TIL NYE MELDINGER FOR NOTIFIKASJONER
  useEffect(() => {
    if (!chatMessages.length) return;
    
    const latestMsg = chatMessages[chatMessages.length - 1];
    if (!latestMsg || lastMessageIdRef.current === latestMsg.id) return;
    
    lastMessageIdRef.current = latestMsg.id;
    
    // Sjekk om meldingen er fra noen andre enn meg selv
    const isFromMe = latestMsg.fromName === currentUser?.name;
    const isForMe = !latestMsg.toPlayerId || 
                    latestMsg.toPlayerId === currentUser?.playerId ||
                    (coachView && latestMsg.fromRole === 'player');
    
    // Bare varsle hvis meldingen er fra andre og vinduet er i bakgrunnen
    if (!isFromMe && isForMe && document.hidden && permission === 'granted') {
      const fromName = latestMsg.fromRole === 'coach' ? '🏋️ Trener' : `👤 ${latestMsg.fromName}`;
      sendNotification(`Ny melding fra ${fromName}`, {
        body: latestMsg.content.slice(0, 100),
        tag: 'chat-message',
        data: { type: 'chat', messageId: latestMsg.id },
      });
    }
  }, [chatMessages, currentUser, coachView, permission, sendNotification]);

  const send = () => {
    if (!text.trim()) return;
    
    if (coachView || isCurrentUserCaptain) {
      if (sendToAll) {
        onSend(text.trim());
      } else if (targetPlayer) {
        onSend(text.trim(), targetPlayer);
      }
    } else {
      onSend(text.trim());
    }
    
    setText('');
    if (targetPlayer) {
      setTargetPlayer(null);
      setShowPlayerSelector(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.playerId === playerId);
    return player?.name || playerId;
  };

  const displayedMessages = (coachView || isCurrentUserCaptain)
    ? chatMessages
    : chatMessages.filter((m: any) => !m.toPlayerId || m.toPlayerId === currentUser?.playerId);

  // Be om notifikasjonstillatelse via knapp (hvis ikke allerede)
  const handleRequestPermission = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header med mottaker-velger for coach OG kaptein */}
      {(coachView || isCurrentUserCaptain) && (
        <div className="flex-shrink-0 p-3 border-b border-[#1e3050] bg-[#0c1525]">
          
          {/* Vis kaptein-badge */}
          {isCurrentUserCaptain && !coachView && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-500/20">
              <span className="text-amber-400 text-sm">🪖</span>
              <span className="text-[11px] font-bold text-amber-400">Kaptein · Kan sende til alle spillere</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSendToAll(true);
                setTargetPlayer(null);
                setShowPlayerSelector(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all
                ${sendToAll
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-[#111c30] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
            >
              👥 Alle spillere
            </button>
            <button
              onClick={() => {
                setSendToAll(false);
                setShowPlayerSelector(!showPlayerSelector);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all
                ${!sendToAll || showPlayerSelector
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-[#111c30] text-[#4a6080] border border-[#1e3050] hover:text-slate-300'}`}
            >
              🎯 Enkeltspiller
            </button>
          </div>

          {/* Spiller-velger dropdown */}
          {!sendToAll && showPlayerSelector && (
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
          {!sendToAll && targetPlayer && (
            <div className="mt-2 text-[10px] text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5 inline-block">
              🎯 Sender til: {getPlayerName(targetPlayer)}
            </div>
          )}
        </div>
      )}

      {/* Notifikasjons-knapp (hvis ikke tillatelse gitt) */}
      {permission !== 'granted' && 'Notification' in window && (
        <div className="flex-shrink-0 p-2 bg-amber-500/10 border-b border-amber-500/20">
          <button
            onClick={handleRequestPermission}
            className="w-full py-1.5 rounded-lg text-[10px] font-semibold text-amber-400 hover:bg-amber-500/20 transition"
          >
            🔔 Aktiver varsler for nye meldinger
          </button>
        </div>
      )}

      {/* Meldinger */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayedMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-[#4a6080] text-sm">
              {coachView || isCurrentUserCaptain ? 'Ingen meldinger i chatten ennå.' : 'Ingen meldinger.'}
            </p>
          </div>
        )}
        {displayedMessages.map((msg: any, i: number) => {
          const isMe = coachView
            ? msg.fromRole === 'coach'
            : msg.fromRole === 'player' && msg.fromName === currentUser?.name;

          const isCaptainMsg = msg.fromCaptain === true;
          const isPrivate = msg.toPlayerId && msg.toPlayerId !== currentUser?.playerId && !isMe;

          return (
            <div key={msg.id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed
                  ${isMe
                    ? 'bg-sky-500/20 border border-sky-500/30 text-slate-100 rounded-br-sm'
                    : isCaptainMsg
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-100'
                      : msg.fromRole === 'coach'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100'
                        : 'bg-[#0f1a2a] border border-[#1e3050] text-slate-300 rounded-bl-sm'}
                  ${isPrivate ? 'opacity-60' : ''}`}
              >
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9.5px] font-bold ${isCaptainMsg ? 'text-amber-400' : 'text-amber-400'}`}>
                      {isCaptainMsg ? '🪖 ' : msg.fromRole === 'coach' ? '🏋️ ' : '👤 '}{msg.fromName}
                      {isCaptainMsg && <span className="ml-1 text-[8px] text-amber-400/80">(Kaptein)</span>}
                    </span>
                    {(coachView || isCurrentUserCaptain) && msg.toPlayerId && (
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
            coachView || isCurrentUserCaptain
              ? sendToAll
                ? 'Skriv melding til HELE laget...'
                : targetPlayer
                  ? `Skriv melding til ${getPlayerName(targetPlayer)}...`
                  : 'Velg mottaker først...'
              : 'Skriv melding til trener...'
          }
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3
            text-[13px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[48px]"
          disabled={!coachView && !isCurrentUserCaptain ? false : (!sendToAll && !targetPlayer && !coachView)}
        />
        <button
          onClick={send}
          disabled={!text.trim() || (!coachView && !isCurrentUserCaptain ? false : (!sendToAll && !targetPlayer))}
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