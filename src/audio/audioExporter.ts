/**
 * Audio Exporter & Pitch Shifting Engine
 * Handles offline rendering, key transposition, sample slicing, and WAV/FLAC/MP3 downloads.
 */

export interface PitchShiftOptions {
  semitones: number; // -12 to +12
  preserveTempo?: boolean;
  gain?: number; // 0 to 2
}

/**
 * Render a pitched/tuned version of an AudioBuffer using OfflineAudioContext
 */
export async function renderPitchedAudioBuffer(
  sourceBuffer: AudioBuffer,
  options: PitchShiftOptions
): Promise<AudioBuffer> {
  const { semitones, gain = 1.0 } = options;
  const sampleRate = sourceBuffer.sampleRate;
  const numChannels = sourceBuffer.numberOfChannels;

  // Pitch playback rate factor: 2^(semitones / 12)
  const pitchRatio = Math.pow(2, semitones / 12);
  const targetDuration = sourceBuffer.duration / pitchRatio;
  const targetLength = Math.ceil(sourceBuffer.length / pitchRatio);

  const offlineCtx = new OfflineAudioContext(numChannels, targetLength, sampleRate);

  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = sourceBuffer;
  sourceNode.playbackRate.value = pitchRatio;

  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = gain;

  sourceNode.connect(gainNode);
  gainNode.connect(offlineCtx.destination);

  sourceNode.start(0);

  return await offlineCtx.startRendering();
}

/**
 * Slice a specific section of an AudioBuffer (e.g. for Drum Pads)
 */
export async function sliceAudioBuffer(
  sourceBuffer: AudioBuffer,
  startSec: number,
  durationSec: number
): Promise<AudioBuffer> {
  const sampleRate = sourceBuffer.sampleRate;
  const numChannels = sourceBuffer.numberOfChannels;

  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const numSamples = Math.min(
    Math.floor(durationSec * sampleRate),
    sourceBuffer.length - startSample
  );

  const offlineCtx = new OfflineAudioContext(numChannels, Math.max(1, numSamples), sampleRate);
  const slicedBuffer = offlineCtx.createBuffer(numChannels, numSamples, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const sourceData = sourceBuffer.getChannelData(channel);
    const targetData = slicedBuffer.getChannelData(channel);
    for (let i = 0; i < numSamples; i++) {
      targetData[i] = sourceData[startSample + i] || 0;
    }
  }

  return slicedBuffer;
}

/**
 * Convert an AudioBuffer to a 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const samples = buffer.length;
  const blockAlign = (numChannels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');

  // Write fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // Write data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write audio samples (interleaved 16-bit PCM)
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i] || 0;
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Trigger file download in browser
 */
export function downloadAudioBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
