import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  MessageSquare,
  PhoneMissed,
  Image as ImageIcon,
  Voicemail,
  Play,
  Square,
  BatteryLow,
  Wifi,
  Signal,
  ChevronLeft,
  Volume2,
} from 'lucide-react';
import {
  PHONE_MESSAGES,
  PHONE_MISSED_CALLS,
  PHONE_PHOTOS,
  PHONE_VOICEMAILS,
} from '../data/gameContent';
import { PhonePhotoMeta, PhoneState } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface HostelPhoneModalProps {
  phoneState: PhoneState;
  onClose: () => void;
  onMarkMessageRead: (msgId: string) => void;
  onClearMissedCalls: () => void;
  onMarkPhotoViewed: (photoId: string) => void;
  onMarkVoicemailPlayed: (vmId: string) => void;
}

type PhoneTab = 'messages' | 'calls' | 'photos' | 'voice';

const ProceduralPhotoCanvas: React.FC<{
  variant: PhonePhotoMeta['sceneVariant'];
  large?: boolean;
}> = ({ variant, large }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (variant === 'corridor') {
      // Dark Block C corridor with fluorescent perspective & Room 307 plate
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#070b14');
      bg.addColorStop(0.55, '#121b2e');
      bg.addColorStop(1, '#0c111b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Perspective corridor walls
      ctx.fillStyle = '#192234';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.34, h * 0.25);
      ctx.lineTo(w * 0.34, h * 0.78);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w * 0.66, h * 0.25);
      ctx.lineTo(w * 0.66, h * 0.78);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Ceiling tube glow
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(w * 0.38, h * 0.08, w * 0.24, 6);
      ctx.fillRect(w * 0.43, h * 0.2, w * 0.14, 4);
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.14, 4, w * 0.5, h * 0.25, w * 0.45);
      glow.addColorStop(0, 'rgba(147, 197, 253, 0.28)');
      glow.addColorStop(1, 'rgba(147, 197, 253, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Distant Warden silhouette at end of hall
      ctx.fillStyle = '#05070c';
      ctx.fillRect(w * 0.47, h * 0.44, w * 0.06, h * 0.26);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.41, 7, 0, Math.PI * 2);
      ctx.fill();

      // Floor reflection
      ctx.fillStyle = 'rgba(147,197,253,0.12)';
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.78);
      ctx.lineTo(w * 0.66, h * 0.78);
      ctx.lineTo(w * 0.85, h);
      ctx.lineTo(w * 0.15, h);
      ctx.closePath();
      ctx.fill();
    } else if (variant === 'desk') {
      // Warm desk lamp + stacks of textbooks + stainless steel chai mug
      const bg = ctx.createRadialGradient(w * 0.32, h * 0.28, 12, w * 0.45, h * 0.5, w * 0.75);
      bg.addColorStop(0, '#4d2c12');
      bg.addColorStop(0.55, '#191418');
      bg.addColorStop(1, '#090b12');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Wooden tabletop
      ctx.fillStyle = '#4a2e1b';
      ctx.fillRect(0, h * 0.64, w, h * 0.36);

      // Brass lamp shade & cone
      ctx.fillStyle = '#1b4332';
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.22);
      ctx.lineTo(w * 0.38, h * 0.22);
      ctx.lineTo(w * 0.44, h * 0.36);
      ctx.lineTo(w * 0.16, h * 0.36);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.36);
      ctx.lineTo(w * 0.4, h * 0.36);
      ctx.lineTo(w * 0.58, h * 0.68);
      ctx.lineTo(w * 0.08, h * 0.68);
      ctx.closePath();
      ctx.fill();

      // Open textbook & steel mug
      ctx.fillStyle = '#e5dec9';
      ctx.fillRect(w * 0.28, h * 0.68, w * 0.36, h * 0.14);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(w * 0.72, h * 0.54, w * 0.12, h * 0.16);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(w * 0.72, h * 0.54, w * 0.12, 4);
    } else {
      // Rainy night outside canteen chai stall
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#071124');
      bg.addColorStop(0.6, '#132544');
      bg.addColorStop(1, '#090e1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Moon & clouds
      ctx.fillStyle = '#dbeafe';
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.22, 16, 0, Math.PI * 2);
      ctx.fill();

      // Warm tea stall awning
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(w * 0.08, h * 0.44, w * 0.52, h * 0.1);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(w * 0.12, h * 0.54, w * 0.44, h * 0.26);
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(w * 0.14, h * 0.56, w * 0.4, h * 0.16);

      // Rain streaks
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 36; i++) {
        const rx = ((i * 29) % w);
        const ry = ((i * 43) % h);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 14);
        ctx.stroke();
      }
    }

    // Timestamp watermark
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('CAM · BLOCK C', 10, h - 10);
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      width={large ? 340 : 220}
      height={large ? 220 : 130}
      className="h-full w-full rounded object-cover"
    />
  );
};

export const HostelPhoneModal: React.FC<HostelPhoneModalProps> = ({
  phoneState,
  onClose,
  onMarkMessageRead,
  onClearMissedCalls,
  onMarkPhotoViewed,
  onMarkVoicemailPlayed,
}) => {
  const [tab, setTab] = useState<PhoneTab>('messages');
  const [openMessageId, setOpenMessageId] = useState<string | null>(PHONE_MESSAGES[0]?.id ?? null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhonePhotoMeta | null>(null);
  const [playingVmId, setPlayingVmId] = useState<string | null>(null);
  const [transcriptOpenIds, setTranscriptOpenIds] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      soundEngine.stopVoicemailAudio();
    };
  }, []);

  const unreadCount = phoneState.unreadMessageIds.length;

  const handleSelectTab = (next: PhoneTab) => {
    soundEngine.playInspect();
    setTab(next);
    setSelectedPhoto(null);
    if (next === 'calls' && !phoneState.missedCallsCleared) {
      onClearMissedCalls();
    }
  };

  const handleTogglePlayVoicemail = (vmId: 'vm_1' | 'vm_2') => {
    if (playingVmId === vmId) {
      soundEngine.stopVoicemailAudio();
      setPlayingVmId(null);
      return;
    }
    setPlayingVmId(vmId);
    onMarkVoicemailPlayed(vmId);
    soundEngine.playVoicemailAudio(vmId, () => {
      setPlayingVmId((curr) => (curr === vmId ? null : curr));
    });
  };

  const toggleTranscript = (vmId: string) => {
    setTranscriptOpenIds((prev) =>
      prev.includes(vmId) ? prev.filter((id) => id !== vmId) : [...prev, vmId]
    );
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      {/* Smartphone Chassis */}
      <div className="relative flex h-[min(640px,88vh)] w-[min(370px,94vw)] flex-col overflow-hidden rounded-[2rem] border-4 border-slate-700 bg-[#080c15] text-slate-100 shadow-2xl">
        {/* Top Phone Speaker / Status Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#05080f] px-5 pt-3 pb-2.5 text-[11px] font-mono-tabular text-slate-300">
          <span>11:47 PM</span>
          <div className="h-2 w-16 rounded-full bg-slate-800" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            <Signal className="h-3 w-3 text-slate-300" />
            <Wifi className="h-3 w-3 text-slate-300" />
            <span className="inline-flex items-center gap-0.5 text-red-400">
              <BatteryLow className="h-3.5 w-3.5" /> 18%
            </span>
          </div>
        </div>

        {/* App Title Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0b111e] px-4 py-2.5">
          <div>
            <p className="font-mono-tabular text-[10px] font-semibold tracking-wider text-sky-400">
              HOSTEL DEVICE · ROOM 307
            </p>
            <h2 className="font-display text-sm font-bold text-white">
              {tab === 'messages'
                ? 'Block C Messages'
                : tab === 'calls'
                  ? 'Recent Call Log'
                  : tab === 'photos'
                    ? 'Camera Roll'
                    : 'Voicemail Inbox'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.stopVoicemailAudio();
              onClose();
            }}
            aria-label="Lock & put down phone"
            className="rounded-lg border border-white/15 bg-[#141c2d] p-1.5 text-slate-300 hover:border-white/35 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main Phone Screen Body */}
        <div className="flex-1 overflow-y-auto p-3.5 custom-scroll">
          {tab === 'messages' && (
            <div className="space-y-2.5">
              {PHONE_MESSAGES.map((msg) => {
                const isUnread = phoneState.unreadMessageIds.includes(msg.id);
                const isOpen = openMessageId === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playPhoneChime();
                      setOpenMessageId(isOpen ? null : msg.id);
                      if (isUnread) onMarkMessageRead(msg.id);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isUnread
                        ? 'border-sky-400/55 bg-[#101c30]'
                        : 'border-white/10 bg-[#0e1422] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{msg.sender}</span>
                      <span className="font-mono-tabular text-[10px] text-slate-400">
                        {msg.time}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono-tabular text-[10px] text-sky-400">
                      {msg.role} {isUnread ? '· NEW' : ''}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                      {isOpen ? msg.body : msg.preview}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'calls' && (
            <div className="space-y-2.5">
              {PHONE_MISSED_CALLS.map((call) => (
                <div
                  key={call.id}
                  className="rounded-xl border border-red-500/25 bg-[#150e16] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-red-200">{call.caller}</p>
                      <p className="mt-0.5 font-mono-tabular text-[10px] text-slate-400">
                        {call.tag} · Missed ({call.attempts}x)
                      </p>
                    </div>
                    <span className="font-mono-tabular text-[10px] text-slate-400">
                      {call.time}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-300">{call.note}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'photos' && (
            <>
              {selectedPhoto ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-sky-200"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>All Photos</span>
                  </button>
                  <div className="overflow-hidden rounded-xl border border-white/15 bg-black p-1.5">
                    <div className="h-48 w-full">
                      <ProceduralPhotoCanvas variant={selectedPhoto.sceneVariant} large />
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0e1422] p-3">
                    <p className="font-display text-sm font-bold text-white">
                      {selectedPhoto.title}
                    </p>
                    <p className="mt-0.5 font-mono-tabular text-[10px] text-slate-400">
                      {selectedPhoto.location} · {selectedPhoto.timestamp}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {selectedPhoto.caption}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {PHONE_PHOTOS.map((photo) => {
                    const viewed = phoneState.viewedPhotoIds.includes(photo.id);
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playInspect();
                          setSelectedPhoto(photo);
                          onMarkPhotoViewed(photo.id);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#0e1422] p-2 text-left transition-colors hover:border-sky-400/50"
                      >
                        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10">
                          <ProceduralPhotoCanvas variant={photo.sceneVariant} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white">{photo.title}</p>
                          <p className="font-mono-tabular text-[10px] text-slate-400">
                            {photo.timestamp} · {viewed ? 'Viewed' : 'Tap to open'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                            {photo.caption}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'voice' && (
            <div className="space-y-3">
              {PHONE_VOICEMAILS.map((vm) => {
                const isPlaying = playingVmId === vm.id;
                const played = phoneState.playedVoicemailIds.includes(vm.id);
                const showTranscript = transcriptOpenIds.includes(vm.id);
                const vmVariant = vm.id === 'vm_1' ? 'vm_1' : 'vm_2';

                return (
                  <div
                    key={vm.id}
                    className={`rounded-xl border p-3.5 ${
                      isPlaying
                        ? 'border-sky-400/60 bg-[#0f1c31]'
                        : 'border-white/10 bg-[#0e1422]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{vm.caller}</p>
                        <p className="font-mono-tabular text-[10px] text-slate-400">
                          {vm.time} · {vm.durationSec}s · {played ? 'Heard' : 'Unheard'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePlayVoicemail(vmVariant)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                          isPlaying
                            ? 'bg-red-500 text-white'
                            : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Square className="h-3 w-3" /> Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> Play
                          </>
                        )}
                      </button>
                    </div>

                    {/* Visual Audio Bars */}
                    <div className="mt-3 flex h-6 items-center gap-1 rounded bg-[#070b14] px-2">
                      <Volume2 className="mr-1 h-3.5 w-3.5 text-sky-400" />
                      {[45, 80, 60, 95, 50, 75, 88, 40, 70, 90, 55, 65].map((barH, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 rounded-full transition-all duration-150 ${
                            isPlaying ? 'bg-sky-400' : 'bg-slate-600'
                          }`}
                          style={{
                            height: isPlaying
                              ? `${Math.max(25, ((barH + idx * 13) % 90))}%`
                              : `${Math.round(barH * 0.4)}%`,
                          }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleTranscript(vm.id)}
                      className="mt-2 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
                    >
                      {showTranscript ? 'Hide Transcript' : 'Read Transcript'}
                    </button>

                    {showTranscript && (
                      <p className="mt-1.5 rounded-lg border border-white/10 bg-[#080c15] p-2.5 text-xs italic leading-relaxed text-slate-200">
                        {vm.transcript}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Context Note */}
        <div className="border-t border-white/10 bg-[#090d16] px-4 py-1.5 text-center font-mono-tabular text-[10px] text-slate-500">
          Hostel Personal Device · Optional Context Log
        </div>

        {/* Bottom Phone Navigation Tabs */}
        <nav className="grid grid-cols-4 border-t border-white/10 bg-[#05080f] py-2">
          {[
            {
              id: 'messages' as const,
              label: 'Texts',
              icon: MessageSquare,
              badge: unreadCount > 0 ? unreadCount : 0,
            },
            {
              id: 'calls' as const,
              label: 'Calls',
              icon: PhoneMissed,
              badge: !phoneState.missedCallsCleared ? 3 : 0,
            },
            {
              id: 'photos' as const,
              label: 'Photos',
              icon: ImageIcon,
              badge: 0,
            },
            {
              id: 'voice' as const,
              label: 'Voice',
              icon: Voicemail,
              badge:
                PHONE_VOICEMAILS.length - phoneState.playedVoicemailIds.length > 0
                  ? PHONE_VOICEMAILS.length - phoneState.playedVoicemailIds.length
                  : 0,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`relative flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors ${
                  active ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute right-4 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono-tabular text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
