import React, { useRef, useState } from 'react';
import { Grid, Upload, Volume2, Music, Sparkles } from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { SamplePad } from '../types';

export const SamplerPads: React.FC = () => {
  const { samplerPads, triggerPad, updatePad, loadPadFile } = useDJ();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPadForUpload, setSelectedPadForUpload] = useState<number | null>(null);

  const handleUploadClick = (padIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPadForUpload(padIndex);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPadForUpload !== null) {
      await loadPadFile(selectedPadForUpload, file);
      setSelectedPadForUpload(null);
    }
  };

  return (
    <div
      id="sampler-performance-pads"
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl flex flex-col gap-3"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-100 flex items-center gap-2">
              8-PAD PERFORMANCE SAMPLER
              <span className="text-[10px] font-mono font-normal text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                KEYS [1-8]
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Trigger studio drops, drums, and custom sound effects live during your set
            </p>
          </div>
        </div>
      </div>

      {/* 8 Pads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {samplerPads.map((pad, index) => {
          return (
            <div
              key={pad.id}
              id={`sampler-pad-${index + 1}`}
              onClick={() => triggerPad(index)}
              className={`h-24 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition select-none relative group active:scale-95 ${
                pad.isPlaying
                  ? 'bg-neutral-700 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                  : 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700'
              }`}
              style={{
                boxShadow: pad.isPlaying
                  ? `0 0 15px ${pad.color}`
                  : `inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              {/* Pad Top: Category + Key Tag */}
              <div className="flex items-center justify-between">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-black text-neutral-950"
                  style={{ backgroundColor: pad.color }}
                >
                  {pad.keyTrigger}
                </span>

                <button
                  onClick={(e) => handleUploadClick(index, e)}
                  className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-white text-neutral-500 rounded bg-neutral-900 border border-neutral-800"
                  title="Load custom sample file (MP3/WAV)"
                >
                  <Upload className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Pad Title */}
              <div className="my-auto text-center">
                <span className="text-xs font-black text-neutral-100 block truncate">
                  {pad.name}
                </span>
                <span className="text-[8px] font-mono text-neutral-500 uppercase">
                  {pad.category}
                </span>
              </div>

              {/* Pad Bottom: Volume slider & Trigger indicator */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-850">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: pad.isPlaying ? '#ffffff' : pad.color,
                    boxShadow: pad.isPlaying ? `0 0 6px #ffffff` : 'none',
                  }}
                />

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={pad.volume}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updatePad(index, { volume: parseFloat(e.target.value) })}
                  className="w-12 h-1 bg-neutral-800 rounded appearance-none accent-neutral-400 cursor-pointer"
                  title={`Pad Volume: ${Math.round(pad.volume * 100)}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
