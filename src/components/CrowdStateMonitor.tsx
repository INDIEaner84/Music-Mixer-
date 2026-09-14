import React from 'react';
import {
  Activity,
  AlertCircle,
  Flame,
  Heart,
  Lightbulb,
  Radio,
  Smile,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';

export const CrowdStateMonitor: React.FC = () => {
  const { crowdState, setState } = useDJ();

  return (
    <div id="crowd-state-monitor" className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-950/80 border border-pink-500/30 rounded-lg text-pink-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Crowd & Dancefloor Telemetrie</span>
              <span className="text-[10px] px-2 py-0.5 bg-pink-900/50 text-pink-300 border border-pink-500/30 rounded-full font-mono">
                Echtzeit
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Beobachtet Stimmung, Tanzaktivität und Ermüdung auf der Tanzfläche.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-950/50 border border-pink-500/30 rounded-full text-pink-300 text-xs font-semibold">
          <Heart className="w-3.5 h-3.5 fill-pink-500" />
          <span>Floor Status: {crowdState.responseToBuildup}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Engagement */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Engagement</span>
            <span className="font-bold text-pink-400 font-mono">{crowdState.engagement}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${crowdState.engagement}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">Präsenz im Raum</span>
        </div>

        {/* Movement */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Tanz-Bewegung</span>
            <span className="font-bold text-amber-400 font-mono">{crowdState.movement}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${crowdState.movement}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">Kinetische Energie</span>
        </div>

        {/* Attention */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Fokus / Flow</span>
            <span className="font-bold text-cyan-400 font-mono">{crowdState.attention}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${crowdState.attention}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">Musikalische Bindung</span>
        </div>

        {/* Fatigue */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Ermüdung</span>
            <span className={`font-bold font-mono ${crowdState.fatigue > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {crowdState.fatigue}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                crowdState.fatigue > 60 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${crowdState.fatigue}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            {crowdState.fatigue > 60 ? 'Breakdown empfohlen' : 'Kraftvoll aktiv'}
          </span>
        </div>
      </div>

      {/* AI Co-Pilot Recommendation for Crowd */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-3 text-xs">
        <div className="p-1.5 bg-cyan-950 border border-cyan-500/30 rounded-lg text-cyan-400 shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-bold text-slate-200 block">Dramaturgie-Empfehlung für die Crowd:</span>
          <p className="text-slate-300 leading-relaxed">
            {crowdState.fatigue > 60
              ? 'Die Tanzfläche zeigt leichte Ermüdungserscheinungen nach dem High-Energy-Peak. Nutze jetzt Strategie C (Shift) für einen melodischen Breakdown oder entspannteren Groove.'
              : crowdState.engagement > 80
              ? 'Die Crowd ist hochgradig synchronisiert und feiert den aktuellen Drive. Strategie B (Build) bereitet den perfekten Peak-Hour-Höhepunkt vor.'
              : 'Solide Grundstimmung im Raum. Strategie A (Flow) sichert den nahtlosen Groove ohne Spannungsverlust.'}
          </p>
        </div>
      </div>
    </div>
  );
};
