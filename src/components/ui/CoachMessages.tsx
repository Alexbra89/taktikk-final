'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { CoachMessage, PlayerAccount } from '@/types';

export const CoachMessages: React.FC = () => {
  const { coachMessages, playerAccounts, events, sendCoachMessage } = useAppStore();
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [filterPlayerId, setFilterPlayerId] = useState<string | null>(null);

  // Hent spillernavn fra playerAccounts
  const getPlayerName = (playerId: string): string => {
    const account = (playerAccounts as PlayerAccount[]).find(a => a.playerId === playerId);
    return account?.name || playerId;
  };

  // Filtrer meldinger basert på valgt spiller
  const filteredMessages = useMemo(() => {
    if (!filterPlayerId) return coachMessages;
    return coachMessages.filter(m => m.playerId === filterPlayerId);
  }, [coachMessages, filterPlayerId]);

  // Grupper meldinger per spiller for venstre-side listen
  const playersWithMessages = useMemo(() => {
    const playerMap = new Map<string, { name: string; count: number; lastMessage: CoachMessage }>();
    for (const msg of coachMessages) {
      const existing = playerMap.get(msg.playerId);
      if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
        playerMap.set(msg.playerId, {
          name: getPlayerName(msg.playerId),
          count: (existing?.count || 0) + 1,
          lastMessage: msg,
        });
      } else if (existing) {
        playerMap.set(msg.playerId, { ...existing, count: existing.count + 1 });
      }
    }
    return Array.from(playerMap.entries()).map(([playerId, data]) => ({
      playerId,
      ...data,
    }));
  }, [coachMessages, playerAccounts]);

  const selectedPlayerMessages = useMemo(() => {
    if (!selectedPlayerId) return [];
    return coachMessages
      .filter(m => m.playerId === selectedPlayerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [coachMessages, selectedPlayerId]);

  const handleSendMessage = () => {
    if (!selectedPlayerId || !newMessage.trim()) return;
    sendCoachMessage(selectedPlayerId, newMessage.trim(), selectedEventId);
    setNewMessage('');
    setSelectedEventId(undefined);
  };

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events]);

  return (
    <div className="flex h-full bg-[#060c18] overflow-hidden">
      {/* Venstre sidebar – spillere med meldinger */}
      <div className="w-72 border-r border-[#1e3050] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#1e3050]">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <span>📩</span> Meldinger
          </h2>
          <button
            onClick={() => setFilterPlayerId(null)}
            className={`mt-2 w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold transition-all
              ${!filterPlayerId ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}
          >
            📋 Alle samtaler ({coachMessages.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {playersWithMessages.length === 0 ? (
            <p className="text-[#4a6080] text-xs text-center py-8">
              Ingen meldinger sendt ennå.
            </p>
          ) : (
            playersWithMessages.map(({ playerId, name, count, lastMessage }) => (
              <button
                key={playerId}
                onClick={() => {
                  setSelectedPlayerId(playerId);
                  setFilterPlayerId(playerId);
                }}
                className={`w-full text-left p-3 rounded-xl mb-1 transition-all
                  ${selectedPlayerId === playerId
                    ? 'bg-sky-500/15 border border-sky-500/30'
                    : 'hover:bg-[#0f1a2a] border border-transparent'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-slate-200">{name}</span>
                  <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
                <p className="text-[10px] text-[#4a6080] truncate mt-1">
                  {lastMessage.content.slice(0, 40)}...
                </p>
                <p className="text-[9px] text-[#3a5070] mt-0.5">
                  {new Date(lastMessage.createdAt).toLocaleDateString('nb-NO')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Høyre hovedområde – meldingshistorikk og svar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPlayerId ? (
          <>
            {/* Header med spillerinfo */}
            <div className="p-4 border-b border-[#1e3050]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 text-lg">
                  👤
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {getPlayerName(selectedPlayerId)}
                  </h3>
                  <p className="text-[10px] text-[#4a6080]">
                    {selectedPlayerMessages.length} melding{selectedPlayerMessages.length !== 1 ? 'er' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Meldingshistorikk */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedPlayerMessages.map(msg => (
                <div key={msg.id} className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] overflow-hidden">
                  {/* Trenerens melding */}
                  <div className="p-4 bg-amber-500/5 border-b border-amber-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold text-amber-400">🏋️ Du</span>
                      <span className="text-[9px] text-[#3a5070] ml-auto">
                        {new Date(msg.createdAt).toLocaleString('nb-NO', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    {msg.eventId && (
                      <p className="text-[9px] text-sky-400/60 mt-2">
                        📅 Knyttet til: {events.find(e => e.id === msg.eventId)?.title || msg.eventId}
                      </p>
                    )}
                  </div>

                  {/* Spillerens svar */}
                  {msg.replies.map(reply => (
                    <div key={reply.id} className="p-4 bg-sky-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold text-sky-400">
                          👤 {getPlayerName(reply.playerId)}
                        </span>
                        <span className="text-[9px] text-[#3a5070] ml-auto">
                          {new Date(reply.createdAt).toLocaleString('nb-NO', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Input for ny melding */}
            <div className="p-4 border-t border-[#1e3050] bg-[#0c1525]">
              <div className="flex gap-2 mb-2">
                <select
                  value={selectedEventId || ''}
                  onChange={e => setSelectedEventId(e.target.value || undefined)}
                  className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[11px] text-slate-300"
                >
                  <option value="">(Valgfritt) Knytt til arrangement</option>
                  {upcomingEvents.map(e => (
                    <option key={e.id} value={e.id}>{e.title} ({e.date})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={`Skriv melding til ${getPlayerName(selectedPlayerId)}...`}
                  className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3 text-[12px] text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-5 py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12px] hover:bg-sky-500/25 disabled:opacity-40 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#4a6080]">
            <div className="text-center">
              <div className="text-4xl mb-3">📩</div>
              <p className="text-sm">Velg en spiller til venstre</p>
              <p className="text-[10px] mt-1">for å se meldingshistorikk</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};