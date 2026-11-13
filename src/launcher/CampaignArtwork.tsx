import React from 'react';
import { AvatarId, CampaignId } from '../types/platform';

export const CampaignCardArtwork: React.FC<{ campaignId: CampaignId }> = ({ campaignId }) => {
  if (campaignId === 'easy') {
    return (
      <svg viewBox="0 0 400 180" className="h-40 w-full bg-[#070b15]" aria-hidden="true">
        <defs>
          <radialGradient id="easyLamp" cx="30%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#070b15" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonGlow" cx="80%" cy="28%" r="42%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#070b15" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="180" fill="#080d19" />
        <rect width="400" height="180" fill="url(#easyLamp)" />
        <rect width="400" height="180" fill="url(#moonGlow)" />
        {/* Window Grid */}
        <rect x="278" y="22" width="84" height="92" fill="#0d1e38" stroke="#475569" strokeWidth="3" />
        <line x1="320" y1="22" x2="320" y2="114" stroke="#334155" strokeWidth="2.5" />
        <line x1="278" y1="68" x2="362" y2="68" stroke="#334155" strokeWidth="2.5" />
        <circle cx="338" cy="44" r="10" fill="#bae6fd" opacity="0.8" />
        {/* Study Desk Lamp & Books */}
        <polygon points="86,62 134,62 162,148 58,148" fill="#fbbf24" opacity="0.16" />
        <path d="M98 62 L124 62 L116 48 L104 48 Z" fill="#f59e0b" />
        <rect x="44" y="138" width="160" height="10" fill="#5b3b24" />
        <rect x="172" y="102" width="14" height="36" fill="#9f3a2f" />
        <rect x="188" y="106" width="14" height="32" fill="#2d5a7b" />
        <rect x="204" y="104" width="14" height="34" fill="#3f6a4e" />
        {/* Wall Clock */}
        <circle cx="212" cy="48" r="18" fill="#e7e2d4" stroke="#926d27" strokeWidth="3" />
        <line x1="212" y1="48" x2="212" y2="37" stroke="#1e293b" strokeWidth="2" />
        <line x1="212" y1="48" x2="220" y2="54" stroke="#991b1b" strokeWidth="2" />
        {/* Door Keyhole Silhouette */}
        <circle cx="110" cy="108" r="9" fill="#fbbf24" opacity="0.9" />
        <rect x="107" y="114" width="6" height="16" fill="#fbbf24" opacity="0.9" />
      </svg>
    );
  }

  if (campaignId === 'medium') {
    return (
      <svg viewBox="0 0 400 180" className="h-40 w-full bg-[#050912]" aria-hidden="true">
        <defs>
          <radialGradient id="beaconRed" cx="85%" cy="25%" r="45%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#050912" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="crtGlow" cx="35%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#050912" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="180" fill="#060c18" />
        <rect width="400" height="180" fill="url(#beaconRed)" />
        <rect width="400" height="180" fill="url(#crtGlow)" />
        {/* Overhead Concrete Pipes */}
        <rect x="0" y="16" width="400" height="7" fill="#1e293b" />
        <rect x="0" y="28" width="400" height="5" fill="#334155" />
        {/* CRT Oscilloscope */}
        <rect x="52" y="54" width="128" height="86" rx="4" fill="#111b2a" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="2" />
        <rect x="64" y="66" width="104" height="56" fill="#041f14" />
        <path
          d="M68 94 L82 94 L86 76 L94 112 L102 76 L110 112 L116 94 L132 94 L136 80 L144 108 L152 94 L164 94"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
        />
        {/* Frequency Scale */}
        <rect x="200" y="88" width="142" height="44" rx="3" fill="#0d1726" stroke="#475569" strokeWidth="2" />
        <line x1="214" y1="110" x2="328" y2="110" stroke="#38bdf8" strokeWidth="2" />
        <rect x="242" y="98" width="4" height="24" fill="#f97316" />
        {/* Emergency Red Light */}
        <circle cx="348" cy="46" r="11" fill="#ef4444" />
        <circle cx="348" cy="46" r="18" stroke="#ef4444" strokeOpacity="0.45" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 400 180" className="h-40 w-full bg-[#090705]" aria-hidden="true">
      <defs>
        <radialGradient id="archiveAmber" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#090705" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="180" fill="#0c0907" />
      <rect width="400" height="180" fill="url(#archiveAmber)" />
      {/* Oak Archive Shelving */}
      <rect x="22" y="24" width="76" height="136" fill="#2a1b12" stroke="#443020" strokeWidth="2" />
      <rect x="30" y="42" width="12" height="32" fill="#7f1d1d" />
      <rect x="44" y="46" width="12" height="28" fill="#1e3a8a" />
      <rect x="58" y="40" width="12" height="34" fill="#14532d" />
      <rect x="72" y="44" width="12" height="30" fill="#78350f" />
      {/* Concentric Vault & Cipher Rings */}
      <circle cx="212" cy="92" r="56" fill="#16120e" stroke="#c49a45" strokeWidth="4" />
      <circle cx="212" cy="92" r="39" fill="none" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="2.5" strokeDasharray="8 6" />
      <circle cx="212" cy="92" r="18" fill="#2b2114" stroke="#c49a45" strokeWidth="3" />
      <line x1="212" y1="36" x2="212" y2="148" stroke="#c49a45" strokeOpacity="0.35" strokeWidth="3" />
      <line x1="156" y1="92" x2="268" y2="92" stroke="#c49a45" strokeOpacity="0.35" strokeWidth="3" />
      {/* Witness Files */}
      <rect x="306" y="76" width="66" height="44" fill="#78350f" stroke="#d97706" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="314" y="84" width="46" height="6" fill="#fef3c7" opacity="0.7" />
      <rect x="314" y="96" width="34" height="6" fill="#fef3c7" opacity="0.5" />
    </svg>
  );
};

export const PlayerAvatarIcon: React.FC<{ avatarId: AvatarId; size?: number }> = ({
  avatarId,
  size = 36,
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="8" fill="#121826" stroke="#fbbf24" strokeOpacity="0.4" strokeWidth="1.5" />
      {avatarId === 'owasp' && (
        <>
          <polygon points="20,6 30,12 30,24 20,30 10,24 10,12" fill="#3b82f6" fillOpacity="0.35" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="20" cy="18" r="5" fill="#fbbf24" />
        </>
      )}
      {avatarId === 'radio' && (
        <>
          <rect x="9" y="14" width="22" height="16" rx="2" fill="#0ea5e9" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="14" x2="24" y2="7" stroke="#bae6fd" strokeWidth="1.5" />
          <circle cx="16" cy="22" r="3" fill="#34d399" />
          <line x1="22" y1="20" x2="28" y2="20" stroke="#e0f2fe" strokeWidth="1.5" />
          <line x1="22" y1="24" x2="28" y2="24" stroke="#e0f2fe" strokeWidth="1.5" />
        </>
      )}
      {avatarId === 'key' && (
        <>
          <circle cx="15" cy="17" r="6" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <line x1="20" y1="17" x2="32" y2="17" stroke="#fbbf24" strokeWidth="2.5" />
          <line x1="27" y1="17" x2="27" y2="23" stroke="#fbbf24" strokeWidth="2.5" />
          <line x1="31" y1="17" x2="31" y2="22" stroke="#fbbf24" strokeWidth="2.5" />
        </>
      )}
      {avatarId === 'cipher' && (
        <>
          <circle cx="20" cy="20" r="11" fill="none" stroke="#10b981" strokeWidth="2" />
          <circle cx="20" cy="20" r="5" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <line x1="20" y1="7" x2="20" y2="13" stroke="#e2e8f0" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
};
