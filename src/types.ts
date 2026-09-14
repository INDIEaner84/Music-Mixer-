export type DeckId = 'A' | 'B';

export type CrossfaderCurve = 'linear' | 'smooth' | 'sharp' | 'constant-power';

export type LoopLength = 0.03125 | 0.0625 | 0.125 | 0.25 | 0.5 | 1 | 2 | 4 | 8 | 16 | 32;

export type StemMode = 'full' | 'vocals' | 'beat' | 'bass';

export type GrooveType = 'rolling' | 'driving' | 'bouncy' | 'syncopated' | 'atmospheric' | 'hypnotic';
export type EmotionalTone = 'euphoric' | 'dark' | 'hypnotic' | 'melancholic' | 'uplifting' | 'raw' | 'warm';
export type VocalDensity = 'none' | 'low' | 'medium' | 'high' | 'acapella_drops';

export interface TrackStructure {
  intro: [number, number];
  build: [number, number];
  drop: [number, number];
  breakdown: [number, number];
  climax: [number, number];
  outro: [number, number];
  transitionPoints: number[];
}

export interface TrackIntelligence {
  energy: number; // 0 - 100
  danceability: number; // 0 - 100
  groove: GrooveType;
  intensity: number; // 0 - 100
  vocalDensity: VocalDensity;
  rhythmicDensity: number; // 0 - 100
  harmonicTension: number; // 0 - 100
  emotionalTone: EmotionalTone;
  atmosphere: string;
  genre: string;
  camelotKey: string;
  structure?: TrackStructure;
  spaceCoords: {
    x: number; // -1 (Low Groove / Deep Atmosphere) to +1 (High Groove / Driving Funk)
    y: number; // -1 (Low Energy / Ambient) to +1 (High Energy / Peak Club)
  };
  tags?: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  originalBpm: number;
  key: string;
  duration: number; // in seconds
  audioBuffer?: AudioBuffer;
  waveformData?: number[];
  color?: string;
  sourceType: 'demo' | 'custom' | 'generated_mix';
  intelligence?: TrackIntelligence;
}

export interface HotCue {
  id: number;
  position: number; // in seconds
  color: string;
}

export interface DeckState {
  id: DeckId;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  pitchSemitones: number;
  keyLock: boolean;
  bpm: number;
  volume: number; // 0 to 1
  gain: number; // 0 to 2 (trim)
  high: number; // -24 to +6 dB
  mid: number; // -24 to +6 dB
  low: number; // -24 to +6 dB
  highKill: boolean;
  midKill: boolean;
  lowKill: boolean;
  filter: number; // -100 (LPF) to 0 (off) to +100 (HPF)
  filterResonance: number;
  stemMode: StemMode; // 'full' | 'vocals' | 'beat' | 'bass'
  isLooping: boolean;
  loopLength: LoopLength;
  loopStart: number;
  loopEnd: number;
  hotCues: (HotCue | null)[];
  isScratching: boolean;
  isCueing: boolean;
  cuePosition: number;
  isMaster: boolean;
  isSynced: boolean;
  pfl: boolean; // Pre-fade listen (headphones)
}

export interface StemLayerState {
  id: 'STEM_LAYER_3';
  track: Track | null;
  isPlaying: boolean;
  stemMode: StemMode;
  volume: number;
  bpm: number;
  isSynced: boolean;
  currentTime: number;
  duration: number;
}

export interface HarmonicDelta {
  fromKey: string;
  fromCamelot: string;
  toKey: string;
  toCamelot: string;
  semitoneDelta: number; // e.g. 0, +1, +2, -1, etc.
  camelotShift: number; // circle of fifths distance e.g. +1, -1, 0
  relationshipType: 'perfect' | 'relative' | 'dominant' | 'subdominant' | 'energy_boost' | 'diagonal' | 'dissonant';
  relationshipLabel: string; // e.g. "+1 Quinte (Dominante)", "Parallel Dur/Moll", "Energie-Sprung (+2 Halbtöne)"
  compatibilityScore: number; // 0 - 100%
  energyDeltaPercent: number; // e.g. +15% or -8%
  bpmDelta: number; // e.g. +2.0 BPM
}

export interface TransitionEvent {
  id: string;
  setId?: string; // Links event to a specific recorded session/set
  timestamp: string; // Clock time e.g. "14:32:05"
  sessionElapsedSeconds: number; // Seconds since session started e.g. 165
  formattedTime: string; // "02:45"
  fromDeck: DeckId;
  toDeck: DeckId;
  fromTrack: {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    effectiveBpm: number;
    key: string;
    camelotKey: string;
    pitchSemitones?: number;
    energy?: number;
  };
  toTrack: {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    effectiveBpm: number;
    key: string;
    camelotKey: string;
    pitchSemitones?: number;
    energy?: number;
  };
  layer3Stem?: {
    title: string;
    mode: StemMode;
  };
  presetId: TransitionPresetId | string;
  presetName: string;
  durationSeconds: number;
  harmonicDelta: HarmonicDelta;
  audioPreviewUrl?: string;
  wasAutoMix?: boolean;
  futureStrategy?: FutureStrategyType;
  notes?: string;
}

export interface PastSetSession {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  trackCount: number;
  transitionsCount: number;
  averageBpm: number;
  averageHarmonicScore: number;
  energyFlow: { timestamp: number; energy: number; trackTitle: string }[];
  tracksPlayed: Track[];
  transitions: TransitionEvent[];
  audioUrl?: string;
  blob?: Blob;
  isCurrentSession?: boolean;
}

export interface MixRecordingItem {
  id: string;
  title: string;
  createdAt: string;
  durationSeconds: number;
  bpm: number;
  key: string;
  sourceTracks: {
    deckA?: string;
    deckB?: string;
    layer3?: string;
    presetUsed?: string;
  };
  harmonicDelta?: HarmonicDelta;
  transitionEvents?: TransitionEvent[];
  setId?: string;
  blob?: Blob;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  waveformData?: number[];
}

export type EffectType =
  | 'echo'
  | 'reverb'
  | 'flanger'
  | 'phaser'
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'bitcrusher'
  | 'distortion'
  | 'gater'
  | 'autopan'
  | 'pitchshift';

export interface EffectSetting {
  id: EffectType;
  name: string;
  category: 'time' | 'modulation' | 'filter' | 'distortion';
  enabled: boolean;
  target: 'A' | 'B' | 'MASTER';
  wet: number; // 0 - 1
  param1: number; // 0 - 1
  param2: number; // 0 - 1
  param1Label: string;
  param2Label: string;
}

export type TransitionPresetId =
  | 'crossfade'
  | 'bass-swap'
  | 'echo-out'
  | 'hpf-sweep'
  | 'brake-drop'
  | 'loop-roll'
  | 'washout'
  | 'flanger-fade'
  | 'backspin'
  | 'stutter-cut'
  | 'vocal-mashup'
  | 'beat-inject';

export interface TransitionCurvePoint {
  timeRatio: number; // 0 to 1
  deckAGain: number; // 0 to 1
  deckBGain: number; // 0 to 1
  deckALow: number;  // -24 to +6 dB
  deckBLow: number;  // -24 to +6 dB
  deckAFilter: number; // -100 to +100
  deckBFilter: number; // -100 to +100
  fxIntensity: number; // 0 to 1
}

export interface TransitionPreset {
  id: TransitionPresetId;
  name: string;
  germanName: string;
  description: string;
  iconName: string;
  defaultDurationBars: number;
  category: 'Smooth' | 'Energetic' | 'Club FX' | 'Drop' | 'Mashup';
  explanation: {
    howItWorks: string;
    stepByStep: string[];
    bestFor: string;
    dspActions: string[];
  };
  curves: TransitionCurvePoint[];
}

export interface TransitionState {
  isActive: boolean;
  preset: TransitionPresetId;
  fromDeck: DeckId;
  toDeck: DeckId;
  progress: number; // 0 to 1
  durationSeconds: number;
  elapsedSeconds: number;
}

export interface SamplePad {
  id: number;
  name: string;
  category: string;
  color: string;
  keyTrigger: string;
  volume: number;
  pitch: number;
  loop: boolean;
  audioBuffer?: AudioBuffer;
  isPlaying: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  tracks: Track[];
}

// ==========================================
// COGNITIVE MUSIC & AI CO-PILOT TYPES
// ==========================================

export type SetDirection = 'flowing' | 'building' | 'peaking' | 'cooling' | 'shifting' | 'hypnotic';
export type SetPhase = 'warmup' | 'buildup' | 'peak' | 'breakdown' | 'afterhours';

export interface SetState {
  energy: number; // 0 - 100
  tension: number; // 0 - 100
  density: number; // 0 - 100
  mood: EmotionalTone;
  groove: GrooveType;
  harmonicStability: 'high' | 'medium' | 'experimental';
  direction: SetDirection;
  phase: SetPhase;
  elapsedMinutes: number;
  playedTrackCount: number;
  bpm: number;
}

export type FutureStrategyType = 'flow' | 'build' | 'shift' | 'surprise' | 'hybrid';

export interface TransitionStrategyRecommendation {
  presetId: TransitionPresetId;
  strategyName: 'blend' | 'build' | 'cut';
  germanStrategyTitle: string;
  rationale: string;
  stepRecipe: string[];
}

export interface MusicalFutureOption {
  id: string;
  strategy: FutureStrategyType;
  badgeLabel: string;
  headline: string;
  feeling: string;
  explanation: string;
  track: Track;
  mashupTrack?: Track; // Used when combining A + C
  compatibilityScore: number; // 0 - 100%
  harmonicMatch: string; // e.g. "Camelot 8A ➔ 8A (Perfekt Harmonisch)"
  energyDelta: string; // e.g. "+15% Energie-Steigerung"
  bpmDelta: string; // e.g. "+2 BPM (128 ➔ 130)"
  recommendedTransition: TransitionStrategyRecommendation;
  cognitiveRationale: {
    rhythmImpact: string;
    vocalTension: string;
    crowdEffect: string;
  };
}

export interface CrowdState {
  engagement: number; // 0 - 100%
  movement: number; // 0 - 100%
  attention: number; // 0 - 100%
  fatigue: number; // 0 - 100%
  responseToBuildup: 'extatisch' | 'stark' | 'aufmerksam' | 'ermüdend' | 'wartend';
  vibeDescription: string;
  coPilotAdvisory: string;
}

export interface MusicalDNA {
  continuity: number; // 0.0 - 1.0
  experimentation: number; // 0.0 - 1.0
  energy_growth: number; // 0.0 - 1.0
  harmonic_matching: number; // 0.0 - 1.0
  genre_stability: number; // 0.0 - 1.0
  surprise: number; // 0.0 - 1.0
  decisionHistory: {
    timestamp: number;
    strategy: FutureStrategyType;
    trackTitle: string;
    energy: number;
  }[];
}

export interface SetJourneyPoint {
  index: number;
  trackTitle: string;
  artist: string;
  energy: number;
  tension: number;
  timeLabel: string;
  isPast: boolean;
  isCurrent: boolean;
  strategy?: FutureStrategyType;
  color?: string;
}

export interface AuditionState {
  isPlaying: boolean;
  trackId: string | null;
  futureId: string | null;
  progress: number;
  duration: number;
  mode: 'single' | 'mashup' | 'transition_preview';
}

export type InterfaceMode =
  | 'cognitive' // 🧠 Cognitive Co-Pilot (Set State + 3 Futures + Journey + Transition Path)
  | 'casual'    // 🎉 Party Host / Einsteiger Modus (Einfaches Dashboard für Nicht-Musiker)
  | 'space'     // 🌌 2D Musical Discovery Space Canvas
  | 'copilot'   // 🤖 AI Assistant Narrative & Intent Control Center
  | 'classic'   // 🎛️ Classic Dual Decks + Mixer + Platters
  | 'playlist'  // 📑 Vertical Expandable Decks Playlist
  | 'hybrid';   // ⚡ Hybrid Custom Layout

export interface HybridLayoutSettings {
  showDecks: boolean;
  showFutures: boolean;
  showJourney: boolean;
  showSpace: boolean;
  showCrowd: boolean;
  showStemLayer: boolean;
  showTransitionGuide: boolean;
}

