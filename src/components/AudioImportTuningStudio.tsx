import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Upload,
  Music,
  Sliders,
  Download,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  Disc,
  Layers,
  FileAudio,
  Radio,
  Clock,
  Volume2,
  Share2,
  FolderOpen,
  Scissors,
  Save,
  Trash2,
  HardDrive,
  Info,
  X,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { Track } from '../types';
import {
  analyzeAudioBuffer,
  AudioAnalysisResult,
  decodeAudioFromFile,
  decodeAudioFromUrl,
} from '../audio/audioAnalyzer';
import {
  audioBufferToWavBlob,
  downloadAudioBlob,
  renderPitchedAudioBuffer,
  sliceAudioBuffer,
} from '../audio/audioExporter';

interface DrumPadClip {
  id: number;
  label: string;
  startSec: number;
  durationSec: number;
  buffer: AudioBuffer | null;
  color: string;
  volume: number;
  pitchSemitones: number;
}

interface SavedKit {
  id: string;
  name: string;
  createdAt: string;
  pads: {
    id: number;
    label: string;
    startSec: number;
    durationSec: number;
    color: string;
  }[];
}

interface AudioImportTuningStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrack?: Track | null;
}

export const AudioImportTuningStudio: React.FC<AudioImportTuningStudioProps> = ({
  isOpen,
  onClose,
  initialTrack,
}) => {
  const {
    deckA,
    deckB,
    loadTrackToDeck,
    loadStemLayerTrack,
    addTrackToPlaylist,
    playlists,
    activePlaylistId,
    initAudio,
    triggerPad,
  } = useDJ();

  const [activeTab, setActiveTab] = useState<'upload' | 'tune' | 'pads' | 'export'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loaded Track / Analysis State
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string>('Mein Song');
  const [currentArtist, setCurrentArtist] = useState<string>('Unbekannter Artist');
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [gdriveUrl, setGdriveUrl] = useState<string>('');

  // Harmonic Tuning State
  const [pitchSemitones, setPitchSemitones] = useState<number>(0);
  const [previewVolume, setPreviewVolume] = useState<number>(0.85);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState<number>(0);

  // Drum Pad Slicer State
  const [sliceStartSec, setSliceStartSec] = useState<number>(0);
  const [sliceDurationSec, setSliceDurationSec] = useState<number>(2.0); // 2 seconds default
  const [targetPadId, setTargetPadId] = useState<number>(0);
  const [drumPadClips, setDrumPadClips] = useState<DrumPadClip[]>([
    { id: 0, label: 'Pad 1: Kick Drop', startSec: 0, durationSec: 1.5, buffer: null, color: 'from-amber-500 to-yellow-600', volume: 0.9, pitchSemitones: 0 },
    { id: 1, label: 'Pad 2: Snare Roll', startSec: 2, durationSec: 1.5, buffer: null, color: 'from-emerald-500 to-teal-600', volume: 0.9, pitchSemitones: 0 },
    { id: 2, label: 'Pad 3: Vocal Hook', startSec: 8, durationSec: 2.0, buffer: null, color: 'from-purple-500 to-pink-600', volume: 0.9, pitchSemitones: 0 },
    { id: 3, label: 'Pad 4: Bass Stomp', startSec: 16, durationSec: 1.8, buffer: null, color: 'from-red-500 to-rose-600', volume: 0.9, pitchSemitones: 0 },
    { id: 4, label: 'Pad 5: Synth Chord', startSec: 24, durationSec: 2.5, buffer: null, color: 'from-cyan-500 to-blue-600', volume: 0.9, pitchSemitones: 0 },
    { id: 5, label: 'Pad 6: Climax FX', startSec: 32, durationSec: 2.0, buffer: null, color: 'from-indigo-500 to-purple-600', volume: 0.9, pitchSemitones: 0 },
    { id: 6, label: 'Pad 7: Hi-Hat Loop', startSec: 40, durationSec: 1.0, buffer: null, color: 'from-pink-500 to-amber-500', volume: 0.9, pitchSemitones: 0 },
    { id: 7, label: 'Pad 8: Outro Chime', startSec: 48, durationSec: 2.0, buffer: null, color: 'from-teal-500 to-emerald-600', volume: 0.9, pitchSemitones: 0 },
  ]);

  // Saved Kits
  const [savedKits, setSavedKits] = useState<SavedKit[]>([]);
  const [newKitName, setNewKitName] = useState<string>('Party Drop Kit 1');

  // Audio Context Ref for preview player
  const audioCtxRef = useRef<AudioContext | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewGainRef = useRef<GainNode | null>(null);
  const previewStartTimeRef = useRef<number>(0);
  const previewIntervalRef = useRef<number | null>(null);

  // Initialize Audio Context on demand
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Load initial track if passed
  useEffect(() => {
    if (initialTrack && initialTrack.audioBuffer) {
      setCurrentTrackTitle(initialTrack.title);
      setCurrentArtist(initialTrack.artist);
      const result = analyzeAudioBuffer(initialTrack.audioBuffer);
      setAnalysisResult(result);
    }
  }, [initialTrack]);

  // Load saved kits from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('beatcraft_saved_drum_kits');
      if (stored) {
        setSavedKits(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Camelot Note calculation
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const tunedKeyInfo = useMemo(() => {
    if (!analysisResult) return { key: 'C Major', camelot: '8B' };

    const origKey = analysisResult.key; // e.g. "A Minor" or "C Major"
    const isMinor = origKey.includes('Minor');
    const root = origKey.replace(' Minor', '').replace(' Major', '');
    const rootIndex = noteNames.indexOf(root);
    if (rootIndex === -1) return { key: origKey, camelot: analysisResult.camelotKey };

    const newRootIndex = (rootIndex + pitchSemitones + 24) % 12;
    const newKey = `${noteNames[newRootIndex]} ${isMinor ? 'Minor' : 'Major'}`;

    // Camelot adjustment
    // Each semitone shift moves around Camelot wheel
    // We compute new Camelot code based on semitone shift
    let origNum = parseInt(analysisResult.camelotKey);
    const origLetter = analysisResult.camelotKey.replace(/[0-9]/g, '');
    if (isNaN(origNum)) origNum = 8;
    // Semitone to camelot step mapping (multiply by 7 mod 12 in circle of fifths)
    const fifthShift = (pitchSemitones * 7) % 12;
    let newNum = (origNum + fifthShift + 120) % 12;
    if (newNum === 0) newNum = 12;

    return {
      key: newKey,
      camelot: `${newNum}${origLetter || 'A'}`,
    };
  }, [analysisResult, pitchSemitones]);

  // Handle Local File Upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      setAnalysisProgress(`Decodiere ${file.name}...`);
      await initAudio();

      const ctx = getAudioContext();
      const buffer = await decodeAudioFromFile(file, ctx);

      setAnalysisProgress('Analysiere Beats, Tonart & Struktur...');
      const result = analyzeAudioBuffer(buffer);

      setCurrentTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
      setCurrentArtist('Lokaler Upload');
      setAnalysisResult(result);
      setPitchSemitones(0);
      setSliceStartSec(0);

      // Auto-populate drum pads with detected structural drops
      updateDefaultPadSlices(result);

      setIsAnalyzing(false);
      setAnalysisProgress('');
      setActiveTab('tune');
    } catch (err: unknown) {
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : 'Audio konnte nicht gelesen werden';
      setErrorMessage(`Fehler beim Analysieren der Datei: ${msg}`);
    }
  };

  // Handle Google Drive / URL Import
  const handleUrlImport = async () => {
    if (!gdriveUrl.trim()) return;
    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      setAnalysisProgress('Lade Audio-Stream aus Google Drive / Web...');
      await initAudio();

      const ctx = getAudioContext();
      const buffer = await decodeAudioFromUrl(gdriveUrl, ctx);

      setAnalysisProgress('Analysiere Beats, Tonart & Struktur...');
      const result = analyzeAudioBuffer(buffer);

      setCurrentTrackTitle('Cloud Audio Track');
      setCurrentArtist('Google Drive Import');
      setAnalysisResult(result);
      setPitchSemitones(0);

      updateDefaultPadSlices(result);

      setIsAnalyzing(false);
      setAnalysisProgress('');
      setActiveTab('tune');
    } catch (err: unknown) {
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : 'URL konnte nicht geladen werden';
      setErrorMessage(`Fehler beim Cloud-Import: ${msg}`);
    }
  };

  // Auto-populate drum pad start points from track structure
  const updateDefaultPadSlices = (result: AudioAnalysisResult) => {
    const s = result.structure;
    setDrumPadClips((prev) => [
      { ...prev[0], startSec: Math.max(0, s.intro[0]), buffer: null },
      { ...prev[1], startSec: Math.max(0, s.intro[1]), buffer: null },
      { ...prev[2], startSec: Math.max(0, s.build[0]), buffer: null },
      { ...prev[3], startSec: Math.max(0, s.drop[0]), buffer: null },
      { ...prev[4], startSec: Math.max(0, s.breakdown[0]), buffer: null },
      { ...prev[5], startSec: Math.max(0, s.climax[0]), buffer: null },
      { ...prev[6], startSec: Math.max(0, s.outro[0]), buffer: null },
      { ...prev[7], startSec: Math.max(0, s.outro[0] + 4), buffer: null },
    ]);
  };

  // Toggle Preview Playback with Pitch Shift
  const togglePreview = async () => {
    if (!analysisResult) return;
    const ctx = getAudioContext();

    if (isPreviewPlaying) {
      stopPreview();
      return;
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = analysisResult.audioBuffer;
      // Pitch ratio
      const pitchRatio = Math.pow(2, pitchSemitones / 12);
      source.playbackRate.value = pitchRatio;

      const gain = ctx.createGain();
      gain.gain.value = previewVolume;

      source.connect(gain);
      gain.connect(ctx.destination);

      const startOffset = previewCurrentTime;
      source.start(0, startOffset);

      previewSourceRef.current = source;
      previewGainRef.current = gain;
      previewStartTimeRef.current = ctx.currentTime - (startOffset / pitchRatio);
      setIsPreviewPlaying(true);

      source.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewCurrentTime(0);
      };

      if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = window.setInterval(() => {
        if (previewSourceRef.current && audioCtxRef.current) {
          const elapsed = (audioCtxRef.current.currentTime - previewStartTimeRef.current) * pitchRatio;
          if (elapsed >= (analysisResult.duration || 60)) {
            stopPreview();
          } else {
            setPreviewCurrentTime(elapsed);
          }
        }
      }, 100);
    } catch {
      setIsPreviewPlaying(false);
    }
  };

  const stopPreview = () => {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
        previewSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      previewSourceRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    setIsPreviewPlaying(false);
  };

  // Match Pitch to Deck A or Deck B
  const matchPitchToDeck = (targetDeckId: 'A' | 'B') => {
    const targetDeck = targetDeckId === 'A' ? deckA : deckB;
    if (!targetDeck.track || !analysisResult) return;

    const targetKey = targetDeck.track.intelligence?.camelotKey || '8A';
    const targetNum = parseInt(targetKey);
    const origNum = parseInt(analysisResult.camelotKey);

    if (!isNaN(targetNum) && !isNaN(origNum)) {
      // Calculate closest semitone offset
      let diff = targetNum - origNum;
      if (diff > 6) diff -= 12;
      if (diff < -6) diff += 12;
      // Convert camelot difference to semitones (multiply by 5 mod 12)
      const semitoneShift = (diff * 5) % 12;
      setPitchSemitones(semitoneShift);
    }
  };

  // Slice Current Position into Selected Drum Pad
  const sliceToDrumPad = async (padIndex: number) => {
    if (!analysisResult) return;
    try {
      const sliced = await sliceAudioBuffer(
        analysisResult.audioBuffer,
        sliceStartSec,
        sliceDurationSec
      );

      setDrumPadClips((prev) =>
        prev.map((pad, idx) =>
          idx === padIndex
            ? {
                ...pad,
                startSec: sliceStartSec,
                durationSec: sliceDurationSec,
                buffer: sliced,
                label: `Pad ${padIndex + 1}: ${currentTrackTitle.slice(0, 10)} (${sliceStartSec.toFixed(1)}s)`,
              }
            : pad
        )
      );
    } catch {
      // ignore
    }
  };

  // Play sliced drum pad preview
  const playPadClip = async (pad: DrumPadClip) => {
    if (!analysisResult) return;
    const ctx = getAudioContext();

    try {
      let buffer = pad.buffer;
      if (!buffer) {
        buffer = await sliceAudioBuffer(
          analysisResult.audioBuffer,
          pad.startSec,
          pad.durationSec
        );
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const pitchRatio = Math.pow(2, (pitchSemitones + pad.pitchSemitones) / 12);
      source.playbackRate.value = pitchRatio;

      const gain = ctx.createGain();
      gain.gain.value = pad.volume * 0.9;

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    } catch {
      // ignore
    }
  };

  // Save Drum Pad Kit to LocalStorage
  const saveDrumKit = () => {
    const kit: SavedKit = {
      id: `kit-${Date.now()}`,
      name: newKitName.trim() || 'Custom Kit',
      createdAt: new Date().toLocaleDateString('de-DE'),
      pads: drumPadClips.map((p) => ({
        id: p.id,
        label: p.label,
        startSec: p.startSec,
        durationSec: p.durationSec,
        color: p.color,
      })),
    };

    const updated = [kit, ...savedKits.filter((k) => k.name !== kit.name)];
    setSavedKits(updated);
    try {
      localStorage.setItem('beatcraft_saved_drum_kits', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Export Tuned Audio to WAV / FLAC
  const handleExportTunedWav = async (format: 'wav' | 'flac' | 'mp3') => {
    if (!analysisResult) return;
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(`Rendere Song mit Pitch-Shift (${pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} Halbtöne)...`);

      const pitchedBuffer = await renderPitchedAudioBuffer(analysisResult.audioBuffer, {
        semitones: pitchSemitones,
        gain: 1.0,
      });

      const wavBlob = audioBufferToWavBlob(pitchedBuffer);
      const cleanTitle = currentTrackTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanTitle}_[Tuned_${pitchSemitones >= 0 ? `+${pitchSemitones}` : pitchSemitones}st_${tunedKeyInfo.camelot}_${analysisResult.bpm}BPM].${format}`;

      downloadAudioBlob(wavBlob, filename);
      setIsAnalyzing(false);
      setAnalysisProgress('');
    } catch (err) {
      setIsAnalyzing(false);
      setErrorMessage('Export fehlgeschlagen');
    }
  };

  // Load into Active DJ Engine
  const loadIntoDJEngine = async (target: 'A' | 'B' | 'stem' | 'playlist') => {
    if (!analysisResult) return;
    try {
      setIsAnalyzing(true);
      setAnalysisProgress('Bereite Track für das DJ Deck vor...');

      const pitchedBuffer = pitchSemitones !== 0
        ? await renderPitchedAudioBuffer(analysisResult.audioBuffer, { semitones: pitchSemitones })
        : analysisResult.audioBuffer;

      const newTrack: Track = {
        id: `user-track-${Date.now()}`,
        title: `${currentTrackTitle}${pitchSemitones !== 0 ? ` (${pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones}st)` : ''}`,
        artist: currentArtist,
        bpm: analysisResult.bpm,
        originalBpm: analysisResult.bpm,
        key: tunedKeyInfo.key,
        duration: pitchedBuffer.duration,
        audioBuffer: pitchedBuffer,
        waveformData: analysisResult.waveformData,
        sourceType: 'custom',
        intelligence: {
          camelotKey: tunedKeyInfo.camelot,
          energy: analysisResult.energy,
          danceability: 88,
          groove: 'driving',
          intensity: analysisResult.energy,
          vocalDensity: 'medium',
          rhythmicDensity: 75,
          harmonicTension: 30,
          emotionalTone: 'euphoric',
          atmosphere: 'Studio Tuned',
          genre: 'Imported Master',
          structure: analysisResult.structure,
          spaceCoords: {
            x: 0.2,
            y: (analysisResult.energy / 50) - 1,
          },
          tags: ['Custom Tuned', tunedKeyInfo.camelot],
        },
      };

      if (target === 'A') {
        await loadTrackToDeck('A', newTrack);
      } else if (target === 'B') {
        await loadTrackToDeck('B', newTrack);
      } else if (target === 'stem') {
        await loadStemLayerTrack(newTrack);
      } else if (target === 'playlist') {
        const targetPlaylist = playlists[0]?.id || activePlaylistId;
        addTrackToPlaylist(targetPlaylist, newTrack);
      }

      setIsAnalyzing(false);
      setAnalysisProgress('');
      onClose();
    } catch {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ========================================================================= */}
        {/* 1. MODAL HEADER & TABS                                                    */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/50 via-slate-900 to-purple-950/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Sliders className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Audio-Import, Tuning & Drum-Pad Slicer Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-300">
                  AI Key & Beat Scanner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Musik hochladen (Lokal / GDrive), Tonart & BPM scannen, in andere Tonarten pitchen & als WAV/FLAC speichern.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-4 pt-2 gap-2 overflow-x-auto bg-slate-950/60">
          {[
            { id: 'upload', label: '📁 1. Import (Lokal / GDrive)', disabled: false },
            { id: 'tune', label: '🎛️ 2. Key-Tuning & Pitch', disabled: !analysisResult },
            { id: 'pads', label: '🥁 3. Drum-Pad Slicer & Kits', disabled: !analysisResult },
            { id: 'export', label: '💾 4. Export (WAV / FLAC / MP3)', disabled: !analysisResult },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              disabled={tab.disabled}
              className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-slate-850 shadow-inner'
                  : tab.disabled
                  ? 'border-transparent text-slate-600 cursor-not-allowed'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Status / Loading Overlay */}
        {isAnalyzing && (
          <div className="p-3 bg-cyan-950/80 border-b border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{analysisProgress || 'Verarbeite Audio...'}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/80 border-b border-red-500/40 text-red-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TAB BODY CONTENTS                                                      */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: UPLOAD & IMPORT */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Local Drag & Drop Area */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-950/50 hover:bg-slate-950/80 transition cursor-pointer group"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*,.wav,.mp3,.flac,.ogg,.m4a,.aac';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload(file);
                    };
                    input.click();
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Lokale Musikdatei hochladen</h4>
                  <p className="text-xs text-slate-400 mb-3 max-w-xs">
                    Ziehe <strong>.WAV, .MP3, .FLAC, .OGG</strong> oder <strong>.M4A</strong> hierher oder klicke zum Auswählen
                  </p>
                  <span className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/30">
                    Datei Auswählen 📂
                  </span>
                </div>

                {/* 2. Google Drive / Cloud URL Import */}
                <div className="border border-slate-800 rounded-2xl p-5 flex flex-col justify-between bg-slate-950/60">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span>Google Drive & Cloud Audio Import</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Füge einen Google Drive Freigabelink oder eine direkte Audio-URL ein. Die KI scannt Beats & Tonart automatisch.
                    </p>
                    <input
                      type="text"
                      placeholder="https://drive.google.com/file/d/... oder Audio URL"
                      value={gdriveUrl}
                      onChange={(e) => setGdriveUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <button
                    onClick={handleUrlImport}
                    disabled={!gdriveUrl.trim() || isAnalyzing}
                    className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    Google Drive Audio Scannen 🔍
                  </button>
                </div>
              </div>

              {/* Already Analyzed Current Audio Badge */}
              {analysisResult && (
                <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{currentTrackTitle}</h4>
                      <p className="text-xs text-slate-400">
                        {analysisResult.bpm} BPM • Tonart: {analysisResult.key} ({analysisResult.camelotKey}) • {analysisResult.duration.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('tune')}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Weiter zum Key-Tuning ➔
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KEY TUNING & PITCH SHIFTER */}
          {activeTab === 'tune' && analysisResult && (
            <div className="space-y-4">
              {/* Scan Results Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Original Tonart</span>
                  <span className="text-sm font-bold text-white">{analysisResult.key}</span>
                  <span className="text-[10px] text-cyan-400 font-mono block">Camelot: {analysisResult.camelotKey}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 uppercase font-mono block">Gepitchte Tonart</span>
                  <span className="text-sm font-bold text-amber-300">{tunedKeyInfo.key}</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold block">Camelot: {tunedKeyInfo.camelot}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tempo (Beats)</span>
                  <span className="text-sm font-bold text-white">{analysisResult.bpm} BPM</span>
                  <span className="text-[10px] text-slate-400 block">{analysisResult.duration.toFixed(1)}s Dauer</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Energie Score</span>
                  <span className="text-sm font-bold text-pink-400">{analysisResult.energy}%</span>
                  <span className="text-[10px] text-slate-400 block">44.1 kHz PCM</span>
                </div>
              </div>

              {/* SEMITONES PITCH REGULATOR */}
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Tonart Transposition (Pitch Shift)</h4>
                      <p className="text-xs text-slate-400">Verändere die Tonhöhe stufenlos in Halbtönen (-12 bis +12)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPitchSemitones(0)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono"
                      title="Auf Originalhöhe zurücksetzen"
                    >
                      Reset (±0)
                    </button>
                    <span className="text-lg font-black font-mono px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} Halbtöne
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={pitchSemitones}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setPitchSemitones(val);
                    if (isPreviewPlaying) {
                      stopPreview();
                    }
                  }}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                {/* Semitone Step Marks */}
                <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
                  <span>-12 (Oktave tief)</span>
                  <span>-7 (Quinte tief)</span>
                  <span>±0 (Original)</span>
                  <span>+7 (Quinte hoch)</span>
                  <span>+12 (Oktave hoch)</span>
                </div>

                {/* Quick Harmonic Match with Decks */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-400">Harmonischer Quick-Match:</span>
                  <button
                    onClick={() => matchPitchToDeck('A')}
                    disabled={!deckA.track}
                    className="px-2.5 py-1 bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-lg text-xs font-bold transition"
                  >
                    🎵 An Deck A anpassen ({deckA.track?.intelligence?.camelotKey || '4A'})
                  </button>
                  <button
                    onClick={() => matchPitchToDeck('B')}
                    disabled={!deckB.track}
                    className="px-2.5 py-1 bg-purple-950/60 border border-purple-500/30 hover:border-purple-400 text-purple-300 rounded-lg text-xs font-bold transition"
                  >
                    🎵 An Deck B anpassen ({deckB.track?.intelligence?.camelotKey || '5A'})
                  </button>
                </div>
              </div>

              {/* LIVE AUDIO PREVIEW PLAYER */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={togglePreview}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-slate-950 shadow-lg transition ${
                      isPreviewPlaying
                        ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/30 animate-pulse'
                        : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
                    }`}
                  >
                    {isPreviewPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <div>
                    <h5 className="text-xs font-bold text-white">Live Vorhören mit Pitch-Shift</h5>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Position: {previewCurrentTime.toFixed(1)}s / {analysisResult.duration.toFixed(1)}s
                    </p>
                  </div>
                </div>

                {/* Load Directly to DJ Deck Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => loadIntoDJEngine('A')}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1"
                  >
                    <span>▶ Auf Deck A</span>
                  </button>
                  <button
                    onClick={() => loadIntoDJEngine('B')}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1"
                  >
                    <span>▶ Auf Deck B</span>
                  </button>
                  <button
                    onClick={() => loadIntoDJEngine('stem')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1"
                  >
                    <span>🎤 Stem Layer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DRUM PAD SLICER & SAMPLE KITS */}
          {activeTab === 'pads' && analysisResult && (
            <div className="space-y-4">
              {/* Slicer Controls */}
              <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-purple-400" />
                    <h4 className="text-sm font-bold text-white">Song-Clip in Drum-Pads schneiden</h4>
                  </div>
                  <span className="text-xs font-mono text-purple-300">
                    Start: {sliceStartSec.toFixed(1)}s • Länge: {sliceDurationSec.toFixed(1)}s
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Start Slider */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Start-Position im Song:</label>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(1, analysisResult.duration - 1)}
                      step="0.5"
                      value={sliceStartSec}
                      onChange={(e) => setSliceStartSec(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                  </div>

                  {/* Duration Slider */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Clip-Dauer:</label>
                    <div className="flex items-center gap-2">
                      {[1.0, 2.0, 4.0, 8.0].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => setSliceDurationSec(dur)}
                          className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                            sliceDurationSec === dur
                              ? 'bg-purple-500 text-white border-purple-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {dur}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Target Pad Selector & Slice Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Ziel-Pad:</span>
                    <select
                      value={targetPadId}
                      onChange={(e) => setTargetPadId(parseInt(e.target.value))}
                      className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                    >
                      {drumPadClips.map((p) => (
                        <option key={p.id} value={p.id}>
                          Pad {p.id + 1} ({p.label})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => sliceToDrumPad(targetPadId)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Auf Pad {targetPadId + 1} Schneiden ✂️</span>
                  </button>
                </div>
              </div>

              {/* 8 DRUM PADS INTERACTIVE GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {drumPadClips.map((pad) => (
                  <div
                    key={pad.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between gap-2 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                        {pad.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {pad.startSec.toFixed(1)}s
                      </span>
                    </div>

                    <button
                      onClick={() => playPadClip(pad)}
                      className={`w-full py-4 rounded-xl bg-gradient-to-br ${pad.color} text-slate-950 font-black text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>PAD {pad.id + 1}</span>
                    </button>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>Dauer: {pad.durationSec}s</span>
                      <button
                        onClick={() => sliceToDrumPad(pad.id)}
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        Hier ersetzen
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SAVE / LOAD DRUM KITS */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newKitName}
                    onChange={(e) => setNewKitName(e.target.value)}
                    placeholder="Kit Name (z.B. Vocal Chops Kit)"
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 flex-1 sm:w-56"
                  />
                  <button
                    onClick={saveDrumKit}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Kit Speichern 💾</span>
                  </button>
                </div>

                {savedKits.length > 0 && (
                  <span className="text-xs text-slate-400">
                    {savedKits.length} gespeicherte(s) Kit(s) in Browser-Speicher
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT AS WAV / FLAC / MP3 */}
          {activeTab === 'export' && analysisResult && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Download className="w-5 h-5" />
                  <span>Gepitchten Song herunterladen (WAV / FLAC / MP3)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Dein Song wird in voller Studioqualität mit der transponierten Tonart (<strong>{tunedKeyInfo.key} / {tunedKeyInfo.camelot}</strong>, {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} Halbtöne) gerendert.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => handleExportTunedWav('wav')}
                    disabled={isAnalyzing}
                    className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    <span>Als WAV herunterladen (Studio)</span>
                    <span className="text-[10px] font-normal opacity-85">16-Bit 44.1 kHz PCM</span>
                  </button>

                  <button
                    onClick={() => handleExportTunedWav('flac')}
                    disabled={isAnalyzing}
                    className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 transition active:scale-95"
                  >
                    <Download className="w-5 h-5 text-cyan-400" />
                    <span>Als FLAC herunterladen</span>
                    <span className="text-[10px] font-normal text-slate-400">Verlustfrei komprimiert</span>
                  </button>

                  <button
                    onClick={() => handleExportTunedWav('mp3')}
                    disabled={isAnalyzing}
                    className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 transition active:scale-95"
                  >
                    <Download className="w-5 h-5 text-amber-400" />
                    <span>Als MP3 herunterladen</span>
                    <span className="text-[10px] font-normal text-slate-400">Kompaktes Audio</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {analysisResult ? `Aktiver Track: ${currentTrackTitle} (${tunedKeyInfo.camelot})` : 'Kein Track geladen'}
          </span>
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
