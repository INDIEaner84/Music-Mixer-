import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  RotateCcw,
  Waves,
  Repeat,
  Activity,
  Disc,
  Layers,
  Wind,
  Scissors,
  Sliders,
  Play,
  XCircle,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { TRANSITION_PRESETS } from '../audio/defaultPresets';
import { useDJ } from '../context/DJContext';
import { TransitionPresetId } from '../types';
import { TransitionCurveDiagram } from './TransitionCurveDiagram';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sliders: <Sliders className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Repeat: <Repeat className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  Disc: <Disc className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Wind: <Wind className="w-4 h-4" />,
  Waves: <Waves className="w-4 h-4" />,
  RotateCcw: <RotateCcw className="w-4 h-4" />,
  Scissors: <Scissors className="w-4 h-4" />,
};

const DURATION_BAR_OPTIONS = [2, 4, 8, 16, 32];

export const TransitionRack: React.FC = () => {
  const {
    transition,
    triggerAutoTransition,
    cancelTransition,
    setTransitionPreset,
    deckA,
    deckB,
    crossfader,
  } = useDJ();

  const [selectedBars, setSelectedBars] = useState<number>(8);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(true);

  const activePreset =
    TRANSITION_PRESETS.find((p) => p.id === transition.preset) || TRANSITION_PRESETS[0];

  const handleTrigger = (presetId?: TransitionPresetId) => {
    const id = presetId || transition.preset;
    const masterBpm = deckA.isMaster ? deckA.bpm : deckB.bpm;
    const secondsPerBeat = 60 / masterBpm;
    const durationSeconds = selectedBars * 4 * secondsPerBeat;
    triggerAutoTransition(id, durationSeconds);
  };

  const nextDeck = crossfader <= 0 ? 'B' : 'A';
  const currentDeck = crossfader <= 0 ? 'A' : 'B';

  return (
    <div
      id="transition-presets-rack"
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl flex flex-col gap-3"
    >
      {/* 1. Header & Quick Transition Trigger Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-neutral-100 flex items-center gap-2">
              SEAMLESS DJ TRANSITIONS & ÜBERGANGS-ENGINE
              <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                10 PRESETS
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Wähle ein Übergangs-Preset für automatische Beat-Angleichung, Bass-Tausch & Filter-Sweeps
            </p>
          </div>
        </div>

        {/* Action Bar: Direction, Bar Length, Start/Stop Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Transition Direction Indicator */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[10px] font-mono">
            <span className="text-neutral-500">RICHTUNG:</span>
            <span className="font-bold text-cyan-400">DECK {currentDeck}</span>
            <span className="text-neutral-500">➔</span>
            <span className="font-bold text-pink-400">DECK {nextDeck}</span>
          </div>

          {/* Duration Selector in Bars */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[10px] font-mono">
            <span className="text-neutral-500">LÄNGE:</span>
            <select
              value={selectedBars}
              onChange={(e) => setSelectedBars(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer"
            >
              {DURATION_BAR_OPTIONS.map((bars) => (
                <option key={bars} value={bars} className="bg-neutral-900">
                  {bars} TAKTE
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Button */}
          {transition.isActive ? (
            <button
              onClick={cancelTransition}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-lg animate-pulse transition"
            >
              <XCircle className="w-4 h-4" />
              ABBRECHEN
            </button>
          ) : (
            <button
              onClick={() => handleTrigger()}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition"
              title="Übergang in Echtzeit starten [Taste: T]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              ÜBERGANG STARTEN [T]
            </button>
          )}
        </div>
      </div>

      {/* 2. Transition Presets Selector (Horizontal Quick Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
        {TRANSITION_PRESETS.map((preset) => {
          const isSelected = transition.preset === preset.id;
          const icon = ICON_MAP[preset.iconName] || <Zap className="w-4 h-4" />;

          return (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              onClick={() => {
                setTransitionPreset(preset.id);
                setSelectedBars(preset.defaultDurationBars);
              }}
              onDoubleClick={() => handleTrigger(preset.id)}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition select-none group relative ${
                isSelected
                  ? 'bg-neutral-800 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
              }`}
              title={`${preset.name}: ${preset.description} (Doppelklick zum Starten)`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isSelected
                    ? 'text-amber-400 bg-amber-950/80 shadow-sm'
                    : 'text-neutral-400 group-hover:text-neutral-200 bg-neutral-900'
                }`}
              >
                {icon}
              </div>
              <span className="text-[10px] font-bold text-neutral-200 truncate max-w-full leading-tight">
                {preset.name}
              </span>
              <span className="text-[8px] font-mono text-neutral-500 uppercase">
                {preset.defaultDurationBars} TAKTE
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Real-time Transition Timeline Progress Bar (when active) */}
      {transition.isActive && (
        <div className="bg-neutral-950 p-3 rounded-xl border border-amber-500/50 shadow-inner flex flex-col gap-1.5 animate-pulse">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin text-amber-400" />
              LÄUFT: {activePreset.name.toUpperCase()} ({activePreset.germanName})
            </span>
            <span className="text-neutral-200 font-bold">
              {Math.round(transition.progress * 100)}% ({transition.elapsedSeconds.toFixed(1)}s /{' '}
              {transition.durationSeconds.toFixed(1)}s)
            </span>
          </div>

          <div className="relative w-full h-3.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-pink-500 transition-all duration-75 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              style={{ width: `${transition.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 4. Detail Panel: Active Preset Visualization & Ausklappbare Erklärung */}
      <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3 flex flex-col gap-3">
        {/* Detail Header & Toggle Button */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500/20 text-amber-400 font-bold">
              {ICON_MAP[activePreset.iconName]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-neutral-100 uppercase tracking-wide">
                  {activePreset.name}
                </span>
                <span className="text-[10px] font-semibold text-amber-400">
                  — {activePreset.germanName}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase bg-neutral-900 text-neutral-400 border border-neutral-800">
                  KATEGORIE: {activePreset.category}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">{activePreset.description}</p>
            </div>
          </div>

          <button
            onClick={() => setIsExplanationOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-bold text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isExplanationOpen ? 'Erklärung einklappen' : 'Erklärung & Details anzeigen'}</span>
            {isExplanationOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Visual Graph Representation of DSP Automation Curves */}
        <TransitionCurveDiagram
          curves={activePreset.curves}
          progress={transition.isActive ? transition.progress : 0}
          isActive={transition.isActive}
          fromDeck={currentDeck}
          toDeck={nextDeck}
        />

        {/* Ausklappbare Erklärung & Funktionsweise */}
        {isExplanationOpen && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 border-t border-neutral-850 animate-fadeIn">
            {/* Left: How it works & Best For (Col 7) */}
            <div className="md:col-span-7 flex flex-col gap-2">
              <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block mb-1">
                  💡 WIE FUNKTIONIERT DIESER ÜBERGANG?
                </span>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  {activePreset.explanation.howItWorks}
                </p>
              </div>

              <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex-shrink-0">
                  🎧 BESTER EINSATZBEREICH:
                </span>
                <span className="text-xs text-neutral-300">
                  {activePreset.explanation.bestFor}
                </span>
              </div>
            </div>

            {/* Right: Step-by-Step Audio Phases & DSP Actions (Col 5) */}
            <div className="md:col-span-5 flex flex-col gap-2">
              <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-pink-400 uppercase tracking-wider block">
                  ⚙️ PHASENVERLAUF IM AUDIO
                </span>
                <ul className="space-y-1 text-[11px] text-neutral-300">
                  {activePreset.explanation.stepByStep.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[9px] font-mono text-neutral-500 uppercase mr-1">
                  DSP AUTOMATIONEN:
                </span>
                {activePreset.explanation.dspActions.map((action, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-mono bg-neutral-900 text-cyan-300 px-1.5 py-0.2 rounded border border-neutral-800"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
