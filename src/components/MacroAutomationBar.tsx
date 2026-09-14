import React from 'react';
import {
  Sparkles,
  Zap,
  Mic,
  Music,
  Sliders,
  Radio,
  Layers,
  Scissors,
  Waves,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { TransitionPresetId } from '../types';

export const MacroAutomationBar: React.FC = () => {
  const {
    triggerAutoTransition,
    triggerMacroAction,
    transition,
    cancelTransition,
    stemLayer,
    crossfader,
  } = useDJ();

  const MACRO_PRESETS: {
    id: string;
    label: string;
    badge: string;
    color: string;
    icon: string;
    desc: string;
    onClick: () => void;
  }[] = [
    {
      id: 'crossfade',
      label: 'Nahtlos Überblenden',
      badge: '8 Takte',
      color: '#06b6d4',
      icon: 'Sliders',
      desc: 'Harmonische Lautstärke-Überblendung ohne Frequenzeinbruch.',
      onClick: () => triggerAutoTransition('crossfade', 8),
    },
    {
      id: 'bass-swap',
      label: 'Bass-Drop Tausch',
      badge: '4 Takte',
      color: '#f59e0b',
      icon: 'Zap',
      desc: 'Mitten & Höhen faden ein, schlagartiger Bass-Crossover auf den 1. Beat.',
      onClick: () => triggerAutoTransition('bass-swap', 4),
    },
    {
      id: 'vocal-mashup',
      label: '🎤 Vocals aus Song 3',
      badge: 'Stem Overlay',
      color: '#ec4899',
      icon: 'Mic',
      desc: 'Isoliert die Stimme von Song 3 und legt sie synchron über den laufenden Beat.',
      onClick: () => triggerMacroAction('vocal-mashup'),
    },
    {
      id: 'beat-inject',
      label: '🥁 Beat aus Song 3',
      badge: 'Rhythm Add',
      color: '#8b5cf6',
      icon: 'Music',
      desc: 'Mischt die Kicks & Drums von Song 3 dynamisch in die aktuelle Melodie.',
      onClick: () => triggerMacroAction('beat-inject'),
    },
    {
      id: 'hpf-sweep',
      label: 'High-Pass Filter Sweep',
      badge: 'Club FX',
      color: '#10b981',
      icon: 'Waves',
      desc: 'Filtert tiefe Frequenzen aufbauend weg für einen sauberen Übergang.',
      onClick: () => triggerAutoTransition('hpf-sweep', 6),
    },
    {
      id: 'echo-out',
      label: 'Dub Echo & Tail Out',
      badge: 'Echo Fade',
      color: '#3b82f6',
      icon: 'Radio',
      desc: 'Lässt den auslaufenden Song in einem weichen Raumhall-Echo ausklingen.',
      onClick: () => triggerAutoTransition('echo-out', 6),
    },
  ];

  return (
    <div
      id="macro-automation-bar"
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl flex flex-col gap-2 relative overflow-hidden"
    >
      {/* Top Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-neutral-100 uppercase tracking-wider flex items-center gap-2">
              AUTOMATIONS-PRESETS (1-KLICK LIVE MIXING)
            </h3>
            <p className="text-[11px] text-neutral-400">
              Starte professionelle DJ-Übergänge & Mashups auf Knopfdruck ohne manuelle Parameter-Regler.
            </p>
          </div>
        </div>

        {/* Transition Status indicator */}
        {transition.isActive && (
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-amber-500 text-neutral-950 text-xs font-black animate-pulse flex items-center gap-1.5 shadow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ÜBERGANG LÄUFT: {Math.round(transition.progress * 100)}%</span>
            </div>
            <button
              onClick={cancelTransition}
              className="px-2 py-1 rounded bg-neutral-950 text-red-400 hover:bg-neutral-800 text-xs font-bold border border-neutral-800"
            >
              STOPP
            </button>
          </div>
        )}
      </div>

      {/* Transition Progress Bar if active */}
      {transition.isActive && (
        <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-pink-500 transition-all duration-75"
            style={{ width: `${Math.round(transition.progress * 100)}%` }}
          />
        </div>
      )}

      {/* 1-Click Action Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {MACRO_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-850 active:scale-95 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between gap-2 shadow group text-left"
            title={item.desc}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                {item.badge}
              </span>
              <Sparkles className="w-3 h-3 text-neutral-600 group-hover:text-amber-400 transition" />
            </div>

            <div>
              <div className="text-xs font-bold text-neutral-200 group-hover:text-white transition leading-tight">
                {item.label}
              </div>
              <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
