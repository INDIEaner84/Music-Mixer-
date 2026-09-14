import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  Target,
  Bot,
  Activity,
  ArrowRight,
  TrendingUp,
  Volume2,
  Radio,
  Clock,
  Layers,
  Check,
  Disc,
} from 'lucide-react';
import { DeckState, Track, TrackStructure, TransitionPresetId, TransitionState } from '../types';

export interface PredictiveMarker {
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

interface TransitionMapProps {
  outgoingTrack: Track | null;
  incomingTrack: Track | null;
  outgoingDeck: DeckState;
  incomingDeck: DeckState;
  outgoingDeckId: 'A' | 'B';
  incomingDeckId: 'A' | 'B';
  transition: TransitionState;
  targetMarker: PredictiveMarker | null;
  isLockedToMarker: boolean;
  secondsToTargetMarker: number;
  predictiveMarkers: PredictiveMarker[];
  onSelectMarker: (markerId: string) => void;
  onLockToMarker: () => void;
  onTriggerInstantMix: () => void;
}

export const TransitionMap: React.FC<TransitionMapProps> = ({
  outgoingTrack,
  incomingTrack,
  outgoingDeck,
  incomingDeck,
  outgoingDeckId,
  incomingDeckId,
  transition,
  targetMarker,
  isLockedToMarker,
  secondsToTargetMarker,
  predictiveMarkers,
  onSelectMarker,
  onLockToMarker,
  onTriggerInstantMix,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'8bar-blend' | '4bar-drop' | '16bar-breakdown'>('8bar-blend');

  const outDuration = outgoingTrack?.duration || 64;
  const inDuration = incomingTrack?.duration || 64;

  const outCurrentTime = outgoingDeck.currentTime;
  const outProgressPercent = Math.min(100, Math.max(0, (outCurrentTime / outDuration) * 100));

  // Compute structure for outgoing track
  const outStructure: TrackStructure = outgoingTrack?.intelligence?.structure || {
    intro: [0, Math.min(16, outDuration * 0.25)],
    build: [Math.min(16, outDuration * 0.25), Math.min(32, outDuration * 0.5)],
    drop: [Math.min(32, outDuration * 0.5), Math.min(48, outDuration * 0.75)],
    breakdown: [Math.min(48, outDuration * 0.75), Math.min(56, outDuration * 0.875)],
    climax: [Math.min(56, outDuration * 0.875), Math.min(60, outDuration * 0.9375)],
    outro: [Math.min(60, outDuration * 0.9375), outDuration],
    transitionPoints: [16, 32, 48, 56],
  };

  // Compute structure for incoming track
  const inStructure: TrackStructure = incomingTrack?.intelligence?.structure || {
    intro: [0, Math.min(16, inDuration * 0.25)],
    build: [Math.min(16, inDuration * 0.25), Math.min(32, inDuration * 0.5)],
    drop: [Math.min(32, inDuration * 0.5), Math.min(48, inDuration * 0.75)],
    breakdown: [Math.min(48, inDuration * 0.75), Math.min(56, inDuration * 0.875)],
    climax: [Math.min(56, inDuration * 0.875), Math.min(60, inDuration * 0.9375)],
    outro: [Math.min(60, inDuration * 0.9375), inDuration],
    transitionPoints: [16, 32, 48, 56],
  };

  // Determine transition peak timing
  // If transition is active, progress goes 0 -> 1. Peak is at ~65%-100%
  const transitionStartSec = targetMarker?.time || outStructure.outro[0];
  const transitionDurationSec = selectedStrategy === '4bar-drop' ? 8 : selectedStrategy === '16bar-breakdown' ? 24 : 15;
  const peakTimeSec = transitionStartSec + (transitionDurationSec * 0.6); // Peak point in song time

  // Outgoing marker positions relative to percentage of track
  const peakPercent = Math.min(95, Math.max(5, (peakTimeSec / outDuration) * 100));
  const targetMarkerPercent = Math.min(95, Math.max(5, (transitionStartSec / outDuration) * 100));

  // Time remaining until Peak Moment
  const secondsToPeak = transition.isActive
    ? Math.max(0, (1 - transition.progress) * transitionDurationSec)
    : Math.max(0, peakTimeSec - outCurrentTime);

  // Incoming Track Peak Alignment
  // Incoming track's drop starts at inStructure.drop[0] or intro[1]
  const inDropStartSec = inStructure.drop[0];
  const inDropPercent = (inDropStartSec / inDuration) * 100;

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="transition-map-container" className="bg-slate-900/95 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-44 bg-gradient-to-b from-amber-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-36 bg-gradient-to-t from-cyan-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header & Live Telemetry Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Transition Map: KI-Beat-Struktur & Peak-Verlauf</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-300">
                Live Alignment
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zeigt grafisch, wie der aktuelle Song in den Takt & Drop des nächsten Songs überblendet.
            </p>
          </div>
        </div>

        {/* Live Peak Telemetry Pill */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl self-start md:self-auto">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${transition.isActive ? 'bg-amber-400 animate-ping' : isLockedToMarker ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[11px] font-semibold text-slate-300">
              {transition.isActive ? 'Überblendung aktiv:' : isLockedToMarker ? 'Einrastung scharf:' : 'Nächster Peak:'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">
            {transition.isActive
              ? `${Math.round(transition.progress * 100)}% (Peak in ${secondsToPeak.toFixed(1)}s)`
              : isLockedToMarker
              ? `in ${secondsToTargetMarker.toFixed(1)}s`
              : `in ${secondsToPeak.toFixed(1)}s (${formatTime(peakTimeSec)})`}
          </span>
        </div>
      </div>

      {/* 2. DUAL-LANE BEAT STRUCTURE & LIVE PROGRESS VISUALIZER */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 relative">
        {/* UPPER TRACK: OUTGOING (CURRENT) DECK */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-xs">
                Deck {outgoingDeckId}: {outgoingTrack?.title || 'Aktueller Song'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {outgoingTrack?.bpm || 128} BPM • {outgoingTrack?.intelligence?.camelotKey || '4A'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {formatTime(outCurrentTime)} / {formatTime(outDuration)}
            </span>
          </div>

          {/* Outgoing Track Structure Lane */}
          <div className="relative h-10 w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80 flex">
            {/* Sections */}
            <div
              style={{ width: `${(outStructure.intro[1] / outDuration) * 100}%` }}
              className="h-full bg-cyan-950/40 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-cyan-400/80"
              title="Intro"
            >
              Intro
            </div>
            <div
              style={{ width: `${((outStructure.build[1] - outStructure.build[0]) / outDuration) * 100}%` }}
              className="h-full bg-blue-950/50 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-blue-300"
              title="Build-Up"
            >
              Build
            </div>
            <div
              style={{ width: `${((outStructure.drop[1] - outStructure.drop[0]) / outDuration) * 100}%` }}
              className="h-full bg-indigo-950/60 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-indigo-300 font-bold"
              title="Main Drop"
            >
              Drop
            </div>
            <div
              style={{ width: `${((outStructure.breakdown[1] - outStructure.breakdown[0]) / outDuration) * 100}%` }}
              className="h-full bg-purple-950/50 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-purple-300"
              title="Breakdown (Vocal Swap)"
            >
              Break
            </div>
            <div
              style={{ width: `${((outStructure.outro[1] - outStructure.outro[0]) / outDuration) * 100}%` }}
              className="h-full bg-amber-950/50 flex items-center justify-center text-[9px] font-mono text-amber-300 font-bold animate-pulse"
              title="Mix-Out Window"
            >
              Mix-Out Spot 🎯
            </div>

            {/* Live Playback Progress Fill */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-cyan-500/25 pointer-events-none transition-all duration-150 border-r-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${outProgressPercent}%` }}
            />

            {/* Target Marker Flag on Outgoing Deck */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 pointer-events-none"
              style={{ left: `${targetMarkerPercent}%` }}
            >
              <div className="absolute -top-1 -translate-x-1/2 bg-amber-400 text-slate-950 px-1 py-0.2 text-[8px] font-black rounded-full shadow">
                START
              </div>
            </div>

            {/* Peak Moment Beam on Outgoing Deck */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-pink-500 to-amber-400 z-20 pointer-events-none shadow-[0_0_10px_rgba(245,158,11,1)]"
              style={{ left: `${peakPercent}%` }}
            >
              <div className="absolute -top-1.5 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 px-1.5 py-0.2 text-[8px] font-black rounded-full shadow">
                💥 PEAK
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DUAL-DECK TRANSITION BRIDGE & LIVE ENVELOPE CURVE STAGE   */}
        {/* ========================================================= */}
        <div className="relative py-2 px-1 flex flex-col items-center justify-center">
          {/* Visual Linking Connector Zone */}
          <div className="w-full h-14 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-xl border border-slate-800 relative flex items-center px-4 overflow-hidden">
            {/* Ambient Animated Energy Wave */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-amber-500/15 to-purple-500/10 pointer-events-none" />

            {/* Transition Phase Steps */}
            <div className="grid grid-cols-3 w-full text-center z-10 gap-2">
              {/* Phase 1 */}
              <div className={`p-1.5 rounded-lg border transition ${
                transition.isActive && transition.progress < 0.35
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[10px] font-bold block">1. Beat-Grid Sync</span>
                <span className="text-[9px] opacity-75">Deck {incomingDeckId} läuft an</span>
              </div>

              {/* Phase 2: Bass-Swap */}
              <div className={`p-1.5 rounded-lg border transition ${
                transition.isActive && transition.progress >= 0.35 && transition.progress < 0.7
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[10px] font-bold block text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" />
                  2. Bass-Swap
                </span>
                <span className="text-[9px] opacity-75">EQ-Frequenzen tauschen</span>
              </div>

              {/* Phase 3: Peak Impact Drop */}
              <div className={`p-1.5 rounded-lg border transition ${
                transition.isActive && transition.progress >= 0.7
                  ? 'bg-pink-500/30 border-pink-400 text-pink-200 shadow-lg shadow-pink-500/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[10px] font-bold block text-pink-300 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-pink-400" />
                  3. 💥 PEAK IMPACT
                </span>
                <span className="text-[9px] opacity-75">100% Drop auf Deck {incomingDeckId}</span>
              </div>
            </div>

            {/* Scanning Laser Progress Indicator */}
            {transition.isActive && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)] z-20 transition-all duration-100"
                style={{ left: `${transition.progress * 100}%` }}
              />
            )}
          </div>
        </div>

        {/* LOWER TRACK: INCOMING (UP NEXT) DECK */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-xs">
                Deck {incomingDeckId}: {incomingTrack?.title || 'Als Nächstes vorbereitet'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {incomingTrack?.bpm || 128} BPM • {incomingTrack?.intelligence?.camelotKey || '5A'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {incomingDeck.isPlaying ? `${formatTime(incomingDeck.currentTime)} / ${formatTime(inDuration)}` : `Bereit für In-Mix bei Bar ${Math.round(inStructure.intro[1] / 2)}`}
            </span>
          </div>

          {/* Incoming Track Structure Lane */}
          <div className="relative h-10 w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80 flex">
            {/* Sections */}
            <div
              style={{ width: `${(inStructure.intro[1] / inDuration) * 100}%` }}
              className="h-full bg-purple-950/40 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-purple-300"
              title="Intro (Einstiegszone)"
            >
              Intro (In-Mix)
            </div>
            <div
              style={{ width: `${((inStructure.build[1] - inStructure.build[0]) / inDuration) * 100}%` }}
              className="h-full bg-indigo-950/50 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-indigo-300"
              title="Build-Up"
            >
              Build
            </div>
            <div
              style={{ width: `${((inStructure.drop[1] - inStructure.drop[0]) / inDuration) * 100}%` }}
              className="h-full bg-gradient-to-r from-pink-950/60 to-purple-950/60 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-pink-300 font-bold shadow-inner"
              title="Main Drop (Peak)"
            >
              💥 Main Drop (Peak)
            </div>
            <div
              style={{ width: `${((inStructure.breakdown[1] - inStructure.breakdown[0]) / inDuration) * 100}%` }}
              className="h-full bg-blue-950/50 border-r border-slate-800 flex items-center justify-center text-[9px] font-mono text-blue-300"
              title="Breakdown"
            >
              Break
            </div>
            <div
              style={{ width: `${((inStructure.outro[1] - inStructure.outro[0]) / inDuration) * 100}%` }}
              className="h-full bg-slate-950/50 flex items-center justify-center text-[9px] font-mono text-slate-400"
              title="Outro"
            >
              Outro
            </div>

            {/* Peak Drop Alignment Marker on Incoming Track */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-pink-500 to-amber-400 z-20 pointer-events-none shadow-[0_0_10px_rgba(245,158,11,1)]"
              style={{ left: `${Math.min(90, Math.max(10, inDropPercent))}%` }}
            >
              <div className="absolute -bottom-1.5 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 px-1.5 py-0.2 text-[8px] font-black rounded-full shadow">
                💥 PEAK DROP
              </div>
            </div>

            {/* Active Playback cursor on Deck B if playing */}
            {incomingDeck.isPlaying && (
              <div
                className="absolute top-0 bottom-0 left-0 bg-purple-500/25 pointer-events-none transition-all duration-150 border-r-2 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                style={{ width: `${Math.min(100, (incomingDeck.currentTime / inDuration) * 100)}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE TRANSITION STRATEGY PRESETS & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-800">
        {/* Strategy Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Strategie:</span>
          {[
            { id: '8bar-blend', label: '🌊 8-Bar Smooth Blend', desc: 'Harmonisch' },
            { id: '4bar-drop', label: '💥 4-Bar Drop Cut', desc: 'Energetisch' },
            { id: '16bar-breakdown', label: '🌌 16-Bar Breakdown', desc: 'Atmosphärisch' },
          ].map((strat) => (
            <button
              key={strat.id}
              onClick={() => setSelectedStrategy(strat.id as any)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border ${
                selectedStrategy === strat.id
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{strat.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Transition Trigger Buttons */}
        <div className="flex items-center gap-2">
          {/* Lock to Target Marker Button */}
          <button
            onClick={onLockToMarker}
            disabled={transition.isActive}
            className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg ${
              isLockedToMarker
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950'
            }`}
          >
            {isLockedToMarker ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            <span>{isLockedToMarker ? 'AUF PEAK EINGERASTET' : 'AUF PEAK EINRASTEN 🎯'}</span>
          </button>

          {/* Instant Mix Button */}
          <button
            onClick={onTriggerInstantMix}
            disabled={transition.isActive}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            title="Startet den Übergang sofort ohne auf den Taktmarker zu warten"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Jetzt Mixen ⚡</span>
          </button>
        </div>
      </div>
    </div>
  );
};
