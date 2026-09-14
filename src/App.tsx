import React, { useState } from 'react';
import {
  FolderArchive,
  FolderOpen,
  Grid,
  Layers,
  Sliders,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import { CognitiveCopilotBar } from './components/CognitiveCopilotBar';
import { CrowdStateMonitor } from './components/CrowdStateMonitor';
import { DeckPanel } from './components/DeckPanel';
import { EffectsRack } from './components/EffectsRack';
import { EnergyJourneyView } from './components/EnergyJourneyView';
import { Header } from './components/Header';
import { InterfaceModeSelector } from './components/InterfaceModeSelector';
import { MacroAutomationBar } from './components/MacroAutomationBar';
import { MasterControlBar } from './components/MasterControlBar';
import { MixerPanel } from './components/MixerPanel';
import { MixLibraryPanel } from './components/MixLibraryPanel';
import { MusicalDNAPanel } from './components/MusicalDNAPanel';
import { MusicalFuturesPanel } from './components/MusicalFuturesPanel';
import { MusicalSpaceCanvas } from './components/MusicalSpaceCanvas';
import { CasualPartyDashboard } from './components/CasualPartyDashboard';
import { PlaylistDeckManager } from './components/PlaylistDeckManager';
import { SamplerPads } from './components/SamplerPads';
import { ShortcutsModal } from './components/ShortcutsModal';
import { StemLayerPanel } from './components/StemLayerPanel';
import { TrackLibrary } from './components/TrackLibrary';
import { TransitionRack } from './components/TransitionRack';
import { DJProvider, useDJ } from './context/DJContext';

type ActiveModuleTab = 'transitions' | 'library' | 'fx' | 'sampler' | 'layer3' | 'none';

function DJAppContent() {
  const { interfaceMode, hybridLayout } = useDJ();
  const [activeSecondaryTab, setActiveSecondaryTab] = useState<ActiveModuleTab>('none');
  const [classicSubView, setClassicSubView] = useState<'playlist' | 'classic'>('classic');

  return (
    <div className="min-h-screen text-white flex flex-col font-sans select-none overflow-x-hidden relative">
      {/* Background Dot Matrix Grid */}
      <div className="grid-bg" />

      {/* 1. Top Navigation Bar & Master Global Status */}
      <Header />

      {/* 2. Mode Selector (Cognitive Co-Pilot / 2D Space / AI DNA & Crowd / Decks / Playlists / Hybrid) */}
      <InterfaceModeSelector />

      {/* 3. Live Cognitive Co-Pilot Telemetry Bar (Energy, Tension, Direction, Crowd, Intent Input, Live Audio Audition) */}
      <CognitiveCopilotBar />

      {/* 4. Main DJ Console Workspace */}
      <main className="relative z-10 flex-1 p-2 md:p-4 max-w-7xl w-full mx-auto flex flex-col gap-4">
        {/* ==================================================== */}
        {/* VIEW 0: CASUAL / PARTY HOST MODE (Für Nicht-Musiker) */}
        {/* ==================================================== */}
        {interfaceMode === 'casual' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <CasualPartyDashboard />
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 1: COGNITIVE CO-PILOT (Default Core Experience) */}
        {/* ==================================================== */}
        {interfaceMode === 'cognitive' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* The 3 Musical Futures (Flow, Build, Shift + Instant Audition & 1-Click Transition) */}
            <MusicalFuturesPanel />

            {/* Set Dramaturgy & Energy Trajectory Curve */}
            <EnergyJourneyView />

            {/* Compact Master Decks & Crossfader Bar for quick access */}
            <MasterControlBar
              viewMode="classic"
              onToggleViewMode={() => {}}
            />

            {/* Dual Decks Console */}
            <section
              id="cognitive-dual-decks"
              className="flex flex-col lg:flex-row gap-3.5 items-stretch justify-center"
            >
              <DeckPanel deckId="A" />
              <MixerPanel />
              <DeckPanel deckId="B" />
            </section>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: 2D MUSICAL SPACE & TOPOLOGY GALAXY */}
        {/* ==================================================== */}
        {interfaceMode === 'space' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <MusicalSpaceCanvas />
            <MusicalFuturesPanel />
            <MasterControlBar
              viewMode="classic"
              onToggleViewMode={() => {}}
            />
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 3: AI ASSISTANT, DNA & CROWD TELEMETRY */}
        {/* ==================================================== */}
        {interfaceMode === 'copilot' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MusicalDNAPanel />
              <CrowdStateMonitor />
            </div>
            <MusicalFuturesPanel />
            <EnergyJourneyView />
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 4: TRACK STACK DECKS & PLAYLISTS */}
        {/* ==================================================== */}
        {interfaceMode === 'playlist' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <MasterControlBar
              viewMode="playlist"
              onToggleViewMode={() => {}}
            />
            <PlaylistDeckManager />
            <MusicalFuturesPanel />
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 5: CLASSIC DUAL-DECK PRO DJ CONSOLE */}
        {/* ==================================================== */}
        {interfaceMode === 'classic' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <MasterControlBar
              viewMode={classicSubView}
              onToggleViewMode={(mode) => setClassicSubView(mode)}
            />

            {classicSubView === 'playlist' ? (
              <PlaylistDeckManager />
            ) : (
              <section
                id="classic-decks-console"
                className="flex flex-col lg:flex-row gap-3.5 items-stretch justify-center"
              >
                <DeckPanel deckId="A" />
                <MixerPanel />
                <DeckPanel deckId="B" />
              </section>
            )}

            <MusicalFuturesPanel />
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 6: MODULAR HYBRID MODE (Custom Configurable) */}
        {/* ==================================================== */}
        {interfaceMode === 'hybrid' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {hybridLayout.showFutures && <MusicalFuturesPanel />}
            {hybridLayout.showJourney && <EnergyJourneyView />}
            {hybridLayout.showSpace && <MusicalSpaceCanvas />}
            {hybridLayout.showCrowd && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CrowdStateMonitor />
                <MusicalDNAPanel />
              </div>
            )}
            {hybridLayout.showDecks && (
              <section className="flex flex-col lg:flex-row gap-3.5 items-stretch justify-center">
                <DeckPanel deckId="A" />
                <MixerPanel />
                <DeckPanel deckId="B" />
              </section>
            )}
          </div>
        )}

        {/* 5. Mix Files Library (Recorded takes, transitions & generated audio files) */}
        <MixLibraryPanel />

        {/* 6. Optional Advanced Studio & Performance Tools (Expandable Tabs) */}
        <section className="glass-card p-3 md:p-4 shadow-2xl flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-space text-[10px] text-white/50 font-bold uppercase tracking-wider mr-1">
                STUDIO WERKZEUGE:
              </span>

              <button
                id="tab-layer3-mashup"
                onClick={() =>
                  setActiveSecondaryTab((prev) => (prev === 'layer3' ? 'none' : 'layer3'))
                }
                className={`pill-btn ${activeSecondaryTab === 'layer3' ? 'active' : ''}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3. Track Stem-Layer</span>
              </button>

              <button
                id="tab-transitions-detail"
                onClick={() =>
                  setActiveSecondaryTab((prev) => (prev === 'transitions' ? 'none' : 'transitions'))
                }
                className={`pill-btn ${activeSecondaryTab === 'transitions' ? 'active' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Übergangs-Kurven</span>
              </button>

              <button
                id="tab-effects-rack"
                onClick={() =>
                  setActiveSecondaryTab((prev) => (prev === 'fx' ? 'none' : 'fx'))
                }
                className={`pill-btn ${activeSecondaryTab === 'fx' ? 'active' : ''}`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>Studio FX Rack</span>
              </button>

              <button
                id="tab-sampler-pads"
                onClick={() =>
                  setActiveSecondaryTab((prev) => (prev === 'sampler' ? 'none' : 'sampler'))
                }
                className={`pill-btn ${activeSecondaryTab === 'sampler' ? 'active' : ''}`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>8-Pad Sampler</span>
              </button>
            </div>

            {activeSecondaryTab !== 'none' && (
              <button
                onClick={() => setActiveSecondaryTab('none')}
                className="font-space text-[10px] text-white/50 hover:text-white px-2.5 py-1 bg-white/[0.05] rounded-full border border-white/10 transition"
              >
                [ SCHLIEẞEN ✕ ]
              </button>
            )}
          </div>

          {/* Active Secondary Tab Panel */}
          {activeSecondaryTab === 'layer3' && <StemLayerPanel />}
          {activeSecondaryTab === 'transitions' && <TransitionRack />}
          {activeSecondaryTab === 'fx' && <EffectsRack />}
          {activeSecondaryTab === 'sampler' && <SamplerPads />}
        </section>
      </main>

      {/* Expressionist Studio Footer */}
      <footer className="relative z-10 px-4 md:px-6 py-3 border-t border-white/10 backdrop-blur-md bg-[#121016]/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="font-space text-[10px] text-white/60 tracking-wider">
            STATUS: ALL SYSTEMS NOMINAL • AI CALCULATING HARMONIC DRIFT
          </span>
        </div>
        <div className="font-space text-[10px] text-white/40 tracking-widest uppercase">
          v4.3.3 • DSP LIVE • BEATCRAFT PRO
        </div>
      </footer>

      {/* Global Keyboard Shortcuts Guide Modal */}
      <ShortcutsModal />
    </div>
  );
}

export default function App() {
  return (
    <DJProvider>
      <DJAppContent />
    </DJProvider>
  );
}
