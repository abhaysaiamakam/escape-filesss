import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Compass,
  FileSearch,
  KeyRound,
  Lock,
  RotateCcw,
  RotateCw,
  Shield,
  X,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { ArchiveObjectId } from '../../three/archiveRoomBuilder';
import {
  caesarDecodeWord,
  COMPASS_BEARINGS,
  CompassBearing,
  DIFFICULT_CIPHER_TEXT,
  DIFFICULT_INVENTORY_ITEMS,
  DIFFICULT_OBJECTS,
  DifficultInventoryId,
  WITNESS_RECORDS_DATA,
} from './difficultData';

interface DifficultInspectionModalProps {
  objectId: ArchiveObjectId;
  puzzlesCompleted: { 1: boolean; 2: boolean; 3: boolean };
  cipherShift: number;
  onChangeCipherShift: (shift: number) => void;
  onSubmitCipherPuzzle: (decodedWord: string) => { ok: boolean; message: string };
  timelineOrder: string[];
  onChangeTimelineOrder: (order: string[]) => void;
  onSubmitTimelinePuzzle: () => { ok: boolean; message: string };
  vaultBearing: CompassBearing;
  onChangeVaultBearing: (b: CompassBearing) => void;
  vaultDigits: [number, number, number, number];
  onChangeVaultDigits: (d: [number, number, number, number]) => void;
  onSubmitVaultPuzzle: () => { ok: boolean; message: string };
  onCollectShiftPlate: () => void;
  inventory: DifficultInventoryId[];
  onClose: () => void;
  onJumpToObject: (id: ArchiveObjectId) => void;
}

export const DifficultInspectionModal: React.FC<DifficultInspectionModalProps> = ({
  objectId,
  puzzlesCompleted,
  cipherShift,
  onChangeCipherShift,
  onSubmitCipherPuzzle,
  timelineOrder,
  onChangeTimelineOrder,
  onSubmitTimelinePuzzle,
  vaultBearing,
  onChangeVaultBearing,
  vaultDigits,
  onChangeVaultDigits,
  onSubmitVaultPuzzle,
  onCollectShiftPlate,
  inventory,
  onClose,
  onJumpToObject,
}) => {
  const meta = DIFFICULT_OBJECTS[objectId];
  const [cipherAnswer, setCipherAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setFeedback(null);
  }, [objectId]);

  const previewWord = caesarDecodeWord(DIFFICULT_CIPHER_TEXT, cipherShift);

  const moveWitness = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= timelineOrder.length) return;
    soundEngine.playPaperRustle();
    const copy = [...timelineOrder];
    const tmp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = tmp;
    onChangeTimelineOrder(copy);
  };

  const rotateBearing = (delta: -1 | 1) => {
    soundEngine.playVaultBoltShift();
    const idx = COMPASS_BEARINGS.indexOf(vaultBearing);
    const next =
      COMPASS_BEARINGS[(idx + delta + COMPASS_BEARINGS.length) % COMPASS_BEARINGS.length];
    onChangeVaultBearing(next);
  };

  const stepVaultDigit = (slot: number, delta: -1 | 1) => {
    soundEngine.playDialClick();
    const copy = [...vaultDigits] as [number, number, number, number];
    copy[slot] = (copy[slot] + delta + 10) % 10;
    onChangeVaultDigits(copy);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.name}
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/78 px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-amber-400/25 bg-[#0e0c0a] text-slate-100 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#17130f] px-5 py-4">
          <div>
            <p className="font-mono-tabular text-[11px] font-bold tracking-[0.2em] text-amber-400">
              {meta.subtitle.toUpperCase()}
            </p>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{meta.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspection"
            className="rounded-lg border border-white/15 bg-[#221c15] p-1.5 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="custom-scroll flex-1 space-y-4 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-slate-300">{meta.description}</p>

          <div className="rounded-lg border border-amber-400/25 bg-[#1a1510] p-3.5 text-xs">
            <p className="font-mono-tabular font-bold text-amber-300">{meta.clueTitle}</p>
            <p className="mt-1 leading-relaxed text-slate-200">{meta.clueText}</p>
          </div>

          {/* Hidden Compartment: Collect Brass Shift Plate */}
          {objectId === 'hidden_compartments' && (
            <div className="rounded-xl border border-white/15 bg-[#15120d] p-4 space-y-3">
              <p className="text-xs text-slate-300">
                Behind the loose masonry slab sits the{' '}
                <strong className="text-amber-200">
                  {DIFFICULT_INVENTORY_ITEMS.caesar_rule_plate.name}
                </strong>
                .
              </p>
              <button
                type="button"
                disabled={inventory.includes('caesar_rule_plate')}
                onClick={onCollectShiftPlate}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:bg-emerald-950/60 disabled:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {inventory.includes('caesar_rule_plate')
                    ? 'Brass Shift Plaque Acquired'
                    : 'Take Brass Shift Plaque'}
                </span>
              </button>
            </div>
          )}

          {/* LOCK 1: THE ARCHIVE CIPHER (ROTATABLE CAESAR WHEEL) */}
          {objectId === 'cipher_wheel' && (
            <div className="rounded-xl border border-amber-400/35 bg-[#14100b] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-amber-400" />
                  <span className="font-display text-sm font-bold text-white">
                    Concentric Brass Cipher Wheel (Lock 1)
                  </span>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-amber-300">
                  SHIFT: {cipherShift > 0 ? `+${cipherShift}` : cipherShift}
                </span>
              </div>

              {/* Visual Concentric Caesar Ring */}
              <div className="flex flex-col items-center gap-4 rounded-lg border border-white/10 bg-[#0b0907] p-4 sm:flex-row">
                <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full border-4 border-amber-500/45 bg-[#1c160e]">
                  <div
                    className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-amber-300/60 bg-[#281f13] transition-transform duration-200"
                    style={{ transform: `rotate(${cipherShift * 13.84}deg)` }}
                  >
                    <div className="text-center font-mono-tabular">
                      <p className="text-[10px] text-amber-400">RING OFFSET</p>
                      <p className="text-lg font-bold text-white">
                        {cipherShift > 0 ? `+${cipherShift}` : cipherShift}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 font-mono-tabular">
                    <div className="rounded border border-white/10 bg-[#17120c] p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">CIPHER PLAQUE</p>
                      <p className="mt-1 text-lg font-bold tracking-[0.22em] text-amber-300">
                        {DIFFICULT_CIPHER_TEXT}
                      </p>
                    </div>
                    <div className="rounded border border-amber-400/30 bg-[#1c160e] p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">WHEEL READOUT</p>
                      <p className="mt-1 text-lg font-bold tracking-[0.22em] text-white">
                        {previewWord}
                      </p>
                    </div>
                  </div>

                  {!puzzlesCompleted[1] && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playCipherWheelClick();
                          onChangeCipherShift(cipherShift - 1);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-white/20 bg-[#1f1912] px-3 py-1.5 font-mono-tabular font-bold text-slate-100 hover:border-amber-400"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Shift -1</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playCipherWheelClick();
                          onChangeCipherShift(cipherShift + 1);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-white/20 bg-[#1f1912] px-3 py-1.5 font-mono-tabular font-bold text-slate-100 hover:border-amber-400"
                      >
                        <span>Shift +1</span>
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {puzzlesCompleted[1] ? (
                <p className="font-mono-tabular text-xs font-bold text-emerald-300">
                  CIPHER SOLVED · BEARING AUTHORIZED · WITNESS FOLDERS UNSEALED
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={cipherAnswer}
                    onChange={(e) => setCipherAnswer(e.target.value.toUpperCase())}
                    placeholder="Enter decoded 5-letter direction"
                    aria-label="Decoded cipher direction"
                    className="flex-1 rounded-lg border border-white/20 bg-[#17120c] px-3 py-2 font-mono-tabular text-sm font-bold uppercase text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const res = onSubmitCipherPuzzle(cipherAnswer);
                      setFeedback({ ok: res.ok, text: res.message });
                    }}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Break Cipher
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LOCK 2: THE WARDEN'S TIMELINE (CHRONOLOGICAL LOGIC GRID) */}
          {objectId === 'witness_records' && (
            <div className="rounded-xl border border-amber-400/35 bg-[#14100b] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-amber-400" />
                  <span className="font-display text-sm font-bold text-white">
                    1994 Witness Timeline Reconstruction (Lock 2)
                  </span>
                </div>
                {puzzlesCompleted[2] && (
                  <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                    TIMELINE VERIFIED
                  </span>
                )}
              </div>

              {!puzzlesCompleted[1] ? (
                <div className="rounded-lg border border-red-400/35 bg-red-950/35 p-3 text-xs text-red-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Lock className="h-4 w-4" />
                    <span>WITNESS SEAL INTACT</span>
                  </div>
                  <p>Break the Archive Cipher at the Cipher Wheel (Lock 1) to unseal these folders.</p>
                  <button
                    type="button"
                    onClick={() => onJumpToObject('cipher_wheel')}
                    className="rounded bg-amber-500 px-3 py-1 font-bold text-slate-950"
                  >
                    Go to Cipher Wheel
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-300">
                    Reorder the four witnesses strictly from <strong>Earliest Event (Slot 1)</strong>{' '}
                    to <strong>Latest Event (Slot 4)</strong> using the Archive Shelves ledger.
                  </p>

                  <div className="space-y-2">
                    {timelineOrder.map((wId, idx) => {
                      const rec = WITNESS_RECORDS_DATA.find((w) => w.id === wId);
                      if (!rec) return null;
                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-[#1a150f] px-3 py-2.5 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-amber-300">
                                SLOT {idx + 1}
                              </span>
                              <span className="font-bold text-white">{rec.name}</span>
                            </div>
                            <p className="mt-1 text-slate-300">{rec.statement}</p>
                            <p className="mt-0.5 font-mono-tabular text-[11px] text-amber-200/80">
                              Cross-check: {rec.contradictionNote}
                            </p>
                          </div>
                          {!puzzlesCompleted[2] && (
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveWitness(idx, -1)}
                                aria-label="Move earlier"
                                className="rounded border border-white/15 bg-[#241d15] p-1 text-slate-200 disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === timelineOrder.length - 1}
                                onClick={() => moveWitness(idx, 1)}
                                aria-label="Move later"
                                className="rounded border border-white/15 bg-[#241d15] p-1 text-slate-200 disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="font-mono-tabular text-xs text-amber-300">
                      CURRENT SEQUENCE: <strong>{timelineOrder.join(' - ')}</strong>
                    </span>
                    {!puzzlesCompleted[2] && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = onSubmitTimelinePuzzle();
                          setFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                      >
                        Verify Chronology
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* LOCK 3: THE MECHANICAL VAULT (DUAL-MECHANISM) */}
          {objectId === 'mechanical_vault' && (
            <div className="rounded-xl border border-emerald-400/30 bg-[#0d120f] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="font-display text-sm font-bold text-white">
                    Mechanical Archive Vault (Lock 3)
                  </span>
                </div>
                {puzzlesCompleted[3] && (
                  <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                    VAULT UNSEALED
                  </span>
                )}
              </div>

              {!puzzlesCompleted[1] || !puzzlesCompleted[2] ? (
                <div className="rounded-lg border border-red-400/35 bg-red-950/35 p-3 text-xs text-red-200 space-y-1.5">
                  <p className="font-bold">DUAL-MECHANISM BOLTS LOCKED</p>
                  <p>
                    Complete both the Archive Cipher (Lock 1) and Witness Timeline (Lock 2) to arm
                    the Mechanical Vault crank.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. Outer Compass Bearing Ring */}
                  <div className="rounded-lg border border-white/15 bg-[#121914] p-3 space-y-2">
                    <p className="font-mono-tabular text-[11px] font-bold text-amber-300">
                      RING 1 · OUTER COMPASS SECTOR (FROM CIPHER LOCK)
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => rotateBearing(-1)}
                        className="rounded border border-white/15 bg-[#1b241d] px-3 py-1.5 text-xs font-bold text-white hover:border-amber-400"
                      >
                        ◀ Rotate CCW
                      </button>
                      <span className="font-mono-tabular text-base font-bold tracking-widest text-white">
                        {vaultBearing}
                      </span>
                      <button
                        type="button"
                        onClick={() => rotateBearing(1)}
                        className="rounded border border-white/15 bg-[#1b241d] px-3 py-1.5 text-xs font-bold text-white hover:border-amber-400"
                      >
                        Rotate CW ▶
                      </button>
                    </div>
                  </div>

                  {/* 2. Inner 4-Digit Witness Sequence Rings */}
                  <div className="rounded-lg border border-white/15 bg-[#121914] p-3 space-y-2">
                    <p className="font-mono-tabular text-[11px] font-bold text-emerald-300">
                      RING 2 · FOUR INNER PIN DRUMS (FROM TIMELINE LOCK)
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {vaultDigits.map((digit, slot) => (
                        <div
                          key={slot}
                          className="flex flex-col items-center rounded-lg border border-white/15 bg-[#090e0a] py-2"
                        >
                          <button
                            type="button"
                            onClick={() => stepVaultDigit(slot, 1)}
                            className="px-3 py-1 text-xs font-bold text-slate-300 hover:text-white"
                          >
                            ▲
                          </button>
                          <span className="font-mono-tabular text-xl font-bold text-white">
                            {digit}
                          </span>
                          <button
                            type="button"
                            onClick={() => stepVaultDigit(slot, -1)}
                            className="px-3 py-1 text-xs font-bold text-slate-300 hover:text-white"
                          >
                            ▼
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!puzzlesCompleted[3] && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = onSubmitVaultPuzzle();
                        setFeedback({ ok: res.ok, text: res.message });
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>Engage Mechanical Vault Crank</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-lg border px-3.5 py-2.5 text-xs font-semibold ${
                feedback.ok
                  ? 'border-emerald-400/50 bg-emerald-950/50 text-emerald-200'
                  : 'border-red-500/50 bg-red-950/50 text-red-200'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
