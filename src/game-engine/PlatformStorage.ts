import {
  AvatarId,
  CampaignId,
  CampaignStatsRecord,
  EscapeRank,
  PlatformData,
  PlayerProfile,
  PlayerSettings,
} from '../types/platform';
import { TimerMode, VictoryClassification } from '../types/game';
import {
  calculateEscapeRank,
  compareRanks,
  evaluateNewAchievements,
  resolveClassificationFromHints,
} from './RankAndAchievementManager';

const PLATFORM_STORAGE_KEY = 'escape_files_platform_v1';
const CAMPAIGN_SAVE_PREFIX = 'escape_files_campaign_save_v1_';

function createEmptyStats(): CampaignStatsRecord {
  return {
    attempts: 0,
    completions: 0,
    failures: 0,
    bestTimeSeconds: null,
    bestRank: null,
    bestClassification: null,
    hintsUsedBest: null,
    lastPlayedIso: null,
  };
}

export function createDefaultPlatformData(): PlatformData {
  return {
    profile: {
      nickname: 'Investigator 307',
      avatarId: 'owasp',
      createdAtIso: new Date().toISOString(),
    },
    settings: {
      soundMuted: false,
      masterVolume: 0.7,
      ambientEnabled: true,
      subtitlesEnabled: true,
      highContrast: false,
      graphicsQuality: 'high',
      unlockMode: 'normal',
      demoTimerSpeed: false,
    },
    completedCampaigns: {
      easy: false,
      medium: false,
      difficult: false,
    },
    stats: {
      easy: createEmptyStats(),
      medium: createEmptyStats(),
      difficult: createEmptyStats(),
    },
    achievements: {},
    masterEndingViewed: false,
  };
}

export function loadPlatformData(): PlatformData {
  const defaults = createDefaultPlatformData();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PlatformData>;

    const profile: PlayerProfile = {
      nickname:
        typeof parsed.profile?.nickname === 'string' && parsed.profile.nickname.trim().length > 0
          ? parsed.profile.nickname.slice(0, 28)
          : defaults.profile.nickname,
      avatarId: (['owasp', 'radio', 'key', 'cipher'].includes(parsed.profile?.avatarId ?? '')
        ? parsed.profile?.avatarId
        : 'owasp') as AvatarId,
      createdAtIso: parsed.profile?.createdAtIso ?? defaults.profile.createdAtIso,
    };

    const settings: PlayerSettings = {
      soundMuted: Boolean(parsed.settings?.soundMuted),
      masterVolume:
        typeof parsed.settings?.masterVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.settings.masterVolume))
          : 0.7,
      ambientEnabled: parsed.settings?.ambientEnabled ?? true,
      subtitlesEnabled: parsed.settings?.subtitlesEnabled ?? true,
      highContrast: Boolean(parsed.settings?.highContrast),
      graphicsQuality: parsed.settings?.graphicsQuality === 'balanced' ? 'balanced' : 'high',
      unlockMode: parsed.settings?.unlockMode === 'judge_demo' ? 'judge_demo' : 'normal',
      demoTimerSpeed: Boolean(parsed.settings?.demoTimerSpeed),
    };

    const completedCampaigns: Record<CampaignId, boolean> = {
      easy: Boolean(parsed.completedCampaigns?.easy),
      medium: Boolean(parsed.completedCampaigns?.medium),
      difficult: Boolean(parsed.completedCampaigns?.difficult),
    };

    const stats: Record<CampaignId, CampaignStatsRecord> = {
      easy: { ...createEmptyStats(), ...(parsed.stats?.easy ?? {}) },
      medium: { ...createEmptyStats(), ...(parsed.stats?.medium ?? {}) },
      difficult: { ...createEmptyStats(), ...(parsed.stats?.difficult ?? {}) },
    };

    return {
      profile,
      settings,
      completedCampaigns,
      stats,
      achievements: parsed.achievements ?? {},
      masterEndingViewed: Boolean(parsed.masterEndingViewed),
    };
  } catch {
    return defaults;
  }
}

export function savePlatformData(data: PlatformData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function recordCampaignAttempt(platform: PlatformData, campaignId: CampaignId): PlatformData {
  const prevStat = platform.stats[campaignId];
  const next: PlatformData = {
    ...platform,
    stats: {
      ...platform.stats,
      [campaignId]: {
        ...prevStat,
        attempts: prevStat.attempts + 1,
        lastPlayedIso: new Date().toISOString(),
      },
    },
  };
  savePlatformData(next);
  return next;
}

export function recordCampaignFailure(platform: PlatformData, campaignId: CampaignId): PlatformData {
  const prevStat = platform.stats[campaignId];
  const next: PlatformData = {
    ...platform,
    stats: {
      ...platform.stats,
      [campaignId]: {
        ...prevStat,
        failures: prevStat.failures + 1,
        lastPlayedIso: new Date().toISOString(),
      },
    },
  };
  savePlatformData(next);
  return next;
}

export function recordCampaignVictory(params: {
  platform: PlatformData;
  campaignId: CampaignId;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  timeRemaining: number;
  hintsUsed: number;
  inspectedCount: number;
  totalObjects: number;
  timerMode?: TimerMode;
}): {
  nextPlatform: PlatformData;
  rank: EscapeRank;
  classification: VictoryClassification;
  isNewBestTime: boolean;
  newlyUnlockedAchievements: ReturnType<typeof evaluateNewAchievements>;
} {
  const {
    platform,
    campaignId,
    elapsedSeconds,
    totalDurationSeconds,
    timeRemaining,
    hintsUsed,
    inspectedCount,
    totalObjects,
  } = params;

  const safeElapsed = Math.max(1, Math.floor(elapsedSeconds));
  const classification = resolveClassificationFromHints(hintsUsed);
  const rank = calculateEscapeRank({
    campaignId,
    elapsedSeconds: safeElapsed,
    totalDurationSeconds,
    hintsUsed,
    inspectedCount,
    totalObjects,
  });

  const nextCompleted = {
    ...platform.completedCampaigns,
    [campaignId]: true,
  };

  const newlyUnlockedAchievements = evaluateNewAchievements({
    platform,
    campaignId,
    hintsUsed,
    inspectedCount,
    totalObjects,
    timeRemaining,
    nextCompleted,
  });

  const prevStat = platform.stats[campaignId];
  const isNewBestTime =
    prevStat.bestTimeSeconds === null || safeElapsed < prevStat.bestTimeSeconds;

  const nowIso = new Date().toISOString();
  const nextAchievements = { ...platform.achievements };
  newlyUnlockedAchievements.forEach((achId) => {
    nextAchievements[achId] = { id: achId, unlockedAtIso: nowIso };
  });

  const nextStats: CampaignStatsRecord = {
    ...prevStat,
    completions: prevStat.completions + 1,
    bestTimeSeconds: isNewBestTime ? safeElapsed : prevStat.bestTimeSeconds,
    bestRank: compareRanks(prevStat.bestRank, rank),
    bestClassification:
      classification === 'PERFECT_ESCAPE' || !prevStat.bestClassification
        ? classification
        : prevStat.bestClassification,
    hintsUsedBest:
      prevStat.hintsUsedBest === null ? hintsUsed : Math.min(prevStat.hintsUsedBest, hintsUsed),
    lastPlayedIso: nowIso,
  };

  const nextPlatform: PlatformData = {
    ...platform,
    completedCampaigns: nextCompleted,
    stats: {
      ...platform.stats,
      [campaignId]: nextStats,
    },
    achievements: nextAchievements,
  };

  savePlatformData(nextPlatform);
  return {
    nextPlatform,
    rank,
    classification,
    isNewBestTime,
    newlyUnlockedAchievements,
  };
}

export function getCampaignSaveKey(campaignId: CampaignId): string {
  return `${CAMPAIGN_SAVE_PREFIX}${campaignId}`;
}

export function saveCampaignSnapshot<T>(campaignId: CampaignId, snapshot: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getCampaignSaveKey(campaignId), JSON.stringify(snapshot));
  } catch {
    // Ignore storage errors
  }
}

export function loadCampaignSnapshot<T>(campaignId: CampaignId): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getCampaignSaveKey(campaignId));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function hasSavedCampaignRun(campaignId: CampaignId): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(getCampaignSaveKey(campaignId)));
}

export function clearCampaignSnapshot(campaignId: CampaignId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getCampaignSaveKey(campaignId));
  } catch {
    // Ignore
  }
}

export function resetAllPlatformProgress(): PlatformData {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(PLATFORM_STORAGE_KEY);
    clearCampaignSnapshot('easy');
    clearCampaignSnapshot('medium');
    clearCampaignSnapshot('difficult');
  }
  const fresh = createDefaultPlatformData();
  savePlatformData(fresh);
  return fresh;
}
