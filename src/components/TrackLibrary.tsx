import React, { useRef, useState } from 'react';
import {
  Music,
  Upload,
  FolderOpen,
  Play,
  Clock,
  Radio,
  FileAudio,
  Check,
  Search,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { Track } from '../types';

export const TrackLibrary: React.FC = () => {
  const { trackLibrary, loadTrackToDeck, importUserTrack, deckA, deckB } = useDJ();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await importUserTrack(files[i]);
      }
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFileSelect(e.dataTransfer.files);
    }
  };

  const filteredTracks = trackLibrary.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      id="track-library-browser"
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl flex flex-col gap-3"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-100 flex items-center gap-2">
              TRACK CRATE & FILE IMPORT
              <span className="text-[10px] font-mono font-normal text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800">
                MP3 / WAV / AAC / FLAC
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Drag & drop your local songs or choose from built-in club demo tracks
            </p>
          </div>
        </div>

        {/* Search & Upload Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search tracks, BPM, key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-950 text-xs text-neutral-200 pl-8 pr-3 py-1 rounded-lg border border-neutral-800 focus:border-cyan-500 outline-none w-48"
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingFile}
            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
          >
            <Upload className="w-3.5 h-3.5" />
            {isLoadingFile ? 'IMPORTING...' : 'IMPORT AUDIO'}
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-2 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40'
        }`}
      >
        <FileAudio className="w-4 h-4 text-cyan-400" />
        <span className="text-xs text-neutral-300 font-medium">
          Drop audio files here to import into your DJ crate
        </span>
      </div>

      {/* Tracks Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead>
            <tr className="border-b border-neutral-800 text-[10px] font-mono uppercase text-neutral-500">
              <th className="pb-2 font-semibold">Track Title</th>
              <th className="pb-2 font-semibold">Artist</th>
              <th className="pb-2 font-semibold">BPM</th>
              <th className="pb-2 font-semibold">Key</th>
              <th className="pb-2 font-semibold">Duration</th>
              <th className="pb-2 font-semibold text-right">Load To Deck</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850">
            {filteredTracks.map((track) => {
              const isLoadedA = deckA.track?.id === track.id;
              const isLoadedB = deckB.track?.id === track.id;

              return (
                <tr
                  key={track.id}
                  className="hover:bg-neutral-800/50 transition group"
                >
                  <td className="py-2.5 font-bold text-neutral-100 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: track.color || '#06b6d4' }}
                    />
                    <span className="truncate max-w-[200px]">{track.title}</span>
                    {track.sourceType === 'custom' && (
                      <span className="text-[8px] font-mono bg-purple-950 text-purple-400 px-1 py-0.2 rounded border border-purple-800">
                        USER
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-neutral-400 truncate max-w-[150px]">
                    {track.artist}
                  </td>
                  <td className="py-2.5 font-mono font-bold text-cyan-400">
                    {track.bpm}
                  </td>
                  <td className="py-2.5 font-mono font-bold text-amber-400">
                    {track.key}
                  </td>
                  <td className="py-2.5 font-mono text-neutral-400">
                    {formatDuration(track.duration)}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => loadTrackToDeck('A', track)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          isLoadedA
                            ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                            : 'bg-neutral-950 text-cyan-400 border-neutral-800 hover:bg-neutral-800'
                        }`}
                        title="Load into Deck A"
                      >
                        {isLoadedA ? 'ON DECK A' : 'LOAD A'}
                      </button>

                      <button
                        onClick={() => loadTrackToDeck('B', track)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          isLoadedB
                            ? 'bg-pink-500 text-neutral-950 border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.6)]'
                            : 'bg-neutral-950 text-pink-400 border-neutral-800 hover:bg-neutral-800'
                        }`}
                        title="Load into Deck B"
                      >
                        {isLoadedB ? 'ON DECK B' : 'LOAD B'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '1:04';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
