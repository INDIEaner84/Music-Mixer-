import React, { useState } from 'react';
import {
  Mic,
  Disc,
  Play,
  Pause,
  Sparkles,
  Volume2,
  FolderOpen,
  Zap,
  Music,
  Radio,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { StemMode, Track } from '../types';
import { DeckTrackSelectorModal } from './DeckTrackSelectorModal';
import { VUMeter } from './VUMeter';

export const StemLayerPanel: React.FC = () => {
  const {
    stemLayer,
    loadStemLayerTrack,
    toggleStemLayerPlay,
    setStemLayerMode,
    setStemLayerVolume,
    syncStemLayer,
    vuLevels,
    saveMixTake,
    deckA,
    deckB,
  } = useDJ();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const STEM_MODES: { mode: StemMode; label: string; icon: string; desc: string; color: string }[] = [
    {
      mode: 'vocals',
      label: '🎤 Nur Vocals / Acapella',
      icon: 'Mic',
      desc: 'Filtert Kick und Bass heraus, isoliert Stimmen & Harmonien.',
      color: '#ec4899',
    },
    {
      mode: 'beat',
      label: '🥁 Nur Beat & Drums',
      icon: 'Zap',
      desc: 'Hebt Kick-Drums & Percussion hervor, dämpft Gesang ab.',
      color: '#f59e0b',
    },
    {
      mode: 'bass',
      label: '🎸 Nur Bassline',
      icon: 'Music',
      desc: 'Isoliert Sub-Bass & tiefste Frequenzen.',
      color: '#8b5cf6',
    },
    {
      mode: 'full',
      label: '✨ Kompletter Song',
      icon: 'Disc',
      desc: 'Spielt alle Frequenzen ungefiltert.',
      color: '#06b6d4',
    },
  ];

  const handleCustomTrackSelect = (track: Track) => {
    loadStemLayerTrack(track);
    setIsSelectorOpen(false);
  };

  return (
    <div
      id="stem-layer-panel"
      className="bg-neutral-900 border border-purple-500/40 rounded-xl p-3 shadow-xl relative overflow-hidden flex flex-col gap-3"
      style={{
        boxShadow: '0 4px 20px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Top Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-black text-neutral-100 uppercase tracking-wider">
                3. LIED / STEM-LAYER (VOCALS & BEAT INJECTOR)
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                LIVE MASHUP
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Kombiniere ein drittes Lied: Lege z.B. nur die Vocals oder den Beat synchron über den laufenden Mix.
            </p>
          </div>
        </div>

        {/* Sync & Take Save Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={syncStemLayer}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-purple-300 border border-purple-800/80 flex items-center gap-1.5 transition active:scale-95 shadow"
            title="BPM an den Master-Track anpassen"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>SYNC ({stemLayer.bpm.toFixed(1)} BPM)</span>
          </button>

          <button
            onClick={() => saveMixTake(`Vocal/Beat Mashup Take (#${Date.now().toString().slice(-4)})`)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex items-center gap-1.5 transition active:scale-95 shadow"
            title="Diesen Mashup sofort als Datei in die Bibliothek sichern"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ALS DATEI SPEICHERN</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Track Selection & Stem Mode Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Track Info Card */}
        <div
          onClick={() => setIsSelectorOpen(true)}
          className="md:col-span-4 bg-neutral-950/80 border border-neutral-800 hover:border-purple-500/60 p-2.5 rounded-lg cursor-pointer transition group flex items-center justify-between gap-3 shadow"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-purple-400">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
                3. TRACK GELADEN:
              </span>
              <h4 className="text-xs font-bold text-neutral-100 truncate group-hover:text-purple-300">
                {stemLayer.track ? stemLayer.track.title : 'Kein Track ausgewählt'}
              </h4>
              <p className="text-[10px] text-neutral-400 truncate">
                {stemLayer.track ? stemLayer.track.artist : 'Klicke zum Auswählen'}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSelectorOpen(true);
            }}
            className="px-2 py-1 rounded bg-neutral-900 group-hover:bg-purple-600 group-hover:text-neutral-950 text-neutral-300 text-[10px] font-bold border border-neutral-700 transition"
          >
            ÄNDERN ▾
          </button>
        </div>

        {/* Stem Mode Selector (Vocals vs Beat vs Bass vs Full) */}
        <div className="md:col-span-5 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            WAS SOLL AUS TRACK 3 GENOMMEN WERDEN?
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {STEM_MODES.map((item) => {
              const isSelected = stemLayer.stemMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => setStemLayerMode(item.mode)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition flex flex-col items-center justify-center gap-0.5 text-center shadow ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.5)]'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white'
                  }`}
                  title={item.desc}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Playback Controls & Volume Slider */}
        <div className="md:col-span-3 flex items-center justify-end gap-3 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
          {/* Play/Pause Button */}
          <button
            onClick={toggleStemLayerPlay}
            className={`h-10 px-3.5 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 transition shadow active:scale-95 ${
              stemLayer.isPlaying
                ? 'bg-purple-500 text-neutral-950 border border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                : 'bg-neutral-800 hover:bg-neutral-700 text-purple-400 border border-neutral-700'
            }`}
          >
            {stemLayer.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{stemLayer.isPlaying ? 'MUTE' : 'START'}</span>
          </button>

          {/* Volume Fader */}
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="range"
              min={0}
              max={1.2}
              step={0.01}
              value={stemLayer.volume}
              onChange={(e) => setStemLayerVolume(parseFloat(e.target.value))}
              className="w-20 accent-purple-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              title="Stem Layer Lautstärke"
            />
          </div>

          <VUMeter id="vu-stem-layer" level={vuLevels.layer3} height={32} width={6} />
        </div>
      </div>

      {/* Track Selector Modal */}
      {isSelectorOpen && (
        <DeckTrackSelectorModal
          deckId="A"
          onClose={() => setIsSelectorOpen(false)}
          onSelectCustomTrack={handleCustomTrackSelect}
        />
      )}
    </div>
  );
};
