import React, { useState } from 'react';
import { ShieldCheck, Trash2, Volume2, X } from 'lucide-react';
import { PlayerSettings } from '../types/platform';

interface SettingsModalProps {
  settings: PlayerSettings;
  onUpdateSettings: (patch: Partial<PlayerSettings>) => void;
  onResetAllProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetAllProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Platform Settings"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-white/15 bg-[#0b101b] p-5 text-slate-100 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-xl font-bold text-white">Platform Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg border border-white/15 bg-[#151e30] p-1.5 text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Audio */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-slate-200">
              <Volume2 className="h-4 w-4 text-amber-400" />
              Master Audio Volume ({Math.round(settings.masterVolume * 100)}%)
            </span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundMuted: !settings.soundMuted })}
              className={`rounded border px-2.5 py-1 font-semibold ${
                settings.soundMuted
                  ? 'border-red-500/50 bg-red-950/40 text-red-300'
                  : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
              }`}
            >
              {settings.soundMuted ? 'Muted' : 'Enabled'}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.masterVolume * 100)}
            onChange={(e) => onUpdateSettings({ masterVolume: Number(e.target.value) / 100 })}
            className="w-full accent-amber-500"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-300">Ambient Soundscapes</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ambientEnabled: !settings.ambientEnabled })}
              className="rounded border border-white/15 bg-[#141c2d] px-3 py-1 font-semibold"
            >
              {settings.ambientEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Accessibility & Graphics */}
        <div className="space-y-2.5 border-t border-white/10 pt-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Subtitles & Event Captions</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ subtitlesEnabled: !settings.subtitlesEnabled })}
              className="rounded border border-white/15 bg-[#141c2d] px-3 py-1 font-semibold"
            >
              {settings.subtitlesEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">High-Contrast Accessibility Mode</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
              className={`rounded border px-3 py-1 font-semibold ${
                settings.highContrast
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : 'border-white/15 bg-[#141c2d] text-slate-300'
              }`}
            >
              {settings.highContrast ? 'High Contrast' : 'Standard'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">3D Graphics Quality</span>
            <div className="flex rounded border border-white/15 bg-[#141c2d] p-0.5">
              {(['high', 'balanced'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`rounded px-2.5 py-1 font-semibold uppercase ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progression & Judge Demo Mode */}
        <div className="space-y-2.5 border-t border-white/10 pt-4 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                <span>Campaign Unlock Mode</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Judge Demo Mode unlocks all 3 campaigns immediately without skipping puzzles.
              </p>
            </div>
            <div className="flex shrink-0 rounded border border-white/15 bg-[#141c2d] p-0.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ unlockMode: 'normal' })}
                className={`rounded px-2.5 py-1 font-semibold ${
                  settings.unlockMode === 'normal'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ unlockMode: 'judge_demo' })}
                className={`rounded px-2.5 py-1 font-semibold ${
                  settings.unlockMode === 'judge_demo'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300'
                }`}
              >
                Judge Demo
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300">Fast Demo Countdown Timer (2:30 / 3:00 / 4:00)</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ demoTimerSpeed: !settings.demoTimerSpeed })}
              className={`rounded border px-3 py-1 font-semibold ${
                settings.demoTimerSpeed
                  ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                  : 'border-white/15 bg-[#141c2d] text-slate-300'
              }`}
            >
              {settings.demoTimerSpeed ? 'Fast Demo On' : 'Full Duration'}
            </button>
          </div>
        </div>

        {/* Reset Data */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded border border-red-500/40 bg-red-950/35 px-3 py-1.5 font-semibold text-red-300 hover:bg-red-950/60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset All Progress</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-red-300 font-semibold">Erase saves & stats?</span>
              <button
                type="button"
                onClick={() => {
                  onResetAllProgress();
                  setConfirmReset(false);
                }}
                className="rounded bg-red-500 px-3 py-1 font-bold text-white"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded border border-white/20 px-2.5 py-1 text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-4 py-1.5 font-bold text-slate-950"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
