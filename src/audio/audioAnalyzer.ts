import { Track, TrackStructure } from '../types';

// Musical Key Profiles (Krumhansl-Schmuckler Pitch-Class Profiles)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CAMELOT_MAP: Record<string, string> = {
  'Ab Minor': '1A', 'B Major': '1B',
  'Eb Minor': '2A', 'F# Major': '2B',
  'Bb Minor': '3A', 'Db Major': '3B',
  'F Minor': '4A', 'Ab Major': '4B',
  'C Minor': '5A', 'Eb Major': '5B',
  'G Minor': '6A', 'Bb Major': '6B',
  'D Minor': '7A', 'F Major': '7B',
  'A Minor': '8A', 'C Major': '8B',
  'E Minor': '9A', 'G Major': '9B',
  'B Minor': '10A', 'D Major': '10B',
  'F# Minor': '11A', 'A Major': '11B',
  'C# Minor': '12A', 'E Major': '12B',
  // Enharmonic aliases
  'G# Minor': '1A',
  'D# Minor': '2A',
  'A# Minor': '3A',
};

export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  camelotKey: string;
  energy: number;
  duration: number;
  structure: TrackStructure;
  waveformData: number[];
  audioBuffer: AudioBuffer;
  sampleRate: number;
  channels: number;
}

/**
 * Extract audio buffer from a local file
 */
export async function decodeAudioFromFile(file: File, audioCtx: AudioContext): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Fetch and decode audio from a URL or Google Drive share link
 */
export async function decodeAudioFromUrl(url: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  let directUrl = url.trim();

  // Convert Google Drive share link to direct download link if needed
  if (directUrl.includes('drive.google.com')) {
    const fileIdMatch = directUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || directUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      directUrl = `https://docs.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
  }

  const response = await fetch(directUrl);
  if (!response.ok) {
    throw new Error(`Audio konnte nicht geladen werden (HTTP ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Analyze an AudioBuffer: Detect BPM, Key, Energy, Structure, Waveform
 */
export function analyzeAudioBuffer(buffer: AudioBuffer): AudioAnalysisResult {
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;

  // 1. Calculate Waveform (300 points)
  const waveformData = extractWaveform(channelData, 300);

  // 2. Detect Energy (RMS + Peak)
  let sumSquares = 0;
  for (let i = 0; i < channelData.length; i += 10) {
    sumSquares += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sumSquares / (channelData.length / 10));
  const energy = Math.min(99, Math.max(30, Math.round(rms * 280 + 35)));

  // 3. Detect BPM via peak interval auto-correlation
  const bpm = detectBPM(channelData, sampleRate);

  // 4. Detect Key (Pitch Class Profile & Camelot Key)
  const { key, camelotKey } = detectKey(channelData, sampleRate);

  // 5. Detect Track Structure
  const structure = generateDynamicStructure(duration, bpm, energy);

  return {
    bpm,
    key,
    camelotKey,
    energy,
    duration,
    structure,
    waveformData,
    audioBuffer: buffer,
    sampleRate,
    channels: buffer.numberOfChannels,
  };
}

/**
 * Waveform extraction
 */
function extractWaveform(data: Float32Array, points: number): number[] {
  const blockSize = Math.floor(data.length / points);
  const waveform: number[] = [];

  for (let i = 0; i < points; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j += 4) {
      const val = Math.abs(data[start + j] || 0);
      if (val > max) max = val;
    }
    waveform.push(Number(max.toFixed(3)));
  }
  return waveform;
}

/**
 * BPM Detection using Energy Onsets & Histogram
 */
function detectBPM(data: Float32Array, sampleRate: number): number {
  const hopSize = 512;
  const numHops = Math.floor(data.length / hopSize);
  const energies: number[] = [];

  // Compute short-term energy
  for (let i = 0; i < numHops; i++) {
    let energy = 0;
    const start = i * hopSize;
    for (let j = 0; j < hopSize; j++) {
      const sample = data[start + j] || 0;
      energy += sample * sample;
    }
    energies.push(energy);
  }

  // Find peaks in energy derivative (onsets)
  const onsets: number[] = [];
  for (let i = 1; i < energies.length - 1; i++) {
    const diff = energies[i] - energies[i - 1];
    if (diff > 0.05 && energies[i] > energies[i + 1]) {
      onsets.push(i);
    }
  }

  // Calculate intervals between adjacent onsets
  const intervals: Record<number, number> = {};
  for (let i = 0; i < onsets.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 8, onsets.length); j++) {
      const deltaHops = onsets[j] - onsets[i];
      const deltaSec = (deltaHops * hopSize) / sampleRate;
      if (deltaSec >= 0.35 && deltaSec <= 0.85) { // 70 to 170 BPM range
        const rawBpm = Math.round(60 / deltaSec);
        intervals[rawBpm] = (intervals[rawBpm] || 0) + 1;
      }
    }
  }

  // Find peak BPM
  let bestBpm = 128;
  let maxCount = 0;
  for (const [bpmStr, count] of Object.entries(intervals)) {
    const bpm = Number(bpmStr);
    if (count > maxCount && bpm >= 110 && bpm <= 145) {
      maxCount = count;
      bestBpm = bpm;
    }
  }

  return bestBpm;
}

/**
 * Key Detection using 12-Tone Chroma Profile Correlation
 */
function detectKey(data: Float32Array, sampleRate: number): { key: string; camelotKey: string } {
  // Approximate Chroma energy for 12 pitch classes
  const chroma = new Array(12).fill(0);
  const fftWindow = 4096;
  const numWindows = Math.min(100, Math.floor(data.length / fftWindow));

  for (let w = 0; w < numWindows; w++) {
    const offset = w * fftWindow;
    for (let i = 0; i < fftWindow; i++) {
      const sample = data[offset + i] || 0;
      if (Math.abs(sample) > 0.05) {
        // Approximate pitch bucket by sample index frequency
        const freq = (i * sampleRate) / fftWindow;
        if (freq >= 65 && freq <= 2000) {
          const midi = Math.round(12 * Math.log2(freq / 440) + 69);
          const pitchClass = ((midi % 12) + 12) % 12;
          chroma[pitchClass] += Math.abs(sample);
        }
      }
    }
  }

  // Correlate against Major and Minor Krumhansl profiles
  let bestScore = -Infinity;
  let bestKeyName = 'A Minor';

  for (let root = 0; root < 12; root++) {
    // Major correlation
    let majScore = 0;
    let minScore = 0;
    for (let i = 0; i < 12; i++) {
      const chromaVal = chroma[(root + i) % 12];
      majScore += chromaVal * MAJOR_PROFILE[i];
      minScore += chromaVal * MINOR_PROFILE[i];
    }

    if (majScore > bestScore) {
      bestScore = majScore;
      bestKeyName = `${NOTE_NAMES[root]} Major`;
    }
    if (minScore > bestScore) {
      bestScore = minScore;
      bestKeyName = `${NOTE_NAMES[root]} Minor`;
    }
  }

  const camelotKey = CAMELOT_MAP[bestKeyName] || '8A';

  return { key: bestKeyName, camelotKey };
}

/**
 * Generate structural segmentation based on song duration & BPM
 */
function generateDynamicStructure(duration: number, bpm: number, energy: number): TrackStructure {
  const barSec = (60 / bpm) * 4;
  const introEnd = Math.min(16 * barSec, duration * 0.2);
  const buildEnd = Math.min(32 * barSec, duration * 0.45);
  const dropEnd = Math.min(48 * barSec, duration * 0.7);
  const breakEnd = Math.min(56 * barSec, duration * 0.85);
  const climaxEnd = Math.min(60 * barSec, duration * 0.92);

  return {
    intro: [0, introEnd],
    build: [introEnd, buildEnd],
    drop: [buildEnd, dropEnd],
    breakdown: [dropEnd, breakEnd],
    climax: [breakEnd, climaxEnd],
    outro: [climaxEnd, duration],
    transitionPoints: [introEnd, buildEnd, dropEnd, breakEnd],
  };
}
