import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Compass,
  Crown,
  FileText,
  Home,
  RotateCcw,
  ShieldAlert,
  Trophy,
  Zap,
} from 'lucide-react';
import { AchievementId, CampaignId, EscapeRank } from '../../types/platform';
import { VictoryClassification } from '../../types/game';
import { ACHIEVEMENTS } from '../../game-engine/RankAndAchievementManager';
import { formatTime } from '../../components/GameHud';

interface GenericResultsOverlayProps {
  phase: 'VICTORY' | 'FAILURE';
  campaignId: CampaignId;
  campaignTitle: string;
  locationLabel: string;
  corridorBannerTitle: string;
  corridorBannerDetail: string;
  victoryHeadline: string;
  victoryNoteTitle: string;
  victoryNoteBody: string;
  victoryNextTeaser: string;
  failureHeadline: string;
  failureSubtext: string;
  failureBannerDetail: string;
  elapsedSeconds: number;
  bestTimeSeconds: number | null;
  isNewBestTime: boolean;
  hintsUsed: number;
  inspectedCount: number;
  totalObjects: number;
  evidenceCount: number;
  totalEvidence: number;
  classification: VictoryClassification;
  rank: EscapeRank;
  newlyUnlockedAchievements: AchievementId[];
  demoSpeed: boolean;
  nextCampaignLabel?: string;
  onNextCampaign?: () => void;
  onViewMasterEnding?: () => void;
  onPlayAgain: () => void;
  onExploreRoom: () => void;
  onExitToLauncher: () => void;
}

const CLASSIFICATION_COPY: Record<
  VictoryClassification,
  { title: string; badge: string; accent: string; border: string; bg: string }
> = {
  PERFECT_ESCAPE: {
    title: 'PERFECT ESCAPE',
    badge: '0 HINTS USED · CLEAN SOLVE',
    accent: 'text-emerald-300',
    border: 'border-emerald-400/50',
    bg: 'bg-emerald-950/35',
  },
  SMART_ESCAPE: {
    title: 'SMART ESCAPE',
    badge: '1 HINT USED · TACTICAL SOLVE',
    accent: 'text-sky-300',
    border: 'border-sky-400/50',
    bg: 'bg-sky-950/35',
  },
  NARROW_ESCAPE: {
    title: 'NARROW ESCAPE',
    badge: '2 HINTS USED · LAST-SECOND BREACH',
    accent: 'text-amber-300',
    border: 'border-amber-400/50',
    bg: 'bg-amber-950/35',
  },
};

export const GenericResultsOverlay: React.FC<GenericResultsOverlayProps> = ({
  phase,
  campaignTitle,
  locationLabel,
  corridorBannerTitle,
  corridorBannerDetail,
  victoryHeadline,
  victoryNoteTitle,
  victoryNoteBody,
  victoryNextTeaser,
  failureHeadline,
  failureSubtext,
  failureBannerDetail,
  elapsedSeconds,
  bestTimeSeconds,
  isNewBestTime,
  hintsUsed,
  inspectedCount,
  totalObjects,
  evidenceCount,
  totalEvidence,
  classification,
  rank,
  newlyUnlockedAchievements,
  demoSpeed,
  nextCampaignLabel,
  onNextCampaign,
  onViewMasterEnding,
  onPlayAgain,
  onExploreRoom,
  onExitToLauncher,
}) => {
  const [step, setStep] = useState<'scene' | 'title' | 'note' | 'summary'>('scene');
  const [failureReady, setFailureReady] = useState(false);

  const classMeta = CLASSIFICATION_COPY[classification];

  useEffect(() => {
    if (phase === 'VICTORY') {
      setStep('scene');
      const t1 = window.setTimeout(() => setStep('title'), demoSpeed ? 1400 : 2400);
      const t2 = window.setTimeout(() => setStep('note'), demoSpeed ? 3200 : 5000);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    setFailureReady(false);
    const tf = window.setTimeout(() => setFailureReady(true), demoSpeed ? 1300 : 2100);
    return () => window.clearTimeout(tf);
  }, [phase, demoSpeed]);

  if (phase === 'VICTORY') {
    if (step === 'scene') {
      return (
        <div className="pointer-events-none fixed inset-x-0 bottom-14 z-40 flex justify-center px-4">
          <div className="rounded-lg border border-emerald-400/40 bg-[#08120e]/95 px-5 py-3 text-center shadow-2xl">
            <p className="font-mono-tabular text-xs font-bold tracking-widest text-emerald-300">
              {corridorBannerTitle}
            </p>
            <p className="mt-1 text-sm text-slate-200">{corridorBannerDetail}</p>
          </div>
        </div>
      );
    }

    if (step === 'title') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#04060a] px-6 text-center text-slate-100"
        >
          <p className={`font-mono-tabular text-xs font-bold tracking-[0.28em] ${classMeta.accent}`}>
            {locationLabel.toUpperCase()} · {classMeta.badge}
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
            {classMeta.title}
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">{victoryHeadline}</p>
          <button
            type="button"
            onClick={() => setStep('note')}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      );
    }

    if (step === 'note') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#05070d]/97 px-4 py-8 text-slate-100"
        >
          <p className="mb-3 font-mono-tabular text-xs font-semibold tracking-widest text-slate-400">
            DISCOVERED BEYOND THE EXIT · {campaignTitle.toUpperCase()}
          </p>
          <div className="w-full max-w-lg rounded-xl border border-amber-200/30 bg-[#f4ecd8] p-6 text-left text-slate-900 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-900/15 pb-2.5 text-xs font-bold tracking-wider text-amber-900">
              <FileText className="h-4 w-4" />
              <span>{victoryNoteTitle}</span>
            </div>
            <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-900 sm:text-base">
              {victoryNoteBody}
            </pre>
            <p className="mt-4 border-t border-slate-900/15 pt-3 font-mono-tabular text-xs font-bold text-slate-700">
              {victoryNextTeaser}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep('summary')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <span>View Case Summary</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      );
    }

    const Icon =
      classification === 'PERFECT_ESCAPE'
        ? Crown
        : classification === 'SMART_ESCAPE'
          ? Award
          : Zap;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#04060a]/96 px-4 py-8 text-slate-100"
      >
        <div
          className={`w-full max-w-xl rounded-2xl border bg-[#0b101b] p-6 text-center shadow-2xl sm:p-8 ${classMeta.border}`}
        >
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${classMeta.border} ${classMeta.bg} ${classMeta.accent}`}
          >
            <Icon className="h-7 w-7" />
          </div>

          <p className={`mt-3 font-mono-tabular text-xs font-bold tracking-[0.22em] ${classMeta.accent}`}>
            {campaignTitle.toUpperCase()} · {classMeta.badge}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">
            {classMeta.title}
          </h2>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-amber-400/30 bg-[#141510] px-4 py-2.5 text-xs">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-slate-300">Best Time:</span>
            <span className="font-mono-tabular font-bold text-amber-300">
              {bestTimeSeconds ? formatTime(bestTimeSeconds) : formatTime(elapsedSeconds)}
            </span>
            {isNewBestTime && (
              <span className="rounded bg-amber-500 px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold text-slate-950">
                NEW BEST
              </span>
            )}
          </div>

          {newlyUnlockedAchievements.length > 0 && (
            <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-950/25 p-3 text-left">
              <p className="font-mono-tabular text-[10px] font-bold tracking-widest text-emerald-300">
                ACHIEVEMENTS UNLOCKED
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {newlyUnlockedAchievements.map((id) => (
                  <span
                    key={id}
                    className="rounded border border-emerald-400/35 bg-[#0a1612] px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-emerald-200"
                  >
                    {ACHIEVEMENTS[id].title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5 text-left sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Completion Time</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-white">
                {formatTime(elapsedSeconds)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Escape Rank</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-amber-300">
                RANK {rank} · 3/3 Locks
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Hints Consumed</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-amber-300">
                {hintsUsed}/2
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Objects Investigated</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-white">
                {inspectedCount}/{totalObjects}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Evidence Discovered</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-white">
                {evidenceCount}/{totalEvidence}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Classification</p>
              <p className={`mt-0.5 font-mono-tabular text-xs font-bold ${classMeta.accent}`}>
                {classMeta.title}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {onViewMasterEnding && (
              <button
                type="button"
                onClick={onViewMasterEnding}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Crown className="h-4 w-4" />
                <span>Unlock Master Ending Epilogue</span>
              </button>
            )}
            {onNextCampaign && nextCampaignLabel && (
              <button
                type="button"
                onClick={onNextCampaign}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
              >
                <span>{nextCampaignLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={onExploreRoom}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#141a28] px-4 py-2.5 text-sm font-semibold text-slate-100 hover:border-white/40"
            >
              <Compass className="h-4 w-4" />
              <span>Explore Scene</span>
            </button>
            <button
              type="button"
              onClick={onExitToLauncher}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#141a28] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-amber-400/50"
            >
              <Home className="h-4 w-4" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // FAILURE STATE
  if (!failureReady) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-14 z-40 flex justify-center px-4">
        <div className="rounded-lg border border-red-500/50 bg-[#19080c]/95 px-5 py-3 text-center shadow-2xl">
          <p className="font-mono-tabular text-xs font-bold tracking-widest text-red-300">
            TIME EXPIRED · BREACH DETECTED
          </p>
          <p className="mt-1 text-sm text-slate-100">{failureBannerDetail}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#070406]/95 px-4 py-8 text-slate-100"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/35 bg-[#120b0f] p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/35 bg-red-500/15 text-red-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <p className="mt-4 font-mono-tabular text-xs font-bold tracking-[0.22em] text-red-400">
          {campaignTitle.toUpperCase()} · MISSION FAILED
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-white">{failureHeadline}</h2>
        <p className="mt-2 text-sm text-slate-300">{failureSubtext}</p>

        <div className="mt-5 rounded-lg border border-red-500/35 bg-red-950/40 px-4 py-3 space-y-1 font-mono-tabular text-xs">
          <p className="text-red-300 font-bold">ESCAPE FAILED</p>
          <p className="text-slate-300">Hints Consumed: {hintsUsed}/2</p>
          <p className="text-slate-400">
            Objects: {inspectedCount}/{totalObjects} · Evidence: {evidenceCount}/{totalEvidence}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-400"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <button
            type="button"
            onClick={onExitToLauncher}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#171219] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-amber-400/50"
          >
            <Home className="h-4 w-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
