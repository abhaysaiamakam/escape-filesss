import { HintTrackerState } from '../types/platform';

export const GLOBAL_MAX_HINTS = 2;
export const THIRD_HINT_UNAVAILABLE_TEXT = 'THIRD HINT UNAVAILABLE.';

export function createInitialHintState(): HintTrackerState {
  return {
    hintsRemaining: GLOBAL_MAX_HINTS,
    hintsUsedTotal: 0,
    hintsUsedByPuzzle: { 1: 0, 2: 0, 3: 0 },
    revealedHints: [],
    thirdHintRejected: false,
  };
}

export interface HintConsumptionResult {
  allowed: boolean;
  message: string;
  nextState: HintTrackerState;
}

/**
 * Strictly enforces a global 2-hint limit across an entire campaign run (never resets across puzzles).
 */
export function consumeCampaignHint(
  current: HintTrackerState,
  activePuzzle: 1 | 2 | 3,
  puzzleHints: Record<1 | 2 | 3, [string, string]>
): HintConsumptionResult {
  if (current.hintsRemaining <= 0) {
    return {
      allowed: false,
      message: THIRD_HINT_UNAVAILABLE_TEXT,
      nextState: {
        ...current,
        thirdHintRejected: true,
      },
    };
  }

  const stageUsed = current.hintsUsedByPuzzle[activePuzzle];
  const hintIndex = Math.min(stageUsed, 1);
  const hintText = puzzleHints[activePuzzle][hintIndex];
  const nextRemaining = current.hintsRemaining - 1;
  const nextUsedTotal = current.hintsUsedTotal + 1;

  return {
    allowed: true,
    message: hintText,
    nextState: {
      hintsRemaining: nextRemaining,
      hintsUsedTotal: nextUsedTotal,
      hintsUsedByPuzzle: {
        ...current.hintsUsedByPuzzle,
        [activePuzzle]: stageUsed + 1,
      },
      revealedHints: [
        ...current.revealedHints,
        { puzzle: activePuzzle, hintIndex: hintIndex + 1, text: hintText },
      ],
      thirdHintRejected: current.thirdHintRejected,
    },
  };
}
