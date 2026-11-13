import React from 'react';
import { motion } from 'motion/react';
import { Crown, X } from 'lucide-react';
import { formatTime } from '../components/GameHud';
import { CAMPAIGNS, CAMPAIGN_ORDER } from '../game-engine/CampaignRegistry';
import { PlatformData } from '../types/platform';

interface MasterEndingModalProps {
  platform: PlatformData;
  onClose: () => void;
}

export const MasterEndingModal: React.FC<MasterEndingModalProps> = ({ platform, onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Master Ending Epilogue"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 px-4 py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-amber-400/45 bg-[#090d16] p-6 text-slate-100 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/45 bg-amber-500/15 text-amber-300">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono-tabular text-xs font-bold tracking-[0.22em] text-amber-400">
                ESCAPE FILES · MASTER EPILOGUE UNLOCKED
              </p>
              <h2 className="font-display text-2xl font-bold text-white">
                THE HOSTEL CHRONICLES RESOLVED
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close epilogue"
            className="rounded-lg border border-white/15 bg-[#151c2d] p-1.5 text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-200">
          <p>
            From the locked door of <strong className="text-amber-300">Room 307</strong>, down the
            concrete stairs into <strong className="text-sky-300">Radio Station 88.4</strong>, and
            finally beneath the stone vault of{' '}
            <strong className="text-emerald-300">Sub-Archive Vault B</strong>, every piece of the
            1994 midnight blackout clicks into place.
          </p>
          <p>
            The Warden&apos;s sweeps were never meant to trap residents in malice—the nine locks
            across Block C were a three-tier deadman safeguard built by the 1994 student security
            circle and Warden Sharma himself so only someone observant, logical, and calm under
            pressure could unseal Vault B&apos;s truth ledger.
          </p>
          <p className="font-mono-tabular text-xs text-amber-200">
            Case Closed by {platform.profile.nickname} · All 9 Locks Verified Across 3 Locations.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {CAMPAIGN_ORDER.map((id) => {
            const st = platform.stats[id];
            return (
              <div
                key={id}
                className="rounded-lg border border-white/10 bg-[#111827] p-3 font-mono-tabular text-xs"
              >
                <p className="text-[10px] font-bold text-amber-400">{CAMPAIGNS[id].numberLabel}</p>
                <p className="mt-0.5 font-sans text-xs font-bold text-white">
                  {CAMPAIGNS[id].title}
                </p>
                <p className="mt-2 text-slate-300">
                  Best: {st.bestTimeSeconds ? formatTime(st.bestTimeSeconds) : '--:--'} · Rank{' '}
                  {st.bestRank ?? '-'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            Return to Chronicles Hub
          </button>
        </div>
      </motion.div>
    </div>
  );
};
