import React, { useMemo, useState } from 'react';
import { CheckCircle2, Link2, Lock, Plus, Search, Trash2, Unlink, X } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';

export interface GenericEvidenceCard {
  id: string;
  title: string;
  objectId: string;
  objectLabel: string;
  stage: 1 | 2 | 3;
  shortDescription: string;
  detailNote: string;
  markerSymbol: string;
}

export interface GenericEvidenceConnection {
  id: string;
  from: string;
  to: string;
}

interface GenericEvidenceBoardModalProps {
  campaignTitle: string;
  evidenceOrder: string[];
  evidenceMap: Record<string, GenericEvidenceCard>;
  pairDescriptions: Record<string, string>;
  discoveredEvidence: string[];
  usedEvidence: string[];
  connections: GenericEvidenceConnection[];
  puzzlesCompleted: { 1: boolean; 2: boolean; 3: boolean };
  onClose: () => void;
  onInspectObject: (objectId: string) => void;
  onAddConnection: (from: string, to: string) => void;
  onRemoveConnection: (connectionId: string) => void;
  onClearConnections: () => void;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export const GenericEvidenceBoardModal: React.FC<GenericEvidenceBoardModalProps> = ({
  campaignTitle,
  evidenceOrder,
  evidenceMap,
  pairDescriptions,
  discoveredEvidence,
  usedEvidence,
  connections,
  puzzlesCompleted,
  onClose,
  onInspectObject,
  onAddConnection,
  onRemoveConnection,
  onClearConnections,
}) => {
  const [stageFilter, setStageFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);

  const discoveredCount = discoveredEvidence.length;
  const totalCount = evidenceOrder.length;

  const filteredIds = useMemo(
    () =>
      evidenceOrder.filter((id) => {
        if (stageFilter === 'ALL') return true;
        return evidenceMap[id].stage === stageFilter;
      }),
    [evidenceOrder, evidenceMap, stageFilter]
  );

  const handleCardPinClick = (id: string) => {
    if (!discoveredEvidence.includes(id)) return;
    if (!linkingFrom) {
      soundEngine.playInspect();
      setLinkingFrom(id);
      return;
    }
    if (linkingFrom === id) {
      setLinkingFrom(null);
      return;
    }
    soundEngine.playPinConnect();
    onAddConnection(linkingFrom, id);
    setLinkingFrom(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${campaignTitle} Evidence Board`}
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-amber-300/25 bg-[#0a0f18] text-slate-100 shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d1422] px-5 py-4">
          <div>
            <p className="font-mono-tabular text-[11px] font-bold tracking-[0.22em] text-amber-400">
              ISOLATED EVIDENCE PINBOARD · {campaignTitle.toUpperCase()}
            </p>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Case Clues & Hypothesis Board
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-tabular text-xs font-bold text-amber-200">
              {discoveredCount}/{totalCount} DISCOVERED · {connections.length} LINKS
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close board"
              className="rounded-lg border border-white/15 bg-[#151d2e] p-1.5 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0b101b] px-5 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 1, 2, 3] as const).map((tab) => (
              <button
                key={String(tab)}
                type="button"
                onClick={() => setStageFilter(tab)}
                className={`rounded-md px-2.5 py-1 font-mono-tabular text-xs font-semibold transition-colors ${
                  stageFilter === tab
                    ? 'bg-amber-500 text-slate-950'
                    : 'border border-white/10 bg-[#141b2a] text-slate-300 hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Clues' : `Lock ${tab}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono-tabular text-[11px] text-slate-300">
            {linkingFrom ? (
              <span className="text-sky-300">
                Linking <strong className="text-white">{evidenceMap[linkingFrom]?.title}</strong> —
                select a second discovered clue
              </span>
            ) : (
              <span>Only discovered clues can be linked</span>
            )}
            {linkingFrom && (
              <button
                type="button"
                onClick={() => setLinkingFrom(null)}
                className="rounded border border-white/20 px-2 py-0.5 text-[10px] hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredIds.map((id) => {
              const meta = evidenceMap[id];
              const discovered = discoveredEvidence.includes(id);
              const used = usedEvidence.includes(id) || puzzlesCompleted[meta.stage];
              const isLinkSource = linkingFrom === id;

              if (!discovered) {
                return (
                  <div
                    key={id}
                    className="flex flex-col justify-between rounded-xl border border-dashed border-white/15 bg-[#0e1420]/70 p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono-tabular font-semibold">LOCK {meta.stage}</span>
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <div className="my-4 text-center">
                      <p className="font-mono-tabular text-xs font-bold tracking-widest text-slate-500">
                        UNDISCOVERED CLUE
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Inspect {meta.objectLabel} inside this environment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onInspectObject(meta.objectId);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-[#141c2c] px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:border-amber-400/50 hover:text-amber-200"
                    >
                      <Search className="h-3 w-3" />
                      <span>Investigate {meta.objectLabel}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                    isLinkSource
                      ? 'border-sky-400 bg-[#111d30] ring-2 ring-sky-400/35'
                      : used
                        ? 'border-emerald-500/40 bg-[#0d1915]'
                        : 'border-amber-400/35 bg-[#121927]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono-tabular text-[10px] font-bold tracking-wider text-amber-300">
                        {meta.markerSymbol} · LOCK {meta.stage}
                      </span>
                      {used && (
                        <span className="inline-flex items-center gap-1 font-mono-tabular text-[10px] font-bold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold text-white">
                      {meta.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      {meta.detailNote}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleCardPinClick(id)}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 font-semibold transition-colors ${
                        isLinkSource
                          ? 'bg-sky-500 text-slate-950'
                          : linkingFrom
                            ? 'border border-sky-400/50 bg-sky-500/15 text-sky-200 hover:bg-sky-500 hover:text-slate-950'
                            : 'border border-amber-400/35 bg-amber-500/10 text-amber-200 hover:bg-amber-500/25'
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                      <span>
                        {isLinkSource ? 'Selected' : linkingFrom ? 'Connect' : 'Link Clue'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onInspectObject(meta.objectId);
                      }}
                      className="font-semibold text-amber-300 hover:text-amber-200"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="rounded-xl border border-amber-300/25 bg-[#0c111d] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-amber-400" />
                <h3 className="font-display text-sm font-bold text-white">
                  Pinned Hypothesis Threads ({connections.length})
                </h3>
              </div>
              {connections.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPinRemove();
                    onClearConnections();
                  }}
                  className="inline-flex items-center gap-1 rounded border border-red-400/35 bg-red-950/35 px-2.5 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-900/50"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {connections.length === 0 ? (
              <p className="mt-3 text-xs text-slate-400">
                Select &ldquo;Link Clue&rdquo; on two discovered evidence cards to record a thread.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {connections.map((conn) => {
                  const a = evidenceMap[conn.from];
                  const b = evidenceMap[conn.to];
                  if (!a || !b) return null;
                  const note =
                    pairDescriptions[pairKey(conn.from, conn.to)] ??
                    `Connected hypothesis: ${a.objectLabel} ↔ ${b.objectLabel}`;
                  return (
                    <div
                      key={conn.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-[#121928] px-3 py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-amber-200">
                          {a.title} ↔ {b.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-300">{note}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playPinRemove();
                          onRemoveConnection(conn.id);
                        }}
                        aria-label="Remove thread"
                        className="rounded border border-white/10 p-1 text-slate-400 hover:border-red-400/50 hover:text-red-300"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
