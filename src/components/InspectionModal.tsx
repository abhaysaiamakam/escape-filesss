import React, { useEffect, useState } from 'react';
import {
  X,
  KeyRound,
  Lock,
  Unlock,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Smartphone,
  BookOpen,
  FileText,
  Calculator,
  FolderOpen,
  GripVertical,
  RotateCw,
} from 'lucide-react';
import {
  BOOKS_DATA,
  INTRO_LETTER_TEXT,
  PUZZLE_2_BOOK_ORDER,
  ROOM_OBJECTS,
} from '../data/gameContent';
import {
  BookId,
  BookItem,
  DirectionStep,
  GameState,
  RoomObjectId,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { UvPosterInspector } from './UvPosterInspector';

const LiveWallClockPreview: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 200);
    return () => window.clearInterval(id);
  }, []);

  const secs = now.getSeconds();
  const mins = now.getMinutes() + secs / 60;
  const hrs = (now.getHours() % 12) + mins / 60;
  const formatted = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-[#121724] p-4">
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-amber-600/80 bg-[#e7e2d4] text-slate-900">
        <span className="absolute top-1 text-[10px] font-bold">12</span>
        <span className="absolute right-1.5 text-[10px] font-bold">3</span>
        <span className="absolute bottom-1 text-[10px] font-bold">6</span>
        <span className="absolute left-2.5 bottom-3 text-[11px] font-extrabold text-red-700">
          7
        </span>
        {/* Fixed red alarm hand locked at 7:00 */}
        <div
          className="absolute bottom-1/2 left-1/2 h-7 w-0.5 origin-bottom -translate-x-1/2 rounded-full bg-red-600/80"
          style={{ transform: 'translateX(-50%) rotate(210deg)' }}
        />
        {/* Real-time hour hand */}
        <div
          className="absolute bottom-1/2 left-1/2 h-5 w-1.5 origin-bottom -translate-x-1/2 rounded-full bg-slate-900"
          style={{ transform: `translateX(-50%) rotate(${hrs * 30}deg)` }}
        />
        {/* Real-time minute hand */}
        <div
          className="absolute bottom-1/2 left-1/2 h-8 w-1 origin-bottom -translate-x-1/2 rounded-full bg-slate-800"
          style={{ transform: `translateX(-50%) rotate(${mins * 6}deg)` }}
        />
        {/* Real-time second hand */}
        <div
          className="absolute bottom-1/2 left-1/2 h-9 w-0.5 origin-bottom -translate-x-1/2 rounded-full bg-red-500"
          style={{ transform: `translateX(-50%) rotate(${secs * 6}deg)` }}
        />
        <div className="z-10 h-2.5 w-2.5 rounded-full bg-amber-700" />
      </div>
      <div className="ml-4 flex-1">
        <p className="font-mono-tabular text-lg font-bold text-white">{formatted}</p>
        <p className="mt-0.5 font-mono-tabular text-xs font-semibold text-red-400">
          Alarm Pin Locked: 07:00
        </p>
        <p className="mt-1 text-xs text-slate-300">
          Main hands keep real-time hostel hours, while the brass alarm pin stays jammed on{' '}
          <strong className="text-amber-300">7</strong>.
        </p>
      </div>
    </div>
  );
};

interface InspectionModalProps {
  objectId: RoomObjectId;
  state: GameState;
  onClose: () => void;
  onOpenPhone: () => void;
  onSubmitPuzzle1: (code: string) => { ok: boolean; message: string };
  onUnlockBookshelfWithKey: () => { ok: boolean; message: string };
  onChangeBookOrder: (order: BookId[]) => void;
  onSubmitPuzzle2: (order: BookId[]) => { ok: boolean; message: string };
  onToggleUvTorch: () => void;
  onSweepUvDirection: (dir: DirectionStep) => void;
  onUvAimChange: (coords: { x: number; y: number } | null) => void;
  onSubmitPuzzle3: (sequence: DirectionStep[]) => { ok: boolean; message: string };
  onTriggerSubClue: (
    key: 'backpackUnzipped' | 'wardrobeOpened' | 'bedPillowLifted' | 'deskPhoneChecked'
  ) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  objectId,
  state,
  onClose,
  onOpenPhone,
  onSubmitPuzzle1,
  onUnlockBookshelfWithKey,
  onChangeBookOrder,
  onSubmitPuzzle2,
  onToggleUvTorch,
  onSweepUvDirection,
  onUvAimChange,
  onSubmitPuzzle3,
  onTriggerSubClue,
}) => {
  const meta = ROOM_OBJECTS[objectId];

  // Study table interactive tab state
  const [deskTab, setDeskTab] = useState<'letter' | 'phone' | 'calculator' | 'notebook'>('letter');
  const [letterFlipped, setLetterFlipped] = useState(false);

  // Tactile Backpack / Bed sub-states
  const [zipSliderVal, setZipSliderVal] = useState(0);
  const [admitCardFlipped, setAdmitCardFlipped] = useState(false);

  // Puzzle 1 local keypad & tumbler wheel input
  const [drawerCode, setDrawerCode] = useState('');
  const [drawerFeedback, setDrawerFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Puzzle 2 local book arrangement & close-up inspection
  const [inspectedBookId, setInspectedBookId] = useState<BookId | null>(null);
  const [keyTurning, setKeyTurning] = useState(false);
  const [selectedBookSwap, setSelectedBookSwap] = useState<number | null>(null);
  const [draggedBookIdx, setDraggedBookIdx] = useState<number | null>(null);
  const [booksFeedback, setBooksFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Puzzle 3 local directional lock input
  const [dirSequence, setDirSequence] = useState<DirectionStep[]>([]);
  const [doorFeedback, setDoorFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const bookOrder = state.persistentBookOrder;
  const hasBrassKey = state.inventory.includes('brass_key');
  const hasUvTorch = state.inventory.includes('uv_torch');

  const handleKeypadDigit = (digit: string) => {
    soundEngine.playKeypadBeep();
    setDrawerFeedback(null);
    setDrawerCode((prev) => (prev.length < 3 ? prev + digit : prev));
  };

  const handleTumblerStep = (slotIdx: number, delta: 1 | -1) => {
    soundEngine.playDialClick();
    setDrawerFeedback(null);
    const padded = (drawerCode + '000').slice(0, 3).split('').map(Number);
    padded[slotIdx] = (padded[slotIdx] + delta + 10) % 10;
    setDrawerCode(padded.join(''));
  };

  const handleSubmitP1 = () => {
    const res = onSubmitPuzzle1(drawerCode);
    setDrawerFeedback({ ok: res.ok, text: res.message });
    if (!res.ok) {
      setDrawerCode('');
    }
  };

  const handleTurnBrassKey = () => {
    if (!hasBrassKey || keyTurning) return;
    setKeyTurning(true);
    soundEngine.playKeyTurn();
    window.setTimeout(() => {
      const res = onUnlockBookshelfWithKey();
      setBooksFeedback({ ok: res.ok, text: res.message });
      setKeyTurning(false);
    }, 520);
  };

  const applyBookOrder = (next: BookId[]) => {
    soundEngine.playBookSlide();
    setBooksFeedback(null);
    onChangeBookOrder(next);
  };

  const moveBook = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= bookOrder.length) return;
    const next = [...bookOrder];
    [next[index], next[target]] = [next[target], next[index]];
    applyBookOrder(next);
    setSelectedBookSwap(null);
  };

  const handleBookClickSwap = (index: number) => {
    if (selectedBookSwap === null) {
      soundEngine.playInspect();
      setSelectedBookSwap(index);
    } else if (selectedBookSwap === index) {
      setSelectedBookSwap(null);
    } else {
      const next = [...bookOrder];
      [next[selectedBookSwap], next[index]] = [next[index], next[selectedBookSwap]];
      applyBookOrder(next);
      setSelectedBookSwap(null);
    }
  };

  const handleBookDrop = (targetIdx: number) => {
    if (draggedBookIdx === null || draggedBookIdx === targetIdx) {
      setDraggedBookIdx(null);
      return;
    }
    const next = [...bookOrder];
    const [moved] = next.splice(draggedBookIdx, 1);
    next.splice(targetIdx, 0, moved);
    applyBookOrder(next);
    setDraggedBookIdx(null);
    setSelectedBookSwap(null);
  };

  const handleSubmitP2 = () => {
    const res = onSubmitPuzzle2(bookOrder);
    setBooksFeedback({ ok: res.ok, text: res.message });
  };

  const handleAddDirection = (dir: DirectionStep) => {
    soundEngine.playDialClick();
    setDoorFeedback(null);
    setDirSequence((prev) => (prev.length < 4 ? [...prev, dir] : prev));
  };

  const handleSubmitP3 = () => {
    const res = onSubmitPuzzle3(dirSequence);
    setDoorFeedback({ ok: res.ok, text: res.message });
  };

  const booksById: Record<BookId, BookItem> = {
    A: BOOKS_DATA[0],
    B: BOOKS_DATA[1],
    C: BOOKS_DATA[2],
    D: BOOKS_DATA[3],
  };

  const resultingBookCode = bookOrder.map((id) => booksById[id].digit).join('');

  const lastDir = dirSequence[dirSequence.length - 1];
  const dialAngle =
    lastDir === 'UP'
      ? 0
      : lastDir === 'RIGHT'
        ? 90
        : lastDir === 'DOWN'
          ? 180
          : lastDir === 'LEFT'
            ? 270
            : 0;

  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-24 z-30 mx-auto w-auto max-w-md rounded-xl border border-white/15 bg-[#0b0f18]/96 p-5 text-slate-100 shadow-2xl sm:inset-x-auto sm:right-5 sm:top-20 sm:bottom-auto sm:w-[420px] sm:max-h-[calc(100vh-195px)] overflow-y-auto custom-scroll">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-xs font-medium text-amber-400">{meta.subtitle}</p>
          <h2 className="font-display text-xl font-bold text-white">{meta.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspection panel"
          className="rounded-lg border border-white/10 bg-[#141a28] p-1.5 text-slate-300 transition-colors hover:border-white/30 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{meta.description}</p>

      {/* Discovered Clue Callout */}
      {meta.clueTitle && meta.clueText && (
        <div className="mt-3 rounded-lg border border-amber-500/25 bg-[#121724] p-3">
          <p className="text-xs font-semibold text-amber-300">{meta.clueTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">{meta.clueText}</p>
        </div>
      )}

      {/* STUDY TABLE: Interactive Desk Items (Letter, Phone, Calculator, Notebook) */}
      {objectId === 'study_table' && (
        <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3">
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#070a11] p-1">
            {[
              { id: 'letter' as const, label: 'Letter', icon: FileText },
              { id: 'phone' as const, label: 'Phone', icon: Smartphone },
              { id: 'calculator' as const, label: 'Calc', icon: Calculator },
              { id: 'notebook' as const, label: 'Notes', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = deskTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playInspect();
                    if (tab.id === 'phone') onTriggerSubClue('deskPhoneChecked');
                    setDeskTab(tab.id);
                  }}
                  className={`flex items-center justify-center gap-1 rounded py-1.5 text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-[#141a28]'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {deskTab === 'letter' && (
            <div className="rounded-lg border border-amber-200/20 bg-[#151821] p-3.5">
              <div className="flex items-center justify-between">
                <p className="font-mono-tabular text-[11px] font-semibold text-amber-300">
                  {letterFlipped ? 'LETTER · BACK CREASE' : 'LETTER BESIDE DESK LAMP'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPaperUnfold();
                    setLetterFlipped((f) => !f);
                  }}
                  className="inline-flex items-center gap-1 rounded border border-white/15 bg-[#0c101a] px-2 py-0.5 text-[10px] font-semibold text-slate-200 hover:border-amber-400/50"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Flip</span>
                </button>
              </div>
              {!letterFlipped ? (
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200">
                  {INTRO_LETTER_TEXT}
                </pre>
              ) : (
                <p className="mt-2 font-mono-tabular text-xs leading-relaxed text-slate-300">
                  Wax-stamped initials on reverse: <strong className="text-amber-300">O.W. · 307</strong>.
                  Faint ink blotched near bottom corner.
                </p>
              )}
            </div>
          )}

          {deskTab === 'phone' && (
            <div className="rounded-lg border border-sky-400/25 bg-[#0e1524] p-3.5 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="font-mono-tabular text-[10px] font-bold text-sky-400">
                  HOSTEL BLOCK C SMARTPHONE · 11:47 PM
                </p>
                {state.phoneState.unreadMessageIds.length > 0 && (
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-sky-300">
                    {state.phoneState.unreadMessageIds.length} UNREAD
                  </span>
                )}
              </div>
              <div className="rounded border border-white/10 bg-[#080c15] p-2.5 text-slate-200">
                <p className="font-semibold text-white">Arjun (Floor Rep · 304):</p>
                <p className="mt-1">
                  &ldquo;Guys, Warden started round early from ground wing. Corridor sweep reaches
                  Room 307 before midnight!&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPhoneChime();
                  onOpenPhone();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-2 font-bold text-slate-950 transition-colors hover:bg-sky-400"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Unlock & Open Hostel Phone</span>
              </button>
            </div>
          )}

          {deskTab === 'calculator' && (
            <div className="rounded-lg border border-white/10 bg-[#121724] p-3.5 text-xs">
              <p className="font-mono-tabular text-[10px] text-slate-400">
                CASIO FX-991EX · LAST SCREEN
              </p>
              <div className="mt-2 rounded border border-emerald-500/20 bg-[#18241d] px-3 py-2 font-mono-tabular text-right text-emerald-300">
                [ TEACH + GUIDE + TIME ]
              </div>
              <p className="mt-2 text-slate-300">
                Your roommate left a sticky reminder on the cover: &ldquo;Three distinct counts form
                the drawer PIN.&rdquo;
              </p>
            </div>
          )}

          {deskTab === 'notebook' && (
            <div className="rounded-lg border border-white/10 bg-[#121724] p-3.5 text-xs">
              <p className="font-semibold text-amber-300">Roommate&apos;s Lab Notebook</p>
              <p className="mt-1.5 leading-relaxed text-slate-300">
                Filled with CS-401 circuit diagrams and midnight coffee stains. Margin note:{' '}
                <span className="italic text-slate-200">
                  &ldquo;Don&apos;t disturb me—just finish the security check before the Warden
                  gets here.&rdquo;
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {objectId === 'wall_clock' && <LiveWallClockPreview />}

      {objectId === 'calendar' && (
        <div className="mt-4 rounded-lg border border-white/10 bg-[#121724] p-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-red-400">NOVEMBER · EXAM WEEK</span>
            <span className="font-mono-tabular text-slate-400">BLOCK C</span>
          </div>
          <div className="mt-2.5 grid grid-cols-7 gap-1 text-center font-mono-tabular text-[10px]">
            {[7, 8, 9, 10, 11, 12, 13].map((day) => (
              <div
                key={day}
                className={`rounded py-1 ${
                  day === 13
                    ? 'border border-red-500 bg-red-950/60 font-bold text-red-300'
                    : 'bg-[#0c101a] text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-slate-200">
            Date <span className="font-mono-tabular font-bold text-red-400">13</span> is circled in
            thick red ink: <span className="italic">&ldquo;Warden arrives at midnight.&rdquo;</span>
          </p>
          <p className="mt-1.5 text-slate-400">
            Pencil note in margin: &ldquo;Library books always archived oldest to newest.&rdquo;
          </p>
        </div>
      )}

      {/* BACKPACK: Tactile Slide-to-Unzip Pocket */}
      {objectId === 'backpack' && (
        <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3 text-xs">
          {!state.revealedSubClues.backpackUnzipped ? (
            <div className="space-y-2.5 rounded-lg border border-white/10 bg-[#111623] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-[11px] font-semibold text-sky-300">
                  SLIDE ZIPPER RIGHT TO OPEN
                </span>
                <span className="font-mono-tabular text-[11px] text-slate-400">
                  {zipSliderVal}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={zipSliderVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setZipSliderVal(v);
                  if (v >= 92) {
                    soundEngine.playDrawerUnlock();
                    onTriggerSubClue('backpackUnzipped');
                  }
                }}
                aria-label="Slide to unzip backpack pocket"
                className="w-full accent-sky-500"
              />
              <button
                type="button"
                onClick={() => {
                  soundEngine.playInspect();
                  onTriggerSubClue('backpackUnzipped');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2 font-bold text-white transition-colors hover:bg-sky-500"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Unzip Front Canvas Pocket</span>
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-sky-500/30 bg-[#121724] p-3.5 space-y-2">
              <p className="font-semibold text-sky-300">Pocket Unzipped · Persisted Open:</p>
              <div className="rounded border border-white/10 bg-[#0c101a] p-2.5">
                <p className="font-mono-tabular text-[11px] text-slate-400">STUDENT HOSTEL PASS</p>
                <p className="mt-0.5 font-semibold text-white">Room 307 · Hostel Block C</p>
                <p className="mt-1 text-slate-300">
                  Sticky note: &ldquo;Keep the desk drawer locked. The brass key opens the bookshelf
                  archive latch.&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WARDROBE: Persistent Open Door Interaction */}
      {objectId === 'wardrobe' && (
        <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3 text-xs">
          {!state.revealedSubClues.wardrobeOpened ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playDrawerUnlock();
                onTriggerSubClue('wardrobeOpened');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/35 bg-[#151c2c] py-2.5 font-semibold text-amber-200 hover:border-amber-400"
            >
              <span>Pull Open Steel Almirah Door</span>
            </button>
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#121724] p-3.5 space-y-2">
              <p className="font-semibold text-amber-300">Steel Almirah Door Open:</p>
              <p className="text-slate-300 leading-relaxed">
                Ironed lab coats, a cricket bat, and a laminated hostel curfew notice signed by the
                Chief Warden: &ldquo;Residents caught outside after midnight without clearance face
                disciplinary action.&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* BED: Lift Pillow & Flip Crumpled Admit Card */}
      {objectId === 'bed' && (
        <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3 text-xs">
          {!state.revealedSubClues.bedPillowLifted ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playPaperUnfold();
                onTriggerSubClue('bedPillowLifted');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/35 bg-[#151c2c] py-2.5 font-semibold text-amber-200 hover:border-amber-400"
            >
              <span>Lift Pillow &amp; Inspect Headboard</span>
            </button>
          ) : (
            <div className="rounded-lg border border-amber-500/25 bg-[#121724] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-amber-300">Pillow Lifted · Beneath Cot:</p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPaperUnfold();
                    setAdmitCardFlipped((f) => !f);
                  }}
                  className="inline-flex items-center gap-1 rounded border border-white/15 bg-[#0b0f18] px-2 py-0.5 text-[10px] font-semibold text-slate-200 hover:border-amber-400/50"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>{admitCardFlipped ? 'Card Front' : 'Flip Admit Card'}</span>
                </button>
              </div>
              {!admitCardFlipped ? (
                <p className="text-slate-300 leading-relaxed">
                  Chalk lettering scratched along the iron headboard:{' '}
                  <span className="text-amber-200">
                    &ldquo;Count carefully. Sort by year. Follow the unseen light.&rdquo;
                  </span>
                </p>
              ) : (
                <div className="rounded border border-white/10 bg-[#0a0e17] p-2.5 font-mono-tabular text-[11px] text-slate-300">
                  <p className="text-amber-300">MID-TERM EXAM ADMIT SLIP</p>
                  <p className="mt-1">Room 307 · Block C · Seat 19</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PUZZLE 1: DESK DRAWER KEYPAD + TACTILE ROTATING TUMBLER WHEELS */}
      {objectId === 'desk_drawer' && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Stage 1 · 3-Digit Combination Lock
            </span>
            {state.puzzlesCompleted[1] ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <Unlock className="h-3.5 w-3.5" /> Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Lock className="h-3.5 w-3.5" /> Locked
              </span>
            )}
          </div>

          {state.puzzlesCompleted[1] ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200">
              <p className="font-semibold">PUZZLE 1 COMPLETED · Code 427 Accepted</p>
              <p className="mt-1 text-emerald-300/90">
                Drawer remains open. You collected the <strong>Brass Key</strong> and{' '}
                <strong>Mysterious Paper</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Digital readout */}
              <div className="flex items-center justify-between rounded-lg border border-white/15 bg-[#07090f] px-4 py-2.5">
                <span className="text-xs text-slate-400">ENTER CODE</span>
                <span className="font-mono-tabular text-xl font-bold tracking-[0.35em] text-amber-300">
                  {drawerCode.padEnd(3, '_')}
                </span>
              </div>

              {/* Tactile 3-Digit Rotating Tumbler Wheels */}
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-[#0d121d] p-2">
                {[0, 1, 2].map((slot) => {
                  const char = drawerCode[slot] ?? '0';
                  return (
                    <div key={slot} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTumblerStep(slot, 1)}
                        aria-label={`Rotate dial ${slot + 1} up`}
                        className="w-full rounded border border-white/10 bg-[#151c2c] py-0.5 text-slate-300 hover:border-amber-400/50 hover:text-amber-200"
                      >
                        <ChevronUp className="mx-auto h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono-tabular text-sm font-bold text-amber-300">
                        {char}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTumblerStep(slot, -1)}
                        aria-label={`Rotate dial ${slot + 1} down`}
                        className="w-full rounded border border-white/10 bg-[#151c2c] py-0.5 text-slate-300 hover:border-amber-400/50 hover:text-amber-200"
                      >
                        <ChevronDown className="mx-auto h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Numeric keypad grid */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleKeypadDigit(d)}
                    className="rounded-lg border border-white/10 bg-[#151b2b] py-2 font-mono-tabular text-sm font-semibold text-white transition-colors hover:border-amber-400/50 hover:bg-[#1d253a]"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playInspect();
                    setDrawerCode('');
                    setDrawerFeedback(null);
                  }}
                  className="rounded-lg border border-white/10 bg-[#151b2b] py-2 text-xs font-medium text-slate-300 hover:bg-[#1d253a]"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadDigit('0')}
                  className="rounded-lg border border-white/10 bg-[#151b2b] py-2 font-mono-tabular text-sm font-semibold text-white hover:border-amber-400/50 hover:bg-[#1d253a]"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleSubmitP1}
                  disabled={drawerCode.length !== 3}
                  className="rounded-lg bg-amber-500 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Unlock
                </button>
              </div>

              {drawerFeedback && (
                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                    drawerFeedback.ok
                      ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                      : 'border-red-500/40 bg-red-950/40 text-red-200'
                  }`}
                >
                  {drawerFeedback.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{drawerFeedback.text}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PUZZLE 2: BOOKSHELF SECRET + DRAGGABLE PERSISTENT BOOKSHELF */}
      {objectId === 'bookshelf' && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Stage 2 · Bookshelf Secret Compartment
            </span>
            {state.puzzlesCompleted[2] ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <Unlock className="h-3.5 w-3.5" /> Solved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Lock className="h-3.5 w-3.5" /> Locked
              </span>
            )}
          </div>

          {/* Clickable 4 Books Close-Up Inspection */}
          <div className="rounded-lg border border-white/10 bg-[#121724] p-3">
            <p className="text-xs text-slate-300">
              Standing neatly on the eye-level shelf are{' '}
              <strong className="font-mono-tabular text-amber-300">4 books</strong> (click a book to
              inspect spine):
            </p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {bookOrder.map((id) => {
                const b = booksById[id];
                const focused = inspectedBookId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playBookSlide();
                      setInspectedBookId(focused ? null : b.id);
                    }}
                    className={`rounded border px-1.5 py-2 text-center transition-transform ${
                      focused ? 'scale-105 border-amber-300 ring-1 ring-amber-400' : 'border-white/15'
                    }`}
                    style={{ backgroundColor: b.color }}
                  >
                    <p className="font-mono-tabular text-xs font-bold text-white">Book {b.id}</p>
                    <p className="font-mono-tabular text-[10px] text-white/85">{b.year}</p>
                  </button>
                );
              })}
            </div>

            {inspectedBookId && (
              <div className="mt-2.5 rounded border border-amber-400/30 bg-[#0b0f18] p-2.5 text-xs">
                <p className="font-semibold text-amber-300">
                  Book {inspectedBookId} · {booksById[inspectedBookId].title}
                </p>
                <p className="mt-0.5 font-mono-tabular text-[11px] text-slate-300">
                  {booksById[inspectedBookId].subject} · Printed {booksById[inspectedBookId].year} ·
                  Spine Digit: {booksById[inspectedBookId].digit}
                </p>
              </div>
            )}
          </div>

          {!state.puzzlesCompleted[1] ? (
            <div className="rounded-lg border border-slate-700 bg-[#0e131e] p-3 text-xs text-slate-300">
              The hidden compartment has a small brass keyhole. Solve{' '}
              <strong className="text-amber-300">Puzzle 1 (Desk Drawer)</strong> first to find the
              key.
            </div>
          ) : !state.bookshelfUnlockedWithKey ? (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-300">
                {state.armedItem === 'brass_key'
                  ? 'Brass Key is armed and ready. Turn it inside the compartment keyhole.'
                  : 'You have the Brass Key from the study drawer. Insert and turn it to open the compartment.'}
              </p>
              <button
                type="button"
                disabled={!hasBrassKey || keyTurning}
                onClick={handleTurnBrassKey}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
              >
                <KeyRound
                  className={`h-4 w-4 transition-transform duration-500 ${
                    keyTurning ? 'rotate-90 scale-110' : ''
                  }`}
                />
                <span>
                  {keyTurning ? 'Turning Brass Key...' : 'Insert & Turn Brass Key'}
                </span>
              </button>
            </div>
          ) : state.puzzlesCompleted[2] ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200">
              <p className="font-semibold">
                PUZZLE 2 COMPLETED · Order 2015 → 2018 → 2020 → 2022 (Code{' '}
                {PUZZLE_2_BOOK_ORDER.map((id) => booksById[id].digit).join('')})
              </p>
              <p className="mt-1 text-emerald-300/90">
                The books stay sorted on your shelf. You acquired the <strong>UV Flashlight</strong>!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-500/25 bg-[#121724] p-2.5 text-xs text-amber-200">
                &ldquo;Knowledge has an order. Arrange the books from{' '}
                <strong>oldest to newest</strong>.&rdquo;
                <span className="mt-1 block text-[11px] text-slate-400">
                  Drag &amp; drop books, click two to swap, or use arrows (updates 3D shelf live).
                </span>
              </div>

              <div className="space-y-1.5">
                {bookOrder.map((bookId, idx) => {
                  const book = booksById[bookId];
                  const isSelected = selectedBookSwap === idx;
                  const isBeingDragged = draggedBookIdx === idx;
                  return (
                    <div
                      key={book.id}
                      draggable
                      onDragStart={() => setDraggedBookIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleBookDrop(idx)}
                      onDragEnd={() => setDraggedBookIdx(null)}
                      onClick={() => handleBookClickSwap(idx)}
                      className={`flex cursor-grab items-center justify-between rounded-lg border px-3 py-2 transition-colors active:cursor-grabbing ${
                        isBeingDragged
                          ? 'border-sky-400 bg-sky-950/40 opacity-75'
                          : isSelected
                            ? 'border-amber-400 bg-amber-500/15'
                            : 'border-white/10 bg-[#131928] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GripVertical className="h-3.5 w-3.5 text-slate-500" />
                        <span
                          className="inline-block h-6 w-2 rounded-sm"
                          style={{ backgroundColor: book.color }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Book {book.id} · {book.title}
                          </p>
                          <p className="font-mono-tabular text-[11px] text-slate-400">
                            Year {book.year} · Spine Digit {book.digit}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => moveBook(idx, -1)}
                          disabled={idx === 0}
                          aria-label={`Move Book ${book.id} up`}
                          className="rounded border border-white/10 bg-[#0d111c] p-1 text-slate-300 hover:text-white disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBook(idx, 1)}
                          disabled={idx === bookOrder.length - 1}
                          aria-label={`Move Book ${book.id} down`}
                          className="rounded border border-white/10 bg-[#0d111c] p-1 text-slate-300 hover:text-white disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#070a11] px-3 py-2">
                <span className="text-xs text-slate-400">Resulting Sequence Code:</span>
                <span className="font-mono-tabular text-sm font-bold tracking-widest text-amber-300">
                  {resultingBookCode}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSubmitP2}
                className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
              >
                Verify Chronological Order
              </button>
            </div>
          )}

          {booksFeedback && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                booksFeedback.ok
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                  : 'border-red-500/40 bg-red-950/40 text-red-200'
              }`}
            >
              {booksFeedback.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{booksFeedback.text}</span>
            </div>
          )}
        </div>
      )}

      {/* WALL POSTER: INTERACTIVE MOUSE/TOUCH UV FLASHLIGHT SWEEP */}
      {objectId === 'wall_poster' && (
        <UvPosterInspector
          hasUvTorch={hasUvTorch}
          uvTorchActive={state.uvTorchActive}
          uvSweptDirections={state.uvSweptDirections}
          onToggleUvTorch={onToggleUvTorch}
          onSweepDirection={onSweepUvDirection}
          onAimChange={onUvAimChange}
        />
      )}

      {/* PUZZLE 3: EXIT DOOR DIRECTIONAL LOCK + TACTILE DEADBOLT DIAL */}
      {objectId === 'exit_door' && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Stage 3 · Final Directional Deadbolt
            </span>
            {state.puzzlesCompleted[3] ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" /> Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Lock className="h-3.5 w-3.5" /> Sealed
              </span>
            )}
          </div>

          {!state.puzzlesCompleted[2] ? (
            <div className="rounded-lg border border-slate-700 bg-[#0e131e] p-3 text-xs text-slate-300">
              The final directional deadbolt is mechanically disengaged until{' '}
              <strong className="text-amber-300">Puzzle 1</strong> and{' '}
              <strong className="text-amber-300">Puzzle 2</strong> are completed.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Rotating Deadbolt Dial Feedback */}
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0d121d] p-2.5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-purple-400/50 bg-[#07090f]">
                  <div
                    className="h-5 w-1 origin-bottom rounded-full bg-purple-400 transition-transform duration-200"
                    style={{
                      transform: `translateY(-40%) rotate(${dialAngle}deg)`,
                    }}
                  />
                  <div className="absolute h-2.5 w-2.5 rounded-full bg-slate-200" />
                </div>
                <div className="flex-1 grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((slot) => {
                    const val = dirSequence[slot];
                    return (
                      <div
                        key={slot}
                        className="flex h-10 items-center justify-center rounded-lg border border-white/15 bg-[#07090f] font-mono-tabular text-[11px] font-bold text-purple-300"
                      >
                        {val ?? `${slot + 1}`}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Directional pad */}
              <div className="grid grid-cols-3 gap-2">
                <div />
                <button
                  type="button"
                  onClick={() => handleAddDirection('UP')}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-[#161c2c] py-2.5 text-xs font-semibold text-white hover:border-purple-400 hover:bg-[#1f273d]"
                >
                  <ArrowUp className="h-4 w-4" /> UP
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handleAddDirection('LEFT')}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-[#161c2c] py-2.5 text-xs font-semibold text-white hover:border-purple-400 hover:bg-[#1f273d]"
                >
                  <ArrowLeft className="h-4 w-4" /> LEFT
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDirection('DOWN')}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-[#161c2c] py-2.5 text-xs font-semibold text-white hover:border-purple-400 hover:bg-[#1f273d]"
                >
                  <ArrowDown className="h-4 w-4" /> DOWN
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDirection('RIGHT')}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-[#161c2c] py-2.5 text-xs font-semibold text-white hover:border-purple-400 hover:bg-[#1f273d]"
                >
                  <ArrowRight className="h-4 w-4" /> RIGHT
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playInspect();
                    setDirSequence([]);
                    setDoorFeedback(null);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#141a28] px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
                <button
                  type="button"
                  onClick={handleSubmitP3}
                  disabled={dirSequence.length !== 4}
                  className="flex-1 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Unlock Exit Door
                </button>
              </div>

              {doorFeedback && (
                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                    doorFeedback.ok
                      ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                      : 'border-red-500/40 bg-red-950/40 text-red-200'
                  }`}
                >
                  {doorFeedback.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{doorFeedback.text}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
