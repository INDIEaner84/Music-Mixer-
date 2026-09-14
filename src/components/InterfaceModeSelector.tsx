import React from 'react';
import {
  Activity,
  Bot,
  Compass,
  Crosshair,
  Dna,
  Layers,
  LayoutGrid,
  ListMusic,
  PartyPopper,
  Radio,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { InterfaceMode } from '../types';

export const InterfaceModeSelector: React.FC = () => {
  const { interfaceMode, setInterfaceMode, hybridLayout, setHybridLayout } = useDJ();

  const modes: { id: InterfaceMode; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    {
      id: 'casual',
      label: '🎉 Party Host (Einfach)',
      icon: PartyPopper,
      desc: 'Einsteiger-Dashboard für Nicht-Musiker mit Autopilot & Vibe-Wähler',
    },
    {
      id: 'cognitive',
      label: '🧠 Kognitiver Co-Pilot',
      icon: Bot,
      desc: 'Drei Zukunftswege + Set-Dramaturgie + Decks',
    },
    {
      id: 'space',
      label: '🌌 2D Musik-Raum',
      icon: Crosshair,
      desc: 'Topologische Klang-Galaxie & Vektoren',
    },
    {
      id: 'copilot',
      label: '🤖 AI & Crowd Intelligenz',
      icon: Sparkles,
      desc: 'DNA-Lernkurve & Raum-Telemetrie',
    },
    {
      id: 'playlist',
      label: '📑 Track-Stapel Decks',
      icon: ListMusic,
      desc: 'Ausklappbare Track-Stapel & Playlists',
    },
    {
      id: 'classic',
      label: '🎛️ Klassische Decks',
      icon: Sliders,
      desc: 'Klassisches 2-Deck Hardware-Layout',
    },
    {
      id: 'hybrid',
      label: '⚡ Modularer Hybrid-Modus',
      icon: LayoutGrid,
      desc: 'Frei konfigurierbare Ansicht',
    },
  ];

  return (
    <div id="interface-mode-selector" className="relative z-10 w-full bg-[#121016]/60 backdrop-blur-lg border-b border-white/10 px-4 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Expressionist Pill Mode Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = interfaceMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setInterfaceMode(m.id)}
                className={`pill-btn ${isActive ? 'active' : ''}`}
                title={m.desc}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hybrid Mode Toggles (when in hybrid mode) */}
        {interfaceMode === 'hybrid' && (
          <div className="flex flex-wrap items-center gap-2.5 text-xs bg-white/[0.04] backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
            <span className="font-space text-white/50 text-[10px] uppercase">Module:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-white/80 text-[11px] font-medium hover:text-white">
              <input
                type="checkbox"
                checked={hybridLayout.showFutures}
                onChange={(e) => setHybridLayout({ showFutures: e.target.checked })}
                className="rounded border-white/20 bg-white/10 text-[#ff3e81] focus:ring-0"
              />
              <span>3 Zukunftswege</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-white/80 text-[11px] font-medium hover:text-white">
              <input
                type="checkbox"
                checked={hybridLayout.showJourney}
                onChange={(e) => setHybridLayout({ showJourney: e.target.checked })}
                className="rounded border-white/20 bg-white/10 text-[#ff3e81] focus:ring-0"
              />
              <span>Dramaturgie</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-white/80 text-[11px] font-medium hover:text-white">
              <input
                type="checkbox"
                checked={hybridLayout.showSpace}
                onChange={(e) => setHybridLayout({ showSpace: e.target.checked })}
                className="rounded border-white/20 bg-white/10 text-[#ff3e81] focus:ring-0"
              />
              <span>2D Raum</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-white/80 text-[11px] font-medium hover:text-white">
              <input
                type="checkbox"
                checked={hybridLayout.showCrowd}
                onChange={(e) => setHybridLayout({ showCrowd: e.target.checked })}
                className="rounded border-white/20 bg-white/10 text-[#ff3e81] focus:ring-0"
              />
              <span>Crowd</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-white/80 text-[11px] font-medium hover:text-white">
              <input
                type="checkbox"
                checked={hybridLayout.showDecks}
                onChange={(e) => setHybridLayout({ showDecks: e.target.checked })}
                className="rounded border-white/20 bg-white/10 text-[#ff3e81] focus:ring-0"
              />
              <span>Decks</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
