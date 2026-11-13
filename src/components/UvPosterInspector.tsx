import React, { useRef, useState } from 'react';
import { Flashlight, Compass } from 'lucide-react';
import { DirectionStep } from '../types/game';

interface UvPosterInspectorProps {
  hasUvTorch: boolean;
  uvTorchActive: boolean;
  uvSweptDirections: DirectionStep[];
  onToggleUvTorch: () => void;
  onSweepDirection: (dir: DirectionStep) => void;
  onAimChange?: (coords: { x: number; y: number } | null) => void;
}

const UV_MARKERS: Array<{
  dir: DirectionStep;
  symbol: string;
  label: string;
  xPct: number;
  yPct: number;
}> = [
  { dir: 'UP', symbol: '↑', label: '1. UP', xPct: 24, yPct: 26 },
  { dir: 'RIGHT', symbol: '→', label: '2. RIGHT', xPct: 76, yPct: 36 },
  { dir: 'DOWN', symbol: '↓', label: '3. DOWN', xPct: 70, yPct: 76 },
  { dir: 'LEFT', symbol: '←', label: '4. LEFT', xPct: 28, yPct: 74 },
];

export const UvPosterInspector: React.FC<UvPosterInspectorProps> = ({
  hasUvTorch,
  uvTorchActive,
  uvSweptDirections,
  onToggleUvTorch,
  onSweepDirection,
  onAimChange,
}) => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [beamPos, setBeamPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [beamHovering, setBeamHovering] = useState(false);

  const updateBeam = (clientX: number, clientY: number) => {
    const el = surfaceRef.current;
    if (!el || !uvTorchActive) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setBeamPos({ x: xPct, y: yPct });
    setBeamHovering(true);
    onAimChange?.({ x: xPct / 100, y: yPct / 100 });

    // Detect if circular UV beam intersects any hidden marker
    UV_MARKERS.forEach((m) => {
      const dist = Math.hypot(xPct - m.xPct, yPct - m.yPct);
      if (dist <= 19 && !uvSweptDirections.includes(m.dir)) {
        onSweepDirection(m.dir);
      }
    });
  };

  const handleNudgeSpot = (m: (typeof UV_MARKERS)[number]) => {
    if (!uvTorchActive) return;
    setBeamPos({ x: m.xPct, y: m.yPct });
    setBeamHovering(true);
    onAimChange?.({ x: m.xPct / 100, y: m.yPct / 100 });
    if (!uvSweptDirections.includes(m.dir)) {
      onSweepDirection(m.dir);
    }
  };

  const allFound = uvSweptDirections.length === 4;
  const maskStyle = uvTorchActive
    ? {
        WebkitMaskImage: `radial-gradient(circle 66px at ${beamPos.x}% ${beamPos.y}%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)`,
        maskImage: `radial-gradient(circle 66px at ${beamPos.x}% ${beamPos.y}%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)`,
      }
    : undefined;

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
      {/* Interactive Poster Surface */}
      <div
        ref={surfaceRef}
        onPointerDown={(e) => {
          if (!uvTorchActive) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateBeam(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => updateBeam(e.clientX, e.clientY)}
        onPointerLeave={() => {
          setBeamHovering(false);
          onAimChange?.(null);
        }}
        className={`relative h-72 w-full select-none overflow-hidden rounded-lg border touch-none ${
          uvTorchActive
            ? 'cursor-crosshair border-purple-400/70 bg-[#0b0e1c]'
            : 'border-white/15 bg-[#0c162d]'
        }`}
      >
        {/* Base Daylight Layer (Always visible) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-5 text-center">
          <p className="font-mono-tabular text-[10px] tracking-[0.22em] text-amber-200/80">
            ASTRONOMY SOCIETY · NIT BLOCK C
          </p>

          <div className="relative flex w-full flex-1 items-center justify-center">
            {/* Subtle astrolabe rings */}
            <div className="h-36 w-36 rounded-full border border-slate-500/20" />
            <div className="absolute h-24 w-24 rounded-full border border-slate-500/15" />

            <div className="absolute flex items-center gap-12">
              <span className="text-3xl text-amber-400 drop-shadow" aria-label="Star 1">
                ★
              </span>
              <span className="text-3xl text-amber-400 drop-shadow" aria-label="Star 2">
                ★
              </span>
            </div>
          </div>

          <p className="font-display text-xs font-bold tracking-wide text-slate-100">
            THE STARS GUIDE THOSE WHO STAY AWAKE
          </p>
        </div>

        {/* Interactive 365nm UV Illumination Overlay (Strictly Masked by Mouse / Touch Beam) */}
        {uvTorchActive && (
          <>
            {/* Ambient Violet Beam Halo */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-150"
              style={{
                background: `radial-gradient(circle 72px at ${beamPos.x}% ${beamPos.y}%, rgba(168, 85, 247, 0.34), rgba(88, 28, 135, 0.14) 55%, rgba(6, 8, 16, 0.45) 100%)`,
                opacity: beamHovering ? 1 : 0.85,
              }}
            />

            {/* Hidden UV Ink Layer revealed strictly beneath circular UV beam */}
            <div className="pointer-events-none absolute inset-0" style={maskStyle}>
              <div className="absolute inset-3 rounded border border-purple-400/50" />
              {UV_MARKERS.map((m) => (
                <div
                  key={m.dir}
                  style={{ left: `${m.xPct}%`, top: `${m.yPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                >
                  <div className="uv-glow-text flex h-12 w-12 items-center justify-center rounded-full border border-purple-300/70 bg-purple-950/60 font-mono-tabular text-2xl font-extrabold">
                    {m.symbol}
                  </div>
                  <p className="uv-glow-text mt-1 font-mono-tabular text-[10px] font-bold tracking-wider">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Corner instruction badge when UV active */}
        {uvTorchActive && (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-purple-200/90">
            <span className="font-mono-tabular">
              Move mouse or drag finger across poster
            </span>
            <span className="font-mono-tabular font-bold">
              {uvSweptDirections.length}/4 revealed
            </span>
          </div>
        )}
      </div>

      {/* UV Discovery Status Strip */}
      {uvTorchActive ? (
        <div className="rounded-lg border border-purple-400/35 bg-[#120d22] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-200">
              {allFound
                ? 'All 4 UV markings uncovered!'
                : 'Sweep corners & margins with UV beam'}
            </span>
            <span className="font-mono-tabular text-[11px] text-purple-300">
              {uvSweptDirections.length}/4
            </span>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {UV_MARKERS.map((m) => {
              const revealed = uvSweptDirections.includes(m.dir);
              return (
                <button
                  key={m.dir}
                  type="button"
                  onClick={() => handleNudgeSpot(m)}
                  title="Focus UV beam on this quadrant"
                  className={`rounded border py-1.5 font-mono-tabular text-[11px] font-bold transition-colors ${
                    revealed
                      ? 'border-purple-400/60 bg-purple-600/35 text-purple-100'
                      : 'border-white/10 bg-[#0b0e18] text-slate-500 hover:border-purple-400/40'
                  }`}
                >
                  {revealed ? `${m.symbol} ${m.dir}` : '???'}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-[11px] italic text-slate-400">
          Faint glossy streaks shimmer along the poster borders—invisible under ordinary room light.
        </p>
      )}

      {hasUvTorch ? (
        <button
          type="button"
          onClick={onToggleUvTorch}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-colors ${
            uvTorchActive
              ? 'border border-purple-400/60 bg-purple-600 text-white hover:bg-purple-500'
              : 'bg-purple-700 text-white hover:bg-purple-600'
          }`}
        >
          <Flashlight className="h-4 w-4" />
          <span>{uvTorchActive ? 'Turn Off UV Flashlight' : 'Turn On & Sweep UV Flashlight'}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#121724] px-3 py-2 text-xs text-slate-300">
          <Compass className="h-4 w-4 shrink-0 text-slate-400" />
          <span>You need an ultraviolet light source to examine these invisible streaks.</span>
        </div>
      )}
    </div>
  );
};
