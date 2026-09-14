import React from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  Compass,
  Flame,
  Milestone,
  Radio,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';

export const EnergyJourneyView: React.FC = () => {
  const { setJourney, setState, musicalFutures, applyMusicalFuture, deckA } = useDJ();

  const currentPoint = setJourney.find((p) => p.isCurrent) || setJourney[setJourney.length - 1];
  const currentEnergy = currentPoint ? currentPoint.energy : 75;

  const flowTargetEnergy = musicalFutures.flow.track.intelligence?.energy ?? 74;
  const buildTargetEnergy = musicalFutures.build.track.intelligence?.energy ?? 92;
  const shiftTargetEnergy = musicalFutures.shift.track.intelligence?.energy ?? 68;

  return (
    <div id="energy-journey-view" className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-950/80 border border-purple-500/30 rounded-lg text-purple-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Set-Dramaturgie & Energie-Kurve</span>
              <span className="text-[10px] px-2 py-0.5 bg-purple-900/50 text-purple-300 border border-purple-500/30 rounded-full font-mono">
                Verlauf & Prognose
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Historischer Energieverlauf und prognostizierte Entwicklung der 3 Zukunftsrouten.
            </p>
          </div>
        </div>

        {/* Phase Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs">
            <span className="text-slate-400">Aktuelle Phase:</span>
            <span className="font-bold text-cyan-300 uppercase tracking-wider font-mono">{setState.phase}</span>
          </div>
        </div>
      </div>

      {/* SVG Energy Curve Visualizer */}
      <div className="w-full h-48 bg-slate-950/80 border border-slate-800 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between">
        {/* Background Grid Lines & Phase Markers */}
        <div className="absolute inset-0 grid grid-cols-5 pointer-events-none opacity-20">
          <div className="border-r border-slate-600 flex items-end p-2 text-[10px] font-mono text-slate-400">Warmup</div>
          <div className="border-r border-slate-600 flex items-end p-2 text-[10px] font-mono text-slate-400">Buildup</div>
          <div className="border-r border-slate-600 flex items-end p-2 text-[10px] font-mono text-slate-400">Peak Hour</div>
          <div className="border-r border-slate-600 flex items-end p-2 text-[10px] font-mono text-slate-400">Breakdown</div>
          <div className="flex items-end p-2 text-[10px] font-mono text-slate-400">Afterhours</div>
        </div>

        {/* SVG Drawing Canvas */}
        <svg className="w-full h-full absolute inset-0 p-4" viewBox="0 0 500 120" preserveAspectRatio="none">
          {/* Energy Y-Axis Guidelines */}
          <line x1="0" y1="20" x2="500" y2="20" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1="60" x2="500" y2="60" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1="100" x2="500" y2="100" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />

          {/* Past Journey Path */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={
              setJourney.length === 1
                ? `50,${120 - (setJourney[0].energy / 100) * 100} 250,${120 - (setJourney[0].energy / 100) * 100}`
                : setJourney
                    .map((p, idx) => {
                      const x = 40 + idx * 55;
                      const y = 120 - (p.energy / 100) * 100;
                      return `${x},${y}`;
                    })
                    .join(' ')
            }
          />

          {/* Branching Future 1: Flow (Emerald) */}
          <path
            d={`M 260 ${120 - (currentEnergy / 100) * 100} Q 360 ${120 - (flowTargetEnergy / 100) * 100} 460 ${120 - (flowTargetEnergy / 100) * 100}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />

          {/* Branching Future 2: Build (Amber) */}
          <path
            d={`M 260 ${120 - (currentEnergy / 100) * 100} Q 360 ${120 - ((buildTargetEnergy + currentEnergy) / 200) * 100} 460 ${120 - (buildTargetEnergy / 100) * 100}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="5 3"
          />

          {/* Branching Future 3: Shift (Purple) */}
          <path
            d={`M 260 ${120 - (currentEnergy / 100) * 100} Q 360 ${120 - ((shiftTargetEnergy + currentEnergy) / 200) * 100} 460 ${120 - (shiftTargetEnergy / 100) * 100}`}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />

          {/* Live Current Marker (Pulsing Dot) */}
          <circle
            cx="260"
            cy={120 - (currentEnergy / 100) * 100}
            r="6"
            fill="#06b6d4"
            className="animate-ping opacity-75"
          />
          <circle
            cx="260"
            cy={120 - (currentEnergy / 100) * 100}
            r="5"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* Future Target Dots */}
          <circle cx="460" cy={120 - (flowTargetEnergy / 100) * 100} r="4" fill="#10b981" />
          <circle cx="460" cy={120 - (buildTargetEnergy / 100) * 100} r="4.5" fill="#f59e0b" />
          <circle cx="460" cy={120 - (shiftTargetEnergy / 100) * 100} r="4" fill="#a855f7" />
        </svg>

        {/* Labels Overlay */}
        <div className="relative z-10 flex justify-between items-start text-[10px] font-mono text-slate-400">
          <span>100% Peak</span>
          <span className="text-cyan-400 font-bold">● JETZT: {currentPoint?.trackTitle || 'Master Deck'} ({currentEnergy}%)</span>
          <span>0% Ambient</span>
        </div>

        <div className="relative z-10 flex justify-end gap-3 text-[11px] font-mono">
          <span className="text-emerald-400 font-semibold">A — Flow ({flowTargetEnergy}%)</span>
          <span className="text-amber-400 font-semibold">B — Build ({buildTargetEnergy}%)</span>
          <span className="text-purple-400 font-semibold">C — Shift ({shiftTargetEnergy}%)</span>
        </div>
      </div>

      {/* Set Phase Milestone Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Flow-Strategie</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Hält die aktuelle Energie konstant bei ~{flowTargetEnergy}%. Ideal für langes, tranceartiges Tanzen.
          </p>
        </div>

        <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Build-Strategie</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Erreicht Peak-Hour bei ~{buildTargetEnergy}%. Bereitet den Dancefloor für den nächsten großen Drop vor.
          </p>
        </div>

        <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Shift-Strategie</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Setzt einen klanglichen Reset bei ~{shiftTargetEnergy}%. Schafft Frische und beugt Hörmüdigkeit vor.
          </p>
        </div>
      </div>
    </div>
  );
};
