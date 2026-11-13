import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Headphones,
  Lock,
  Play,
  Radio,
  RotateCcw,
  Square,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { RadioObjectId } from '../../three/radioStationBuilder';
import { soundEngine } from '../../audio/soundEngine';
import {
  ITU_MORSE_DIGIT_CHART,
  MEDIUM_INVENTORY_ITEMS,
  MEDIUM_MORSE_TOKENS,
  MEDIUM_OBJECTS,
  MEDIUM_TARGET_FREQUENCY,
  MediumInventoryId,
} from './mediumData';

interface MediumInspectionModalProps {
  objectId: RadioObjectId;
  puzzlesCompleted: { 1: boolean; 2: boolean; 3: boolean };
  circuitConnections: Record<string, string>;
  onConnectCircuitWire: (source: string, target: string) => void;
  onResetCircuitWires: () => void;
  onSubmitCircuitPuzzle: () => { ok: boolean; message: string };
  onSubmitMorsePuzzle: (decoded: string) => { ok: boolean; message: string };
  tunedFrequency: number;
  onChangeFrequency: (freq: number) => void;
  onSubmitFrequencyPuzzle: () => { ok: boolean; message: string };
  onCollectCabinetLeads: () => void;
  inventory: MediumInventoryId[];
  onClose: () => void;
  onJumpToObject: (id: RadioObjectId) => void;
}

const SOURCES = ['PWR-A', 'COIL-B2', 'GND-G4'];
const SOCKETS = ['AMP-D3', 'SHIELD-E2', 'RELAY-C1']; // Scrambled layout on purpose!

export const MediumInspectionModal: React.FC<MediumInspectionModalProps> = ({
  objectId,
  puzzlesCompleted,
  circuitConnections,
  onConnectCircuitWire,
  onResetCircuitWires,
  onSubmitCircuitPuzzle,
  onSubmitMorsePuzzle,
  tunedFrequency,
  onChangeFrequency,
  onSubmitFrequencyPuzzle,
  onCollectCabinetLeads,
  inventory,
  onClose,
  onJumpToObject,
}) => {
  const meta = MEDIUM_OBJECTS[objectId];
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [morseInput, setMorseInput] = useState('');
  const [slowMorse, setSlowMorse] = useState(true);
  const [playingMorse, setPlayingMorse] = useState(false);
  const [activeTokenIdx, setActiveTokenIdx] = useState(-1);
  const [pulseLamp, setPulseLamp] = useState(false);
  const dialDraggingRef = useRef(false);

  useEffect(() => {
    setFeedback(null);
    setSelectedSource(null);
    return () => {
      soundEngine.stopMorsePlayback();
    };
  }, [objectId]);

  // Signal proximity 0..1 for Frequency Dial
  const signalStrength = Math.max(
    0.05,
    1 - Math.min(1, Math.abs(tunedFrequency - MEDIUM_TARGET_FREQUENCY) / 2.2)
  );

  const startMorsePlayback = () => {
    if (!puzzlesCompleted[1]) return;
    setPlayingMorse(true);
    soundEngine.playMorseSequence(
      MEDIUM_MORSE_TOKENS,
      slowMorse,
      (idx, on) => {
        setActiveTokenIdx(idx);
        setPulseLamp(on);
      },
      () => {
        setPlayingMorse(false);
        setActiveTokenIdx(-1);
        setPulseLamp(false);
      }
    );
  };

  const stopMorsePlayback = () => {
    soundEngine.stopMorsePlayback();
    setPlayingMorse(false);
    setActiveTokenIdx(-1);
    setPulseLamp(false);
  };

  const handleDialPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dialDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const norm = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nextFreq = Math.round((87.5 + norm * 20.5) * 10) / 10;
    if (nextFreq !== tunedFrequency) {
      soundEngine.playRadioDialStep(
        Math.max(0.05, 1 - Math.min(1, Math.abs(nextFreq - MEDIUM_TARGET_FREQUENCY) / 2.2))
      );
      onChangeFrequency(nextFreq);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.name}
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/75 px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-sky-400/25 bg-[#090f19] text-slate-100 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#0d1626] px-5 py-4">
          <div>
            <p className="font-mono-tabular text-[11px] font-bold tracking-[0.2em] text-sky-400">
              {meta.subtitle.toUpperCase()}
            </p>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{meta.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspection"
            className="rounded-lg border border-white/15 bg-[#152035] p-1.5 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="custom-scroll flex-1 space-y-4 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-slate-300">{meta.description}</p>

          <div className="rounded-lg border border-sky-400/25 bg-[#0e192b] p-3.5 text-xs">
            <p className="font-mono-tabular font-bold text-sky-300">{meta.clueTitle}</p>
            <p className="mt-1 leading-relaxed text-slate-200">{meta.clueText}</p>
          </div>

          {/* Filing Cabinet: Collect Copper Leads */}
          {objectId === 'filing_cabinet' && (
            <div className="rounded-xl border border-white/15 bg-[#101826] p-4 space-y-3">
              <p className="text-xs text-slate-300">
                Inside drawer #2 sits a plastic pouch containing heavy-gauge{' '}
                <strong className="text-sky-200">
                  {MEDIUM_INVENTORY_ITEMS.copper_jumper.name}
                </strong>
                .
              </p>
              <button
                type="button"
                disabled={inventory.includes('copper_jumper')}
                onClick={onCollectCabinetLeads}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 disabled:bg-emerald-950/60 disabled:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {inventory.includes('copper_jumper')
                    ? 'Copper Relay Leads Acquired'
                    : 'Take Copper Relay Leads'}
                </span>
              </button>
            </div>
          )}

          {/* LOCK 1: THE DEAD CIRCUIT */}
          {objectId === 'circuit_board' && (
            <div className="rounded-xl border border-sky-400/30 bg-[#0b1322] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-sky-400" />
                  <span className="font-display text-sm font-bold text-white">
                    Relay Junction Board (Lock 1)
                  </span>
                </div>
                {puzzlesCompleted[1] && (
                  <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                    ENERGIZED · VERIFIED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300">
                Click a left terminal, then click its target socket on the right (or drag between
                rows). Match the 1998 Wiring Diagram.
              </p>

              {/* Interactive Visual Wiring Matrix */}
              <div className="grid grid-cols-3 items-center gap-3 rounded-lg border border-white/10 bg-[#070d18] p-3">
                <div className="space-y-2.5">
                  {SOURCES.map((src) => {
                    const active = selectedSource === src;
                    const mapped = Boolean(circuitConnections[src]);
                    return (
                      <button
                        key={src}
                        type="button"
                        disabled={puzzlesCompleted[1]}
                        onClick={() => {
                          soundEngine.playDialClick();
                          setSelectedSource(active ? null : src);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 font-mono-tabular text-xs font-bold transition-colors ${
                          active
                            ? 'border-amber-400 bg-amber-500 text-slate-950'
                            : mapped
                              ? 'border-sky-400/60 bg-sky-950/50 text-sky-200'
                              : 'border-white/20 bg-[#121c2e] text-slate-200 hover:border-sky-400'
                        }`}
                      >
                        <span>{src}</span>
                        <span className="h-2.5 w-2.5 rounded-full bg-current" />
                      </button>
                    );
                  })}
                </div>

                {/* SVG Wire Visualizer */}
                <svg viewBox="0 0 120 120" className="h-28 w-full">
                  {SOURCES.map((src, sIdx) => {
                    const target = circuitConnections[src];
                    if (!target) return null;
                    const tIdx = SOCKETS.indexOf(target);
                    if (tIdx === -1) return null;
                    const y1 = 20 + sIdx * 40;
                    const y2 = 20 + tIdx * 40;
                    return (
                      <path
                        key={src}
                        d={`M 4 ${y1} C 50 ${y1}, 70 ${y2}, 116 ${y2}`}
                        fill="none"
                        stroke={puzzlesCompleted[1] ? '#34d399' : '#38bdf8'}
                        strokeWidth={4}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>

                <div className="space-y-2.5">
                  {SOCKETS.map((dst) => {
                    const linkedBy = SOURCES.find((s) => circuitConnections[s] === dst);
                    return (
                      <button
                        key={dst}
                        type="button"
                        disabled={puzzlesCompleted[1] || !selectedSource}
                        onClick={() => {
                          if (!selectedSource) return;
                          soundEngine.playCircuitSnap();
                          onConnectCircuitWire(selectedSource, dst);
                          setSelectedSource(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 font-mono-tabular text-xs font-bold transition-colors ${
                          linkedBy
                            ? 'border-emerald-400/50 bg-emerald-950/40 text-emerald-200'
                            : selectedSource
                              ? 'border-amber-400/70 bg-[#162135] text-amber-200 hover:bg-amber-500/20'
                              : 'border-white/15 bg-[#121c2e] text-slate-300'
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-current" />
                        <span>{dst}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!puzzlesCompleted[1] && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPinRemove();
                      onResetCircuitWires();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#131d30] px-3 py-2 text-xs text-slate-200 hover:border-white/35"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Clear Leads</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = onSubmitCircuitPuzzle();
                      setFeedback({ ok: res.ok, text: res.message });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Energize Transmitter</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LOCK 2: THE SILENT SIGNAL (MORSE DECODER) */}
          {objectId === 'oscilloscope' && (
            <div className="rounded-xl border border-emerald-400/30 bg-[#081512] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="font-display text-sm font-bold text-white">
                    CRT Morse Broadcast (Lock 2)
                  </span>
                </div>
                {puzzlesCompleted[2] && (
                  <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                    SIGNAL DECODED
                  </span>
                )}
              </div>

              {!puzzlesCompleted[1] ? (
                <div className="flex flex-col items-start gap-2 rounded-lg border border-red-400/35 bg-red-950/35 p-3 text-xs text-red-200">
                  <div className="flex items-center gap-2 font-bold">
                    <Lock className="h-4 w-4" />
                    <span>CRT SCREEN UNPOWERED</span>
                  </div>
                  <p>Restore power at the Circuit Board (Lock 1) before capturing the Morse feed.</p>
                  <button
                    type="button"
                    onClick={() => onJumpToObject('circuit_board')}
                    className="rounded bg-amber-500 px-3 py-1 font-bold text-slate-950"
                  >
                    Go to Circuit Board
                  </button>
                </div>
              ) : (
                <>
                  {/* Oscilloscope Visual Pulse Monitor */}
                  <div className="rounded-lg border border-emerald-500/35 bg-[#03120c] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded-full border transition-all ${
                            pulseLamp
                              ? 'border-emerald-200 bg-emerald-400 shadow-[0_0_16px_#34d399]'
                              : 'border-emerald-900 bg-emerald-950'
                          }`}
                        />
                        <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                          CARRIER PULSE {pulseLamp ? 'HIGH' : 'IDLE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSlowMorse((v) => !v)}
                          className="rounded border border-emerald-400/30 bg-[#082218] px-2.5 py-1 font-mono-tabular text-[11px] font-semibold text-emerald-200"
                        >
                          {slowMorse ? 'Pace: Slow (Clear)' : 'Pace: Normal'}
                        </button>
                        {playingMorse ? (
                          <button
                            type="button"
                            onClick={stopMorsePlayback}
                            className="inline-flex items-center gap-1 rounded bg-red-500 px-3 py-1 text-xs font-bold text-white"
                          >
                            <Square className="h-3 w-3" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startMorsePlayback}
                            className="inline-flex items-center gap-1 rounded bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                          >
                            <Play className="h-3 w-3" />
                            <span>Play Broadcast</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Visual 4-Token Morse Pattern */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {MEDIUM_MORSE_TOKENS.map((tok, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border py-2.5 text-center font-mono-tabular transition-colors ${
                            activeTokenIdx === i
                              ? 'border-emerald-300 bg-emerald-500/25 text-white'
                              : 'border-emerald-500/20 bg-[#061c13] text-emerald-300'
                          }`}
                        >
                          <p className="text-[10px] text-emerald-400/75">TOKEN {i + 1}</p>
                          <p className="mt-1 text-base font-bold tracking-widest">{tok}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pure ITU Numeric Morse Reference Chart (never highlights solution!) */}
                  <div className="rounded-lg border border-white/10 bg-[#0d1724] p-3">
                    <div className="mb-2 flex items-center gap-1.5 font-mono-tabular text-[11px] font-bold text-slate-300">
                      <Volume2 className="h-3.5 w-3.5 text-sky-400" />
                      <span>LAMINATED ITU MORSE DECODER REFERENCE</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 font-mono-tabular text-[11px] sm:grid-cols-4">
                      {ITU_MORSE_DIGIT_CHART.map((entry) => (
                        <div
                          key={entry.char}
                          className="flex items-center justify-between rounded border border-white/10 bg-[#121e30] px-2 py-1"
                        >
                          <span className="font-bold text-white">{entry.char}</span>
                          <span className="text-sky-300">{entry.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!puzzlesCompleted[2] && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={morseInput}
                        onChange={(e) => setMorseInput(e.target.value)}
                        placeholder="Enter decoded frequency (e.g. XX.X)"
                        aria-label="Decoded frequency"
                        className="flex-1 rounded-lg border border-white/20 bg-[#0d1522] px-3 py-2 font-mono-tabular text-sm font-bold text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = onSubmitMorsePuzzle(morseInput);
                          setFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                      >
                        Verify Signal
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* LOCK 3: THE FINAL FREQUENCY */}
          {(objectId === 'frequency_dial' || objectId === 'transmission_door') && (
            <div className="rounded-xl border border-sky-400/30 bg-[#0a1322] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-sky-400" />
                  <span className="font-display text-sm font-bold text-white">
                    Analog Carrier Tuner (Lock 3)
                  </span>
                </div>
                <span className="font-mono-tabular text-base font-bold text-amber-300">
                  {tunedFrequency.toFixed(1)} MHz
                </span>
              </div>

              {!puzzlesCompleted[1] || !puzzlesCompleted[2] ? (
                <div className="rounded-lg border border-red-400/35 bg-red-950/35 p-3 text-xs text-red-200 space-y-2">
                  <p className="font-bold">CARRIER SOLENOID INTERLOCKED</p>
                  <p>
                    Power up the Circuit Board (Lock 1) and decode the Oscilloscope Morse feed
                    (Lock 2) first.
                  </p>
                </div>
              ) : (
                <>
                  {/* Draggable Frequency Scale */}
                  <div
                    onPointerDown={(e) => {
                      dialDraggingRef.current = true;
                      handleDialPointerMove(e);
                    }}
                    onPointerMove={handleDialPointerMove}
                    onPointerUp={() => {
                      dialDraggingRef.current = false;
                    }}
                    onPointerLeave={() => {
                      dialDraggingRef.current = false;
                    }}
                    className="relative cursor-ew-resize select-none rounded-lg border border-sky-400/40 bg-[#040914] p-4"
                  >
                    <div className="flex justify-between font-mono-tabular text-[11px] text-slate-400">
                      <span>87.5</span>
                      <span>92.0</span>
                      <span>97.0</span>
                      <span>102.0</span>
                      <span>108.0 MHz</span>
                    </div>
                    <div className="relative mt-2 h-8 rounded bg-[#0c172a]">
                      <div
                        className="absolute top-0 h-full w-1 bg-orange-500 shadow-[0_0_12px_#f97316]"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((tunedFrequency - 87.5) / 20.5) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 font-mono-tabular text-[11px] text-sky-300">
                      Drag scale bar or step controls below · Signal Strength:{' '}
                      <strong>{Math.round(signalStrength * 100)}%</strong>
                    </p>
                  </div>

                  {/* Signal Clarity Meter */}
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full transition-all duration-150 ${
                          signalStrength > 0.94 ? 'bg-emerald-400' : 'bg-sky-400'
                        }`}
                        style={{ width: `${Math.round(signalStrength * 100)}%` }}
                      />
                    </div>
                    <p className="font-mono-tabular text-[11px] text-slate-300">
                      {signalStrength > 0.94
                        ? 'CRYSTAL CLEAR VOICE CARRIER DETECTED!'
                        : signalStrength > 0.7
                          ? 'Static fading... strong carrier nearby.'
                          : 'Heavy static interference.'}
                    </p>
                  </div>

                  {!puzzlesCompleted[3] && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {[-1.0, -0.1, 0.1, 1.0].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => {
                              const next = Math.max(
                                87.5,
                                Math.min(108.0, Math.round((tunedFrequency + delta) * 10) / 10)
                              );
                              soundEngine.playRadioDialStep(
                                Math.max(
                                  0.05,
                                  1 -
                                    Math.min(
                                      1,
                                      Math.abs(next - MEDIUM_TARGET_FREQUENCY) / 2.2
                                    )
                                )
                              );
                              onChangeFrequency(next);
                            }}
                            className="rounded border border-white/15 bg-[#142034] px-2.5 py-1.5 font-mono-tabular text-xs font-bold text-slate-100 hover:border-sky-400"
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const res = onSubmitFrequencyPuzzle();
                          setFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                      >
                        <Headphones className="h-4 w-4" />
                        <span>Lock Carrier & Open Door</span>
                      </button>
                    </div>
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
