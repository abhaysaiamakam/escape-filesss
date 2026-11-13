import React, { useState } from 'react';
import {
  Lightbulb,
  Volume2,
  VolumeX,
  RotateCcw,
  ScrollText,
  Compass,
  ChevronDown,
  ChevronUp,
  KeyRound,
  FileText,
  Flashlight,
  Clock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  LayoutGrid,
  SlidersHorizontal,
  Smartphone,
  Footprints,
} from 'lucide-react';
import {
  EVIDENCE_ORDER,
  GLOBAL_MAX_HINTS,
  INVENTORY_ITEMS,
  ROOM_OBJECTS,
  ROOM_OBJECT_ORDER,
  WARDEN_THREAT_META,
} from '../data/gameContent';
import {
  GameState,
  InventoryItemId,
  RoomObjectId,
  StoryEventCue,
  TimerMode,
} from '../types/game';
import { InventoryInspectorModal } from './InventoryInspectorModal';

interface GameHudProps {
  state: GameState;
  hoveredObject: RoomObjectId | null;
  onSelectObject: (id: RoomObjectId) => void;
  onResetCamera: () => void;
  onRequestHint: () => void;
  onRejectedHintAttempt: () => void;
  onInspectInventoryItem: (id: InventoryItemId | null) => void;
  onArmItem: (id: InventoryItemId | null) => void;
  onToggleUvTorch: () => void;
  onToggleMute: () => void;
  onChangeVolume: (vol: number) => void;
  onToggleAmbient: () => void;
  onRestart: (mode?: TimerMode) => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  onOpenInvestigationBoard: () => void;
  onOpenPhone: () => void;
  acquisitionBanner: string | null;
  puzzleBanner: string | null;
  storyCue: StoryEventCue | null;
  onExitToLauncher?: () => void;
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  state,
  hoveredObject,
  onSelectObject,
  onResetCamera,
  onRequestHint,
  onRejectedHintAttempt,
  onInspectInventoryItem,
  onArmItem,
  onToggleUvTorch,
  onToggleMute,
  onChangeVolume,
  onToggleAmbient,
  onRestart,
  showHotspots,
  onToggleHotspots,
  onOpenInvestigationBoard,
  onOpenPhone,
  acquisitionBanner,
  puzzleBanner,
  storyCue,
  onExitToLauncher,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'log' | 'objects' | 'hints' | 'audio'>(
    'none'
  );

  const isUrgent = state.timeRemaining > 0 && state.timeRemaining < 120;
  const hintsExhausted = state.hintsRemaining <= 0;
  const wardenMeta = WARDEN_THREAT_META[state.wardenState];
  const phoneUnreadCount = state.phoneState.unreadMessageIds.length;

  const toggleDrawer = (drawer: 'log' | 'objects' | 'hints' | 'audio') => {
    setActiveDrawer((prev) => (prev === drawer ? 'none' : drawer));
  };

  const handleHintButtonClick = () => {
    if (hintsExhausted) {
      onRejectedHintAttempt();
      setActiveDrawer('hints');
      return;
    }
    onRequestHint();
    setActiveDrawer('hints');
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between">
      {/* TOP HUD BAR */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#090d16]/94 px-4 py-2.5 text-slate-100 sm:px-6">
        {/* Zone 1: Game Title & Launcher Back */}
        <div className="flex min-w-0 items-center gap-2.5">
          {onExitToLauncher && (
            <button
              type="button"
              onClick={onExitToLauncher}
              className="rounded border border-white/15 bg-[#121826] px-2 py-1 font-mono-tabular text-[11px] font-semibold text-slate-300 transition-colors hover:border-amber-400/60 hover:text-amber-200 whitespace-nowrap"
            >
              ← Menu
            </button>
          )}
          <div className="flex min-w-0 items-baseline gap-2.5">
            <h1 className="font-display truncate text-sm font-bold tracking-tight text-white sm:text-base">
              CAMPAIGN 01: THE LOST ROOM KEY
            </h1>
            <span className="hidden font-mono-tabular text-[11px] text-slate-400 lg:inline">
              Block C · Room 307 · Easy
            </span>
          </div>
        </div>

        {/* Zone 2: Puzzle Progression */}
        <nav
          aria-label="Puzzle progression"
          className="order-3 flex w-full items-center justify-center gap-1.5 border-t border-white/10 pt-2 text-[11px] font-medium md:order-2 md:w-auto md:border-t-0 md:pt-0 sm:gap-2 sm:text-xs"
        >
          {[
            { num: 1 as const, label: 'PUZZLE 1' },
            { num: 2 as const, label: 'PUZZLE 2' },
            { num: 3 as const, label: 'PUZZLE 3' },
          ].map((step, idx) => {
            const done = state.puzzlesCompleted[step.num];
            const active = !done && state.currentPuzzle === step.num;
            return (
              <React.Fragment key={step.num}>
                <span
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 font-mono-tabular ${
                    done
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : active
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'text-slate-500'
                  }`}
                >
                  {done && <Check className="h-3 w-3" />}
                  {step.label}
                </span>
                {idx < 2 && <span className="text-slate-600">→</span>}
              </React.Fragment>
            );
          })}
          <span className="text-slate-600">→</span>
          <span
            className={`whitespace-nowrap rounded px-2 py-0.5 font-mono-tabular ${
              state.result === 'VICTORY'
                ? 'bg-emerald-500 font-bold text-slate-950'
                : 'text-slate-500'
            }`}
          >
            ESCAPED
          </span>
        </nav>

        {/* Zone 3: Warden Proximity, Global Hint Counter, Countdown & Audio Settings */}
        <div className="order-2 flex items-center gap-2 md:order-3 sm:gap-2.5">
          <div
            title={wardenMeta.detail}
            className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono-tabular text-[11px] font-semibold whitespace-nowrap sm:flex ${
              wardenMeta.severity >= 4
                ? 'border-red-500/60 bg-red-950/60 text-red-200'
                : wardenMeta.severity >= 2
                  ? 'border-amber-500/50 bg-amber-950/45 text-amber-200'
                  : 'border-white/15 bg-[#121826] text-slate-300'
            }`}
          >
            <Footprints className="h-3.5 w-3.5" />
            <span>WARDEN: {wardenMeta.shortStatus}</span>
          </div>

          <button
            type="button"
            onClick={() => toggleDrawer('hints')}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono-tabular text-xs font-semibold transition-colors whitespace-nowrap ${
              hintsExhausted
                ? 'border-red-500/40 bg-red-950/40 text-red-300'
                : 'border-amber-400/35 bg-[#121826] text-amber-300 hover:border-amber-400'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>
              HINTS: {state.hintsRemaining}/{GLOBAL_MAX_HINTS}
            </span>
          </button>

          <div
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono-tabular text-xs font-bold whitespace-nowrap ${
              isUrgent
                ? 'border-red-500/60 bg-red-950/60 text-red-300'
                : 'border-white/15 bg-[#121826] text-slate-100'
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${isUrgent ? 'text-red-400' : 'text-sky-400'}`} />
            <span>{formatTime(state.timeRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={() => toggleDrawer('audio')}
            aria-label="Audio settings"
            title="Audio settings"
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
              activeDrawer === 'audio'
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-white/15 bg-[#121826] text-slate-200 hover:border-white/35'
            }`}
          >
            {state.soundMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            )}
            <SlidersHorizontal className="hidden h-3 w-3 text-slate-400 sm:inline" />
          </button>
        </div>
      </header>

      {/* FLOATING CONTEXT & STORY EVENT BANNERS (Non-blocking) */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-20 flex flex-col items-center gap-2 px-4">
        {(isUrgent || wardenMeta.severity >= 3) &&
          state.phase !== 'VICTORY' &&
          state.phase !== 'FAILURE' && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-[#1a0b10]/95 px-4 py-1.5 text-xs font-bold tracking-wide text-red-200 shadow-lg">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span>
                {state.wardenState === 'IMMINENT_ARRIVAL'
                  ? 'WARDEN OUTSIDE DOOR 307 · KEYS RATTLING'
                  : state.wardenState === 'INSPECTING_DOOR'
                    ? 'WARDEN INSPECTING DOOR 307 · HURRY'
                    : 'THE WARDEN IS GETTING CLOSER.'}
              </span>
            </div>
          )}

        {storyCue && (
          <div className="rounded-lg border border-white/15 bg-[#0a0f1a]/95 px-4 py-2 text-center text-xs shadow-lg">
            <p className="font-mono-tabular font-bold text-amber-300">{storyCue.title}</p>
            <p className="mt-0.5 text-slate-200">{storyCue.detail}</p>
          </div>
        )}

        {puzzleBanner && (
          <div className="rounded-lg border border-emerald-400/50 bg-[#0b1b15]/95 px-4 py-2 font-mono-tabular text-xs font-bold text-emerald-300 shadow-lg">
            {puzzleBanner}
          </div>
        )}

        {acquisitionBanner && (
          <div className="rounded-lg border border-amber-400/50 bg-[#18130a]/95 px-4 py-2 text-xs font-semibold text-amber-200 shadow-lg">
            {acquisitionBanner}
          </div>
        )}

        {hoveredObject && !state.activeObject && (
          <div className="rounded-md border border-white/15 bg-[#0b0f18]/92 px-3 py-1 text-xs text-slate-200">
            Click to inspect <strong className="text-amber-300">{ROOM_OBJECTS[hoveredObject].name}</strong>
          </div>
        )}
      </div>

      {/* SECONDARY DRAWERS & INTERACTIVE ITEM INSPECTOR */}
      <div className="pointer-events-none relative flex-1">
        {state.selectedItem && (
          <InventoryInspectorModal
            itemId={state.selectedItem}
            armedItem={state.armedItem}
            uvTorchActive={state.uvTorchActive}
            bookshelfUnlocked={state.bookshelfUnlockedWithKey}
            onClose={() => onInspectInventoryItem(null)}
            onArmItem={onArmItem}
            onToggleUvTorch={onToggleUvTorch}
            onJumpToObject={(objId) => onSelectObject(objId)}
          />
        )}

        {activeDrawer !== 'none' && (
          <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 w-[min(560px,94vw)] -translate-x-1/2 rounded-xl border border-white/15 bg-[#0b0f18]/96 p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="font-display text-base font-bold text-white">
                {activeDrawer === 'log'
                  ? 'Investigation Log'
                  : activeDrawer === 'objects'
                    ? 'Room 307 · Interactive Objects'
                    : activeDrawer === 'audio'
                      ? 'Audio & Atmosphere Settings'
                      : `Hints (${state.hintsRemaining}/${GLOBAL_MAX_HINTS} Remaining Globally)`}
              </h3>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                aria-label="Close panel"
                className="rounded border border-white/10 bg-[#141a28] p-1 text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeDrawer === 'audio' && (
              <div className="mt-3 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Sound Effects & Audio</span>
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className={`rounded-lg border px-3 py-1.5 font-semibold ${
                      state.soundMuted
                        ? 'border-red-500/40 bg-red-950/40 text-red-300'
                        : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    }`}
                  >
                    {state.soundMuted ? 'Muted (Click to Unmute)' : 'Audio Enabled'}
                  </button>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-slate-300">
                    <span>Master Volume</span>
                    <span className="font-mono-tabular text-amber-300">
                      {Math.round(state.masterVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(state.masterVolume * 100)}
                    onChange={(e) => onChangeVolume(Number(e.target.value) / 100)}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-slate-300">Rain, Fan & Hostel Night Ambience</span>
                  <button
                    type="button"
                    onClick={onToggleAmbient}
                    className={`rounded-lg border px-3 py-1.5 font-semibold ${
                      state.ambientEnabled
                        ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                        : 'border-white/15 bg-[#141a28] text-slate-400'
                    }`}
                  >
                    {state.ambientEnabled ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}

            {activeDrawer === 'log' && (
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1 custom-scroll">
                {state.logs.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-white/10 bg-[#121724] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono-tabular font-semibold text-amber-300">
                        {entry.category} · {entry.title}
                      </span>
                      <span className="font-mono-tabular">{entry.timestamp}</span>
                    </div>
                    <p className="mt-1 text-slate-200">{entry.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {activeDrawer === 'objects' && (
              <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scroll">
                {ROOM_OBJECT_ORDER.map((id) => {
                  const obj = ROOM_OBJECTS[id];
                  const inspected = state.inspectedObjects.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onSelectObject(id);
                        setActiveDrawer('none');
                      }}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-[#121724] px-3 py-2 text-left text-xs transition-colors hover:border-amber-400/60 hover:bg-[#192032]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{obj.name}</p>
                        <p className="truncate text-[11px] text-slate-400">{obj.subtitle}</p>
                      </div>
                      {inspected && (
                        <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {activeDrawer === 'hints' && (
              <div className="mt-3 space-y-3">
                {state.revealedHints.length === 0 ? (
                  <p className="text-xs text-slate-300">
                    No hints requested yet. You have{' '}
                    <strong className="text-amber-300">2 hints total</strong> for the entire
                    escape—they never reset between puzzles.
                  </p>
                ) : (
                  <div className="max-h-44 space-y-2 overflow-y-auto custom-scroll">
                    {state.revealedHints.map((h, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-amber-500/25 bg-[#121724] p-2.5 text-xs"
                      >
                        <p className="font-mono-tabular text-[11px] font-semibold text-amber-300">
                          Puzzle {h.puzzle} · Hint {i + 1}
                        </p>
                        <p className="mt-1 text-slate-200">{h.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(hintsExhausted || state.thirdHintRejected) && (
                  <div className="rounded-lg border border-red-500/45 bg-red-950/45 p-3 text-xs text-red-200">
                    <p className="font-mono-tabular font-bold text-red-300">
                      THIRD HINT UNAVAILABLE.
                    </p>
                    <p className="mt-1">
                      You have used all your available hints. The rest is up to you.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono-tabular text-xs text-slate-400">
                    Current Stage: Puzzle {state.currentPuzzle}
                  </span>
                  <button
                    type="button"
                    disabled={hintsExhausted}
                    onClick={onRequestHint}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>
                      {hintsExhausted
                        ? 'No Hints Remaining (0/2)'
                        : `Use 1 Hint (${state.hintsRemaining}/2)`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* COLLAPSIBLE BOTTOM CONTROL DOCK */}
      <div className="pointer-events-none flex flex-col items-center px-3 pb-3">
        <div className="pointer-events-auto mb-1.5 flex items-center gap-2">
          <span className="hidden rounded-t-lg border border-b-0 border-white/15 bg-[#0b0f18]/94 px-3 py-1 font-mono-tabular text-[11px] text-slate-300 sm:inline-block">
            Arrows / WASD: Walk · Drag: Look · Click: Inspect
          </span>
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-white/15 bg-[#0b0f18]/94 px-3 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex w-full max-w-[1060px] flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/15 bg-[#0b0f18]/95 px-3 py-2.5 shadow-2xl sm:px-4">
            {/* Inventory Bar */}
            <div className="flex items-center gap-1.5">
              <span className="hidden text-[11px] font-semibold text-slate-400 lg:inline">
                Inventory:
              </span>
              {(['brass_key', 'mysterious_paper', 'uv_torch'] as InventoryItemId[]).map(
                (itemId) => {
                  const owned = state.inventory.includes(itemId);
                  const item = INVENTORY_ITEMS[itemId];
                  const isSelected = state.selectedItem === itemId;
                  const isArmed = state.armedItem === itemId;
                  const Icon =
                    itemId === 'brass_key'
                      ? KeyRound
                      : itemId === 'mysterious_paper'
                        ? FileText
                        : Flashlight;

                  if (!owned) {
                    return (
                      <div
                        key={itemId}
                        title="Undiscovered item"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-white/10 bg-[#070a11] text-slate-600"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={itemId}
                      type="button"
                      onClick={() =>
                        onInspectInventoryItem(isSelected ? null : itemId)
                      }
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        itemId === 'uv_torch' && state.uvTorchActive
                          ? 'border-purple-400 bg-purple-600 text-white'
                          : isArmed
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                            : isSelected
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                              : 'border-white/15 bg-[#141a28] text-slate-100 hover:border-amber-400/50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{item.shortLabel}</span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Primary Actions: Investigation Board, Phone, Objects, Log, Hint Request */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenInvestigationBoard}
                className="flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-[#151c2c] px-2.5 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-400 hover:bg-[#1c253b] whitespace-nowrap"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>
                  Board ({state.discoveredEvidence.length}/{EVIDENCE_ORDER.length})
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenPhone}
                className="relative flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-[#111b2d] px-2.5 py-1.5 text-xs font-semibold text-sky-200 transition-colors hover:border-sky-400 hover:bg-[#18253d] whitespace-nowrap"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Phone</span>
                {phoneUnreadCount > 0 && (
                  <span className="rounded bg-sky-400 px-1 font-mono-tabular text-[10px] font-bold text-slate-950">
                    {phoneUnreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleDrawer('objects')}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeDrawer === 'objects'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-white/15 bg-[#141a28] text-slate-200 hover:border-white/30'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Objects ({state.inspectedObjects.length}/10)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleDrawer('log')}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeDrawer === 'log'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-white/15 bg-[#141a28] text-slate-200 hover:border-white/30'
                }`}
              >
                <ScrollText className="h-3.5 w-3.5" />
                <span>Log ({state.logs.length})</span>
              </button>

              <div
                onClick={() => {
                  if (hintsExhausted) {
                    onRejectedHintAttempt();
                    setActiveDrawer('hints');
                  }
                }}
              >
                <button
                  type="button"
                  disabled={hintsExhausted}
                  onClick={handleHintButtonClick}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 whitespace-nowrap"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>
                    {hintsExhausted
                      ? 'Hint Unavailable (0/2)'
                      : `Request Hint (${state.hintsRemaining}/2)`}
                  </span>
                </button>
              </div>
            </div>

            {/* Utility Actions: Room View, Hotspots, Demo Timer, Restart */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onResetCamera}
                title="Reset room camera"
                className="rounded-lg border border-white/15 bg-[#141a28] px-2.5 py-1.5 text-xs text-slate-200 hover:border-white/30 whitespace-nowrap"
              >
                Room View
              </button>

              <button
                type="button"
                onClick={onToggleHotspots}
                title={showHotspots ? 'Hide object pins' : 'Show object pins'}
                className="rounded-lg border border-white/15 bg-[#141a28] p-1.5 text-slate-200 hover:border-white/30"
              >
                {showHotspots ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => onRestart(state.timerMode === 'standard' ? 'demo' : 'standard')}
                title="Switch between 10m Standard and 2m30s Judge Demo timer"
                className="rounded-lg border border-white/15 bg-[#141a28] px-2.5 py-1.5 font-mono-tabular text-[11px] text-slate-300 hover:border-amber-400/50 hover:text-amber-200 whitespace-nowrap"
              >
                {state.timerMode === 'standard' ? '10m Mode' : 'Demo 2:30'}
              </button>

              <button
                type="button"
                onClick={() => onRestart(state.timerMode)}
                aria-label="Restart escape room"
                title="Restart game"
                className="rounded-lg border border-white/15 bg-[#141a28] p-1.5 text-slate-200 hover:border-red-400/60 hover:text-red-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
