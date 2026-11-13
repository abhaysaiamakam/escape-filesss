export type GamePhase =
  | 'INTRO'
  | 'ROOM_INVESTIGATION'
  | 'PUZZLE_1'
  | 'PUZZLE_2'
  | 'PUZZLE_3'
  | 'VICTORY'
  | 'FAILURE';

export type PuzzleStage = 1 | 2 | 3;

export type RoomObjectId =
  | 'study_table'
  | 'bookshelf'
  | 'wall_clock'
  | 'backpack'
  | 'calendar'
  | 'wall_poster'
  | 'desk_drawer'
  | 'wardrobe'
  | 'bed'
  | 'exit_door';

export type InventoryItemId = 'brass_key' | 'mysterious_paper' | 'uv_torch';

export type DirectionStep = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export type TimerMode = 'standard' | 'demo';

export type BookId = 'A' | 'B' | 'C' | 'D';

export type WardenThreatState =
  | 'DORMANT'
  | 'APPROACHING'
  | 'OUTSIDE_ROOM'
  | 'INSPECTING_DOOR'
  | 'IMMINENT_ARRIVAL'
  | 'ARRIVED';

export type VictoryClassification =
  | 'PERFECT_ESCAPE'
  | 'SMART_ESCAPE'
  | 'NARROW_ESCAPE';

export type EvidenceId =
  | 'ev_mystery_note'
  | 'ev_bookshelf_count'
  | 'ev_poster_stars'
  | 'ev_clock_alarm'
  | 'ev_drawer_paper'
  | 'ev_calendar_order'
  | 'ev_uv_sequence'
  | 'ev_bed_chalk';

export interface EvidenceItemMeta {
  id: EvidenceId;
  title: string;
  objectId: RoomObjectId;
  objectLabel: string;
  stage: PuzzleStage;
  shortDescription: string;
  detailNote: string;
  markerSymbol: string;
}

export interface EvidenceConnection {
  id: string;
  from: EvidenceId;
  to: EvidenceId;
  note?: string;
}

export interface PhoneMessage {
  id: string;
  sender: string;
  role: string;
  time: string;
  preview: string;
  body: string;
}

export interface PhoneMissedCall {
  id: string;
  caller: string;
  tag: string;
  time: string;
  attempts: number;
  note: string;
}

export interface PhonePhotoMeta {
  id: string;
  title: string;
  timestamp: string;
  location: string;
  caption: string;
  sceneVariant: 'corridor' | 'desk' | 'chai';
}

export interface PhoneVoicemail {
  id: string;
  caller: string;
  time: string;
  durationSec: number;
  transcript: string;
}

export interface PhoneState {
  unreadMessageIds: string[];
  viewedPhotoIds: string[];
  playedVoicemailIds: string[];
  missedCallsCleared: boolean;
}

export interface PersonalBestRecord {
  bestTimeSeconds: number;
  classification: VictoryClassification;
  timerMode: TimerMode;
  hintsUsed: number;
  achievedAtIso: string;
}

export interface InventoryItem {
  id: InventoryItemId;
  name: string;
  shortLabel: string;
  description: string;
  inspectNote: string;
  usableContext: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  category: 'OBJECT' | 'CLUE' | 'ITEM' | 'PUZZLE' | 'HINT' | 'SYSTEM';
  title: string;
  detail: string;
}

export interface BookItem {
  id: BookId;
  title: string;
  subject: string;
  year: number;
  digit: string;
  color: string;
}

export interface RoomObjectMeta {
  id: RoomObjectId;
  name: string;
  subtitle: string;
  description: string;
  clueTitle?: string;
  clueText?: string;
  evidenceId?: EvidenceId;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  hotspotAnchor: [number, number, number];
}

export interface StoryEventCue {
  id: string;
  title: string;
  detail: string;
  tone: 'amber' | 'sky' | 'purple' | 'red' | 'emerald';
}

export interface StoryAnimationTriggers {
  phoneBuzzCount: number;
  doorShadowCount: number;
  lightFlickerCount: number;
  handleNudgeCount: number;
}

export interface GameState {
  phase: GamePhase;
  currentPuzzle: PuzzleStage;
  puzzlesCompleted: {
    1: boolean;
    2: boolean;
    3: boolean;
  };
  hintsRemaining: number; // Strictly 2 globally! Never resets between puzzles.
  hintsUsedTotal: number;
  hintsUsedByPuzzle: {
    1: number;
    2: number;
    3: number;
  };
  revealedHints: {
    puzzle: PuzzleStage;
    hintIndex: number;
    text: string;
  }[];
  thirdHintRejected: boolean;
  timerMode: TimerMode;
  timeRemaining: number; // seconds
  elapsedSeconds: number;
  timerRunning: boolean;
  wardenState: WardenThreatState;
  inventory: InventoryItemId[];
  selectedItem: InventoryItemId | null;
  armedItem: InventoryItemId | null;
  uvTorchActive: boolean;
  uvSweptDirections: DirectionStep[];
  uvMessageDiscovered: boolean;
  bookshelfUnlockedWithKey: boolean;
  persistentBookOrder: BookId[];
  inspectedObjects: RoomObjectId[];
  discoveredClues: string[];
  discoveredEvidence: EvidenceId[];
  usedEvidence: EvidenceId[];
  evidenceConnections: EvidenceConnection[];
  revealedSubClues: {
    backpackUnzipped: boolean;
    wardrobeOpened: boolean;
    bedPillowLifted: boolean;
    deskPhoneChecked: boolean;
  };
  phoneState: PhoneState;
  phoneModalOpen: boolean;
  activeObject: RoomObjectId | null;
  logs: LogEntry[];
  result: 'NONE' | 'VICTORY' | 'FAILURE';
  victoryClassification: VictoryClassification | null;
  isNewPersonalBest: boolean;
  exploreAfterWin: boolean;
  soundMuted: boolean;
  masterVolume: number; // 0..1
  ambientEnabled: boolean;
  storyTriggers: StoryAnimationTriggers;
}
