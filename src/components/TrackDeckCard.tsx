import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Radio,
  Lock,
  Unlock,
  Volume2,
  Zap,
  Mic,
  Music,
  Disc,
  ArrowUp,
  ArrowDown,
  Trash2,
  FastForward,
  Layers,
  Sliders,
  Repeat,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { DeckId, LoopLength, StemMode, Track, TransitionPresetId } from '../types';
import { Knob } from './Knob';
import { VUMeter } from './VUMeter';
import { WaveformDisplay } from './WaveformDisplay';

interface TrackDeckCardProps {
  track: Track;
  index: number;
  totalTracks: number;
  playlistId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  nextTrack?: Track;
}

export const TrackDeckCard: React.FC<TrackDeckCardProps> = ({
  track,
  index,
  totalTracks,
  playlistId,
  isExpanded,
  onToggleExpand,
  nextTrack,
}) => {
  const {
    deckA,
    deckB,
    stemLayer,
    togglePlay,
    cueDeck,
    seekDeck,
    setPitchRate,
    nudgePitch,
    syncDecks,
    toggleKeyLock,
    setHotCue,
    jumpHotCue,
    clearHotCue,
    setLoopLength,
    toggleLoop,
    setDeckStemMode,
    setVolume,
    setGainTrim,
    setEQ,
    toggleEQKill,
    setFilter,
    loadTrackToDeck,
    loadStemLayerTrack,
    toggleStemLayerPlay,
    setStemLayerMode,
    setStemLayerVolume,
    loadTrackToAvailableDeck,
    transitionToPlaylistTrack,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    vuLevels,
    initAudio,
  } = useDJ();

  const [selectedLoop, setSelectedLoop] = useState<LoopLength>(4);
  const [transitionPreset, setTransitionPreset] = useState<TransitionPresetId>('crossfade');

  // Determine if track is active in Deck A, Deck B, or Stem Layer
  const isLoadedInA = deckA.track?.id === track.id;
  const isLoadedInB = deckB.track?.id === track.id;
  const isLoadedInLayer3 = stemLayer.track?.id === track.id;

  const currentDeckId: DeckId | 'layer3' | null = isLoadedInA
    ? 'A'
    : isLoadedInB
    ? 'B'
    : isLoadedInLayer3
    ? 'layer3'
    : null;

  const activeDeckState = isLoadedInA ? deckA : isLoadedInB ? deckB : null;
  const isPlaying = isLoadedInA
    ? deckA.isPlaying
    : isLoadedInB
    ? deckB.isPlaying
    : isLoadedInLayer3
    ? stemLayer.isPlaying
    : false;

  const currentStemMode: StemMode = isLoadedInA
    ? deckA.stemMode
    : isLoadedInB
    ? deckB.stemMode
    : isLoadedInLayer3
    ? stemLayer.stemMode
    : 'full';

  // Handle direct play click
  const handleTogglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await initAudio();

    if (currentDeckId === 'A') {
      togglePlay('A');
    } else if (currentDeckId === 'B') {
      togglePlay('B');
    } else if (currentDeckId === 'layer3') {
      toggleStemLayerPlay();
    } else {
      // Not loaded yet: load to an available deck and play
      const assigned = await loadTrackToAvailableDeck(track);
      if (assigned === 'A') togglePlay('A');
      else if (assigned === 'B') togglePlay('B');
      else if (assigned === 'layer3') toggleStemLayerPlay();
    }
  };

  const handleAssignDeck = async (deckTarget: 'A' | 'B' | 'layer3', e: React.MouseEvent) => {
    e.stopPropagation();
    await initAudio();
    if (deckTarget === 'A') {
      await loadTrackToDeck('A', track);
    } else if (deckTarget === 'B') {
      await loadTrackToDeck('B', track);
    } else {
      await loadStemLayerTrack(track);
    }
  };

  const handleStemChange = async (mode: StemMode) => {
    if (currentDeckId === 'A') {
      setDeckStemMode('A', mode);
    } else if (currentDeckId === 'B') {
      setDeckStemMode('B', mode);
    } else if (currentDeckId === 'layer3') {
      setStemLayerMode(mode);
    } else {
      const assigned = await loadTrackToAvailableDeck(track);
      if (assigned === 'A') setDeckStemMode('A', mode);
      else if (assigned === 'B') setDeckStemMode('B', mode);
      else if (assigned === 'layer3') setStemLayerMode(mode);
    }
  };

  const handleTransitionToNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextTrack) {
      await transitionToPlaylistTrack(nextTrack, transitionPreset);
    }
  };

  const STEM_BUTTONS: { mode: StemMode; label: string; icon: string; desc: string; color: string }[] = [
    {
      mode: 'full',
      label: 'KOMPLETT',
      icon: 'Disc',
      desc: 'Voller Song ungefiltert',
      color: '#06b6d4',
    },
    {
      mode: 'vocals',
      label: '🎤 NUR VOCALS',
      icon: 'Mic',
      desc: 'Kick & Bass werden entfernt, nur Stimme & Melodie',
      color: '#ec4899',
    },
    {
      mode: 'beat',
      label: '🥁 NUR BEAT & DRUMS',
      icon: 'Zap',
      desc: 'Gesang weggefiltert, Fokus auf Kicks & Hi-Hats',
      color: '#f59e0b',
    },
    {
      mode: 'bass',
      label: '🎸 NUR BASS',
      icon: 'Music',
      desc: 'Sub-Basslinie & tiefe Frequenzen isoliert',
      color: '#8b5cf6',
    },
  ];

  const LOOP_LENGTHS: LoopLength[] = [0.5, 1, 2, 4, 8, 16];

  const currentTime = activeDeckState ? activeDeckState.currentTime : 0;
  const duration = activeDeckState && activeDeckState.duration > 0 ? activeDeckState.duration : track.duration;

  return (
    <div
      id={`track-deck-${track.id}`}
      className={`rounded-xl transition-all duration-200 border overflow-hidden shadow-lg ${
        isPlaying
          ? 'bg-neutral-900 border-cyan-500/70 shadow-[0_4px_25px_rgba(6,182,212,0.15)]'
          : isExpanded
          ? 'bg-neutral-900 border-neutral-700 shadow-xl'
          : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
      }`}
    >
      {/* ===================== COLLAPSED ROW (STETIGE TITEL-ZEILE) ===================== */}
      <div
        onClick={onToggleExpand}
        className="p-3 cursor-pointer flex items-center justify-between gap-2.5 sm:gap-4 select-none group"
      >
        {/* Left: Index & Play Button & Track Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Track Number / Drag Position */}
          <div className="w-6 text-center font-mono text-xs font-bold text-neutral-500 group-hover:text-neutral-300 flex-shrink-0">
            #{index + 1}
          </div>

          {/* Quick Play/Pause Round Button */}
          <button
            onClick={handleTogglePlay}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold transition shadow active:scale-95 flex-shrink-0 ${
              isPlaying
                ? 'bg-cyan-500 text-neutral-950 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                : currentDeckId
                ? 'bg-neutral-800 hover:bg-cyan-600 hover:text-neutral-950 text-cyan-400 border border-cyan-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 hover:text-white'
            }`}
            title={isPlaying ? 'Pause' : 'Abspielen / In Deck starten'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-100 truncate group-hover:text-cyan-300 transition">
                {track.title}
              </h4>
              {/* Deck Badge if active */}
              {isLoadedInA && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex-shrink-0">
                  DECK A {deckA.isPlaying ? '▶ LIVE' : '⏸'}
                </span>
              )}
              {isLoadedInB && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-800 flex-shrink-0">
                  DECK B {deckB.isPlaying ? '▶ LIVE' : '⏸'}
                </span>
              )}
              {isLoadedInLayer3 && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 flex-shrink-0">
                  STEM LAYER 3
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 truncate flex items-center gap-2">
              <span>{track.artist}</span>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <span className="text-amber-400 font-mono font-semibold hidden sm:inline">{track.bpm} BPM</span>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <span className="text-neutral-400 font-mono hidden sm:inline">{track.key}</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Badges & Quick Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* BPM & Key Pills (always visible on mobile) */}
          <div className="hidden xs:flex items-center gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-neutral-950 text-amber-400 border border-neutral-800 font-bold">
              {activeDeckState ? `${activeDeckState.bpm.toFixed(1)} BPM` : `${track.bpm} BPM`}
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-300 border border-neutral-800 font-bold">
              {track.key}
            </span>
          </div>

          {/* Current Stem Mode Pill */}
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded border hidden md:inline-flex items-center gap-1 ${
              currentStemMode === 'vocals'
                ? 'bg-pink-950 text-pink-300 border-pink-800'
                : currentStemMode === 'beat'
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : currentStemMode === 'bass'
                ? 'bg-purple-950 text-purple-300 border-purple-800'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}
          >
            {currentStemMode === 'vocals'
              ? '🎤 VOCALS'
              : currentStemMode === 'beat'
              ? '🥁 BEAT'
              : currentStemMode === 'bass'
              ? '🎸 BASS'
              : '✨ FULL'}
          </span>

          {/* Expand / Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
              isExpanded
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
            }`}
          >
            <span className="text-[11px] font-mono hidden sm:inline">
              {isExpanded ? 'DECK SCHLIEẞEN' : 'DECK ÖFFNEN'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ===================== EXPANDED INTERACTIVE DECK PLAYER & FUNCTIONS ===================== */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 flex flex-col gap-3.5 animate-fadeIn">
          {/* 1. Deck Assignment & Routing Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase mr-1">
                IN DECK LADEN:
              </span>
              <button
                onClick={(e) => handleAssignDeck('A', e)}
                className={`px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase border transition flex items-center gap-1 ${
                  isLoadedInA
                    ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-neutral-950 text-cyan-400 border-neutral-800 hover:bg-cyan-950/50'
                }`}
              >
                <span>🔴 DECK A (LINKS)</span>
                {isLoadedInA && <span className="text-[9px] font-mono">AKTIV</span>}
              </button>

              <button
                onClick={(e) => handleAssignDeck('B', e)}
                className={`px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase border transition flex items-center gap-1 ${
                  isLoadedInB
                    ? 'bg-pink-500 text-neutral-950 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                    : 'bg-neutral-950 text-pink-400 border-neutral-800 hover:bg-pink-950/50'
                }`}
              >
                <span>🔵 DECK B (RECHTS)</span>
                {isLoadedInB && <span className="text-[9px] font-mono">AKTIV</span>}
              </button>

              <button
                onClick={(e) => handleAssignDeck('layer3', e)}
                className={`px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase border transition flex items-center gap-1 ${
                  isLoadedInLayer3
                    ? 'bg-purple-500 text-neutral-950 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                    : 'bg-neutral-950 text-purple-400 border-neutral-800 hover:bg-purple-950/50'
                }`}
              >
                <span>🟣 3. STEM LAYER</span>
              </button>
            </div>

            {/* Quick Next Track Transition Button */}
            {nextTrack && (
              <div className="flex items-center gap-1.5">
                <select
                  value={transitionPreset}
                  onChange={(e) => setTransitionPreset(e.target.value as TransitionPresetId)}
                  className="bg-neutral-950 text-neutral-300 text-[10px] font-bold px-2 py-1 rounded border border-neutral-800 outline-none"
                >
                  <option value="crossfade">Nahtlos Faden (8T)</option>
                  <option value="bass-swap">Bass-Drop Swap (4T)</option>
                  <option value="hpf-sweep">Filter-Sweep (6T)</option>
                  <option value="echo-out">Echo Tail Out (6T)</option>
                </select>

                <button
                  onClick={handleTransitionToNext}
                  className="px-2.5 py-1 rounded bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-neutral-950 text-xs font-black flex items-center gap-1 shadow active:scale-95 transition"
                  title={`Startet einen automatischen Übergang zu "${nextTrack.title}"`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>MIX IN NÄCHSTEN TRACK</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Stem Isolator Bar */}
          <div className="flex flex-col gap-1.5 bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Mic className="w-3.5 h-3.5" />
                STEM ISOLATOR (FREQUENZ- & GESANGSFILTER):
              </span>
              <span className="text-[10px] text-neutral-400">
                Wähle, welche Elemente dieses Songs im Mix hörbar sind
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {STEM_BUTTONS.map((item) => {
                const isSelected = currentStemMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    onClick={() => handleStemChange(item.mode)}
                    className={`p-2 rounded-lg text-xs font-black transition border flex flex-col items-center justify-center gap-0.5 text-center shadow ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.4)] scale-[1.02]'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white'
                    }`}
                    title={item.desc}
                  >
                    <span>{item.label}</span>
                    <span className="text-[9px] font-normal opacity-75">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Waveform & Scrubber */}
          <div className="bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">
                  {Math.floor(currentTime / 60)}:
                  {Math.floor(currentTime % 60)
                    .toString()
                    .padStart(2, '0')}
                </span>
                <span className="text-neutral-600">/</span>
                <span className="text-neutral-400">
                  {Math.floor(duration / 60)}:
                  {Math.floor(duration % 60)
                    .toString()
                    .padStart(2, '0')}
                </span>
              </div>
              <div className="text-neutral-400 text-[10px]">
                REST: -
                {Math.floor((duration - currentTime) / 60)}:
                {Math.floor((duration - currentTime) % 60)
                  .toString()
                  .padStart(2, '0')}
              </div>
            </div>

            <WaveformDisplay
              deckId={currentDeckId === 'B' ? 'B' : 'A'}
              color={isPlaying ? '#06b6d4' : '#6b7280'}
              height={50}
              onSeek={(t) => {
                if (currentDeckId === 'A') seekDeck('A', t);
                else if (currentDeckId === 'B') seekDeck('B', t);
              }}
            />
          </div>

          {/* 4. Controls Grid: Transport & Pitch & EQ & Loops */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Transport & Pitch (5 cols) */}
            <div className="md:col-span-5 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Play / Pause */}
                <button
                  onClick={handleTogglePlay}
                  className={`flex-1 h-11 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2 transition shadow active:scale-95 ${
                    isPlaying
                      ? 'bg-cyan-500 text-neutral-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                {/* CUE */}
                <button
                  onClick={() => {
                    if (currentDeckId === 'A') cueDeck('A');
                    else if (currentDeckId === 'B') cueDeck('B');
                  }}
                  className="px-3.5 h-11 rounded-lg font-black text-xs bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95 transition"
                >
                  CUE
                </button>

                {/* SYNC */}
                <button
                  onClick={() => {
                    if (currentDeckId === 'A') syncDecks('A');
                    else if (currentDeckId === 'B') syncDecks('B');
                  }}
                  className="px-3.5 h-11 rounded-lg font-black text-xs bg-neutral-800 hover:bg-neutral-700 text-pink-400 border border-neutral-700 active:scale-95 transition flex items-center gap-1"
                  title="BPM an den Master-Song anpassen"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>SYNC</span>
                </button>

                {/* Key Lock */}
                <button
                  onClick={() => {
                    if (currentDeckId === 'A') toggleKeyLock('A');
                    else if (currentDeckId === 'B') toggleKeyLock('B');
                  }}
                  className={`px-2.5 h-11 rounded-lg text-xs font-bold border transition ${
                    activeDeckState?.keyLock
                      ? 'bg-neutral-800 text-cyan-400 border-cyan-500/40'
                      : 'bg-neutral-950 text-neutral-500 border-neutral-800'
                  }`}
                  title="Key Lock (Hält Tonhöhe bei Tempoänderung)"
                >
                  {activeDeckState?.keyLock ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Pitch Fader & Nudge */}
              <div className="flex flex-col gap-1.5 bg-neutral-950 p-2 rounded-lg border border-neutral-850">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>TEMPO: {activeDeckState ? activeDeckState.bpm.toFixed(1) : track.bpm} BPM</span>
                  <span>RATE: {activeDeckState ? ((activeDeckState.playbackRate - 1) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (currentDeckId === 'A') nudgePitch('A', -0.02);
                      else if (currentDeckId === 'B') nudgePitch('B', -0.02);
                    }}
                    className="px-2 py-1 rounded bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-xs font-mono font-bold border border-neutral-800"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.001"
                    value={activeDeckState ? activeDeckState.playbackRate : 1.0}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value);
                      if (currentDeckId === 'A') setPitchRate('A', r);
                      else if (currentDeckId === 'B') setPitchRate('B', r);
                    }}
                    className="flex-1 accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      if (currentDeckId === 'A') nudgePitch('A', 0.02);
                      else if (currentDeckId === 'B') nudgePitch('B', 0.02);
                    }}
                    className="px-2 py-1 rounded bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-xs font-mono font-bold border border-neutral-800"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 3-Band EQ & Filter (4 cols) */}
            <div className="md:col-span-4 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 flex flex-col justify-between gap-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">
                3-BAND EQUALIZER & FILTER
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                {/* HIGH */}
                <div className="flex flex-col items-center">
                  <Knob
                    id={`knob-high-${track.id}`}
                    value={activeDeckState ? activeDeckState.high : 0}
                    min={-24}
                    max={6}
                    label="HIGH"
                    size={40}
                    color="#06b6d4"
                    onChange={(v) => {
                      if (currentDeckId === 'A') setEQ('A', 'high', v);
                      else if (currentDeckId === 'B') setEQ('B', 'high', v);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (currentDeckId === 'A') toggleEQKill('A', 'high');
                      else if (currentDeckId === 'B') toggleEQKill('B', 'high');
                    }}
                    className="mt-1 text-[9px] px-1 py-0.5 rounded bg-neutral-950 hover:bg-red-950 text-neutral-400 hover:text-red-400 font-mono"
                  >
                    KILL
                  </button>
                </div>

                {/* MID */}
                <div className="flex flex-col items-center">
                  <Knob
                    id={`knob-mid-${track.id}`}
                    value={activeDeckState ? activeDeckState.mid : 0}
                    min={-24}
                    max={6}
                    label="MID"
                    size={40}
                    color="#ec4899"
                    onChange={(v) => {
                      if (currentDeckId === 'A') setEQ('A', 'mid', v);
                      else if (currentDeckId === 'B') setEQ('B', 'mid', v);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (currentDeckId === 'A') toggleEQKill('A', 'mid');
                      else if (currentDeckId === 'B') toggleEQKill('B', 'mid');
                    }}
                    className="mt-1 text-[9px] px-1 py-0.5 rounded bg-neutral-950 hover:bg-red-950 text-neutral-400 hover:text-red-400 font-mono"
                  >
                    KILL
                  </button>
                </div>

                {/* LOW */}
                <div className="flex flex-col items-center">
                  <Knob
                    id={`knob-low-${track.id}`}
                    value={activeDeckState ? activeDeckState.low : 0}
                    min={-24}
                    max={6}
                    label="LOW"
                    size={40}
                    color="#f59e0b"
                    onChange={(v) => {
                      if (currentDeckId === 'A') setEQ('A', 'low', v);
                      else if (currentDeckId === 'B') setEQ('B', 'low', v);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (currentDeckId === 'A') toggleEQKill('A', 'low');
                      else if (currentDeckId === 'B') toggleEQKill('B', 'low');
                    }}
                    className="mt-1 text-[9px] px-1 py-0.5 rounded bg-neutral-950 hover:bg-red-950 text-neutral-400 hover:text-red-400 font-mono"
                  >
                    KILL
                  </button>
                </div>

                {/* FILTER */}
                <div className="flex flex-col items-center">
                  <Knob
                    id={`knob-filter-${track.id}`}
                    value={activeDeckState ? activeDeckState.filter : 0}
                    min={-100}
                    max={100}
                    label="FILTER"
                    size={40}
                    color="#10b981"
                    onChange={(v) => {
                      if (currentDeckId === 'A') setFilter('A', v);
                      else if (currentDeckId === 'B') setFilter('B', v);
                    }}
                  />
                  <span className="mt-1 text-[9px] text-neutral-500 font-mono">HP/LP</span>
                </div>
              </div>
            </div>

            {/* Loops & Cues & Playlist Reorder (3 cols) */}
            <div className="md:col-span-3 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 flex flex-col justify-between gap-2.5">
              {/* Loop Bar Buttons */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span>AUTO-LOOP:</span>
                  <button
                    onClick={() => {
                      if (currentDeckId === 'A') toggleLoop('A');
                      else if (currentDeckId === 'B') toggleLoop('B');
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      activeDeckState?.isLooping
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    {activeDeckState?.isLooping ? 'LOOP AKTIV' : 'LOOP AUS'}
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {LOOP_LENGTHS.map((len) => (
                    <button
                      key={len}
                      onClick={() => {
                        setSelectedLoop(len);
                        if (currentDeckId === 'A') {
                          setLoopLength('A', len);
                          toggleLoop('A');
                        } else if (currentDeckId === 'B') {
                          setLoopLength('B', len);
                          toggleLoop('B');
                        }
                      }}
                      className={`py-1 rounded text-[9px] font-mono font-bold transition border ${
                        selectedLoop === len && activeDeckState?.isLooping
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {len}T
                    </button>
                  ))}
                </div>
              </div>

              {/* Hot Cues 1-4 */}
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block mb-1">HOT CUES:</span>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((cueIdx) => {
                    const hasCue = activeDeckState && activeDeckState.hotCues[cueIdx] !== null;
                    return (
                      <button
                        key={cueIdx}
                        onClick={() => {
                          if (currentDeckId === 'A') {
                            if (hasCue) jumpHotCue('A', cueIdx);
                            else setHotCue('A', cueIdx);
                          } else if (currentDeckId === 'B') {
                            if (hasCue) jumpHotCue('B', cueIdx);
                            else setHotCue('B', cueIdx);
                          }
                        }}
                        className={`py-1 rounded text-[10px] font-mono font-bold border transition ${
                          hasCue
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                            : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                        }`}
                        title={hasCue ? `Springe zu Cue ${cueIdx + 1}` : `Setze Cue ${cueIdx + 1}`}
                      >
                        {cueIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Playlist Position Controls */}
              <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800 text-[10px]">
                <div className="flex items-center gap-1">
                  <button
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderPlaylistTracks(playlistId, index, index - 1);
                    }}
                    className="p-1 rounded bg-neutral-950 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 border border-neutral-800 transition"
                    title="In der Playlist nach oben schieben"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={index === totalTracks - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderPlaylistTracks(playlistId, index, index + 1);
                    }}
                    className="p-1 rounded bg-neutral-950 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 border border-neutral-800 transition"
                    title="In der Playlist nach unten schieben"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrackFromPlaylist(playlistId, track.id);
                  }}
                  className="px-2 py-1 rounded bg-neutral-950 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-800 flex items-center gap-1 transition"
                  title="Aus dieser Playlist entfernen"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ENTFERNEN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
