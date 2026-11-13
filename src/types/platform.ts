import { TimerMode, VictoryClassification } from './game';

export type CampaignId = 'easy' | 'medium' | 'difficult';

export type CampaignDifficulty = 'EASY' | 'MEDIUM' | 'DIFFICULT';

export type UnlockMode = 'normal' | 'judge_demo';

export type GraphicsQuality = 'high' | 'balanced';

export type EscapeRank = 'S' | 'A' | 'B' | 'C';

export type AvatarId = 'owasp' | 'radio' | 'key' | 'cipher';

export type AchievementId =
  | 'first_escape'
  | 'signal_detective'
  | 'archive_master'
  | 'no_help_needed'
  | 'master_escape_artist'
  | 'the_observer'
  | 'the_last_second';

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  category: 'CAMPAIGN' | 'MASTERY' | 'SKILL';
}

export interface CampaignMetadata {
  id: CampaignId;
  numberLabel: string;
  title: string;
  subtitle: string;
  difficulty: CampaignDifficulty;
  location: string;
  estimatedMinutes: number;
  standardDurationSeconds: number;
  demoDurationSeconds: number;
  lockCount: number;
  objectCount: number;
  evidenceCount: number;
  storyIntro: string;
  environmentPreview: string;
  lockNames: [string, string, string];
  accentColor: 'amber' | 'sky' | 'emerald';
}

export interface PlayerProfile {
  nickname: string;
  avatarId: AvatarId;
  createdAtIso: string;
}

export interface PlayerSettings {
  soundMuted: boolean;
  masterVolume: number;
  ambientEnabled: boolean;
  subtitlesEnabled: boolean;
  highContrast: boolean;
  graphicsQuality: GraphicsQuality;
  unlockMode: UnlockMode;
  demoTimerSpeed: boolean;
}

export interface CampaignStatsRecord {
  attempts: number;
  completions: number;
  failures: number;
  bestTimeSeconds: number | null;
  bestRank: EscapeRank | null;
  bestClassification: VictoryClassification | null;
  hintsUsedBest: number | null;
  lastPlayedIso: string | null;
}

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedAtIso: string;
}

export interface PlatformData {
  profile: PlayerProfile;
  settings: PlayerSettings;
  completedCampaigns: Record<CampaignId, boolean>;
  stats: Record<CampaignId, CampaignStatsRecord>;
  achievements: Partial<Record<AchievementId, UnlockedAchievement>>;
  masterEndingViewed: boolean;
}

export interface HintTrackerState {
  hintsRemaining: number;
  hintsUsedTotal: number;
  hintsUsedByPuzzle: { 1: number; 2: number; 3: number };
  revealedHints: Array<{ puzzle: 1 | 2 | 3; hintIndex: number; text: string }>;
  thirdHintRejected: boolean;
}

export interface SubtitleCue {
  id: string;
  speaker: string;
  text: string;
}

export interface CampaignCompletionSummary {
  campaignId: CampaignId;
  elapsedSeconds: number;
  timeRemaining: number;
  hintsUsed: number;
  inspectedCount: number;
  totalObjects: number;
  evidenceCount: number;
  totalEvidence: number;
  classification: VictoryClassification;
  rank: EscapeRank;
  newlyUnlockedAchievements: AchievementId[];
  isNewBestTime: boolean;
  timerMode: TimerMode;
}
