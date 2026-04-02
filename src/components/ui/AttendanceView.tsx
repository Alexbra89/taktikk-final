'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface AttendanceViewProps {
  isCaptain?: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ isCaptain = false }) => {
  const { events, playerAccounts, phases, activePhaseIdx, currentUser, updateEvent } = useAppStore();
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendanceMode, setAttendanceMode] = useState(false);
  
  const isCoach = currentUser?.role === 'coach';
  const canEdit = isCoach || isCaptain;
  
  const today = new Date().toISOString().slice(0, 10);
  
  // Hent kommende treninger/kamper
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events, today]);
  
  const phase = phases[activePhaseIdx] ?? phases[0];
  const homePlayers = (phase?.players ?? []).filter((p: any) => p.team === 'home');
  
  // Hent spillerens navn
  const getPlayerName = (playerId: string) => {
    const account = playerAccounts.find((a: any) => a.playerId === playerId);
    const player = homePlayers.find((p: any) => p.id === playerId);
    return account?.name || player?.name || `#${player?.num}`;
  };
  
  // Hent fremmøte for en spesifikk event
  const getAttendanceForEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return {};
    
    const attendanceMap: Record<string, boolean> = {};
    homePlayers.forEach((p: any) => {
      attendanceMap[p.id] = false;
    });
    
    event.trainingNotes?.forEach((note: any) => {
      note.targetPlayerIds?.forEach((playerId: string) => {
        if (attendanceMap[playerId] !== undefined) {
          attendanceMap[playerId] = true;
        }
      });
    });
    
    return attendanceMap;
  };
  
  // Marker/avmarker fremmøte for en spiller
  const toggleAttendance = (eventId: string, playerId: string) => {
    if (!canEdit) return;
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const attendanceNote = event.trainingNotes?.find((n: any) => n.title === '✅ Fremmøte');
    
    if (attendanceNote) {
      const currentIds = attendanceNote.targetPlayerIds || [];
      const newIds = currentIds.includes(playerId)
        ? currentIds.filter((id: string) => id !== playerId)
        : [...currentIds, playerId];
      
      const updatedNotes = event.trainingNotes.map((n: any) =>
        n.id === attendanceNote.id ? { ...n, targetPlayerIds: newIds } : n
      );
      
      updateEvent(eventId, { trainingNotes: updatedNotes });
    } else {
      // Opprett ny fremmøte-notat
      const newNote = {
        id: `att-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: '✅ Fremmøte',
        content: 'Fremmøteregistrering',
        focus: [],
        targetPlayerIds: [playerId],
      };
      
      updateEvent(eventId, {
        trainingNotes: [...(event.trainingNotes || []), newNote]
      });
    }
  };
  
  // Beregn fremmøteprosent for en event
  const getAttendancePercentage = (eventId: string) => {
    const attendance = getAttendanceForEvent(eventId);
    const total = homePlayers.length;
    const attended = Object.values(attendance).filter(v => v === true).length;
    return total > 0 ? Math.round((attended / total) * 100) : 0;
  };
  
  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;
  const selectedAttendance = selectedEventId ? getAttendanceForEvent(selectedEventId) : {};
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060c18]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-100">
              {isCaptain ? '🪖 Kaptein' : '📋'} ✅ Fremmøte
            </h2>
            <p className="text-[10px] text-[#4a6080] mt-0.5">
              {canEdit 
                ? 'Registrer hvem som møter på trening/kamp'
                : 'Se hvem som møter på kommende arrangementer'}
            </p>
          </div>
          {canEdit && attendanceMode && (
            <button
              onClick={() => setAttendanceMode(false)}
              className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-bold"
            >
              Ferdig registrering
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedEventId ? (
          // Vis liste over kommende arrangementer
          <div className="space-y-3 max-w-2xl mx-auto">
            <h3 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2">
              📅 Kommende arrangementer
            </h3>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-[12px] text-[#4a6080]">Ingen kommende arrangementer.</p>
              </div>
            ) : (
              upcomingEvents.map(event => {
                const percentage = getAttendancePercentage(event.id);
                const color = percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-red-400';
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-4 cursor-pointer hover:border-sky-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-bold text-slate-200">
                          {event.type === 'match' ? '⚽' : '🏃'} {event.title}
                        </div>
                        <div className="text-[10px] text-[#4a6080] mt-0.5">
                          {new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })}
                          {event.time && ` · ${event.time}`}
                          {event.location && ` · 📍 ${event.location}`}
                        </div>
                      </div>
                      <div className={`text-[20px] font-black ${color}`}>
                        {percentage}%
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, background: percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444' }}
                      />
                    </div>
                    <div className="text-[9px] text-[#4a6080] mt-2">
                      {Object.values(getAttendanceForEvent(event.id)).filter(v => v === true).length} / {homePlayers.length} spillere
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : selectedEvent ? (
          // Vis detaljer for valgt arrangement
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setSelectedEventId(null)}
              className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-4 flex items-center gap-1"
            >
              ‹ Tilbake til liste
            </button>
            
            <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-4 mb-4">
              <h3 className="text-base font-bold text-slate-100">
                {selectedEvent.type === 'match' ? '⚽' : '🏃'} {selectedEvent.title}
              </h3>
              <div className="text-[11px] text-[#4a6080] mt-1">
                {new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('nb-NO', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
                {selectedEvent.time && ` · ${selectedEvent.time}`}
                {selectedEvent.location && ` · 📍 ${selectedEvent.location}`}
              </div>
            </div>
            
            <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] overflow-hidden">
              <div className="px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    👥 Spillere ({homePlayers.length})
                  </span>
                  {canEdit && (
                    <span className="text-[9px] text-amber-400">
                      Trykk på ✅ for å registrere fremmøte
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-[#1e3050]">
                {homePlayers.map((player: any) => {
                  const attended = selectedAttendance[player.id] || false;
                  const playerName = getPlayerName(player.id);
                  const meta = (() => {
                    const roleMeta: any = {
                      keeper: { color: '#fbbf24', emoji: '🧤' },
                      defender: { color: '#3b82f6', emoji: '🛡️' },
                      midfielder: { color: '#22c55e', emoji: '⚡' },
                      forward: { color: '#ef4444', emoji: '⚽' },
                    };
                    return roleMeta[player.role as keyof typeof roleMeta] || { color: '#6b7280', emoji: '👤' };
                  })();
                  
                  return (
                    <div key={player.id} className="flex items-center gap-3 p-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ background: meta.color }}
                      >
                        {player.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-slate-200 truncate">
                          {playerName}
                        </div>
                        <div className="text-[9px] text-[#4a6080]">
                          {meta.emoji} #{player.num}
                        </div>
                      </div>
                      {canEdit ? (
                        <button
                          onClick={() => toggleAttendance(selectedEvent.id, player.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all
                            ${attended 
                              ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400' 
                              : 'bg-[#1e3050] border border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}
                        >
                          {attended ? '✅' : '⬜'}
                        </button>
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                          ${attended ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e3050] text-[#4a6080]'}`}>
                          {attended ? '✅' : '❌'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {canEdit && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="text-[10px] text-amber-400 flex items-center gap-1">
                  <span>💡</span> 
                  <span>Klikk på ✅/⬜ for å registrere fremmøte. Data lagres automatisk.</span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};