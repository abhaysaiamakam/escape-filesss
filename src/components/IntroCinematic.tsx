import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, ArrowRight, SkipForward, Timer } from 'lucide-react';
import { INTRO_LETTER_TEXT } from '../data/gameContent';
import { soundEngine } from '../audio/soundEngine';
import { TimerMode } from '../types/game';

interface IntroCinematicProps {
  timerMode: TimerMode;
  onChangeTimerMode: (mode: TimerMode) => void;
  onEnterRoom: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onExitToLauncher?: () => void;
}

const NARRATION_STEPS = [
  { id: 0, type: 'title', duration: 2800 },
  { id: 1, text: "It's another late night at college.", duration: 2200 },
  {
    id: 2,
    text: 'You walk down Block C corridor in your OWASP tee, thinking the day is finally over.',
    duration: 2800,
  },
  { id: 3, text: 'You reach for the Room 307 door handle.', duration: 2100 },
  { id: 4, text: "It's locked.", duration: 2000 },
  { id: 5, text: 'Then you hear something behind you.', duration: 2000 },
  { id: 6, text: 'Footsteps.', duration: 2200 },
  { id: 7, type: 'letter', duration: 0 },
];

export const IntroCinematic: React.FC<IntroCinematicProps> = ({
  timerMode,
  onChangeTimerMode,
  onEnterRoom,
  muted,
  onToggleMute,
  onExitToLauncher,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const current = NARRATION_STEPS[stepIndex];
    if (!current || current.duration === 0) return;

    if (stepIndex === 6) {
      soundEngine.playFootsteps(4, false);
    }

    // Judge Demo Mode cuts cinematic pauses cleanly while preserving every story beat
    const pacedDuration =
      timerMode === 'demo' ? Math.max(950, Math.round(current.duration * 0.5)) : current.duration;

    const timer = window.setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, NARRATION_STEPS.length - 1));
    }, pacedDuration);

    return () => window.clearTimeout(timer);
  }, [stepIndex, timerMode]);

  const handleInteractionUnlock = () => {
    soundEngine.unlock();
    soundEngine.startAmbience();
  };

  const handleBegin = () => {
    handleInteractionUnlock();
    soundEngine.playInspect();
    onEnterRoom();
  };

  const currentStep = NARRATION_STEPS[stepIndex];
  const progress = (stepIndex / (NARRATION_STEPS.length - 1)) * 100;

  return (
    <div
      onClick={handleInteractionUnlock}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#04060b]/85 via-[#04060b]/30 to-[#04060b]/92 px-6 py-7 text-slate-100 select-none"
    >
      {/* Top Cinematic Letterbox Header */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onExitToLauncher && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExitToLauncher();
              }}
              className="rounded-lg border border-white/15 bg-[#0c101b]/95 px-3 py-1.5 font-mono-tabular text-xs font-semibold text-slate-200 hover:border-amber-400/50 hover:text-amber-200"
            >
              ← Launcher
            </button>
          )}
          <img
            src="/assets/aistudio/Screenshot_2026-11-13_at_4.36.56_PM_b98e5be5.png"
            alt="Chapter Crest"
            className="h-9 w-9 rounded-full border border-white/20 object-cover"
          />
          <div className="text-left">
            <p className="font-mono-tabular text-[11px] font-bold tracking-[0.22em] text-amber-400">
              CAMPAIGN 01 · ROOM 307
            </p>
            <p className="text-xs text-slate-400">The Lost Room Key · Easy · 8 Minutes</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Standard vs Judge Demo Mode Selector */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center rounded-lg border border-white/15 bg-[#0c101b]/95 p-0.5 text-xs"
          >
            <button
              type="button"
              onClick={() => onChangeTimerMode('standard')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium transition-colors whitespace-nowrap ${
                timerMode === 'standard'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Timer className="h-3 w-3" />
              <span>Standard 08:00</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTimerMode('demo')}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors whitespace-nowrap ${
                timerMode === 'demo'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Judge Demo 2:30
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleInteractionUnlock();
              onToggleMute();
            }}
            className="flex items-center gap-2 rounded-lg border border-white/15 bg-[#0c101b]/95 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-white/30 hover:bg-[#161d2f] whitespace-nowrap"
          >
            {muted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">{muted ? 'Muted' : 'Audio On'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBegin();
            }}
            className="flex items-center gap-2 rounded-lg border border-amber-400/35 bg-[#0c101b]/95 px-3.5 py-2 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-400 hover:bg-amber-500 hover:text-slate-950 whitespace-nowrap"
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span>Skip Intro</span>
          </button>
        </div>
      </div>

      {/* Center / Lower-Thirds Cinematic Story Stage (keeps 3D corridor visible!) */}
      <div className="relative z-10 my-auto flex w-full max-w-2xl flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {currentStep.type === 'title' && (
            <motion.div
              key="intro-title"
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.65 }}
              className="flex flex-col items-center space-y-4 rounded-2xl border border-white/15 bg-[#070a12]/90 px-8 py-8 shadow-2xl"
            >
              <img
                src="/assets/aistudio/Screenshot_2026-11-13_at_4.36.56_PM_b98e5be5.png"
                alt="Hostel Chapter Crest"
                className="h-20 w-20 rounded-full border border-white/25 object-cover shadow-lg"
              />
              <p className="font-mono-tabular text-base tracking-[0.32em] text-amber-400">
                11:47 PM
              </p>
              <div className="space-y-1">
                <p className="font-mono-tabular text-xs font-bold tracking-[0.26em] text-amber-300">
                  CAMPAIGN 01 · EASY
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  THE LOST ROOM KEY
                </h1>
                <p className="font-mono-tabular text-sm tracking-[0.22em] text-slate-300">
                  HOSTEL BLOCK C · ROOM 307
                </p>
              </div>
              <p className="pt-1 text-xs text-slate-400">
                Click anywhere to enable rain & corridor audio
              </p>
            </motion.div>
          )}

          {currentStep.text && (
            <motion.div
              key={`narration-${currentStep.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
              className="mt-44 rounded-xl border border-white/15 bg-[#070a12]/90 px-6 py-4 shadow-2xl"
            >
              <p
                className={`font-display text-xl font-medium leading-snug sm:text-2xl ${
                  currentStep.id === 4 || currentStep.id === 6
                    ? 'text-amber-300'
                    : 'text-slate-100'
                }`}
              >
                {currentStep.text}
              </p>
            </motion.div>
          )}

          {currentStep.type === 'letter' && (
            <motion.div
              key="intro-letter"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg rounded-xl border border-amber-200/25 bg-[#0b0f18]/95 p-6 text-left shadow-2xl sm:p-8"
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono-tabular text-xs font-semibold tracking-wider text-amber-400">
                  ROOM 307 · STUDY TABLE NOTE
                </span>
                <span className="font-mono-tabular text-xs text-slate-400">11:47 PM</span>
              </div>

              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200 sm:text-base">
                {INTRO_LETTER_TEXT}
              </pre>

              <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Arrows / WASD to walk · Click objects to inspect
                </p>
                <button
                  type="button"
                  onClick={handleBegin}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap"
                >
                  <span>Enter the Room</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Progress Bar */}
      <div className="flex w-full flex-col items-center gap-2 pb-1">
        <div className="h-1 w-64 overflow-hidden rounded-full bg-slate-800/90">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
