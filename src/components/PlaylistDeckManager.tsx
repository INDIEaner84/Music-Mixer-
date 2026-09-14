import React, { useState, useRef } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Pause,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Music,
  Sliders,
  FolderPlus,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { Track, TransitionPresetId } from '../types';
import { TrackDeckCard } from './TrackDeckCard';

export const PlaylistDeckManager: React.FC = () => {
  const {
    playlists,
    activePlaylistId,
    expandedTrackIds,
    autoMixActive,
    autoMixPreset,
    setActivePlaylistId,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrackToPlaylist,
    toggleExpandTrack,
    expandAllTracks,
    collapseAllTracks,
    toggleAutoMix,
    setAutoMixPreset,
    importUserTrack,
    trackLibrary,
    mixLibrary,
    initAudio,
  } = useDJ();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];

  // Filter tracks by search
  const filteredTracks = (activePlaylist?.tracks || []).filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.key.toLowerCase().includes(q) ||
      t.bpm.toString().includes(q)
    );
  });

  // Calculate playlist stats
  const totalDurationSec = (activePlaylist?.tracks || []).reduce((acc, t) => acc + (t.duration || 64), 0);
  const avgBpm =
    activePlaylist?.tracks && activePlaylist.tracks.length > 0
      ? Math.round(
          activePlaylist.tracks.reduce((acc, t) => acc + t.bpm, 0) / activePlaylist.tracks.length
        )
      : 128;

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowNewPlaylistModal(false);
  };

  const handleStartRename = () => {
    if (activePlaylist) {
      setEditedName(activePlaylist.name);
      setIsEditingName(true);
    }
  };

  const handleSaveRename = () => {
    if (activePlaylist && editedName.trim()) {
      renamePlaylist(activePlaylist.id, editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await initAudio();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const imported = await importUserTrack(file);
        if (activePlaylist) {
          addTrackToPlaylist(activePlaylist.id, imported);
        }
      } catch (err) {
        console.error('Failed to import track:', err);
      }
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div id="playlist-deck-manager" className="flex flex-col gap-4 w-full">
      {/* ===================== TOP PLAYLIST SELECTOR & TOOLBAR ===================== */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
        {/* Row 1: Playlist Selector Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          {/* Playlist Selection Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {playlists.map((pl) => {
              const isActive = pl.id === activePlaylist?.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => setActivePlaylistId(pl.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 border ${
                    isActive
                      ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:text-white'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>{pl.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-neutral-950/30 text-neutral-950 font-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {pl.tracks.length}
                  </span>
                </button>
              );
            })}

            {/* New Playlist Button */}
            <button
              onClick={() => setShowNewPlaylistModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-cyan-400 hover:text-cyan-300 border border-neutral-800 hover:border-cyan-500/40 flex items-center gap-1.5 transition flex-shrink-0"
              title="Neue DJ-Playlist anlegen"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEUE PLAYLIST</span>
            </button>
          </div>

          {/* Right Action Tools: Upload & Add from Library & AutoMix */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* AutoMix Button */}
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={toggleAutoMix}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow ${
                  autoMixActive
                    ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800'
                }`}
                title="Kontinuierlicher automatischer Übergang durch alle Playlist-Songs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{autoMixActive ? 'AUTOMIX AKTIV' : '▶ AUTOMIX PLAYLIST'}</span>
              </button>

              {autoMixActive && (
                <select
                  value={autoMixPreset}
                  onChange={(e) => setAutoMixPreset(e.target.value as TransitionPresetId)}
                  className="bg-neutral-900 text-neutral-300 text-[10px] font-bold px-2 py-1 rounded border border-neutral-800 outline-none"
                >
                  <option value="crossfade">Crossfade (8T)</option>
                  <option value="bass-swap">Bass-Drop Swap (4T)</option>
                  <option value="hpf-sweep">Filter Sweep (6T)</option>
                  <option value="echo-out">Echo Tail (6T)</option>
                </select>
              )}
            </div>

            {/* Import MP3/WAV */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 flex items-center gap-1.5 transition shadow active:scale-95"
              title="MP3, WAV oder M4A Dateien von deiner Festplatte in diese Playlist importieren"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>DATEIEN IMPORTIEREN</span>
            </button>

            {/* Add from Library Modal */}
            <button
              onClick={() => setShowAddTrackModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 flex items-center gap-1.5 transition shadow active:scale-95"
              title="Songs aus der integrierten Demo- & Mix-Bibliothek hinzufügen"
            >
              <Plus className="w-3.5 h-3.5 text-pink-400" />
              <span>AUS BIBLIOTHEK</span>
            </button>
          </div>
        </div>

        {/* Row 2: Active Playlist Header & Details */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Rename & Delete */}
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-neutral-950 text-neutral-100 px-2.5 py-1 rounded-lg text-sm font-bold border border-cyan-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1.5 rounded-lg bg-cyan-500 text-neutral-950 hover:bg-cyan-400"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  {activePlaylist?.name}
                </h2>
                <button
                  onClick={handleStartRename}
                  className="p-1 rounded text-neutral-500 hover:text-neutral-300 transition"
                  title="Playlist umbenennen"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {playlists.length > 1 && (
                  <button
                    onClick={() => {
                      if (activePlaylist && confirm(`Playlist "${activePlaylist.name}" wirklich löschen?`)) {
                        deletePlaylist(activePlaylist.id);
                      }
                    }}
                    className="p-1 rounded text-neutral-500 hover:text-red-400 transition"
                    title="Playlist löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Quick Stats Badges */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-400">
              <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                {activePlaylist?.tracks.length || 0} TITEL
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                ~{Math.floor(totalDurationSec / 60)} MIN GESAMT
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-400">
                Ø {avgBpm} BPM
              </span>
            </div>
          </div>

          {/* Search Filter & Expand/Collapse All */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titel, Artist, BPM, Key suchen..."
                className="bg-neutral-950 text-neutral-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-neutral-800 focus:border-cyan-500 outline-none w-48 sm:w-60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Expand / Collapse Toggle Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={expandAllTracks}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
                title="Alle Decks dieser Playlist ausklappen"
              >
                ALLE AUSKLAPPEN
              </button>
              <button
                onClick={collapseAllTracks}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
                title="Alle Decks zuklappen (Übersichtsansicht)"
              >
                ALLE ZUKLAPPEN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== STACKED VERTICAL TRACK DECKS LIST ===================== */}
      <div className="flex flex-col gap-2.5">
        {filteredTracks.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <Music className="w-10 h-10 text-neutral-600" />
            <h3 className="text-sm font-bold text-neutral-300">Keine Titel gefunden</h3>
            <p className="text-xs text-neutral-500 max-w-md">
              {searchQuery
                ? `Keine Suchergebnisse für "${searchQuery}".`
                : 'Diese Playlist ist aktuell leer. Füge Songs aus der Bibliothek hinzu oder importiere eigene Audio-Dateien.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowAddTrackModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition"
              >
                Song aus Bibliothek hinzufügen
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition"
              >
                Eigene Dateien hochladen
              </button>
            </div>
          </div>
        ) : (
          filteredTracks.map((track, idx) => {
            const isExpanded = expandedTrackIds.includes(track.id);
            const nextTrack = filteredTracks[idx + 1] || filteredTracks[0];

            return (
              <TrackDeckCard
                key={track.id}
                track={track}
                index={idx}
                totalTracks={filteredTracks.length}
                playlistId={activePlaylist?.id || 'default'}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpandTrack(track.id)}
                nextTrack={nextTrack}
              />
            );
          })
        )}
      </div>

      {/* ===================== MODAL: NEUE PLAYLIST ERSTELLEN ===================== */}
      {showNewPlaylistModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Neue DJ-Playlist erstellen
                </h3>
              </div>
              <button
                onClick={() => setShowNewPlaylistModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylistSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-mono font-bold text-neutral-300 block mb-1">
                  PLAYLIST-NAME:
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Tech House Peak Hour, Festival Warmup..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-neutral-300 block mb-1">
                  BESCHREIBUNG (OPTIONAL):
                </label>
                <input
                  type="text"
                  placeholder="z.B. Schnelle Übergänge und Vocal Mashups"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewPlaylistModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-300 hover:text-white transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Playlist erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SONG AUS BIBLIOTHEK HINZUFÜGEN ===================== */}
      {showAddTrackModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Song zur Playlist hinzufügen
                </h3>
              </div>
              <button
                onClick={() => setShowAddTrackModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              <span className="text-[11px] font-mono text-neutral-400">
                Wähle einen Demo-Track oder eine Aufnahme:
              </span>
              {trackLibrary.map((t) => {
                const isAlreadyIn = activePlaylist?.tracks.some((pt) => pt.title === t.title);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-neutral-100 truncate">{t.title}</h4>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {t.artist} • <span className="text-amber-400">{t.bpm} BPM</span> • {t.key}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (activePlaylist) {
                          addTrackToPlaylist(activePlaylist.id, t);
                          setShowAddTrackModal(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAlreadyIn ? 'NOCHMAL +' : 'HINZUFÜGEN'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowAddTrackModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-300 hover:text-white transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
