import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Headphones,
  Music2,
  Play,
  Radio,
  Sliders,
  Sparkles,
  Volume2,
  Wand2,
  Zap,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { MusicalFutureOption } from '../types';

export const MusicalFuturesPanel: React.FC = () => {
  const {
    musicalFutures,
    auditionState,
    playAudition,
    stopAudition,
    applyMusicalFuture,
    applyImmediateTransitionToFuture,
    deckA,
    deckB,
  } = useDJ();

  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const options: MusicalFutureOption[] = [
    musicalFutures.flow,
    musicalFutures.build,
    musicalFutures.shift,
  ];

  const getStrategyColors = (strategy: string) => {
    switch (strategy) {
      case 'flow':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-400/60',
          bg: 'bg-emerald-950/20 backdrop-blur-xl',
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          accent: 'text-emerald-400',
          btnPrimary: 'pill-btn !bg-emerald-500 !border-emerald-400 !text-slate-950 font-bold hover:!brightness-110',
          glow: 'shadow-[0_4px_24px_rgba(16,185,129,0.12)]',
        };
      case 'build':
        return {
          border: 'border-amber-500/30 hover:border-amber-400/60',
          bg: 'bg-amber-950/20 backdrop-blur-xl',
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          accent: 'text-amber-400',
          btnPrimary: 'pill-btn !bg-amber-500 !border-amber-400 !text-slate-950 font-bold hover:!brightness-110',
          glow: 'shadow-[0_4px_24px_rgba(245,158,11,0.12)]',
        };
      case 'shift':
        return {
          border: 'border-[#ff3e81]/30 hover:border-[#ff3e81]/60',
          bg: 'bg-[#ff3e81]/10 backdrop-blur-xl',
          badgeBg: 'bg-[#ff3e81]/15 text-[#ff3e81] border-[#ff3e81]/40',
          accent: 'text-[#ff3e81]',
          btnPrimary: 'pill-btn active hover:!brightness-110',
          glow: 'shadow-[0_4px_24px_rgba(255,62,129,0.15)]',
        };
      default:
        return {
          border: 'border-cyan-500/30 hover:border-cyan-400/60',
          bg: 'bg-cyan-950/20 backdrop-blur-xl',
          badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
          accent: 'text-cyan-400',
          btnPrimary: 'pill-btn-cyan active font-bold',
          glow: 'shadow-[0_4px_24px_rgba(6,182,212,0.12)]',
        };
    }
  };

  return (
    <div id="musical-futures-panel" className="glass-card p-4 md:p-5 flex flex-col gap-4 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff3e81] to-purple-600 p-0.5 shadow-[0_0_15px_rgba(255,62,129,0.3)] flex items-center justify-center">
            <div className="w-full h-full bg-[#121016] rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#ff3e81]" />
            </div>
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <span>Drei Musikalische Zukunftswege</span>
              <span className="font-space text-[10px] px-2 py-0.5 bg-[#ff3e81]/15 text-[#ff3e81] border border-[#ff3e81]/30 rounded-full">
                AI CO-PILOT
              </span>
            </h2>
            <p className="text-xs text-white/50">
              Echtzeit-Analyse des aktuellen Sets: Wähle eine Strategie oder höre sie direkt vor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-space text-[11px] text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> Flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" /> Build
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff3e81] shadow-[0_0_6px_#ff3e81]" /> Shift
          </span>
        </div>
      </div>

      {/* 3 Main Future Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {options.map((opt) => {
          const colors = getStrategyColors(opt.strategy);
          const isAuditioning = auditionState.isPlaying && auditionState.futureId === opt.id;
          const isRecipeOpen = expandedRecipeId === opt.id;

          return (
            <div
              key={opt.id}
              className={`flex flex-col justify-between border rounded-2xl p-4 transition-all duration-300 ${colors.border} ${colors.bg} ${colors.glow}`}
            >
              <div className="flex flex-col gap-3">
                {/* Card Header: Strategy Badge & Compatibility Score */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 border rounded-full font-space text-[10px] font-bold tracking-wider uppercase ${colors.badgeBg}`}>
                    {opt.badgeLabel}
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-white/[0.05] border border-white/10 rounded-full text-xs font-semibold text-white/90">
                    <span className="font-space font-bold">{opt.compatibilityScore}%</span>
                    <span className="font-space text-[9px] text-white/40 uppercase">Match</span>
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#ff3e81] transition-colors">
                      {opt.track.title}
                    </h3>
                    <p className="text-xs text-white/50">{opt.track.artist}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 bg-white/[0.06] border border-white/10 rounded-full text-[10px] font-space font-bold text-white/80">
                      {opt.track.intelligence?.camelotKey || opt.track.key}
                    </span>
                    <span className="text-[10px] text-white/40 font-space">{opt.track.bpm} BPM</span>
                  </div>
                </div>

                {/* Feeling Quote */}
                <div className="text-xs italic text-white/80 bg-white/[0.03] border border-white/10 px-3 py-2 rounded-xl">
                  "{opt.feeling}"
                </div>

                {/* Key Metrics / Delta Badges */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="px-2.5 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl text-white/80">
                    <span className="font-space text-white/40 block text-[9px] uppercase">Harmonie</span>
                    <span className="truncate block font-medium">{opt.harmonicMatch.split('(')[0]}</span>
                  </div>
                  <div className="px-2.5 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl text-white/80">
                    <span className="font-space text-white/40 block text-[9px] uppercase">Energie-Delta</span>
                    <span className={`font-space font-bold block ${colors.accent}`}>{opt.energyDelta}</span>
                  </div>
                </div>

                {/* Co-Pilot Explanation */}
                <div className="text-xs text-white/80 leading-relaxed bg-white/[0.03] border border-white/10 p-3 rounded-xl">
                  <p className="font-semibold text-white mb-1">{opt.headline}</p>
                  <p className="text-white/60 text-[11px]">{opt.explanation}</p>
                </div>

                {/* Step-by-Step Transition Recipe Accordion */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                  <button
                    onClick={() => setExpandedRecipeId(isRecipeOpen ? null : opt.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sliders className="w-3.5 h-3.5 text-[#ff3e81]" />
                      <span>Rezept: {opt.recommendedTransition.germanStrategyTitle}</span>
                    </span>
                    {isRecipeOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isRecipeOpen && (
                    <div className="p-3 border-t border-white/10 text-[11px] space-y-2 bg-black/40">
                      <p className="text-white/60 italic mb-1.5">{opt.recommendedTransition.rationale}</p>
                      <div className="space-y-1.5">
                        {opt.recommendedTransition.stepRecipe.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-white/80">
                            <span className="font-space text-[#ff3e81] font-bold shrink-0">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions: Audition & Deck Assignment */}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10 mt-3">
                {/* Instant Audition Button */}
                <button
                  onClick={() => {
                    if (isAuditioning) {
                      stopAudition();
                    } else {
                      playAudition(opt.track, opt.id, 12);
                    }
                  }}
                  className={`pill-btn w-full ${
                    isAuditioning
                      ? '!bg-amber-500 !border-amber-400 !text-slate-950 animate-pulse shadow-lg'
                      : ''
                  }`}
                >
                  {isAuditioning ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Vorhören läuft (12s)... Stop</span>
                    </>
                  ) : (
                    <>
                      <Headphones className="w-4 h-4 text-[#ff3e81]" />
                      <span>▶ Vorhören / 12s Audition</span>
                    </>
                  )}
                </button>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applyMusicalFuture(opt, deckA.isPlaying ? 'B' : 'A')}
                    className="pill-btn w-full !text-white/80"
                  >
                    <span>In Cue laden</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                  </button>

                  <button
                    onClick={() => applyImmediateTransitionToFuture(opt)}
                    className={`${colors.btnPrimary} w-full`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>⚡ Sofort Mixen</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Hybrid Combiner Bar (A + C Mashup & Surprise) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ff3e81]/15 border border-[#ff3e81]/30 flex items-center justify-center text-[#ff3e81]">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Kombinatorische Synthese:</span>
            <span className="text-white/50">
              Verschmilzt {musicalFutures.flow.track.title} (Melodie/Vocal) mit {musicalFutures.shift.track.title} (Bass) zu einem Hybrid-Track.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playAudition(musicalFutures.hybrid.track, 'future-hybrid', 12)}
            className="pill-btn"
          >
            Hybrid Vorhören
          </button>
          <button
            onClick={() => applyImmediateTransitionToFuture(musicalFutures.hybrid)}
            className="pill-btn active"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kombiniere A + C</span>
          </button>
        </div>
      </div>
    </div>
  );
};
