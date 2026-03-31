'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';

interface PlayerProfileProps {
  onClose?: () => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onClose }) => {
  const { currentUser, playerAccounts, updatePlayerAccount, sport } = useAppStore();
  
  const myAccount = (playerAccounts as any[]).find(
    (a: any) => a.playerId === currentUser?.playerId
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: myAccount?.name || '',
    birthDate: myAccount?.birthDate || '',
    height: myAccount?.height || '',
    weight: myAccount?.weight || '',
    positionPreferences: myAccount?.positionPreferences || [],
    experience: myAccount?.experience || '',
  });
  
  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    myAccount?.positionPreferences || []
  );
  
  const roles = getRolesForSport(sport === 'football7' ? 'football' : sport);
  
  const togglePosition = (pos: string) => {
    setSelectedPositions(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };
  
  const handleSave = () => {
    if (!myAccount) return;
    
    updatePlayerAccount(myAccount.id, {
      name: formData.name,
      birthDate: formData.birthDate || undefined,
      height: formData.height ? Number(formData.height) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      positionPreferences: selectedPositions,
      experience: formData.experience || undefined,
    });
    
    setIsEditing(false);
  };
  
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  
  const age = calculateAge(formData.birthDate);
  
  if (!myAccount) {
    return (
      <div className="p-4 text-center text-[#4a6080]">
        <div className="text-3xl mb-2">👤</div>
        <p className="text-sm">Ingen profildata tilgjengelig.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
          <span>👤</span> Min profil
          {onClose && (
            <button onClick={onClose} className="text-[#4a6080] hover:text-white ml-2">✕</button>
          )}
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 transition"
          >
            ✎ Rediger
          </button>
        )}
      </div>
      
      {/* Innhold */}
      <div className="flex-1 p-4 space-y-4">
        
        {/* Avatar / Bilde */}
        <div className="flex justify-center mb-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-4xl">
            {myAccount.name?.charAt(0) || '👤'}
          </div>
        </div>
        
        {/* Navn */}
        <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
          <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
            Navn
          </div>
          {isEditing ? (
            <input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
            />
          ) : (
            <div className="text-[15px] font-bold text-slate-200">{myAccount.name}</div>
          )}
        </div>
        
        {/* Alder / Fødselsdato */}
        <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
          <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
            Fødselsdato / Alder
          </div>
          {isEditing ? (
            <input
              type="date"
              value={formData.birthDate}
              onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
            />
          ) : (
            <div className="text-[13px] text-slate-200">
              {formData.birthDate ? (
                <>
                  {new Date(formData.birthDate).toLocaleDateString('nb-NO')}
                  {age && <span className="text-[#4a6080] ml-2">({age} år)</span>}
                </>
              ) : (
                <span className="text-[#4a6080]">Ikke oppgitt</span>
              )}
            </div>
          )}
        </div>
        
        {/* Høyde / Vekt */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
            <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
              Høyde (cm)
            </div>
            {isEditing ? (
              <input
                type="number"
                value={formData.height}
                onChange={e => setFormData({ ...formData, height: e.target.value })}
                placeholder="175"
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            ) : (
              <div className="text-[13px] text-slate-200">
                {formData.height ? `${formData.height} cm` : '—'}
              </div>
            )}
          </div>
          
          <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
            <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
              Vekt (kg)
            </div>
            {isEditing ? (
              <input
                type="number"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                placeholder="70"
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            ) : (
              <div className="text-[13px] text-slate-200">
                {formData.weight ? `${formData.weight} kg` : '—'}
              </div>
            )}
          </div>
        </div>
        
        {/* Foretrukne posisjoner */}
        <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
          <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-2">
            Foretrukne posisjoner
          </div>
          {isEditing ? (
            <div className="flex flex-wrap gap-1.5">
              {roles.map(role => {
                const meta = ROLE_META[role as keyof typeof ROLE_META];
                if (!meta) return null;
                const isSelected = selectedPositions.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => togglePosition(role)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all
                      ${isSelected 
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400' 
                        : 'border-[#1e3050] text-[#4a6080] hover:border-sky-500/50'}`}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedPositions.length > 0 ? (
                selectedPositions.map(pos => {
                  const meta = ROLE_META[pos as keyof typeof ROLE_META];
                  return meta ? (
                    <span key={pos} className="text-[10px] px-2 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {meta.emoji} {meta.label}
                    </span>
                  ) : null;
                })
              ) : (
                <span className="text-[11px] text-[#4a6080]">Ingen posisjoner valgt</span>
              )}
            </div>
          )}
        </div>
        
        {/* Erfaring */}
        <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
          <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
            Erfaring / Om meg
          </div>
          {isEditing ? (
            <textarea
              value={formData.experience}
              onChange={e => setFormData({ ...formData, experience: e.target.value })}
              rows={3}
              placeholder="Antall år spilt, tidligere klubber, spesielle ferdigheter..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12px] text-slate-200 resize-none focus:outline-none focus:border-sky-500"
            />
          ) : (
            <div className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">
              {formData.experience || <span className="text-[#4a6080]">Ingen erfaring lagt til</span>}
            </div>
          )}
        </div>
        
        {/* Lagre knapp (ved redigering) */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 rounded-lg border border-[#1e3050] text-[#4a6080] text-[13px] font-bold hover:text-slate-300 transition"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 transition"
            >
              Lagre profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};