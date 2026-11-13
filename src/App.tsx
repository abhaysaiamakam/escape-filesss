import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { DifficultCampaignRunner } from './campaigns/difficult/DifficultCampaignRunner';
import { EasyCampaignRunner } from './campaigns/easy/EasyCampaignRunner';
import { MediumCampaignRunner } from './campaigns/medium/MediumCampaignRunner';
import { CAMPAIGNS } from './game-engine/CampaignRegistry';
import {
  clearCampaignSnapshot,
  loadPlatformData,
  recordCampaignAttempt,
  recordCampaignFailure,
  recordCampaignVictory,
  resetAllPlatformProgress,
  savePlatformData,
} from './game-engine/PlatformStorage';
import { isCampaignUnlocked } from './game-engine/RankAndAchievementManager';
import { LauncherView } from './launcher/LauncherView';
import {
  AvatarId,
  CampaignCompletionSummary,
  CampaignId,
  PlatformData,
  PlayerSettings,
} from './types/platform';

type ActiveScreen =
  | { screen: 'launcher'; openMasterEnding?: boolean }
  | { screen: 'campaign'; campaignId: CampaignId; resumeSaved: boolean; runKey: number };

export default function App() {
  const [platform, setPlatform] = useState<PlatformData>(() => loadPlatformData());
  const platformRef = useRef<PlatformData>(platform);
  const [activeView, setActiveView] = useState<ActiveScreen>({ screen: 'launcher' });

  useEffect(() => {
    platformRef.current = platform;
  }, [platform]);

  // Sync audio & high-contrast root class whenever settings change
  useEffect(() => {
    soundEngine.setMuted(platform.settings.soundMuted);
    soundEngine.setMasterVolume(platform.settings.masterVolume);
    soundEngine.setAmbientEnabled(platform.settings.ambientEnabled);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('hc-mode', platform.settings.highContrast);
    }
  }, [platform.settings]);

  const handleUpdateSettings = useCallback((patch: Partial<PlayerSettings>) => {
    setPlatform((prev) => {
      const next: PlatformData = {
        ...prev,
        settings: {
          ...prev.settings,
          ...patch,
        },
      };
      platformRef.current = next;
      savePlatformData(next);
      return next;
    });
  }, []);

  const handleUpdateProfile = useCallback((nickname: string, avatarId: AvatarId) => {
    setPlatform((prev) => {
      const cleaned = nickname.trim().slice(0, 28) || 'Investigator 307';
      const next: PlatformData = {
        ...prev,
        profile: {
          ...prev.profile,
          nickname: cleaned,
          avatarId,
        },
      };
      platformRef.current = next;
      savePlatformData(next);
      return next;
    });
  }, []);

  const handleResetAllProgress = useCallback(() => {
    const fresh = resetAllPlatformProgress();
    platformRef.current = fresh;
    setPlatform(fresh);
    setActiveView({ screen: 'launcher', openMasterEnding: false });
  }, []);

  const handleLaunchCampaign = useCallback(
    (campaignId: CampaignId, resumeSaved: boolean) => {
      const current = platformRef.current;
      const unlocked = isCampaignUnlocked(
        campaignId,
        current.completedCampaigns,
        current.settings.unlockMode
      );
      if (!unlocked) return;

      if (!resumeSaved) {
        clearCampaignSnapshot(campaignId);
      }

      setActiveView({
        screen: 'campaign',
        campaignId,
        resumeSaved,
        runKey: Date.now(),
      });
    },
    []
  );

  const handleAttemptStarted = useCallback((campaignId: CampaignId) => {
    setPlatform((prev) => {
      const next = recordCampaignAttempt(prev, campaignId);
      platformRef.current = next;
      return next;
    });
  }, []);

  const handleFailureReported = useCallback((campaignId: CampaignId) => {
    setPlatform((prev) => {
      const next = recordCampaignFailure(prev, campaignId);
      platformRef.current = next;
      return next;
    });
  }, []);

  const handleVictoryReported = useCallback(
    (
      summary: Omit<
        CampaignCompletionSummary,
        'newlyUnlockedAchievements' | 'rank' | 'isNewBestTime'
      >
    ) => {
      const meta = CAMPAIGNS[summary.campaignId];
      const totalDurationSeconds =
        summary.timerMode === 'demo' ? meta.demoDurationSeconds : meta.standardDurationSeconds;
      const outcome = recordCampaignVictory({
        platform: platformRef.current,
        campaignId: summary.campaignId,
        elapsedSeconds: summary.elapsedSeconds,
        totalDurationSeconds,
        timeRemaining: summary.timeRemaining,
        hintsUsed: summary.hintsUsed,
        inspectedCount: summary.inspectedCount,
        totalObjects: summary.totalObjects,
        timerMode: summary.timerMode,
      });
      platformRef.current = outcome.nextPlatform;
      setPlatform(outcome.nextPlatform);

      return {
        rank: outcome.rank,
        newlyUnlockedAchievements: outcome.newlyUnlockedAchievements,
        isNewBestTime: outcome.isNewBestTime,
      };
    },
    []
  );

  const handleExitToLauncher = useCallback(() => {
    soundEngine.stopVoicemailAudio();
    soundEngine.stopMorsePlayback();
    soundEngine.stopAmbience();
    setActiveView({ screen: 'launcher', openMasterEnding: false });
  }, []);

  const handleViewMasterEnding = useCallback(() => {
    soundEngine.stopVoicemailAudio();
    soundEngine.stopMorsePlayback();
    soundEngine.stopAmbience();
    setPlatform((prev) => {
      const next: PlatformData = { ...prev, masterEndingViewed: true };
      savePlatformData(next);
      return next;
    });
    setActiveView({ screen: 'launcher', openMasterEnding: true });
  }, []);

  if (activeView.screen === 'campaign') {
    if (activeView.campaignId === 'easy') {
      return (
        <EasyCampaignRunner
          key={`easy-${activeView.runKey}`}
          settings={platform.settings}
          resumeSaved={activeView.resumeSaved}
          onUpdateSettings={handleUpdateSettings}
          onAttemptStarted={() => handleAttemptStarted('easy')}
          onVictoryReported={handleVictoryReported}
          onFailureReported={() => handleFailureReported('easy')}
          onExitToLauncher={handleExitToLauncher}
          onContinueToMedium={() => handleLaunchCampaign('medium', false)}
        />
      );
    }

    if (activeView.campaignId === 'medium') {
      return (
        <MediumCampaignRunner
          key={`medium-${activeView.runKey}`}
          settings={platform.settings}
          resumeSaved={activeView.resumeSaved}
          bestTimeSeconds={platform.stats.medium.bestTimeSeconds}
          onUpdateSettings={handleUpdateSettings}
          onAttemptStarted={() => handleAttemptStarted('medium')}
          onVictoryReported={handleVictoryReported}
          onFailureReported={() => handleFailureReported('medium')}
          onExitToLauncher={handleExitToLauncher}
          onContinueToDifficult={() => handleLaunchCampaign('difficult', false)}
        />
      );
    }

    return (
      <DifficultCampaignRunner
        key={`difficult-${activeView.runKey}`}
        settings={platform.settings}
        resumeSaved={activeView.resumeSaved}
        bestTimeSeconds={platform.stats.difficult.bestTimeSeconds}
        onUpdateSettings={handleUpdateSettings}
        onAttemptStarted={() => handleAttemptStarted('difficult')}
        onVictoryReported={handleVictoryReported}
        onFailureReported={() => handleFailureReported('difficult')}
        onExitToLauncher={handleExitToLauncher}
        onViewMasterEnding={handleViewMasterEnding}
      />
    );
  }

  return (
    <LauncherView
      key={activeView.openMasterEnding ? 'launcher-master' : 'launcher'}
      platform={platform}
      onLaunchCampaign={handleLaunchCampaign}
      onUpdateProfile={handleUpdateProfile}
      onUpdateSettings={handleUpdateSettings}
      onResetAllProgress={handleResetAllProgress}
      initialOpenMasterEnding={Boolean(activeView.openMasterEnding)}
    />
  );
}
