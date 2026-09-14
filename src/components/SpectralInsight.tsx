import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Compass,
  Disc,
  Flame,
  Info,
  Key,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  Unlock,
  Volume2,
  Waves,
  Zap,
} from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';
import {
  calculateHarmonicKeyMatch,
  getHarmonicCompatibility,
  getShiftedKey,
  NOTE_NAMES,
  parseKey,
} from '../audio/harmonicUtils';
import { useDJ } from '../context/DJContext';
import { DeckId } from '../types';

interface SpectralInsightProps {
  deckId: DeckId;
  defaultExpanded?: boolean;
}

export const SpectralInsight: React.FC<SpectralInsightProps> = ({
  deckId,
  defaultExpanded = false,
}) => {
  const {
    deckA,
    deckB,
    setDeckPitchSemitones,
    syncDeckKey,
    resetDeckPitch,
    toggleHarmonicLock,
  } = useDJ();

  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'overview' | 'chroma' | 'spectrum'>('overview');

  const deck = deckId === 'A' ? deckA : deckB;
  const otherDeck = deckId === 'A' ? deckB : deckA;
  const isDeckA = deckId === 'A';
  const themeColor = isDeckA ? 'cyan' : 'pink';

  // Live real-time analysis metrics
  const [metrics, setMetrics] = useState({
    harmonicIntensity: 0,
    rhythmicDensity: 0,
    subBass: 0,
    midHarmonics: 0,
    highAir: 0,
    frequencyBands: new Array(16).fill(0),
    chromaEnergy: new Array(12).fill(0),
    isPlaying: false,
  });

  const animFrameRef = useRef<number | null>(null);

  // Poll real-time audio metrics from AudioEngine
  useEffect(() => {
    let active = true;

    const poll = () => {
      if (!active) return;
      const data = audioEngine.getDeckSpectralMetrics(deckId);
      setMetrics(data);
      animFrameRef.current = requestAnimationFrame(poll);
    };

    animFrameRef.current = requestAnimationFrame(poll);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [deckId]);

  // Harmonic Key Calculations
  const currentKey = deck.track?.key || 'A min';
  const otherKey = otherDeck.track?.key || 'A min';
  const pitchSemitones = deck.pitchSemitones || 0;
  const otherPitchSemitones = otherDeck.pitchSemitones || 0;

  const shiftedKeyInfo = useMemo(
    () => getShiftedKey(currentKey, pitchSemitones),
    [currentKey, pitchSemitones]
  );

  const otherShiftedKeyInfo = useMemo(
    () => getShiftedKey(otherKey, otherPitchSemitones),
    [otherKey, otherPitchSemitones]
  );

  // Recommended key sync calculation
  const syncMatch = useMemo(
    () => calculateHarmonicKeyMatch(currentKey, otherShiftedKeyInfo.key),
    [currentKey, otherShiftedKeyInfo.key]
  );

  // Live deck-to-deck compatibility
  const compatibility = useMemo(
    () =>
      getHarmonicCompatibility(
        currentKey,
        otherKey,
        pitchSemitones,
        otherPitchSemitones
      ),
    [currentKey, otherKey, pitchSemitones, otherPitchSemitones]
  );

  // Static fallback values from track intelligence if not playing
  const effectiveHarmonicIntensity = metrics.isPlaying
    ? metrics.harmonicIntensity
    : deck.track?.intelligence?.harmonicTension || 45;

  const effectiveRhythmicDensity = metrics.isPlaying
    ? metrics.rhythmicDensity
    : deck.track?.intelligence?.rhythmicDensity || 55;

  // Handlers
  const handleSemitoneChange = (delta: number) => {
    setDeckPitchSemitones(deckId, pitchSemitones + delta);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeckPitchSemitones(deckId, parseInt(e.target.value, 10));
  };

  return (
    <div
      id={`spectral-insight-${deckId.toLowerCase()}`}
      className={`rounded-xl border transition-all duration-300 backdrop-blur-md overflow-hidden ${
        isDeckA
          ? 'bg-slate-950/80 border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.12)]'
          : 'bg-slate-950/80 border-pink-500/30 shadow-[0_4px_20px_rgba(236,72,153,0.12)]'
      }`}
    >
      {/* 1. Header & Live Indicator Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              metrics.isPlaying
                ? isDeckA
                  ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]'
                  : 'bg-pink-400 animate-pulse shadow-[0_0_8px_#f472b6]'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Spectral Insight
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              pitchSemitones !== 0
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 font-semibold'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
            }`}
          >
            {shiftedKeyInfo.camelot} ({shiftedKeyInfo.key})
            {pitchSemitones !== 0 && ` [${pitchSemitones > 0 ? '+' : ''}${pitchSemitones}st]`}
          </span>
        </div>

        {/* Quick Actions & Expand Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Harmonic Lock Quick Toggle */}
          <button
            id={`harmonic-lock-btn-${deckId.toLowerCase()}`}
            onClick={() => toggleHarmonicLock(deckId)}
            title="Harmonic Lock: Behält Tonhöhe bei Tempowechseln bei"
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all border ${
              deck.keyLock
                ? isDeckA
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {deck.keyLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-slate-500" />}
            <span>Lock</span>
          </button>

          {/* Sync Key Quick Button */}
          <button
            id={`quick-sync-key-btn-${deckId.toLowerCase()}`}
            onClick={() => syncDeckKey(deckId)}
            title={`Harmonisch abstimmen auf Deck ${otherDeck.id} (${otherShiftedKeyInfo.camelot})`}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all border ${
              syncMatch.semitones === pitchSemitones
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Sync Key</span>
            <span className="text-[9px] opacity-80">
              ({syncMatch.semitones > 0 ? '+' : ''}{syncMatch.semitones}st)
            </span>
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Toggle Spectral Insight View"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Core Real-Time Metrics Strip (Always visible or compact) */}
      <div className="p-2.5 grid grid-cols-2 gap-2 bg-slate-950/40">
        {/* Metric A: Harmonic Intensity */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Harmonische Intensität
            </span>
            <span className="font-mono font-bold text-purple-300">
              {effectiveHarmonicIntensity}%
            </span>
          </div>

          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              style={{ width: `${Math.min(100, Math.max(5, effectiveHarmonicIntensity))}%` }}
            />
          </div>

          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>Tension: {deck.track?.intelligence?.harmonicTension || 40}%</span>
            <span>Mids: {metrics.midHarmonics}%</span>
          </div>
        </div>

        {/* Metric B: Rhythmic Density */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Flame className="w-3 h-3 text-amber-400" />
              Rhythmische Dichte
            </span>
            <span className="font-mono font-bold text-amber-300">
              {effectiveRhythmicDensity}%
            </span>
          </div>

          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
              style={{ width: `${Math.min(100, Math.max(5, effectiveRhythmicDensity))}%` }}
            />
          </div>

          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>Sub: {metrics.subBass}%</span>
            <span>Air: {metrics.highAir}%</span>
          </div>
        </div>
      </div>

      {/* 3. Live 16-Band Spectral Mini-Visualizer Bar */}
      <div className="px-2.5 pb-2 bg-slate-950/40">
        <div className="h-6 bg-slate-900/90 border border-slate-800/80 rounded flex items-end justify-between px-1 py-0.5 gap-0.5 overflow-hidden">
          {metrics.frequencyBands.map((band, idx) => {
            const heightPct = metrics.isPlaying
              ? Math.max(8, Math.round(band * 100))
              : Math.max(10, Math.round(Math.sin((idx / 16) * Math.PI) * 40 + 10));

            return (
              <div
                key={idx}
                className="flex-1 rounded-t-sm transition-all duration-75"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor:
                    idx < 4
                      ? '#f59e0b'
                      : idx < 10
                      ? isDeckA
                        ? '#06b6d4'
                        : '#ec4899'
                      : '#a855f7',
                  opacity: metrics.isPlaying ? 0.9 : 0.4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 4. Expanded Control Deck & Chroma Analysis */}
      {isExpanded && (
        <div className="px-2.5 pb-3 border-t border-slate-800/80 bg-slate-900/40 flex flex-col gap-2.5 pt-2.5 animate-fadeIn">
          {/* Sub-Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Key Tuning
              </button>
              <button
                onClick={() => setActiveTab('chroma')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeTab === 'chroma'
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                12-Ton Chroma Compass
              </button>
              <button
                onClick={() => setActiveTab('spectrum')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeTab === 'spectrum'
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Frequenz-Spektrum
              </button>
            </div>

            {/* Deck-to-Deck Compatibility Badge */}
            <div
              className="text-[10px] font-semibold px-2 py-0.5 rounded border"
              style={{
                backgroundColor: `${compatibility.color}15`,
                color: compatibility.color,
                borderColor: `${compatibility.color}40`,
              }}
            >
              Deck A ⇄ B: {compatibility.score}% Match
            </div>
          </div>

          {/* TAB 1: Key Tuning & Harmonic Pitch Controls */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-2">
              {/* Pitch Shift Controls */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Pitch-Shift & Tonart-Anpassung
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                      {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} Halbtöne
                    </span>
                    {pitchSemitones !== 0 && (
                      <button
                        onClick={() => resetDeckPitch(deckId)}
                        title="Pitch auf Originaltonart zurücksetzen"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Semitone Slider & Step Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSemitoneChange(-1)}
                    disabled={pitchSemitones <= -12}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center transition-colors"
                  >
                    -1
                  </button>

                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={pitchSemitones}
                    onChange={handleSliderChange}
                    className="flex-1 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <button
                    onClick={() => handleSemitoneChange(1)}
                    disabled={pitchSemitones >= 12}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center transition-colors"
                  >
                    +1
                  </button>
                </div>

                {/* Key Status Bar */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-500">Original</div>
                    <div className="font-mono font-semibold text-slate-300">
                      {currentKey}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-purple-950/40 border border-purple-500/30">
                    <div className="text-purple-400">Aktiv Getunt</div>
                    <div className="font-mono font-bold text-purple-200">
                      {shiftedKeyInfo.key} ({shiftedKeyInfo.camelot})
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-500">Ziel Deck {otherDeck.id}</div>
                    <div className="font-mono font-semibold text-cyan-300">
                      {otherShiftedKeyInfo.camelot}
                    </div>
                  </div>
                </div>
              </div>

              {/* Harmonic Match & Sync Key Action Box */}
              <div className="bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-indigo-950/30 border border-purple-500/20 rounded-lg p-2 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400">Harmonische Empfehlung:</span>
                  <span className="text-xs font-medium text-slate-200">
                    {syncMatch.description}
                  </span>
                </div>

                <button
                  id={`sync-key-full-btn-${deckId.toLowerCase()}`}
                  onClick={() => syncDeckKey(deckId)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-900/40 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>SYNC KEY</span>
                  <span className="text-[10px] opacity-90 font-mono">
                    ({syncMatch.semitones > 0 ? '+' : ''}{syncMatch.semitones}st)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 12-Tone Chroma Compass */}
          {activeTab === 'chroma' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  12-Ton Pitch Class Chroma Verteilung
                </span>
                <span className="text-[10px] text-slate-400">
                  Dominant: <strong className="text-cyan-300">{shiftedKeyInfo.root}</strong>
                </span>
              </div>

              {/* 12 Chroma Energy Bars */}
              <div className="grid grid-cols-12 gap-1 items-end h-16 bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                {NOTE_NAMES.map((note, idx) => {
                  const energy = metrics.isPlaying
                    ? metrics.chromaEnergy[idx] || 0.05
                    : shiftedKeyInfo.root === note
                    ? 0.9
                    : 0.15;

                  const isRoot = shiftedKeyInfo.root === note;
                  const isOtherRoot = otherShiftedKeyInfo.root === note;

                  return (
                    <div key={note} className="flex flex-col items-center h-full justify-end gap-1">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-100 ${
                          isRoot
                            ? isDeckA
                              ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                              : 'bg-pink-400 shadow-[0_0_8px_#f472b6]'
                            : isOtherRoot
                            ? 'bg-purple-400'
                            : 'bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(8, Math.round(energy * 100))}%` }}
                      />
                      <span
                        className={`text-[8px] font-mono leading-none ${
                          isRoot
                            ? 'font-bold text-cyan-300'
                            : isOtherRoot
                            ? 'font-bold text-purple-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {note}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isDeckA ? 'bg-cyan-400' : 'bg-pink-400'}`} />
                  Deck {deckId} Root ({shiftedKeyInfo.root})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Deck {otherDeck.id} Root ({otherShiftedKeyInfo.root})
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: Frequency Spectrum Details */}
          {activeTab === 'spectrum' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Frequenzbänder & Harmonische Obertöne
                </span>
                <span className="text-[10px] text-slate-400">
                  {metrics.isPlaying ? 'Live Audio Input' : 'Standby Profil'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800 flex flex-col gap-1">
                  <div className="text-amber-400 font-medium">Sub / Bass (20-200Hz)</div>
                  <div className="font-mono text-sm font-bold text-slate-200">{metrics.subBass}%</div>
                  <div className="text-[9px] text-slate-500">Kick & Bassline Punch</div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-slate-800 flex flex-col gap-1">
                  <div className="text-cyan-400 font-medium">Mitten / Leads (250-3kHz)</div>
                  <div className="font-mono text-sm font-bold text-slate-200">{metrics.midHarmonics}%</div>
                  <div className="text-[9px] text-slate-500">Vocals & Melodic Body</div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-slate-800 flex flex-col gap-1">
                  <div className="text-purple-400 font-medium">Highs / Air (3k-16kHz)</div>
                  <div className="font-mono text-sm font-bold text-slate-200">{metrics.highAir}%</div>
                  <div className="text-[9px] text-slate-500">Hi-Hats & Crispness</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
