import React from 'react';
import {
  Activity,
  Award,
  BrainCircuit,
  CheckCircle2,
  Dna,
  History,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';

export const MusicalDNAPanel: React.FC = () => {
  const { musicalDNA } = useDJ();

  const traits = [
    { label: 'Harmonische Treue', value: Math.round(musicalDNA.harmonic_matching * 100), desc: 'Camelot-Key Präzision' },
    { label: 'Set-Kontinuität', value: Math.round(musicalDNA.continuity * 100), desc: 'Fließende Übergänge' },
    { label: 'Energie-Dramaturgie', value: Math.round(musicalDNA.energy_growth * 100), desc: 'Gezielte Steigerung' },
    { label: 'Genre-Stabilität', value: Math.round(musicalDNA.genre_stability * 100), desc: 'Klangliche Kohärenz' },
    { label: 'Experimentierfreude', value: Math.round(musicalDNA.experimentation * 100), desc: 'Mut zu Richtungswechseln' },
    { label: 'Überraschungs-Toleranz', value: Math.round(musicalDNA.surprise * 100), desc: 'Offenheit für Kontraste' },
  ];

  return (
    <div id="musical-dna-panel" className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-950/80 border border-pink-500/30 rounded-lg text-pink-400">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Musikalische DNA & Lernkurve</span>
              <span className="text-[10px] px-2 py-0.5 bg-pink-900/50 text-pink-300 border border-pink-500/30 rounded-full font-mono">
                Profil
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Die KI passt ihre Empfehlungen kontinuierlich an deinen individuellen Mix-Stil an.
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-pink-300">
          Entscheidungen: {musicalDNA.decisionHistory.length}
        </div>
      </div>

      {/* Trait Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {traits.map((trait, idx) => (
          <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">{trait.label}</span>
              <span className="font-mono text-cyan-400 font-bold">{trait.value}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${trait.value}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">{trait.desc}</span>
          </div>
        ))}
      </div>

      {/* Decision Log History */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Zuletzt gewählte Routen & KI-Feedback</span>
        </h4>

        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {musicalDNA.decisionHistory.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/80 rounded-lg">
              Noch keine Entscheidungen aufgezeichnet. Wähle eine der 3 Zukunftsoptionen, um dein Profil zu trainieren!
            </div>
          ) : (
            musicalDNA.decisionHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.strategy === 'flow'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : item.strategy === 'build'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : item.strategy === 'shift'
                        ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {item.strategy}
                  </span>
                  <span className="font-medium text-slate-200">{item.trackTitle}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{item.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
