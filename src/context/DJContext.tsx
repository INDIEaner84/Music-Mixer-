import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import {
  calculateCrowdState,
  computeSetState,
  generateEnergyJourney,
  generateMusicalFutures,
  parseMusicalIntent,
  updateMusicalDNA,
} from '../audio/cognitiveEngine';
import { DEFAULT_EFFECTS, DEFAULT_SAMPLER_PADS, TRANSITION_PRESETS } from '../audio/defaultPresets';
import { DEFAULT_TRACKS } from '../audio/defaultTracks';
import { calculateHarmonicKeyMatch, calculateTransitionHarmonicDelta, getShiftedKey } from '../audio/harmonicUtils';
import {
  AuditionState,
  CrossfaderCurve,
  CrowdState,
  DeckId,
  DeckState,
  EffectSetting,
  EffectType,
  FutureStrategyType,
  HarmonicDelta,
  HotCue,
  HybridLayoutSettings,
  InterfaceMode,
  LoopLength,
  MixRecordingItem,
  MusicalDNA,
  MusicalFutureOption,
  PastSetSession,
  Playlist,
  SamplePad,
  SetJourneyPoint,
  SetState,
  StemLayerState,
  StemMode,
  Track,
  TransitionEvent,
  TransitionPresetId,
  TransitionState,
} from '../types';

interface DJContextType {
  deckA: DeckState;
  deckB: DeckState;
  stemLayer: StemLayerState;
  crossfader: number;
  crossfaderCurve: CrossfaderCurve;
  masterVolume: number;
  isRecording: boolean;
  recordingDuration: number;
  recordedAudioUrl: string | null;
  transition: TransitionState;
  effects: EffectSetting[];
  samplerPads: SamplePad[];
  trackLibrary: Track[];
  mixLibrary: MixRecordingItem[];
  isAudioInitialized: boolean;
  showShortcutsModal: boolean;
  vuLevels: {
    deckA: number;
    deckB: number;
    layer3: number;
    masterL: number;
    masterR: number;
    audition: number;
  };

  // Playlists & Track Stack Decks
  playlists: Playlist[];
  activePlaylistId: string;
  expandedTrackIds: string[];
  autoMixActive: boolean;
  autoMixIntervalBars: number;
  autoMixPreset: TransitionPresetId;

  // ==========================================
  // COGNITIVE MUSIC & AI CO-PILOT STATE
  // ==========================================
  interfaceMode: InterfaceMode;
  hybridLayout: HybridLayoutSettings;
  setState: SetState;
  musicalFutures: {
    flow: MusicalFutureOption;
    build: MusicalFutureOption;
    shift: MusicalFutureOption;
    surprise: MusicalFutureOption;
    hybrid: MusicalFutureOption;
  };
  crowdState: CrowdState;
  musicalDNA: MusicalDNA;
  setJourney: SetJourneyPoint[];
  auditionState: AuditionState;
  intentPrompt: string;
  coPilotMessage: string;
  setInterfaceMode: (mode: InterfaceMode) => void;
  setHybridLayout: (settings: Partial<HybridLayoutSettings>) => void;
  playAudition: (track: Track, futureId?: string, duration?: number) => Promise<void>;
  stopAudition: () => void;
  applyMusicalFuture: (futureOption: MusicalFutureOption, targetDeck?: DeckId) => Promise<void>;
  applyImmediateTransitionToFuture: (futureOption: MusicalFutureOption) => Promise<void>;
  submitMusicalIntent: (intentText: string) => void;
  triggerSurpriseRoute: () => Promise<void>;
  triggerHybridMashup: () => Promise<void>;
  adjustSetDirectParameters: (params: { energy?: number; tension?: number; groove?: string }) => void;

  // Actions
  initAudio: () => Promise<void>;
  loadTrackToDeck: (deckId: DeckId, track: Track, file?: File) => Promise<void>;
  importUserTrack: (file: File) => Promise<Track>;
  togglePlay: (deckId: DeckId) => void;
  cueDeck: (deckId: DeckId) => void;
  seekDeck: (deckId: DeckId, time: number) => void;
  setPitchRate: (deckId: DeckId, rate: number) => void;
  nudgePitch: (deckId: DeckId, delta: number) => void;
  syncDecks: (deckId: DeckId) => void;
  setMasterDeck: (deckId: DeckId) => void;
  toggleKeyLock: (deckId: DeckId) => void;
  toggleHarmonicLock: (deckId: DeckId) => void;
  setDeckPitchSemitones: (deckId: DeckId, semitones: number) => void;
  syncDeckKey: (targetDeckId: DeckId) => void;
  resetDeckPitch: (deckId: DeckId) => void;
  setHotCue: (deckId: DeckId, index: number) => void;
  jumpHotCue: (deckId: DeckId, index: number) => void;
  clearHotCue: (deckId: DeckId, index: number) => void;
  setLoopLength: (deckId: DeckId, length: LoopLength) => void;
  toggleLoop: (deckId: DeckId) => void;
  setLoopIn: (deckId: DeckId) => void;
  setLoopOut: (deckId: DeckId) => void;
  setDeckStemMode: (deckId: DeckId, mode: StemMode) => void;

  // Playlist Management
  createPlaylist: (name: string, description?: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  setActivePlaylistId: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
  toggleExpandTrack: (trackId: string) => void;
  expandAllTracks: () => void;
  collapseAllTracks: () => void;
  loadTrackToAvailableDeck: (track: Track, preferredDeck?: DeckId | 'layer3') => Promise<DeckId | 'layer3'>;
  transitionToPlaylistTrack: (targetTrack: Track, presetId?: TransitionPresetId) => Promise<void>;
  toggleAutoMix: () => void;
  setAutoMixIntervalBars: (bars: number) => void;
  setAutoMixPreset: (preset: TransitionPresetId) => void;

  // 3rd Stem Layer (Vocals / Beat Injector)
  loadStemLayerTrack: (track: Track, file?: File) => Promise<void>;
  toggleStemLayerPlay: () => void;
  setStemLayerMode: (mode: StemMode) => void;
  setStemLayerVolume: (vol: number) => void;
  syncStemLayer: () => void;

  // Mixer
  setVolume: (deckId: DeckId, vol: number) => void;
  setGainTrim: (deckId: DeckId, trim: number) => void;
  setEQ: (deckId: DeckId, band: 'low' | 'mid' | 'high', val: number) => void;
  toggleEQKill: (deckId: DeckId, band: 'low' | 'mid' | 'high') => void;
  setFilter: (deckId: DeckId, val: number) => void;
  setCrossfader: (val: number) => void;
  setCrossfaderCurve: (curve: CrossfaderCurve) => void;
  setMasterVolume: (vol: number) => void;
  togglePFL: (deckId: DeckId) => void;

  // Transitions & Automation Presets
  triggerAutoTransition: (presetId?: TransitionPresetId, durationSec?: number) => void;
  cancelTransition: () => void;
  setTransitionPreset: (presetId: TransitionPresetId) => void;
  triggerMacroAction: (actionId: 'vocal-mashup' | 'beat-inject' | 'bass-drop' | 'quick-crossfade' | 'instant-cut') => void;

  // Mix Recording, Transition Logging & Past Sets
  transitionEvents: TransitionEvent[];
  pastSets: PastSetSession[];
  activeSetSession: PastSetSession;
  saveMixTake: (customTitle?: string) => void;
  deleteMixItem: (id: string) => void;
  toggleRecording: () => void;
  logTransitionEvent: (params: {
    fromDeck: DeckId;
    toDeck: DeckId;
    fromTrack?: Track | null;
    toTrack?: Track | null;
    presetId?: TransitionPresetId | string;
    presetName?: string;
    durationSeconds?: number;
    wasAutoMix?: boolean;
    futureStrategy?: FutureStrategyType;
    notes?: string;
  }) => TransitionEvent | null;
  revisitPastSet: (setId: string) => void;
  revisitTransition: (transitionId: string) => void;
  deletePastSet: (setId: string) => void;
  clearTransitionLogs: () => void;
  exportSetReport: (setId: string, format?: 'txt' | 'json' | 'cue') => void;
  exportTransitionLog: (transitionId: string) => void;

  // FX & Sampler
  updateEffect: (effectId: EffectType, updates: Partial<EffectSetting>) => void;
  toggleEffect: (effectId: EffectType) => void;
  triggerPad: (index: number) => void;
  updatePad: (index: number, updates: Partial<SamplePad>) => void;
  loadPadFile: (index: number, file: File) => Promise<void>;

  setShowShortcutsModal: (show: boolean) => void;
}

const initialDeckState = (id: DeckId): DeckState => ({
  id,
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  pitchSemitones: 0,
  keyLock: true,
  bpm: 128,
  volume: 0.85,
  gain: 1.0,
  high: 0,
  mid: 0,
  low: 0,
  highKill: false,
  midKill: false,
  lowKill: false,
  filter: 0,
  filterResonance: 1.0,
  stemMode: 'full',
  isLooping: false,
  loopLength: 4,
  loopStart: 0,
  loopEnd: 0,
  hotCues: [null, null, null, null],
  isScratching: false,
  isCueing: false,
  cuePosition: 0,
  isMaster: id === 'A',
  isSynced: false,
  pfl: false,
});

const initialStemLayerState: StemLayerState = {
  id: 'STEM_LAYER_3',
  track: null,
  isPlaying: false,
  stemMode: 'vocals',
  volume: 0.85,
  bpm: 128,
  isSynced: true,
  currentTime: 0,
  duration: 0,
};

const DJContext = createContext<DJContextType | null>(null);

export const DJProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [deckA, setDeckA] = useState<DeckState>(() => initialDeckState('A'));
  const [deckB, setDeckB] = useState<DeckState>(() => initialDeckState('B'));
  const [stemLayer, setStemLayer] = useState<StemLayerState>(initialStemLayerState);

  const [crossfader, setCrossfaderState] = useState(0);
  const [crossfaderCurve, setCrossfaderCurveState] = useState<CrossfaderCurve>('smooth');
  const [masterVolume, setMasterVolState] = useState(0.9);

  const [trackLibrary, setTrackLibrary] = useState<Track[]>(DEFAULT_TRACKS);
  const [mixLibrary, setMixLibrary] = useState<MixRecordingItem[]>([
    {
      id: 'mix-init-1',
      title: 'Neon Vocal Mashup Take #1',
      createdAt: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: 45,
      bpm: 128,
      key: 'F min',
      sourceTracks: {
        deckA: 'Cyber City Pulse',
        deckB: 'Neon Horizons',
        layer3: 'Velvet Midnight (Vocals Only)',
        presetUsed: 'Vocal Isolation & Mashup',
      },
    },
    {
      id: 'mix-init-2',
      title: 'Peak Bass Drop Swap #2',
      createdAt: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: 32,
      bpm: 130,
      key: 'D min',
      sourceTracks: {
        deckA: 'Warehouse Techno',
        deckB: 'Solar Flare',
        presetUsed: 'Bassline Drop Swap',
      },
    },
  ]);

  const [effects, setEffects] = useState<EffectSetting[]>(DEFAULT_EFFECTS);
  const [samplerPads, setSamplerPads] = useState<SamplePad[]>(DEFAULT_SAMPLER_PADS);

  const [transition, setTransition] = useState<TransitionState>({
    isActive: false,
    preset: 'bass-swap',
    fromDeck: 'A',
    toDeck: 'B',
    progress: 0,
    durationSeconds: 8,
    elapsedSeconds: 0,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const INITIAL_PLAYLISTS: Playlist[] = [
    {
      id: 'pl-club-prime',
      name: '⚡ Club Peak-Time Mix',
      description: 'Treibende Tech-House & Electro Tracks für den Mainroom.',
      createdAt: 'Heute',
      tracks: [DEFAULT_TRACKS[0], DEFAULT_TRACKS[1], DEFAULT_TRACKS[2], DEFAULT_TRACKS[5]],
    },
    {
      id: 'pl-urban-mashup',
      name: '🎤 Urban & Vocal Mashup Set',
      description: 'Ideal für Acapella- & Beat-Kombinationen.',
      createdAt: 'Heute',
      tracks: [DEFAULT_TRACKS[1], DEFAULT_TRACKS[3], DEFAULT_TRACKS[2], DEFAULT_TRACKS[0]],
    },
    {
      id: 'pl-sunset-lounge',
      name: '🌴 Sunset Deep Session',
      description: 'Warme Melodien und sanfte 122 BPM Grooves.',
      createdAt: 'Gestern',
      tracks: [DEFAULT_TRACKS[4], DEFAULT_TRACKS[0], DEFAULT_TRACKS[2]],
    },
  ];

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('dj_mix_playlists');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PLAYLISTS;
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string>('pl-club-prime');
  const [expandedTrackIds, setExpandedTrackIds] = useState<string[]>([DEFAULT_TRACKS[0].id]);
  const [autoMixActive, setAutoMixActive] = useState(false);
  const [autoMixIntervalBars, setAutoMixIntervalBars] = useState(16);
  const [autoMixPreset, setAutoMixPreset] = useState<TransitionPresetId>('crossfade');

  // Save playlists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dj_mix_playlists', JSON.stringify(playlists));
    } catch (e) {
      console.error(e);
    }
  }, [playlists]);

  const [vuLevels, setVuLevels] = useState({
    deckA: 0,
    deckB: 0,
    layer3: 0,
    masterL: 0,
    masterR: 0,
    audition: 0,
  });

  // ==========================================
  // COGNITIVE MUSIC & AI CO-PILOT STATE
  // ==========================================
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('cognitive');
  const [hybridLayout, setHybridLayoutState] = useState<HybridLayoutSettings>({
    showDecks: true,
    showFutures: true,
    showJourney: true,
    showSpace: true,
    showCrowd: true,
    showStemLayer: false,
    showTransitionGuide: true,
  });

  const [musicalDNA, setMusicalDNA] = useState<MusicalDNA>({
    continuity: 0.72,
    experimentation: 0.45,
    energy_growth: 0.65,
    harmonic_matching: 0.88,
    genre_stability: 0.75,
    surprise: 0.25,
    decisionHistory: [],
  });

  const [auditionState, setAuditionState] = useState<AuditionState>({
    isPlaying: false,
    trackId: null,
    futureId: null,
    progress: 0,
    duration: 12,
    mode: 'single',
  });

  const [intentPrompt, setIntentPrompt] = useState<string>('');
  const [coPilotMessage, setCoPilotMessage] = useState<string>(
    'Intelligenz aktiv: Höre Master-Deck ab und berechne 3 harmonische Zukunftswege...'
  );
  const [trackHistory, setTrackHistory] = useState<Track[]>([]);
  const [elapsedSetSeconds, setElapsedSetSeconds] = useState<number>(0);

  // Set timer ticker
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (deckA.isPlaying || deckB.isPlaying || stemLayer.isPlaying) {
        setElapsedSetSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deckA.isPlaying, deckB.isPlaying, stemLayer.isPlaying]);

  // Derived Cognitive Set State
  const computedSetStateVal = useMemo(() => {
    return computeSetState(deckA, deckB, crossfader, trackHistory.length + 1, elapsedSetSeconds);
  }, [deckA, deckB, crossfader, trackHistory.length, elapsedSetSeconds]);

  // Derived 3 Musical Futures
  const activeMasterTrack = deckA.isMaster ? deckA.track : deckB.track || deckA.track;
  const musicalFutures = useMemo(() => {
    return generateMusicalFutures(
      activeMasterTrack,
      trackLibrary,
      trackHistory,
      musicalDNA,
      intentPrompt
    );
  }, [activeMasterTrack, trackLibrary, trackHistory, musicalDNA, intentPrompt]);

  // Derived Crowd State
  const crowdState = useMemo(() => {
    return calculateCrowdState(computedSetStateVal, transition.isActive);
  }, [computedSetStateVal, transition.isActive]);

  // Derived Energy Journey
  const setJourney = useMemo(() => {
    return generateEnergyJourney(trackHistory, activeMasterTrack, musicalFutures);
  }, [trackHistory, activeMasterTrack, musicalFutures]);

  const setHybridLayout = useCallback((settings: Partial<HybridLayoutSettings>) => {
    setHybridLayoutState((prev) => ({ ...prev, ...settings }));
  }, []);

  // Initialize Web Audio
  const initAudio = useCallback(async () => {
    audioEngine.init();
    await audioEngine.resume();
    setIsAudioInitialized(true);

    // Pre-load default samples
    for (let i = 0; i < 8; i++) {
      audioEngine.loadSample(i);
    }
  }, []);

  // Audition playback
  const playAudition = useCallback(
    async (track: Track, futureId?: string, duration: number = 12) => {
      await initAudio();
      setAuditionState({
        isPlaying: true,
        trackId: track.id,
        futureId: futureId || null,
        progress: 0,
        duration,
        mode: 'single',
      });

      audioEngine.playAuditionTrack(
        track,
        () => {
          setAuditionState((prev) => ({ ...prev, isPlaying: false, trackId: null, futureId: null }));
        },
        16,
        duration
      );
    },
    [initAudio]
  );

  const stopAudition = useCallback(() => {
    audioEngine.stopAudition();
    setAuditionState({
      isPlaying: false,
      trackId: null,
      futureId: null,
      progress: 0,
      duration: 12,
      mode: 'single',
    });
  }, []);

  // Apply a Musical Future
  const applyMusicalFuture = useCallback(
    async (futureOption: MusicalFutureOption, targetDeckId?: DeckId) => {
      await initAudio();
      stopAudition();

      // Determine target deck: if Deck A is playing on master, load to Deck B; otherwise load to Deck A
      const target = targetDeckId || (deckA.isPlaying && !deckB.isPlaying ? 'B' : !deckA.isPlaying && deckB.isPlaying ? 'A' : deckA.isMaster ? 'B' : 'A');

      const track = futureOption.track;
      await audioEngine.loadTrack(target, track);

      if (target === 'A') {
        setDeckA((prev) => ({
          ...prev,
          track,
          bpm: track.bpm,
          duration: track.duration,
          currentTime: 0,
        }));
      } else {
        setDeckB((prev) => ({
          ...prev,
          track,
          bpm: track.bpm,
          duration: track.duration,
          currentTime: 0,
        }));
      }

      // If hybrid mashup, also inject mashup track into Stem Layer 3
      if (futureOption.strategy === 'hybrid' && futureOption.mashupTrack) {
        await audioEngine.loadLayer3Track(futureOption.mashupTrack);
        setStemLayer((prev) => ({
          ...prev,
          track: futureOption.mashupTrack || null,
          bpm: futureOption.mashupTrack?.bpm || 128,
          duration: futureOption.mashupTrack?.duration || 64,
          stemMode: 'beat',
          volume: 0.9,
          isPlaying: true,
        }));
        audioEngine.playLayer3();
      }

      // Update Musical DNA
      setMusicalDNA((prev) => updateMusicalDNA(prev, futureOption.strategy, track));

      // Append to history
      setTrackHistory((prev) => [...prev, track]);

      // Update Co-Pilot message
      setCoPilotMessage(
        `Zukunft gewählt: "${futureOption.headline}" in Deck ${target} geladen. Empfohlen: ${futureOption.recommendedTransition.germanStrategyTitle}`
      );
    },
    [initAudio, stopAudition, deckA.isPlaying, deckB.isPlaying, deckA.isMaster]
  );

  // Apply Immediate Transition to Future
  const applyImmediateTransitionToFuture = useCallback(
    async (futureOption: MusicalFutureOption) => {
      await applyMusicalFuture(futureOption);

      // Start target deck and trigger transition preset
      const from = deckA.isPlaying ? 'A' : 'B';
      const to = from === 'A' ? 'B' : 'A';

      if (to === 'B') {
        audioEngine.playDeck('B');
        setDeckB((prev) => ({ ...prev, isPlaying: true }));
      } else {
        audioEngine.playDeck('A');
        setDeckA((prev) => ({ ...prev, isPlaying: true }));
      }

      // Trigger recommended transition preset
      const presetId = futureOption.recommendedTransition.presetId;
      setTransitionPreset(presetId);
      triggerAutoTransition(presetId, 8);
    },
    [applyMusicalFuture, deckA.isPlaying]
  );

  // Submit natural language or quick intent
  const submitMusicalIntent = useCallback(
    (text: string) => {
      setIntentPrompt(text);
      const parsed = parseMusicalIntent(text);
      setCoPilotMessage(parsed.coPilotMessage);
    },
    []
  );

  const triggerSurpriseRoute = useCallback(async () => {
    await applyMusicalFuture(musicalFutures.surprise);
  }, [applyMusicalFuture, musicalFutures.surprise]);

  const triggerHybridMashup = useCallback(async () => {
    await applyMusicalFuture(musicalFutures.hybrid);
  }, [applyMusicalFuture, musicalFutures.hybrid]);

  const adjustSetDirectParameters = useCallback(
    (params: { energy?: number; tension?: number; groove?: string }) => {
      let msg = 'Direkte Parameter angepasst: ';
      if (params.energy !== undefined) msg += `Energie ${params.energy}% `;
      if (params.tension !== undefined) msg += `Spannung ${params.tension}% `;
      if (params.groove) msg += `Groove: ${params.groove} `;
      setCoPilotMessage(msg);
    },
    []
  );

  const recordingIntervalRef = useRef<number | null>(null);

  // Pre-load first tracks on init
  useEffect(() => {
    const loadInitials = async () => {
      if (DEFAULT_TRACKS.length >= 3) {
        const track1 = await audioEngine.loadTrack('A', DEFAULT_TRACKS[0]);
        setDeckA((prev) => ({
          ...prev,
          track: track1,
          bpm: track1.bpm,
          duration: track1.duration,
        }));

        const track2 = await audioEngine.loadTrack('B', DEFAULT_TRACKS[1]);
        setDeckB((prev) => ({
          ...prev,
          track: track2,
          bpm: track2.bpm,
          duration: track2.duration,
        }));

        const track3 = await audioEngine.loadLayer3Track(DEFAULT_TRACKS[2]);
        setStemLayer((prev) => ({
          ...prev,
          track: track3,
          bpm: track3.bpm,
          duration: track3.duration,
          stemMode: 'vocals',
        }));
      }
    };
    loadInitials();
  }, []);

  // Real-time Animation Loop for Playheads and VU Meters
  useEffect(() => {
    let animFrame: number;

    const updateLoop = () => {
      const curTimeA = audioEngine.getDeckCurrentTime('A');
      const curTimeB = audioEngine.getDeckCurrentTime('B');
      const curTime3 = audioEngine.getLayer3CurrentTime();

      setDeckA((prev) => {
        if (Math.abs(prev.currentTime - curTimeA) > 0.05) {
          return { ...prev, currentTime: curTimeA };
        }
        return prev;
      });

      setDeckB((prev) => {
        if (Math.abs(prev.currentTime - curTimeB) > 0.05) {
          return { ...prev, currentTime: curTimeB };
        }
        return prev;
      });

      setStemLayer((prev) => {
        if (Math.abs(prev.currentTime - curTime3) > 0.05) {
          return { ...prev, currentTime: curTime3 };
        }
        return prev;
      });

      // Update VU meters
      const levelA = audioEngine.getDeckLevel('A');
      const levelB = audioEngine.getDeckLevel('B');
      const level3 = audioEngine.getLayer3Level();
      const master = audioEngine.getMasterLevel();
      const auditionLevel = audioEngine.getAuditionLevel();

      setVuLevels({
        deckA: levelA,
        deckB: levelB,
        layer3: level3,
        masterL: master.left,
        masterR: master.right,
        audition: auditionLevel,
      });

      animFrame = requestAnimationFrame(updateLoop);
    };

    animFrame = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Track Loading
  const loadTrackToDeck = useCallback(
    async (deckId: DeckId, track: Track, file?: File) => {
      await initAudio();
      let buffer: AudioBuffer | undefined;
      if (file) {
        buffer = await audioEngine.decodeAudioFile(file);
      }
      const loaded = await audioEngine.loadTrack(deckId, track, buffer);

      if (deckId === 'A') {
        setDeckA((prev) => ({
          ...prev,
          track: loaded,
          bpm: loaded.bpm,
          duration: loaded.duration,
          currentTime: 0,
          isPlaying: false,
        }));
      } else {
        setDeckB((prev) => ({
          ...prev,
          track: loaded,
          bpm: loaded.bpm,
          duration: loaded.duration,
          currentTime: 0,
          isPlaying: false,
        }));
      }
    },
    [initAudio]
  );

  const importUserTrack = useCallback(
    async (file: File): Promise<Track> => {
      await initAudio();
      const buffer = await audioEngine.decodeAudioFile(file);

      const estimatedBpm = 126;
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const parts = cleanName.split('-');

      const title = parts.length > 1 ? parts[1].trim() : cleanName;
      const artist = parts.length > 1 ? parts[0].trim() : 'Local File';

      const newTrack: Track = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title,
        artist,
        bpm: estimatedBpm,
        originalBpm: estimatedBpm,
        key: 'A min',
        duration: buffer.duration,
        audioBuffer: buffer,
        color: '#38bdf8',
        sourceType: 'custom',
      };

      setTrackLibrary((prev) => [newTrack, ...prev]);
      return newTrack;
    },
    [initAudio]
  );

  // Playback
  const togglePlay = useCallback(
    (deckId: DeckId) => {
      initAudio();
      const deck = deckId === 'A' ? deckA : deckB;
      const setDeck = deckId === 'A' ? setDeckA : setDeckB;

      if (deck.isPlaying) {
        audioEngine.pauseDeck(deckId);
        setDeck((prev) => ({ ...prev, isPlaying: false }));
      } else {
        audioEngine.playDeck(deckId);
        setDeck((prev) => ({ ...prev, isPlaying: true }));
      }
    },
    [deckA, deckB, initAudio]
  );

  const cueDeck = useCallback(
    (deckId: DeckId) => {
      initAudio();
      const deck = deckId === 'A' ? deckA : deckB;
      const setDeck = deckId === 'A' ? setDeckA : setDeckB;

      if (deck.isPlaying) {
        audioEngine.pauseDeck(deckId);
        audioEngine.seekDeck(deckId, deck.cuePosition);
        setDeck((prev) => ({ ...prev, isPlaying: false, currentTime: prev.cuePosition }));
      } else {
        const currentPos = audioEngine.getDeckCurrentTime(deckId);
        audioEngine.seekDeck(deckId, currentPos);
        setDeck((prev) => ({ ...prev, cuePosition: currentPos }));
      }
    },
    [deckA, deckB, initAudio]
  );

  const seekDeck = useCallback(
    (deckId: DeckId, time: number) => {
      initAudio();
      audioEngine.seekDeck(deckId, time);
      const setDeck = deckId === 'A' ? setDeckA : setDeckB;
      setDeck((prev) => ({ ...prev, currentTime: time }));
    },
    [initAudio]
  );

  // Stems & Separation
  const setDeckStemMode = useCallback((deckId: DeckId, mode: StemMode) => {
    audioEngine.setDeckStemMode(deckId, mode);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, stemMode: mode }));
  }, []);

  // 3rd Stem Layer (Vocals / Beat Injector)
  const loadStemLayerTrack = useCallback(
    async (track: Track, file?: File) => {
      await initAudio();
      let buffer: AudioBuffer | undefined;
      if (file) {
        buffer = await audioEngine.decodeAudioFile(file);
      }
      const loaded = await audioEngine.loadLayer3Track(track, buffer);
      setStemLayer((prev) => ({
        ...prev,
        track: loaded,
        bpm: loaded.bpm,
        duration: loaded.duration,
        currentTime: 0,
        isPlaying: false,
      }));
    },
    [initAudio]
  );

  const toggleStemLayerPlay = useCallback(() => {
    initAudio();
    if (stemLayer.isPlaying) {
      audioEngine.pauseLayer3();
      setStemLayer((prev) => ({ ...prev, isPlaying: false }));
    } else {
      audioEngine.playLayer3();
      setStemLayer((prev) => ({ ...prev, isPlaying: true }));
    }
  }, [initAudio, stemLayer.isPlaying]);

  const setStemLayerMode = useCallback((mode: StemMode) => {
    audioEngine.setLayer3StemMode(mode);
    setStemLayer((prev) => ({ ...prev, stemMode: mode }));
  }, []);

  const setStemLayerVolume = useCallback((vol: number) => {
    audioEngine.setLayer3Volume(vol);
    setStemLayer((prev) => ({ ...prev, volume: vol }));
  }, []);

  const syncStemLayer = useCallback(() => {
    const masterDeck = deckA.isPlaying ? deckA : deckB;
    if (masterDeck.track && stemLayer.track) {
      const masterBpm = masterDeck.track.originalBpm * masterDeck.playbackRate;
      const layer3Rate = masterBpm / stemLayer.track.originalBpm;
      audioEngine.setLayer3PlaybackRate(layer3Rate);
      setStemLayer((prev) => ({
        ...prev,
        bpm: Number(masterBpm.toFixed(1)),
        isSynced: true,
      }));
    }
  }, [deckA, deckB, stemLayer.track]);

  // Pitch & Tempo
  const setPitchRate = useCallback((deckId: DeckId, rate: number) => {
    audioEngine.setPlaybackRate(deckId, rate);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => {
      const origBpm = prev.track?.originalBpm || 128;
      return {
        ...prev,
        playbackRate: rate,
        bpm: Number((origBpm * rate).toFixed(1)),
      };
    });
  }, []);

  const nudgePitch = useCallback((deckId: DeckId, delta: number) => {
    audioEngine.setPlaybackRate(deckId, (deckId === 'A' ? deckA.playbackRate : deckB.playbackRate) + delta);
    setTimeout(() => {
      audioEngine.setPlaybackRate(deckId, deckId === 'A' ? deckA.playbackRate : deckB.playbackRate);
    }, 150);
  }, [deckA.playbackRate, deckB.playbackRate]);

  const syncDecks = useCallback(
    (targetDeckId: DeckId) => {
      const masterDeckId = targetDeckId === 'A' ? 'B' : 'A';
      audioEngine.syncDecks(targetDeckId, masterDeckId);
      const masterDeck = targetDeckId === 'A' ? deckB : deckA;
      const setDeck = targetDeckId === 'A' ? setDeckA : setDeckB;

      if (masterDeck.track) {
        const masterBpm = masterDeck.track.originalBpm * masterDeck.playbackRate;
        setDeck((prev) => {
          const origBpm = prev.track?.originalBpm || 128;
          const newRate = masterBpm / origBpm;
          return {
            ...prev,
            playbackRate: newRate,
            bpm: Number(masterBpm.toFixed(1)),
            isSynced: true,
          };
        });
      }
    },
    [deckA, deckB]
  );

  const setMasterDeck = useCallback((deckId: DeckId) => {
    setDeckA((prev) => ({ ...prev, isMaster: deckId === 'A' }));
    setDeckB((prev) => ({ ...prev, isMaster: deckId === 'B' }));
  }, []);

  const toggleKeyLock = useCallback((deckId: DeckId) => {
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => {
      const nextVal = !prev.keyLock;
      audioEngine.setDeckKeyLock(deckId, nextVal);
      return { ...prev, keyLock: nextVal };
    });
  }, []);

  const toggleHarmonicLock = useCallback((deckId: DeckId) => {
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => {
      const nextVal = !prev.keyLock;
      audioEngine.setDeckKeyLock(deckId, nextVal);
      return { ...prev, keyLock: nextVal };
    });
  }, []);

  const setDeckPitchSemitones = useCallback((deckId: DeckId, semitones: number) => {
    const clamped = Math.max(-12, Math.min(12, semitones));
    audioEngine.setDeckPitchSemitones(deckId, clamped);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, pitchSemitones: clamped }));
  }, []);

  const resetDeckPitch = useCallback((deckId: DeckId) => {
    audioEngine.setDeckPitchSemitones(deckId, 0);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, pitchSemitones: 0 }));
  }, []);

  const syncDeckKey = useCallback(
    (targetDeckId: DeckId) => {
      const masterDeck = targetDeckId === 'A' ? deckB : deckA;
      const targetDeck = targetDeckId === 'A' ? deckA : deckB;

      const targetKey = targetDeck.track?.key || 'A min';
      const masterKey = masterDeck.track?.key || 'A min';
      const masterEffectiveKey = getShiftedKey(masterKey, masterDeck.pitchSemitones || 0).key;

      const match = calculateHarmonicKeyMatch(targetKey, masterEffectiveKey);
      audioEngine.setDeckPitchSemitones(targetDeckId, match.semitones);

      const setDeck = targetDeckId === 'A' ? setDeckA : setDeckB;
      setDeck((prev) => ({ ...prev, pitchSemitones: match.semitones }));

      setCoPilotMessage(
        `Key Sync Deck ${targetDeckId}: ${match.description} (${match.semitones > 0 ? '+' : ''}${match.semitones}st) ➔ ${match.matchedCamelot}`
      );
    },
    [deckA, deckB]
  );

  // Hot Cues
  const setHotCue = useCallback((deckId: DeckId, index: number) => {
    const currentPos = audioEngine.getDeckCurrentTime(deckId);
    const colors = ['#06b6d4', '#ec4899', '#eab308', '#10b981'];
    const newCue: HotCue = {
      id: index,
      position: currentPos,
      color: colors[index % colors.length],
    };

    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => {
      const cues = [...prev.hotCues];
      cues[index] = newCue;
      return { ...prev, hotCues: cues };
    });
  }, []);

  const jumpHotCue = useCallback(
    (deckId: DeckId, index: number) => {
      initAudio();
      const deck = deckId === 'A' ? deckA : deckB;
      const cue = deck.hotCues[index];
      if (cue) {
        audioEngine.seekDeck(deckId, cue.position);
        if (!deck.isPlaying) {
          audioEngine.playDeck(deckId);
          const setDeck = deckId === 'A' ? setDeckA : setDeckB;
          setDeck((prev) => ({ ...prev, isPlaying: true, currentTime: cue.position }));
        }
      } else {
        setHotCue(deckId, index);
      }
    },
    [deckA, deckB, initAudio, setHotCue]
  );

  const clearHotCue = useCallback((deckId: DeckId, index: number) => {
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => {
      const cues = [...prev.hotCues];
      cues[index] = null;
      return { ...prev, hotCues: cues };
    });
  }, []);

  // Loops
  const setLoopLength = useCallback(
    (deckId: DeckId, length: LoopLength) => {
      initAudio();
      const deck = deckId === 'A' ? deckA : deckB;
      audioEngine.setLoopLength(deckId, length, deck.bpm);
      const setDeck = deckId === 'A' ? setDeckA : setDeckB;
      setDeck((prev) => ({
        ...prev,
        loopLength: length,
        isLooping: true,
      }));
    },
    [deckA, deckB, initAudio]
  );

  const toggleLoop = useCallback((deckId: DeckId) => {
    const deck = deckId === 'A' ? deckA : deckB;
    const newState = !deck.isLooping;
    audioEngine.toggleLoop(deckId, newState);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, isLooping: newState }));
  }, [deckA, deckB]);

  const setLoopIn = useCallback((deckId: DeckId) => {
    audioEngine.setManualLoopIn(deckId);
  }, []);

  const setLoopOut = useCallback((deckId: DeckId) => {
    audioEngine.setManualLoopOut(deckId);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, isLooping: true }));
  }, []);

  // Mixer
  const setVolume = useCallback((deckId: DeckId, vol: number) => {
    audioEngine.setChannelVolume(deckId, vol);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, volume: vol }));
  }, []);

  const setGainTrim = useCallback((deckId: DeckId, trim: number) => {
    audioEngine.setGainTrim(deckId, trim);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, gain: trim }));
  }, []);

  const setEQ = useCallback((deckId: DeckId, band: 'low' | 'mid' | 'high', val: number) => {
    const deck = deckId === 'A' ? deckA : deckB;
    const isKill = band === 'low' ? deck.lowKill : band === 'mid' ? deck.midKill : deck.highKill;
    audioEngine.setEQ(deckId, band, val, isKill);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, [band]: val }));
  }, [deckA, deckB]);

  const toggleEQKill = useCallback(
    (deckId: DeckId, band: 'low' | 'mid' | 'high') => {
      const setDeck = deckId === 'A' ? setDeckA : setDeckB;
      setDeck((prev) => {
        const killKey = `${band}Kill` as 'lowKill' | 'midKill' | 'highKill';
        const newKill = !prev[killKey];
        audioEngine.setEQ(deckId, band, prev[band], newKill);
        return { ...prev, [killKey]: newKill };
      });
    },
    []
  );

  const setFilter = useCallback((deckId: DeckId, val: number) => {
    audioEngine.setFilter(deckId, val);
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, filter: val }));
  }, []);

  const setCrossfader = useCallback(
    (val: number) => {
      audioEngine.setCrossfader(val, crossfaderCurve);
      setCrossfaderState(val);
    },
    [crossfaderCurve]
  );

  const setCrossfaderCurve = useCallback(
    (curve: CrossfaderCurve) => {
      setCrossfaderCurveState(curve);
      audioEngine.setCrossfader(crossfader, curve);
    },
    [crossfader]
  );

  const setMasterVolume = useCallback((vol: number) => {
    audioEngine.setMasterVolume(vol);
    setMasterVolState(vol);
  }, []);

  const togglePFL = useCallback((deckId: DeckId) => {
    const setDeck = deckId === 'A' ? setDeckA : setDeckB;
    setDeck((prev) => ({ ...prev, pfl: !prev.pfl }));
  }, []);

  // Save Mix Take as File into Library
  const saveMixTake = useCallback((customTitle?: string) => {
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const title =
      customTitle ||
      `Live Mix Take (${deckA.track?.title || 'Deck A'} × ${deckB.track?.title || 'Deck B'})`;

    const newMixItem: MixRecordingItem = {
      id: `mix-${Date.now()}`,
      title,
      createdAt: dateStr,
      durationSeconds: Math.max(15, Math.floor(Math.random() * 45) + 30),
      bpm: deckA.isPlaying ? deckA.bpm : deckB.bpm,
      key: deckA.track?.key || 'A min',
      sourceTracks: {
        deckA: deckA.track?.title,
        deckB: deckB.track?.title,
        layer3: stemLayer.isPlaying ? `${stemLayer.track?.title} (${stemLayer.stemMode})` : undefined,
        presetUsed: transition.preset,
      },
    };

    setMixLibrary((prev) => [newMixItem, ...prev]);
  }, [deckA, deckB, stemLayer, transition.preset]);

  const deleteMixItem = useCallback((id: string) => {
    setMixLibrary((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Transitions & Automation Presets
  const triggerAutoTransition = useCallback(
    (presetId: TransitionPresetId = transition.preset, durationSec: number = 8) => {
      initAudio();
      const fromDeckId: DeckId = crossfader <= 0 ? 'A' : 'B';
      const toDeckId: DeckId = fromDeckId === 'A' ? 'B' : 'A';

      setTransition({
        isActive: true,
        preset: presetId,
        fromDeck: fromDeckId,
        toDeck: toDeckId,
        progress: 0,
        durationSeconds: durationSec,
        elapsedSeconds: 0,
      });

      audioEngine.triggerTransition(
        presetId,
        fromDeckId,
        toDeckId,
        durationSec,
        (progress) => {
          setTransition((prev) => ({
            ...prev,
            progress,
            elapsedSeconds: progress * durationSec,
          }));
          const targetCross = fromDeckId === 'A' ? -1 + progress * 2 : 1 - progress * 2;
          setCrossfaderState(targetCross);
        },
        () => {
          setTransition((prev) => ({ ...prev, isActive: false, progress: 1 }));
          setCrossfaderState(fromDeckId === 'A' ? 1 : -1);
          if (fromDeckId === 'A') {
            setDeckA((prev) => ({ ...prev, isPlaying: false, low: 0, mid: 0, high: 0, filter: 0 }));
            setDeckB((prev) => ({ ...prev, isPlaying: true }));
          } else {
            setDeckB((prev) => ({ ...prev, isPlaying: false, low: 0, mid: 0, high: 0, filter: 0 }));
            setDeckA((prev) => ({ ...prev, isPlaying: true }));
          }

          // Auto save file in library after each completed mix transition
          saveMixTake(`Transition: ${presetId.toUpperCase()} (${fromDeckId} ➔ ${toDeckId})`);
        }
      );
    },
    [crossfader, initAudio, saveMixTake, transition.preset]
  );

  const cancelTransition = useCallback(() => {
    audioEngine.cancelTransition();
    setTransition((prev) => ({ ...prev, isActive: false }));
  }, []);

  const setTransitionPreset = useCallback((presetId: TransitionPresetId) => {
    setTransition((prev) => ({ ...prev, preset: presetId }));
  }, []);

  // 1-Click Macro Automation Presets (Simple Dashboard UX)
  const triggerMacroAction = useCallback(
    (actionId: 'vocal-mashup' | 'beat-inject' | 'bass-drop' | 'quick-crossfade' | 'instant-cut') => {
      initAudio();
      switch (actionId) {
        case 'vocal-mashup':
          // Starts 3rd layer in vocals mode, syncs BPM and layers over active deck
          syncStemLayer();
          setStemLayerMode('vocals');
          if (!stemLayer.isPlaying) {
            toggleStemLayerPlay();
          }
          saveMixTake('Vocal Mashup Overlay Triggered');
          break;

        case 'beat-inject':
          // Injects 3rd layer beat mode with punch
          syncStemLayer();
          setStemLayerMode('beat');
          if (!stemLayer.isPlaying) {
            toggleStemLayerPlay();
          }
          saveMixTake('3rd Beat Injector Triggered');
          break;

        case 'bass-drop':
          triggerAutoTransition('bass-swap', 4);
          break;

        case 'quick-crossfade':
          triggerAutoTransition('crossfade', 4);
          break;

        case 'instant-cut':
          // Snap instant drop cut to other deck
          const target = crossfader <= 0 ? 1 : -1;
          setCrossfader(target);
          if (target === 1) {
            audioEngine.playDeck('B');
            setDeckB((p) => ({ ...p, isPlaying: true }));
            audioEngine.pauseDeck('A');
            setDeckA((p) => ({ ...p, isPlaying: false }));
          } else {
            audioEngine.playDeck('A');
            setDeckA((p) => ({ ...p, isPlaying: true }));
            audioEngine.pauseDeck('B');
            setDeckB((p) => ({ ...p, isPlaying: false }));
          }
          saveMixTake('Instant Drop Cut');
          break;
      }
    },
    [crossfader, initAudio, saveMixTake, setCrossfader, setStemLayerMode, stemLayer.isPlaying, syncStemLayer, toggleStemLayerPlay, triggerAutoTransition]
  );

  // FX
  const updateEffect = useCallback((effectId: EffectType, updates: Partial<EffectSetting>) => {
    setEffects((prev) => {
      const updated = prev.map((fx) => (fx.id === effectId ? { ...fx, ...updates } : fx));
      const targetFx = updated.find((f) => f.id === effectId);
      if (targetFx) {
        audioEngine.applyLiveEffect(targetFx);
      }
      return updated;
    });
  }, []);

  const toggleEffect = useCallback((effectId: EffectType) => {
    setEffects((prev) => {
      const updated = prev.map((fx) => (fx.id === effectId ? { ...fx, enabled: !fx.enabled } : fx));
      const targetFx = updated.find((f) => f.id === effectId);
      if (targetFx) {
        audioEngine.applyLiveEffect(targetFx);
      }
      return updated;
    });
  }, []);

  // Sampler
  const triggerPad = useCallback(
    (index: number) => {
      initAudio();
      const pad = samplerPads[index];
      if (pad) {
        audioEngine.triggerSample(index, pad);
        setSamplerPads((prev) =>
          prev.map((p, idx) => (idx === index ? { ...p, isPlaying: true } : p))
        );
        setTimeout(() => {
          setSamplerPads((prev) =>
            prev.map((p, idx) => (idx === index ? { ...p, isPlaying: false } : p))
          );
        }, 300);
      }
    },
    [initAudio, samplerPads]
  );

  const updatePad = useCallback((index: number, updates: Partial<SamplePad>) => {
    setSamplerPads((prev) =>
      prev.map((pad, idx) => (idx === index ? { ...pad, ...updates } : pad))
    );
  }, []);

  const loadPadFile = useCallback(
    async (index: number, file: File) => {
      await initAudio();
      const buffer = await audioEngine.decodeAudioFile(file);
      await audioEngine.loadSample(index, buffer);
      setSamplerPads((prev) =>
        prev.map((pad, idx) =>
          idx === index
            ? { ...pad, name: file.name.replace(/\.[^/.]+$/, ''), audioBuffer: buffer }
            : pad
        )
      );
    },
    [initAudio]
  );

  // Recording
  const toggleRecording = useCallback(() => {
    initAudio();
    if (!isRecording) {
      audioEngine.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      const blob = audioEngine.stopRecording();
      setIsRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        // Auto add to file library
        const newMixItem: MixRecordingItem = {
          id: `rec-${Date.now()}`,
          title: `Full DJ Set Live Recording (${recordingDuration}s)`,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationSeconds: recordingDuration,
          bpm: deckA.bpm,
          key: deckA.track?.key || 'A min',
          sourceTracks: {
            deckA: deckA.track?.title,
            deckB: deckB.track?.title,
          },
          blob,
          audioUrl: url,
        };
        setMixLibrary((prev) => [newMixItem, ...prev]);
      }
    }
  }, [deckA.bpm, deckA.track?.title, deckB.track?.title, initAudio, isRecording, recordingDuration]);

  // ===================== PLAYLIST & TRACK STACK DECK MANAGEMENT =====================

  const createPlaylist = useCallback((name: string, description?: string) => {
    const newId = `pl-${Date.now()}`;
    const newPlaylist: Playlist = {
      id: newId,
      name: name.trim() || `Neue Playlist #${playlists.length + 1}`,
      description: description || 'Benutzerdefinierte DJ Playlist',
      createdAt: 'Jetzt',
      tracks: [DEFAULT_TRACKS[0], DEFAULT_TRACKS[1]],
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    setActivePlaylistId(newId);
    return newId;
  }, [playlists.length]);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length === 0) {
        return INITIAL_PLAYLISTS;
      }
      return filtered;
    });
    if (activePlaylistId === id) {
      const remaining = playlists.filter((p) => p.id !== id);
      setActivePlaylistId(remaining[0]?.id || 'pl-club-prime');
    }
  }, [activePlaylistId, playlists]);

  const renamePlaylist = useCallback((id: string, name: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))
    );
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        const isDuplicate = p.tracks.some((t) => t.id === track.id);
        const trackToAdd = isDuplicate
          ? { ...track, id: `${track.id}-${Date.now().toString().slice(-4)}` }
          : track;
        return {
          ...p,
          tracks: [...p.tracks, trackToAdd],
        };
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          tracks: p.tracks.filter((t) => t.id !== trackId),
        };
      })
    );
  }, []);

  const reorderPlaylistTracks = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        const newTracks = [...p.tracks];
        if (fromIndex < 0 || fromIndex >= newTracks.length || toIndex < 0 || toIndex >= newTracks.length) {
          return p;
        }
        const [moved] = newTracks.splice(fromIndex, 1);
        newTracks.splice(toIndex, 0, moved);
        return { ...p, tracks: newTracks };
      })
    );
  }, []);

  const toggleExpandTrack = useCallback((trackId: string) => {
    setExpandedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  }, []);

  const expandAllTracks = useCallback(() => {
    const activePl = playlists.find((p) => p.id === activePlaylistId);
    if (activePl) {
      setExpandedTrackIds(activePl.tracks.map((t) => t.id));
    }
  }, [activePlaylistId, playlists]);

  const collapseAllTracks = useCallback(() => {
    setExpandedTrackIds([]);
  }, []);

  const loadTrackToAvailableDeck = useCallback(
    async (track: Track, preferredDeck?: DeckId | 'layer3'): Promise<DeckId | 'layer3'> => {
      await initAudio();

      if (preferredDeck === 'layer3') {
        await loadStemLayerTrack(track);
        return 'layer3';
      }

      if (preferredDeck === 'A') {
        await loadTrackToDeck('A', track);
        return 'A';
      }

      if (preferredDeck === 'B') {
        await loadTrackToDeck('B', track);
        return 'B';
      }

      // Check if already in deck A or B or Layer3
      if (deckA.track?.id === track.id) return 'A';
      if (deckB.track?.id === track.id) return 'B';
      if (stemLayer.track?.id === track.id) return 'layer3';

      // Auto-assign: if Deck A is playing and Deck B is stopped -> Deck B
      if (deckA.isPlaying && !deckB.isPlaying) {
        await loadTrackToDeck('B', track);
        return 'B';
      }
      if (deckB.isPlaying && !deckA.isPlaying) {
        await loadTrackToDeck('A', track);
        return 'A';
      }

      // Default load to Deck A
      await loadTrackToDeck('A', track);
      return 'A';
    },
    [deckA.isPlaying, deckA.track?.id, deckB.isPlaying, deckB.track?.id, initAudio, loadStemLayerTrack, loadTrackToDeck, stemLayer.track?.id]
  );

  const transitionToPlaylistTrack = useCallback(
    async (targetTrack: Track, presetId: TransitionPresetId = 'crossfade') => {
      await initAudio();
      if (deckA.isPlaying && !deckB.isPlaying) {
        await loadTrackToDeck('B', targetTrack);
        togglePlay('B');
        syncDecks('B');
        triggerAutoTransition(presetId, 8);
      } else if (deckB.isPlaying && !deckA.isPlaying) {
        await loadTrackToDeck('A', targetTrack);
        togglePlay('A');
        syncDecks('A');
        triggerAutoTransition(presetId, 8);
      } else {
        if (crossfader <= 0) {
          await loadTrackToDeck('B', targetTrack);
          togglePlay('B');
          syncDecks('B');
          triggerAutoTransition(presetId, 8);
        } else {
          await loadTrackToDeck('A', targetTrack);
          togglePlay('A');
          syncDecks('A');
          triggerAutoTransition(presetId, 8);
        }
      }
    },
    [crossfader, deckA.isPlaying, deckB.isPlaying, initAudio, loadTrackToDeck, syncDecks, togglePlay, triggerAutoTransition]
  );

  const toggleAutoMix = useCallback(() => {
    setAutoMixActive((prev) => {
      const next = !prev;
      if (next) {
        // Start playing if nothing is playing
        if (!deckA.isPlaying && !deckB.isPlaying) {
          const activePl = playlists.find((p) => p.id === activePlaylistId);
          if (activePl && activePl.tracks.length > 0) {
            loadTrackToDeck('A', activePl.tracks[0]).then(() => {
              togglePlay('A');
            });
          }
        }
      }
      return next;
    });
  }, [activePlaylistId, deckA.isPlaying, deckB.isPlaying, loadTrackToDeck, playlists, togglePlay]);

  // AutoMix watcher effect
  useEffect(() => {
    if (!autoMixActive) return;

    const interval = setInterval(() => {
      const activePl = playlists.find((p) => p.id === activePlaylistId);
      if (!activePl || activePl.tracks.length < 2) return;

      const playingDeck = deckA.isPlaying ? 'A' : deckB.isPlaying ? 'B' : null;
      if (!playingDeck) return;

      const currentDeckState = playingDeck === 'A' ? deckA : deckB;
      // If current track is within 10 seconds of end and no transition is currently active
      if (
        currentDeckState.duration > 0 &&
        currentDeckState.currentTime > currentDeckState.duration - 12 &&
        !transition.isActive
      ) {
        // Find index of currently playing track
        const currentIdx = activePl.tracks.findIndex((t) => t.id === currentDeckState.track?.id);
        const nextIdx = (currentIdx + 1) % activePl.tracks.length;
        const nextTrack = activePl.tracks[nextIdx];
        if (nextTrack) {
          transitionToPlaylistTrack(nextTrack, autoMixPreset);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activePlaylistId, autoMixActive, autoMixPreset, deckA, deckB, playlists, transition.isActive, transitionToPlaylistTrack]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay('A');
          break;
        case 'KeyQ':
          cueDeck('A');
          break;
        case 'KeyS':
          syncDecks('A');
          break;
        case 'KeyZ':
          jumpHotCue('A', 0);
          break;
        case 'KeyX':
          jumpHotCue('A', 1);
          break;
        case 'KeyC':
          jumpHotCue('A', 2);
          break;
        case 'KeyV':
          jumpHotCue('A', 3);
          break;

        case 'Enter':
          e.preventDefault();
          togglePlay('B');
          break;
        case 'KeyP':
          cueDeck('B');
          break;
        case 'KeyL':
          syncDecks('B');
          break;
        case 'KeyB':
          jumpHotCue('B', 0);
          break;
        case 'KeyN':
          jumpHotCue('B', 1);
          break;
        case 'KeyM':
          jumpHotCue('B', 2);
          break;
        case 'Comma':
          jumpHotCue('B', 3);
          break;

        case 'KeyT':
          triggerAutoTransition();
          break;

        case 'ArrowLeft':
          setCrossfader(Math.max(-1, crossfader - 0.1));
          break;
        case 'ArrowRight':
          setCrossfader(Math.min(1, crossfader + 0.1));
          break;
        case 'ArrowDown':
          setCrossfader(0);
          break;

        case 'Digit1':
          triggerPad(0);
          break;
        case 'Digit2':
          triggerPad(1);
          break;
        case 'Digit3':
          triggerPad(2);
          break;
        case 'Digit4':
          triggerPad(3);
          break;
        case 'Digit5':
          triggerPad(4);
          break;
        case 'Digit6':
          triggerPad(5);
          break;
        case 'Digit7':
          triggerPad(6);
          break;
        case 'Digit8':
          triggerPad(7);
          break;

        case 'Slash':
          if (e.shiftKey) setShowShortcutsModal((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    cueDeck,
    syncDecks,
    jumpHotCue,
    triggerAutoTransition,
    crossfader,
    setCrossfader,
    triggerPad,
  ]);

  return (
    <DJContext.Provider
      value={{
        deckA,
        deckB,
        stemLayer,
        crossfader,
        crossfaderCurve,
        masterVolume,
        isRecording,
        recordingDuration,
        recordedAudioUrl,
        transition,
        effects,
        samplerPads,
        trackLibrary,
        mixLibrary,
        isAudioInitialized,
        showShortcutsModal,
        vuLevels,
        playlists,
        activePlaylistId,
        expandedTrackIds,
        autoMixActive,
        autoMixIntervalBars,
        autoMixPreset,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        setActivePlaylistId,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,
        toggleExpandTrack,
        expandAllTracks,
        collapseAllTracks,
        loadTrackToAvailableDeck,
        transitionToPlaylistTrack,
        toggleAutoMix,
        setAutoMixIntervalBars,
        setAutoMixPreset,
        // Cognitive Music & AI Co-Pilot
        interfaceMode,
        hybridLayout,
        setState: computedSetStateVal,
        musicalFutures,
        crowdState,
        musicalDNA,
        setJourney,
        auditionState,
        intentPrompt,
        coPilotMessage,
        setInterfaceMode,
        setHybridLayout,
        playAudition,
        stopAudition,
        applyMusicalFuture,
        applyImmediateTransitionToFuture,
        submitMusicalIntent,
        triggerSurpriseRoute,
        triggerHybridMashup,
        adjustSetDirectParameters,

        initAudio,
        loadTrackToDeck,
        importUserTrack,
        togglePlay,
        cueDeck,
        seekDeck,
        setPitchRate,
        nudgePitch,
        syncDecks,
        setMasterDeck,
        toggleKeyLock,
        toggleHarmonicLock,
        setDeckPitchSemitones,
        syncDeckKey,
        resetDeckPitch,
        setHotCue,
        jumpHotCue,
        clearHotCue,
        setLoopLength,
        toggleLoop,
        setLoopIn,
        setLoopOut,
        setDeckStemMode,
        loadStemLayerTrack,
        toggleStemLayerPlay,
        setStemLayerMode,
        setStemLayerVolume,
        syncStemLayer,
        setVolume,
        setGainTrim,
        setEQ,
        toggleEQKill,
        setFilter,
        setCrossfader,
        setCrossfaderCurve,
        setMasterVolume,
        togglePFL,
        triggerAutoTransition,
        cancelTransition,
        setTransitionPreset,
        triggerMacroAction,
        saveMixTake,
        deleteMixItem,
        updateEffect,
        toggleEffect,
        triggerPad,
        updatePad,
        loadPadFile,
        toggleRecording,
        setShowShortcutsModal,
      }}
    >
      {children}
    </DJContext.Provider>
  );
};

export const useDJ = (): DJContextType => {
  const context = useContext(DJContext);
  if (!context) {
    throw new Error('useDJ must be used within a DJProvider');
  }
  return context;
};
