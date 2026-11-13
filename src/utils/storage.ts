import { PersonalBestRecord, TimerMode, VictoryClassification } from '../types/game';

const PERSONAL_BEST_KEY = 'hrfn_personal_best_v1';

export function loadPersonalBest(): PersonalBestRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PERSONAL_BEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersonalBestRecord>;
    if (
      typeof parsed.bestTimeSeconds === 'number' &&
      Number.isFinite(parsed.bestTimeSeconds) &&
      parsed.bestTimeSeconds > 0 &&
      typeof parsed.classification === 'string'
    ) {
      return {
        bestTimeSeconds: parsed.bestTimeSeconds,
        classification: parsed.classification as VictoryClassification,
        timerMode: parsed.timerMode === 'demo' ? 'demo' : 'standard',
        hintsUsed: typeof parsed.hintsUsed === 'number' ? parsed.hintsUsed : 0,
        achievedAtIso:
          typeof parsed.achievedAtIso === 'string'
            ? parsed.achievedAtIso
            : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function savePersonalBestIfBetter(
  elapsedSeconds: number,
  classification: VictoryClassification,
  timerMode: TimerMode,
  hintsUsed: number
): { record: PersonalBestRecord; isNewBest: boolean } {
  const safeElapsed = Math.max(1, Math.floor(elapsedSeconds));
  const existing = loadPersonalBest();
  const isNewBest = !existing || safeElapsed < existing.bestTimeSeconds;

  const candidate: PersonalBestRecord = {
    bestTimeSeconds: safeElapsed,
    classification,
    timerMode,
    hintsUsed,
    achievedAtIso: new Date().toISOString(),
  };

  if (isNewBest && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(candidate));
    } catch {
      // Ignore storage quota errors cleanly
    }
    return { record: candidate, isNewBest: true };
  }

  return { record: existing ?? candidate, isNewBest: false };
}
