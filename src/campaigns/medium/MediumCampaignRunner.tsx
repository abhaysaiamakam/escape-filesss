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
import { RadioObjectId } from '../../three/radioStationBuilder';
import { GamePhase, WardenThreatState } from '../../types/game';
import {
  AchievementId,
  CampaignCompletionSummary,
  EscapeRank,
  PlayerSettings,
  SubtitleCue,
} from '../../types/platform';
import {
  MEDIUM_EVIDENCE_ITEMS,
  MEDIUM_EVIDENCE_ORDER,
  MEDIUM_INVENTORY_ITEMS,
  MEDIUM_OBJECTS,
  MEDIUM_OBJECT_ORDER,
  MEDIUM_PAIR_DESCRIPTIONS,
  MEDIUM_PUZZLE_HINTS,
  MediumEvidenceId,
  MediumInventoryId,
  validateMediumCircuitConnections,
  validateMediumFrequency,
  validateMediumMorseDecode,
} from './mediumData';
import { MediumInspectionModal } from './MediumPuzzleModals';

interface MediumState {
  phase: GamePhase;
  currentPuzzle: 1 | 2 | 3;
  puzzlesCompleted: { 1: boolean; 2: boolean; 3: boolean };
  circuitConnections: Record<string, string>;
  tunedFrequency: number;
  hintsRemaining: number;
  hintsUsedTotal: number;
  hintsUsedByPuzzle: { 1: number; 2: number; 3: number };
  revealedHints: Array<{ puzzle: 1 | 2 | 3; hintIndex: number; text: string }>;
  thirdHintRejected: boolean;
  timeRemaining: number;
  elapsedSeconds: number;
  timerRunning: boolean;
  wardenState: WardenThreatState;
  inventory: MediumInventoryId[];
  inspectedObjects: RadioObjectId[];
  discoveredEvidence: MediumEvidenceId[];
  usedEvidence: MediumEvidenceId[];
  evidenceConnections: Array<{ id: string; from: string; to: string }>;
  activeObject: RadioObjectId | null;
  logs: Array<{ id: string; time: string; title: string; detail: string }>;
  exploreAfterWin: boolean;
}

function createInitialMediumState(demoSpeed: boolean, skipIntro = false): MediumState {
  const duration = demoSpeed
    ? CAMPAIGNS.medium.demoDurationSeconds
    : CAMPAIGNS.medium.standardDurationSeconds;
  return {
    phase: skipIntro ? 'ROOM_INVESTIGATION' : 'INTRO',
    currentPuzzle: 1,
    puzzlesCompleted: { 1: false, 2: false, 3: false },
    circuitConnections: {},
    tunedFrequency: 96.2,
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
        id: 'med-init',
        time: formatTime(duration),
        title: 'Entered Radio Bunker Sub-Level 1',
        detail:
          'Campaign 02: Restore the dead transmitter circuit, decode the phantom Morse signal, and lock the exit frequency.',
      },
    ],
    exploreAfterWin: false,
  };
}

interface MediumCampaignRunnerProps {
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
  onContinueToDifficult: () => void;
}

export const MediumCampaignRunner: React.FC<MediumCampaignRunnerProps> = ({
  settings,
  resumeSaved,
  bestTimeSeconds,
  onUpdateSettings,
  onAttemptStarted,
  onVictoryReported,
  onFailureReported,
  onExitToLauncher,
  onContinueToDifficult,
}) => {
  const [state, setState] = useState<MediumState>(() => {
    if (resumeSaved) {
      const saved = loadCampaignSnapshot<MediumState>('medium');
      if (saved && saved.phase !== 'VICTORY' && saved.phase !== 'FAILURE') {
        return { ...saved, activeObject: null, timerRunning: saved.phase !== 'INTRO' };
      }
    }
    return createInitialMediumState(settings.demoTimerSpeed, false);
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
    soundEngine.setCampaignProfile('medium');
    soundEngine.setMuted(settings.soundMuted);
    soundEngine.setMasterVolume(settings.masterVolume);
    soundEngine.setAmbientEnabled(settings.ambientEnabled);
    if (state.phase !== 'INTRO') soundEngine.startAmbience();
    return () => {
      soundEngine.setPositionalCueLoopActive(false);
      soundEngine.stopMorsePlayback();
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
      clearCampaignSnapshot('medium');
      return;
    }
    saveCampaignSnapshot('medium', state);
  }, [state]);

  // Warden Basement Patrol audio/visual escalation
  useEffect(() => {
    if (state.wardenState === prevThreatRef.current) return;
    prevThreatRef.current = state.wardenState;
    if (state.phase === 'INTRO' || state.phase === 'VICTORY') return;
    soundEngine.setWardenThreatLevel(state.wardenState);
    if (state.wardenState === 'APPROACHING') {
      soundEngine.playFootsteps(3, false);
      showSub('STAIRWELL', 'Heavy boots descend the concrete stairs toward Sub-Level 1.');
    } else if (state.wardenState === 'OUTSIDE_ROOM') {
      soundEngine.playFootsteps(4, false);
      showSub('OUTSIDE BULKHEAD', 'Muffled footsteps pace along the lower stairwell landing.');
    } else if (state.wardenState === 'INSPECTING_DOOR') {
      soundEngine.playDoorKnockPattern(false);
      showSub('BULKHEAD DOOR', 'A flashlight beam sweeps the wired-glass stairwell porthole.');
    } else if (state.wardenState === 'IMMINENT_ARRIVAL') {
      soundEngine.playHandleJiggle();
      window.setTimeout(() => soundEngine.playDoorKnockPattern(true), 280);
      showSub('WARNING', 'Master keys clink against the steel bulkhead! Lock 88.4 now!');
    }
  }, [state.wardenState, state.phase, showSub]);

  // Countdown loop
  useEffect(() => {
    if (!state.timerRunning) return;
    const id = window.setInterval(() => {
      setState((prev) => {
        if (!prev.timerRunning || prev.phase === 'VICTORY' || prev.phase === 'FAILURE') return prev;
        const nextRem = prev.timeRemaining - 1;
        const nextElapsed = prev.elapsedSeconds + 1;

        if (nextRem <= 0) {
          soundEngine.playWardenArrival();
          showSub('WARDEN', 'Bunker seal compromised. Step away from the transmitter.');
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
          ? CAMPAIGNS.medium.demoDurationSeconds
          : CAMPAIGNS.medium.standardDurationSeconds;
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
    soundEngine.setCampaignProfile('medium');
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
    showSub('RADIO BUNKER', 'Fluorescent lights hum overhead. Inspect the room to restore power.');
  };

  const handleSelectObject = useCallback((objId: string) => {
    const id = objId as RadioObjectId;
    soundEngine.unlock();
    soundEngine.playInspect();
    setBoardOpen(false);
    setActiveDrawer('none');

    setState((prev) => {
      if (prev.phase === 'FAILURE') return prev;
      const meta = MEDIUM_OBJECTS[id];
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

  const handleSubmitCircuitPuzzle = () => {
    if (state.phase === 'FAILURE' || !state.timerRunning) {
      return { ok: false, message: 'Timer expired.' };
    }
    if (!validateMediumCircuitConnections(state.circuitConnections)) {
      soundEngine.playCircuitSpark();
      return {
        ok: false,
        message: 'Short-circuit fault! Cross-check the Wiring Diagram and Audio Recorder warning.',
      };
    }

    soundEngine.playTransmitterPowerUp();
    flashBanner('LOCK 1 CLEARED · Transmitter Energized · Morse Card Acquired');
    showSub('TRANSMITTER', 'Vacuum tubes warm up. Phantom Morse pulses now appear on the CRT.');

    setState((prev) => ({
      ...prev,
      puzzlesCompleted: { ...prev.puzzlesCompleted, 1: true },
      currentPuzzle: 2,
      inventory: prev.inventory.includes('morse_reference_card')
        ? prev.inventory
        : [...prev.inventory, 'morse_reference_card'],
      logs: [
        {
          id: `${Date.now()}`,
          time: formatTime(prev.timeRemaining),
          title: 'Lock 1 Completed · Transmitter Online',
          detail: 'Circuit bridges verified. Oscilloscope Morse playback unlocked.',
        },
        ...prev.logs,
      ],
    }));

    return { ok: true, message: 'Circuit verified! Transmitter powered & ITU Morse Card added.' };
  };

  const handleSubmitMorsePuzzle = (decoded: string) => {
    if (state.phase === 'FAILURE' || !state.timerRunning) {
      return { ok: false, message: 'Timer expired.' };
    }
    if (!validateMediumMorseDecode(decoded, state.puzzlesCompleted[1])) {
      soundEngine.playError();
      return {
        ok: false,
        message: 'Carrier mismatch. Decode all four pulsed digits/decimal using Slow Mode.',
      };
    }

    soundEngine.playPuzzleComplete();
    flashBanner('LOCK 2 CLEARED · Frequency 88.4 Verified · Solenoid Fuse Acquired');
    showSub('CARRIER VERIFIED', 'Signal 88.4 authenticated. Lock it onto the Analog Frequency Dial.');

    setState((prev) => ({
      ...prev,
      puzzlesCompleted: { ...prev.puzzlesCompleted, 2: true },
      currentPuzzle: 3,
      inventory: prev.inventory.includes('carrier_relay_fuse')
        ? prev.inventory
        : [...prev.inventory, 'carrier_relay_fuse'],
      logs: [
        {
          id: `${Date.now()}`,
          time: formatTime(prev.timeRemaining),
          title: 'Lock 2 Completed · Morse Decoded (88.4)',
          detail: 'Carrier frequency decoded. Solenoid Carrier Fuse armed.',
        },
        ...prev.logs,
      ],
    }));

    return { ok: true, message: 'Morse carrier decoded cleanly! Tune the Frequency Dial to exit.' };
  };

  const handleSubmitFrequencyPuzzle = () => {
    if (state.phase === 'FAILURE' || !state.timerRunning) {
      return { ok: false, message: 'Timer expired.' };
    }
    if (
      !validateMediumFrequency(
        state.tunedFrequency,
        state.puzzlesCompleted[1],
        state.puzzlesCompleted[2]
      )
    ) {
      soundEngine.playError();
      return {
        ok: false,
        message: 'Static lock failure. Sweep the analog dial until signal strength reaches 100%.',
      };
    }

    soundEngine.playCarrierLock();
    soundEngine.playFinalDoorUnlock();
    window.setTimeout(() => soundEngine.playVictory(), 450);

    const classification = resolveClassificationFromHints(state.hintsUsedTotal);
    const outcome = onVictoryReported({
      campaignId: 'medium',
      elapsedSeconds: state.elapsedSeconds,
      timeRemaining: state.timeRemaining,
      hintsUsed: state.hintsUsedTotal,
      inspectedCount: state.inspectedObjects.length,
      totalObjects: MEDIUM_OBJECT_ORDER.length,
      evidenceCount: state.discoveredEvidence.length,
      totalEvidence: MEDIUM_EVIDENCE_ORDER.length,
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

    return { ok: true, message: '88.4 MHz Locked! Steel bulkhead unsealed.' };
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
        MEDIUM_PUZZLE_HINTS
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
    soundEngine.stopMorsePlayback();
    clearCampaignSnapshot('medium');
    onAttemptStarted();
    prevThreatRef.current = 'DORMANT';
    soundEngine.setWardenThreatLevel('DORMANT');
    soundEngine.startAmbience();
    setRankResult(null);
    setBoardOpen(false);
    setActiveDrawer('none');
    setState(createInitialMediumState(settings.demoTimerSpeed, true));
  };

  const hintsExhausted = state.hintsRemaining <= 0;
  const dialProgress = (state.tunedFrequency - 87.5) / 20.5;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050912]">
      <Generic3DViewport
        sceneKind="radio"
        phase={state.phase}
        objects={MEDIUM_OBJECTS}
        objectOrder={MEDIUM_OBJECT_ORDER}
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
        frequencyDialProgress={dialProgress}
      />

      {state.phase === 'INTRO' ? (
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-[#040811]/90 via-[#040811]/65 to-[#040811]/95 px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl rounded-2xl border border-sky-400/25 bg-[#09111f]/95 p-7 text-slate-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono-tabular text-xs font-bold tracking-[0.22em] text-sky-400">
                CAMPAIGN 02 · MEDIUM · 12 MIN
              </span>
              <button
                type="button"
                onClick={onExitToLauncher}
                className="rounded border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:border-sky-400"
              >
                ← Launcher
              </button>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
              THE MIDNIGHT TRANSMISSION
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Beneath the Block C stairwell sits a forgotten 1998 student radio station. Emergency
              beacons pulse in crimson, the main transmitter is cold, and footsteps are beginning to
              descend toward Sub-Level 1.
            </p>
            <p className="mt-3 font-mono-tabular text-xs text-sky-300">
              3 LOCKS: Dead Circuit → Phantom Morse Signal → Analog Frequency Dial · Strict 2 Hints
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <span className="text-xs text-slate-400">Drag screen to look 360° · Click pins</span>
              <button
                type="button"
                onClick={handleStartCampaign}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-400"
              >
                <span>Enter Radio Bunker</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* TOP HUD */}
          <header className="pointer-events-auto fixed inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#080e1a]/94 px-4 py-2.5 text-slate-100 sm:px-6">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onExitToLauncher}
                className="rounded border border-white/15 bg-[#111a2b] px-2 py-1 font-mono-tabular text-[11px] font-semibold text-slate-300 hover:border-sky-400"
              >
                ← Menu
              </button>
              <h1 className="font-display text-sm font-bold text-white sm:text-base">
                CAMPAIGN 02: THE MIDNIGHT TRANSMISSION
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
                        ? 'bg-sky-500/25 text-sky-300'
                        : 'text-slate-500'
                  }`}
                >
                  LOCK {n}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 font-mono-tabular text-xs">
              <span className="hidden items-center gap-1 rounded border border-white/15 bg-[#101929] px-2.5 py-1 text-[11px] text-slate-300 sm:inline-flex">
                <Footprints className="h-3.5 w-3.5 text-sky-400" />
                {state.wardenState.replace('_', ' ')}
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer(activeDrawer === 'hints' ? 'none' : 'hints')}
                className={`flex items-center gap-1 rounded border px-2.5 py-1 font-semibold ${
                  hintsExhausted
                    ? 'border-red-500/40 bg-red-950/40 text-red-300'
                    : 'border-amber-400/40 bg-[#111a2b] text-amber-300'
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
                    : 'border-white/15 bg-[#111a2b] text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                <span>{formatTime(state.timeRemaining)}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(activeDrawer === 'audio' ? 'none' : 'audio')}
                className="rounded border border-white/15 bg-[#111a2b] p-1.5 text-slate-200"
              >
                {settings.soundMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
                )}
              </button>
            </div>
          </header>

          {banner && (
            <div className="pointer-events-none fixed inset-x-0 top-16 z-20 flex justify-center px-4">
              <div className="rounded-lg border border-emerald-400/50 bg-[#0a1d17]/95 px-4 py-2 font-mono-tabular text-xs font-bold text-emerald-300 shadow-lg">
                {banner}
              </div>
            </div>
          )}

          <SubtitleToast cue={subtitleCue} enabled={settings.subtitlesEnabled} />

          {/* ACTIVE DRAWERS */}
          {activeDrawer !== 'none' && (
            <div className="pointer-events-auto fixed bottom-20 left-1/2 z-30 w-[min(560px,94vw)] -translate-x-1/2 rounded-xl border border-white/15 bg-[#0a111d]/96 p-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-display text-base font-bold text-white">
                  {activeDrawer === 'objects'
                    ? 'Radio Bunker · 10 Objects'
                    : activeDrawer === 'hints'
                      ? `Hints (${state.hintsRemaining}/2 Remaining)`
                      : activeDrawer === 'audio'
                        ? 'Audio Controls'
                        : 'Station Log'}
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
                  {MEDIUM_OBJECT_ORDER.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectObject(id)}
                      className="rounded-lg border border-white/10 bg-[#111b2d] px-3 py-2 text-left text-xs hover:border-sky-400"
                    >
                      <p className="font-semibold text-white">{MEDIUM_OBJECTS[id].name}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {MEDIUM_OBJECTS[id].subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {activeDrawer === 'hints' && (
                <div className="mt-3 space-y-3 text-xs">
                  {state.revealedHints.map((h, i) => (
                    <div key={i} className="rounded-lg border border-amber-400/25 bg-[#111928] p-2.5">
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
                    <div key={l.id} className="rounded-lg border border-white/10 bg-[#101826] p-2.5">
                      <div className="flex justify-between text-[11px] text-sky-300 font-mono-tabular">
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
                    className="w-full accent-sky-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* BOTTOM CONTROL DOCK */}
          <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-3">
            <div className="pointer-events-auto flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#090f1b]/95 px-3 py-2 shadow-2xl">
              <div className="flex items-center gap-1.5">
                {(['copper_jumper', 'morse_reference_card', 'carrier_relay_fuse'] as MediumInventoryId[]).map(
                  (id) => {
                    const owned = state.inventory.includes(id);
                    return (
                      <span
                        key={id}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                          owned
                            ? 'border-sky-400/50 bg-sky-950/40 text-sky-200'
                            : 'border-dashed border-white/15 text-slate-600'
                        }`}
                      >
                        {owned ? MEDIUM_INVENTORY_ITEMS[id].shortLabel : 'Locked Tool'}
                      </span>
                    );
                  }
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBoardOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-[#121d30] px-2.5 py-1.5 text-xs font-semibold text-sky-200"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>
                    Board ({state.discoveredEvidence.length}/{MEDIUM_EVIDENCE_ORDER.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(activeDrawer === 'objects' ? 'none' : 'objects')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#121a28] px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Objects ({state.inspectedObjects.length}/10)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(activeDrawer === 'log' ? 'none' : 'log')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#121a28] px-2.5 py-1.5 text-xs text-slate-200"
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
                  className="rounded-lg border border-white/15 bg-[#121a28] px-2.5 py-1.5 text-xs text-slate-200"
                >
                  Reset Look
                </button>
                <button
                  type="button"
                  onClick={() => setShowHotspots((v) => !v)}
                  className="rounded-lg border border-white/15 bg-[#121a28] p-1.5 text-slate-200"
                >
                  {showHotspots ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  title="Restart Campaign 02"
                  className="rounded-lg border border-white/15 bg-[#121a28] p-1.5 text-slate-200 hover:border-red-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {state.activeObject && !boardOpen && (
            <MediumInspectionModal
              objectId={state.activeObject}
              puzzlesCompleted={state.puzzlesCompleted}
              circuitConnections={state.circuitConnections}
              onConnectCircuitWire={(src, dst) =>
                setState((prev) => ({
                  ...prev,
                  circuitConnections: { ...prev.circuitConnections, [src]: dst },
                }))
              }
              onResetCircuitWires={() => setState((prev) => ({ ...prev, circuitConnections: {} }))}
              onSubmitCircuitPuzzle={handleSubmitCircuitPuzzle}
              onSubmitMorsePuzzle={handleSubmitMorsePuzzle}
              tunedFrequency={state.tunedFrequency}
              onChangeFrequency={(freq) => setState((prev) => ({ ...prev, tunedFrequency: freq }))}
              onSubmitFrequencyPuzzle={handleSubmitFrequencyPuzzle}
              onCollectCabinetLeads={() => {
                soundEngine.playItemAcquire();
                setState((prev) => ({
                  ...prev,
                  inventory: prev.inventory.includes('copper_jumper')
                    ? prev.inventory
                    : [...prev.inventory, 'copper_jumper'],
                }));
              }}
              inventory={state.inventory}
              onClose={() => setState((prev) => ({ ...prev, activeObject: null }))}
              onJumpToObject={handleSelectObject}
            />
          )}

          {boardOpen && (
            <GenericEvidenceBoardModal
              campaignTitle="The Midnight Transmission"
              evidenceOrder={MEDIUM_EVIDENCE_ORDER}
              evidenceMap={MEDIUM_EVIDENCE_ITEMS}
              pairDescriptions={MEDIUM_PAIR_DESCRIPTIONS}
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
              campaignId="medium"
              campaignTitle="The Midnight Transmission"
              locationLabel="Basement Radio Bunker · 88.4 MHz"
              corridorBannerTitle="BULKHEAD SOLENOID RELEASED · 88.4 MHz LOCKED"
              corridorBannerDetail="Steel stairwell bolts retract as the phantom broadcast plays clearly..."
              victoryHeadline="Phantom Carrier Intercepted Before Lockdown"
              victoryNoteTitle="REEL-TO-REEL FINAL TRANSMISSION · 88.4 MHz"
              victoryNoteBody={`"To whoever powered Sub-Level 1: Station 88.4 was never shut down by accident.\n\nBehind the Boiler Wall sits an older chamber—the Warden's Sub-Basement Archive, sealed since 1994."`}
              victoryNextTeaser="UNLOCKED: CAMPAIGN 03 — THE WARDEN'S LAST SECRET"
              failureHeadline="BUNKER LOCKDOWN ENGAGED."
              failureSubtext="Footsteps halted at the stairwell porthole before the carrier locked."
              failureBannerDetail="The steel door deadbolts jam shut as boots reach the bottom step."
              elapsedSeconds={state.elapsedSeconds}
              bestTimeSeconds={bestTimeSeconds}
              isNewBestTime={rankResult?.isNewBestTime ?? false}
              hintsUsed={state.hintsUsedTotal}
              inspectedCount={state.inspectedObjects.length}
              totalObjects={MEDIUM_OBJECT_ORDER.length}
              evidenceCount={state.discoveredEvidence.length}
              totalEvidence={MEDIUM_EVIDENCE_ORDER.length}
              classification={resolveClassificationFromHints(state.hintsUsedTotal)}
              rank={rankResult?.rank ?? 'A'}
              newlyUnlockedAchievements={rankResult?.achievements ?? []}
              demoSpeed={settings.demoTimerSpeed}
              nextCampaignLabel="Campaign 03: Warden's Last Secret"
              onNextCampaign={onContinueToDifficult}
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
                className="inline-flex items-center gap-1 rounded bg-sky-500 px-2.5 py-1 font-bold text-slate-950"
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
