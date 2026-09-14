/**
 * Sound Generator for BeatCraft Pro DJ
 * Generates high-fidelity demo tracks and drum/FX samples synthesized via Web Audio API.
 */

export function extractWaveformData(buffer: AudioBuffer, samplesCount: number = 200): number[] {
  const channelData = buffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samplesCount);
  const waveform: number[] = [];

  for (let i = 0; i < samplesCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    let peak = 0;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      sum += val;
      if (val > peak) peak = val;
    }
    // Combine average and peak for a nice punchy visual waveform
    const avg = sum / blockSize;
    const value = Math.min(1, peak * 0.7 + avg * 0.3);
    waveform.push(Number(value.toFixed(3)));
  }

  return waveform;
}

/**
 * Synthesizes a full multi-track electronic club demo track with intro, buildup, drop, and breakdown.
 */
export async function generateDemoTrack(
  ctx: AudioContext,
  options: {
    title: string;
    bpm: number;
    key: string;
    durationSec: number;
    genre: 'house' | 'synthwave' | 'techno' | 'dnb';
  }
): Promise<AudioBuffer> {
  const sampleRate = ctx.sampleRate || 44100;
  const { bpm, durationSec, genre } = options;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  const secondsPerBeat = 60 / bpm;
  const totalBeats = Math.floor(durationSec / secondsPerBeat);

  // Master compressor for punchy demo tracks
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 10;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.1;
  compressor.connect(offlineCtx.destination);

  // Master reverb send for depth
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(compressor);

  // Determine root frequency for notes
  const noteFreqs: Record<string, number> = {
    'C min': 130.81,
    'F min': 174.61,
    'G min': 196.0,
    'A min': 220.0,
    'D min': 146.83,
    'E min': 164.81,
  };
  const rootFreq = noteFreqs[options.key] || 130.81;

  // Render Kick, Snare/Clap, HiHats, Bassline, and Chords across the track
  for (let beat = 0; beat < totalBeats; beat++) {
    const time = beat * secondsPerBeat;
    if (time >= durationSec - 0.5) break;

    const bar = Math.floor(beat / 4);
    const beatInBar = beat % 4;
    const isBreakdown = (bar % 16 >= 8 && bar % 16 < 12) && bar > 4;

    // 1. KICK DRUM (Four on the floor for house/techno/synthwave, breakbeat for dnb)
    const isKickBeat =
      genre === 'dnb'
        ? beatInBar === 0 || (beatInBar === 2 && beat % 2 === 1) || (beat % 8 === 5)
        : !isBreakdown || bar % 16 === 11;

    if (isKickBeat) {
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.09);

      kickGain.gain.setValueAtTime(1.0, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);

      kickOsc.start(time);
      kickOsc.stop(time + 0.3);
    }

    // 2. SNARE / CLAP (on beats 2 and 4, or beat 3 for dnb)
    const isSnareBeat = genre === 'dnb' ? beatInBar === 2 : beatInBar === 1 || beatInBar === 3;
    if (isSnareBeat && (!isBreakdown || bar % 4 === 3)) {
      // Noise buffer for snare snap
      const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.18, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = offlineCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const snareFilter = offlineCtx.createBiquadFilter();
      snareFilter.type = 'highpass';
      snareFilter.frequency.value = 1000;

      const snareGain = offlineCtx.createGain();
      snareGain.gain.setValueAtTime(0.65, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      noiseSource.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(masterGain);

      noiseSource.start(time);
      noiseSource.stop(time + 0.18);
    }

    // 3. HI-HATS (Offbeat eighth notes & 16th shuffles)
    for (let sub = 0; sub < 4; sub++) {
      const subTime = time + (sub * secondsPerBeat) / 4;
      if (subTime >= durationSec) break;

      const isOffbeat = sub === 2;
      const isGhost = sub === 1 || sub === 3;

      if (isOffbeat || (isGhost && !isBreakdown && genre !== 'techno')) {
        const hatBuffer = offlineCtx.createBuffer(1, sampleRate * 0.05, sampleRate);
        const data = hatBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const hatSource = offlineCtx.createBufferSource();
        hatSource.buffer = hatBuffer;

        const hatFilter = offlineCtx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.value = 6500;

        const hatGain = offlineCtx.createGain();
        const hatVol = isOffbeat ? 0.35 : 0.12;
        hatGain.gain.setValueAtTime(hatVol, subTime);
        hatGain.gain.exponentialRampToValueAtTime(0.001, subTime + (isOffbeat ? 0.06 : 0.025));

        hatSource.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(masterGain);

        hatSource.start(subTime);
        hatSource.stop(subTime + 0.07);
      }
    }

    // 4. BASSLINE (Groovy rolling sub / saw bass)
    if (!isBreakdown) {
      const scaleOffsets = [0, 3, 5, 7, 10, 12, 15]; // minor scale semitones
      const noteIndex = (Math.floor(beat / 2) + (bar % 4)) % scaleOffsets.length;
      const noteMultiplier = Math.pow(2, (scaleOffsets[noteIndex] - 12) / 12);
      const bassFreq = (rootFreq * 0.5) * noteMultiplier;

      const bassOsc = offlineCtx.createOscillator();
      bassOsc.type = genre === 'synthwave' ? 'sawtooth' : 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, time);

      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(genre === 'techno' ? 280 : 450, time);
      bassFilter.frequency.exponentialRampToValueAtTime(150, time + secondsPerBeat * 0.8);
      bassFilter.Q.value = 4;

      const bassGain = offlineCtx.createGain();
      bassGain.gain.setValueAtTime(0.55, time);
      bassGain.gain.exponentialRampToValueAtTime(0.01, time + secondsPerBeat * 0.9);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(masterGain);

      bassOsc.start(time);
      bassOsc.stop(time + secondsPerBeat * 0.95);
    }

    // 5. SYNTH CHORD STABS / ARPS (Every 2 beats or syncopated)
    if (beat % 2 === 0 || isBreakdown) {
      const chords = [
        [0, 3, 7],    // Minor i
        [5, 8, 12],   // Minor iv
        [3, 7, 10],   // Major III
        [7, 10, 14],  // Minor v
      ];
      const chord = chords[bar % chords.length];

      chord.forEach((semi) => {
        const synthFreq = rootFreq * Math.pow(2, semi / 12);
        const synthOsc = offlineCtx.createOscillator();
        synthOsc.type = genre === 'synthwave' ? 'sawtooth' : 'sine';
        synthOsc.frequency.setValueAtTime(synthFreq, time);

        const synthFilter = offlineCtx.createBiquadFilter();
        synthFilter.type = 'lowpass';
        synthFilter.frequency.setValueAtTime(isBreakdown ? 1800 : 1200, time);
        synthFilter.frequency.exponentialRampToValueAtTime(400, time + secondsPerBeat * 1.5);

        const synthGain = offlineCtx.createGain();
        synthGain.gain.setValueAtTime(0.18, time);
        synthGain.gain.exponentialRampToValueAtTime(0.001, time + secondsPerBeat * 1.6);

        synthOsc.connect(synthFilter);
        synthFilter.connect(synthGain);
        synthGain.connect(masterGain);

        synthOsc.start(time);
        synthOsc.stop(time + secondsPerBeat * 1.7);
      });
    }
  }

  return await offlineCtx.startRendering();
}

/**
 * Synthesizes punchy drum and sound effect samples for the 8 Sampler pads.
 */
export async function generateSamplerSample(
  ctx: AudioContext,
  sampleIndex: number
): Promise<AudioBuffer> {
  const sampleRate = ctx.sampleRate || 44100;

  switch (sampleIndex) {
    // 0: Deep 808 Kick
    case 0: {
      const dur = 0.5;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      const osc = off.createOscillator();
      const gain = off.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, 0);
      osc.frequency.exponentialRampToValueAtTime(32, dur * 0.6);
      gain.gain.setValueAtTime(1.0, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, dur);
      osc.connect(gain);
      gain.connect(off.destination);
      osc.start(0);
      osc.stop(dur);
      return await off.startRendering();
    }

    // 1: Crisp Club Snare
    case 1: {
      const dur = 0.3;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      // Tone body
      const osc = off.createOscillator();
      const oscGain = off.createGain();
      osc.frequency.setValueAtTime(220, 0);
      osc.frequency.exponentialRampToValueAtTime(90, 0.08);
      oscGain.gain.setValueAtTime(0.7, 0);
      oscGain.gain.exponentialRampToValueAtTime(0.01, 0.1);
      osc.connect(oscGain);
      oscGain.connect(off.destination);
      osc.start(0);
      osc.stop(0.12);

      // Noise snap
      const noiseBuffer = off.createBuffer(1, sampleRate * dur, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = off.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = off.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;
      const noiseGain = off.createGain();
      noiseGain.gain.setValueAtTime(0.8, 0);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, dur);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(off.destination);
      noise.start(0);
      noise.stop(dur);
      return await off.startRendering();
    }

    // 2: Closed Hi-Hat
    case 2: {
      const dur = 0.08;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      const noiseBuffer = off.createBuffer(1, sampleRate * dur, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = off.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = off.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;
      const gain = off.createGain();
      gain.gain.setValueAtTime(0.9, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(off.destination);
      src.start(0);
      src.stop(dur);
      return await off.startRendering();
    }

    // 3: Open Hi-Hat
    case 3: {
      const dur = 0.45;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      const noiseBuffer = off.createBuffer(1, sampleRate * dur, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = off.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = off.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 8500;
      filter.Q.value = 2;
      const gain = off.createGain();
      gain.gain.setValueAtTime(0.85, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(off.destination);
      src.start(0);
      src.stop(dur);
      return await off.startRendering();
    }

    // 4: Reggae/DJ Airhorn Blast
    case 4: {
      const dur = 0.7;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      // Horn 3 tones
      const freqs = [370, 466, 554];
      freqs.forEach((freq) => {
        const osc = off.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, 0);
        osc.frequency.linearRampToValueAtTime(freq * 1.05, 0.1);
        osc.frequency.linearRampToValueAtTime(freq * 0.98, dur);

        const gain = off.createGain();
        gain.gain.setValueAtTime(0.3, 0);
        gain.gain.setValueAtTime(0.3, dur * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, dur);

        osc.connect(gain);
        gain.connect(off.destination);
        osc.start(0);
        osc.stop(dur);
      });
      return await off.startRendering();
    }

    // 5: Vinyl Scratch FX (Zzzhh-wick!)
    case 5: {
      const dur = 0.35;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      const osc = off.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, 0);
      osc.frequency.exponentialRampToValueAtTime(1400, 0.08);
      osc.frequency.exponentialRampToValueAtTime(300, 0.2);
      osc.frequency.exponentialRampToValueAtTime(900, dur);

      const filter = off.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, 0);
      filter.frequency.exponentialRampToValueAtTime(3000, 0.15);
      filter.Q.value = 5;

      const gain = off.createGain();
      gain.gain.setValueAtTime(0.8, 0);
      gain.gain.setValueAtTime(0.7, dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(off.destination);
      osc.start(0);
      osc.stop(dur);
      return await off.startRendering();
    }

    // 6: Sci-Fi Club Laser / Zap
    case 6: {
      const dur = 0.4;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      const osc = off.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, 0);
      osc.frequency.exponentialRampToValueAtTime(80, dur * 0.8);

      const gain = off.createGain();
      gain.gain.setValueAtTime(0.8, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, dur);

      osc.connect(gain);
      gain.connect(off.destination);
      osc.start(0);
      osc.stop(dur);
      return await off.startRendering();
    }

    // 7: Vox "Drop the Beat" Synth Formant
    case 7:
    default: {
      const dur = 0.55;
      const off = new OfflineAudioContext(1, sampleRate * dur, sampleRate);
      const osc = off.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(240, 0);
      osc.frequency.linearRampToValueAtTime(180, 0.2);
      osc.frequency.linearRampToValueAtTime(110, dur);

      const filter = off.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, 0);
      filter.frequency.linearRampToValueAtTime(1400, 0.2);
      filter.frequency.linearRampToValueAtTime(600, dur);
      filter.Q.value = 6;

      const gain = off.createGain();
      gain.gain.setValueAtTime(0.9, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(off.destination);
      osc.start(0);
      osc.stop(dur);
      return await off.startRendering();
    }
  }
}
