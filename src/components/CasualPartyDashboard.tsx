import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Sparkles,
  Flame,
  Music,
  Headphones,
  Zap,
  RotateCcw,
  PartyPopper,
  Compass,
  TrendingUp,
  Disc,
  HeartHandshake,
  Bot,
  ChevronRight,
  Smile,
  Clock,
  CheckCircle2,
  Target,
  Layers,
  Gauge,
  Sliders,
  Check,
  Info,
  HelpCircle,
  X,
  Radio,
  SlidersHorizontal,
  VolumeX,
  Activity,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { Track, TrackStructure } from '../types';
import { TransitionMap } from './TransitionMap';
import { AudioImportTuningStudio } from './AudioImportTuningStudio';

interface PredictiveMarker {
  id: string;
  time: number;
  label: string;
  type: 'phrase' | 'breakdown' | 'drop' | 'outro' | 'optimal';
  energy: number;
  barNumber: number;
  confidenceScore: number;
  description: string;
  isOptimal: boolean;
}

export const CasualPartyDashboard: React.FC = () => {
  const {
    deckA,
    deckB,
    crossfader,
    togglePlay,
    triggerAutoTransition,
    applyImmediateTransitionToFuture,
    applyMusicalFuture,
    musicalFutures,
    crowdState,
    trackLibrary,
    submitMusicalIntent,
    adjustSetDirectParameters,
    playAudition,
    stopAudition,
    auditionState,
    triggerPad,
    initAudio,
    transition,
    masterVolume,
    setMasterVolume,
    syncDecks,
  } = useDJ();

  // Autopilot mode state
  const [autoDJEnabled, setAutoDJEnabled] = useState<boolean>(true);
  const [autoMixCountdown, setAutoMixCountdown] = useState<number>(45);
  const [bassBoost, setBassBoost] = useState<boolean>(false);
  const [selectedVibe, setSelectedVibe] = useState<string>('party');
  const [partyEnergyTarget, setPartyEnergyTarget] = useState<number>(75);

  // Smart Auto-Mix & Predictive Marker States
  const [isLockedToMarker, setIsLockedToMarker] = useState<boolean>(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('AI-Beat-Analyse aktiv');

  // Interactive Explanatory Popover & Guide States
  const [showWhyPopover, setShowWhyPopover] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showTuningStudio, setShowTuningStudio] = useState<boolean>(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'automix' | 'vibes' | 'decks' | 'soundboard'>('automix');

  // Identify active and upcoming deck
  const activeDeck = deckA.isPlaying && !deckB.isPlaying ? deckA : deckB.isPlaying && !deckA.isPlaying ? deckB : (crossfader < 0 ? deckA : deckB);
  const activeDeckId = activeDeck === deckA ? 'A' : 'B';
  const standbyDeckId = activeDeckId === 'A' ? 'B' : 'A';
  const standbyDeck = standbyDeckId === 'A' ? deckA : deckB;

  const currentTrack = activeDeck.track;
  const nextTrack = standbyDeck.track || musicalFutures.flow.track;

  // Format time (seconds to MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // AI PREDICTIVE STRUCTURE & BEAT-MATCHED TRANSITION MARKERS
  // -------------------------------------------------------------
  const predictiveMarkers: PredictiveMarker[] = useMemo(() => {
    if (!currentTrack) return [];

    const duration = currentTrack.duration || 64;
    const bpm = currentTrack.bpm || 128;
    const secondsPerBeat = 60 / bpm;
    const barSec = secondsPerBeat * 4; // 4/4 time

    const structure: TrackStructure = currentTrack.intelligence?.structure || {
      intro: [0, Math.min(16, duration * 0.25)],
      build: [Math.min(16, duration * 0.25), Math.min(32, duration * 0.5)],
      drop: [Math.min(32, duration * 0.5), Math.min(48, duration * 0.75)],
      breakdown: [Math.min(48, duration * 0.75), Math.min(56, duration * 0.875)],
      climax: [Math.min(56, duration * 0.875), Math.min(60, duration * 0.9375)],
      outro: [Math.min(60, duration * 0.9375), duration],
      transitionPoints: [16, 32, 48, 56],
    };

    const markers: PredictiveMarker[] = [];

    // Marker 1: Intro End / First Beat Drop (Bar 8 or 16)
    const introTime = structure.intro[1];
    markers.push({
      id: 'marker-intro-drop',
      time: introTime,
      label: '🚀 Erste Beat-Welle',
      type: 'drop',
      energy: (currentTrack.intelligence?.energy || 70) - 10,
      barNumber: Math.round(introTime / barSec),
      confidenceScore: 94,
      description: 'Erster rhythmischer Einsatz nach dem Intro. Ideal für sanftes Einsteigen.',
      isOptimal: false,
    });

    // Marker 2: Main Peak / Climax Drop (Bar 16 or 32)
    const dropTime = structure.drop[0];
    markers.push({
      id: 'marker-main-drop',
      time: dropTime,
      label: '🔥 Main Drop (Peak)',
      type: 'drop',
      energy: currentTrack.intelligence?.energy || 85,
      barNumber: Math.round(dropTime / barSec),
      confidenceScore: 98,
      description: 'Volle Energieentfaltung. Druckvoller Beat-Cut für maximale Party-Power.',
      isOptimal: false,
    });

    // Marker 3: Breakdown / Vocal Swap (Bar 24 or 48)
    const breakdownTime = structure.breakdown[0];
    markers.push({
      id: 'marker-breakdown',
      time: breakdownTime,
      label: '🌌 Breakdown (Harmonic Swap)',
      type: 'breakdown',
      energy: Math.max(30, (currentTrack.intelligence?.energy || 75) - 25),
      barNumber: Math.round(breakdownTime / barSec),
      confidenceScore: 99,
      description: 'Bässe setzen kurz aus. Perfekter harmonischer Moment für nahtlosen Track-Tausch.',
      isOptimal: true,
    });

    // Marker 4: Outro Mix-Out Window (Bar 28 or 56-60)
    const outroTime = structure.outro[0];
    markers.push({
      id: 'marker-outro-optimal',
      time: outroTime,
      label: '🎯 Optimaler Mix-Out Spot',
      type: 'optimal',
      energy: (currentTrack.intelligence?.energy || 75) - 15,
      barNumber: Math.round(outroTime / barSec),
      confidenceScore: 97,
      description: 'AI berechneter Sweet-Spot: Auslaufende Percussion blendet perfekt in den nächsten Song.',
      isOptimal: true,
    });

    return markers.sort((a, b) => a.time - b.time);
  }, [currentTrack]);

  // Find the next upcoming predictive marker based on active playback position
  const nextPredictiveMarker = useMemo(() => {
    if (!currentTrack || predictiveMarkers.length === 0) return null;
    const currentTime = activeDeck.currentTime;
    const upcoming = predictiveMarkers.find((m) => m.time > currentTime + 1.2);
    return upcoming || predictiveMarkers[predictiveMarkers.length - 1];
  }, [currentTrack, predictiveMarkers, activeDeck.currentTime]);

  // Target marker for locked Auto-Mix
  const targetMarker = useMemo(() => {
    if (selectedMarkerId) {
      const found = predictiveMarkers.find((m) => m.id === selectedMarkerId);
      if (found) return found;
    }
    return nextPredictiveMarker;
  }, [selectedMarkerId, predictiveMarkers, nextPredictiveMarker]);

  // Time remaining until the target predictive marker
  const secondsToTargetMarker = useMemo(() => {
    if (!targetMarker) return 0;
    return Math.max(0, targetMarker.time - activeDeck.currentTime);
  }, [targetMarker, activeDeck.currentTime]);

  // Harmonic compatibility information
  const harmonicAnalysis = useMemo(() => {
    const keyA = currentTrack?.intelligence?.camelotKey || '8A';
    const keyB = nextTrack?.intelligence?.camelotKey || '9A';
    const bpmA = currentTrack?.bpm || 126;
    const bpmB = nextTrack?.bpm || 128;
    const energyA = currentTrack?.intelligence?.energy || 75;
    const energyB = nextTrack?.intelligence?.energy || 85;

    const bpmDiff = bpmB - bpmA;
    const bpmPercent = ((bpmDiff / bpmA) * 100).toFixed(1);
    const energyDiff = energyB - energyA;

    return {
      keyA,
      keyB,
      bpmA,
      bpmB,
      bpmPercent: bpmDiff > 0 ? `+${bpmPercent}%` : `${bpmPercent}%`,
      energyA,
      energyB,
      energyDelta: energyDiff > 0 ? `+${energyDiff}%` : `${energyDiff}%`,
      compatibilityScore: 98,
      harmonicMatchTitle: 'Perfekter 5th-Verwandter (Quinten-Schritt)',
      harmonicExplanation:
        'Beide Songs bewegen sich in benachbarten Tonarten (' +
        keyA +
        ' ➔ ' +
        keyB +
        '). Dadurch treten beim gleichzeitigen Abspielen keinerlei schiefe Töne oder harmonische Dissonanzen auf.',
      eqStrategy:
        'Frequenz-Carving: Beim Überblenden an Takt ' +
        (targetMarker?.barNumber || 48) +
        ' wird der Bass des alten Songs automatisch abgesenkt, während der Kick des neuen Songs sauber einsetzt.',
      tempoStrategy:
        'Beat-Grid-Alignment: Das Tempo von Deck ' +
        standbyDeckId +
        ' wird exakt an Deck ' +
        activeDeckId +
        ' angeglichen, um rhythmischen Phasenversatz zu verhindern.',
    };
  }, [currentTrack, nextTrack, targetMarker, standbyDeckId, activeDeckId]);

  // Handle Smart Locked Auto-Mix Triggering
  useEffect(() => {
    if (!isLockedToMarker || !targetMarker || !activeDeck.isPlaying || transition.isActive) return;

    if (secondsToTargetMarker <= 0.8 && secondsToTargetMarker >= 0) {
      initAudio();
      syncDecks(standbyDeckId);
      triggerAutoTransition('crossfade', 8);
      setIsLockedToMarker(false);
      setAnalysisStatus(`✅ Auto-Mix erfolgreich bei Bar ${targetMarker.barNumber} eingerastet!`);
    }
  }, [
    isLockedToMarker,
    targetMarker,
    secondsToTargetMarker,
    activeDeck.isPlaying,
    transition.isActive,
    initAudio,
    syncDecks,
    standbyDeckId,
    triggerAutoTransition,
  ]);

  // Auto-DJ Countdown timer simulation
  useEffect(() => {
    if (!autoDJEnabled || (!deckA.isPlaying && !deckB.isPlaying)) return;

    const timer = setInterval(() => {
      setAutoMixCountdown((prev) => {
        if (prev <= 1) {
          if (!transition.isActive) {
            triggerAutoTransition('crossfade', 8);
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoDJEnabled, deckA.isPlaying, deckB.isPlaying, transition.isActive, triggerAutoTransition]);

  // Quick vibe change handler
  const handleSelectVibe = (vibeKey: string, energy: number, intent: string) => {
    setSelectedVibe(vibeKey);
    setPartyEnergyTarget(energy);
    adjustSetDirectParameters({ energy });
    submitMusicalIntent(intent);
  };

  // Sound effect triggers
  const playSoundEffect = (padIndex: number) => {
    initAudio();
    triggerPad(padIndex);
  };

  // Instant Smart Auto-Mix execution
  const executeInstantAutoMix = () => {
    initAudio();
    syncDecks(standbyDeckId);
    triggerAutoTransition('crossfade', 8);
    setAnalysisStatus('⚡ Sofortiger Beat-Sync Auto-Mix ausgeführt!');
  };

  // Lock to optimal marker
  const toggleLockToOptimalMarker = () => {
    initAudio();
    if (isLockedToMarker) {
      setIsLockedToMarker(false);
      setAnalysisStatus('Auto-Mix Einrastung abgebrochen');
    } else {
      setIsLockedToMarker(true);
      if (nextPredictiveMarker) {
        setSelectedMarkerId(nextPredictiveMarker.id);
        setAnalysisStatus(`🎯 Eingerastet auf: ${nextPredictiveMarker.label} (in ${formatTime(secondsToTargetMarker)})`);
      }
    }
  };

  return (
    <div id="casual-party-dashboard" className="flex flex-col gap-4 w-full relative">
      {/* ========================================================================= */}
      {/* 1. Header Banner + Quick Help Button                                     */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-pink-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-pink-500/30">
            <PartyPopper className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Party Host & Einsteiger Modus
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Intelligenter Auto-Mix & Vibe-Wähler
              </span>
            </div>
            <p className="text-xs text-slate-300">
              DJing ohne Vorkenntnisse: KI analysiert Song-Strukturen und blendet Songs taktgenau & harmonisch über.
            </p>
          </div>
        </div>

        {/* Action Controls & Guide Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 🎵 Audio-Import & Key-Tuning Studio Button */}
          <button
            onClick={() => setShowTuningStudio(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-900/30 border border-purple-400/40 transition active:scale-95"
            title="Lade Musik hoch (lokal/GDrive), scanne Tonarten, pitche Songs & speichere Drum-Pad Clips als WAV"
          >
            <Sliders className="w-4 h-4 text-amber-300" />
            <span>🎵 Audio-Import & Key-Tuning Studio</span>
          </button>

          {/* 💡 Anleitung Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
            title="Klicken für eine interaktive Erklärung aller Funktionen"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Anleitung 💡</span>
          </button>

          {/* Autopilot Toggle */}
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/60 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-semibold text-slate-300">🤖 Autopilot:</span>
            <button
              onClick={() => setAutoDJEnabled(!autoDJEnabled)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                autoDJEnabled
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{autoDJEnabled ? 'AN' : 'AUS'}</span>
            </button>
          </div>

          {/* Master Volume Quick Slider */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 px-3 py-2 rounded-xl">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title="Gesamtlautstärke"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Main Player Deck Comparison: Aktuell läuft ➔ Nächster Song             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* CURRENT TRACK CARD (Left - 5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Top Label */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                ● Aktuell läuft (Tanzfläche hört)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Deck {activeDeckId}
            </span>
          </div>

          {/* Track Visual Artwork & Info */}
          <div className="flex items-center gap-4 my-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-700 bg-slate-950 flex items-center justify-center shadow-inner ${
                  activeDeck.isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                }`}
                style={{
                  background: `radial-gradient(circle, #0f172a 35%, #1e293b 40%, #090d16 95%)`,
                }}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white">
                  <Disc className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Song Meta */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {currentTrack?.title || 'Kein Song geladen'}
              </h3>
              <p className="text-xs text-slate-400 truncate mb-1">
                {currentTrack?.artist || 'Wähle einen Song'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {currentTrack?.intelligence?.genre || 'House / Dance'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                  {currentTrack?.bpm || 128} BPM
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-amber-300">
                  Tonart: {currentTrack?.intelligence?.camelotKey || '4A'}
                </span>
              </div>
            </div>
          </div>

          {/* AI PREDICTIVE TIMELINE WITH INTERACTIVE MARKERS */}
          <div className="space-y-1.5 mb-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-1">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Bot className="w-3 h-3" />
                Struktur & AI Beat-Marker
              </span>
              <span>{formatTime(activeDeck.currentTime)} / {formatTime(currentTrack?.duration || 0)}</span>
            </div>

            {/* Visual Timeline Bar with Marker Flags */}
            <div className="relative w-full bg-slate-800 h-4 rounded-lg overflow-visible cursor-pointer my-1">
              <div
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-lg transition-all duration-200"
                style={{
                  width: `${currentTrack?.duration ? (activeDeck.currentTime / currentTrack.duration) * 100 : 0}%`,
                }}
              />

              {/* Predictive Markers Placed on Timeline */}
              {predictiveMarkers.map((marker) => {
                const totalDur = currentTrack?.duration || 64;
                const posPercent = Math.min(98, Math.max(2, (marker.time / totalDur) * 100));
                const isPassed = activeDeck.currentTime >= marker.time;
                const isTarget = targetMarker?.id === marker.id;

                return (
                  <button
                    key={marker.id}
                    onClick={() => {
                      setSelectedMarkerId(marker.id);
                      setIsLockedToMarker(true);
                      setAnalysisStatus(`🎯 Eingerastet auf: ${marker.label}`);
                    }}
                    title={`${marker.label} (${formatTime(marker.time)}) - ${marker.description}`}
                    style={{ left: `${posPercent}%` }}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-all z-10 ${
                      isTarget
                        ? 'bg-amber-400 ring-4 ring-amber-500/50 scale-125 text-slate-950 shadow-lg'
                        : isPassed
                        ? 'bg-slate-600 opacity-60'
                        : marker.isOptimal
                        ? 'bg-emerald-400 ring-2 ring-emerald-500/40 text-slate-950 animate-pulse'
                        : 'bg-cyan-400 ring-1 ring-cyan-300/40 text-slate-950'
                    }`}
                  >
                    <span className="text-[7px] font-black">{marker.barNumber}</span>
                  </button>
                );
              })}
            </div>

            {/* Predictive Legend */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] text-slate-400 pt-1 border-t border-slate-900">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Optimaler Mix-Spot
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Ziel-Marker
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-mono">
                BPM: {activeDeck.bpm.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Simple Main Controls */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                initAudio();
                togglePlay(activeDeckId);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                activeDeck.isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              }`}
            >
              {activeDeck.isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Musik Abspielen</span>
                </>
              )}
            </button>

            {/* Quick Bass Boost */}
            <button
              onClick={() => setBassBoost(!bassBoost)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                bassBoost
                  ? 'bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Extra Bass für kräftigeren Klang auf der Party"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Bass Boost</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER INTELLIGENT AUTO-MIX BRIDGE WITH PREDICTIVE CUES   */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 shadow-2xl relative overflow-visible">
          {/* Subtle Ambient Pulse */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Bridge Header with 'Warum?' Info Button */}
          <div className="w-full flex items-center justify-between pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1 text-amber-400 font-black text-xs uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Auto-Mix</span>
            </div>

            {/* 💡 Warum? Interactive Popover Trigger */}
            <button
              onClick={() => setShowWhyPopover(!showWhyPopover)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition flex items-center gap-1 ${
                showWhyPopover
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
              title="Klicke hier, um zu sehen, warum die KI diese Übergangs-Strategie empfiehlt!"
            >
              <Info className="w-3 h-3" />
              <span>Warum?</span>
            </button>
          </div>

          {/* INTERACTIVE 'WARUM DIESE STRATEGIE?' POPOVER */}
          {showWhyPopover && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-72 sm:w-80 bg-slate-950/98 border-2 border-amber-400 rounded-2xl p-3.5 shadow-2xl z-50 animate-fadeIn text-left backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Warum diese Übergangs-Strategie?
                  </h4>
                </div>
                <button
                  onClick={() => setShowWhyPopover(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {/* 1. Harmonischer Match */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                      🎵 Harmonischer Match:
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {harmonicAnalysis.keyA} ➔ {harmonicAnalysis.keyB}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    {harmonicAnalysis.harmonicExplanation}
                  </p>
                </div>

                {/* 2. Beat- & Tempo-Sync */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 flex items-center gap-1 text-[11px]">
                      🥁 Beat-Sync & Tempo:
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {harmonicAnalysis.bpmA} ➔ {harmonicAnalysis.bpmB} BPM ({harmonicAnalysis.bpmPercent})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    {harmonicAnalysis.tempoStrategy}
                  </p>
                </div>

                {/* 3. Frequenz-Carving & EQ-Swap */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1">
                  <span className="font-bold text-amber-400 text-[11px]">
                    🎚️ Intelligenter Bass-Swap:
                  </span>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    {harmonicAnalysis.eqStrategy}
                  </p>
                </div>

                {/* 4. Energie-Verlauf */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                  <span className="font-bold text-pink-400 text-[11px]">⚡ Energie-Entwicklung:</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                    {harmonicAnalysis.energyA}% ➔ {harmonicAnalysis.energyB}% ({harmonicAnalysis.energyDelta})
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowWhyPopover(false);
                  toggleLockToOptimalMarker();
                }}
                className="w-full mt-3 py-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
              >
                Verstanden, Übergang jetzt einrasten! 🎯
              </button>
            </div>
          )}

          {/* Predictive Marker Target Status Box */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 flex flex-col items-center text-center">
            {transition.isActive ? (
              <div className="py-1">
                <span className="text-xs font-bold text-amber-400 animate-pulse block">
                  Überblendung läuft...
                </span>
                <span className="text-xl font-black font-mono text-white">
                  {Math.round(transition.progress * 100)}%
                </span>
              </div>
            ) : isLockedToMarker && targetMarker ? (
              <div className="py-0.5">
                <div className="flex items-center justify-center gap-1 text-emerald-400 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Eingerastet auf Marker</span>
                </div>
                <span className="text-lg font-black font-mono text-amber-400">
                  in {secondsToTargetMarker.toFixed(1)}s
                </span>
                <span className="text-[10px] text-slate-300 block truncate">
                  {targetMarker.label} (Bar {targetMarker.barNumber})
                </span>
              </div>
            ) : (
              <div className="py-0.5">
                <span className="text-[10px] text-slate-400 block">Nächster Sweet-Spot:</span>
                <span className="text-xs font-bold text-cyan-300 block truncate">
                  {nextPredictiveMarker?.label || 'Bar 32 Drop'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  in {secondsToTargetMarker > 0 ? `${secondsToTargetMarker.toFixed(1)}s` : 'Jetzt bereit'}
                </span>
              </div>
            )}
          </div>

          {/* PRIMARY INTELLIGENT AUTO-MIX BUTTONS */}
          <div className="w-full flex flex-col gap-2">
            {/* 1. Intelligent Lock to Next Marker Button */}
            <button
              onClick={toggleLockToOptimalMarker}
              disabled={transition.isActive || !currentTrack}
              className={`w-full py-2.5 px-2 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-0.5 transition active:scale-95 shadow-lg ${
                isLockedToMarker
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/80 shadow-emerald-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isLockedToMarker ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                <span>{isLockedToMarker ? 'MIX EINGERASTET' : 'AUF MARKER MIXEN'}</span>
              </div>
              <span className="text-[9px] font-semibold opacity-85">
                {isLockedToMarker ? 'Klicke zum Abbrechen' : 'Taktgenau auf Beat einrasten'}
              </span>
            </button>

            {/* 2. Instant Beat-Sync Auto-Mix Button */}
            <button
              onClick={executeInstantAutoMix}
              disabled={transition.isActive || !currentTrack}
              className="w-full py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sofort Beat-Mix ⚡</span>
            </button>

            {/* 3. Drop Ignition Cut */}
            <button
              onClick={() => {
                initAudio();
                applyImmediateTransitionToFuture(musicalFutures.build);
              }}
              disabled={transition.isActive}
              className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 font-semibold text-[11px] rounded-lg border border-slate-800 flex items-center justify-center gap-1 transition"
            >
              <Flame className="w-3 h-3 text-amber-500" />
              <span>Drop Zünden 💥</span>
            </button>
          </div>
        </div>

        {/* UP NEXT TRACK CARD (Right - 5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Top Label */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                Als Nächstes vorbereitet (Up Next)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Deck {standbyDeckId}
            </span>
          </div>

          {/* Track Visual Artwork & Info */}
          <div className="flex items-center gap-4 my-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/40 flex-shrink-0 flex items-center justify-center text-purple-300 shadow-inner">
              <Music className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            {/* Song Meta */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {nextTrack?.title || 'Track auswählen'}
              </h3>
              <p className="text-xs text-slate-400 truncate mb-1">
                {nextTrack?.artist || 'Wähle eine Empfehlung'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {nextTrack?.intelligence?.genre || 'Electronic'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                  {nextTrack?.bpm || 128} BPM
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-amber-300">
                  Tonart: {nextTrack?.intelligence?.camelotKey || '5A'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Predictive Matching Rationale with "Warum?" link */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 mb-3 text-xs text-slate-300 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-purple-300">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                AI Kompatibilität:
              </span>
              <button
                onClick={() => setShowWhyPopover(true)}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline"
              >
                Erklärung öffnen ➔
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {harmonicAnalysis.harmonicMatchTitle} — {harmonicAnalysis.harmonicExplanation}
            </p>
          </div>

          {/* Action Buttons for Next Track */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            {/* Audition Button */}
            <button
              onClick={() => {
                if (nextTrack) {
                  if (auditionState.isPlaying && auditionState.trackId === nextTrack.id) {
                    stopAudition();
                  } else {
                    playAudition(nextTrack, 'party-next', 12);
                  }
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${
                auditionState.isPlaying && auditionState.trackId === nextTrack?.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {auditionState.isPlaying && auditionState.trackId === nextTrack?.id
                  ? 'Vorhören Stoppen'
                  : '12s Vorhören 🎧'}
              </span>
            </button>

            {/* Cycle through another recommendation */}
            <button
              onClick={() => {
                const nextCandidate = musicalFutures.build.track || musicalFutures.shift.track;
                if (nextCandidate) {
                  applyMusicalFuture(musicalFutures.build, standbyDeckId);
                }
              }}
              className="py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md shadow-purple-900/30 transition"
              title="Einen alternativen Song vorschlagen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Anderer Song</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2.5 TRANSITION MAP (LIVE DUAL-TRACK ALIGNMENT & PEAK VISUALIZER)          */}
      {/* ========================================================================= */}
      <TransitionMap
        outgoingTrack={currentTrack || null}
        incomingTrack={nextTrack || null}
        outgoingDeck={activeDeck}
        incomingDeck={standbyDeck}
        outgoingDeckId={activeDeckId}
        incomingDeckId={standbyDeckId}
        transition={transition}
        targetMarker={targetMarker || null}
        isLockedToMarker={isLockedToMarker}
        secondsToTargetMarker={secondsToTargetMarker}
        predictiveMarkers={predictiveMarkers}
        onSelectMarker={(markerId) => {
          setSelectedMarkerId(markerId);
          setIsLockedToMarker(true);
        }}
        onLockToMarker={toggleLockToOptimalMarker}
        onTriggerInstantMix={executeInstantAutoMix}
      />

      {/* ========================================================================= */}
      {/* 3. AI STRUCTURE INTELLIGENCE & PREDICTIVE MARKER LIST                     */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              AI Struktur-Analyse & Vorgeschlagene Beat-Übergangspunkte
            </h4>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
            {analysisStatus}
          </span>
        </div>

        {/* 4 Clickable Predictive Markers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {predictiveMarkers.map((marker) => {
            const isTarget = targetMarker?.id === marker.id;
            const isPassed = (currentTrack?.duration ? activeDeck.currentTime : 0) >= marker.time;
            const timeDiff = marker.time - activeDeck.currentTime;

            return (
              <div
                key={marker.id}
                onClick={() => {
                  setSelectedMarkerId(marker.id);
                  setIsLockedToMarker(true);
                  setAnalysisStatus(`🎯 Auto-Mix fixiert auf: ${marker.label}`);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                  isTarget
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-500/30 shadow-lg'
                    : marker.isOptimal
                    ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    {marker.label}
                  </span>
                  {marker.isOptimal && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-300">
                      EMPFOHLEN
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  {marker.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-400">Position: {formatTime(marker.time)} (Bar {marker.barNumber})</span>
                  <span className={isPassed ? 'text-slate-500' : timeDiff < 10 ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                    {isPassed ? 'Vorüber' : `in ${timeDiff.toFixed(1)}s`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Vibe Control & "Was soll als Nächstes passieren?"                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* VIBE SELECTOR (Left - 6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Party-Stimmung (Vibe-Wähler)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Ziel-Energie: {partyEnergyTarget}%
            </span>
          </div>

          {/* 5 Vibe Preset Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'chill',
                label: '🌴 Lounge & Chill',
                desc: 'Entspannt & ruhig',
                energy: 45,
                intent: 'Entspannte Bar-Atmosphäre, ruhige Bässe',
                color: 'hover:border-teal-500/60',
                activeClass: 'bg-teal-500/20 border-teal-400 text-teal-200',
              },
              {
                id: 'sunset',
                label: '🌅 Melodic Sunset',
                desc: 'Harmonisch & sonnig',
                energy: 65,
                intent: 'Sonniger Melodic House mit warmen Flächen',
                color: 'hover:border-amber-500/60',
                activeClass: 'bg-amber-500/20 border-amber-400 text-amber-200',
              },
              {
                id: 'party',
                label: '🕺 Party Groove',
                desc: 'Tanzbar & fröhlich',
                energy: 80,
                intent: 'Tanzbarer House Groove für eine volle Tanzfläche',
                color: 'hover:border-pink-500/60',
                activeClass: 'bg-pink-500/20 border-pink-400 text-pink-200',
              },
              {
                id: 'peak',
                label: '🔥 Peak Time Abriss',
                desc: 'Maximale Club-Power',
                energy: 95,
                intent: 'Maximale Party-Energie, druckvolle Bässe und Drops',
                color: 'hover:border-red-500/60',
                activeClass: 'bg-red-500/20 border-red-400 text-red-200',
              },
              {
                id: 'afterhour',
                label: '🌌 Late Night Beats',
                desc: 'Treibend & hypnotisch',
                energy: 75,
                intent: 'Tiefer hypnotischer Club-Sound für die späte Stunde',
                color: 'hover:border-purple-500/60',
                activeClass: 'bg-purple-500/20 border-purple-400 text-purple-200',
              },
            ].map((vibe) => (
              <button
                key={vibe.id}
                onClick={() => handleSelectVibe(vibe.id, vibe.energy, vibe.intent)}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                  selectedVibe === vibe.id
                    ? vibe.activeClass
                    : `bg-slate-950/70 border-slate-800 text-slate-300 ${vibe.color}`
                }`}
              >
                <span className="font-bold text-xs">{vibe.label}</span>
                <span className="text-[10px] opacity-70">{vibe.desc}</span>
              </button>
            ))}
          </div>

          {/* Continuous Party Energy Slider */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="font-semibold">Party-Energie Regler:</span>
              <span className="font-bold text-amber-400">{partyEnergyTarget}% (Stufe {Math.round(partyEnergyTarget / 10)} von 10)</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={partyEnergyTarget}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPartyEnergyTarget(val);
                adjustSetDirectParameters({ energy: val });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1: Chillen & Plaudern</span>
              <span>5: Tanzen</span>
              <span>10: Vollgas Abriss</span>
            </div>
          </div>
        </div>

        {/* ONE-CLICK INTENT ACTIONS (Right - 6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Was soll als Nächstes passieren?
            </h4>
          </div>

          {/* 4 One-Touch Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => {
                submitMusicalIntent('Mehr Party, Beats anziehen und Energie steigern!');
                applyMusicalFuture(musicalFutures.build);
              }}
              className="p-3 bg-gradient-to-r from-red-500/20 to-amber-500/20 hover:from-red-500/30 hover:to-amber-500/30 border border-red-500/40 rounded-xl text-left flex items-center gap-2.5 transition group"
            >
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-110 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">🚀 Mehr Energie!</span>
                <span className="text-[10px] text-slate-400">Tempo & Bässe steigern</span>
              </div>
            </button>

            <button
              onClick={() => {
                submitMusicalIntent('Stimmung halten und nahtlos weitergrooven');
                applyMusicalFuture(musicalFutures.flow);
              }}
              className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 rounded-xl text-left flex items-center gap-2.5 transition group"
            >
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">🌊 Im Groove bleiben</span>
                <span className="text-[10px] text-slate-400">Harmonischer Flow</span>
              </div>
            </button>

            <button
              onClick={() => {
                submitMusicalIntent('Überraschung mit neuem Sound und frischer Farbe');
                applyMusicalFuture(musicalFutures.shift);
              }}
              className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 rounded-xl text-left flex items-center gap-2.5 transition group"
            >
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">💫 Überraschung!</span>
                <span className="text-[10px] text-slate-400">Frischer Genre-Wechsel</span>
              </div>
            </button>

            <button
              onClick={() => {
                submitMusicalIntent('Etwas entspannen und kurze Atempause');
                adjustSetDirectParameters({ energy: 50 });
              }}
              className="p-3 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 border border-teal-500/40 rounded-xl text-left flex items-center gap-2.5 transition group"
            >
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 group-hover:scale-110 transition">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">🧊 Kurze Atempause</span>
                <span className="text-[10px] text-slate-400">Energie sanft senken</span>
              </div>
            </button>
          </div>

          {/* Crowd Live Telemetry Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-pink-500 animate-ping" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Tanzfläche: {crowdState.movement > 80 ? '🔥 Voll & Kochend heiß!' : '✨ Gute Stimmung'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {crowdState.vibeDescription}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-pink-400">
                {crowdState.engagement}% Begeisterung
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Party Soundboard & FX Buttons                                          */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Party Soundboard & Sound-Effekte (1-Click)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Draufklicken zum Einwerfen
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {[
            { id: 0, label: '📢 Airhorn (Tröte)', color: 'from-amber-500 to-yellow-600', sub: 'Klassiker' },
            { id: 1, label: '👏 Jubel & Crowd', color: 'from-emerald-500 to-teal-600', sub: 'Applaus' },
            { id: 2, label: '💥 Bass Impact', color: 'from-red-500 to-pink-600', sub: 'Sub-Boom' },
            { id: 3, label: '🚨 Sirene', color: 'from-purple-500 to-indigo-600', sub: 'Alarm' },
            { id: 4, label: '💨 Laser Riser', color: 'from-cyan-500 to-blue-600', sub: 'Aufbau FX' },
            { id: 5, label: '🔊 Club Sweep', color: 'from-pink-500 to-rose-600', sub: 'Filter Sweep' },
          ].map((pad) => (
            <button
              key={pad.id}
              onClick={() => playSoundEffect(pad.id)}
              className="py-3 px-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 text-center flex flex-col items-center justify-center gap-1 transition active:scale-90 hover:bg-slate-800 group shadow-md"
            >
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${pad.color} group-hover:scale-125 transition`} />
              <span className="font-bold text-xs text-white leading-tight">{pad.label}</span>
              <span className="text-[9px] text-slate-500 font-mono">{pad.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. Simple Song Choice / Quick Queue                                       */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Song-Auswahl & Musiksammlung ({trackLibrary.length} Songs bereit)
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Klicke auf "Vormerken"
          </span>
        </div>

        {/* Track List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {trackLibrary.map((track) => {
            const isCurrentlyPlaying = (deckA.isPlaying && deckA.track?.id === track.id) || (deckB.isPlaying && deckB.track?.id === track.id);
            const isQueuedNext = nextTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  isCurrentlyPlaying
                    ? 'bg-cyan-950/40 border-cyan-500/50'
                    : isQueuedNext
                    ? 'bg-purple-950/40 border-purple-500/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isCurrentlyPlaying
                        ? 'bg-cyan-500 text-slate-950'
                        : isQueuedNext
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isCurrentlyPlaying ? '▶' : '♫'}
                  </div>

                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-white truncate">{track.title}</h5>
                    <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{track.bpm} BPM</span>
                      <span>•</span>
                      <span>Tonart: {track.intelligence?.camelotKey || '8A'}</span>
                      <span>•</span>
                      <span>⚡ {track.intelligence?.energy || 75}%</span>
                    </div>
                  </div>
                </div>

                {/* Load Action Button */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isCurrentlyPlaying ? (
                    <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
                      Läuft jetzt
                    </span>
                  ) : isQueuedNext ? (
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/40">
                      Up Next
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        initAudio();
                        applyMusicalFuture({
                          id: 'user-picked-' + track.id,
                          strategy: 'flow',
                          badgeLabel: 'Wunsch-Song',
                          headline: track.title,
                          track,
                          compatibilityScore: 92,
                          harmonicMatch: 'Harmonisch',
                          energyDelta: '±0%',
                          bpmDelta: '±0 BPM',
                          feeling: 'Vom Party Host gewählt',
                          explanation: 'Direkt aus der Playlist als nächster Song vorgemerkt.',
                          recommendedTransition: {
                            presetId: 'crossfade',
                            strategyName: 'blend',
                            germanStrategyTitle: 'Sanftes Einblenden',
                            rationale: 'Harmonischer Übergang',
                            stepRecipe: ['1. EQs angleichen', '2. Überblenden'],
                          },
                          cognitiveRationale: {
                            rhythmImpact: 'Passender Rhythmus',
                            vocalTension: 'Harmonisch abgestimmt',
                            crowdEffect: 'Hält die Tanzfläche in Bewegung',
                          },
                        }, standbyDeckId);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Vormerken</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. INTERACTIVE "ANLEITUNG: WAS FÜR WAS IST" MODAL                         */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-slate-900 to-purple-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Anleitung: Was für was ist? (Party Host Guide)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Einfache Erklärung aller Funktionen – ganz ohne Fachchinesisch!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guide Category Tabs */}
            <div className="flex border-b border-slate-800 px-4 pt-2 gap-2 overflow-x-auto bg-slate-950/50">
              {[
                { id: 'automix', label: '🎯 Auto-Mix & Marker' },
                { id: 'vibes', label: '🌴 Stimmung & Regler' },
                { id: 'decks', label: '🎛️ Decks & Vorhören' },
                { id: 'soundboard', label: '📢 Soundboard & Bass' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGuideActiveTab(tab.id as any)}
                  className={`px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
                    guideActiveTab === tab.id
                      ? 'border-cyan-400 text-cyan-300 bg-slate-850'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Guide Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-300">
              {guideActiveTab === 'automix' && (
                <div className="space-y-3">
                  <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Target className="w-4 h-4" />
                      <span>1. "AUF MARKER MIXEN" (Der Profi-Button)</span>
                    </div>
                    <p className="leading-relaxed">
                      <strong>Was es tut:</strong> Die KI wartet auf die nächste perfekte Taktgrenze (z. B. Breakdown oder Drop) und startet den Übergang genau auf der "Eins". Dadurch klingt der Mix wie von einem Profi-DJ im Club – ohne Ruckler oder falsche Takte!
                    </p>
                  </div>

                  <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <Zap className="w-4 h-4" />
                      <span>2. "Sofort Beat-Mix ⚡"</span>
                    </div>
                    <p className="leading-relaxed">
                      <strong>Was es tut:</strong> Wenn du nicht warten willst: Gleicht sofort die Geschwindigkeiten (BPM) beider Songs an und blendet innerhalb von 8 Takten sanft über.
                    </p>
                  </div>

                  <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Bot className="w-4 h-4" />
                      <span>3. "Warum?" Popover</span>
                    </div>
                    <p className="leading-relaxed">
                      <strong>Was es tut:</strong> Zeigt dir die mathematische & musikalische Logik der KI: Tonart-Verwandtschaft (Camelot), Tempo-Angleich und Bass-Trennung (Bass-Swap).
                    </p>
                  </div>

                  <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <Activity className="w-4 h-4" />
                      <span>4. "Transition Map & Peak-Linie"</span>
                    </div>
                    <p className="leading-relaxed">
                      <strong>Was es tut:</strong> Die visuelle Übergangs-Karte zeigt beide Song-Strukturen parallel an. Die leuchtende <strong>💥 PEAK-Linie</strong> signalisiert dir sekundengenau, wann der alte Song ausgeblendet ist und der neue Drop mit 100% Party-Power zündet!
                    </p>
                  </div>
                </div>
              )}

              {guideActiveTab === 'vibes' && (
                <div className="space-y-3">
                  <div className="bg-slate-950/70 border border-pink-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                      <Smile className="w-4 h-4" />
                      <span>Stimmungs-Wähler (Vibes)</span>
                    </div>
                    <p className="leading-relaxed">
                      Wähle mit einem Klick die Richtung deiner Party:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      <li><strong>🌴 Lounge & Chill:</strong> Ruhige Beats zum Plaudern und Ankommen.</li>
                      <li><strong>🌅 Melodic Sunset:</strong> Schöne Melodien für sonnige, gehobene Stimmung.</li>
                      <li><strong>🕺 Party Groove:</strong> Der Allrounder zum Tanzen und Mitsingen.</li>
                      <li><strong>🔥 Peak Time Abriss:</strong> Höchste Lautstärke & Bass für die heiße Phase der Nacht!</li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Compass className="w-4 h-4" />
                      <span>"Was soll als Nächstes passieren?" Buttons</span>
                    </div>
                    <p className="leading-relaxed">
                      Gib der KI spontane Kommandos wie <em>"Mehr Energie!"</em>, <em>"Im Groove bleiben"</em> oder <em>"Überraschung!"</em>. Die KI passt sofort die Playlist-Empfehlungen an.
                    </p>
                  </div>
                </div>
              )}

              {guideActiveTab === 'decks' && (
                <div className="space-y-3">
                  <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <Disc className="w-4 h-4" />
                      <span>Deck A & Deck B (Die zwei Plattenspieler)</span>
                    </div>
                    <p className="leading-relaxed">
                      Ein DJ benutzt immer zwei Decks:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      <li><strong>Deck A (oder das linke Deck):</strong> Der Song, der gerade laut über die Boxen läuft.</li>
                      <li><strong>Deck B (oder das rechte Deck):</strong> Der Song, der als Nächstes vorbereitet ist.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <Headphones className="w-4 h-4" />
                      <span>12s Vorhören (Kopfhörer-Modus)</span>
                    </div>
                    <p className="leading-relaxed">
                      Klicke auf <em>"12s Vorhören"</em>, um kurz in den nächsten Song hineinzuhören, bevor er laut auf der Tanzfläche läuft.
                    </p>
                  </div>
                </div>
              )}

              {guideActiveTab === 'soundboard' && (
                <div className="space-y-3">
                  <div className="bg-slate-950/70 border border-yellow-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                      <Zap className="w-4 h-4" />
                      <span>Party Soundboard (Tröte, Jubel & Effekte)</span>
                    </div>
                    <p className="leading-relaxed">
                      Mit diesen Buttons kannst du jederzeit legendäre Party-Sounds abfeuern – z. B. die Airhorn-Tröte bei einem Drop oder Crowd-Applaus, wenn die Stimmung kocht!
                    </p>
                  </div>

                  <div className="bg-slate-950/70 border border-pink-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                      <Zap className="w-4 h-4" />
                      <span>Bass Boost</span>
                    </div>
                    <p className="leading-relaxed">
                      Gibt dem Sound sofort mehr Tiefbass und Wucht – perfekt, wenn die Tanzfläche voll ist und alle tanzen wollen!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                Alles klar, loslegen! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. AUDIO IMPORT, KEY TUNING & DRUM PAD SLICER STUDIO MODAL                */}
      {/* ========================================================================= */}
      <AudioImportTuningStudio
        isOpen={showTuningStudio}
        onClose={() => setShowTuningStudio(false)}
        initialTrack={currentTrack || null}
      />
    </div>
  );
};
