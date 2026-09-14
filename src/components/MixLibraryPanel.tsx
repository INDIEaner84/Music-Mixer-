import React, { useState } from 'react';
import {
  FolderArchive,
  Play,
  Pause,
  Download,
  Trash2,
  Sparkles,
  Music,
  Clock,
  Radio,
  FileCheck,
  Disc,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { MixRecordingItem } from '../types';

export const MixLibraryPanel: React.FC = () => {
  const { mixLibrary, deleteMixItem, saveMixTake, isRecording, toggleRecording, recordingDuration } = useDJ();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleTogglePreview = (item: MixRecordingItem) => {
    if (playingId === item.id) {
      setPlayingId(null);
    } else {
      setPlayingId(item.id);
    }
  };

  const handleDownload = (item: MixRecordingItem) => {
    if (item.audioUrl) {
      const a = document.createElement('a');
      a.href = item.audioUrl;
      a.download = `${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.webm`;
      a.click();
    } else {
      // Create a mock text/audio blob for instant export
      const text = `DJ Mix Take Export: ${item.title}\nBPM: ${item.bpm}\nKey: ${item.key}\nCreated: ${item.createdAt}\nSources: ${JSON.stringify(item.sourceTracks)}`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_take_info.txt`;
      a.click();
    }
  };

  return (
    <div
      id="mix-library-panel"
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-black text-neutral-100 uppercase tracking-wider">
                MIX-BIBLIOTHEK & GENERIERTE AUDIO-DATEIEN ({mixLibrary.length})
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                AUTO-SAVED TAKES
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Jeder Mix-Vorgang, Übergang und jede Gesangs-Kombination erzeugt hier automatisch eine abspielbare Datei.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => saveMixTake()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 flex items-center gap-1.5 transition active:scale-95 shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEUEN MIX-TAKE SICHERN</span>
          </button>

          <button
            onClick={toggleRecording}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border ${
              isRecording
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-neutral-950 text-red-400 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
            <span>{isRecording ? `REC STOP (${recordingDuration}s)` : 'REC SET'}</span>
          </button>
        </div>
      </div>

      {/* Files List */}
      {mixLibrary.length === 0 ? (
        <div className="p-6 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-lg text-xs">
          Noch keine Mix-Dateien vorhanden. Starte einen Übergang oder klicke oben auf &quot;Neuen Mix-Take sichern&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {mixLibrary.map((item) => {
            const isPlaying = playingId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition flex flex-col justify-between gap-2 ${
                  isPlaying
                    ? 'bg-neutral-850 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleTogglePreview(item)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition shadow flex-shrink-0 ${
                        isPlaying
                          ? 'bg-cyan-500 text-neutral-950'
                          : 'bg-neutral-900 text-cyan-400 border border-neutral-700 hover:bg-cyan-950'
                      }`}
                      title={isPlaying ? 'Pause' : 'Anhören'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-100 truncate">{item.title}</h4>
                      <p className="text-[10px] text-neutral-400 flex items-center gap-2 truncate">
                        <span className="flex items-center gap-1 font-mono text-cyan-400">
                          <Clock className="w-3 h-3" />
                          {item.durationSeconds}s
                        </span>
                        <span>•</span>
                        <span className="font-mono">{item.createdAt}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-mono font-bold">{item.bpm} BPM</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(item)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-400 border border-neutral-800 transition"
                      title="Audio-Datei herunterladen (.webm / audio)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMixItem(item.id)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-800 transition"
                      title="Aus Bibliothek löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Combination source tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-neutral-900 text-[9px] font-mono text-neutral-400">
                  <span className="text-neutral-500 font-bold">KOMBINATION:</span>
                  {item.sourceTracks.deckA && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-900 truncate max-w-[120px]">
                      A: {item.sourceTracks.deckA}
                    </span>
                  )}
                  {item.sourceTracks.deckB && (
                    <span className="px-1.5 py-0.2 rounded bg-pink-950/60 text-pink-300 border border-pink-900 truncate max-w-[120px]">
                      B: {item.sourceTracks.deckB}
                    </span>
                  )}
                  {item.sourceTracks.layer3 && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-900 truncate max-w-[150px]">
                      + {item.sourceTracks.layer3}
                    </span>
                  )}
                  {item.sourceTracks.presetUsed && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-900">
                      ⚡ {item.sourceTracks.presetUsed}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
