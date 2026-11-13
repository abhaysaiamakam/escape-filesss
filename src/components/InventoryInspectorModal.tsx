import React, { useRef, useState } from 'react';
import {
  X,
  KeyRound,
  FileText,
  Flashlight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  MoveHorizontal,
} from 'lucide-react';
import { INVENTORY_ITEMS } from '../data/gameContent';
import { InventoryItemId, RoomObjectId } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface InventoryInspectorModalProps {
  itemId: InventoryItemId;
  armedItem: InventoryItemId | null;
  uvTorchActive: boolean;
  bookshelfUnlocked: boolean;
  onClose: () => void;
  onArmItem: (id: InventoryItemId | null) => void;
  onToggleUvTorch: () => void;
  onJumpToObject: (objectId: RoomObjectId) => void;
}

export const InventoryInspectorModal: React.FC<InventoryInspectorModalProps> = ({
  itemId,
  armedItem,
  uvTorchActive,
  bookshelfUnlocked,
  onClose,
  onArmItem,
  onToggleUvTorch,
  onJumpToObject,
}) => {
  const item = INVENTORY_ITEMS[itemId];
  const [paperZoomed, setPaperZoomed] = useState(false);
  const [paperFlipped, setPaperFlipped] = useState(false);

  // Tactile drag-rotation state for inventory items
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);
  const dragRef = useRef<{ active: boolean; x: number; y: number; moved: number }>({
    active: false,
    x: 0,
    y: 0,
    moved: 0,
  });

  const isArmed = armedItem === itemId;

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, x: e.clientX, y: e.clientY, moved: 0 };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    dragRef.current.moved += Math.hypot(dx, dy);
    setRotY((r) => r + dx * 0.85);
    setRotX((r) => Math.max(-28, Math.min(28, r - dy * 0.55)));
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="pointer-events-auto fixed bottom-24 left-4 z-30 w-84 max-w-[calc(100vw-2rem)] rounded-xl border border-amber-400/35 bg-[#0c111c]/96 p-4 text-slate-100 shadow-2xl">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <p className="font-mono-tabular text-[11px] font-semibold text-amber-400">
            TACTILE ITEM INSPECTION
          </p>
          <h3 className="font-display text-base font-bold text-white">{item.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close item detail"
          className="rounded p-1 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tactile Visual Preview Stage */}
      {itemId === 'brass_key' && (
        <div
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={handleStagePointerUp}
          className="mt-3 flex cursor-grab select-none flex-col items-center rounded-lg border border-white/10 bg-[#121826] p-4 touch-none active:cursor-grabbing"
          style={{ perspective: '600px' }}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 transition-shadow ${
              isArmed ? 'ring-2 ring-emerald-400/70' : ''
            }`}
            style={{
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) ${
                isArmed ? 'rotateZ(45deg) scale(1.06)' : ''
              }`,
            }}
          >
            <KeyRound className="h-8 w-8" />
          </div>
          <p className="mt-2 font-mono-tabular text-[11px] tracking-widest text-amber-300">
            ENGRAVED: 307-ARCHIVE
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
            <MoveHorizontal className="h-3 w-3" /> Drag to rotate key 360°
          </p>
        </div>
      )}

      {itemId === 'mysterious_paper' && (
        <div className="mt-3 space-y-2">
          <div
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={(e) => {
              const moved = dragRef.current.moved;
              handleStagePointerUp(e);
              if (moved <= 6) {
                soundEngine.playPaperUnfold();
                setPaperFlipped((f) => !f);
              }
            }}
            onPointerCancel={handleStagePointerUp}
            className={`cursor-pointer select-none rounded-lg border border-amber-200/30 bg-[#f2ead4] p-3.5 text-slate-900 shadow-inner transition-transform duration-200 touch-none ${
              paperZoomed ? 'scale-[1.03]' : ''
            }`}
            style={{
              transform: `perspective(700px) rotateX(${rotX * 0.45}deg) rotateY(${rotY * 0.45}deg)`,
            }}
          >
            {!paperFlipped ? (
              <>
                <p className="font-mono-tabular text-[10px] font-bold text-amber-900/75">
                  TORN NOTE · FRONT (Click to Flip)
                </p>
                <p
                  className={`mt-1.5 font-serif italic leading-relaxed text-slate-900 ${
                    paperZoomed ? 'text-sm font-semibold' : 'text-xs'
                  }`}
                >
                  &ldquo;Knowledge has an order. Arrange the four books from oldest to newest.
                  Their spine digits will speak.&rdquo;
                </p>
              </>
            ) : (
              <>
                <p className="font-mono-tabular text-[10px] font-bold text-amber-900/75">
                  TORN NOTE · REVERSE MARGIN (Click to Flip)
                </p>
                <p className="mt-1.5 font-mono-tabular text-xs font-semibold text-slate-800">
                  YEAR ORDER: [OLDEST] → → → [NEWEST]
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  (Four tall book outlines sketched in faded graphite)
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playPaperUnfold();
                setPaperZoomed((z) => !z);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded border border-white/15 bg-[#141a28] py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-400/50"
            >
              {paperZoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
              <span>{paperZoomed ? 'Reset Zoom' : 'Zoom In'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playPaperUnfold();
                setPaperFlipped((f) => !f);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded border border-white/15 bg-[#141a28] py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-400/50"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>{paperFlipped ? 'View Front' : 'Flip Paper'}</span>
            </button>
          </div>
        </div>
      )}

      {itemId === 'uv_torch' && (
        <div
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={handleStagePointerUp}
          className="mt-3 flex cursor-grab select-none flex-col items-center rounded-lg border border-purple-500/30 bg-[#120e20] p-4 touch-none active:cursor-grabbing"
          style={{ perspective: '600px' }}
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
              uvTorchActive
                ? 'border-purple-400 bg-purple-600/35 text-purple-200 shadow-lg'
                : 'border-white/15 bg-[#0a0d16] text-slate-400'
            }`}
            style={{
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            }}
          >
            <Flashlight className="h-7 w-7" />
          </div>
          <p className="mt-2 font-mono-tabular text-[11px] text-purple-300">
            365nm UV EMITTER · {uvTorchActive ? 'ACTIVE' : 'STANDBY'}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
            <MoveHorizontal className="h-3 w-3" /> Drag to rotate flashlight
          </p>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-300">{item.description}</p>
      <p className="mt-2 text-[11px] text-amber-300">{item.usableContext}</p>

      {/* Item Context Actions */}
      <div className="mt-3 space-y-2">
        {itemId === 'brass_key' && (
          <>
            <button
              type="button"
              disabled={bookshelfUnlocked}
              onClick={() => {
                soundEngine.playInspect();
                onArmItem(isArmed ? null : 'brass_key');
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                isArmed
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              {isArmed ? <Check className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
              <span>
                {bookshelfUnlocked
                  ? 'Compartment Already Unlocked'
                  : isArmed
                    ? 'Key Selected · Click Bookshelf'
                    : 'Select Key to Use'}
              </span>
            </button>
            {!bookshelfUnlocked && (
              <button
                type="button"
                onClick={() => {
                  onArmItem('brass_key');
                  onClose();
                  onJumpToObject('bookshelf');
                }}
                className="w-full rounded-lg border border-white/15 bg-[#141a28] py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-400/50"
              >
                Go to Bookshelf Latch
              </button>
            )}
          </>
        )}

        {itemId === 'mysterious_paper' && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onJumpToObject('bookshelf');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/35 bg-[#151b2b] py-2 text-xs font-semibold text-amber-200 hover:bg-[#1d253a]"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Inspect Bookshelf Volumes</span>
          </button>
        )}

        {itemId === 'uv_torch' && (
          <>
            <button
              type="button"
              onClick={onToggleUvTorch}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-500"
            >
              <Flashlight className="h-3.5 w-3.5" />
              <span>{uvTorchActive ? 'Turn Off UV Torch' : 'Activate UV Torch'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!uvTorchActive) onToggleUvTorch();
                onClose();
                onJumpToObject('wall_poster');
              }}
              className="w-full rounded-lg border border-purple-400/35 bg-[#141024] py-1.5 text-[11px] font-medium text-purple-200 hover:border-purple-400"
            >
              Aim Flashlight at Wall Poster
            </button>
          </>
        )}
      </div>
    </div>
  );
};
