// Layered procedural Web Audio API synthesizer — zero external audio files or 404 risk

import { WardenThreatState } from '../types/game';
import { CampaignId } from '../types/platform';

export type Vec3 = [number, number, number];

export interface PositionalCueSpec {
  position: Vec3;
  muffleHz: number;
  volumeScale: number;
  echoMix: number;
  kind: 'footsteps' | 'knock' | 'handle';
}

export interface ListenerPose {
  position: Vec3;
  forward: Vec3;
  up: Vec3;
}

/**
 * Pure helper returning 3D world coordinates, door/wall occlusion cutoff (Hz),
 * and corridor echo level for the Warden based on proximity state and campaign geometry.
 */
export function computeWardenAudioCueSpec(
  threatState: WardenThreatState,
  campaign: CampaignId,
  stepProgress = 0.5,
  cueVariant = 0
): PositionalCueSpec {
  const t = Math.max(0, Math.min(1, stepProgress));

  if (campaign === 'medium') {
    // Campaign 02: Basement Radio Bunker — bulkhead exit at [0.55, 1.25, 2.8], concrete stairs rising +Z/+Y
    switch (threatState) {
      case 'DORMANT':
        return {
          position: [1.45 - t * 0.6, 2.65, 8.6 - t * 0.8],
          muffleHz: 215,
          volumeScale: 0.42,
          echoMix: 0.36,
          kind: 'footsteps',
        };
      case 'APPROACHING':
        return {
          position: [1.05 - t * 0.45, 2.15 - t * 0.45, 6.2 - t * 1.1],
          muffleHz: 320,
          volumeScale: 0.64,
          echoMix: 0.34,
          kind: 'footsteps',
        };
      case 'OUTSIDE_ROOM':
        return {
          position: [0.25 + t * 0.75, 1.35, 3.75],
          muffleHz: 450,
          volumeScale: 0.82,
          echoMix: 0.24,
          kind: 'footsteps',
        };
      case 'INSPECTING_DOOR':
        return {
          position: [0.55, 1.25, 2.96],
          muffleHz: 620,
          volumeScale: 0.96,
          echoMix: 0.16,
          kind: cueVariant % 3 === 2 ? 'footsteps' : 'knock',
        };
      case 'IMMINENT_ARRIVAL':
      case 'ARRIVED':
        return {
          position: [0.55, 1.15, 2.8],
          muffleHz: 880,
          volumeScale: 1.1,
          echoMix: 0.12,
          kind: cueVariant % 2 === 0 ? 'handle' : 'knock',
        };
    }
  }

  if (campaign === 'difficult') {
    // Campaign 03: Sub-Archive Vault B — overhead grate (+Y) & vault hatch [0.3, 1.25, 2.82]
    switch (threatState) {
      case 'DORMANT':
        return {
          position: [1.4 - t * 0.9, 3.2, 7.6 - t * 0.7],
          muffleHz: 205,
          volumeScale: 0.42,
          echoMix: 0.36,
          kind: 'footsteps',
        };
      case 'APPROACHING':
        return {
          position: [0.9 - t * 0.8, 3.05, 5.2 - t * 1.0],
          muffleHz: 310,
          volumeScale: 0.65,
          echoMix: 0.32,
          kind: 'footsteps',
        };
      case 'OUTSIDE_ROOM':
        return {
          position: [-0.2 + t * 1.1, 2.92, 3.55],
          muffleHz: 430,
          volumeScale: 0.84,
          echoMix: 0.22,
          kind: 'footsteps',
        };
      case 'INSPECTING_DOOR':
        return {
          position: [0.3, 2.55, 2.95],
          muffleHz: 590,
          volumeScale: 0.96,
          echoMix: 0.15,
          kind: cueVariant % 3 === 2 ? 'footsteps' : 'knock',
        };
      case 'IMMINENT_ARRIVAL':
      case 'ARRIVED':
        return {
          position: [0.3, 1.45, 2.82],
          muffleHz: 850,
          volumeScale: 1.1,
          echoMix: 0.12,
          kind: cueVariant % 2 === 0 ? 'handle' : 'knock',
        };
    }
  }

  // Campaign 01: Hostel Room 307 — wooden door at [0.45, 1.25, 2.7], corridor along +Z
  switch (threatState) {
    case 'DORMANT':
      return {
        position: [1.85 - t * 0.9, 0.25, 9.2 - t * 0.9],
        muffleHz: 240,
        volumeScale: 0.45,
        echoMix: 0.35,
        kind: 'footsteps',
      };
    case 'APPROACHING':
      return {
        position: [1.25 - t * 1.0, 0.22, 7.0 - t * 1.25],
        muffleHz: 350,
        volumeScale: 0.68,
        echoMix: 0.32,
        kind: 'footsteps',
      };
    case 'OUTSIDE_ROOM':
      return {
        position: [-0.25 + t * 1.4, 0.2, 3.85],
        muffleHz: 480,
        volumeScale: 0.86,
        echoMix: 0.24,
        kind: 'footsteps',
      };
    case 'INSPECTING_DOOR':
      return {
        position: [0.45, 1.22, 2.96],
        muffleHz: 680,
        volumeScale: 1.0,
        echoMix: 0.16,
        kind: cueVariant % 3 === 2 ? 'footsteps' : 'knock',
      };
    case 'IMMINENT_ARRIVAL':
    case 'ARRIVED':
      return {
        position: [0.45, 1.15, 2.74],
        muffleHz: 980,
        volumeScale: 1.12,
        echoMix: 0.12,
        kind: cueVariant % 2 === 0 ? 'handle' : 'knock',
      };
  }
}

function cueIntervalMsForThreat(threatState: WardenThreatState): number | null {
  switch (threatState) {
    case 'DORMANT':
      return 15500 + Math.random() * 5500;
    case 'APPROACHING':
      return 9000 + Math.random() * 4000;
    case 'OUTSIDE_ROOM':
      return 7000 + Math.random() * 3000;
    case 'INSPECTING_DOOR':
      return 5500 + Math.random() * 2800;
    case 'IMMINENT_ARRIVAL':
      return 4200 + Math.random() * 2000;
    case 'ARRIVED':
      return null;
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private spatialGain: GainNode | null = null;
  private ambientOscA: OscillatorNode | null = null;
  private ambientOscB: OscillatorNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private fanGain: GainNode | null = null;
  private fanLfo: OscillatorNode | null = null;
  private muted = false;
  private masterVolume = 0.7;
  private ambientEnabled = true;
  private ambientRunning = false;
  private ambientGeneration = 0;
  private tenseMode = false;
  private threatLevel: WardenThreatState = 'DORMANT';
  private campaignProfile: CampaignId = 'easy';
  private voicemailTimers: number[] = [];
  private morseTimers: number[] = [];
  private positionalLoopActive = false;
  private positionalLoopTimer: number | null = null;
  private positionalCueVariant = 0;
  private listenerPose: ListenerPose = {
    position: [0, 1.65, 0.15],
    forward: [0, 0, -1],
    up: [0, 1, 0],
  };

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
        this.masterGain.connect(this.ctx.destination);

        // Parallel spatial cue bus — never interrupts or ducks main ambientGain music
        this.spatialGain = this.ctx.createGain();
        this.spatialGain.gain.value = 1.0;
        this.spatialGain.connect(this.masterGain);

        this.applyListenerPoseToContext();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private applyListenerPoseToContext(): void {
    if (!this.ctx || !this.ctx.listener) return;
    const listener = this.ctx.listener;
    const [px, py, pz] = this.listenerPose.position;
    const [fx, fy, fz] = this.listenerPose.forward;
    const [ux, uy, uz] = this.listenerPose.up;
    const now = this.ctx.currentTime;

    try {
      if (listener.positionX) {
        listener.positionX.setValueAtTime(px, now);
        listener.positionY.setValueAtTime(py, now);
        listener.positionZ.setValueAtTime(pz, now);
        listener.forwardX.setValueAtTime(fx, now);
        listener.forwardY.setValueAtTime(fy, now);
        listener.forwardZ.setValueAtTime(fz, now);
        listener.upX.setValueAtTime(ux, now);
        listener.upY.setValueAtTime(uy, now);
        listener.upZ.setValueAtTime(uz, now);
      } else if (
        typeof (listener as unknown as { setPosition?: (...args: number[]) => void }).setPosition ===
        'function'
      ) {
        (listener as unknown as { setPosition: (x: number, y: number, z: number) => void }).setPosition(
          px,
          py,
          pz
        );
        (
          listener as unknown as {
            setOrientation: (
              fx: number,
              fy: number,
              fz: number,
              ux: number,
              uy: number,
              uz: number
            ) => void;
          }
        ).setOrientation(fx, fy, fz, ux, uy, uz);
      }
    } catch {
      // Ignore Web Audio listener update quirks
    }
  }

  public updateListenerPose(position: Vec3, forward: Vec3, up: Vec3 = [0, 1, 0]): void {
    const fLen = Math.hypot(forward[0], forward[1], forward[2]) || 1;
    this.listenerPose = {
      position,
      forward: [forward[0] / fLen, forward[1] / fLen, forward[2] / fLen],
      up,
    };
    if (this.ctx) {
      this.applyListenerPoseToContext();
    }
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.syncMasterGain();
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.syncMasterGain();
  }

  public setAmbientEnabled(enabled: boolean): void {
    this.ambientEnabled = enabled;
    if (!enabled) {
      this.stopPositionalCueLoop();
      this.stopAmbience();
    } else {
      this.startAmbience();
    }
  }

  public setTenseMode(tense: boolean): void {
    this.tenseMode = tense;
    this.syncAmbientThreatTone();
  }

  public setCampaignProfile(campaign: CampaignId): void {
    const changed = this.campaignProfile !== campaign;
    this.campaignProfile = campaign;
    if (changed && this.ambientRunning) {
      this.syncAmbientThreatTone();
    }
  }

  public setWardenThreatLevel(state: WardenThreatState): void {
    const changed = this.threatLevel !== state;
    this.threatLevel = state;
    this.tenseMode =
      state === 'INSPECTING_DOOR' ||
      state === 'IMMINENT_ARRIVAL' ||
      state === 'ARRIVED';
    this.syncAmbientThreatTone();

    if (state === 'ARRIVED') {
      this.stopPositionalCueLoop();
    } else if (changed && this.positionalLoopActive && this.ambientEnabled) {
      // Re-schedule immediately with the tighter interval for the closer threat tier
      this.scheduleNextPositionalCue();
    }
  }

  public setPositionalCueLoopActive(active: boolean): void {
    if (this.positionalLoopActive === active) return;
    this.positionalLoopActive = active;
    if (!active) {
      this.stopPositionalCueLoop();
    } else if (this.ambientEnabled && this.threatLevel !== 'ARRIVED') {
      this.scheduleNextPositionalCue();
    }
  }

  private stopPositionalCueLoop(): void {
    if (this.positionalLoopTimer !== null) {
      globalThis.clearTimeout(this.positionalLoopTimer);
      this.positionalLoopTimer = null;
    }
  }

  private scheduleNextPositionalCue(): void {
    this.stopPositionalCueLoop();
    if (!this.positionalLoopActive || !this.ambientEnabled) return;
    const waitMs = cueIntervalMsForThreat(this.threatLevel);
    if (waitMs === null) return;

    this.positionalLoopTimer = globalThis.setTimeout(() => {
      this.positionalLoopTimer = null;
      if (!this.positionalLoopActive || !this.ambientEnabled) return;
      this.emitAmbientProximityCue();
      this.scheduleNextPositionalCue();
    }, waitMs) as unknown as number;
  }

  /**
   * Emits a subtle, positional 3D ambient cue tuned to the Warden's current proximity state
   * without touching or interrupting the main background ambient track.
   */
  public emitAmbientProximityCue(overrideState?: WardenThreatState): void {
    if (this.muted || !this.ambientEnabled) return;
    const state = overrideState ?? this.threatLevel;
    if (state === 'ARRIVED') return;

    const variant = this.positionalCueVariant++;
    const spec = computeWardenAudioCueSpec(state, this.campaignProfile, 0.35, variant);

    if (spec.kind === 'knock') {
      const heavy = state === 'IMMINENT_ARRIVAL';
      this.playMuffledDoorKnockAt(spec.position, spec.muffleHz, heavy, spec.volumeScale * 0.72, spec.echoMix);
    } else if (spec.kind === 'handle') {
      this.playPositionalHandleJiggle(spec.position, spec.muffleHz, spec.volumeScale * 0.78);
    } else {
      const count = state === 'DORMANT' ? 2 : state === 'APPROACHING' ? 3 : 3;
      this.playPositionalFootstepWalk(state, count, state === 'IMMINENT_ARRIVAL', spec.volumeScale * 0.74);
    }
  }

  private syncAmbientThreatTone(): void {
    if (!this.ctx || !this.ambientGain || !this.ambientRunning) return;
    const now = this.ctx.currentTime;
    const baseFreqA =
      this.campaignProfile === 'medium' ? 60 : this.campaignProfile === 'difficult' ? 42 : 54;
    const baseFreqB =
      this.campaignProfile === 'medium' ? 120 : this.campaignProfile === 'difficult' ? 63 : 81;

    let targetGain = 0.065;
    let freqOffset = 0;

    switch (this.threatLevel) {
      case 'APPROACHING':
        targetGain = 0.075;
        freqOffset = 3;
        break;
      case 'OUTSIDE_ROOM':
        targetGain = 0.088;
        freqOffset = 7;
        break;
      case 'INSPECTING_DOOR':
        targetGain = 0.105;
        freqOffset = 12;
        break;
      case 'IMMINENT_ARRIVAL':
      case 'ARRIVED':
        targetGain = 0.125;
        freqOffset = 17;
        break;
      default:
        targetGain = this.tenseMode ? 0.1 : 0.065;
    }

    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(targetGain, now + 1.0);

    if (this.ambientOscA) {
      this.ambientOscA.frequency.setTargetAtTime(baseFreqA, now, 0.8);
    }
    if (this.ambientOscB) {
      this.ambientOscB.frequency.setTargetAtTime(baseFreqB + freqOffset, now, 0.8);
    }
  }

  private syncMasterGain(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : this.masterVolume, now + 0.14);
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public startAmbience(): void {
    if (!this.ambientEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.ambientRunning) return;
    this.ambientGeneration += 1;
    try {
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(
        this.tenseMode ? 0.1 : 0.065,
        ctx.currentTime + 1.6
      );

      // Layer 1: Low hostel electrical / structural night drone
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 165;

      this.ambientOscA = ctx.createOscillator();
      this.ambientOscA.type = 'sine';
      this.ambientOscA.frequency.value = 54;

      this.ambientOscB = ctx.createOscillator();
      this.ambientOscB.type = 'triangle';
      this.ambientOscB.frequency.value = 81;

      this.ambientOscA.connect(humFilter);
      this.ambientOscB.connect(humFilter);
      humFilter.connect(this.ambientGain);

      // Layer 2: Soft rain pattering loop outside window + gentle ceiling fan whoosh
      const rainSeconds = 3;
      const bufSize = Math.floor(ctx.sampleRate * rainSeconds);
      const rainBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = rainBuf.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2 + white * 0.025) * 0.35;
      }

      this.rainSource = ctx.createBufferSource();
      this.rainSource.buffer = rainBuf;
      this.rainSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 920;
      rainFilter.Q.value = 0.55;

      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.28;

      this.rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(this.ambientGain);

      // Ceiling fan rhythmic blade modulation
      this.fanGain = ctx.createGain();
      this.fanGain.gain.value = 0.14;
      this.fanLfo = ctx.createOscillator();
      this.fanLfo.type = 'sine';
      this.fanLfo.frequency.value = 3.2;
      const fanDepth = ctx.createGain();
      fanDepth.gain.value = 0.05;
      this.fanLfo.connect(fanDepth);
      fanDepth.connect(this.fanGain.gain);

      const fanFilter = ctx.createBiquadFilter();
      fanFilter.type = 'lowpass';
      fanFilter.frequency.value = 220;
      this.rainSource.connect(fanFilter);
      fanFilter.connect(this.fanGain);
      this.fanGain.connect(this.ambientGain);

      this.ambientGain.connect(this.masterGain);

      this.ambientOscA.start();
      this.ambientOscB.start();
      this.rainSource.start();
      this.fanLfo.start();
      this.ambientRunning = true;
      this.syncAmbientThreatTone();
      if (this.positionalLoopActive && this.threatLevel !== 'ARRIVED') {
        this.scheduleNextPositionalCue();
      }
    } catch {
      // Ignore audio startup failures
    }
  }

  public stopAmbience(): void {
    this.stopPositionalCueLoop();
    if (!this.ctx || !this.ambientRunning) return;
    const stopGen = this.ambientGeneration;
    try {
      const now = this.ctx.currentTime;
      this.ambientGain?.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      setTimeout(() => {
        if (this.ambientGeneration !== stopGen) return;
        try {
          this.ambientOscA?.stop();
          this.ambientOscB?.stop();
          this.rainSource?.stop();
          this.fanLfo?.stop();
        } catch {
          // ignore
        }
        this.ambientOscA = null;
        this.ambientOscB = null;
        this.rainSource = null;
        this.fanLfo = null;
        this.ambientRunning = false;
      }, 550);
    } catch {
      this.ambientRunning = false;
    }
  }

  /**
   * Builds a 3D HRTF spatial + wall/door low-pass muffled destination node connected to spatialGain.
   * Returns a GainNode input where positional one-shot tones/noises can connect without disturbing ambientGain.
   */
  private createPositionalDestination(
    position: Vec3,
    muffleHz: number,
    echoMix = 0.2
  ): AudioNode | null {
    const ctx = this.ensureContext();
    const bus = this.spatialGain ?? this.masterGain;
    if (!ctx || !bus) return null;

    const muffleFilter = ctx.createBiquadFilter();
    muffleFilter.type = 'lowpass';
    muffleFilter.frequency.value = Math.max(140, Math.min(4500, muffleHz));
    muffleFilter.Q.value = 0.7;

    let pannerTarget: AudioNode = bus;

    if (typeof ctx.createPanner === 'function') {
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1.65;
      panner.maxDistance = 18;
      panner.rolloffFactor = 1.15;
      const now = ctx.currentTime;
      if (panner.positionX) {
        panner.positionX.setValueAtTime(position[0], now);
        panner.positionY.setValueAtTime(position[1], now);
        panner.positionZ.setValueAtTime(position[2], now);
      } else {
        panner.setPosition(position[0], position[1], position[2]);
      }
      panner.connect(bus);
      pannerTarget = panner;
    } else if (typeof ctx.createStereoPanner === 'function') {
      const stereo = ctx.createStereoPanner();
      const dx = position[0] - this.listenerPose.position[0];
      stereo.pan.value = Math.max(-0.95, Math.min(0.95, dx / 4));
      stereo.connect(bus);
      pannerTarget = stereo;
    }

    muffleFilter.connect(pannerTarget);

    // Subtle corridor reflection echo tap
    if (echoMix > 0.02 && typeof ctx.createDelay === 'function') {
      const delay = ctx.createDelay(0.5);
      delay.delayTime.value = 0.095;
      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = Math.min(620, muffleHz * 1.15);
      const echoGain = ctx.createGain();
      echoGain.gain.value = Math.min(0.45, echoMix);
      muffleFilter.connect(delay);
      delay.connect(echoFilter);
      echoFilter.connect(echoGain);
      echoGain.connect(pannerTarget);
    }

    return muffleFilter;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.2,
    delay = 0,
    endFreq?: number,
    destination?: AudioNode | null
  ): void {
    const ctx = this.ensureContext();
    const dest = destination ?? this.masterGain;
    if (!ctx || !dest || this.muted) return;
    try {
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private playNoiseBurst(
    duration: number,
    filterFreq: number,
    volume = 0.15,
    delay = 0,
    destination?: AudioNode | null
  ): void {
    const ctx = this.ensureContext();
    const dest = destination ?? this.masterGain;
    if (!ctx || !dest || this.muted) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      source.start(ctx.currentTime + delay);
    } catch {
      // ignore
    }
  }

  public playTick(urgent = false): void {
    this.playTone(urgent ? 1350 : 980, 0.035, 'triangle', urgent ? 0.08 : 0.04, 0, 420);
  }

  public playInspect(): void {
    this.playTone(440, 0.08, 'sine', 0.1, 0, 520);
    this.playNoiseBurst(0.05, 800, 0.06);
  }

  public playDialClick(): void {
    this.playTone(740, 0.045, 'triangle', 0.11, 0, 560);
    this.playNoiseBurst(0.03, 1400, 0.06);
  }

  public playPaperUnfold(): void {
    this.playNoiseBurst(0.14, 1900, 0.12, 0);
    this.playNoiseBurst(0.12, 2400, 0.09, 0.09);
  }

  public playBookSlide(): void {
    this.playNoiseBurst(0.16, 480, 0.15, 0);
    this.playTone(210, 0.12, 'triangle', 0.08, 0.04, 160);
  }

  public playKeyTurn(): void {
    this.playTone(920, 0.06, 'triangle', 0.14, 0, 1280);
    this.playTone(420, 0.11, 'square', 0.1, 0.08, 280);
    this.playNoiseBurst(0.12, 1100, 0.14, 0.12);
  }

  public playPinConnect(): void {
    this.playTone(620, 0.07, 'sine', 0.12, 0, 880);
    this.playNoiseBurst(0.05, 1600, 0.08, 0.02);
  }

  public playPinRemove(): void {
    this.playTone(420, 0.08, 'triangle', 0.1, 0, 260);
  }

  public playPhoneVibrate(): void {
    this.playTone(135, 0.22, 'sawtooth', 0.11, 0, 128);
    this.playTone(135, 0.24, 'sawtooth', 0.11, 0.34, 128);
  }

  public playPhoneChime(): void {
    this.playTone(880, 0.12, 'sine', 0.1, 0);
    this.playTone(1174.66, 0.18, 'sine', 0.09, 0.11);
  }

  public stopVoicemailAudio(): void {
    this.voicemailTimers.forEach((t) => window.clearTimeout(t));
    this.voicemailTimers = [];
  }

  public playVoicemailAudio(variant: 'vm_1' | 'vm_2', onComplete?: () => void): void {
    this.stopVoicemailAudio();
    this.ensureContext();
    this.playTone(1046.5, 0.14, 'sine', 0.12, 0);
    const cadence =
      variant === 'vm_1'
        ? [220, 255, 195, 240, 210, 265, 200, 235, 185, 225, 250, 210]
        : [190, 210, 175, 230, 185, 215, 170, 205, 240, 195, 180, 220];

    cadence.forEach((freq, idx) => {
      const delay = 0.28 + idx * 0.26;
      this.playTone(freq, 0.19, 'triangle', 0.08, delay, freq * 0.94);
      this.playNoiseBurst(0.08, 1200, 0.04, delay);
    });

    const totalMs = (0.28 + cadence.length * 0.26 + 0.35) * 1000;
    const endTimer = window.setTimeout(() => {
      this.playTone(784, 0.16, 'sine', 0.1, 0);
      onComplete?.();
    }, totalMs);
    this.voicemailTimers.push(endTimer);
  }

  private playMuffledDoorKnockAt(
    position: Vec3,
    muffleHz: number,
    heavy = false,
    volumeScale = 1.0,
    echoMix = 0.16
  ): void {
    const dest = this.createPositionalDestination(position, muffleHz, echoMix);
    if (!dest) return;
    const baseVol = (heavy ? 0.26 : 0.18) * volumeScale;
    const taps = heavy ? [0, 0.2, 0.4] : [0, 0.24, 0.48];
    const isSteel = this.campaignProfile === 'medium' || this.campaignProfile === 'difficult';

    taps.forEach((delay, idx) => {
      const thumpHz = heavy ? 88 : 108;
      this.playTone(thumpHz, 0.13, 'sine', baseVol, delay, 42, dest);
      this.playNoiseBurst(0.09, isSteel ? 420 : 280, baseVol * 0.85, delay, dest);
      if (isSteel) {
        this.playTone(320 + idx * 14, 0.09, 'triangle', baseVol * 0.28, delay, 260, dest);
      }
    });
  }

  private playPositionalHandleJiggle(
    position: Vec3,
    muffleHz: number,
    volumeScale = 1.0
  ): void {
    const dest = this.createPositionalDestination(position, Math.max(720, muffleHz), 0.12);
    if (!dest) return;
    const vol = 0.18 * volumeScale;
    this.playNoiseBurst(0.11, 960, vol, 0, dest);
    this.playTone(255, 0.09, 'triangle', vol * 0.72, 0.045, 185, dest);
    this.playNoiseBurst(0.09, 860, vol * 0.82, 0.16, dest);
  }

  private playPositionalFootstepWalk(
    threatState: WardenThreatState,
    count = 4,
    fast = false,
    volumeScale = 1.0
  ): void {
    const gap = fast ? 0.32 : 0.52;
    const isGrate = this.campaignProfile === 'difficult';
    for (let i = 0; i < count; i++) {
      const progress = count > 1 ? i / (count - 1) : 0.5;
      const spec = computeWardenAudioCueSpec(threatState, this.campaignProfile, progress, i);
      const dest = this.createPositionalDestination(spec.position, spec.muffleHz, spec.echoMix);
      if (!dest) continue;

      const stepGain = (0.14 + progress * 0.11) * spec.volumeScale * volumeScale;
      const delay = i * gap;
      // Heel-toe subtle pitch alternation so footsteps feel organic
      const heelPitch = i % 2 === 0 ? 96 : 86;
      this.playTone(heelPitch, 0.12, 'sine', stepGain, delay, 42, dest);
      this.playNoiseBurst(0.1, isGrate ? 420 : 280, stepGain * 0.9, delay, dest);
      if (isGrate) {
        this.playTone(290, 0.08, 'triangle', stepGain * 0.22, delay, 230, dest);
      }
    }
  }

  public playDistantKnock(): void {
    const spec = computeWardenAudioCueSpec('OUTSIDE_ROOM', this.campaignProfile, 0.5, 0);
    const dest = this.createPositionalDestination(spec.position, 410, 0.28);
    if (!dest) return;
    this.playTone(112, 0.14, 'sine', 0.2, 0, 56, dest);
    this.playNoiseBurst(0.08, 320, 0.18, 0, dest);
    this.playTone(108, 0.14, 'sine', 0.22, 0.24, 54, dest);
    this.playNoiseBurst(0.08, 320, 0.2, 0.24, dest);
  }

  public playDoorKnockPattern(heavy = false): void {
    const tier: WardenThreatState = heavy ? 'IMMINENT_ARRIVAL' : 'INSPECTING_DOOR';
    const spec = computeWardenAudioCueSpec(tier, this.campaignProfile, 0.5, 0);
    this.playMuffledDoorKnockAt(spec.position, spec.muffleHz, heavy, spec.volumeScale, spec.echoMix);
  }

  public playHandleJiggle(): void {
    const spec = computeWardenAudioCueSpec('IMMINENT_ARRIVAL', this.campaignProfile, 0.5, 0);
    this.playPositionalHandleJiggle(spec.position, spec.muffleHz, spec.volumeScale);
  }

  public playThunder(): void {
    this.playNoiseBurst(0.85, 120, 0.14, 0.12);
    this.playTone(62, 0.75, 'sine', 0.14, 0.12, 34);
  }

  public playKeypadBeep(): void {
    this.playTone(880, 0.07, 'sine', 0.12);
  }

  public playError(): void {
    this.playTone(170, 0.18, 'sawtooth', 0.14, 0, 120);
    this.playTone(150, 0.22, 'sawtooth', 0.12, 0.12, 105);
  }

  public playDrawerUnlock(): void {
    this.playTone(320, 0.1, 'triangle', 0.18, 0, 540);
    this.playNoiseBurst(0.28, 360, 0.2, 0.08);
    this.playTone(620, 0.18, 'sine', 0.14, 0.14);
  }

  public playItemAcquire(): void {
    this.playTone(587.33, 0.2, 'sine', 0.16, 0);
    this.playTone(880, 0.35, 'sine', 0.16, 0.1);
  }

  public playPuzzleComplete(): void {
    this.playTone(392, 0.25, 'triangle', 0.18, 0);
    this.playTone(493.88, 0.25, 'triangle', 0.18, 0.12);
    this.playTone(587.33, 0.3, 'triangle', 0.18, 0.24);
    this.playTone(783.99, 0.55, 'sine', 0.22, 0.36);
  }

  public playUvToggle(active: boolean): void {
    if (active) {
      this.playTone(220, 0.28, 'sine', 0.14, 0, 960);
      this.playNoiseBurst(0.08, 2200, 0.08);
    } else {
      this.playTone(640, 0.12, 'sine', 0.1, 0, 220);
    }
  }

  public playHint(): void {
    this.playTone(523.25, 0.45, 'sine', 0.16, 0);
    this.playTone(659.25, 0.5, 'sine', 0.14, 0.15);
  }

  public playFootsteps(count = 4, fast = false): void {
    const activeTier: WardenThreatState =
      this.threatLevel === 'DORMANT' && fast ? 'APPROACHING' : this.threatLevel;
    this.playPositionalFootstepWalk(activeTier, count, fast, 1.0);
  }

  public playFinalDoorUnlock(): void {
    this.playTone(140, 0.18, 'square', 0.18, 0, 90);
    this.playNoiseBurst(0.22, 500, 0.22, 0.15);
    this.playTone(220, 0.35, 'triangle', 0.16, 0.3, 180);
    this.playNoiseBurst(0.45, 220, 0.14, 0.42);
  }

  public playWardenArrival(): void {
    const spec = computeWardenAudioCueSpec('ARRIVED', this.campaignProfile, 1.0, 0);
    const dest = this.createPositionalDestination(spec.position, 1400, 0.1);
    this.playPositionalFootstepWalk('IMMINENT_ARRIVAL', 5, true, 1.15);
    this.playNoiseBurst(0.15, 700, 0.28, 1.5, dest);
    this.playTone(110, 0.22, 'sawtooth', 0.24, 1.75, 55, dest);
    this.playTone(95, 0.25, 'sawtooth', 0.26, 2.05, 50, dest);
  }

  public playVictory(): void {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.75, 'sine', 0.16, idx * 0.13);
      this.playTone(n * 0.5, 0.9, 'triangle', 0.1, idx * 0.13);
    });
  }

  // Campaign 02 (Medium · Basement Radio Station) Audio FX
  public playCircuitSnap(): void {
    this.playTone(720, 0.06, 'triangle', 0.14, 0, 1040);
    this.playNoiseBurst(0.05, 1900, 0.11, 0);
  }

  public playCircuitSpark(): void {
    this.playNoiseBurst(0.16, 2600, 0.16, 0);
    this.playTone(180, 0.14, 'sawtooth', 0.12, 0.02, 420);
  }

  public playTransmitterPowerUp(): void {
    this.playTone(110, 0.65, 'sawtooth', 0.13, 0, 440);
    this.playTone(220, 0.55, 'sine', 0.14, 0.15, 660);
    this.playTone(880, 0.3, 'sine', 0.12, 0.55);
  }

  public stopMorsePlayback(): void {
    this.morseTimers.forEach((id) => window.clearTimeout(id));
    this.morseTimers = [];
  }

  public playMorseSequence(
    tokens: string[],
    slowMode: boolean,
    onStep?: (tokenIdx: number, pulseOn: boolean) => void,
    onDone?: () => void
  ): void {
    this.stopMorsePlayback();
    this.ensureContext();
    const dotMs = slowMode ? 175 : 110;
    const dashMs = dotMs * 3;
    const intraGap = dotMs * 0.85;
    const letterGap = dotMs * 3.1;

    let cursorMs = 80;
    tokens.forEach((morse, idx) => {
      for (const ch of morse) {
        if (ch !== '.' && ch !== '-') continue;
        const dur = ch === '.' ? dotMs : dashMs;
        const tOn = window.setTimeout(() => {
          this.playTone(740, dur / 1000, 'sine', 0.16, 0);
          onStep?.(idx, true);
        }, cursorMs);
        const tOff = window.setTimeout(() => {
          onStep?.(idx, false);
        }, cursorMs + dur);
        this.morseTimers.push(tOn, tOff);
        cursorMs += dur + intraGap;
      }
      cursorMs += letterGap;
    });

    const tEnd = window.setTimeout(() => {
      onStep?.(-1, false);
      onDone?.();
    }, cursorMs + 100);
    this.morseTimers.push(tEnd);
  }

  public playRadioDialStep(signalStrength: number): void {
    const noiseVol = Math.max(0.02, (1 - signalStrength) * 0.12);
    this.playNoiseBurst(0.06, 1500 + signalStrength * 700, noiseVol, 0);
    if (signalStrength > 0.35) {
      this.playTone(320 + signalStrength * 420, 0.055, 'sine', signalStrength * 0.11, 0);
    }
  }

  public playCarrierLock(): void {
    this.playTone(587.33, 0.18, 'sine', 0.16, 0);
    this.playTone(880, 0.25, 'sine', 0.16, 0.14);
    this.playTone(1174.66, 0.42, 'triangle', 0.15, 0.28);
  }

  // Campaign 03 (Difficult · Underground Archive) Audio FX
  public playCipherWheelClick(): void {
    this.playTone(540, 0.04, 'triangle', 0.12, 0, 410);
    this.playNoiseBurst(0.03, 1800, 0.07, 0);
  }

  public playPaperRustle(): void {
    this.playNoiseBurst(0.14, 2100, 0.11, 0);
    this.playNoiseBurst(0.11, 2700, 0.08, 0.08);
  }

  public playVaultBoltShift(): void {
    this.playTone(125, 0.16, 'triangle', 0.17, 0, 88);
    this.playNoiseBurst(0.24, 420, 0.2, 0.05);
    this.playTone(340, 0.18, 'sine', 0.12, 0.2);
  }

  public playVaultOpenHeavy(): void {
    this.playVaultBoltShift();
    this.playTone(88, 0.55, 'sawtooth', 0.14, 0.18, 52);
    this.playNoiseBurst(0.55, 240, 0.18, 0.25);
  }
}

export const soundEngine = new SoundEngine();
