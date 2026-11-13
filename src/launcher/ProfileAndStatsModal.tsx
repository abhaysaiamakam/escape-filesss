import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Trophy, User, X } from 'lucide-react';
import { formatTime } from '../components/GameHud';
import { CAMPAIGNS, CAMPAIGN_ORDER } from '../game-engine/CampaignRegistry';
import { ACHIEVEMENTS, ACHIEVEMENT_ORDER } from '../game-engine/RankAndAchievementManager';
import { AvatarId, PlatformData } from '../types/platform';
import { PlayerAvatarIcon } from './CampaignArtwork';

interface ProfileAndStatsModalProps {
  platform: PlatformData;
  initialTab: 'profile' | 'achievements' | 'stats';
  onUpdateProfile: (nickname: string, avatarId: AvatarId) => void;
  onClose: () => void;
}

const AVATAR_OPTIONS: Array<{ id: AvatarId; label: string }> = [
  { id: 'owasp', label: 'Block C Crest' },
  { id: 'radio', label: 'Signal Tech' },
  { id: 'key', label: 'Vault Key' },
  { id: 'cipher', label: 'Cipher Ring' },
];

export const ProfileAndStatsModal: React.FC<ProfileAndStatsModalProps> = ({
  platform,
  initialTab,
  onUpdateProfile,
  onClose,
}) => {
  const [tab, setTab] = useState(initialTab);
  const [nickname, setNickname] = useState(platform.profile.nickname);
  const [avatarId, setAvatarId] = useState<AvatarId>(platform.profile.avatarId);
  const [savedNotice, setSavedNotice] = useState(false);

  const unlockedCount = ACHIEVEMENT_ORDER.filter((id) => Boolean(platform.achievements[id])).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nickname.trim() || 'Investigator 307';
    onUpdateProfile(cleaned.slice(0, 28), avatarId);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Player Profile & Statistics"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0b101b] text-slate-100 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-[#101727] px-5 py-4">
          <div className="flex items-center gap-3">
            <PlayerAvatarIcon avatarId={platform.profile.avatarId} size={40} />
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {platform.profile.nickname}
              </h2>
              <p className="font-mono-tabular text-[11px] text-slate-400">
                Achievements: {unlockedCount}/{ACHIEVEMENT_ORDER.length} · Campaigns Cleared:{' '}
                {CAMPAIGN_ORDER.filter((c) => platform.completedCampaigns[c]).length}/3
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg border border-white/15 bg-[#172035] p-1.5 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="flex gap-1.5 border-b border-white/10 bg-[#0d1422] px-5 py-2.5 text-xs">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold ${
              tab === 'profile'
                ? 'bg-amber-500 text-slate-950'
                : 'border border-white/10 bg-[#141c2c] text-slate-300'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('achievements')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold ${
              tab === 'achievements'
                ? 'bg-amber-500 text-slate-950'
                : 'border border-white/10 bg-[#141c2c] text-slate-300'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Achievements ({unlockedCount}/{ACHIEVEMENT_ORDER.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('stats')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold ${
              tab === 'stats'
                ? 'bg-amber-500 text-slate-950'
                : 'border border-white/10 bg-[#141c2c] text-slate-300'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Statistics</span>
          </button>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto p-5">
          {tab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block font-mono-tabular text-xs font-bold text-slate-300">
                  INVESTIGATOR CALLSIGN
                </label>
                <input
                  type="text"
                  maxLength={28}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#121928] px-3.5 py-2.5 text-sm font-semibold text-white"
                />
              </div>

              <div>
                <p className="font-mono-tabular text-xs font-bold text-slate-300">SELECT EMBLEM</p>
                <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvatarId(opt.id)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs transition-colors ${
                        avatarId === opt.id
                          ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                          : 'border-white/10 bg-[#121928] text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <PlayerAvatarIcon avatarId={opt.id} size={40} />
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-mono-tabular text-xs text-emerald-300">
                  {savedNotice ? 'Profile saved locally in browser.' : ''}
                </span>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {tab === 'achievements' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ACHIEVEMENT_ORDER.map((id) => {
                const def = ACHIEVEMENTS[id];
                const unlocked = platform.achievements[id];
                return (
                  <div
                    key={id}
                    className={`rounded-xl border p-4 ${
                      unlocked
                        ? 'border-emerald-400/45 bg-[#0d1d17]'
                        : 'border-white/10 bg-[#101624] opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-[10px] font-bold tracking-wider text-slate-400">
                        {def.category}
                      </span>
                      {unlocked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-bold text-white">
                      {def.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300">{def.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'stats' && (
            <div className="space-y-3">
              {CAMPAIGN_ORDER.map((cId) => {
                const meta = CAMPAIGNS[cId];
                const st = platform.stats[cId];
                return (
                  <div
                    key={cId}
                    className="rounded-xl border border-white/10 bg-[#111827] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div>
                        <span className="font-mono-tabular text-[11px] font-bold text-amber-300">
                          {meta.numberLabel} · {meta.difficulty}
                        </span>
                        <h3 className="font-display text-base font-bold text-white">{meta.title}</h3>
                      </div>
                      <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                        {platform.completedCampaigns[cId]
                          ? `CLEARED · BEST RANK ${st.bestRank ?? '-'}`
                          : 'NOT COMPLETED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono-tabular text-xs sm:grid-cols-4">
                      <div>
                        <p className="text-[11px] text-slate-400">Attempts</p>
                        <p className="font-bold text-white">{st.attempts}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Completions</p>
                        <p className="font-bold text-emerald-300">{st.completions}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Best Time</p>
                        <p className="font-bold text-amber-300">
                          {st.bestTimeSeconds ? formatTime(st.bestTimeSeconds) : '--:--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Min Hints Used</p>
                        <p className="font-bold text-white">
                          {st.hintsUsedBest !== null ? `${st.hintsUsedBest}/2` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
