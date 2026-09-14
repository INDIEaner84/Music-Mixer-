import React, { useState } from 'react';
import {
  Activity,
  Bot,
  Flame,
  Gauge,
  Headphones,
  Lightbulb,
  Radio,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Volume2,
  Wand2,
  Zap,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';

export const CognitiveCopilotBar: React.FC = () => {
  const {
    setState,
    crowdState,
    coPilotMessage,
    intentPrompt,
    submitMusicalIntent,
    auditionState,
    stopAudition,
    triggerSurpriseRoute,
    triggerHybridMashup,
  } = useDJ();

  const [inputVal, setInputVal] = useState(intentPrompt);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      submitMusicalIntent(inputVal.trim());
    }
  };

  const quickIntents = [
    { label: '⚡ Spannung aufbauen', prompt: 'Spannung langsam aufbauen und Tempo anziehen' },
    { label: '🧲 Floor zurückholen', prompt: 'Bring den Floor zurück mit starkem Groove' },
    { label: '🎲 Überrasche mich', prompt: 'Überrasche mich mit einem unerwarteten Track' },
    { label: '🌑 Dunkler & Hypnotisch', prompt: 'Etwas dunkler, technoider und hypnotischer' },
    { label: '🌅 Melodic & Warm', prompt: 'Warme Melodien und sanfter Flow' },
    { label: '💥 Peak-Hour Drop', prompt: 'Maximaler Peak-Hour Drop mit hartem Bass' },
    { label: '✨ Vocal Mashup', prompt: 'Vocal Mashup Kombination vorbereiten' },
  ];

  return (
    <div id="cognitive-copilot-bar" className="relative z-10 w-full bg-[#121016]/70 border-b border-white/10 px-4 md:px-6 py-2.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Top telemetry & status row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* AI Status & Set State Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ff3e81]/15 border border-[#ff3e81]/30 rounded-full text-[#ff3e81] font-bold text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3e81] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3e81]"></span>
              </span>
              <Bot className="w-3.5 h-3.5" />
              <span>AI CO-PILOT</span>
            </div>

            {/* Set Energy Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-full">
              <Flame className={`w-3.5 h-3.5 ${setState.energy > 80 ? 'text-[#ff3e81] animate-pulse' : 'text-amber-400'}`} />
              <span className="font-space text-white/50 text-[10px] uppercase">ENERGIE:</span>
              <span className="font-space font-bold text-white text-[11px]">{setState.energy}%</span>
              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${setState.energy}%`,
                    background: setState.energy > 80 ? '#ff3e81' : setState.energy > 60 ? '#06b6d4' : '#10b981',
                  }}
                />
              </div>
            </div>

            {/* Tension Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-full">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-space text-white/50 text-[10px] uppercase">SPANNUNG:</span>
              <span className="font-space font-bold text-purple-300 text-[11px]">{setState.tension}%</span>
            </div>

            {/* Direction & Phase Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-space text-white/50 text-[10px] uppercase">RICHTUNG:</span>
              <span className="font-bold text-emerald-300 capitalize text-[11px]">{setState.direction}</span>
              <span className="text-white/20">|</span>
              <span className="font-space text-[9px] text-white/50 uppercase">{setState.phase}</span>
            </div>

            {/* Crowd Telemetry */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-full text-white/90">
              <Users className="w-3.5 h-3.5 text-[#ff3e81]" />
              <span className="font-space text-white/50 text-[10px] uppercase">CROWD:</span>
              <span className="font-space font-bold text-[#ff3e81] text-[11px]">{crowdState.engagement}%</span>
              <span className="text-white/40 text-[10px]">({crowdState.responseToBuildup})</span>
            </div>
          </div>

          {/* Quick Action Buttons (Surprise & Hybrid) & Audition Indicator */}
          <div className="flex items-center gap-2">
            {auditionState.isPlaying && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 animate-pulse font-medium text-xs">
                <Headphones className="w-3.5 h-3.5" />
                <span>Vorhören ({auditionState.duration}s)</span>
                <button
                  onClick={stopAudition}
                  className="ml-1 text-xs text-amber-200 hover:text-white underline font-bold"
                >
                  Stop
                </button>
              </div>
            )}

            <button
              onClick={triggerSurpriseRoute}
              className="pill-btn !border-[#ff3e81]/40 !text-[#ff3e81] hover:!bg-[#ff3e81] hover:!text-white"
              title="Zeige mir etwas völlig Unerwartetes außerhalb des aktuellen Suchraums"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎲 Surprise Engine</span>
            </button>

            <button
              onClick={triggerHybridMashup}
              className="pill-btn !border-cyan-500/40 !text-cyan-300 hover:!bg-cyan-400 hover:!text-slate-950"
              title="Kombiniert die Vocals von Option A mit dem Bass von Option C"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>✨ Mashup A + C</span>
            </button>
          </div>
        </div>

        {/* Narrative Co-Pilot Speech & Intent Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* AI Narrative Bubble */}
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-1.5 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl text-xs text-white/90">
            <Lightbulb className="w-4 h-4 text-[#ff3e81] shrink-0" />
            <span className="font-space text-[#ff3e81] font-bold text-[10px] tracking-wider shrink-0">AI CO-PILOT:</span>
            <span className="text-white/80 italic truncate">{coPilotMessage}</span>
          </div>

          {/* Natural Language Intent Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 sm:w-80">
            <div className="relative w-full">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Musikalische Absicht (z.B. 'mehr Tribal', 'Peak Drop')..."
                className="w-full bg-white/[0.04] backdrop-blur-md border border-white/15 focus:border-[#ff3e81] focus:ring-1 focus:ring-[#ff3e81] rounded-full px-3.5 py-1.5 text-xs text-white placeholder-white/40 outline-none transition-all pr-8"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-[#ff3e81] p-1"
                title="Absicht senden"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Quick Intent Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          <span className="font-space text-white/40 text-[9px] uppercase tracking-wider shrink-0">INTENTION:</span>
          {quickIntents.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputVal(item.prompt);
                submitMusicalIntent(item.prompt);
              }}
              className="shrink-0 px-2.5 py-0.5 bg-white/[0.04] hover:bg-white hover:text-slate-950 border border-white/10 rounded-full text-white/70 font-medium transition-all text-[10px]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
