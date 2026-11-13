import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../audio/soundEngine';
import { EndingOverlay, resolveVictoryClassification } from '../../components/EndingOverlay';
import { GameHud, formatTime } from '../../components/GameHud';
import { HostelPhoneModal } from '../../components/HostelPhoneModal';
import { HostelRoomViewport } from '../../components/HostelRoomViewport';
import { InspectionModal } from '../../components/InspectionModal';
import { IntroCinematic } from '../../components/IntroCinematic';
import { InvestigationBoardModal } from '../../components/InvestigationBoardModal';
import {
  DEMO_DURATION_SECONDS,
  EVIDENCE_ITEMS,
  EVIDENCE_ORDER,
  GLOBAL_MAX_HINTS,
  PHONE_MESSAGES,
  PUZZLE_1_SOLUTION,
  PUZZLE_2_BOOK_ORDER,
  PUZZLE_2_CODE,
  PUZZLE_3_SEQUENCE,
  PUZZLE_HINTS,
  ROOM_OBJECTS,
  STANDARD_DURATION_SECONDS,
  WARDEN_THREAT_META,
} from '../../data/gameContent';
import { consumeCampaignHint } from '../../game-engine/HintManager';
import {
  clearCampaignSnapshot,
  loadCampaignSnapshot,
  saveCampaignSnapshot,
} from '../../game-engine/PlatformStorage';
import { computeSharedWardenThreat } from '../../game-engine/RankAndAchievementManager';
import { SubtitleToast } from '../../shared/components/SubtitleToast';
import {
  BookId,
  DirectionStep,
  EvidenceId,
  GameState,
  InventoryItemId,
  LogEntry,
  PersonalBestRecord,
  PuzzleStage,
  RoomObjectId,
  StoryEventCue,
  TimerMode,
  WardenThreatState,
} from '../../types/game';
import {
  AchievementId,
  CampaignCompletionSummary,
  EscapeRank,
  PlayerSettings,
  SubtitleCue,
} from '../../types/platform';
import { loadPersonalBest, savePersonalBestIfBetter } from '../../utils/storage';

const WARDEN_ORDER: Record<WardenThreatState, number> = {
  DORMANT: 0,
  APPROACHING: 1,
  OUTSIDE_ROOM: 2,
  INSPECTING_DOOR: 3,
  IMMINENT_ARRIVAL: 4,
  ARRIVED: 5,
};

function createInitialEasyState(
  timerMode: TimerMode,
  skipIntro: boolean,
  settings: PlayerSettings
): GameState {
  const duration = timerMode === 'demo' ? DEMO_DURATION_SECONDS : STANDARD_DURATION_SECONDS;

  return {
    phase: skipIntro ? 'ROOM_INVESTIGATION' : 'INTRO',
    currentPuzzle: 1,
    puzzlesCompleted: { 1: false, 2: false, 3: false },
    hintsRemaining: GLOBAL_MAX_HINTS,
    hintsUsedTotal: 0,
    hintsUsedByPuzzle: { 1: 0, 2: 0, 3: 0 },
    revealedHints: [],
    thirdHintRejected: false,
    timerMode,
    timeRemaining: duration,
    elapsedSeconds: 0,
    timerRunning: skipIntro,
    wardenState: 'DORMANT',
    inventory: [],
    selectedItem: null,
    armedItem: null,
    uvTorchActive: false,
    uvSweptDirections: [],
    uvMessageDiscovered: false,
    bookshelfUnlockedWithKey: false,
    persistentBookOrder: ['A', 'B', 'C', 'D'],
    inspectedObjects: [],
    discoveredClues: [],
    discoveredEvidence: [],
    usedEvidence: [],
    evidenceConnections: [],
    revealedSubClues: {
      backpackUnzipped: false,
      wardrobeOpened: false,
      bedPillowLifted: false,
      deskPhoneChecked: false,
    },
    phoneState: {
      unreadMessageIds: PHONE_MESSAGES.map((m) => m.id),
      viewedPhotoIds: [],
      playedVoicemailIds: [],
      missedCallsCleared: false,
    },
    phoneModalOpen: false,
    activeObject: null,
    logs: [
      {
        id: 'init-easy-1',
        timestamp: formatTime(duration),
        category: 'SYSTEM',
        title: 'Locked inside Room 307',
        detail:
          'Campaign 01: The Lost Room Key. Solve all three connected locks before the Warden arrives.',
      },
    ],
    result: 'NONE',
    victoryClassification: null,
    isNewPersonalBest: false,
    exploreAfterWin: false,
    soundMuted: settings.soundMuted,
    masterVolume: settings.masterVolume,
    ambientEnabled: settings.ambientEnabled,
    storyTriggers: {
      phoneBuzzCount: 0,
      doorShadowCount: 0,
      lightFlickerCount: 0,
      handleNudgeCount: 0,
    },
  };
}

function makeLog(
  timeRemaining: number,
  category: LogEntry['category'],
  title: string,
  detail: string
): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: formatTime(timeRemaining),
    category,
    title,
    detail,
  };
}

function uniqueAdd<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr : [...arr, item];
}

interface EasyCampaignRunnerProps {
  settings: PlayerSettings;
  resumeSaved: boolean;
  onUpdateSettings: (patch: Partial<PlayerSettings>) => void;
  onAttemptStarted: () => void;
  onVictoryReported: (summary: Omit<CampaignCompletionSummary, 'newlyUnlockedAchievements' | 'rank' | 'isNewBestTime'>) => {
    rank: EscapeRank;
    newlyUnlockedAchievements: AchievementId[];
    isNewBestTime: boolean;
  };
  onFailureReported: () => void;
  onExitToLauncher: () => void;
  onContinueToMedium: () => void;
}

export const EasyCampaignRunner: React.FC<EasyCampaignRunnerProps> = ({
  settings,
  resumeSaved,
  onUpdateSettings,
  onAttemptStarted,
  onVictoryReported,
  onFailureReported,
  onExitToLauncher,
  onContinueToMedium,
}) => {
  const [state, setState] = useState<GameState>(() => {
    if (resumeSaved) {
      const saved = loadCampaignSnapshot<GameState>('easy');
      if (saved && saved.phase !== 'VICTORY' && saved.phase !== 'FAILURE') {
        return {
          ...saved,
          activeObject: null,
          phoneModalOpen: false,
          selectedItem: null,
          soundMuted: settings.soundMuted,
          masterVolume: settings.masterVolume,
          ambientEnabled: settings.ambientEnabled,
          timerRunning: saved.phase !== 'INTRO',
        };
      }
    }
    return createInitialEasyState(
      settings.demoTimerSpeed ? 'demo' : 'standard',
      false,
      settings
    );
  });

  const [personalBest, setPersonalBest] = useState<PersonalBestRecord | null>(() =>
    loadPersonalBest()
  );
  const [escapeRank, setEscapeRank] = useState<EscapeRank | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementId[]>([]);
  const [hoveredObject, setHoveredObject] = useState<RoomObjectId | null>(null);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const [boardOpen, setBoardOpen] = useState(false);
  const [uvAimNormalized, setUvAimNormalized] = useState<{ x: number; y: number } | null>(null);
  const [acquisitionBanner, setAcquisitionBanner] = useState<string | null>(null);
  const [puzzleBanner, setPuzzleBanner] = useState<string | null>(null);
  const [storyCue, setStoryCue] = useState<StoryEventCue | null>(null);
  const [subtitleCue, setSubtitleCue] = useState<SubtitleCue | null>(null);

  const bannerTimeoutRef = useRef<number | null>(null);
  const puzzleBannerTimeoutRef = useRef<number | null>(null);
  const storyCueTimeoutRef = useRef<number | null>(null);
  const subtitleTimeoutRef = useRef<number | null>(null);
  const lowTimeWarnedRef = useRef(false);
  const prevWardenStateRef = useRef<WardenThreatState>(state.wardenState);
  const attemptRecordedRef = useRef(resumeSaved);

  const showSubtitle = useCallback((speaker: string, text: string) => {
    setSubtitleCue({ id: String(Date.now()), speaker, text });
    if (subtitleTimeoutRef.current) window.clearTimeout(subtitleTimeoutRef.current);
    subtitleTimeoutRef.current = window.setTimeout(() => setSubtitleCue(null), 4200);
  }, []);

  const flashAcquisition = useCallback((text: string) => {
    setAcquisitionBanner(text);
    if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = window.setTimeout(() => setAcquisitionBanner(null), 4200);
  }, []);

  const flashPuzzleBanner = useCallback((text: string) => {
    setPuzzleBanner(text);
    if (puzzleBannerTimeoutRef.current) window.clearTimeout(puzzleBannerTimeoutRef.current);
    puzzleBannerTimeoutRef.current = window.setTimeout(() => setPuzzleBanner(null), 4500);
  }, []);

  const flashStoryCue = useCallback(
    (title: string, detail: string, tone: StoryEventCue['tone'] = 'amber') => {
      setStoryCue({ id: String(Date.now()), title, detail, tone });
      showSubtitle(title, detail);
      if (storyCueTimeoutRef.current) window.clearTimeout(storyCueTimeoutRef.current);
      storyCueTimeoutRef.current = window.setTimeout(() => setStoryCue(null), 4600);
    },
    [showSubtitle]
  );

  // Set campaign audio profile on mount
  useEffect(() => {
    soundEngine.setCampaignProfile('easy');
    soundEngine.setMuted(settings.soundMuted);
    soundEngine.setMasterVolume(settings.masterVolume);
    soundEngine.setAmbientEnabled(settings.ambientEnabled);
    if (state.phase !== 'INTRO') {
      soundEngine.startAmbience();
    }
    return () => {
      soundEngine.setPositionalCueLoopActive(false);
      soundEngine.stopVoicemailAudio();
      soundEngine.stopAmbience();
    };
  }, []);

  useEffect(() => {
    const activePlay =
      state.phase !== 'INTRO' && state.phase !== 'VICTORY' && state.phase !== 'FAILURE';
    soundEngine.setPositionalCueLoopActive(activePlay);
  }, [state.phase]);

  // Persist active Campaign 01 progress for "Continue" support
  useEffect(() => {
    if (state.phase === 'INTRO') return;
    if (state.phase === 'VICTORY' || state.phase === 'FAILURE') {
      clearCampaignSnapshot('easy');
      return;
    }
    saveCampaignSnapshot('easy', state);
  }, [state]);

  // Synchronize environmental SFX & visual cues whenever the Warden Threat escalates
  useEffect(() => {
    const current = state.wardenState;
    const prev = prevWardenStateRef.current;
    if (current === prev) return;
    prevWardenStateRef.current = current;

    if (state.phase === 'INTRO' || state.phase === 'VICTORY') return;

    soundEngine.setWardenThreatLevel(current);

    if (WARDEN_ORDER[current] > WARDEN_ORDER[prev] && current !== 'ARRIVED') {
      const meta = WARDEN_THREAT_META[current];
      if (current === 'APPROACHING') {
        soundEngine.playFootsteps(3, false);
        flashStoryCue(`WARDEN · ${meta.label.toUpperCase()}`, meta.detail, 'amber');
      } else if (current === 'OUTSIDE_ROOM') {
        soundEngine.playFootsteps(4, false);
        setState((s) => ({
          ...s,
          storyTriggers: {
            ...s.storyTriggers,
            doorShadowCount: s.storyTriggers.doorShadowCount + 1,
          },
        }));
        flashStoryCue(`WARDEN · ${meta.label.toUpperCase()}`, meta.detail, 'amber');
      } else if (current === 'INSPECTING_DOOR') {
        soundEngine.playDoorKnockPattern(false);
        setState((s) => ({
          ...s,
          storyTriggers: {
            ...s.storyTriggers,
            lightFlickerCount: s.storyTriggers.lightFlickerCount + 1,
            doorShadowCount: s.storyTriggers.doorShadowCount + 1,
          },
        }));
        flashStoryCue(`WARDEN · ${meta.label.toUpperCase()}`, meta.detail, 'red');
      } else if (current === 'IMMINENT_ARRIVAL') {
        soundEngine.playHandleJiggle();
        window.setTimeout(() => soundEngine.playDoorKnockPattern(true), 280);
        setState((s) => ({
          ...s,
          storyTriggers: {
            ...s.storyTriggers,
            handleNudgeCount: s.storyTriggers.handleNudgeCount + 1,
            lightFlickerCount: s.storyTriggers.lightFlickerCount + 1,
          },
        }));
        flashStoryCue(`WARDEN · ${meta.label.toUpperCase()}`, meta.detail, 'red');
      }
    }
  }, [state.wardenState, state.phase, flashStoryCue]);

  // Countdown timer & deterministic Warden Threat progression
  useEffect(() => {
    if (!state.timerRunning) return;

    const intervalId = window.setInterval(() => {
      setState((prev) => {
        if (!prev.timerRunning || prev.phase === 'VICTORY' || prev.phase === 'FAILURE') {
          return prev;
        }

        const nextRemaining = prev.timeRemaining - 1;
        const nextElapsed = prev.elapsedSeconds + 1;

        if (nextRemaining <= 0) {
          soundEngine.setWardenThreatLevel('ARRIVED');
          soundEngine.setTenseMode(false);
          soundEngine.playWardenArrival();
          showSubtitle('WARDEN SHARMA', 'Inspection sweep complete. Open Room 307.');
          onFailureReported();
          return {
            ...prev,
            timeRemaining: 0,
            elapsedSeconds: nextElapsed,
            timerRunning: false,
            wardenState: 'ARRIVED',
            phase: 'FAILURE',
            result: 'FAILURE',
            phoneModalOpen: false,
            activeObject: null,
            selectedItem: null,
            logs: [
              makeLog(
                0,
                'SYSTEM',
                'Warden Arrived',
                'Time expired. Footsteps stopped right outside Room 307.'
              ),
              ...prev.logs,
            ],
          };
        }

        const totalDuration =
          prev.timerMode === 'demo' ? DEMO_DURATION_SECONDS : STANDARD_DURATION_SECONDS;
        const nextWarden = computeSharedWardenThreat({
          timeRemaining: nextRemaining,
          totalDurationSeconds: totalDuration,
          puzzlesCompleted: prev.puzzlesCompleted,
          currentState: prev.wardenState,
        });

        soundEngine.playTick(nextRemaining < 120);

        let nextLogs = prev.logs;
        if (nextWarden !== prev.wardenState) {
          const wMeta = WARDEN_THREAT_META[nextWarden];
          nextLogs = [
            makeLog(nextRemaining, 'SYSTEM', `Warden: ${wMeta.label}`, wMeta.detail),
            ...nextLogs,
          ];
        }

        if (nextRemaining === 119 && !lowTimeWarnedRef.current) {
          lowTimeWarnedRef.current = true;
          soundEngine.setTenseMode(true);
          soundEngine.playFootsteps(3, true);
          nextLogs = [
            makeLog(
              nextRemaining,
              'SYSTEM',
              'THE WARDEN IS GETTING CLOSER.',
              'Less than two minutes remain before midnight inspection.'
            ),
            ...nextLogs,
          ];
        }

        return {
          ...prev,
          timeRemaining: nextRemaining,
          elapsedSeconds: nextElapsed,
          wardenState: nextWarden,
          logs: nextLogs,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [state.timerRunning, onFailureReported, showSubtitle]);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
      if (puzzleBannerTimeoutRef.current) window.clearTimeout(puzzleBannerTimeoutRef.current);
      if (storyCueTimeoutRef.current) window.clearTimeout(storyCueTimeoutRef.current);
      if (subtitleTimeoutRef.current) window.clearTimeout(subtitleTimeoutRef.current);
    };
  }, []);

  const triggerStartEvent = useCallback(() => {
    window.setTimeout(() => {
      soundEngine.playPhoneVibrate();
      setState((prev) => ({
        ...prev,
        storyTriggers: {
          ...prev.storyTriggers,
          phoneBuzzCount: prev.storyTriggers.phoneBuzzCount + 1,
        },
      }));
      flashStoryCue(
        'STUDY TABLE · PHONE VIBRATES',
        'A notification buzzes on the desk while distant footsteps echo down the wing.',
        'sky'
      );
    }, 900);
  }, [flashStoryCue]);

  const handleEnterRoom = useCallback(() => {
    lowTimeWarnedRef.current = false;
    prevWardenStateRef.current = 'DORMANT';
    if (!attemptRecordedRef.current) {
      attemptRecordedRef.current = true;
      onAttemptStarted();
    }
    soundEngine.unlock();
    soundEngine.setCampaignProfile('easy');
    soundEngine.startAmbience();
    soundEngine.setWardenThreatLevel('DORMANT');
    setState((prev) => ({
      ...prev,
      phase: 'ROOM_INVESTIGATION',
      timerRunning: true,
    }));
    triggerStartEvent();
  }, [triggerStartEvent, onAttemptStarted]);

  const handleChangeIntroTimerMode = useCallback((mode: TimerMode) => {
    const duration = mode === 'demo' ? DEMO_DURATION_SECONDS : STANDARD_DURATION_SECONDS;
    setState((prev) => ({
      ...prev,
      timerMode: mode,
      timeRemaining: duration,
    }));
  }, []);

  const handleToggleMute = useCallback(() => {
    setState((prev) => {
      const nextMuted = !prev.soundMuted;
      soundEngine.setMuted(nextMuted);
      onUpdateSettings({ soundMuted: nextMuted });
      return { ...prev, soundMuted: nextMuted };
    });
  }, [onUpdateSettings]);

  const handleChangeVolume = useCallback(
    (vol: number) => {
      soundEngine.setMasterVolume(vol);
      onUpdateSettings({ masterVolume: vol });
      setState((prev) => ({ ...prev, masterVolume: vol }));
    },
    [onUpdateSettings]
  );

  const handleToggleAmbient = useCallback(() => {
    setState((prev) => {
      const next = !prev.ambientEnabled;
      soundEngine.setAmbientEnabled(next);
      onUpdateSettings({ ambientEnabled: next });
      return { ...prev, ambientEnabled: next };
    });
  }, [onUpdateSettings]);

  const handleSelectObject = useCallback(
    (objectId: RoomObjectId) => {
      soundEngine.unlock();
      soundEngine.playInspect();
      setBoardOpen(false);

      if (objectId === 'exit_door' && state.puzzlesCompleted[2] && !state.puzzlesCompleted[3]) {
        soundEngine.playHandleJiggle();
        soundEngine.playFootsteps(3, true);
        flashStoryCue(
          'CORRIDOR · DOOR HANDLE TWITCHES',
          'Loud footsteps pass near Room 307 as you approach the final deadbolt.',
          'red'
        );
      }

      setState((prev) => {
        if (prev.phase === 'FAILURE') return prev;
        const meta = ROOM_OBJECTS[objectId];
        const alreadyInspected = prev.inspectedObjects.includes(objectId);
        const nextInspected = alreadyInspected
          ? prev.inspectedObjects
          : [...prev.inspectedObjects, objectId];

        const clueId = `${objectId}_clue`;
        const nextClues =
          meta.clueText && !prev.discoveredClues.includes(clueId)
            ? [...prev.discoveredClues, clueId]
            : prev.discoveredClues;

        let nextEvidence = prev.discoveredEvidence;
        if (meta.evidenceId && meta.evidenceId !== 'ev_bed_chalk') {
          nextEvidence = uniqueAdd(nextEvidence, meta.evidenceId);
        }

        let nextPhase = prev.phase;
        if (prev.phase !== 'VICTORY') {
          if (objectId === 'desk_drawer' && !prev.puzzlesCompleted[1]) nextPhase = 'PUZZLE_1';
          else if (objectId === 'bookshelf' && prev.puzzlesCompleted[1] && !prev.puzzlesCompleted[2])
            nextPhase = 'PUZZLE_2';
          else if (objectId === 'exit_door' && prev.puzzlesCompleted[2] && !prev.puzzlesCompleted[3])
            nextPhase = 'PUZZLE_3';
          else nextPhase = 'ROOM_INVESTIGATION';
        }

        const nextTriggers =
          objectId === 'exit_door' && prev.puzzlesCompleted[2] && !prev.puzzlesCompleted[3]
            ? { ...prev.storyTriggers, handleNudgeCount: prev.storyTriggers.handleNudgeCount + 1 }
            : prev.storyTriggers;

        const nextLogs = alreadyInspected
          ? prev.logs
          : [
              makeLog(
                prev.timeRemaining,
                'OBJECT',
                `Inspected ${meta.name}`,
                meta.clueText ?? meta.description
              ),
              ...prev.logs,
            ];

        return {
          ...prev,
          phase: nextPhase,
          activeObject: objectId,
          phoneModalOpen: false,
          inspectedObjects: nextInspected,
          discoveredClues: nextClues,
          discoveredEvidence: nextEvidence,
          storyTriggers: nextTriggers,
          logs: nextLogs,
        };
      });
    },
    [state.puzzlesCompleted, flashStoryCue]
  );

  const handleTriggerSubClue = useCallback(
    (key: 'backpackUnzipped' | 'wardrobeOpened' | 'bedPillowLifted' | 'deskPhoneChecked') => {
      setState((prev) => {
        const nextEvidence =
          key === 'bedPillowLifted'
            ? uniqueAdd(prev.discoveredEvidence, 'ev_bed_chalk')
            : prev.discoveredEvidence;

        const logNote =
          key === 'backpackUnzipped'
            ? 'Unzipped the backpack front pocket and found the lab reminder.'
            : key === 'wardrobeOpened'
              ? 'Opened the steel almirah and inspected the Warden curfew notice.'
              : key === 'bedPillowLifted'
                ? 'Lifted the bed pillow and uncovered chalk warnings on the headboard.'
                : 'Checked the vibrating phone: Floor Rep warns Warden sweep starts early.';

        return {
          ...prev,
          discoveredEvidence: nextEvidence,
          revealedSubClues: { ...prev.revealedSubClues, [key]: true },
          logs: prev.revealedSubClues[key]
            ? prev.logs
            : [makeLog(prev.timeRemaining, 'CLUE', 'Sub-Inspection Clue', logNote), ...prev.logs],
        };
      });
    },
    []
  );

  const handleCloseInspection = useCallback(() => {
    setUvAimNormalized(null);
    setState((prev) => ({
      ...prev,
      activeObject: null,
      phase: prev.phase === 'VICTORY' ? 'VICTORY' : 'ROOM_INVESTIGATION',
    }));
  }, []);

  const handleResetCamera = useCallback(() => {
    setUvAimNormalized(null);
    setState((prev) => ({ ...prev, activeObject: null }));
    setCameraResetTrigger((c) => c + 1);
  }, []);

  // PUZZLE 1: Desk Drawer (Code: 427)
  const handleSubmitPuzzle1 = useCallback(
    (code: string): { ok: boolean; message: string } => {
      if (state.phase === 'FAILURE' || state.timeRemaining <= 0 || !state.timerRunning) {
        return { ok: false, message: 'Time has expired. You cannot unlock the drawer.' };
      }
      if (state.puzzlesCompleted[1]) return { ok: true, message: 'Puzzle 1 is already completed.' };
      if (code.trim() !== PUZZLE_1_SOLUTION) {
        soundEngine.playError();
        return {
          ok: false,
          message:
            'Incorrect combination. Re-check the Bookshelf, Wall Poster stars, and Wall Clock.',
        };
      }

      soundEngine.playDrawerUnlock();
      window.setTimeout(() => soundEngine.playItemAcquire(), 260);
      window.setTimeout(() => soundEngine.playFootsteps(3, false), 650);
      flashPuzzleBanner('PUZZLE 1 COMPLETED · Desk Drawer Unlocked');
      flashAcquisition('Acquired: Brass Key & Mysterious Paper');
      flashStoryCue(
        'CORRIDOR · SHADOW BENEATH DOOR',
        'Slow footsteps pause briefly outside Room 307 as a shadow sweeps under the threshold.',
        'amber'
      );

      setState((prev) => {
        if (prev.puzzlesCompleted[1] || prev.phase === 'FAILURE' || prev.timeRemaining <= 0) {
          return prev;
        }
        const nextInv = [...prev.inventory];
        if (!nextInv.includes('brass_key')) nextInv.push('brass_key');
        if (!nextInv.includes('mysterious_paper')) nextInv.push('mysterious_paper');

        const stage1Evidence = EVIDENCE_ORDER.filter(
          (id) => EVIDENCE_ITEMS[id].stage === 1
        ) as EvidenceId[];
        let nextUsed = [...prev.usedEvidence];
        stage1Evidence.forEach((id) => {
          if (prev.discoveredEvidence.includes(id)) nextUsed = uniqueAdd(nextUsed, id);
        });

        const nextCompleted = { ...prev.puzzlesCompleted, 1: true };
        const totalDuration =
          prev.timerMode === 'demo' ? DEMO_DURATION_SECONDS : STANDARD_DURATION_SECONDS;
        const nextWarden = computeSharedWardenThreat({
          timeRemaining: prev.timeRemaining,
          totalDurationSeconds: totalDuration,
          puzzlesCompleted: nextCompleted,
          currentState: prev.wardenState,
        });

        return {
          ...prev,
          puzzlesCompleted: nextCompleted,
          currentPuzzle: 2,
          wardenState: nextWarden,
          inventory: nextInv,
          discoveredEvidence: uniqueAdd(prev.discoveredEvidence, 'ev_drawer_paper'),
          usedEvidence: nextUsed,
          storyTriggers: {
            ...prev.storyTriggers,
            doorShadowCount: prev.storyTriggers.doorShadowCount + 1,
          },
          logs: [
            makeLog(
              prev.timeRemaining,
              'PUZZLE',
              'Puzzle 1 Completed (Code 427)',
              'Unlocked the Desk Drawer. Obtained Brass Key and Mysterious Paper.'
            ),
            ...prev.logs,
          ],
        };
      });

      return {
        ok: true,
        message: 'Drawer unlocked! Brass Key and Mysterious Paper added to inventory.',
      };
    },
    [
      state.phase,
      state.timeRemaining,
      state.timerRunning,
      state.puzzlesCompleted,
      flashAcquisition,
      flashPuzzleBanner,
      flashStoryCue,
    ]
  );

  const handleUnlockBookshelfWithKey = useCallback((): { ok: boolean; message: string } => {
    if (state.phase === 'FAILURE' || state.timeRemaining <= 0 || !state.timerRunning) {
      return { ok: false, message: 'Time has expired.' };
    }
    if (!state.puzzlesCompleted[1] || !state.inventory.includes('brass_key')) {
      soundEngine.playError();
      return { ok: false, message: 'You need the Brass Key from Puzzle 1 first.' };
    }
    if (state.bookshelfUnlockedWithKey) {
      return { ok: true, message: 'Compartment already unlocked.' };
    }

    soundEngine.playDrawerUnlock();
    setState((prev) => ({
      ...prev,
      bookshelfUnlockedWithKey: true,
      armedItem: prev.armedItem === 'brass_key' ? null : prev.armedItem,
      logs: [
        makeLog(
          prev.timeRemaining,
          'ITEM',
          'Used Brass Key',
          'Turned the Brass Key in the hidden Bookshelf compartment.'
        ),
        ...prev.logs,
      ],
    }));

    return {
      ok: true,
      message: 'Compartment unlocked! Arrange the four books from oldest to newest.',
    };
  }, [
    state.phase,
    state.timeRemaining,
    state.timerRunning,
    state.puzzlesCompleted,
    state.inventory,
    state.bookshelfUnlockedWithKey,
  ]);

  const handleChangeBookOrder = useCallback((order: BookId[]) => {
    setState((prev) => ({ ...prev, persistentBookOrder: order }));
  }, []);

  // PUZZLE 2: Chronological Book Ordering (['C','A','D','B'] => 1368)
  const handleSubmitPuzzle2 = useCallback(
    (order: BookId[]): { ok: boolean; message: string } => {
      if (state.phase === 'FAILURE' || state.timeRemaining <= 0 || !state.timerRunning) {
        return { ok: false, message: 'Time has expired.' };
      }
      if (!state.puzzlesCompleted[1] || !state.bookshelfUnlockedWithKey) {
        soundEngine.playError();
        return {
          ok: false,
          message: 'Complete Puzzle 1 and unlock the compartment with the Brass Key first.',
        };
      }
      if (state.puzzlesCompleted[2]) {
        return { ok: true, message: 'Puzzle 2 is already completed.' };
      }

      const isCorrect =
        order.length === 4 && order.every((id, idx) => id === PUZZLE_2_BOOK_ORDER[idx]);
      if (!isCorrect) {
        soundEngine.playError();
        return {
          ok: false,
          message: 'Wrong order. Sort the four volumes strictly from oldest year to newest year.',
        };
      }

      soundEngine.playPuzzleComplete();
      window.setTimeout(() => soundEngine.playItemAcquire(), 320);
      window.setTimeout(() => soundEngine.playDistantKnock(), 780);
      flashPuzzleBanner(`PUZZLE 2 COMPLETED · Code ${PUZZLE_2_CODE} Verified`);
      flashAcquisition('Acquired: 365nm UV Flashlight');
      flashStoryCue(
        'POWER SURGE · DISTANT KNOCK',
        'The ceiling tube flickers briefly as someone knocks on a door down the hall.',
        'amber'
      );

      setState((prev) => {
        if (prev.puzzlesCompleted[2] || prev.phase === 'FAILURE' || prev.timeRemaining <= 0) {
          return prev;
        }
        const nextInv = [...prev.inventory];
        if (!nextInv.includes('uv_torch')) nextInv.push('uv_torch');

        const stage2Evidence = EVIDENCE_ORDER.filter(
          (id) => EVIDENCE_ITEMS[id].stage === 2
        ) as EvidenceId[];
        let nextUsed = [...prev.usedEvidence];
        stage2Evidence.forEach((id) => {
          if (prev.discoveredEvidence.includes(id)) nextUsed = uniqueAdd(nextUsed, id);
        });

        const nextCompleted = { ...prev.puzzlesCompleted, 2: true };
        const totalDuration =
          prev.timerMode === 'demo' ? DEMO_DURATION_SECONDS : STANDARD_DURATION_SECONDS;
        const nextWarden = computeSharedWardenThreat({
          timeRemaining: prev.timeRemaining,
          totalDurationSeconds: totalDuration,
          puzzlesCompleted: nextCompleted,
          currentState: prev.wardenState,
        });

        return {
          ...prev,
          puzzlesCompleted: nextCompleted,
          currentPuzzle: 3,
          wardenState: nextWarden,
          persistentBookOrder: order,
          inventory: nextInv,
          usedEvidence: nextUsed,
          storyTriggers: {
            ...prev.storyTriggers,
            lightFlickerCount: prev.storyTriggers.lightFlickerCount + 1,
          },
          logs: [
            makeLog(
              prev.timeRemaining,
              'PUZZLE',
              `Puzzle 2 Completed (Code ${PUZZLE_2_CODE})`,
              'Arranged books chronologically (2015 → 2018 → 2020 → 2022). Acquired UV Flashlight.'
            ),
            ...prev.logs,
          ],
        };
      });

      return {
        ok: true,
        message: 'Sequence 1368 verified! You recovered the UV Flashlight.',
      };
    },
    [
      state.phase,
      state.timeRemaining,
      state.timerRunning,
      state.puzzlesCompleted,
      state.bookshelfUnlockedWithKey,
      flashAcquisition,
      flashPuzzleBanner,
      flashStoryCue,
    ]
  );

  const handleToggleUvTorch = useCallback(() => {
    setState((prev) => {
      if (!prev.inventory.includes('uv_torch')) return prev;
      const nextActive = !prev.uvTorchActive;
      soundEngine.playUvToggle(nextActive);
      if (nextActive) {
        flashStoryCue(
          '365nm UV FLASHLIGHT ACTIVE',
          'Sweep the circular ultraviolet beam across the Wall Poster to reveal hidden ink.',
          'purple'
        );
      }
      return { ...prev, uvTorchActive: nextActive };
    });
  }, [flashStoryCue]);

  const handleSweepUvDirection = useCallback((dir: DirectionStep) => {
    soundEngine.playInspect();
    setState((prev) => {
      if (!prev.uvTorchActive) return prev;
      const nextSwept = prev.uvSweptDirections.includes(dir)
        ? prev.uvSweptDirections
        : [...prev.uvSweptDirections, dir];
      const allFoundNow = nextSwept.length === 4 && !prev.uvMessageDiscovered;

      const nextEvidence = allFoundNow
        ? uniqueAdd(prev.discoveredEvidence, 'ev_uv_sequence')
        : prev.discoveredEvidence;

      const nextLogs = allFoundNow
        ? [
            makeLog(
              prev.timeRemaining,
              'CLUE',
              'UV Sequence Discovered on Wall Poster',
              'Under ultraviolet sweep, the Wall Poster reveals: UP → RIGHT → DOWN → LEFT.'
            ),
            ...prev.logs,
          ]
        : prev.logs;

      return {
        ...prev,
        uvSweptDirections: nextSwept,
        uvMessageDiscovered: prev.uvMessageDiscovered || allFoundNow,
        discoveredEvidence: nextEvidence,
        logs: nextLogs,
      };
    });
  }, []);

  // PUZZLE 3: Exit Door Directional Sequence (UP -> RIGHT -> DOWN -> LEFT)
  const handleSubmitPuzzle3 = useCallback(
    (sequence: DirectionStep[]): { ok: boolean; message: string } => {
      if (state.phase === 'FAILURE' || state.timeRemaining <= 0 || !state.timerRunning) {
        return { ok: false, message: 'Too late! The Warden is already outside.' };
      }
      if (!state.puzzlesCompleted[1] || !state.puzzlesCompleted[2]) {
        soundEngine.playError();
        return { ok: false, message: 'Complete Puzzles 1 and 2 before unlocking the Exit Door.' };
      }
      if (state.puzzlesCompleted[3]) {
        return { ok: true, message: 'Exit Door already unlocked.' };
      }
      if (sequence.length !== 4) {
        soundEngine.playError();
        return { ok: false, message: 'Enter all 4 directional steps before submitting.' };
      }

      const matches = sequence.every((dir, idx) => dir === PUZZLE_3_SEQUENCE[idx]);
      if (!matches) {
        soundEngine.playError();
        return {
          ok: false,
          message:
            'Deadbolt jammed. Sweep the UV Flashlight across the Wall Poster to verify all 4 directions.',
        };
      }

      const classification = resolveVictoryClassification(state.hintsUsedTotal);
      const saved = savePersonalBestIfBetter(
        state.elapsedSeconds,
        classification,
        state.timerMode,
        state.hintsUsedTotal
      );
      setPersonalBest(saved.record);

      const platformOutcome = onVictoryReported({
        campaignId: 'easy',
        elapsedSeconds: state.elapsedSeconds,
        timeRemaining: state.timeRemaining,
        hintsUsed: state.hintsUsedTotal,
        inspectedCount: state.inspectedObjects.length,
        totalObjects: 10,
        evidenceCount: state.discoveredEvidence.length,
        totalEvidence: EVIDENCE_ORDER.length,
        classification,
        timerMode: state.timerMode,
      });

      setEscapeRank(platformOutcome.rank);
      setUnlockedAchievements(platformOutcome.newlyUnlockedAchievements);

      soundEngine.setTenseMode(false);
      soundEngine.playFinalDoorUnlock();
      window.setTimeout(() => soundEngine.playVictory(), 500);
      flashPuzzleBanner(`PUZZLE 3 COMPLETED · ${classification.replace('_', ' ')}!`);

      setState((prev) => {
        if (prev.phase === 'FAILURE' || prev.timeRemaining <= 0 || prev.puzzlesCompleted[3]) {
          return prev;
        }
        const stage3Evidence = EVIDENCE_ORDER.filter(
          (id) => EVIDENCE_ITEMS[id].stage === 3
        ) as EvidenceId[];
        let nextUsed = [...prev.usedEvidence];
        stage3Evidence.forEach((id) => {
          if (prev.discoveredEvidence.includes(id)) nextUsed = uniqueAdd(nextUsed, id);
        });

        return {
          ...prev,
          puzzlesCompleted: { ...prev.puzzlesCompleted, 3: true },
          timerRunning: false,
          phase: 'VICTORY',
          result: 'VICTORY',
          victoryClassification: classification,
          isNewPersonalBest: saved.isNewBest || platformOutcome.isNewBestTime,
          phoneModalOpen: false,
          activeObject: null,
          selectedItem: null,
          usedEvidence: nextUsed,
          logs: [
            makeLog(
              prev.timeRemaining,
              'PUZZLE',
              `Puzzle 3 Completed · ${classification.replace('_', ' ')}`,
              'Entered UP → RIGHT → DOWN → LEFT. Room 307 door swung open!'
            ),
            ...prev.logs,
          ],
        };
      });

      return { ok: true, message: 'Deadbolt unlocked! Escaping Room 307...' };
    },
    [
      state.phase,
      state.timeRemaining,
      state.timerRunning,
      state.puzzlesCompleted,
      state.hintsUsedTotal,
      state.elapsedSeconds,
      state.timerMode,
      state.inspectedObjects.length,
      state.discoveredEvidence.length,
      flashPuzzleBanner,
      onVictoryReported,
    ]
  );

  // GLOBAL TWO-HINT RESTRICTION via shared HintManager
  const handleRequestHint = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'VICTORY' || prev.phase === 'FAILURE') return prev;
      const stage: PuzzleStage = !prev.puzzlesCompleted[1]
        ? 1
        : !prev.puzzlesCompleted[2]
          ? 2
          : 3;

      const outcome = consumeCampaignHint(
        {
          hintsRemaining: prev.hintsRemaining,
          hintsUsedTotal: prev.hintsUsedTotal,
          hintsUsedByPuzzle: prev.hintsUsedByPuzzle,
          revealedHints: prev.revealedHints,
          thirdHintRejected: prev.thirdHintRejected,
        },
        stage,
        PUZZLE_HINTS
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
          makeLog(
            prev.timeRemaining,
            'HINT',
            `Hint Used (${outcome.nextState.hintsUsedTotal}/${GLOBAL_MAX_HINTS}) · Puzzle ${stage}`,
            outcome.message
          ),
          ...prev.logs,
        ],
      };
    });
  }, []);

  const handleRejectedHintAttempt = useCallback(() => {
    soundEngine.playError();
    setState((prev) => ({ ...prev, thirdHintRejected: true }));
  }, []);

  const handleInspectInventoryItem = useCallback((id: InventoryItemId | null) => {
    if (id) soundEngine.playInspect();
    setState((prev) => ({ ...prev, selectedItem: id }));
  }, []);

  const handleArmItem = useCallback((id: InventoryItemId | null) => {
    setState((prev) => ({ ...prev, armedItem: id }));
  }, []);

  const handleAddEvidenceConnection = useCallback((from: EvidenceId, to: EvidenceId) => {
    setState((prev) => {
      if (from === to) return prev;
      const duplicate = prev.evidenceConnections.some(
        (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from)
      );
      if (duplicate) return prev;
      return {
        ...prev,
        evidenceConnections: [
          ...prev.evidenceConnections,
          { id: `${from}-${to}-${Date.now()}`, from, to },
        ],
      };
    });
  }, []);

  const handleRemoveEvidenceConnection = useCallback((connectionId: string) => {
    setState((prev) => ({
      ...prev,
      evidenceConnections: prev.evidenceConnections.filter((c) => c.id !== connectionId),
    }));
  }, []);

  const handleClearEvidenceConnections = useCallback(() => {
    setState((prev) => ({ ...prev, evidenceConnections: [] }));
  }, []);

  const handleOpenPhone = useCallback(() => {
    soundEngine.playPhoneChime();
    setBoardOpen(false);
    setState((prev) => ({
      ...prev,
      phoneModalOpen: true,
      revealedSubClues: { ...prev.revealedSubClues, deskPhoneChecked: true },
    }));
  }, []);

  const handleClosePhone = useCallback(() => {
    soundEngine.stopVoicemailAudio();
    setState((prev) => ({ ...prev, phoneModalOpen: false }));
  }, []);

  const handleMarkMessageRead = useCallback((msgId: string) => {
    setState((prev) => ({
      ...prev,
      phoneState: {
        ...prev.phoneState,
        unreadMessageIds: prev.phoneState.unreadMessageIds.filter((id) => id !== msgId),
      },
    }));
  }, []);

  const handleClearMissedCalls = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phoneState: { ...prev.phoneState, missedCallsCleared: true },
    }));
  }, []);

  const handleMarkPhotoViewed = useCallback((photoId: string) => {
    setState((prev) => ({
      ...prev,
      phoneState: {
        ...prev.phoneState,
        viewedPhotoIds: uniqueAdd(prev.phoneState.viewedPhotoIds, photoId),
      },
    }));
  }, []);

  const handleMarkVoicemailPlayed = useCallback((vmId: string) => {
    setState((prev) => ({
      ...prev,
      phoneState: {
        ...prev.phoneState,
        playedVoicemailIds: uniqueAdd(prev.phoneState.playedVoicemailIds, vmId),
      },
    }));
  }, []);

  const handleRestart = useCallback(
    (mode?: TimerMode) => {
      lowTimeWarnedRef.current = false;
      prevWardenStateRef.current = 'DORMANT';
      clearCampaignSnapshot('easy');
      onAttemptStarted();
      setAcquisitionBanner(null);
      setPuzzleBanner(null);
      setStoryCue(null);
      setBoardOpen(false);
      setHoveredObject(null);
      setUvAimNormalized(null);
      setEscapeRank(null);
      setUnlockedAchievements([]);
      setCameraResetTrigger((c) => c + 1);
      soundEngine.stopVoicemailAudio();
      soundEngine.setWardenThreatLevel('DORMANT');
      soundEngine.startAmbience();
      setState((prev) =>
        createInitialEasyState(mode ?? prev.timerMode, true, {
          ...settings,
          soundMuted: prev.soundMuted,
          masterVolume: prev.masterVolume,
          ambientEnabled: prev.ambientEnabled,
        })
      );
      triggerStartEvent();
    },
    [settings, triggerStartEvent, onAttemptStarted]
  );

  const handleExploreRoomAgain = useCallback(() => {
    setState((prev) => ({ ...prev, exploreAfterWin: true }));
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#060810]">
      <HostelRoomViewport
        phase={state.phase}
        activeObject={state.activeObject}
        hoveredObject={hoveredObject}
        onHoverObject={setHoveredObject}
        onSelectObject={handleSelectObject}
        puzzle1Completed={state.puzzlesCompleted[1]}
        puzzle2Completed={state.puzzlesCompleted[2]}
        puzzle3Completed={state.puzzlesCompleted[3]}
        bookshelfUnlockedWithKey={state.bookshelfUnlockedWithKey}
        persistentBookOrder={state.persistentBookOrder}
        backpackUnzipped={state.revealedSubClues.backpackUnzipped}
        wardrobeOpened={state.revealedSubClues.wardrobeOpened}
        bedPillowLifted={state.revealedSubClues.bedPillowLifted}
        phoneUnreadCount={state.phoneState.unreadMessageIds.length}
        wardenState={state.wardenState}
        uvTorchActive={state.uvTorchActive}
        uvAimNormalized={uvAimNormalized}
        inspectedObjects={state.inspectedObjects}
        cameraResetTrigger={cameraResetTrigger}
        showHotspots={
          showHotspots &&
          !state.activeObject &&
          !boardOpen &&
          !state.phoneModalOpen &&
          state.phase !== 'INTRO'
        }
        storyTriggers={state.storyTriggers}
      />

      {state.phase === 'INTRO' ? (
        <IntroCinematic
          timerMode={state.timerMode}
          onChangeTimerMode={handleChangeIntroTimerMode}
          onEnterRoom={handleEnterRoom}
          muted={state.soundMuted}
          onToggleMute={handleToggleMute}
          onExitToLauncher={onExitToLauncher}
        />
      ) : (
        <>
          <GameHud
            state={state}
            hoveredObject={hoveredObject}
            onSelectObject={handleSelectObject}
            onResetCamera={handleResetCamera}
            onRequestHint={handleRequestHint}
            onRejectedHintAttempt={handleRejectedHintAttempt}
            onInspectInventoryItem={handleInspectInventoryItem}
            onArmItem={handleArmItem}
            onToggleUvTorch={handleToggleUvTorch}
            onToggleMute={handleToggleMute}
            onChangeVolume={handleChangeVolume}
            onToggleAmbient={handleToggleAmbient}
            onRestart={handleRestart}
            showHotspots={showHotspots}
            onToggleHotspots={() => setShowHotspots((v) => !v)}
            onOpenInvestigationBoard={() => {
              soundEngine.playInspect();
              setBoardOpen(true);
            }}
            onOpenPhone={handleOpenPhone}
            acquisitionBanner={acquisitionBanner}
            puzzleBanner={puzzleBanner}
            storyCue={storyCue}
            onExitToLauncher={onExitToLauncher}
          />

          <SubtitleToast cue={subtitleCue} enabled={settings.subtitlesEnabled} />

          {state.activeObject && !boardOpen && !state.phoneModalOpen && (
            <InspectionModal
              objectId={state.activeObject}
              state={state}
              onClose={handleCloseInspection}
              onOpenPhone={handleOpenPhone}
              onSubmitPuzzle1={handleSubmitPuzzle1}
              onUnlockBookshelfWithKey={handleUnlockBookshelfWithKey}
              onChangeBookOrder={handleChangeBookOrder}
              onSubmitPuzzle2={handleSubmitPuzzle2}
              onToggleUvTorch={handleToggleUvTorch}
              onSweepUvDirection={handleSweepUvDirection}
              onUvAimChange={setUvAimNormalized}
              onSubmitPuzzle3={handleSubmitPuzzle3}
              onTriggerSubClue={handleTriggerSubClue}
            />
          )}

          {boardOpen && (
            <InvestigationBoardModal
              state={state}
              onClose={() => setBoardOpen(false)}
              onInspectObject={handleSelectObject}
              onAddConnection={handleAddEvidenceConnection}
              onRemoveConnection={handleRemoveEvidenceConnection}
              onClearConnections={handleClearEvidenceConnections}
            />
          )}

          {state.phoneModalOpen && (
            <HostelPhoneModal
              phoneState={state.phoneState}
              onClose={handleClosePhone}
              onMarkMessageRead={handleMarkMessageRead}
              onClearMissedCalls={handleClearMissedCalls}
              onMarkPhotoViewed={handleMarkPhotoViewed}
              onMarkVoicemailPlayed={handleMarkVoicemailPlayed}
            />
          )}

          {(state.phase === 'VICTORY' || state.phase === 'FAILURE') && !state.exploreAfterWin && (
            <EndingOverlay
              state={state}
              personalBest={personalBest}
              escapeRank={escapeRank}
              unlockedAchievements={unlockedAchievements}
              onPlayAgain={() => handleRestart(state.timerMode)}
              onExploreRoomAgain={handleExploreRoomAgain}
              onExitToLauncher={onExitToLauncher}
              onContinueNextCampaign={onContinueToMedium}
            />
          )}

          {state.exploreAfterWin && state.phase === 'VICTORY' && (
            <div className="pointer-events-auto fixed right-5 top-20 z-30 flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-[#0b1510]/95 px-3.5 py-2 text-xs text-emerald-200 shadow-lg">
              <span>Post-Escape Exploration Mode</span>
              <button
                type="button"
                onClick={() => handleRestart(state.timerMode)}
                className="rounded bg-amber-500 px-2.5 py-1 font-bold text-slate-950 hover:bg-amber-400"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onExitToLauncher}
                className="rounded border border-white/20 px-2.5 py-1 font-semibold text-white hover:border-amber-400"
              >
                Main Menu
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};
