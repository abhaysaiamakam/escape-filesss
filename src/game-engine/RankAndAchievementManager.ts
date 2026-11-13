import { VictoryClassification, WardenThreatState } from '../types/game';
import {
  AchievementDefinition,
  AchievementId,
  CampaignId,
  EscapeRank,
  PlatformData,
  UnlockMode,
} from '../types/platform';
import { CAMPAIGNS } from './CampaignRegistry';

export const ACHIEVEMENTS: Record<AchievementId, AchievementDefinition> = {
  first_escape: {
    id: 'first_escape',
    title: 'FIRST ESCAPE',
    description: 'Complete Campaign 01: The Lost Room Key.',
    category: 'CAMPAIGN',
  },
  signal_detective: {
    id: 'signal_detective',
    title: 'SIGNAL DETECTIVE',
    description: 'Complete Campaign 02: The Midnight Transmission.',
    category: 'CAMPAIGN',
  },
  archive_master: {
    id: 'archive_master',
    title: 'ARCHIVE MASTER',
    description: "Complete Campaign 03: The Warden's Last Secret.",
    category: 'CAMPAIGN',
  },
  no_help_needed: {
    id: 'no_help_needed',
    title: 'NO HELP NEEDED',
    description: 'Complete any campaign without using a single hint.',
    category: 'MASTERY',
  },
  master_escape_artist: {
    id: 'master_escape_artist',
    title: 'MASTER ESCAPE ARTIST',
    description: 'Solve all three Escape Files campaigns.',
    category: 'MASTERY',
  },
  the_observer: {
    id: 'the_observer',
    title: 'THE OBSERVER',
    description: 'Inspect all 10 scene objects during a victorious escape.',
    category: 'SKILL',
  },
  the_last_second: {
    id: 'the_last_second',
    title: 'THE LAST SECOND',
    description: 'Escape a campaign with 30 seconds or less remaining on the clock.',
    category: 'SKILL',
  },
};

export const ACHIEVEMENT_ORDER: AchievementId[] = [
  'first_escape',
  'signal_detective',
  'archive_master',
  'no_help_needed',
  'master_escape_artist',
  'the_observer',
  'the_last_second',
];

export function resolveClassificationFromHints(hintsUsed: number): VictoryClassification {
  if (hintsUsed <= 0) return 'PERFECT_ESCAPE';
  if (hintsUsed === 1) return 'SMART_ESCAPE';
  return 'NARROW_ESCAPE';
}

export function calculateEscapeRank(params: {
  campaignId: CampaignId;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  hintsUsed: number;
  inspectedCount: number;
  totalObjects: number;
}): EscapeRank {
  const { elapsedSeconds, totalDurationSeconds, hintsUsed, inspectedCount, totalObjects } = params;
  const timeRatio = elapsedSeconds / Math.max(1, totalDurationSeconds);
  const thorough = inspectedCount >= Math.max(7, totalObjects - 2);

  if (hintsUsed === 0 && timeRatio <= 0.72 && thorough) return 'S';
  if (hintsUsed === 0 || (hintsUsed === 1 && timeRatio <= 0.78)) return 'A';
  if (hintsUsed <= 2 && timeRatio <= 0.92) return 'B';
  return 'C';
}

export function compareRanks(a: EscapeRank | null, b: EscapeRank): EscapeRank {
  const order: Record<EscapeRank, number> = { S: 4, A: 3, B: 2, C: 1 };
  if (!a) return b;
  return order[b] > order[a] ? b : a;
}

export function isCampaignUnlocked(
  campaignId: CampaignId,
  completedCampaigns: Record<CampaignId, boolean>,
  unlockMode: UnlockMode
): boolean {
  if (unlockMode === 'judge_demo') return true;
  if (campaignId === 'easy') return true;
  if (campaignId === 'medium') return Boolean(completedCampaigns.easy);
  if (campaignId === 'difficult') return Boolean(completedCampaigns.medium);
  return false;
}

export function isMasterEndingUnlocked(completedCampaigns: Record<CampaignId, boolean>): boolean {
  return (
    Boolean(completedCampaigns.easy) &&
    Boolean(completedCampaigns.medium) &&
    Boolean(completedCampaigns.difficult)
  );
}

export function evaluateNewAchievements(params: {
  platform: PlatformData;
  campaignId: CampaignId;
  hintsUsed: number;
  inspectedCount: number;
  totalObjects: number;
  timeRemaining: number;
  nextCompleted: Record<CampaignId, boolean>;
}): AchievementId[] {
  const {
    platform,
    campaignId,
    hintsUsed,
    inspectedCount,
    totalObjects,
    timeRemaining,
    nextCompleted,
  } = params;

  const unlockedNow: AchievementId[] = [];
  const check = (id: AchievementId, condition: boolean) => {
    if (condition && !platform.achievements[id]) {
      unlockedNow.push(id);
    }
  };

  check('first_escape', campaignId === 'easy');
  check('signal_detective', campaignId === 'medium');
  check('archive_master', campaignId === 'difficult');
  check('no_help_needed', hintsUsed === 0);
  check(
    'master_escape_artist',
    nextCompleted.easy && nextCompleted.medium && nextCompleted.difficult
  );
  check('the_observer', inspectedCount >= totalObjects);
  check('the_last_second', timeRemaining > 0 && timeRemaining <= 30);

  return unlockedNow;
}

const THREAT_ORDER: Record<WardenThreatState, number> = {
  DORMANT: 0,
  APPROACHING: 1,
  OUTSIDE_ROOM: 2,
  INSPECTING_DOOR: 3,
  IMMINENT_ARRIVAL: 4,
  ARRIVED: 5,
};

export function computeSharedWardenThreat(params: {
  timeRemaining: number;
  totalDurationSeconds: number;
  puzzlesCompleted: { 1: boolean; 2: boolean; 3: boolean };
  currentState: WardenThreatState;
}): WardenThreatState {
  const { timeRemaining, totalDurationSeconds, puzzlesCompleted, currentState } = params;
  if (timeRemaining <= 0) return 'ARRIVED';

  const ratio = timeRemaining / Math.max(1, totalDurationSeconds);
  const solvedCount = [puzzlesCompleted[1], puzzlesCompleted[2], puzzlesCompleted[3]].filter(
    Boolean
  ).length;

  let candidate: WardenThreatState = 'DORMANT';
  if (ratio <= 0.14) candidate = 'IMMINENT_ARRIVAL';
  else if (ratio <= 0.28) candidate = 'INSPECTING_DOOR';
  else if (ratio <= 0.48 || solvedCount >= 2) candidate = 'OUTSIDE_ROOM';
  else if (ratio <= 0.72 || solvedCount >= 1) candidate = 'APPROACHING';

  return THREAT_ORDER[candidate] > THREAT_ORDER[currentState] ? candidate : currentState;
}

export function getCampaignDurationSeconds(campaignId: CampaignId, demoSpeed: boolean): number {
  const meta = CAMPAIGNS[campaignId];
  return demoSpeed ? meta.demoDurationSeconds : meta.standardDurationSeconds;
}
