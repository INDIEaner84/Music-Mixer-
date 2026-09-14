import React from 'react';
import {
  Sparkles,
  Zap,
  Volume2,
  Sliders,
  Radio,
  Layers,
  Flame,
  Waves,
  Repeat,
  Compass,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { CrossfaderCurve, TransitionPresetId } from '../types';

interface MasterControlBarProps {
  viewMode: 'playlist' | 'classic';
  onToggleViewMode: (mode: 'playlist' | 'classic') => void;
}

export const MasterControlBar: React.FC<MasterControlBarProps> = ({
  viewMode,
  onToggleViewMode,
}) => {
  const {
    deckA,
    deckB,
    stemLayer,
    crossfader,
    crossfaderCurve,
    transition,
    setCrossfader,
    setCrossfaderCurve,
    triggerAutoTransition,
    cancelTransition,
    triggerMacroAction,
    initAudio,
  } = useDJ();

  const handleTriggerTransition = async (presetId: TransitionPresetId) => {
    await initAudio();
    triggerAutoTransition(presetId, 8);
  };

  return (
    <div
      id="master-control-bar"
      className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3 backdrop-blur-md"
    >
      {/* Top Row: View Mode Switcher & Quick Automation Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-neutral-800">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => onToggleViewMode('playlist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
              viewMode === 'playlist'
                ? 'bg-cyan-500 text-neutral-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PLAYLIST & AUSKLAPPBARE DECKS</span>
          </button>
          <button
            onClick={() => onToggleViewMode('classic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
              viewMode === 'classic'
                ? 'bg-cyan-500 text-neutral-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>DUAL-MISCHPULT ANSICHT</span>
          </button>
        </div>

        {/* 1-Click Transition Automation Macro Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase mr-0.5 hidden sm:inline">
            1-KLICK ÜBERGÄNGE:
          </span>

          <button
            onClick={() => handleTriggerTransition('crossfade')}
            disabled={transition.isActive}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
            title="Nahtloser 8-Takt Crossfade-Übergang"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nahtlos Faden</span>
          </button>

          <button
            onClick={() => handleTriggerTransition('bass-swap')}
            disabled={transition.isActive}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
            title="4-Takt Bass-Drop Tausch Übergang"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Bass-Drop Tausch</span>
          </button>

          <button
            onClick={() => handleTriggerTransition('hpf-sweep')}
            disabled={transition.isActive}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-pink-300 border border-pink-500/40 hover:border-pink-400 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
            title="High-Pass Filter Sweep Übergang"
          >
            <Waves className="w-3.5 h-3.5 text-pink-400" />
            <span>Filter Sweep</span>
          </button>

          <button
            onClick={() => handleTriggerTransition('echo-out')}
            disabled={transition.isActive}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-purple-300 border border-purple-500/40 hover:border-purple-400 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
            title="Echo & Reverb Tail Out Übergang"
          >
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
            <span>Echo Out</span>
          </button>

          {transition.isActive && (
            <button
              onClick={cancelTransition}
              className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black animate-pulse"
            >
              ABBRECHEN
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Live Decks Indicator & Master Crossfader */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Left: Deck A Status Badge */}
        <div className="md:col-span-3 flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              deckA.isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-neutral-700'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-cyan-400 font-mono">DECK A (LINKS)</span>
              <span className="text-[10px] font-mono text-neutral-400">
                {deckA.track ? `${deckA.bpm.toFixed(1)} BPM` : 'KEIN TITEL'}
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-200 truncate">
              {deckA.track ? deckA.track.title : 'Kein Track geladen'}
            </p>
          </div>
        </div>

        {/* Center: Master Crossfader Bar (6 cols) */}
        <div className="md:col-span-6 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span className={crossfader <= -0.1 ? 'text-cyan-400 font-bold' : ''}>
              ◀ DECK A {crossfader <= -0.1 ? `(${Math.round(Math.abs(crossfader) * 100)}%)` : ''}
            </span>
            <span className="text-[9px] font-bold text-neutral-500">
              {crossfader === 0 ? 'MITTE (BEIDE DECKS)' : crossfader < 0 ? 'FADE A' : 'FADE B'}
            </span>
            <span className={crossfader >= 0.1 ? 'text-pink-400 font-bold' : ''}>
              DECK B {crossfader >= 0.1 ? `(${Math.round(crossfader * 100)}%)` : ''} ▶
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCrossfader(-1)}
              className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono font-bold text-cyan-400 border border-neutral-800"
              title="Voll nach links zu Deck A"
            >
              A
            </button>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={crossfader}
              onChange={(e) => setCrossfader(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => setCrossfader(1)}
              className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono font-bold text-pink-400 border border-neutral-800"
              title="Voll nach rechts zu Deck B"
            >
              B
            </button>
            <button
              onClick={() => setCrossfader(0)}
              className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono font-bold text-amber-400 border border-neutral-800"
              title="Crossfader zentrieren"
            >
              MITTE
            </button>
          </div>
        </div>

        {/* Right: Deck B Status Badge */}
        <div className="md:col-span-3 flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              deckB.isPlaying ? 'bg-pink-400 animate-ping' : 'bg-neutral-700'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-pink-400 font-mono">DECK B (RECHTS)</span>
              <span className="text-[10px] font-mono text-neutral-400">
                {deckB.track ? `${deckB.bpm.toFixed(1)} BPM` : 'KEIN TITEL'}
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-200 truncate">
              {deckB.track ? deckB.track.title : 'Kein Track geladen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
