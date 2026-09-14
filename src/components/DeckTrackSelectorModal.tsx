import React, { useRef, useState } from 'react';
import {
  X,
  Music,
  Upload,
  Search,
  Check,
  Disc,
  Play,
  Volume2,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { DeckId, Track } from '../types';

interface DeckTrackSelectorModalProps {
  deckId: DeckId | null;
  onClose: () => void;
}

export const DeckTrackSelectorModal: React.FC<DeckTrackSelectorModalProps> = ({
  deckId,
  onClose,
}) => {
  const { trackLibrary, loadTrackToDeck, importUserTrack, deckA, deckB } = useDJ();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!deckId) return null;

  const currentDeck = deckId === 'A' ? deckA : deckB;
  const color = deckId === 'A' ? '#06b6d4' : '#ec4899';

  const handleSelectTrack = (track: Track) => {
    loadTrackToDeck(deckId, track);
    onClose();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsImporting(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const newTrack = await importUserTrack(files[i]);
        if (i === 0 && newTrack) {
          loadTrackToDeck(deckId, newTrack);
        }
      }
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const filteredTracks = trackLibrary.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bpm.toString().includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: `0 0 40px ${color}25, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Hidden File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-neutral-950 shadow"
              style={{ backgroundColor: color }}
            >
              {deckId}
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100 flex items-center gap-2">
                TITELWAHL FÜR DECK {deckId}
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  TRACK AUSWÄHLEN / IMPORTIEREN
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Aktuell geladen: {currentDeck.track ? currentDeck.track.title : 'Kein Titel'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Drag-Drop Upload Area */}
        <div className="p-4 border-b border-neutral-800 flex flex-col gap-3 bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Suche nach Titel, Künstler, BPM oder Key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-neutral-950 text-xs text-neutral-100 pl-9 pr-3 py-2 rounded-xl border border-neutral-800 focus:border-cyan-500 outline-none"
              />
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-950 flex items-center gap-1.5 transition shadow active:scale-95 flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              <Upload className="w-3.5 h-3.5" />
              {isImporting ? 'LÄDT...' : 'EIGENE DATEI LADEN'}
            </button>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) {
                handleFileUpload(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl py-2.5 px-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs ${
              dragOver
                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60 text-neutral-400'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>Audio-Datei hier ablegen (MP3, WAV, FLAC) um sofort auf Deck {deckId} zu laden</span>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-neutral-850">
          {filteredTracks.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              Keine passenden Titel gefunden. Importiere einen Song oder ändere den Suchbegriff.
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isCurrentlyLoaded = currentDeck.track?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className={`py-2.5 px-3 rounded-xl cursor-pointer transition flex items-center justify-between group my-0.5 ${
                    isCurrentlyLoaded
                      ? 'bg-neutral-800/80 border border-neutral-700'
                      : 'hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${track.color || '#06b6d4'}20`,
                        color: track.color || '#06b6d4',
                      }}
                    >
                      <Disc className="w-5 h-5 group-hover:animate-spin" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-100 truncate">
                          {track.title}
                        </span>
                        {track.sourceType === 'custom' && (
                          <span className="text-[8px] font-mono bg-purple-950 text-purple-400 px-1 py-0.2 rounded border border-purple-800">
                            USER FILE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 truncate block">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  {/* Track Meta & Load Button */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 text-right font-mono text-xs">
                      <span className="text-cyan-400 font-bold">{track.bpm} BPM</span>
                      <span className="text-amber-400 font-semibold">{track.key}</span>
                      <span className="text-neutral-500 text-[10px] hidden sm:inline">
                        {formatSec(track.duration)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTrack(track);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                        isCurrentlyLoaded
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'text-neutral-950 hover:opacity-90 active:scale-95'
                      }`}
                      style={{
                        backgroundColor: isCurrentlyLoaded ? '#262626' : color,
                      }}
                    >
                      {isCurrentlyLoaded ? 'AKTIV' : `IN DECK ${deckId} LADEN`}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
          <span>Klicke auf einen Song, um ihn sofort geladen und spielbereit zu machen.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

function formatSec(sec: number): string {
  if (!sec || isNaN(sec)) return '1:04';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
