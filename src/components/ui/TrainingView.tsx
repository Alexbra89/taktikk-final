'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getDrillsBySport, toDrillSport, DrillExercise } from '@/data/drills';

// ═══════════════════════════════════════════════════════════════
//  TRENING-VISNING — trener og spiller
//  Trener: ser alle treninger, markerer fremmøte, legger til øvelser
//  Spiller: ser egne treninger, individuell plan, eget fremmøte
// ═══════════════════════════════════════════════════════════════

export const TrainingView: React.FC = () => {
  const {
    currentUser, events, playerAccounts, phases, activePhaseIdx,
    sport, addEvent, updateEvent, deleteEvent,
    addTrainingNote, deleteTrainingNote, updatePlayerAccount,
  } = useAppStore();

  const isCoach    = currentUser?.role === 'coach';
  const myAccId    = currentUser?.accountId;
  const myPlayerId = currentUser?.playerId;
  const myAcc      = (playerAccounts as any[]).find((a: any) => a.id === myAccId);

  const [tab, setTab] = useState<'upcoming' | 'history' | 'individual'>('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const trainings = useMemo(() =>
    events.filter(e => e.type === 'training').sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );
  const upcoming  = trainings.filter(e => e.date >= today);
  const past      = trainings.filter(e => e.date < today).reverse();

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  if (selectedEvent) {
    return (
      <TrainingDetail
        event={selectedEvent}
        isCoach={isCoach}
        myPlayerId={myPlayerId}
        playerAccounts={playerAccounts as any[]}
        sport={sport}
        onBack={() => setSelectedEventId(null)}
        onUpdate={(fields) => updateEvent(selectedEvent.id, fields)}
        onAddNote={(note) => addTrainingNote(selectedEvent.id, note)}
        onDeleteNote={(nid) => deleteTrainingNote(selectedEvent.id, nid)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <h2 className="text-sm font-black text-slate-100">🏃 Trening</h2>
        <p className="text-[10px] text-[#4a6080] mt-0.5">
          {isCoach ? 'Alle treninger — marker fremmøte og legg til øvelser'
                   : 'Dine treninger og individuell plan'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-[#1e3050] bg-[#0c1525]">
        {([
          ['upcoming', `📅 Kommende (${upcoming.length})`],
          ['history',  `📋 Historikk (${past.length})`],
          ['individual','🎯 Individuell'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-3 text-[10.5px] font-semibold transition-all min-h-[44px] leading-tight px-1
              ${tab === id ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── KOMMENDE ── */}
        {tab === 'upcoming' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {upcoming.length === 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-[12px] text-[#4a6080]">Ingen kommende treninger.</p>
                {isCoach && (
                  <p className="text-[11px] text-[#3a5070] mt-1">
                    Opprett treninger i Kalender-fanen.
                  </p>
                )}
              </div>
            )}
            {upcoming.map(ev => (
              <TrainingCard key={ev.id} event={ev} isCoach={isCoach}
                myPlayerId={myPlayerId}
                onClick={() => setSelectedEventId(ev.id)} />
            ))}
          </div>
        )}

        {/* ── HISTORIKK ── */}
        {tab === 'history' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {past.length === 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-[12px] text-[#4a6080]">Ingen gjennomførte treninger ennå.</p>
              </div>
            )}
            {past.map(ev => (
              <TrainingCard key={ev.id} event={ev} isCoach={isCoach}
                myPlayerId={myPlayerId} past
                onClick={() => setSelectedEventId(ev.id)} />
            ))}
          </div>
        )}

        {/* ── INDIVIDUELL ── */}
        {tab === 'individual' && (
          <div className="max-w-2xl mx-auto">
            {isCoach ? (
              <CoachIndividualPanel
                playerAccounts={playerAccounts as any[]}
                onUpdate={(id, note) => updatePlayerAccount(id, { individualTrainingNote: note })}
              />
            ) : (
              <PlayerIndividualPanel acc={myAcc} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ TRAINING CARD ════════════════════════════════════════════

const TrainingCard: React.FC<{
  event: any; isCoach: boolean; myPlayerId?: string;
  past?: boolean; onClick: () => void;
}> = ({ event, isCoach, myPlayerId, past, onClick }) => {
  const dateStr = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  // Check if this player is marked as attended
  const iAttended = myPlayerId && event.trainingNotes?.some(
    (tn: any) => tn.targetPlayerIds?.includes(myPlayerId)
  );

  const attendeeCount = event.trainingNotes?.reduce((acc: number, tn: any) =>
    acc + (tn.targetPlayerIds?.length ?? 0), 0) ?? 0;

  return (
    <div onClick={onClick}
      className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060]
        cursor-pointer transition-all active:scale-[0.99]">
      <div className="flex items-center gap-3 p-3.5">
        <div className={`w-2 h-12 rounded-full flex-shrink-0 ${past ? 'bg-[#2e4060]' : 'bg-emerald-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-slate-200 truncate">{event.title}</div>
          <div className="text-[10.5px] text-[#4a6080]">
            {dateStr}{event.time && ` · ${event.time}`}
            {event.location && ` · 📍 ${event.location}`}
          </div>
          {event.trainingNotes?.length > 0 && (
            <div className="text-[10px] text-emerald-400/70 mt-0.5">
              📋 {event.trainingNotes[0].title}
              {event.trainingNotes.length > 1 && ` +${event.trainingNotes.length - 1}`}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isCoach && attendeeCount > 0 && (
            <div className="text-[9.5px] text-emerald-400 font-bold">
              ✅ {attendeeCount} møtte
            </div>
          )}
          {!isCoach && iAttended && (
            <div className="text-[9.5px] text-emerald-400 font-bold">✅ Du møtte</div>
          )}
          <span className="text-[#3a5070] text-[11px]">›</span>
        </div>
      </div>
    </div>
  );
};

// ═══ TRAINING DETAIL ══════════════════════════════════════════

const TrainingDetail: React.FC<{
  event: any; isCoach: boolean; myPlayerId?: string;
  playerAccounts: any[]; sport: string;
  onBack: () => void;
  onUpdate: (fields: any) => void;
  onAddNote: (note: any) => void;
  onDeleteNote: (nid: string) => void;
}> = ({ event, isCoach, myPlayerId, playerAccounts, sport, onBack, onUpdate, onAddNote, onDeleteNote }) => {
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedDrill, setSelectedDrill] = useState<DrillExercise | null>(null);
  const [showDrillPicker, setShowDrillPicker] = useState(false);

  const drills = getDrillsBySport(toDrillSport(sport));
  const dateStr = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // All playerIds who attended (from all trainingNotes)
  const attendedIds = new Set<string>(
    event.trainingNotes?.flatMap((tn: any) => tn.targetPlayerIds ?? []) ?? []
  );

  const toggleAttendance = (playerId: string) => {
    // Find or create an attendance note
    const attNote = event.trainingNotes?.find((tn: any) => tn.title === '✅ Fremmøte');
    if (attNote) {
      const ids: string[] = attNote.targetPlayerIds ?? [];
      const newIds = ids.includes(playerId)
        ? ids.filter((id: string) => id !== playerId)
        : [...ids, playerId];
      onUpdate({
        trainingNotes: event.trainingNotes.map((tn: any) =>
          tn.id === attNote.id ? { ...tn, targetPlayerIds: newIds } : tn
        ),
      });
    } else {
      onAddNote({
        title: '✅ Fremmøte',
        content: 'Fremmøteregistrering',
        focus: [],
        targetPlayerIds: [playerId],
      });
    }
  };

  const saveNote = () => {
    if (!noteTitle.trim() && !selectedDrill) return;
    onAddNote({
      title: selectedDrill ? selectedDrill.name : noteTitle.trim(),
      content: selectedDrill ? selectedDrill.description : noteContent.trim(),
      focus: [],
      targetPlayerIds: [],
    });
    setNoteTitle(''); setNoteContent(''); setSelectedDrill(null); setShowAddNote(false);
  };

  const myNotes = myPlayerId
    ? event.trainingNotes?.filter((tn: any) => tn.targetPlayerIds?.includes(myPlayerId) || tn.targetPlayerIds?.length === 0)
    : event.trainingNotes ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <button onClick={onBack} className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-2 flex items-center gap-1">
          ‹ Tilbake
        </button>
        <h2 className="text-base font-black text-slate-100">{event.title}</h2>
        <p className="text-[10.5px] text-[#4a6080]">
          {dateStr}{event.time && ` · ${event.time}`}
          {event.location && ` · 📍 ${event.location}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">

        {/* Trenernotat */}
        {event.teamNote && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="text-[9.5px] font-bold text-amber-400 uppercase tracking-wider mb-2">📝 Fra trener</div>
            <p className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-wrap">{event.teamNote}</p>
          </div>
        )}
        {isCoach && (
          <div>
            <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Generelt notat</div>
            <textarea value={event.teamNote ?? ''} onChange={e => onUpdate({ teamNote: e.target.value })}
              rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5
                text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
          </div>
        )}

        {/* Fremmøte — kun trener */}
        {isCoach && (
          <div>
            <button onClick={() => setShowAttendance(!showAttendance)}
              className="flex items-center gap-2 w-full text-left mb-2">
              <span className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider">
                ✅ Fremmøte ({attendedIds.size}/{playerAccounts.length})
              </span>
              <span className="text-[#3a5070] text-[9px]">{showAttendance ? '▲' : '▼'}</span>
            </button>
            {showAttendance && (
              <div className="grid grid-cols-2 gap-2">
                {playerAccounts.map((acc: any) => {
                  const attended = attendedIds.has(acc.playerId);
                  return (
                    <button key={acc.id} onClick={() => toggleAttendance(acc.playerId)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left
                        ${attended
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#0f1a2a] border-[#1e3050] text-[#4a6080]'}`}>
                      <span className="text-[14px]">{attended ? '✅' : '⬜'}</span>
                      <span className="text-[11.5px] font-semibold truncate">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Øvelser / Notater */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider">
              📋 Øvelser og notater
            </span>
            {isCoach && (
              <button onClick={() => setShowAddNote(!showAddNote)}
                className="ml-auto text-[10px] text-sky-400 hover:text-sky-300 font-semibold">
                ＋ Legg til
              </button>
            )}
          </div>

          {/* Legg til note/øvelse */}
          {isCoach && showAddNote && (
            <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-xl p-4 mb-3">
              {/* Velg fra øvelsesbibliotek */}
              <button onClick={() => setShowDrillPicker(!showDrillPicker)}
                className="w-full text-left py-2 px-3 rounded-lg border border-[#1e3050]
                  text-[12px] text-[#4a6080] hover:border-sky-500/50 mb-3 flex items-center justify-between">
                <span>{selectedDrill ? `📋 ${selectedDrill.name}` : '– Velg fra øvelsesbibliotek –'}</span>
                <span>{showDrillPicker ? '▲' : '▼'}</span>
              </button>
              {showDrillPicker && (
                <div className="bg-[#111c30] border border-[#1e3050] rounded-xl max-h-40 overflow-y-auto mb-3">
                  <button onClick={() => { setSelectedDrill(null); setShowDrillPicker(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] text-[#4a6080] hover:bg-[#1a2a40] border-b border-[#1e3050]">
                    – Ingen øvelse –
                  </button>
                  {drills.slice(0, 30).map(d => (
                    <button key={d.id} onClick={() => { setSelectedDrill(d); setShowDrillPicker(false); setNoteTitle(d.name); }}
                      className="w-full text-left px-3 py-2 text-[11.5px] text-slate-300 hover:bg-[#1a2a40] border-b border-[#1e3050]/50">
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-[9.5px] text-[#4a6080]">{d.duration} min · {d.difficulty}</div>
                    </button>
                  ))}
                </div>
              )}
              {!selectedDrill && (
                <>
                  <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)}
                    placeholder="Tittel" className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2
                      text-[12.5px] text-slate-300 focus:outline-none focus:border-sky-500 mb-2 min-h-[40px]" />
                  <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                    rows={2} placeholder="Beskrivelse..."
                    className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2
                      text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2" />
                </>
              )}
              <div className="flex gap-2">
                <button onClick={saveNote}
                  className="flex-1 py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12px] hover:bg-sky-500/25">
                  Lagre
                </button>
                <button onClick={() => setShowAddNote(false)}
                  className="px-4 py-2 rounded-lg border border-[#1e3050] text-[#4a6080] text-[12px]">
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Eksisterende noter */}
          {(isCoach ? event.trainingNotes : myNotes)
            ?.filter((tn: any) => tn.title !== '✅ Fremmøte')
            .map((tn: any) => (
            <div key={tn.id} className="bg-[#0f1a2a] border border-[#1e3050] rounded-xl p-4 mb-2">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[13px] font-bold text-slate-200">{tn.title}</span>
                {isCoach && (
                  <button onClick={() => onDeleteNote(tn.id)}
                    className="text-red-400/50 hover:text-red-400 text-xs ml-2 flex-shrink-0">✕</button>
                )}
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed whitespace-pre-wrap">{tn.content}</p>
            </div>
          ))}

          {(isCoach ? event.trainingNotes : myNotes)?.filter((tn: any) => tn.title !== '✅ Fremmøte').length === 0 && (
            <p className="text-[11px] text-[#3a5070] italic">Ingen øvelser lagt til ennå.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══ INDIVIDUELL PANEL ════════════════════════════════════════

const CoachIndividualPanel: React.FC<{
  playerAccounts: any[];
  onUpdate: (id: string, note: string) => void;
}> = ({ playerAccounts, onUpdate }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const acc = playerAccounts.find((a: any) => a.id === selected);

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-100 mb-2">🎯 Individuell treningsplan</h3>
      <p className="text-[11px] text-[#4a6080] mb-4 leading-relaxed">
        Skriv individuelle treningsnotater per spiller. Spilleren ser kun sin egen plan.
      </p>

      <div className="mb-4">
        <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Velg spiller</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {playerAccounts.map((a: any) => (
            <button key={a.id} onClick={() => {
              setSelected(a.id);
              setNote(a.individualTrainingNote ?? '');
              setSaved(false);
            }}
              className={`p-2.5 rounded-xl border text-left transition-all
                ${selected === a.id
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                  : 'bg-[#0f1a2a] border-[#1e3050] text-slate-300 hover:border-[#2e4060]'}`}>
              <div className="text-[12px] font-bold truncate">{a.name}</div>
              {a.individualTrainingNote && (
                <div className="text-[9.5px] text-emerald-400 mt-0.5">✓ Plan satt</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selected && acc && (
        <div>
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
            Individuell plan for {acc.name}
          </div>
          <textarea value={note} onChange={e => { setNote(e.target.value); setSaved(false); }}
            rows={6} placeholder="Skriv individuell treningsplan, mål og fokusområder for denne spilleren..."
            className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-3
              text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500
              leading-relaxed mb-3" />
          <button onClick={() => { onUpdate(selected, note); setSaved(true); }}
            className={`w-full py-3 rounded-xl font-bold text-[13px] transition min-h-[48px]
              ${saved
                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                : 'bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25'}`}>
            {saved ? '✓ Lagret!' : 'Lagre plan'}
          </button>
        </div>
      )}

      {playerAccounts.length === 0 && (
        <p className="text-[12px] text-[#4a6080] italic text-center py-8">
          Ingen spillere registrert ennå. Legg til spillere via ⚙️ Spillere-fanen.
        </p>
      )}
    </div>
  );
};

const PlayerIndividualPanel: React.FC<{ acc: any }> = ({ acc }) => {
  if (!acc?.individualTrainingNote) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2">🎯</div>
        <p className="text-[12px] text-[#4a6080]">
          Treneren har ikke satt opp en individuell plan for deg ennå.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-100 mb-4">🎯 Din individuelle treningsplan</h3>
      <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5">
        <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
          {acc.individualTrainingNote}
        </p>
      </div>
    </div>
  );
};
