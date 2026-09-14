import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Lock,
  Unlock,
  Radio,
  Sliders,
  Volume2,
  ListPlus,
  FolderOpen,
  Disc,
  Sparkles,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { DeckId, LoopLength } from '../types';
import { DeckTrackSelectorModal } from './DeckTrackSelectorModal';
import { JogWheel } from './JogWheel';
import { SpectralInsight } from './SpectralInsight';
import { WaveformDisplay } from './WaveformDisplay';
import { getShiftedKey } from '../audio/harmonicUtils';

interface DeckPanelProps {
  deckId: DeckId;
}

const LOOP_OPTIONS: LoopLength[] = [0.25, 0.5, 1, 2, 4, 8, 16, 32];

export const DeckPanel: React.FC<DeckPanelProps> = ({ deckId }) => {
  const {
    deckA,
    deckB,
    togglePlay,
    cueDeck,
    seekDeck,
    setPitchRate,
    nudgePitch,
    syncDecks,
    syncDeckKey,
    setMasterDeck,
    toggleKeyLock,
    toggleHarmonicLock,
    setHotCue,
    jumpHotCue,
    clearHotCue,
    setLoopLength,
    toggleLoop,
    setLoopIn,
    setLoopOut,
    setDeckStemMode,
  } = useDJ();

  const deck = deckId === 'A' ? deckA : deckB;
  const otherDeck = deckId === 'A' ? deckB : deckA;
  const isA = deckId === 'A';
  const color = isA ? '#06b6d4' : '#ec4899'; // Cyan for A, Pink for B

  const [pitchRange, setPitchRange] = useState<number>(8); // ±8% or ±16% or ±50%
  const [isDeleteCueMode, setIsDeleteCueMode] = useState(false);
  const [isTrackSelectorOpen, setIsTrackSelectorOpen] = useState(false);
  const [showSpectralInsight, setShowSpectralInsight] = useState(true);

  const currentKey = deck.track?.key || 'A min';
  const shiftedKeyInfo = getShiftedKey(currentKey, deck.pitchSemitones || 0);

  // Pitch percent from rate: rate 1.0 -> 0%, rate 1.08 -> +8.0%
  const pitchPercent = Number(((deck.playbackRate - 1) * 100).toFixed(2));

  const handlePitchSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value); // -1.0 to +1.0
    const rate = 1.0 + sliderVal * (pitchRange / 100);
    setPitchRate(deckId, rate);
  };

  const handlePitchReset = () => {
    setPitchRate(deckId, 1.0);
  };

  const handleLoopDouble = () => {
    const curIndex = LOOP_OPTIONS.indexOf(deck.loopLength);
    if (curIndex < LOOP_OPTIONS.length - 1) {
      setLoopLength(deckId, LOOP_OPTIONS[curIndex + 1]);
    }
  };

  const handleLoopHalve = () => {
    const curIndex = LOOP_OPTIONS.indexOf(deck.loopLength);
    if (curIndex > 0) {
      setLoopLength(deckId, LOOP_OPTIONS[curIndex - 1]);
    }
  };

  return (
    <>
      <div
        id={`deck-panel-${deckId.toLowerCase()}`}
        className="flex-1 flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: `0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* Top Accent Strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: color }}
        />

        {/* 1. Header: Interactive Track Info & Ausklappbare Song-Auswahl */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 gap-2">
          {/* Clickable Track Badge */}
          <div
            onClick={() => setIsTrackSelectorOpen(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group/title p-1 rounded-lg hover:bg-neutral-800/80 transition"
            title="Klicken, um Song für dieses Deck auszuwählen"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-neutral-950 shadow-md flex-shrink-0 group-hover/title:scale-105 transition-transform"
              style={{ backgroundColor: color }}
            >
              {deckId}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs md:text-sm font-black text-neutral-100 truncate group-hover/title:text-cyan-300 transition-colors">
                  {deck.track ? deck.track.title : 'Kein Track geladen (Klick hier)'}
                </h2>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-400 border border-neutral-700 hidden sm:inline group-hover/title:border-cyan-500">
                  TITELWAHL ▾
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                {deck.track ? deck.track.artist : 'Klicke zum Auswählen oder Drag & Drop'}
              </p>
            </div>
          </div>

          {/* Quick Track Selection Button + BPM & Key */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIsTrackSelectorOpen(true)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-neutral-950 flex items-center gap-1 shadow transition active:scale-95"
              style={{ backgroundColor: color }}
              title="Track-Crate öffnen"
            >
              <FolderOpen className="w-3 h-3" />
              <span className="hidden sm:inline">TRACK</span>
            </button>

            <div className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col items-center">
              <span className="text-[8px] text-neutral-400 uppercase font-mono">BPM</span>
              <span className="text-xs font-mono font-black text-neutral-100">
                {deck.bpm.toFixed(1)}
              </span>
            </div>

            <div className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col items-center">
              <span className="text-[8px] text-neutral-400 uppercase font-mono">KEY</span>
              <span
                className={`text-xs font-mono font-bold ${
                  deck.pitchSemitones !== 0 ? 'text-purple-400' : 'text-amber-400'
                }`}
                title={`Getunte Tonart: ${shiftedKeyInfo.key} (${shiftedKeyInfo.camelot})`}
              >
                {shiftedKeyInfo.camelot}
              </span>
            </div>

            {/* Spectral Insight Toggle Button */}
            <button
              id={`toggle-spectral-${deckId.toLowerCase()}`}
              onClick={() => setShowSpectralInsight((prev) => !prev)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition active:scale-95 ${
                showSpectralInsight
                  ? isA
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
              title="Spectral Insight Overlay umschalten"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">INSIGHT</span>
            </button>
          </div>
        </div>

        {/* Stem Quick Isolator (All / Vocals / Beat / Bass) */}
        <div className="flex items-center justify-between bg-neutral-950/70 p-1.5 rounded-lg border border-neutral-850 mb-2 gap-1 text-[10px]">
          <span className="text-neutral-500 font-mono font-bold uppercase text-[9px] px-1 hidden sm:inline">
            STEM ISOLATOR:
          </span>
          <div className="grid grid-cols-4 gap-1 flex-1">
            {(
              [
                { mode: 'full', label: 'FULL' },
                { mode: 'vocals', label: '🎤 VOCAL' },
                { mode: 'beat', label: '🥁 BEAT' },
                { mode: 'bass', label: '🎸 BASS' },
              ] as const
            ).map((s) => (
              <button
                key={s.mode}
                onClick={() => setDeckStemMode(deckId, s.mode)}
                className={`py-1 rounded text-[10px] font-bold tracking-wider transition uppercase border ${
                  deck.stemMode === s.mode
                    ? 'bg-neutral-800 text-white border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
                title={`Isoliere ${s.label} für Deck ${deckId}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Waveform Visualizer */}
        <div className="mb-2">
          <WaveformDisplay
            id={`waveform-deck-${deckId.toLowerCase()}`}
            track={deck.track}
            currentTime={deck.currentTime}
            duration={deck.duration}
            isPlaying={deck.isPlaying}
            color={color}
            hotCues={deck.hotCues}
            loopStart={deck.loopStart}
            loopEnd={deck.loopEnd}
            isLooping={deck.isLooping}
            onSeek={(time) => seekDeck(deckId, time)}
          />
        </div>

        {/* 2.5 Real-Time Spectral Insight Overlay (Harmonic Intensity, Rhythmic Density & Key Match) */}
        {showSpectralInsight && (
          <div className="mb-2.5 animate-fadeIn">
            <SpectralInsight deckId={deckId} defaultExpanded={false} />
          </div>
        )}

        {/* 3. Main Center: Jog Wheel & Pitch Slider */}
        <div className="grid grid-cols-12 gap-2.5 items-center my-auto">
          {/* Left Side: Performance Loops & Master/Sync Controls */}
          <div className="col-span-3 flex flex-col gap-2">
            {/* Master & Sync Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                id={`btn-master-${deckId.toLowerCase()}`}
                onClick={() => setMasterDeck(deckId)}
                className={`py-1.5 px-1 rounded text-[11px] font-bold tracking-wider uppercase border transition flex items-center justify-center gap-1 ${
                  deck.isMaster
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
                title="Als Tempo-Master definieren"
              >
                <Radio className="w-3 h-3" />
                MASTER
              </button>

              <button
                id={`btn-sync-${deckId.toLowerCase()}`}
                onClick={() => syncDecks(deckId)}
                className={`py-1.5 px-1 rounded text-[11px] font-bold tracking-wider uppercase border transition flex items-center justify-center gap-1 ${
                  deck.isSynced
                    ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-neutral-950 text-cyan-400 border-neutral-800 hover:bg-neutral-800'
                }`}
                title="Automatisches Beat-Matching & Grid-Angleichung"
              >
                <Sparkles className="w-3 h-3" />
                SYNC
              </button>
            </div>

            {/* Sync Key & Harmonic Lock Controls */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                id={`btn-sync-key-deck-${deckId.toLowerCase()}`}
                onClick={() => syncDeckKey(deckId)}
                className="py-1 px-1 rounded text-[10px] font-bold uppercase border bg-purple-950/60 text-purple-300 border-purple-500/40 hover:bg-purple-900/60 flex items-center justify-center gap-1 transition"
                title={`Tonart harmonisch an Deck ${otherDeck.id} anpassen`}
              >
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                SYNC KEY
              </button>

              <button
                id={`btn-harmonic-lock-${deckId.toLowerCase()}`}
                onClick={() => toggleHarmonicLock(deckId)}
                className={`py-1 px-1 rounded text-[10px] font-bold uppercase border flex items-center justify-center gap-1 transition ${
                  deck.keyLock
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
                title="Harmonic Lock / Key Lock: Fixiert Tonhöhe bei Tempoänderungen"
              >
                {deck.keyLock ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                HARMONIC
              </button>
            </div>

            {/* KeyLock & Range */}
            <div className="flex items-center justify-between bg-neutral-950 p-1.5 rounded border border-neutral-800 text-[10px]">
              <button
                onClick={() => toggleKeyLock(deckId)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-bold transition ${
                  deck.keyLock ? 'text-cyan-400 bg-cyan-950/60' : 'text-neutral-500'
                }`}
                title="Key Lock (Master Tempo hält die Tonhöhe stabil)"
              >
                {deck.keyLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                KEY LOCK
              </button>

              <select
                value={pitchRange}
                onChange={(e) => setPitchRange(Number(e.target.value))}
                className="bg-neutral-900 text-neutral-300 font-mono text-[10px] rounded px-1 py-0.5 border border-neutral-700 outline-none"
              >
                <option value={8}>±8%</option>
                <option value={16}>±16%</option>
                <option value={50}>±50%</option>
              </select>
            </div>

            {/* Loop Quick Selector */}
            <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold">
                <span>BEAT LOOP</span>
                <button
                  onClick={() => toggleLoop(deckId)}
                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] transition ${
                    deck.isLooping
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {deck.isLooping ? 'AKTIV' : 'AUTO'}
                </button>
              </div>

              {/* Loop Length Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {LOOP_OPTIONS.map((len) => (
                  <button
                    key={len}
                    onClick={() => setLoopLength(deckId, len)}
                    className={`py-1 text-[10px] font-mono font-bold rounded border transition ${
                      deck.loopLength === len && deck.isLooping
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : deck.loopLength === len
                        ? 'bg-neutral-800 text-amber-400 border-neutral-600'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    {len < 1 ? `1/${1 / len}` : `${len}`}
                  </button>
                ))}
              </div>

              {/* Loop In / Out / Multiply */}
              <div className="grid grid-cols-4 gap-1 pt-1 border-t border-neutral-850">
                <button
                  onClick={() => setLoopIn(deckId)}
                  className="py-0.5 text-[9px] font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800"
                >
                  IN
                </button>
                <button
                  onClick={() => setLoopOut(deckId)}
                  className="py-0.5 text-[9px] font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800"
                >
                  OUT
                </button>
                <button
                  onClick={handleLoopHalve}
                  className="py-0.5 text-[9px] font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800"
                  title="1/2 Loop"
                >
                  1/2X
                </button>
                <button
                  onClick={handleLoopDouble}
                  className="py-0.5 text-[9px] font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800"
                  title="2X Loop"
                >
                  2X
                </button>
              </div>
            </div>
          </div>

          {/* Center: Jog Wheel (Click center disc for Track Selector) */}
          <div className="col-span-6 flex justify-center py-1">
            <JogWheel
              id={`jog-wheel-${deckId.toLowerCase()}`}
              deckId={deckId}
              isPlaying={deck.isPlaying}
              currentTime={deck.currentTime}
              bpm={deck.bpm}
              color={color}
              onOpenTrackSelector={() => setIsTrackSelectorOpen(true)}
              onNudge={(delta) => nudgePitch(deckId, delta)}
              onScratch={(delta) => seekDeck(deckId, Math.max(0, deck.currentTime + delta * 2))}
            />
          </div>

          {/* Right Side: Pitch Fader (Tempo Slider) */}
          <div className="col-span-3 flex flex-col items-center justify-center bg-neutral-950 p-2 rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-bold text-neutral-400">TEMPO</span>
              <button
                onClick={handlePitchReset}
                className="text-[9px] font-mono text-cyan-400 hover:underline"
                title="Tempo auf 0.0% zurücksetzen"
              >
                RESET
              </button>
            </div>

            {/* Pitch % display */}
            <div className="font-mono text-xs font-black text-neutral-200 mb-1.5">
              {pitchPercent >= 0 ? `+${pitchPercent.toFixed(2)}%` : `${pitchPercent.toFixed(2)}%`}
            </div>

            {/* Vertical Tempo Slider */}
            <div className="relative h-32 flex items-center justify-center">
              {/* Zero Center Detent Mark */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-500/50 pointer-events-none" />

              <input
                type="range"
                min={-1}
                max={1}
                step={0.001}
                value={((deck.playbackRate - 1) * 100) / pitchRange}
                onChange={handlePitchSliderChange}
                onDoubleClick={handlePitchReset}
                className="accent-cyan-400 h-28 w-2 cursor-pointer appearance-none bg-neutral-800 rounded-lg slider-vertical"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                }}
                title="Tempo / Pitch Fader"
              />
            </div>

            {/* Scale marks */}
            <div className="flex justify-between w-full text-[9px] font-mono text-neutral-500 mt-1 px-1">
              <span>+{pitchRange}%</span>
              <span>0</span>
              <span>-{pitchRange}%</span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Section: Hot Cues & Transport Buttons */}
        <div className="grid grid-cols-12 gap-3 mt-3 pt-2 border-t border-neutral-800 items-center">
          {/* Hot Cue Pads (1 - 4) */}
          <div className="col-span-6 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                HOT CUES
              </span>
              <button
                onClick={() => setIsDeleteCueMode((prev) => !prev)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                  isDeleteCueMode
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {isDeleteCueMode ? 'KLICK ZUM LÖSCHEN' : 'LÖSCHEN'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {deck.hotCues.map((cue, idx) => {
                const cueColor = cue ? cue.color : '#525252';
                const shortcut = isA ? ['Z', 'X', 'C', 'V'][idx] : ['B', 'N', 'M', ','][idx];

                return (
                  <button
                    key={idx}
                    id={`hotcue-${deckId.toLowerCase()}-${idx + 1}`}
                    onClick={() => {
                      if (isDeleteCueMode) {
                        clearHotCue(deckId, idx);
                      } else {
                        jumpHotCue(deckId, idx);
                      }
                    }}
                    className="relative h-11 rounded-lg border font-bold flex flex-col items-center justify-center p-1 transition shadow group active:scale-95"
                    style={{
                      backgroundColor: cue ? `${cueColor}20` : '#171717',
                      borderColor: cue ? cueColor : '#262626',
                      boxShadow: cue ? `0 0 10px ${cueColor}33` : 'none',
                    }}
                    title={`Hot Cue ${idx + 1} [Taste: ${shortcut}]`}
                  >
                    <span
                      className="text-xs font-black"
                      style={{ color: cue ? cueColor : '#737373' }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-[8px] font-mono text-neutral-500">
                      {cue ? formatTimeMin(cue.position) : shortcut}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transport Controls: CUE, PLAY/PAUSE, PITCH BEND */}
          <div className="col-span-6 grid grid-cols-3 gap-2 items-center">
            {/* CUE Button */}
            <button
              id={`btn-cue-${deckId.toLowerCase()}`}
              onClick={() => cueDeck(deckId)}
              className="h-12 rounded-xl bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-neutral-950 font-black text-xs tracking-wider uppercase border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center transition"
              title={`Cue [Taste: ${isA ? 'Q' : 'P'}]`}
            >
              <RotateCcw className="w-4 h-4 mb-0.5" />
              CUE
            </button>

            {/* PLAY / PAUSE Button */}
            <button
              id={`btn-play-${deckId.toLowerCase()}`}
              onClick={() => togglePlay(deckId)}
              className={`h-12 rounded-xl active:scale-95 font-black text-xs tracking-wider uppercase border flex flex-col items-center justify-center transition shadow-lg ${
                deck.isPlaying
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-300 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-b from-neutral-800 to-neutral-850 hover:from-neutral-700 hover:to-neutral-800 border-neutral-700 text-emerald-400'
              }`}
              title={`Play / Pause [Taste: ${isA ? 'Leertaste' : 'Enter'}]`}
            >
              {deck.isPlaying ? (
                <Pause className="w-4 h-4 mb-0.5" />
              ) : (
                <Play className="w-4 h-4 mb-0.5 fill-current" />
              )}
              {deck.isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            {/* Pitch Bend Buttons */}
            <div className="grid grid-cols-2 gap-1 h-12">
              <button
                onClick={() => nudgePitch(deckId, -0.05)}
                className="rounded-lg bg-neutral-950 hover:bg-neutral-800 active:bg-cyan-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition"
                title="Pitch Bend Verlangsamen (-)"
              >
                <Rewind className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => nudgePitch(deckId, 0.05)}
                className="rounded-lg bg-neutral-950 hover:bg-neutral-800 active:bg-cyan-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition"
                title="Pitch Bend Beschleunigen (+)"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Deck Track Selector Modal */}
      {isTrackSelectorOpen && (
        <DeckTrackSelectorModal
          deckId={deckId}
          onClose={() => setIsTrackSelectorOpen(false)}
        />
      )}
    </>
  );
};

function formatTimeMin(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
