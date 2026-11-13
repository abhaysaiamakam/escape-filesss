import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Footprints,
  Home,
  LayoutGrid,
  Lightbulb,
  RotateCcw,
  ScrollText,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { formatTime } from '../../components/GameHud';
import { CAMPAIGNS } from '../../game-engine/CampaignRegistry';
import {
  consumeCampaignHint,
  GLOBAL_MAX_HINTS,
  THIRD_HINT_UNAVAILABLE_TEXT,
} from '../../game-engine/HintManager';
import {
  clearCampaignSnapshot,
  loadCampaignSnapshot,
  saveCampaignSnapshot,
} from '../../game-engine/PlatformStorage';
import {
  computeSharedWardenThreat,
  resolveClassificationFromHints,
} from '../../game-engine/RankAndAchievementManager';
import { Generic3DViewport } from '../../shared/components/Generic3DViewport';
import { GenericEvidenceBoardModal } from '../../shared/components/GenericEvidenceBoardModal';
import { GenericResultsOverlay } from '../../shared/components/GenericResultsOverlay';
import { SubtitleToast } from '../../shared/components/SubtitleToast';
import { ArchiveObjectId } from '../../three/archiveRoomBuilder';
import { GamePhase, WardenThreatState } from '../../types/game';
import {
  AchievementId,
  CampaignCompletionSummary,
  EscapeRank,
  PlayerSettings,
  SubtitleCue,
} from '../../types/platform';
import {
  CompassBearing,
  DIFFICULT_EVIDENCE_ITEMS,
  DIFFICULT_EVIDENCE_ORDER,
  DIFFICULT_INVENTORY_ITEMS,
  DIFFICULT_OBJECTS,
  DIFFICULT_OBJECT_ORDER,
  DIFFICULT_PAIR_DESCRIPTIONS,
  DIFFICULT_PUZZLE_HINTS,
  DifficultEvidenceId,
  DifficultInventoryId,
  validateDifficultCipher,
  validateDifficultTimeline,
  validateDifficultVault,
} from './difficultData';
import { DifficultInspectionModal } from './DifficultPuzzleModals';

interface DifficultState {
  phase: GamePhase;
  currentPuzzle: 1 | 2 | 3;
  puzzlesCompleted: { 1: boolean; 2: boolean; 3: boolean };
  cipherShift: number;
  timelineOrder: string[];
  vaultBearing: CompassBearing;
  vaultDigits: [number, number, number, number];
  hintsRemaining: number;
  hintsUsedTotal: number;
  hintsUsedByPuzzle: { 1: number; 2: number; 3: number };
  revealedHints: Array<{ puzzle: 1 | 2 | 3; hintIndex: number; text: string }>;
  thirdHintRejected: boolean;
  timeRemaining: number;
  elapsedSeconds: number;
  timerRunning: boolean;
  wardenState: WardenThreatState;
  inventory: DifficultInventoryId[];
  inspectedObjects: ArchiveObjectId[];
  discoveredEvidence: DifficultEvidenceId[];
  usedEvidence: DifficultEvidenceId[];
  evidenceConnections: Array<{ id: string; from: string; to: string }>;
  activeObject: ArchiveObjectId | null;
  logs: Array<{ id: string; time: string; title: string; detail: string }>;
  exploreAfterWin: boolean;
}

function createInitialDifficultState(demoSpeed: boolean, skipIntro = false): DifficultState {
  const duration = demoSpeed
    ? CAMPAIGNS.difficult.demoDurationSeconds
    : CAMPAIGNS.difficult.standardDurationSeconds;
  return {
    phase: skipIntro ? 'ROOM_INVESTIGATION' : 'INTRO',
    currentPuzzle: 1,
    puzzlesCompleted: { 1: false, 2: false, 3: false },
    cipherShift: 0,
    timelineOrder: ['1', '2', '4', '7'],
    vaultBearing: 'SOUTH',
    vaultDigits: [0, 0, 0, 0],
    hintsRemaining: GLOBAL_MAX_HINTS,
    hintsUsedTotal: 0,
    hintsUsedByPuzzle: { 1: 0, 2: 0, 3: 0 },
    revealedHints: [],
    thirdHintRejected: false,
    timeRemaining: duration,
    elapsedSeconds: 0,
    timerRunning: skipIntro,
    wardenState: 'DORMANT',
    inventory: [],
    inspectedObjects: [],
    discoveredEvidence: [],
    usedEvidence: [],
    evidenceConnections: [],
    activeObject: null,
    logs: [
      {
        id: 'diff-init',
        time: formatTime(duration),
        title: 'Descended into Underground Archive Vault B',
        detail:
          "Campaign 03: Break the Archive Cipher, reconstruct the 1994 Witness Timeline, and open the Mechanical Vault.",
      },
    ],
    exploreAfterWin: false,
  };
}

interface DifficultCampaignRunnerProps {
  settings: PlayerSettings;
  resumeSaved: boolean;
  bestTimeSeconds: number | null;
  onUpdateSettings: (patch: Partial<PlayerSettings>) => void;
  onAttemptStarted: () => void;
  onVictoryReported: (
    summary: Omit<CampaignCompletionSummary, 'newlyUnlockedAchievements' | 'rank' | 'isNewBestTime'>
  ) => {
    rank: EscapeRank;
    newlyUnlockedAchievements: AchievementId[];
    isNewBestTime: boolean;
  };
  onFailureReported: () => void;
  onExitToLauncher: () => void;
  onViewMasterEnding: () => void;
}

export const DifficultCampaignRunner: React.FC<DifficultCampaignRunnerProps> = ({
  settings,
  resumeSaved,
  bestTimeSeconds,
  onUpdateSettings,
  onAttemptStarted,
  onVictoryReported,
  onFailureReported,
  onExitToLauncher,
  onViewMasterEnding,
}) => {
  const [state, setState] = useState<DifficultState>(() => {
    if (resumeSaved) {
      const saved = loadCampaignSnapshot<DifficultState>('difficult');
      if (saved && saved.phase !== 'VICTORY' && saved.phase !== 'FAILURE') {
        return { ...saved, activeObject: null, timerRunning: saved.phase !== 'INTRO' };
      }
    }
    return createInitialDifficultState(settings.demoTimerSpeed, false);
  });

  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [boardOpen, setBoardOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'objects' | 'hints' | 'log' | 'audio'>(
    'none'
  );
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [subtitleCue, setSubtitleCue] = useState<SubtitleCue | null>(null);
  const [rankResult, setRankResult] = useState<{
    rank: EscapeRank;
    achievements: AchievementId[];
    isNewBestTime: boolean;
  } | null>(null);

  const attemptRef = useRef(resumeSaved);
  const prevThreatRef = useRef<WardenThreatState>(state.wardenState);

  const showSub = useCallback((speaker: string, text: string) => {
    setSubtitleCue({ id: String(Date.now()), speaker, text });
    window.setTimeout(() => setSubtitleCue(null), 4200);
  }, []);

  const flashBanner = useCallback((text: string) => {
    setBanner(text);
    window.setTimeout(() => setBanner(null), 4200);
  }, []);

  useEffect(() => {
    soundEngine.setCampaignProfile('difficult');
    soundEngine.setMuted(settings.soundMuted);
    soundEngine.setMasterVolume(settings.masterVolume);
    soundEngine.setAmbientEnabled(settings.ambientEnabled);
    if (state.phase !== 'INTRO') soundEngine.startAmbience();
    return () => {
      soundEngine.setPositionalCueLoopActive(false);
      soundEngine.stopAmbience();
    };
  }, []);

  useEffect(() => {
    const activePlay =
      state.phase !== 'INTRO' && state.phase !== 'VICTORY' && state.phase !== 'FAILURE';
    soundEngine.setPositionalCueLoopActive(activePlay);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === 'INTRO') return;
    if (state.phase === 'VICTORY' || state.phase === 'FAILURE') {
      clearCampaignSnapshot('difficult');
      return;
    }
    saveCampaignSnapshot('difficult', state);
  }, [state]);

  useEffect(() => {
    if (state.wardenState === prevThreatRef.current) return;
    prevThreatRef.current = state.wardenState;
    if (state.phase === 'INTRO' || state.phase === 'VICTORY') return;
    soundEngine.setWardenThreatLevel(state.wardenState);
    if (state.wardenState === 'APPROACHING') {
      soundEngine.playFootsteps(3, false);
      showSub('ARCHIVE GRATE', 'Heavy boots cross the iron grate directly overhead.');
    } else if (state.wardenState === 'OUTSIDE_ROOM') {
      soundEngine.playFootsteps(4, false);
      showSub('OUTSIDE VAULT B', 'Muffled footsteps circle directly above the sub-archive hatch.');
    } else if (state.wardenState === 'INSPECTING_DOOR') {
      soundEngine.playDoorKnockPattern(false);
      showSub('ARCHIVE CEILING', 'Dust falls from the vault ceiling beams as latches clatter.');
    } else if (state.wardenState === 'IMMINENT_ARRIVAL') {
      soundEngine.playHandleJiggle();
      window.setTimeout(() => soundEngine.playDoorKnockPattern(true), 280);
      showSub('WARNING', 'The Warden is unlocking the Sub-Basement Hatch! Open the Vault!');
    }
  }, [state.wardenState, state.phase, showSub]);

  useEffect(() => {
    if (!state.timerRunning) return;
    const id = window.setInterval(() => {
      setState((prev) => {
        if (!prev.timerRunning || prev.phase === 'VICTORY' || prev.phase === 'FAILURE') return prev;
        const nextRem = prev.timeRemaining - 1;
        const nextElapsed = prev.elapsedSeconds + 1;

        if (nextRem <= 0) {
          soundEngine.playWardenArrival();
          showSub('WARDEN', 'Archive hatch breached. Seal Vault B permanently.');
          onFailureReported();
          return {
            ...prev,
            timeRemaining: 0,
            elapsedSeconds: nextElapsed,
            timerRunning: false,
            phase: 'FAILURE',
            wardenState: 'ARRIVED',
            activeObject: null,
          };
        }

        const totalDur = settings.demoTimerSpeed
          ? CAMPAIGNS.difficult.demoDurationSeconds
          : CAMPAIGNS.difficult.standardDurationSeconds;
        const nextThreat = computeSharedWardenThreat({
          timeRemaining: nextRem,
          totalDurationSeconds: totalDur,
          puzzlesCompleted: prev.puzzlesCompleted,
          currentState: prev.wardenState,
        });
        soundEngine.playTick(nextRem < 120);

        return {
          ...prev,
          timeRemaining: nextRem,
          elapsedSeconds: nextElapsed,
          wardenState: nextThreat,
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.timerRunning, settings.demoTimerSpeed, onFailureReported, showSub]);

  const handleStartCampaign = () => {
    soundEngine.unlock();
    soundEngine.setCampaignProfile('difficult');
    soundEngine.startAmbience();
    soundEngine.playInspect();
    if (!attemptRef.current) {
      attemptRef.current = true;
      onAttemptStarted();
    }
    setState((prev) => ({
      ...prev,
      phase: 'ROOM_INVESTIGATION',
      timerRunning: true,
    }));
    showSub('SUB-ARCHIVE', 'Dust hangs in warm amber lamp light. Begin investigating the documents.');
  };

  const handleSelectObject = useCallback((objId: string) => {
    const id = objId as ArchiveObjectId;
    soundEngine.unlock();
    soundEngine.playInspect();
    setBoardOpen(false);
    setActiveDrawer('none');

    setState((prev) => {
      if (prev.phase === 'FAILURE') return prev;
      const meta = DIFFICULT_OBJECTS[id];
      const inspected = prev.inspectedObjects.includes(id)
        ? prev.inspectedObjects
        : [...prev.inspectedObjects, id];
      const nextEv =
        meta.evidenceId && !prev.discoveredEvidence.includes(meta.evidenceId)
          ? [...prev.discoveredEvidence, meta.evidenceId]
          : prev.discoveredEvidence;
      const logs = prev.inspectedObjects.includes(id)
        ? prev.logs
        : [
            {
              id: `${Date.now()}`,
              time: formatTime(prev.timeRemaining),
              title: `Inspected ${meta.name}`,
              detail: meta.clueText,
            },
            ...prev.logs,
          ];
      return {
        ...prev,
        activeObject: id,
        inspectedObjects: inspected,
        discoveredEvidence: nextEv,
        logs,
      };
    });
  }, []);

  const handleSubmitCipherPuzzle = (decodedWord: string) => {
    if (state.phase === 'FAILURE' || !state.timerRunning) {
      return { ok: false, message: 'Time expired.' };
    }
    if (!validateDifficultCipher(decodedWord)) {
      soundEngine.playError();
      return {
        ok: false,
        message: 'Incorrect bearing. Apply the -3 backward Caesar shift to QRUWK.',
      };
    }

    soundEngine.playPuzzleComplete();
    flashBanner('LOCK 1 CLEARED · NORTH Decoded · Witness Folders Unsealed');
    showSub('ARCHIVE SEAL', 'Wax seal cracked. Witness Records on the desk are now open.');

    setState((prev) => ({
      ...prev,
      puzzlesCompleted: { ...prev.puzzlesCompleted, 1: true },
      currentPuzzle: 2,
      inventory: prev.inventory.includes('warden_ledger_seal')
        ? prev.inventory
        : [...prev.inventory, 'warden_ledger_seal'],
      logs: [
        {
          id: `${Date.now()}`,
          time: formatTime(prev.timeRemaining),
          title: 'Lock 1 Completed · Cipher Decoded (NORTH)',
          detail: 'Caesar shift -3 broken. Witness Records unsealed.',
        },
        ...prev.logs,
      ],
    }));

    return { ok: true, message: 'Cipher broken! Witness Records unsealed.' };
  };

  const handleSubmitTimelinePuzzle = () => {
    if (state.phase === 'FAILURE' || !state.timerRunning) {
      return { ok: false, message: 'Time expired.' };
    }
    if (!validateDifficultTimeline(state.timelineOrder, state.puzzlesCompleted[1])) {
      soundEngine.playError();
      return {
        ok: false,
        message:
          'Chronology contradiction detected. Compare witness statements against the Archive Shelves ledger.',
      };
    }

    soundEngine.playVaultBoltShift();
    flashBanner('LOCK 2 CLEARED · Timeline 4-1-7-2 Verified · Vault Crank Acquired');
    showSub('TIMELINE LOCKED', 'Chronology 4-1-7-2 confirmed. Engage the Mechanical Vault.');

    setState((prev) => ({
      ...prev,
      puzzlesCompleted: { ...prev.puzzlesCompleted, 2: true },
      currentPuzzle: 3,
      inventory: prev.inventory.includes('vault_crank_key')
        ? prev.inventory
        : [...prev.inventory, 'vault_crank_key'],
      logs: [
        {
          id: `${Date.now()}`,
          time: formatTime(prev.timeRemaining),
          title: 'Lock 2 Completed · Timeline (4-1-7-2)',
          detail: 'Four 1994 testimonies reconciled. Vault Engagement Key recovered.',
        },
        ...prev.logs,
      ],
    }));

    return { ok: true, message: 'Timeline 4-1-7-2 verified! Approach the Mechanical Vault.' };
  };

  const handleSubmitVaultPuzzle = () => {
    if (state.phase === 'FAILURE' || !state.timerRunning) {
      return { ok: false, message: 'Time expired.' };
    }
    if (
      !validateDifficultVault(
        state.vaultBearing,
        state.vaultDigits,
        state.puzzlesCompleted[1],
        state.puzzlesCompleted[2]
      )
    ) {
      soundEngine.playError();
      return {
        ok: false,
        message:
          'Vault pins remain locked. Align BOTH the Outer Compass Ring (NORTH) and 4 Pin Drums (4-1-7-2).',
      };
    }

    soundEngine.playVaultOpenHeavy();
    window.setTimeout(() => soundEngine.playVictory(), 550);

    const classification = resolveClassificationFromHints(state.hintsUsedTotal);
    const outcome = onVictoryReported({
      campaignId: 'difficult',
      elapsedSeconds: state.elapsedSeconds,
      timeRemaining: state.timeRemaining,
      hintsUsed: state.hintsUsedTotal,
      inspectedCount: state.inspectedObjects.length,
      totalObjects: DIFFICULT_OBJECT_ORDER.length,
      evidenceCount: state.discoveredEvidence.length,
      totalEvidence: DIFFICULT_EVIDENCE_ORDER.length,
      classification,
      timerMode: settings.demoTimerSpeed ? 'demo' : 'standard',
    });

    setRankResult({
      rank: outcome.rank,
      achievements: outcome.newlyUnlockedAchievements,
      isNewBestTime: outcome.isNewBestTime,
    });

    setState((prev) => ({
      ...prev,
      puzzlesCompleted: { ...prev.puzzlesCompleted, 3: true },
      timerRunning: false,
      phase: 'VICTORY',
      activeObject: null,
    }));

    return { ok: true, message: 'Vault B cracked open! Recovering the final archive ledger...' };
  };

  const handleRequestHint = () => {
    setState((prev) => {
      if (prev.phase === 'VICTORY' || prev.phase === 'FAILURE') return prev;
      const stage = !prev.puzzlesCompleted[1] ? 1 : !prev.puzzlesCompleted[2] ? 2 : 3;
      const outcome = consumeCampaignHint(
        {
          hintsRemaining: prev.hintsRemaining,
          hintsUsedTotal: prev.hintsUsedTotal,
          hintsUsedByPuzzle: prev.hintsUsedByPuzzle,
          revealedHints: prev.revealedHints,
          thirdHintRejected: prev.thirdHintRejected,
        },
        stage,
        DIFFICULT_PUZZLE_HINTS
      );
      if (!outcome.allowed) {
        soundEngine.playError();
        return { ...prev, thirdHintRejected: true };
      }
      soundEngine.playHint();
      return {
        ...prev,
        ...outcome.nextState,
        logs: [
          {
            id: `${Date.now()}`,
            time: formatTime(prev.timeRemaining),
            title: `Hint Used (${outcome.nextState.hintsUsedTotal}/2) · Lock ${stage}`,
            detail: outcome.message,
          },
          ...prev.logs,
        ],
      };
    });
    setActiveDrawer('hints');
  };

  const handleRestart = () => {
    clearCampaignSnapshot('difficult');
    onAttemptStarted();
    prevThreatRef.current = 'DORMANT';
    soundEngine.setWardenThreatLevel('DORMANT');
    soundEngine.startAmbience();
    setRankResult(null);
    setBoardOpen(false);
    setActiveDrawer('none');
    setState(createInitialDifficultState(settings.demoTimerSpeed, true));
  };

  const hintsExhausted = state.hintsRemaining <= 0;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#090705]">
      <Generic3DViewport
        sceneKind="archive"
        phase={state.phase}
        objects={DIFFICULT_OBJECTS}
        objectOrder={DIFFICULT_OBJECT_ORDER}
        activeObject={state.activeObject}
        hoveredObject={hoveredObject}
        onHoverObject={setHoveredObject}
        onSelectObject={handleSelectObject}
        puzzle1Completed={state.puzzlesCompleted[1]}
        puzzle2Completed={state.puzzlesCompleted[2]}
        puzzle3Completed={state.puzzlesCompleted[3]}
        wardenState={state.wardenState}
        inspectedObjects={state.inspectedObjects}
        cameraResetTrigger={cameraResetTrigger}
        showHotspots={showHotspots && !state.activeObject && !boardOpen && state.phase !== 'INTRO'}
        graphicsQuality={settings.graphicsQuality}
      />

      {state.phase === 'INTRO' ? (
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-[#080604]/90 via-[#080604]/65 to-[#080604]/95 px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl rounded-2xl border border-emerald-400/25 bg-[#120e0a]/95 p-7 text-slate-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono-tabular text-xs font-bold tracking-[0.22em] text-emerald-400">
                CAMPAIGN 03 · DIFFICULT · 18 MIN
              </span>
              <button
                type="button"
                onClick={onExitToLauncher}
                className="rounded border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-400"
              >
                ← Launcher
              </button>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
              THE WARDEN&apos;S LAST SECRET
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Deep beneath Hostel Block C lies Vault B—a sealed 1994 archive lit only by green
              banker lamps. Crack the Warden&apos;s Caesar directive, expose four contradictory
              witness logs, and unlock the twin-mechanism iron vault.
            </p>
            <p className="mt-3 font-mono-tabular text-xs text-amber-300">
              3 LOCKS: Brass Cipher Wheel → Witness Timeline → Mechanical Vault · Strict 2 Hints
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <span className="text-xs text-slate-400">Drag screen to look 360° · Click pins</span>
              <button
                type="button"
                onClick={handleStartCampaign}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400"
              >
                <span>Enter Sub-Archive</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <header className="pointer-events-auto fixed inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#120e0a]/94 px-4 py-2.5 text-slate-100 sm:px-6">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onExitToLauncher}
                className="rounded border border-white/15 bg-[#1e1812] px-2 py-1 font-mono-tabular text-[11px] font-semibold text-slate-300 hover:border-amber-400"
              >
                ← Menu
              </button>
              <h1 className="font-display text-sm font-bold text-white sm:text-base">
                CAMPAIGN 03: THE WARDEN&apos;S LAST SECRET
              </h1>
            </div>

            <div className="flex items-center gap-1.5 font-mono-tabular text-[11px]">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`rounded px-2 py-0.5 ${
                    state.puzzlesCompleted[n as 1 | 2 | 3]
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : state.currentPuzzle === n
                        ? 'bg-amber-500/25 text-amber-300'
                        : 'text-slate-500'
                  }`}
                >
                  LOCK {n}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 font-mono-tabular text-xs">
              <span className="hidden items-center gap-1 rounded border border-white/15 bg-[#1b1611] px-2.5 py-1 text-[11px] text-slate-300 sm:inline-flex">
                <Footprints className="h-3.5 w-3.5 text-amber-400" />
                {state.wardenState.replace('_', ' ')}
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer(activeDrawer === 'hints' ? 'none' : 'hints')}
                className={`flex items-center gap-1 rounded border px-2.5 py-1 font-semibold ${
                  hintsExhausted
                    ? 'border-red-500/40 bg-red-950/40 text-red-300'
                    : 'border-amber-400/40 bg-[#1b1611] text-amber-300'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>
                  HINTS: {state.hintsRemaining}/{GLOBAL_MAX_HINTS}
                </span>
              </button>
              <div
                className={`flex items-center gap-1 rounded border px-2.5 py-1 font-bold ${
                  state.timeRemaining < 120
                    ? 'border-red-500/60 bg-red-950/50 text-red-300'
                    : 'border-white/15 bg-[#1b1611] text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{formatTime(state.timeRemaining)}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(activeDrawer === 'audio' ? 'none' : 'audio')}
                className="rounded border border-white/15 bg-[#1b1611] p-1.5 text-slate-200"
              >
                {settings.soundMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                )}
              </button>
            </div>
          </header>

          {banner && (
            <div className="pointer-events-none fixed inset-x-0 top-16 z-20 flex justify-center px-4">
              <div className="rounded-lg border border-emerald-400/50 bg-[#0b1b15]/95 px-4 py-2 font-mono-tabular text-xs font-bold text-emerald-300 shadow-lg">
                {banner}
              </div>
            </div>
          )}

          <SubtitleToast cue={subtitleCue} enabled={settings.subtitlesEnabled} />

          {activeDrawer !== 'none' && (
            <div className="pointer-events-auto fixed bottom-20 left-1/2 z-30 w-[min(560px,94vw)] -translate-x-1/2 rounded-xl border border-white/15 bg-[#14100c]/96 p-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-display text-base font-bold text-white">
                  {activeDrawer === 'objects'
                    ? 'Sub-Archive · 10 Objects'
                    : activeDrawer === 'hints'
                      ? `Hints (${state.hintsRemaining}/2 Remaining)`
                      : activeDrawer === 'audio'
                        ? 'Audio Controls'
                        : 'Archive Log'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded border border-white/10 p-1 text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {activeDrawer === 'objects' && (
                <div className="mt-3 grid max-h-60 grid-cols-2 gap-2 overflow-y-auto custom-scroll">
                  {DIFFICULT_OBJECT_ORDER.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectObject(id)}
                      className="rounded-lg border border-white/10 bg-[#1d1711] px-3 py-2 text-left text-xs hover:border-amber-400"
                    >
                      <p className="font-semibold text-white">{DIFFICULT_OBJECTS[id].name}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {DIFFICULT_OBJECTS[id].subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {activeDrawer === 'hints' && (
                <div className="mt-3 space-y-3 text-xs">
                  {state.revealedHints.map((h, i) => (
                    <div key={i} className="rounded-lg border border-amber-400/25 bg-[#1c1610] p-2.5">
                      <p className="font-mono-tabular text-[11px] font-bold text-amber-300">
                        Lock {h.puzzle} · Hint {i + 1}
                      </p>
                      <p className="mt-1 text-slate-200">{h.text}</p>
                    </div>
                  ))}
                  {(hintsExhausted || state.thirdHintRejected) && (
                    <div className="rounded-lg border border-red-500/45 bg-red-950/45 p-3 text-red-200">
                      <p className="font-mono-tabular font-bold text-red-300">
                        {THIRD_HINT_UNAVAILABLE_TEXT}
                      </p>
                      <p className="mt-1">Global 2-hint cap reached for this campaign.</p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={hintsExhausted}
                      onClick={handleRequestHint}
                      className="rounded-lg bg-amber-500 px-3.5 py-2 font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {hintsExhausted
                        ? 'No Hints Remaining (0/2)'
                        : `Use 1 Hint (${state.hintsRemaining}/2)`}
                    </button>
                  </div>
                </div>
              )}

              {activeDrawer === 'log' && (
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto custom-scroll text-xs">
                  {state.logs.map((l) => (
                    <div key={l.id} className="rounded-lg border border-white/10 bg-[#1a150f] p-2.5">
                      <div className="flex justify-between font-mono-tabular text-[11px] text-amber-300">
                        <span>{l.title}</span>
                        <span>{l.time}</span>
                      </div>
                      <p className="mt-1 text-slate-300">{l.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeDrawer === 'audio' && (
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Sound Effects</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !settings.soundMuted;
                        soundEngine.setMuted(next);
                        onUpdateSettings({ soundMuted: next });
                      }}
                      className="inline-flex items-center gap-1 rounded border border-white/15 px-3 py-1.5"
                    >
                      {settings.soundMuted ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                      <span>{settings.soundMuted ? 'Muted' : 'Enabled'}</span>
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(settings.masterVolume * 100)}
                    onChange={(e) => {
                      const v = Number(e.target.value) / 100;
                      soundEngine.setMasterVolume(v);
                      onUpdateSettings({ masterVolume: v });
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* BOTTOM CONTROL DOCK */}
          <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-3">
            <div className="pointer-events-auto flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#120e0a]/95 px-3 py-2 shadow-2xl">
              <div className="flex items-center gap-1.5">
                {(
                  ['caesar_rule_plate', 'warden_ledger_seal', 'vault_crank_key'] as DifficultInventoryId[]
                ).map((id) => {
                  const owned = state.inventory.includes(id);
                  return (
                    <span
                      key={id}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                        owned
                          ? 'border-amber-400/50 bg-amber-950/40 text-amber-200'
                          : 'border-dashed border-white/15 text-slate-600'
                      }`}
                    >
                      {owned ? DIFFICULT_INVENTORY_ITEMS[id].shortLabel : 'Locked Tool'}
                    </span>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBoardOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-[#1f1812] px-2.5 py-1.5 text-xs font-semibold text-amber-200"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>
                    Board ({state.discoveredEvidence.length}/{DIFFICULT_EVIDENCE_ORDER.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(activeDrawer === 'objects' ? 'none' : 'objects')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#1b1611] px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Objects ({state.inspectedObjects.length}/10)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(activeDrawer === 'log' ? 'none' : 'log')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#1b1611] px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <ScrollText className="h-3.5 w-3.5" />
                  <span>Log</span>
                </button>
                <div
                  onClick={() => {
                    if (hintsExhausted) {
                      soundEngine.playError();
                      setState((p) => ({ ...p, thirdHintRejected: true }));
                      setActiveDrawer('hints');
                    }
                  }}
                >
                  <button
                    type="button"
                    disabled={hintsExhausted}
                    onClick={handleRequestHint}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>
                      {hintsExhausted
                        ? 'Hint Unavailable (0/2)'
                        : `Request Hint (${state.hintsRemaining}/2)`}
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setState((p) => ({ ...p, activeObject: null }));
                    setCameraResetTrigger((c) => c + 1);
                  }}
                  className="rounded-lg border border-white/15 bg-[#1b1611] px-2.5 py-1.5 text-xs text-slate-200"
                >
                  Reset Look
                </button>
                <button
                  type="button"
                  onClick={() => setShowHotspots((v) => !v)}
                  className="rounded-lg border border-white/15 bg-[#1b1611] p-1.5 text-slate-200"
                >
                  {showHotspots ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  title="Restart Campaign 03"
                  className="rounded-lg border border-white/15 bg-[#1b1611] p-1.5 text-slate-200 hover:border-red-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {state.activeObject && !boardOpen && (
            <DifficultInspectionModal
              objectId={state.activeObject}
              puzzlesCompleted={state.puzzlesCompleted}
              cipherShift={state.cipherShift}
              onChangeCipherShift={(shift) => setState((prev) => ({ ...prev, cipherShift: shift }))}
              onSubmitCipherPuzzle={handleSubmitCipherPuzzle}
              timelineOrder={state.timelineOrder}
              onChangeTimelineOrder={(order) =>
                setState((prev) => ({ ...prev, timelineOrder: order }))
              }
              onSubmitTimelinePuzzle={handleSubmitTimelinePuzzle}
              vaultBearing={state.vaultBearing}
              onChangeVaultBearing={(b) => setState((prev) => ({ ...prev, vaultBearing: b }))}
              vaultDigits={state.vaultDigits}
              onChangeVaultDigits={(d) => setState((prev) => ({ ...prev, vaultDigits: d }))}
              onSubmitVaultPuzzle={handleSubmitVaultPuzzle}
              onCollectShiftPlate={() => {
                soundEngine.playItemAcquire();
                setState((prev) => ({
                  ...prev,
                  inventory: prev.inventory.includes('caesar_rule_plate')
                    ? prev.inventory
                    : [...prev.inventory, 'caesar_rule_plate'],
                }));
              }}
              inventory={state.inventory}
              onClose={() => setState((prev) => ({ ...prev, activeObject: null }))}
              onJumpToObject={handleSelectObject}
            />
          )}

          {boardOpen && (
            <GenericEvidenceBoardModal
              campaignTitle="The Warden's Last Secret"
              evidenceOrder={DIFFICULT_EVIDENCE_ORDER}
              evidenceMap={DIFFICULT_EVIDENCE_ITEMS}
              pairDescriptions={DIFFICULT_PAIR_DESCRIPTIONS}
              discoveredEvidence={state.discoveredEvidence}
              usedEvidence={state.usedEvidence}
              connections={state.evidenceConnections}
              puzzlesCompleted={state.puzzlesCompleted}
              onClose={() => setBoardOpen(false)}
              onInspectObject={handleSelectObject}
              onAddConnection={(from, to) =>
                setState((prev) => ({
                  ...prev,
                  evidenceConnections: [
                    ...prev.evidenceConnections,
                    { id: `${from}-${to}-${Date.now()}`, from, to },
                  ],
                }))
              }
              onRemoveConnection={(cid) =>
                setState((prev) => ({
                  ...prev,
                  evidenceConnections: prev.evidenceConnections.filter((c) => c.id !== cid),
                }))
              }
              onClearConnections={() => setState((prev) => ({ ...prev, evidenceConnections: [] }))}
            />
          )}

          {(state.phase === 'VICTORY' || state.phase === 'FAILURE') && !state.exploreAfterWin && (
            <GenericResultsOverlay
              phase={state.phase}
              campaignId="difficult"
              campaignTitle="The Warden's Last Secret"
              locationLabel="Sub-Archive Vault B · 1994 Cover-Up Solved"
              corridorBannerTitle="MECHANICAL VAULT UNSEALED · NORTH · 4-1-7-2"
              corridorBannerDetail="Counterweights drop behind the stone wall as the circular iron vault swings open..."
              victoryHeadline="The 1994 Hostel Secret Recovered"
              victoryNoteTitle="THE WARDEN'S CONFESSION LEDGER · VAULT B"
              victoryNoteBody={`"Every lock—from Room 307's student initiation test, to Station 88.4's emergency beacon, to Vault B's witness chronology—was built to protect one promise: no student trapped inside Block C would ever vanish uncounted again."`}
              victoryNextTeaser="ALL THREE CHRONICLES COMPLETE · MASTER ENDING READY"
              failureHeadline="THE HATCH DROPPED SHUT."
              failureSubtext="Footsteps crossed the ceiling grate before Vault B's twin rings aligned."
              failureBannerDetail="Iron locking bars slam across the subterranean stairwell exit."
              elapsedSeconds={state.elapsedSeconds}
              bestTimeSeconds={bestTimeSeconds}
              isNewBestTime={rankResult?.isNewBestTime ?? false}
              hintsUsed={state.hintsUsedTotal}
              inspectedCount={state.inspectedObjects.length}
              totalObjects={DIFFICULT_OBJECT_ORDER.length}
              evidenceCount={state.discoveredEvidence.length}
              totalEvidence={DIFFICULT_EVIDENCE_ORDER.length}
              classification={resolveClassificationFromHints(state.hintsUsedTotal)}
              rank={rankResult?.rank ?? 'A'}
              newlyUnlockedAchievements={rankResult?.achievements ?? []}
              demoSpeed={settings.demoTimerSpeed}
              onViewMasterEnding={onViewMasterEnding}
              onPlayAgain={handleRestart}
              onExploreRoom={() => setState((prev) => ({ ...prev, exploreAfterWin: true }))}
              onExitToLauncher={onExitToLauncher}
            />
          )}

          {state.exploreAfterWin && state.phase === 'VICTORY' && (
            <div className="pointer-events-auto fixed right-5 top-16 z-30 flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-[#0b1510]/95 px-3 py-1.5 text-xs text-emerald-200">
              <span>Post-Escape Scene View</span>
              <button
                type="button"
                onClick={onExitToLauncher}
                className="inline-flex items-center gap-1 rounded bg-emerald-500 px-2.5 py-1 font-bold text-slate-950"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Main Menu</span>
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};
