import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  RotateCcw,
  Compass,
  ShieldAlert,
  Trophy,
  FileText,
  ArrowRight,
  Award,
  Crown,
  Zap,
} from 'lucide-react';
import { GameState, PersonalBestRecord, VictoryClassification } from '../types/game';
import { formatTime } from './GameHud';
import {
  CLIFFHANGER_DOOR_NOTE,
  EVIDENCE_ORDER,
  GLOBAL_MAX_HINTS,
  VICTORY_CLASSIFICATION_META,
} from '../data/gameContent';

import { AchievementId, EscapeRank } from '../types/platform';
import { ACHIEVEMENTS } from '../game-engine/RankAndAchievementManager';

interface EndingOverlayProps {
  state: GameState;
  personalBest: PersonalBestRecord | null;
  onPlayAgain: () => void;
  onExploreRoomAgain: () => void;
  escapeRank?: EscapeRank | null;
  unlockedAchievements?: AchievementId[];
  onExitToLauncher?: () => void;
  onContinueNextCampaign?: () => void;
}

type VictoryStep = 'corridor' | 'escaped_title' | 'door_note' | 'cliffhanger' | 'summary';

export function resolveVictoryClassification(hintsUsedTotal: number): VictoryClassification {
  if (hintsUsedTotal <= 0) return 'PERFECT_ESCAPE';
  if (hintsUsedTotal === 1) return 'SMART_ESCAPE';
  return 'NARROW_ESCAPE';
}

export const EndingOverlay: React.FC<EndingOverlayProps> = ({
  state,
  personalBest,
  onPlayAgain,
  onExploreRoomAgain,
  escapeRank,
  unlockedAchievements = [],
  onExitToLauncher,
  onContinueNextCampaign,
}) => {
  const [victoryStep, setVictoryStep] = useState<VictoryStep>('corridor');
  const [failureReady, setFailureReady] = useState(false);

  const isDemo = state.timerMode === 'demo';
  const classification: VictoryClassification =
    state.victoryClassification ?? resolveVictoryClassification(state.hintsUsedTotal);
  const classMeta = VICTORY_CLASSIFICATION_META[classification];

  useEffect(() => {
    if (state.phase === 'VICTORY') {
      setVictoryStep('corridor');
      const t1 = window.setTimeout(() => setVictoryStep('escaped_title'), isDemo ? 1800 : 2800);
      const t2 = window.setTimeout(() => setVictoryStep('door_note'), isDemo ? 4300 : 6200);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    if (state.phase === 'FAILURE') {
      setFailureReady(false);
      const t = window.setTimeout(() => setFailureReady(true), isDemo ? 1600 : 2400);
      return () => window.clearTimeout(t);
    }
  }, [state.phase, isDemo]);

  const puzzlesSolvedCount = [
    state.puzzlesCompleted[1],
    state.puzzlesCompleted[2],
    state.puzzlesCompleted[3],
  ].filter(Boolean).length;

  if (state.phase === 'VICTORY') {
    if (victoryStep === 'corridor') {
      return (
        <div className="pointer-events-none fixed inset-x-0 bottom-14 z-40 flex justify-center px-4">
          <div className="rounded-lg border border-emerald-400/40 bg-[#08120e]/92 px-5 py-3 text-center shadow-2xl">
            <p className="font-mono-tabular text-xs font-bold tracking-widest text-emerald-300">
              DEADBOLT RELEASED · CORRIDOR CLEAR
            </p>
            <p className="mt-1 text-sm text-slate-200">
              The door swings open as the Warden&apos;s beam sweeps the far end of Block C...
            </p>
          </div>
        </div>
      );
    }

    if (victoryStep === 'escaped_title') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#04060a] px-6 text-center text-slate-100"
        >
          <motion.p
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`font-mono-tabular text-xs font-bold tracking-[0.28em] ${classMeta.accentClass}`}
          >
            11:59 PM · {classMeta.badge}
          </motion.p>
          <motion.h2
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl"
          >
            {classMeta.title}
          </motion.h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">{classMeta.headline}</p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className={`mt-6 rounded-lg border px-5 py-2.5 ${classMeta.borderClass} ${classMeta.bgClass}`}
          >
            <p className={`font-mono-tabular text-sm font-bold tracking-widest ${classMeta.accentClass}`}>
              ALL THREE LOCKS BREACHED · ROOM 307 CLEARED
            </p>
          </motion.div>
        </motion.div>
      );
    }

    if (victoryStep === 'door_note') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#05070d]/97 px-4 py-8 text-slate-100"
        >
          <p className="mb-4 font-mono-tabular text-xs font-semibold tracking-widest text-slate-400">
            OUTSIDE DOOR 307 · TAPED PAPER FOUND
          </p>
          <motion.div
            initial={{ scale: 0.9, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="w-full max-w-md rounded-lg border border-amber-200/35 bg-[#f4ecd8] p-7 text-left text-slate-900 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-2 border-b border-slate-900/15 pb-2.5 text-xs font-bold tracking-wider text-amber-900">
              <FileText className="h-4 w-4" />
              <span>NOTE ON EXTERIOR DOOR</span>
            </div>
            <pre className="whitespace-pre-wrap font-serif text-base italic leading-relaxed text-slate-900 sm:text-lg">
              {CLIFFHANGER_DOOR_NOTE}
            </pre>
          </motion.div>
          <button
            type="button"
            onClick={() => setVictoryStep('cliffhanger')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      );
    }

    if (victoryStep === 'cliffhanger') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black px-6 text-center text-slate-100"
        >
          <h2 className="font-display text-4xl font-bold tracking-widest text-amber-400 sm:text-5xl">
            THE END?
          </h2>
          <p className="mt-4 max-w-md text-sm text-slate-400">
            The corridor lights buzz behind you. Somewhere down the stairs, keys jingle again.
          </p>
          <button
            type="button"
            onClick={() => setVictoryStep('summary')}
            className="mt-8 inline-flex items-center gap-2 rounded-lg border border-white/25 bg-[#121826] px-5 py-2.5 text-xs font-semibold text-white hover:border-amber-400"
          >
            <span>View Escape Results</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      );
    }

    const ClassIcon =
      classification === 'PERFECT_ESCAPE'
        ? Crown
        : classification === 'SMART_ESCAPE'
          ? Award
          : Zap;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-[#04060a]/96 px-4 py-8 text-slate-100 overflow-y-auto"
      >
        <div
          className={`w-full max-w-xl rounded-2xl border bg-[#0b101b] p-6 text-center shadow-2xl sm:p-8 ${classMeta.borderClass}`}
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${classMeta.borderClass} ${classMeta.bgClass} ${classMeta.accentClass}`}
          >
            <ClassIcon className="h-7 w-7" />
          </motion.div>

          <p className={`mt-4 font-mono-tabular text-xs font-bold tracking-[0.22em] ${classMeta.accentClass}`}>
            {classMeta.badge}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">
            {classMeta.title}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
            {classMeta.summary}
          </p>

          {/* Personal Best Banner */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-[#141510] px-4 py-2.5 text-xs">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-slate-300">Personal Best Time:</span>
            <span className="font-mono-tabular font-bold text-amber-300">
              {personalBest ? formatTime(personalBest.bestTimeSeconds) : formatTime(state.elapsedSeconds)}
            </span>
            {state.isNewPersonalBest && (
              <span className="rounded bg-amber-500 px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold text-slate-950">
                NEW BEST
              </span>
            )}
          </div>

          {unlockedAchievements.length > 0 && (
            <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-950/25 p-3 text-left">
              <p className="font-mono-tabular text-[10px] font-bold tracking-widest text-emerald-300">
                ACHIEVEMENTS UNLOCKED ({unlockedAchievements.length})
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {unlockedAchievements.map((id) => (
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

          {/* Results Summary Grid */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 text-left sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Completion Time</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-white">
                {formatTime(state.elapsedSeconds)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Escape Rank</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-amber-300">
                RANK {escapeRank ?? 'A'} · {puzzlesSolvedCount}/3 Locks
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Hints Consumed</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-amber-300">
                {state.hintsUsedTotal}/{GLOBAL_MAX_HINTS}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Objects Investigated</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-white">
                {state.inspectedObjects.length}/10
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Evidence Discovered</p>
              <p className="mt-0.5 font-mono-tabular text-base font-bold text-white">
                {state.discoveredEvidence.length}/{EVIDENCE_ORDER.length}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121826] p-3">
              <p className="text-[11px] text-slate-400">Classification</p>
              <p className={`mt-0.5 font-mono-tabular text-xs font-bold ${classMeta.accentClass}`}>
                {classMeta.title}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {onContinueNextCampaign && (
              <button
                type="button"
                onClick={onContinueNextCampaign}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
              >
                <span>Campaign 02: Midnight Transmission</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={onExploreRoomAgain}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#141a28] px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-white/40"
            >
              <Compass className="h-4 w-4" />
              <span>Explore Room</span>
            </button>
            {onExitToLauncher && (
              <button
                type="button"
                onClick={onExitToLauncher}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#141a28] px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-400/50"
              >
                <span>Main Menu</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ENDING B — FAILURE
  if (!failureReady) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-14 z-40 flex justify-center px-4">
        <div className="rounded-lg border border-red-500/50 bg-[#19080c]/95 px-5 py-3 text-center shadow-2xl">
          <p className="font-mono-tabular text-xs font-bold tracking-widest text-red-300">
            FOOTSTEPS OUTSIDE...
          </p>
          <p className="mt-1 text-sm text-slate-100">
            A dark shadow slides beneath Door 307. The handle begins to turn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.65 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#070406]/95 px-4 py-8 text-slate-100"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/35 bg-[#120b0f] p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/35 bg-red-500/15 text-red-400">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <p className="mt-4 font-mono-tabular text-xs font-bold tracking-[0.22em] text-red-400">
          KNOCK KNOCK · MIDNIGHT INSPECTION
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-white">THE WARDEN IS HERE.</h2>
        <p className="mt-2 text-sm text-slate-300">YOU WERE SO CLOSE.</p>

        <div className="mt-5 rounded-lg border border-red-500/35 bg-red-950/40 px-4 py-3 space-y-1.5">
          <p className="font-mono-tabular text-sm font-bold tracking-wider text-red-300">
            ESCAPE FAILED
          </p>
          <p className="font-mono-tabular text-xs text-slate-300">
            Puzzles Solved: {puzzlesSolvedCount}/3 · Hints Consumed: {state.hintsUsedTotal}/
            {GLOBAL_MAX_HINTS}
          </p>
          <p className="font-mono-tabular text-xs text-slate-400">
            Objects: {state.inspectedObjects.length}/10 · Evidence:{' '}
            {state.discoveredEvidence.length}/{EVIDENCE_ORDER.length}
          </p>
          {personalBest && (
            <p className="font-mono-tabular text-[11px] text-amber-300 pt-1">
              Personal Best: {formatTime(personalBest.bestTimeSeconds)} (
              {VICTORY_CLASSIFICATION_META[personalBest.classification].title})
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-400"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          {onExitToLauncher && (
            <button
              type="button"
              onClick={onExitToLauncher}
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-[#171219] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-amber-400/50"
            >
              Main Menu
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
