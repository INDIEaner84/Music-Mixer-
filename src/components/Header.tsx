import React, { useState } from 'react';
import {
  Disc3,
  CircleDot,
  Download,
  Maximize2,
  Minimize2,
  Keyboard,
  Volume2,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { Knob } from './Knob';
import { VUMeter } from './VUMeter';
import { AudioImportTuningStudio } from './AudioImportTuningStudio';

export const Header: React.FC = () => {
  const {
    masterVolume,
    setMasterVolume,
    vuLevels,
    isRecording,
    recordingDuration,
    recordedAudioUrl,
    toggleRecording,
    setShowShortcutsModal,
  } = useDJ();

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showStudio, setShowStudio] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatRecTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="relative z-10 backdrop-blur-xl bg-[#121016]/80 border-b border-white/10 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
      {/* Brand & Logo with Expressionist Tilt */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff3e81] via-purple-600 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(255,62,129,0.35)] flex items-center justify-center -rotate-3 hover:rotate-0 transition-transform">
          <div className="w-full h-full bg-[#121016] rounded-[14px] flex items-center justify-center">
            <Disc3 className="w-5 h-5 text-[#ff3e81] animate-[spin_6s_linear_infinite]" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-gaegu text-3xl md:text-4xl text-white leading-none -rotate-1 tracking-tight select-none">
              BeatCraft <span className="text-[#ff3e81]">Pro</span>
            </h1>
            <span className="font-space text-[9px] font-bold bg-[#ff3e81]/15 text-[#ff3e81] px-2 py-0.5 rounded-full border border-[#ff3e81]/30 uppercase tracking-wider">
              DSP LIVE
            </span>
          </div>
          <p className="font-space text-[10px] text-white/50 tracking-wider uppercase">
            Cognitive Co-Pilot DJ Studio
          </p>
        </div>
      </div>

      {/* Right Controls: Master Volume, Stereo VU Meter, Recording, Shortcuts */}
      <div className="flex items-center gap-2.5 md:gap-4 flex-wrap">
        {/* Master Output & Stereo VU Meters */}
        <div className="flex items-center gap-2.5 bg-white/[0.04] backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex flex-col">
            <span className="font-space text-[9px] uppercase tracking-wider text-white/50">
              MASTER OUT
            </span>
            <span className="font-space text-xs text-white font-bold">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          <Knob
            id="knob-master-vol"
            value={Math.round(masterVolume * 100)}
            min={0}
            max={120}
            defaultValue={90}
            label=""
            color="#ff3e81"
            size="sm"
            onChange={(val) => setMasterVolume(val / 100)}
          />

          {/* Master Stereo L / R VU Meter */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <div className="flex flex-col items-center">
              <VUMeter level={vuLevels.masterL} height={32} width={5} segments={8} />
              <span className="text-[7px] font-space text-white/40 mt-0.5">L</span>
            </div>
            <div className="flex flex-col items-center">
              <VUMeter level={vuLevels.masterR} height={32} width={5} segments={8} />
              <span className="text-[7px] font-space text-white/40 mt-0.5">R</span>
            </div>
          </div>
        </div>

        {/* Live Set Recorder */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            className={`pill-btn ${
              isRecording
                ? 'active !bg-red-600 !border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.7)] animate-pulse'
                : ''
            }`}
            title="Record DJ Set"
          >
            <CircleDot className="w-3.5 h-3.5 text-red-400" />
            <span>{isRecording ? `REC ${formatRecTime(recordingDuration)}` : 'RECORD SET'}</span>
          </button>

          {/* Download Recording Link */}
          {recordedAudioUrl && (
            <a
              href={recordedAudioUrl}
              download={`DJ_Set_${new Date().toISOString().slice(0, 10)}.webm`}
              className="pill-btn !bg-emerald-500 !border-emerald-400 !text-slate-950 font-bold"
              title="Download Recorded DJ Set"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SAVE MIX</span>
            </a>
          )}
        </div>

        {/* Audio Tuning Studio, Shortcuts & Fullscreen Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowStudio(true)}
            className="pill-btn !bg-gradient-to-r !from-purple-600 !via-pink-600 !to-[#ff3e81] !border-transparent shadow-[0_0_15px_rgba(255,62,129,0.3)] hover:brightness-110"
            title="Audio-Import, Key-Tuning, Drum-Pad Slicer & WAV Export"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline font-bold">TUNING STUDIO</span>
          </button>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white hover:text-black text-white/70 border border-white/10 flex items-center justify-center transition"
            title="Keyboard Shortcuts [Shift + ?]"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white hover:text-black text-white/70 border border-white/10 flex items-center justify-center transition"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Audio Import & Tuning Studio Modal */}
      <AudioImportTuningStudio
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
      />
    </header>
  );
};
