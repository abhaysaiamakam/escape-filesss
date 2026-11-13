import React from 'react';
import { SubtitleCue } from '../../types/platform';

interface SubtitleToastProps {
  cue: SubtitleCue | null;
  enabled: boolean;
}

export const SubtitleToast: React.FC<SubtitleToastProps> = ({ cue, enabled }) => {
  if (!enabled || !cue) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4"
    >
      <div className="max-w-xl rounded-lg border border-white/20 bg-black/90 px-4 py-2 text-center shadow-2xl">
        <span className="font-mono-tabular text-[10px] font-bold tracking-widest text-amber-300">
          [{cue.speaker}]
        </span>{' '}
        <span className="text-xs font-medium text-slate-100 sm:text-sm">{cue.text}</span>
      </div>
    </div>
  );
};
