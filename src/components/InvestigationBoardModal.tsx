import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  X,
  Lock,
  CheckCircle2,
  Pin,
  ArrowUpRight,
  Link2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  EVIDENCE_ITEMS,
  EVIDENCE_LINK_DESCRIPTIONS,
  EVIDENCE_ORDER,
  getEvidencePairKey,
} from '../data/gameContent';
import {
  EvidenceConnection,
  EvidenceId,
  GameState,
  PuzzleStage,
  RoomObjectId,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface InvestigationBoardModalProps {
  state: GameState;
  onClose: () => void;
  onInspectObject: (objectId: RoomObjectId) => void;
  onAddConnection: (from: EvidenceId, to: EvidenceId) => void;
  onRemoveConnection: (connectionId: string) => void;
  onClearConnections: () => void;
}

const STAGE_LABELS: Record<PuzzleStage, string> = {
  1: 'Stage 1 · Desk Drawer Lock',
  2: 'Stage 2 · Bookshelf Archive',
  3: 'Stage 3 · Corridor Exit Deadbolt',
};

interface Point2D {
  x: number;
  y: number;
}

export const InvestigationBoardModal: React.FC<InvestigationBoardModalProps> = ({
  state,
  onClose,
  onInspectObject,
  onAddConnection,
  onRemoveConnection,
  onClearConnections,
}) => {
  const discoveredCount = state.discoveredEvidence.length;
  const totalCount = EVIDENCE_ORDER.length;

  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const pinRefs = useRef<Partial<Record<EvidenceId, HTMLButtonElement | null>>>({});

  const [connectingFrom, setConnectingFrom] = useState<EvidenceId | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [pinCoords, setPinCoords] = useState<Partial<Record<EvidenceId, Point2D>>>({});

  const recomputePinPositions = useCallback(() => {
    const container = boardContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    const next: Partial<Record<EvidenceId, Point2D>> = {};
    EVIDENCE_ORDER.forEach((id) => {
      const btn = pinRefs.current[id];
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      next[id] = {
        x: r.left - containerRect.left + scrollLeft + r.width / 2,
        y: r.top - containerRect.top + scrollTop + r.height / 2,
      };
    });
    setPinCoords(next);
  }, []);

  useLayoutEffect(() => {
    recomputePinPositions();
    const container = boardContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => recomputePinPositions());
    observer.observe(container);
    window.addEventListener('resize', recomputePinPositions);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recomputePinPositions);
    };
  }, [recomputePinPositions, state.discoveredEvidence.length, state.evidenceConnections.length]);

  const getStatus = (id: EvidenceId): 'UNDISCOVERED' | 'DISCOVERED' | 'USED' => {
    if (!state.discoveredEvidence.includes(id)) return 'UNDISCOVERED';
    if (state.usedEvidence.includes(id)) return 'USED';
    return 'DISCOVERED';
  };

  const handlePinClick = (id: EvidenceId) => {
    if (!state.discoveredEvidence.includes(id)) return;
    setSelectedConnectionId(null);

    if (connectingFrom === null) {
      soundEngine.playInspect();
      setConnectingFrom(id);
      return;
    }

    if (connectingFrom === id) {
      setConnectingFrom(null);
      return;
    }

    const exists = state.evidenceConnections.some(
      (c) => (c.from === connectingFrom && c.to === id) || (c.from === id && c.to === connectingFrom)
    );
    if (!exists) {
      soundEngine.playPinConnect();
      onAddConnection(connectingFrom, id);
    }
    setConnectingFrom(null);
  };

  const selectedConn: EvidenceConnection | undefined = state.evidenceConnections.find(
    (c) => c.id === selectedConnectionId
  );

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-amber-500/25 bg-[#0e121c] text-slate-100 shadow-2xl">
        {/* Top Workspace Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#090c14] px-5 py-3.5">
          <div>
            <p className="font-mono-tabular text-[11px] font-semibold tracking-wider text-amber-400">
              ROOM 307 · INTERACTIVE EVIDENCE BOARD
            </p>
            <h2 className="font-display text-lg font-bold text-white sm:text-xl">
              Investigation Workspace ({discoveredCount}/{totalCount} Recorded)
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {state.evidenceConnections.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPinRemove();
                  setSelectedConnectionId(null);
                  onClearConnections();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-950/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Threads ({state.evidenceConnections.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close investigation board"
              className="rounded-lg border border-white/15 bg-[#151c2c] p-1.5 text-slate-300 hover:border-white/35 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thread Builder Instruction Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0c111b] px-5 py-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Link2 className="h-3.5 w-3.5 text-amber-400" />
            {connectingFrom ? (
              <span className="text-amber-300">
                Pinning from <strong>{EVIDENCE_ITEMS[connectingFrom].title}</strong> — click another
                discovered card&apos;s pin to connect, or click again to cancel.
              </span>
            ) : (
              <span>
                Click the pin icon on any two discovered evidence cards to link relationships. Click a
                thread to inspect or remove it.
              </span>
            )}
          </div>
          <span className="font-mono-tabular text-[11px] text-slate-400">
            Threads: {state.evidenceConnections.length}
          </span>
        </div>

        {/* Selected Thread Detail Bar */}
        {selectedConn && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-[#18140d] px-5 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <span className="font-semibold text-amber-200">
                  {EVIDENCE_ITEMS[selectedConn.from].title} ↔{' '}
                  {EVIDENCE_ITEMS[selectedConn.to].title}
                </span>
                <p className="text-[11px] text-slate-300">
                  {EVIDENCE_LINK_DESCRIPTIONS[
                    getEvidencePairKey(selectedConn.from, selectedConn.to)
                  ] ?? 'Custom investigation link pinned between discovered clues.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playPinRemove();
                onRemoveConnection(selectedConn.id);
                setSelectedConnectionId(null);
              }}
              className="inline-flex items-center gap-1 rounded border border-red-400/40 bg-red-950/50 px-2.5 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-900/60"
            >
              <Trash2 className="h-3 w-3" />
              <span>Remove Thread</span>
            </button>
          </div>
        )}

        {/* Corkboard / Dark Desk Evidence Grid + SVG String Overlay */}
        <div
          ref={boardContainerRef}
          onScroll={recomputePinPositions}
          className="relative flex-1 overflow-y-auto p-4 sm:p-6 custom-scroll"
          style={{
            backgroundImage:
              'radial-gradient(rgba(245, 158, 11, 0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Visual Connection Threads Layer (above background, interactive on paths) */}
          <svg
            className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            {state.evidenceConnections.map((conn) => {
              const p1 = pinCoords[conn.from];
              const p2 = pinCoords[conn.to];
              if (!p1 || !p2) return null;

              const midX = (p1.x + p2.x) / 2;
              const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
              const sag = Math.min(48, Math.max(16, dist * 0.14));
              const midY = (p1.y + p2.y) / 2 + sag;
              const d = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

              const pairKey = getEvidencePairKey(conn.from, conn.to);
              const isLogicalLink = Boolean(EVIDENCE_LINK_DESCRIPTIONS[pairKey]);
              const isSelected = selectedConnectionId === conn.id;

              return (
                <g key={conn.id} className="pointer-events-auto cursor-pointer">
                  {/* Wide invisible hit stroke for easy clicking */}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    onClick={() => {
                      soundEngine.playInspect();
                      setSelectedConnectionId(isSelected ? null : conn.id);
                    }}
                  />
                  {/* Visible detective string */}
                  <path
                    d={d}
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : isLogicalLink ? '#f59e0b' : '#ef4444'}
                    strokeWidth={isSelected ? 3 : 2.2}
                    strokeDasharray={isLogicalLink ? undefined : '5 4'}
                    opacity={0.88}
                    onClick={() => {
                      soundEngine.playInspect();
                      setSelectedConnectionId(isSelected ? null : conn.id);
                    }}
                  />
                  {/* Center clickable node */}
                  <circle
                    cx={midX}
                    cy={(p1.y + p2.y) / 2 + sag * 0.5}
                    r={isSelected ? 8 : 6}
                    fill={isSelected ? '#0ea5e9' : isLogicalLink ? '#d97706' : '#dc2626'}
                    stroke="#090c14"
                    strokeWidth={2}
                    onClick={() => {
                      soundEngine.playInspect();
                      setSelectedConnectionId(isSelected ? null : conn.id);
                    }}
                  />
                </g>
              );
            })}
          </svg>

          <div className="relative z-20 space-y-6">
            {([1, 2, 3] as PuzzleStage[]).map((stage) => {
              const stageItems = EVIDENCE_ORDER.map((id) => EVIDENCE_ITEMS[id]).filter(
                (item) => item.stage === stage
              );
              const stageSolved = state.puzzlesCompleted[stage];

              return (
                <section key={stage}>
                  <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="font-display text-sm font-bold text-slate-200 sm:text-base">
                      {STAGE_LABELS[stage]}
                    </h3>
                    <span
                      className={`font-mono-tabular text-xs font-semibold ${
                        stageSolved ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {stageSolved ? 'Stage Completed' : 'In Investigation'}
                    </span>
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    {stageItems.map((item) => {
                      const status = getStatus(item.id);

                      if (status === 'UNDISCOVERED') {
                        return (
                          <div
                            key={item.id}
                            className="flex min-h-[164px] flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-[#090d16]/85 p-4 text-center"
                          >
                            <Lock className="h-5 w-5 text-slate-600" />
                            <p className="mt-2 font-mono-tabular text-xs font-semibold text-slate-500">
                              UNDISCOVERED
                            </p>
                            <p className="mt-1 text-[11px] text-slate-600">
                              Investigate Room 307 to uncover this evidence.
                            </p>
                          </div>
                        );
                      }

                      const isUsed = status === 'USED';
                      const isPinSource = connectingFrom === item.id;
                      const linkedCount = state.evidenceConnections.filter(
                        (c) => c.from === item.id || c.to === item.id
                      ).length;

                      return (
                        <div
                          key={item.id}
                          className={`relative flex min-h-[164px] flex-col justify-between rounded-lg border p-3.5 shadow-lg transition-colors ${
                            isPinSource
                              ? 'border-sky-400 bg-[#101c31] ring-1 ring-sky-400/70'
                              : isUsed
                                ? 'border-emerald-500/40 bg-[#0d1715]'
                                : 'border-amber-400/35 bg-[#141925]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono-tabular text-[10px] font-bold tracking-wider text-slate-400">
                                {item.objectLabel}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isUsed && (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                )}
                                <button
                                  ref={(el) => {
                                    pinRefs.current[item.id] = el;
                                  }}
                                  type="button"
                                  onClick={() => handlePinClick(item.id)}
                                  title={
                                    isPinSource
                                      ? 'Cancel thread connection'
                                      : connectingFrom
                                        ? 'Connect thread to this clue'
                                        : 'Start visual clue link'
                                  }
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                                    isPinSource
                                      ? 'border-sky-300 bg-sky-500 text-slate-950'
                                      : linkedCount > 0
                                        ? 'border-amber-300 bg-amber-500 text-slate-950'
                                        : 'border-amber-400/40 bg-[#0a0f1a] text-amber-300 hover:border-amber-300 hover:bg-amber-500/20'
                                  }`}
                                >
                                  <Pin className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            <h4 className="mt-1.5 font-display text-sm font-bold text-white">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                              {item.detailNote}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                            <span
                              className={`font-mono-tabular text-[10px] font-bold ${
                                isUsed ? 'text-emerald-300' : 'text-amber-300'
                              }`}
                            >
                              {isUsed ? 'USED IN PUZZLE' : 'DISCOVERED'}
                              {linkedCount > 0 ? ` · ${linkedCount} LINK` : ''}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onInspectObject(item.objectId);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-amber-300"
                            >
                              <span>Inspect</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
