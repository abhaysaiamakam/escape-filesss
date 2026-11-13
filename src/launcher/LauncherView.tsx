import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Crown,
  Lock,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { formatTime } from '../components/GameHud';
import {
  CAMPAIGNS,
  CAMPAIGN_ORDER,
  PLATFORM_MASTER_TAGLINE,
  PLATFORM_SUBTITLE,
  PLATFORM_TAGLINE,
  PLATFORM_TITLE,
} from '../game-engine/CampaignRegistry';
import { hasSavedCampaignRun } from '../game-engine/PlatformStorage';
import {
  ACHIEVEMENT_ORDER,
  isCampaignUnlocked,
  isMasterEndingUnlocked,
} from '../game-engine/RankAndAchievementManager';
import { AvatarId, CampaignId, PlatformData, PlayerSettings } from '../types/platform';
import { CampaignCardArtwork, PlayerAvatarIcon } from './CampaignArtwork';
import { MasterEndingModal } from './MasterEndingModal';
import { ProfileAndStatsModal } from './ProfileAndStatsModal';
import { SettingsModal } from './SettingsModal';

interface LauncherViewProps {
  platform: PlatformData;
  onLaunchCampaign: (id: CampaignId, resumeSaved: boolean) => void;
  onUpdateProfile: (nickname: string, avatarId: AvatarId) => void;
  onUpdateSettings: (patch: Partial<PlayerSettings>) => void;
  onResetAllProgress: () => void;
  initialOpenMasterEnding?: boolean;
}

export const LauncherView: React.FC<LauncherViewProps> = ({
  platform,
  onLaunchCampaign,
  onUpdateProfile,
  onUpdateSettings,
  onResetAllProgress,
  initialOpenMasterEnding = false,
}) => {
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'achievements' | 'stats' | null>(
    null
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(initialOpenMasterEnding);

  const completedCount = CAMPAIGN_ORDER.filter((id) => platform.completedCampaigns[id]).length;
  const achievementsCount = ACHIEVEMENT_ORDER.filter((id) => Boolean(platform.achievements[id])).length;
  const masterUnlocked = isMasterEndingUnlocked(platform.completedCampaigns);

  // Determine default primary "Play / Continue" target cleanly
  const savedCampaign = CAMPAIGN_ORDER.find((id) => hasSavedCampaignRun(id)) ?? null;
  const nextCampaign: CampaignId =
    savedCampaign ??
    (!platform.completedCampaigns.easy
      ? 'easy'
      : !platform.completedCampaigns.medium
        ? 'medium'
        : 'difficult');

  return (
    <div className="custom-scroll min-h-screen w-full overflow-y-auto bg-[#060911] text-slate-100">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-[#090e1a]/95 px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Screenshot_2026-11-13_at_4.36.56_PM_b98e5be5.png"
              alt="Escape Files Emblem"
              className="h-9 w-9 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="font-display text-base font-bold tracking-tight text-white">
                {PLATFORM_TITLE}{' '}
                <span className="font-mono-tabular text-xs font-normal text-amber-400">
                  · {PLATFORM_SUBTITLE}
                </span>
              </p>
              <p className="font-mono-tabular text-[11px] text-slate-400">
                {PLATFORM_MASTER_TAGLINE}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Unlock Mode Switch */}
            <div className="flex rounded-lg border border-white/15 bg-[#0e1422] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onUpdateSettings({ unlockMode: 'normal' })}
                className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                  platform.settings.unlockMode === 'normal'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Normal Mode
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ unlockMode: 'judge_demo' })}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
                  platform.settings.unlockMode === 'judge_demo'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Judge Demo Unlock</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setProfileModalTab('achievements')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#101727] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-400/60"
            >
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>Achievements {achievementsCount}/{ACHIEVEMENT_ORDER.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileModalTab('stats')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#101727] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-400/60"
            >
              <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
              <span>Stats</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileModalTab('profile')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#101727] px-2.5 py-1 text-xs font-semibold text-white hover:border-amber-400/60"
            >
              <PlayerAvatarIcon avatarId={platform.profile.avatarId} size={24} />
              <span className="max-w-[120px] truncate">{platform.profile.nickname}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="rounded-lg border border-white/15 bg-[#101727] p-2 text-slate-200 hover:border-amber-400/60"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {/* Hero Banner */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0e1628] via-[#090e1a] to-[#120e0b] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="space-y-2">
              <p className="font-mono-tabular text-xs font-bold tracking-[0.26em] text-amber-400">
                {PLATFORM_SUBTITLE} · TRILOGY PROGRESS {completedCount}/3
              </p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {PLATFORM_TITLE}
              </h1>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">{PLATFORM_TAGLINE}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {masterUnlocked && (
                <button
                  type="button"
                  onClick={() => setMasterOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/50 bg-emerald-950/50 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-900/60"
                >
                  <Crown className="h-4 w-4 text-emerald-300" />
                  <span>Master Ending Epilogue</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onLaunchCampaign(nextCampaign, Boolean(savedCampaign))}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
              >
                <Play className="h-4 w-4" />
                <span>
                  {savedCampaign
                    ? `Continue: ${CAMPAIGNS[savedCampaign].title}`
                    : `Play ${CAMPAIGNS[nextCampaign].title}`}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Campaign Selection Cards */}
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-white">Select Campaign</h2>
            <p className="font-mono-tabular text-xs text-slate-400">
              {platform.settings.unlockMode === 'judge_demo'
                ? 'Judge Demo Mode active · All 3 campaigns open with full gameplay & strict 2-hint limits'
                : 'Normal progression · Clear Easy to unlock Medium, Medium to unlock Difficult'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {CAMPAIGN_ORDER.map((id) => {
              const meta = CAMPAIGNS[id];
              const unlocked = isCampaignUnlocked(
                id,
                platform.completedCampaigns,
                platform.settings.unlockMode
              );
              const completed = platform.completedCampaigns[id];
              const stat = platform.stats[id];
              const savedRun = hasSavedCampaignRun(id);

              return (
                <article
                  key={id}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-[#0b101b] transition-colors ${
                    unlocked
                      ? 'border-white/15 hover:border-amber-400/50'
                      : 'border-white/10 opacity-75'
                  }`}
                >
                  <div className="relative border-b border-white/10">
                    <CampaignCardArtwork campaignId={id} />
                    {!unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 text-slate-200">
                        <Lock className="h-6 w-6 text-amber-400" />
                        <p className="mt-2 font-mono-tabular text-xs font-bold">
                          CLEAR PREVIOUS CAMPAIGN TO UNLOCK
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="font-mono-tabular text-[11px] font-bold tracking-wider text-amber-400">
                        {meta.numberLabel} · {meta.difficulty} · {meta.estimatedMinutes} MIN ·{' '}
                        {meta.lockCount} LOCKS
                      </p>
                      <h3 className="mt-1.5 font-display text-xl font-bold text-white">
                        {meta.title}
                      </h3>
                      <p className="font-mono-tabular text-[11px] text-slate-400">
                        {meta.subtitle}
                      </p>

                      <p className="mt-3 text-xs leading-relaxed text-slate-300">
                        {meta.storyIntro}
                      </p>
                      <p className="mt-2.5 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Environment:</strong>{' '}
                        {meta.environmentPreview}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-white/10 pt-3.5">
                      <div className="flex items-center justify-between font-mono-tabular text-[11px]">
                        <span className={completed ? 'font-bold text-emerald-300' : 'text-slate-400'}>
                          {completed
                            ? `COMPLETED · RANK ${stat.bestRank ?? 'A'}`
                            : savedRun
                              ? 'RUN IN PROGRESS'
                              : unlocked
                                ? 'READY TO DEPLOY'
                                : 'LOCKED'}
                        </span>
                        <span className="text-slate-400">
                          Best: {stat.bestTimeSeconds ? formatTime(stat.bestTimeSeconds) : '--:--'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => onLaunchCampaign(id, savedRun)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                        >
                          <span>{savedRun ? 'Continue Run' : 'Start Campaign'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        {unlocked && savedRun && (
                          <button
                            type="button"
                            title="Start Fresh Run"
                            onClick={() => onLaunchCampaign(id, false)}
                            className="rounded-lg border border-white/15 bg-[#141b2b] p-2.5 text-slate-300 hover:border-amber-400 hover:text-amber-200"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {profileModalTab && (
        <ProfileAndStatsModal
          platform={platform}
          initialTab={profileModalTab}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setProfileModalTab(null)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={platform.settings}
          onUpdateSettings={onUpdateSettings}
          onResetAllProgress={onResetAllProgress}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {masterOpen && (
        <MasterEndingModal platform={platform} onClose={() => setMasterOpen(false)} />
      )}
    </div>
  );
};
