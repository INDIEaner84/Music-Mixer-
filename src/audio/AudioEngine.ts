import {
  CrossfaderCurve,
  DeckId,
  EffectSetting,
  EffectType,
  LoopLength,
  MixRecordingItem,
  SamplePad,
  StemMode,
  Track,
  TransitionPresetId,
} from '../types';
import { extractWaveformData, generateDemoTrack, generateSamplerSample } from './soundGenerator';

interface DeckAudioNodes {
  id: DeckId;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode; // Channel Volume
  trimNode: GainNode; // Pre-amp Trim
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  filterNode: BiquadFilterNode;
  stemFilterNode: BiquadFilterNode;
  stemGainNode: GainNode;
  crossfaderGain: GainNode;
  analyser: AnalyserNode;
  // State
  startTime: number;
  pauseOffset: number;
  buffer: AudioBuffer | null;
  isPlaying: boolean;
  playbackRate: number;
  pitchSemitones: number;
  keyLock: boolean;
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
  currentTrack: Track | null;
  stemMode: StemMode;
}

interface Layer3AudioNodes {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  analyser: AnalyserNode;
  startTime: number;
  pauseOffset: number;
  buffer: AudioBuffer | null;
  isPlaying: boolean;
  playbackRate: number;
  currentTrack: Track | null;
  stemMode: StemMode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private masterAnalyser!: AnalyserNode;
  private recorderDest!: MediaStreamAudioDestinationNode;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private deckA!: DeckAudioNodes;
  private deckB!: DeckAudioNodes;
  private layer3!: Layer3AudioNodes;

  // Effects nodes
  private fxNodes: Partial<Record<EffectType, {
    input: GainNode;
    output: GainNode;
    wetGain: GainNode;
    dryGain: GainNode;
    nodes: AudioNode[];
  }>> = {};

  // Sampler
  private samplerPads: {
    buffer: AudioBuffer | null;
    gain: GainNode;
  }[] = [];

  // Crossfader state (-1 for A, 0 for Center, 1 for B)
  private crossfaderPosition: number = 0;
  private crossfaderCurve: CrossfaderCurve = 'smooth';

  // Audition / Cue Preview Channel
  private auditionSource: AudioBufferSourceNode | null = null;
  private auditionGain!: GainNode;
  private auditionAnalyser!: AnalyserNode;
  private auditionTimer: number | null = null;

  // Active Transition
  private transitionTimer: number | null = null;
  private onTransitionProgress?: (progress: number) => void;
  private onTransitionComplete?: () => void;

  constructor() {
    // Lazy initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 512;
    this.masterAnalyser.smoothingTimeConstant = 0.7;

    // Stream for set recording
    this.recorderDest = this.ctx.createMediaStreamDestination();

    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
    this.masterGain.connect(this.recorderDest);

    // Initialize Decks
    this.deckA = this.createDeckNodes('A');
    this.deckB = this.createDeckNodes('B');

    // Initialize 3rd Stem Layer (Vocals / Beat Injector)
    this.initLayer3();

    // Initialize Effects
    this.initEffects();

    // Initialize Sampler
    this.initSampler();

    // Initialize Audition Channel
    this.auditionGain = this.ctx.createGain();
    this.auditionGain.gain.value = 0.85;
    this.auditionAnalyser = this.ctx.createAnalyser();
    this.auditionAnalyser.fftSize = 256;
    this.auditionGain.connect(this.auditionAnalyser);
    this.auditionAnalyser.connect(this.ctx.destination);

    // Apply default crossfader
    this.setCrossfader(0);
  }

  public async resume(): Promise<void> {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  private createDeckNodes(id: DeckId): DeckAudioNodes {
    if (!this.ctx) throw new Error('AudioContext not initialized');

    const trimNode = this.ctx.createGain();
    trimNode.gain.value = 1.0;

    // 3-Band EQ
    const eqLow = this.ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 280;
    eqLow.gain.value = 0;

    const eqMid = this.ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1100;
    eqMid.Q.value = 1.1;
    eqMid.gain.value = 0;

    const eqHigh = this.ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 3800;
    eqHigh.gain.value = 0;

    // Dual resonant Filter (center = bypass)
    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = 'allpass';
    filterNode.frequency.value = 1000;
    filterNode.Q.value = 1.0;

    // Stem Isolation Filter (Vocals, Beat, Bass DSP)
    const stemFilterNode = this.ctx.createBiquadFilter();
    stemFilterNode.type = 'allpass';
    stemFilterNode.frequency.value = 1000;

    const stemGainNode = this.ctx.createGain();
    stemGainNode.gain.value = 1.0;

    // Channel Volume Fader
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.85;

    // Crossfader Gain
    const crossfaderGain = this.ctx.createGain();
    crossfaderGain.gain.value = 1.0;

    // Channel Analyser for VU & Waveform
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;

    // Signal chain:
    // [Source] -> Trim -> EQ Low -> EQ Mid -> EQ High -> Dual Filter -> Stem Filter -> Stem Gain -> Channel Gain -> Analyser -> Crossfader Gain -> Master Gain
    trimNode.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(filterNode);
    filterNode.connect(stemFilterNode);
    stemFilterNode.connect(stemGainNode);
    stemGainNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(crossfaderGain);
    crossfaderGain.connect(this.masterGain);

    return {
      id,
      source: null,
      gainNode,
      trimNode,
      eqLow,
      eqMid,
      eqHigh,
      filterNode,
      stemFilterNode,
      stemGainNode,
      crossfaderGain,
      analyser,
      startTime: 0,
      pauseOffset: 0,
      buffer: null,
      isPlaying: false,
      playbackRate: 1.0,
      pitchSemitones: 0,
      keyLock: true,
      isLooping: false,
      loopStart: 0,
      loopEnd: 0,
      currentTrack: null,
      stemMode: 'full',
    };
  }

  private initLayer3() {
    if (!this.ctx) return;

    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = 'allpass';

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.8;

    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 256;

    filterNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(this.masterGain);

    this.layer3 = {
      source: null,
      gainNode,
      filterNode,
      analyser,
      startTime: 0,
      pauseOffset: 0,
      buffer: null,
      isPlaying: false,
      playbackRate: 1.0,
      currentTrack: null,
      stemMode: 'vocals',
    };
  }

  private initEffects() {
    if (!this.ctx) return;
    const delay = this.ctx.createDelay(2.0);
    delay.delayTime.value = 0.35;
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.value = 0.45;
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
  }

  private initSampler() {
    if (!this.ctx) return;
    this.samplerPads = [];
    for (let i = 0; i < 8; i++) {
      const gain = this.ctx.createGain();
      gain.gain.value = 0.8;
      gain.connect(this.masterGain);
      this.samplerPads.push({
        buffer: null,
        gain,
      });
    }
  }

  // ===================== TRACK MANAGEMENT =====================

  public async loadTrack(deckId: DeckId, track: Track, audioBuffer?: AudioBuffer): Promise<Track> {
    await this.resume();
    const deck = deckId === 'A' ? this.deckA : this.deckB;

    this.stopDeck(deckId);

    let buffer = audioBuffer || track.audioBuffer;
    if (!buffer && this.ctx) {
      buffer = await generateDemoTrack(this.ctx, {
        title: track.title,
        bpm: track.bpm,
        key: track.key,
        durationSec: track.duration || 60,
        genre:
          track.bpm > 140
            ? 'dnb'
            : track.bpm > 128
            ? 'techno'
            : track.bpm < 120
            ? 'synthwave'
            : 'house',
      });
    }

    if (!buffer) throw new Error('Could not load audio buffer for track');

    const waveformData =
      track.waveformData && track.waveformData.length > 0
        ? track.waveformData
        : extractWaveformData(buffer, 300);

    const updatedTrack: Track = {
      ...track,
      duration: buffer.duration,
      audioBuffer: buffer,
      waveformData,
    };

    deck.buffer = buffer;
    deck.currentTrack = updatedTrack;
    deck.pauseOffset = 0;
    deck.loopStart = 0;
    deck.loopEnd = 0;
    deck.isLooping = false;

    return updatedTrack;
  }

  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.resume();
    if (!this.ctx) throw new Error('AudioContext not ready');
    const arrayBuffer = await file.arrayBuffer();
    return await this.ctx.decodeAudioData(arrayBuffer);
  }

  // ===================== STEM SEPARATION & ISOLATION DSP =====================

  public setDeckStemMode(deckId: DeckId, mode: StemMode) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck || !this.ctx) return;
    deck.stemMode = mode;
    const now = this.ctx.currentTime;

    switch (mode) {
      case 'vocals': {
        // Vocal isolate: Cut sub bass drastically, focus on mid band 250Hz - 4.5kHz with vocal presence boost
        deck.eqLow.gain.setValueAtTime(-36, now);
        deck.eqMid.gain.setValueAtTime(3.5, now);
        deck.eqHigh.gain.setValueAtTime(2.0, now);
        deck.stemFilterNode.type = 'highpass';
        deck.stemFilterNode.frequency.setValueAtTime(280, now);
        deck.stemFilterNode.Q.setValueAtTime(1.0, now);
        deck.stemGainNode.gain.setValueAtTime(1.2, now);
        break;
      }
      case 'beat': {
        // Beat & Drum punch: Boost kicks & sub, notch cut vocal range, crisp hats
        deck.eqLow.gain.setValueAtTime(4.0, now);
        deck.eqMid.gain.setValueAtTime(-18.0, now);
        deck.eqHigh.gain.setValueAtTime(2.5, now);
        deck.stemFilterNode.type = 'allpass';
        deck.stemGainNode.gain.setValueAtTime(1.1, now);
        break;
      }
      case 'bass': {
        // Pure sub bass & low frequencies
        deck.eqLow.gain.setValueAtTime(5.0, now);
        deck.eqMid.gain.setValueAtTime(-40.0, now);
        deck.eqHigh.gain.setValueAtTime(-40.0, now);
        deck.stemFilterNode.type = 'lowpass';
        deck.stemFilterNode.frequency.setValueAtTime(160, now);
        deck.stemFilterNode.Q.setValueAtTime(2.5, now);
        deck.stemGainNode.gain.setValueAtTime(1.3, now);
        break;
      }
      case 'full':
      default: {
        // Restore full spectrum
        deck.eqLow.gain.setValueAtTime(0, now);
        deck.eqMid.gain.setValueAtTime(0, now);
        deck.eqHigh.gain.setValueAtTime(0, now);
        deck.stemFilterNode.type = 'allpass';
        deck.stemGainNode.gain.setValueAtTime(1.0, now);
        break;
      }
    }
  }

  // ===================== LAYER 3 (STEM / MASHUP INJECTOR) =====================

  public async loadLayer3Track(track: Track, audioBuffer?: AudioBuffer): Promise<Track> {
    await this.resume();
    this.stopLayer3();

    let buffer = audioBuffer || track.audioBuffer;
    if (!buffer && this.ctx) {
      buffer = await generateDemoTrack(this.ctx, {
        title: track.title,
        bpm: track.bpm,
        key: track.key,
        durationSec: track.duration || 60,
        genre: track.bpm > 128 ? 'techno' : 'house',
      });
    }

    if (!buffer) throw new Error('Could not load buffer for Layer 3');

    const updatedTrack: Track = {
      ...track,
      duration: buffer.duration,
      audioBuffer: buffer,
    };

    this.layer3.buffer = buffer;
    this.layer3.currentTrack = updatedTrack;
    this.layer3.pauseOffset = 0;

    this.setLayer3StemMode(this.layer3.stemMode || 'vocals');

    return updatedTrack;
  }

  public playLayer3() {
    this.resume();
    if (!this.layer3.buffer || !this.ctx || this.layer3.isPlaying) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.layer3.buffer;
    source.playbackRate.value = this.layer3.playbackRate;
    source.loop = true;

    source.connect(this.layer3.filterNode);

    const startOffset = Math.max(0, Math.min(this.layer3.pauseOffset, this.layer3.buffer.duration));
    source.start(0, startOffset);

    this.layer3.source = source;
    this.layer3.startTime = this.ctx.currentTime - startOffset / this.layer3.playbackRate;
    this.layer3.isPlaying = true;
  }

  public pauseLayer3() {
    if (!this.layer3.isPlaying || !this.layer3.source || !this.ctx) return;
    this.layer3.pauseOffset = this.getLayer3CurrentTime();
    try {
      this.layer3.source.stop();
      this.layer3.source.disconnect();
    } catch {
      // ignore
    }
    this.layer3.source = null;
    this.layer3.isPlaying = false;
  }

  public stopLayer3() {
    if (this.layer3.source) {
      try {
        this.layer3.source.stop();
        this.layer3.source.disconnect();
      } catch {
        // ignore
      }
      this.layer3.source = null;
    }
    this.layer3.isPlaying = false;
    this.layer3.pauseOffset = 0;
  }

  public setLayer3Volume(vol: number) {
    if (this.layer3.gainNode && this.ctx) {
      this.layer3.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1.2, vol)), this.ctx.currentTime);
    }
  }

  public setLayer3PlaybackRate(rate: number) {
    this.layer3.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    if (this.layer3.source && this.ctx) {
      this.layer3.source.playbackRate.setValueAtTime(this.layer3.playbackRate, this.ctx.currentTime);
    }
  }

  public setLayer3StemMode(mode: StemMode) {
    if (!this.ctx || !this.layer3.filterNode) return;
    this.layer3.stemMode = mode;
    const now = this.ctx.currentTime;

    switch (mode) {
      case 'vocals': {
        this.layer3.filterNode.type = 'bandpass';
        this.layer3.filterNode.frequency.setValueAtTime(1800, now);
        this.layer3.filterNode.Q.setValueAtTime(0.7, now);
        break;
      }
      case 'beat': {
        this.layer3.filterNode.type = 'peaking';
        this.layer3.filterNode.frequency.setValueAtTime(90, now);
        this.layer3.filterNode.gain.setValueAtTime(6.0, now);
        break;
      }
      case 'bass': {
        this.layer3.filterNode.type = 'lowpass';
        this.layer3.filterNode.frequency.setValueAtTime(160, now);
        this.layer3.filterNode.Q.setValueAtTime(2.0, now);
        break;
      }
      case 'full':
      default: {
        this.layer3.filterNode.type = 'allpass';
        break;
      }
    }
  }

  public getLayer3CurrentTime(): number {
    if (!this.layer3.buffer) return 0;
    if (this.layer3.isPlaying && this.ctx) {
      const current = (this.ctx.currentTime - this.layer3.startTime) * this.layer3.playbackRate;
      return current % this.layer3.buffer.duration;
    }
    return this.layer3.pauseOffset;
  }

  public getLayer3Level(): number {
    if (!this.layer3.analyser || !this.layer3.isPlaying) return 0;
    const data = new Uint8Array(this.layer3.analyser.frequencyBinCount);
    this.layer3.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return Math.min(1.0, (sum / data.length / 255) * 1.8 * this.layer3.gainNode.gain.value);
  }

  // ===================== PLAYBACK CONTROLS =====================

  public playDeck(deckId: DeckId) {
    this.resume();
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.buffer || !this.ctx) return;

    if (deck.isPlaying) return;

    const source = this.ctx.createBufferSource();
    source.buffer = deck.buffer;
    source.playbackRate.value = deck.playbackRate;

    // Apply pitch detune in cents (1 semitone = 100 cents)
    if (source.detune) {
      source.detune.value = (deck.pitchSemitones || 0) * 100;
    }

    if (deck.isLooping && deck.loopEnd > deck.loopStart) {
      source.loop = true;
      source.loopStart = deck.loopStart;
      source.loopEnd = deck.loopEnd;
    }

    source.connect(deck.trimNode);

    const startOffset = Math.max(0, Math.min(deck.pauseOffset, deck.buffer.duration));
    source.start(0, startOffset);

    deck.source = source;
    deck.startTime = this.ctx.currentTime - startOffset / deck.playbackRate;
    deck.isPlaying = true;

    source.onended = () => {
      if (
        deck.isPlaying &&
        !deck.isLooping &&
        this.getDeckCurrentTime(deckId) >= deck.buffer!.duration - 0.1
      ) {
        deck.isPlaying = false;
        deck.pauseOffset = 0;
      }
    };
  }

  public pauseDeck(deckId: DeckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.isPlaying || !deck.source || !this.ctx) return;

    deck.pauseOffset = this.getDeckCurrentTime(deckId);
    try {
      deck.source.stop();
      deck.source.disconnect();
    } catch {
      // ignore
    }
    deck.source = null;
    deck.isPlaying = false;
  }

  public stopDeck(deckId: DeckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (deck.source) {
      try {
        deck.source.stop();
        deck.source.disconnect();
      } catch {
        // ignore
      }
      deck.source = null;
    }
    deck.isPlaying = false;
    deck.pauseOffset = 0;
  }

  public seekDeck(deckId: DeckId, time: number) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.buffer) return;

    const clampedTime = Math.max(0, Math.min(time, deck.buffer.duration));
    const wasPlaying = deck.isPlaying;

    if (wasPlaying) {
      this.pauseDeck(deckId);
      deck.pauseOffset = clampedTime;
      this.playDeck(deckId);
    } else {
      deck.pauseOffset = clampedTime;
    }
  }

  public getDeckCurrentTime(deckId: DeckId): number {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.buffer) return 0;

    if (deck.isPlaying && this.ctx) {
      if (deck.isLooping && deck.loopEnd > deck.loopStart) {
        const loopDur = deck.loopEnd - deck.loopStart;
        const totalPlayed = (this.ctx.currentTime - deck.startTime) * deck.playbackRate;
        if (totalPlayed >= deck.loopStart) {
          const offsetInLoop = (totalPlayed - deck.loopStart) % loopDur;
          return deck.loopStart + offsetInLoop;
        }
      }
      const current = (this.ctx.currentTime - deck.startTime) * deck.playbackRate;
      return Math.min(current, deck.buffer.duration);
    }
    return deck.pauseOffset;
  }

  // ===================== PITCH & TEMPO & SYNC =====================

  public setPlaybackRate(deckId: DeckId, rate: number) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    deck.playbackRate = clampedRate;

    if (deck.isPlaying && deck.source && this.ctx) {
      deck.source.playbackRate.setValueAtTime(clampedRate, this.ctx.currentTime);
    }
  }

  public setDeckPitchSemitones(deckId: DeckId, semitones: number) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const clamped = Math.max(-12, Math.min(12, semitones));
    deck.pitchSemitones = clamped;

    if (deck.isPlaying && deck.source && deck.source.detune && this.ctx) {
      deck.source.detune.setValueAtTime(clamped * 100, this.ctx.currentTime);
    }
  }

  public getDeckPitchSemitones(deckId: DeckId): number {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    return deck?.pitchSemitones || 0;
  }

  public setDeckKeyLock(deckId: DeckId, enabled: boolean) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (deck) {
      deck.keyLock = enabled;
    }
  }

  public syncDecks(targetDeckId: DeckId, masterDeckId: DeckId) {
    const masterDeck = masterDeckId === 'A' ? this.deckA : this.deckB;
    const targetDeck = targetDeckId === 'A' ? this.deckA : this.deckB;

    if (!masterDeck.currentTrack || !targetDeck.currentTrack) return;

    const masterBpm = masterDeck.currentTrack.bpm * masterDeck.playbackRate;
    const targetOriginalBpm = targetDeck.currentTrack.bpm;
    const neededRate = masterBpm / targetOriginalBpm;

    this.setPlaybackRate(targetDeckId, neededRate);

    // Grid Alignment
    if (masterDeck.isPlaying && targetDeck.isPlaying && this.ctx) {
      const masterPos = this.getDeckCurrentTime(masterDeckId);
      const masterSecondsPerBeat = 60 / masterBpm;
      const beatProgress = (masterPos % masterSecondsPerBeat) / masterSecondsPerBeat;

      const targetPos = this.getDeckCurrentTime(targetDeckId);
      const targetSecondsPerBeat = 60 / (targetOriginalBpm * targetDeck.playbackRate);
      const targetBeatPhase = (targetPos % targetSecondsPerBeat) / targetSecondsPerBeat;

      const phaseDiff = beatProgress - targetBeatPhase;
      if (Math.abs(phaseDiff) > 0.05) {
        this.seekDeck(targetDeckId, Math.max(0, targetPos + phaseDiff * targetSecondsPerBeat));
      }
    }
  }

  // ===================== LOOPS =====================

  public setLoopLength(deckId: DeckId, lengthInBeats: LoopLength, bpm: number) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const effectiveBpm = bpm * deck.playbackRate;
    const secondsPerBeat = 60 / (effectiveBpm || 128);
    const loopDurationSec = lengthInBeats * secondsPerBeat;

    const currentPos = this.getDeckCurrentTime(deckId);
    const snappedStart = Math.floor(currentPos / secondsPerBeat) * secondsPerBeat;
    const loopEnd = snappedStart + loopDurationSec;

    deck.loopStart = snappedStart;
    deck.loopEnd = loopEnd;
    deck.isLooping = true;

    if (deck.isPlaying && deck.source) {
      deck.source.loop = true;
      deck.source.loopStart = snappedStart;
      deck.source.loopEnd = loopEnd;
    }
  }

  public toggleLoop(deckId: DeckId, enable?: boolean) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const shouldLoop = enable !== undefined ? enable : !deck.isLooping;
    deck.isLooping = shouldLoop;

    if (deck.isPlaying && deck.source) {
      deck.source.loop = shouldLoop;
      if (shouldLoop && deck.loopEnd > deck.loopStart) {
        deck.source.loopStart = deck.loopStart;
        deck.source.loopEnd = deck.loopEnd;
      }
    }
  }

  public setManualLoopIn(deckId: DeckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    deck.loopStart = this.getDeckCurrentTime(deckId);
  }

  public setManualLoopOut(deckId: DeckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const pos = this.getDeckCurrentTime(deckId);
    if (pos > deck.loopStart) {
      deck.loopEnd = pos;
      deck.isLooping = true;
      if (deck.isPlaying && deck.source) {
        deck.source.loop = true;
        deck.source.loopStart = deck.loopStart;
        deck.source.loopEnd = deck.loopEnd;
      }
    }
  }

  // ===================== MIXER & EQ =====================

  public setGainTrim(deckId: DeckId, value: number) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    deck.trimNode.gain.setValueAtTime(Math.max(0, Math.min(2, value)), this.ctx?.currentTime || 0);
  }

  public setChannelVolume(deckId: DeckId, value: number) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    deck.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, value)), this.ctx?.currentTime || 0);
  }

  public setEQ(deckId: DeckId, band: 'low' | 'mid' | 'high', dB: number, kill: boolean = false) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const targetValue = kill ? -60 : Math.max(-24, Math.min(6, dB));
    const now = this.ctx?.currentTime || 0;

    if (band === 'low') deck.eqLow.gain.setValueAtTime(targetValue, now);
    if (band === 'mid') deck.eqMid.gain.setValueAtTime(targetValue, now);
    if (band === 'high') deck.eqHigh.gain.setValueAtTime(targetValue, now);
  }

  public setFilter(deckId: DeckId, value: number) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const now = this.ctx?.currentTime || 0;

    if (Math.abs(value) < 3) {
      deck.filterNode.type = 'allpass';
      deck.filterNode.frequency.setValueAtTime(1000, now);
    } else if (value < 0) {
      deck.filterNode.type = 'lowpass';
      const norm = (100 + value) / 100;
      const freq = 100 * Math.pow(200, norm);
      deck.filterNode.frequency.setValueAtTime(Math.max(60, Math.min(20000, freq)), now);
      deck.filterNode.Q.setValueAtTime(2.5, now);
    } else {
      deck.filterNode.type = 'highpass';
      const norm = value / 100;
      const freq = 20 * Math.pow(500, norm);
      deck.filterNode.frequency.setValueAtTime(Math.max(20, Math.min(12000, freq)), now);
      deck.filterNode.Q.setValueAtTime(2.5, now);
    }
  }

  public setCrossfader(position: number, curve: CrossfaderCurve = this.crossfaderCurve) {
    this.crossfaderPosition = Math.max(-1, Math.min(1, position));
    this.crossfaderCurve = curve;

    const pos = (this.crossfaderPosition + 1) / 2;
    const now = this.ctx?.currentTime || 0;

    let gainA = 1;
    let gainB = 1;

    switch (curve) {
      case 'linear':
        gainA = 1 - pos;
        gainB = pos;
        break;
      case 'sharp':
        gainA = pos > 0.95 ? (1 - pos) * 20 : 1;
        gainB = pos < 0.05 ? pos * 20 : 1;
        break;
      case 'constant-power':
        gainA = Math.cos(pos * 0.5 * Math.PI);
        gainB = Math.sin(pos * 0.5 * Math.PI);
        break;
      case 'smooth':
      default:
        gainA = Math.cos((pos * Math.PI) / 2);
        gainB = Math.sin((pos * Math.PI) / 2);
        break;
    }

    if (this.deckA && this.deckB) {
      this.deckA.crossfaderGain.gain.setValueAtTime(gainA, now);
      this.deckB.crossfaderGain.gain.setValueAtTime(gainB, now);
    }
  }

  public setMasterVolume(value: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1.2, value)), this.ctx.currentTime);
    }
  }

  // ===================== AUTOMATED TRANSITIONS =====================

  public async triggerTransition(
    presetId: TransitionPresetId,
    fromDeckId: DeckId,
    toDeckId: DeckId,
    durationSeconds: number,
    onProgress?: (progress: number) => void,
    onComplete?: () => void
  ) {
    await this.resume();
    this.cancelTransition();

    this.onTransitionProgress = onProgress;
    this.onTransitionComplete = onComplete;

    const fromDeck = fromDeckId === 'A' ? this.deckA : this.deckB;
    const toDeck = toDeckId === 'A' ? this.deckA : this.deckB;

    if (!toDeck.isPlaying) {
      this.playDeck(toDeckId);
    }

    this.syncDecks(toDeckId, fromDeckId);

    const startTime = performance.now();
    const durationMs = durationSeconds * 1000;

    const initialFromCrossfader = fromDeckId === 'A' ? -1 : 1;
    const targetCrossfader = fromDeckId === 'A' ? 1 : -1;

    if (presetId === 'brake-drop') {
      const originalRate = fromDeck.playbackRate;
      let brakeStep = 0;
      const brakeInterval = window.setInterval(() => {
        brakeStep += 0.05;
        if (brakeStep >= 1) {
          clearInterval(brakeInterval);
          this.pauseDeck(fromDeckId);
          this.setPlaybackRate(fromDeckId, originalRate);
        } else {
          this.setPlaybackRate(fromDeckId, Math.max(0.05, originalRate * (1 - brakeStep)));
        }
      }, 50);
    }

    const updateFrame = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      if (this.onTransitionProgress) {
        this.onTransitionProgress(progress);
      }

      this.applyTransitionPresetDSP(
        presetId,
        fromDeckId,
        toDeckId,
        progress,
        initialFromCrossfader,
        targetCrossfader
      );

      if (progress < 1) {
        this.transitionTimer = requestAnimationFrame(updateFrame);
      } else {
        this.setCrossfader(targetCrossfader);
        this.pauseDeck(fromDeckId);

        this.setEQ(fromDeckId, 'low', 0, false);
        this.setEQ(fromDeckId, 'mid', 0, false);
        this.setEQ(fromDeckId, 'high', 0, false);
        this.setFilter(fromDeckId, 0);

        if (this.onTransitionComplete) {
          this.onTransitionComplete();
        }
        this.transitionTimer = null;
      }
    };

    this.transitionTimer = requestAnimationFrame(updateFrame);
  }

  private applyTransitionPresetDSP(
    presetId: TransitionPresetId,
    fromDeckId: DeckId,
    toDeckId: DeckId,
    progress: number,
    startCross: number,
    endCross: number
  ) {
    switch (presetId) {
      case 'crossfade': {
        const curCross = startCross + (endCross - startCross) * progress;
        this.setCrossfader(curCross, 'constant-power');
        break;
      }

      case 'bass-swap': {
        const curCross = startCross + (endCross - startCross) * progress;
        this.setCrossfader(curCross, 'smooth');
        if (progress < 0.5) {
          this.setEQ(fromDeckId, 'low', 0, false);
          this.setEQ(toDeckId, 'low', -24, true);
        } else {
          this.setEQ(fromDeckId, 'low', -24, true);
          this.setEQ(toDeckId, 'low', 0, false);
        }
        break;
      }

      case 'vocal-mashup': {
        // Isolate vocals on toDeck during first half, then drop bass
        if (progress < 0.6) {
          this.setDeckStemMode(toDeckId, 'vocals');
        } else {
          this.setDeckStemMode(toDeckId, 'full');
          this.setEQ(fromDeckId, 'low', -24 * ((progress - 0.6) / 0.4));
        }
        const curCross = startCross + (endCross - startCross) * progress;
        this.setCrossfader(curCross, 'smooth');
        break;
      }

      case 'beat-inject': {
        if (progress < 0.5) {
          this.setDeckStemMode(toDeckId, 'beat');
          this.setEQ(fromDeckId, 'low', -12 * (progress / 0.5));
        } else {
          this.setDeckStemMode(toDeckId, 'full');
        }
        const curCross = startCross + (endCross - startCross) * progress;
        this.setCrossfader(curCross, 'smooth');
        break;
      }

      case 'hpf-sweep': {
        const filterVal = progress * 85;
        this.setFilter(fromDeckId, filterVal);
        const curCross = startCross + (endCross - startCross) * Math.pow(progress, 1.5);
        this.setCrossfader(curCross, 'smooth');
        break;
      }

      case 'echo-out': {
        if (progress > 0.4) {
          this.setEQ(fromDeckId, 'low', -18 * ((progress - 0.4) / 0.6));
          this.setFilter(fromDeckId, 40 * ((progress - 0.4) / 0.6));
        }
        const curCross = startCross + (endCross - startCross) * progress;
        this.setCrossfader(curCross, 'smooth');
        break;
      }

      case 'loop-roll': {
        const curCross = startCross + (endCross - startCross) * Math.pow(progress, 2);
        this.setCrossfader(curCross, 'smooth');
        break;
      }

      case 'washout': {
        this.setFilter(fromDeckId, progress * 60);
        this.setEQ(fromDeckId, 'low', -20 * progress);
        const curCross = startCross + (endCross - startCross) * progress;
        this.setCrossfader(curCross, 'smooth');
        break;
      }

      default: {
        const curCross = startCross + (endCross - startCross) * progress;
        this.setCrossfader(curCross, 'smooth');
        break;
      }
    }
  }

  public cancelTransition() {
    if (this.transitionTimer !== null) {
      cancelAnimationFrame(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  // ===================== SAMPLER =====================

  public async loadSample(padIndex: number, audioBuffer?: AudioBuffer): Promise<void> {
    await this.resume();
    if (!this.ctx) return;

    let buf = audioBuffer;
    if (!buf) {
      buf = await generateSamplerSample(this.ctx, padIndex);
    }
    if (this.samplerPads[padIndex]) {
      this.samplerPads[padIndex].buffer = buf;
    }
  }

  public triggerSample(padIndex: number, padConfig: SamplePad) {
    this.resume();
    if (!this.ctx) return;

    const pad = this.samplerPads[padIndex];
    if (!pad || !pad.buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = pad.buffer;
    source.loop = padConfig.loop;
    source.playbackRate.value = Math.pow(2, (padConfig.pitch || 0) / 12);

    pad.gain.gain.setValueAtTime(padConfig.volume ?? 0.8, this.ctx.currentTime);
    source.connect(pad.gain);
    source.start(0);
  }

  // ===================== LIVE EFFECTS ENGINE =====================

  public applyLiveEffect(setting: EffectSetting) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const targetNodes =
      setting.target === 'A'
        ? [this.deckA]
        : setting.target === 'B'
        ? [this.deckB]
        : [this.deckA, this.deckB];

    targetNodes.forEach((deck) => {
      if (!setting.enabled) return;

      switch (setting.id) {
        case 'lowpass': {
          const cutoff = 200 + setting.param1 * 18000;
          deck.filterNode.type = 'lowpass';
          deck.filterNode.frequency.setValueAtTime(cutoff, now);
          deck.filterNode.Q.setValueAtTime(1 + setting.param2 * 15, now);
          break;
        }
        case 'highpass': {
          const cutoff = 20 + setting.param1 * 8000;
          deck.filterNode.type = 'highpass';
          deck.filterNode.frequency.setValueAtTime(cutoff, now);
          deck.filterNode.Q.setValueAtTime(1 + setting.param2 * 15, now);
          break;
        }
        case 'bandpass': {
          const cutoff = 200 + setting.param1 * 6000;
          deck.filterNode.type = 'bandpass';
          deck.filterNode.frequency.setValueAtTime(cutoff, now);
          deck.filterNode.Q.setValueAtTime(1 + setting.param2 * 20, now);
          break;
        }
      }
    });
  }

  // ===================== VISUALIZERS & VU METERS =====================

  public getDeckAnalyser(deckId: DeckId): AnalyserNode | null {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    return deck?.analyser || null;
  }

  public getDeckSpectralMetrics(deckId: DeckId): {
    harmonicIntensity: number; // 0 - 100
    rhythmicDensity: number; // 0 - 100
    subBass: number; // 0 - 100
    midHarmonics: number; // 0 - 100
    highAir: number; // 0 - 100
    frequencyBands: number[]; // 16 normalized bands (0-1)
    chromaEnergy: number[]; // 12-pitch classes (C, C#, ... B)
    isPlaying: boolean;
  } {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck || !deck.analyser || !deck.isPlaying) {
      return {
        harmonicIntensity: 0,
        rhythmicDensity: 0,
        subBass: 0,
        midHarmonics: 0,
        highAir: 0,
        frequencyBands: new Array(16).fill(0),
        chromaEnergy: new Array(12).fill(0),
        isPlaying: false,
      };
    }

    const binCount = deck.analyser.frequencyBinCount;
    const freqData = new Uint8Array(binCount);
    deck.analyser.getByteFrequencyData(freqData);

    const timeData = new Uint8Array(binCount);
    deck.analyser.getByteTimeDomainData(timeData);

    // 1. Calculate 16 grouped frequency bands
    const numBands = 16;
    const bandsPerGroup = Math.max(1, Math.floor(binCount / numBands));
    const frequencyBands: number[] = [];

    for (let b = 0; b < numBands; b++) {
      let groupSum = 0;
      const start = b * bandsPerGroup;
      const end = Math.min(binCount, start + bandsPerGroup);
      for (let i = start; i < end; i++) {
        groupSum += freqData[i];
      }
      const val = end > start ? groupSum / (end - start) / 255 : 0;
      frequencyBands.push(Number(val.toFixed(3)));
    }

    // 2. Specific audio frequency ranges
    // Sub-bass: bins 0 to 4 (approx 20 - 180Hz)
    let subSum = 0;
    for (let i = 0; i < Math.min(5, binCount); i++) subSum += freqData[i];
    const subBass = Math.min(100, Math.round((subSum / 5 / 255) * 120));

    // Mid harmonics (vocal / lead / chord range): bins 6 to 32 (approx 250Hz - 2500Hz)
    let midSum = 0;
    const midCount = Math.min(27, Math.max(1, binCount - 6));
    for (let i = 6; i < 6 + midCount; i++) midSum += freqData[i];
    const midHarmonics = Math.min(100, Math.round((midSum / midCount / 255) * 115));

    // High Air: bins 35 to 80 (approx 3kHz - 12kHz)
    let highSum = 0;
    const highCount = Math.min(45, Math.max(1, binCount - 35));
    for (let i = 35; i < 35 + highCount; i++) highSum += freqData[i];
    const highAir = Math.min(100, Math.round((highSum / highCount / 255) * 120));

    // 3. Harmonic Intensity: RMS power in mid-high harmonics + tonal stability
    const harmonicIntensity = Math.min(100, Math.max(0, Math.round(midHarmonics * 0.7 + highAir * 0.3)));

    // 4. Rhythmic Density: Sub-bass punch + Transient fluctuations in time domain
    let zeroCrossings = 0;
    let timeVar = 0;
    for (let i = 1; i < binCount; i++) {
      const diff = Math.abs(timeData[i] - 128);
      timeVar += diff;
      if ((timeData[i] >= 128 && timeData[i - 1] < 128) || (timeData[i] < 128 && timeData[i - 1] >= 128)) {
        zeroCrossings++;
      }
    }
    const transientPower = Math.min(100, Math.round((timeVar / binCount / 64) * 100));
    const rhythmicDensity = Math.min(100, Math.max(0, Math.round(subBass * 0.5 + transientPower * 0.5)));

    // 5. 12-Tone Chroma estimation across bins
    const chroma = new Array(12).fill(0);
    const sampleRate = this.ctx?.sampleRate || 44100;
    const fftSize = deck.analyser.fftSize;

    for (let i = 1; i < binCount; i++) {
      const mag = freqData[i] / 255;
      if (mag > 0.1) {
        const freq = (i * sampleRate) / fftSize;
        if (freq >= 65 && freq <= 2500) {
          const midi = Math.round(12 * Math.log2(freq / 440) + 69);
          const pitchClass = ((midi % 12) + 12) % 12;
          chroma[pitchClass] += mag;
        }
      }
    }
    // Normalize chroma (0-1)
    const maxChroma = Math.max(0.001, ...chroma);
    const chromaEnergy = chroma.map((c) => Number((c / maxChroma).toFixed(3)));

    return {
      harmonicIntensity,
      rhythmicDensity,
      subBass,
      midHarmonics,
      highAir,
      frequencyBands,
      chromaEnergy,
      isPlaying: true,
    };
  }

  public getDeckLevel(deckId: DeckId): number {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck || !deck.analyser || !deck.isPlaying) return 0;

    const data = new Uint8Array(deck.analyser.frequencyBinCount);
    deck.analyser.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length / 255;
    return Math.min(1.0, avg * 1.8 * deck.gainNode.gain.value);
  }

  public getMasterLevel(): { left: number; right: number } {
    if (!this.masterAnalyser) return { left: 0, right: 0 };
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);

    let sumL = 0;
    let sumR = 0;
    const half = Math.floor(data.length / 2);

    for (let i = 0; i < half; i++) sumL += data[i];
    for (let i = half; i < data.length; i++) sumR += data[i];

    const l = Math.min(1.0, (sumL / half / 255) * 1.6);
    const r = Math.min(1.0, (sumR / (data.length - half) / 255) * 1.6);

    return { left: l, right: r };
  }

  // ===================== SET RECORDER =====================

  public startRecording() {
    if (!this.recorderDest) return;
    this.recordedChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.recorderDest.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start(100);
    } catch {
      this.mediaRecorder = new MediaRecorder(this.recorderDest.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start(100);
    }
  }

  public stopRecording(): Blob | null {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      this.recordedChunks = [];
      return blob;
    }
    return null;
  }

  // ===================== AUDITION & CUE PREVIEW =====================

  public async playAuditionTrack(
    track: Track,
    onEnded?: () => void,
    startOffset: number = 16,
    duration: number = 12
  ): Promise<void> {
    await this.resume();
    if (!this.ctx) return;

    this.stopAudition();

    // Ensure audio buffer exists
    let buffer = track.audioBuffer;
    if (!buffer) {
      buffer = await generateDemoTrack(this.ctx, {
        title: track.title,
        bpm: track.bpm,
        key: track.key,
        durationSec: track.duration,
        genre: track.bpm > 160 ? 'dnb' : track.bpm > 130 ? 'techno' : 'house',
      });
      track.audioBuffer = buffer;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.auditionGain);

    const safeStart = Math.min(startOffset, Math.max(0, buffer.duration - duration - 1));
    source.start(0, safeStart, duration);
    this.auditionSource = source;

    source.onended = () => {
      this.auditionSource = null;
      if (onEnded) onEnded();
    };

    if (this.auditionTimer) {
      window.clearTimeout(this.auditionTimer);
    }
    this.auditionTimer = window.setTimeout(() => {
      this.stopAudition();
      if (onEnded) onEnded();
    }, duration * 1000);
  }

  public stopAudition(): void {
    if (this.auditionTimer) {
      window.clearTimeout(this.auditionTimer);
      this.auditionTimer = null;
    }
    if (this.auditionSource) {
      try {
        this.auditionSource.stop();
        this.auditionSource.disconnect();
      } catch {
        // Ignored if already stopped
      }
      this.auditionSource = null;
    }
  }

  public getAuditionLevel(): number {
    if (!this.auditionAnalyser || !this.auditionSource) return 0;
    const data = new Uint8Array(this.auditionAnalyser.frequencyBinCount);
    this.auditionAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return Math.min(1.0, (sum / data.length / 255) * 2.0);
  }
}

// Export singleton instance
export const audioEngine = new AudioEngine();
