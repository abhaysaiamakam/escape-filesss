import assert from 'node:assert/strict';
import { computeWardenAudioCueSpec, soundEngine } from '../src/audio/soundEngine.ts';
import {
  PUZZLE_1_SOLUTION,
  PUZZLE_2_BOOK_ORDER,
  PUZZLE_2_CODE,
  PUZZLE_3_SEQUENCE,
} from '../src/data/gameContent.ts';
import {
  MEDIUM_CIRCUIT_TARGET,
  MEDIUM_MORSE_TOKENS,
  MEDIUM_PUZZLE_HINTS,
  MEDIUM_TARGET_FREQUENCY,
  validateMediumCircuitConnections,
  validateMediumFrequency,
  validateMediumMorseDecode,
} from '../src/campaigns/medium/mediumData.ts';
import {
  DIFFICULT_CIPHER_TARGET,
  DIFFICULT_CIPHER_TEXT,
  DIFFICULT_PUZZLE_HINTS,
  DIFFICULT_TIMELINE_TARGET,
  caesarDecodeWord,
  validateDifficultCipher,
  validateDifficultTimeline,
  validateDifficultVault,
} from '../src/campaigns/difficult/difficultData.ts';
import {
  GLOBAL_MAX_HINTS,
  THIRD_HINT_UNAVAILABLE_TEXT,
  consumeCampaignHint,
  createInitialHintState,
} from '../src/game-engine/HintManager.ts';
import {
  calculateEscapeRank,
  computeSharedWardenThreat,
  evaluateNewAchievements,
  isCampaignUnlocked,
  isMasterEndingUnlocked,
} from '../src/game-engine/RankAndAchievementManager.ts';
import {
  clearCampaignSnapshot,
  createDefaultPlatformData,
  hasSavedCampaignRun,
  loadCampaignSnapshot,
  loadPlatformData,
  recordCampaignVictory,
  resetAllPlatformProgress,
  saveCampaignSnapshot,
} from '../src/game-engine/PlatformStorage.ts';

// Minimal in-memory window.localStorage mock for Node acceptance testing
const memStorage = new Map<string, string>();
(globalThis as unknown as { window: { localStorage: Storage } }).window = {
  localStorage: {
    get length() {
      return memStorage.size;
    },
    clear() {
      memStorage.clear();
    },
    getItem(k: string) {
      return memStorage.has(k) ? memStorage.get(k)! : null;
    },
    key(i: number) {
      return Array.from(memStorage.keys())[i] ?? null;
    },
    removeItem(k: string) {
      memStorage.delete(k);
    },
    setItem(k: string, v: string) {
      memStorage.set(k, v);
    },
  },
};

function runSuite() {
  // 1. Campaign 01 (Easy) canonical lock constants
  assert.equal(PUZZLE_1_SOLUTION, '427');
  assert.deepEqual(PUZZLE_2_BOOK_ORDER, ['C', 'A', 'D', 'B']);
  assert.equal(PUZZLE_2_CODE, '1368');
  assert.deepEqual(PUZZLE_3_SEQUENCE, ['UP', 'RIGHT', 'DOWN', 'LEFT']);

  // 2. Campaign 02 (Medium) puzzle chain & gating
  assert.equal(validateMediumCircuitConnections({ 'PWR-A': 'SHIELD-E2' }), false);
  assert.equal(validateMediumCircuitConnections(MEDIUM_CIRCUIT_TARGET), true);
  assert.deepEqual(MEDIUM_MORSE_TOKENS, ['---..', '---..', '.-.-.-', '....-']);
  assert.equal(validateMediumMorseDecode('88.4', false), false, 'Must gate Morse on Lock 1');
  assert.equal(validateMediumMorseDecode('91.2', true), false);
  assert.equal(validateMediumMorseDecode(' 88.4 ', true), true);
  assert.equal(validateMediumFrequency(88.4, true, false), false, 'Must gate Tuner on Lock 2');
  assert.equal(validateMediumFrequency(88.2, true, true), false);
  assert.equal(validateMediumFrequency(MEDIUM_TARGET_FREQUENCY, true, true), true);

  // 3. Campaign 03 (Difficult) puzzle chain & dual-ring vault gating
  assert.equal(caesarDecodeWord(DIFFICULT_CIPHER_TEXT, -3), DIFFICULT_CIPHER_TARGET);
  assert.equal(validateDifficultCipher('south'), false);
  assert.equal(validateDifficultCipher('north'), true);
  assert.equal(validateDifficultTimeline(['4', '1', '7', '2'], false), false, 'Gate on Lock 1');
  assert.equal(validateDifficultTimeline(['1', '4', '7', '2'], true), false);
  assert.equal(validateDifficultTimeline(DIFFICULT_TIMELINE_TARGET, true), true);
  assert.equal(validateDifficultVault('NORTH', [4, 1, 7, 2], true, false), false, 'Gate on Lock 2');
  assert.equal(validateDifficultVault('EAST', [4, 1, 7, 2], true, true), false);
  assert.equal(validateDifficultVault('NORTH', [4, 1, 2, 7], true, true), false);
  assert.equal(validateDifficultVault('NORTH', [4, 1, 7, 2], true, true), true);

  // 4. Global 2-hint restriction across locks inside a campaign
  assert.equal(GLOBAL_MAX_HINTS, 2);
  let hints = createInitialHintState();
  const h1 = consumeCampaignHint(hints, 1, MEDIUM_PUZZLE_HINTS);
  assert.equal(h1.allowed, true);
  assert.equal(h1.nextState.hintsRemaining, 1);
  hints = h1.nextState;

  // Switching to puzzle 2 does NOT reset hints
  const h2 = consumeCampaignHint(hints, 2, MEDIUM_PUZZLE_HINTS);
  assert.equal(h2.allowed, true);
  assert.equal(h2.nextState.hintsRemaining, 0);
  hints = h2.nextState;

  // Third hint attempt on puzzle 3 is strictly rejected
  const h3 = consumeCampaignHint(hints, 3, DIFFICULT_PUZZLE_HINTS);
  assert.equal(h3.allowed, false);
  assert.equal(h3.message, THIRD_HINT_UNAVAILABLE_TEXT);
  assert.equal(h3.nextState.thirdHintRejected, true);
  assert.equal(h3.nextState.hintsUsedTotal, 2);

  // 5. Progression Unlock Rules (Normal vs Judge Demo)
  const noneDone = { easy: false, medium: false, difficult: false };
  assert.equal(isCampaignUnlocked('easy', noneDone, 'normal'), true);
  assert.equal(isCampaignUnlocked('medium', noneDone, 'normal'), false);
  assert.equal(isCampaignUnlocked('difficult', noneDone, 'normal'), false);
  assert.equal(isCampaignUnlocked('medium', noneDone, 'judge_demo'), true);
  assert.equal(isCampaignUnlocked('difficult', noneDone, 'judge_demo'), true);

  const easyDone = { easy: true, medium: false, difficult: false };
  assert.equal(isCampaignUnlocked('medium', easyDone, 'normal'), true);
  assert.equal(isCampaignUnlocked('difficult', easyDone, 'normal'), false);

  // 6. Warden Threat Monotonic Progression (never arrives while time > 0)
  const threat = computeSharedWardenThreat({
    timeRemaining: 10,
    totalDurationSeconds: 480,
    puzzlesCompleted: { 1: true, 2: true, 3: false },
    currentState: 'DORMANT',
  });
  assert.equal(threat, 'IMMINENT_ARRIVAL');

  // 7. Escape Ranks, Achievements, Master Ending, and State Isolation
  assert.equal(
    calculateEscapeRank({
      campaignId: 'easy',
      elapsedSeconds: 180,
      totalDurationSeconds: 480,
      hintsUsed: 0,
      inspectedCount: 9,
      totalObjects: 10,
    }),
    'S'
  );
  assert.equal(
    calculateEscapeRank({
      campaignId: 'medium',
      elapsedSeconds: 600,
      totalDurationSeconds: 720,
      hintsUsed: 2,
      inspectedCount: 6,
      totalObjects: 10,
    }),
    'B'
  );

  let platform = createDefaultPlatformData();
  const win1 = recordCampaignVictory({
    platform,
    campaignId: 'easy',
    elapsedSeconds: 200,
    totalDurationSeconds: 480,
    timeRemaining: 280,
    hintsUsed: 0,
    inspectedCount: 10,
    totalObjects: 10,
  });
  platform = win1.nextPlatform;
  assert.equal(platform.completedCampaigns.easy, true);
  assert.ok(win1.newlyUnlockedAchievements.includes('first_escape'));
  assert.ok(win1.newlyUnlockedAchievements.includes('no_help_needed'));
  assert.ok(win1.newlyUnlockedAchievements.includes('the_observer'));
  assert.equal(isMasterEndingUnlocked(platform.completedCampaigns), false);

  const win2 = recordCampaignVictory({
    platform,
    campaignId: 'medium',
    elapsedSeconds: 420,
    totalDurationSeconds: 720,
    timeRemaining: 25,
    hintsUsed: 1,
    inspectedCount: 8,
    totalObjects: 10,
  });
  platform = win2.nextPlatform;
  assert.ok(win2.newlyUnlockedAchievements.includes('signal_detective'));
  assert.ok(win2.newlyUnlockedAchievements.includes('the_last_second'));

  const win3 = recordCampaignVictory({
    platform,
    campaignId: 'difficult',
    elapsedSeconds: 500,
    totalDurationSeconds: 1080,
    timeRemaining: 580,
    hintsUsed: 2,
    inspectedCount: 7,
    totalObjects: 10,
  });
  platform = win3.nextPlatform;
  assert.ok(win3.newlyUnlockedAchievements.includes('archive_master'));
  assert.ok(win3.newlyUnlockedAchievements.includes('master_escape_artist'));
  assert.equal(isMasterEndingUnlocked(platform.completedCampaigns), true);

  // Verify evaluateNewAchievements doesn't duplicate already-unlocked achievements
  const repeatCheck = evaluateNewAchievements({
    platform,
    campaignId: 'easy',
    hintsUsed: 0,
    inspectedCount: 10,
    totalObjects: 10,
    timeRemaining: 20,
    nextCompleted: platform.completedCampaigns,
  });
  assert.equal(repeatCheck.length, 0);

  // 8. Isolated Per-Campaign Save Snapshots + Reset
  saveCampaignSnapshot('easy', { tag: 'room307', hintsRemaining: 1 });
  saveCampaignSnapshot('medium', { tag: 'radio88', hintsRemaining: 2 });
  assert.equal(loadCampaignSnapshot<{ tag: string }>('easy')?.tag, 'room307');
  assert.equal(loadCampaignSnapshot<{ tag: string }>('medium')?.tag, 'radio88');
  assert.equal(hasSavedCampaignRun('difficult'), false);

  clearCampaignSnapshot('easy');
  assert.equal(hasSavedCampaignRun('easy'), false);
  assert.equal(hasSavedCampaignRun('medium'), true);

  const loaded = loadPlatformData();
  assert.equal(loaded.completedCampaigns.difficult, true);

  const reset = resetAllPlatformProgress();
  assert.equal(reset.completedCampaigns.easy, false);
  assert.equal(hasSavedCampaignRun('medium'), false);

  // 9. Positional Warden Ambient Audio Cues across campaigns & proximity states
  for (const campaign of ['easy', 'medium', 'difficult'] as const) {
    const dormant = computeWardenAudioCueSpec('DORMANT', campaign, 0.5, 0);
    const approaching = computeWardenAudioCueSpec('APPROACHING', campaign, 0.5, 0);
    const outside = computeWardenAudioCueSpec('OUTSIDE_ROOM', campaign, 0.5, 0);
    const inspecting = computeWardenAudioCueSpec('INSPECTING_DOOR', campaign, 0.5, 0);
    const imminent = computeWardenAudioCueSpec('IMMINENT_ARRIVAL', campaign, 0.5, 1);

    assert.ok(dormant.position[2] > approaching.position[2], `${campaign}: DORMANT farther than APPROACHING`);
    assert.ok(approaching.position[2] > outside.position[2], `${campaign}: APPROACHING farther than OUTSIDE_ROOM`);
    assert.ok(outside.position[2] > inspecting.position[2], `${campaign}: OUTSIDE_ROOM farther than INSPECTING`);
    assert.ok(inspecting.position[2] >= imminent.position[2], `${campaign}: INSPECTING >= IMMINENT z`);

    assert.ok(dormant.muffleHz < approaching.muffleHz, `${campaign}: muffle opens as warden nears`);
    assert.ok(approaching.muffleHz < outside.muffleHz);
    assert.ok(outside.muffleHz < inspecting.muffleHz);
    assert.ok(inspecting.muffleHz < imminent.muffleHz);

    assert.equal(dormant.kind, 'footsteps');
    assert.equal(approaching.kind, 'footsteps');
    assert.equal(inspecting.kind, 'knock');
  }

  // Ensure spatial listener & ambient cue emitter run safely without interrupting ambient state
  soundEngine.setCampaignProfile('easy');
  soundEngine.updateListenerPose([0, 1.65, 0.15], [0, 0, -1]);
  soundEngine.setWardenThreatLevel('OUTSIDE_ROOM');
  soundEngine.setPositionalCueLoopActive(true);
  soundEngine.emitAmbientProximityCue('INSPECTING_DOOR');
  soundEngine.setPositionalCueLoopActive(false);

  console.log('ALL ACCEPTANCE TESTS PASSED (Campaigns 1-3, Hints, Ranks, Achievements, Isolation, Positional Audio)');
}

runSuite();
