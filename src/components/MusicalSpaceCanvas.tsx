import React, { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Crosshair,
  Headphones,
  Info,
  Maximize2,
  Music2,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { Track } from '../types';

export const MusicalSpaceCanvas: React.FC = () => {
  const {
    trackLibrary,
    deckA,
    deckB,
    musicalFutures,
    playAudition,
    stopAudition,
    auditionState,
    applyMusicalFuture,
  } = useDJ();

  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);

  const activeMasterTrack = deckA.isMaster ? deckA.track : deckB.track || deckA.track;

  // Calculate coordinates for a track in the 2D space (0 to 100%)
  const getTrackCoords = (track: Track) => {
    const intel = track.intelligence;
    const grooveVal = Number(intel?.groove ?? 70);
    const danceVal = Number(intel?.danceability ?? 70);
    const energyVal = Number(intel?.energy ?? 70);

    // X = groove & danceability (0-100)
    const x = Math.min(92, Math.max(8, (grooveVal + danceVal) / 2));
    // Y = 100 - energy (so high energy is at top)
    const y = Math.min(92, Math.max(8, 100 - energyVal));
    return { x, y };
  };

  const masterCoords = activeMasterTrack ? getTrackCoords(activeMasterTrack) : { x: 50, y: 50 };
  const flowCoords = getTrackCoords(musicalFutures.flow.track);
  const buildCoords = getTrackCoords(musicalFutures.build.track);
  const shiftCoords = getTrackCoords(musicalFutures.shift.track);

  return (
    <div id="musical-space-canvas" className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950/80 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>2D Musikalischer Raum & Vektoren</span>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 rounded-full font-mono">
                Topologie
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interaktive Klang-Topologie: Tracks nach Energie (Y-Achse) und Groove/Drive (X-Achse).
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse ring-2 ring-cyan-500/40"></span>
            <span className="text-cyan-300 font-semibold">Aktiver Master</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Flow Vektor</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Build Vektor</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span>Shift Vektor</span>
          </span>
        </div>
      </div>

      {/* 2D Space Stage */}
      <div className="w-full h-80 sm:h-96 bg-slate-950/90 border border-slate-800 rounded-xl relative overflow-hidden select-none">
        {/* Quadrant Background Zones */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-40">
          <div className="border-r border-b border-slate-800/80 p-3 flex flex-col justify-start items-start bg-slate-900/10">
            <span className="text-[11px] font-bold text-slate-400">🌑 Dark & Hypnotic Techno</span>
            <span className="text-[9px] text-slate-600">Hohe Energie, tiefe Texturen</span>
          </div>
          <div className="border-b border-slate-800/80 p-3 flex flex-col justify-start items-end bg-amber-950/5">
            <span className="text-[11px] font-bold text-amber-300">⚡ High-Energy Euphoric Peak</span>
            <span className="text-[9px] text-amber-500/60">Hohe Energie, starker Groove</span>
          </div>
          <div className="border-r border-slate-800/80 p-3 flex flex-col justify-end items-start bg-cyan-950/5">
            <span className="text-[11px] font-bold text-cyan-300">🌅 Deep Melodic Ambient</span>
            <span className="text-[9px] text-cyan-500/60">Sanfte Energie, weite Pads</span>
          </div>
          <div className="p-3 flex flex-col justify-end items-end bg-indigo-950/5">
            <span className="text-[11px] font-bold text-indigo-300">🪩 Raw Groovy Jackin House</span>
            <span className="text-[9px] text-indigo-500/60">Moderate Energie, treibende Rhythmen</span>
          </div>
        </div>

        {/* Center Crosshairs */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800/50 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800/50 pointer-events-none" />

        {/* SVG Vector Connection Lines */}
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {/* Master to Flow Line */}
          <line
            x1={`${masterCoords.x}%`}
            y1={`${masterCoords.y}%`}
            x2={`${flowCoords.x}%`}
            y2={`${flowCoords.y}%`}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.8"
          />
          {/* Master to Build Line */}
          <line
            x1={`${masterCoords.x}%`}
            y1={`${masterCoords.y}%`}
            x2={`${buildCoords.x}%`}
            y2={`${buildCoords.y}%`}
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            opacity="0.9"
          />
          {/* Master to Shift Line */}
          <line
            x1={`${masterCoords.x}%`}
            y1={`${masterCoords.y}%`}
            x2={`${shiftCoords.x}%`}
            y2={`${shiftCoords.y}%`}
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.8"
          />
        </svg>

        {/* Plotted Track Nodes */}
        {trackLibrary.map((track) => {
          const coords = getTrackCoords(track);
          const isMaster = activeMasterTrack?.id === track.id;
          const isFlow = musicalFutures.flow.track.id === track.id;
          const isBuild = musicalFutures.build.track.id === track.id;
          const isShift = musicalFutures.shift.track.id === track.id;
          const isAuditioning = auditionState.isPlaying && auditionState.trackId === track.id;

          let nodeColor = 'bg-slate-700 border-slate-500 text-slate-300';
          let ringEffect = '';

          if (isMaster) {
            nodeColor = 'bg-cyan-500 border-white text-slate-950 font-bold';
            ringEffect = 'ring-4 ring-cyan-500/40 animate-pulse scale-125 z-20';
          } else if (isFlow) {
            nodeColor = 'bg-emerald-500 border-emerald-300 text-slate-950 font-bold';
            ringEffect = 'ring-2 ring-emerald-400/50 z-10';
          } else if (isBuild) {
            nodeColor = 'bg-amber-500 border-amber-300 text-slate-950 font-bold';
            ringEffect = 'ring-2 ring-amber-400/50 z-10';
          } else if (isShift) {
            nodeColor = 'bg-purple-500 border-purple-300 text-slate-950 font-bold';
            ringEffect = 'ring-2 ring-purple-400/50 z-10';
          }

          return (
            <div
              key={track.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              onMouseEnter={() => setHoveredTrack(track)}
              onMouseLeave={() => setHoveredTrack(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 group ${ringEffect}`}
            >
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] shadow-lg ${nodeColor}`}
              >
                {isMaster ? 'M' : isFlow ? 'A' : isBuild ? 'B' : isShift ? 'C' : track.intelligence?.camelotKey || '•'}
              </div>

              {/* Mini persistent label for key nodes */}
              {(isMaster || isFlow || isBuild || isShift) && (
                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-slate-900/90 border border-slate-700 rounded text-[9px] font-mono text-slate-200 pointer-events-none shadow-md">
                  {track.title}
                </span>
              )}
            </div>
          );
        })}

        {/* Hovered Track Tooltip Card */}
        {hoveredTrack && (
          <div
            className="absolute bottom-4 left-4 z-30 p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md max-w-xs flex flex-col gap-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-100">{hoveredTrack.title}</h4>
                <p className="text-[11px] text-slate-400">{hoveredTrack.artist}</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-cyan-300">
                {hoveredTrack.intelligence?.camelotKey || hoveredTrack.key} • {hoveredTrack.bpm} BPM
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300">
              <div className="p-1 bg-slate-800 rounded">
                <span className="text-slate-500 block text-[8px]">ENERGIE</span>
                <span>{hoveredTrack.intelligence?.energy ?? 70}%</span>
              </div>
              <div className="p-1 bg-slate-800 rounded">
                <span className="text-slate-500 block text-[8px]">GROOVE</span>
                <span>{hoveredTrack.intelligence?.groove ?? 75}%</span>
              </div>
              <div className="p-1 bg-slate-800 rounded">
                <span className="text-slate-500 block text-[8px]">VIBE</span>
                <span className="truncate block">{hoveredTrack.genre}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => {
                  if (auditionState.isPlaying && auditionState.trackId === hoveredTrack.id) {
                    stopAudition();
                  } else {
                    playAudition(hoveredTrack, undefined, 12);
                  }
                }}
                className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-slate-200 flex items-center justify-center gap-1"
              >
                <Headphones className="w-3 h-3 text-cyan-400" />
                <span>Vorhören</span>
              </button>
              <button
                onClick={() => {
                  applyMusicalFuture({
                    id: 'custom-selected',
                    strategy: 'flow',
                    badgeLabel: 'Ausgewählt',
                    headline: hoveredTrack.title,
                    track: hoveredTrack,
                    compatibilityScore: 90,
                    harmonicMatch: 'Harmonisch',
                    energyDelta: '±0%',
                    bpmDelta: '±0 BPM',
                    feeling: 'Direkt aus 2D Raum gewählt',
                    explanation: 'Vom DJ direkt in der Klangtopologie ausgewählt.',
                    recommendedTransition: {
                      strategyName: 'blend',
                      germanStrategyTitle: 'Harmonischer Fade',
                      stepRecipe: ['1. EQs angleichen', '2. Überblenden'],
                      rationale: 'Sanfter Übergang',
                      presetId: 'crossfade',
                    },
                    cognitiveRationale: {
                      rhythmImpact: 'Kontinuierlicher Rhythmus',
                      vocalTension: 'Harmonische Abstimmung',
                      crowdEffect: 'Fließender Übergang',
                    },
                  });
                }}
                className="flex-1 py-1 px-2 bg-cyan-600 hover:bg-cyan-500 rounded text-[11px] font-bold text-white flex items-center justify-center gap-1"
              >
                <span>Laden</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Axis Guide */}
      <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
        <span>← Weniger Groove / Deep Minimal</span>
        <span className="text-slate-500">2D Klang-Topologie</span>
        <span>Mehr Groove / Jackin Funk →</span>
      </div>
    </div>
  );
};
