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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState({
    name: myAccount?.name || '',
    birthDate: myAccount?.birthDate || '',
    height: myAccount?.height || '',
    weight: myAccount?.weight || '',
    positionPreferences: myAccount?.positionPreferences || '',
    experience: myAccount?.experience || '',
    preferredFoot: myAccount?.preferredFoot || '',
    strongFoot: myAccount?.strongFoot || '',
    preferredLanguage: myAccount?.preferredLanguage || '',
  });

  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    myAccount?.positionPreferences ? myAccount.positionPreferences.split(',').filter(Boolean) : []
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
      positionPreferences: selectedPositions.join(','),
      experience: formData.experience || undefined,
      preferredFoot: formData.preferredFoot || undefined,
      strongFoot: formData.strongFoot || undefined,
      preferredLanguage: formData.preferredLanguage || undefined,
    });

    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    setPasswordError('');

    if (!newPassword) {
      setPasswordError('Fyll inn nytt passord');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Passordet må være minst 4 tegn');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passordene stemmer ikke overens');
      return;
    }

    if (!myAccount) return;

    updatePlayerAccount(myAccount.id, {
      password: newPassword,
    });

    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
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
        <div className="flex gap-2">
          {!isEditing && !isChangingPassword && (
            <>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition"
              >
                🔒 Endre passord
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 transition"
              >
                ✎ Rediger profil
              </button>
            </>
          )}
        </div>
      </div>

      {/* Innhold */}
      <div className="flex-1 p-4 space-y-4">

        {/* Passord-endring modal */}
        {isChangingPassword && (
          <div className="bg-[#0f1a2a] rounded-xl p-4 border border-amber-500/30">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[12px] font-bold text-amber-400">🔒 Endre passord</h3>
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordError('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-[#4a6080] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-[#4a6080] block mb-1">
                  Nytt passord
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minst 4 tegn"
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#4a6080] block mb-1">
                  Bekreft passord
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Skriv passordet på nytt"
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              {passwordError && (
                <p className="text-red-400 text-[11px]">{passwordError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordError('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 py-2 rounded-lg border border-[#1e3050] text-[#4a6080] text-[12px] font-bold"
                >
                  Avbryt
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[12px] hover:bg-amber-500/25 transition"
                >
                  Lagre nytt passord
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Fotpreferanse */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
            <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
              Foretrukket fot
            </div>
            {isEditing ? (
              <select
                value={formData.preferredFoot}
                onChange={e => setFormData({ ...formData, preferredFoot: e.target.value })}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Velg...</option>
                <option value="left">👈 Venstre</option>
                <option value="right">👉 Høyre</option>
                <option value="both">🤝 Begge</option>
              </select>
            ) : (
              <div className="text-[13px] text-slate-200">
                {formData.preferredFoot === 'left' && '👈 Venstre'}
                {formData.preferredFoot === 'right' && '👉 Høyre'}
                {formData.preferredFoot === 'both' && '🤝 Begge'}
                {!formData.preferredFoot && '—'}
              </div>
            )}
          </div>

          <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
            <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
              Sterkeste fot
            </div>
            {isEditing ? (
              <select
                value={formData.strongFoot}
                onChange={e => setFormData({ ...formData, strongFoot: e.target.value })}
                className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Velg...</option>
                <option value="left">👈 Venstre</option>
                <option value="right">👉 Høyre</option>
              </select>
            ) : (
              <div className="text-[13px] text-slate-200">
                {formData.strongFoot === 'left' && '👈 Venstre'}
                {formData.strongFoot === 'right' && '👉 Høyre'}
                {!formData.strongFoot && '—'}
              </div>
            )}
          </div>
        </div>

        {/* Språkpreferanse */}
        <div className="bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
          <div className="text-[9px] font-bold text-[#4a6080] uppercase tracking-wider mb-1">
            Foretrukket språk
          </div>
          {isEditing ? (
            <select
              value={formData.preferredLanguage}
              onChange={e => setFormData({ ...formData, preferredLanguage: e.target.value })}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">Velg...</option>
              <option value="norwegian">🇳🇴 Norsk</option>
              <option value="english">🇬🇧 English</option>
              <option value="other">🌍 Annet</option>
            </select>
          ) : (
            <div className="text-[13px] text-slate-200">
              {formData.preferredLanguage === 'norwegian' && '🇳🇴 Norsk'}
              {formData.preferredLanguage === 'english' && '🇬🇧 English'}
              {formData.preferredLanguage === 'other' && '🌍 Annet'}
              {!formData.preferredLanguage && '—'}
            </div>
          )}
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
                    <span
                      key={pos}
                      className="text-[10px] px-2 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    >
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