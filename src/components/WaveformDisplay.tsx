import React, { useEffect, useRef } from 'react';
import { HotCue, Track } from '../types';

interface WaveformDisplayProps {
  id?: string;
  track: Track | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  color?: string;
  hotCues?: (HotCue | null)[];
  loopStart?: number;
  loopEnd?: number;
  isLooping?: boolean;
  onSeek: (time: number) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  id,
  track,
  currentTime,
  duration,
  isPlaying,
  color = '#06b6d4',
  hotCues = [],
  loopStart = 0,
  loopEnd = 0,
  isLooping = false,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !duration || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Center grid line
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    if (!track) {
      // Empty state placeholder wave
      ctx.fillStyle = '#404040';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO TRACK LOADED', width / 2, centerY + 4);
      return;
    }

    const waveform = track.waveformData || [];
    const totalBars = waveform.length || 100;
    const barWidth = width / totalBars;
    const currentProgress = duration > 0 ? currentTime / duration : 0;
    const currentX = currentProgress * width;

    // 1. Draw Loop Region Background
    if (isLooping && loopEnd > loopStart && duration > 0) {
      const loopStartX = (loopStart / duration) * width;
      const loopEndX = (loopEnd / duration) * width;
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, height);

      // Loop boundaries
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(loopStartX, 0, loopEndX - loopStartX, height);
    }

    // 2. Draw Beatgrid Lines
    if (track.bpm && duration > 0) {
      const secondsPerBeat = 60 / track.bpm;
      const totalBeats = Math.floor(duration / secondsPerBeat);
      for (let b = 0; b < totalBeats; b++) {
        const beatTime = b * secondsPerBeat;
        const beatX = (beatTime / duration) * width;
        const isBar = b % 4 === 0;

        ctx.strokeStyle = isBar ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = isBar ? 1.2 : 0.6;
        ctx.beginPath();
        ctx.moveTo(beatX, isBar ? 0 : height * 0.2);
        ctx.lineTo(beatX, isBar ? height : height * 0.8);
        ctx.stroke();
      }
    }

    // 3. Draw Waveform Peaks
    for (let i = 0; i < totalBars; i++) {
      const peak = waveform[i] || 0.2;
      const barX = i * barWidth;
      const barH = Math.max(3, peak * (height * 0.85));

      const isPlayed = barX <= currentX;

      // Dynamic color gradient (played vs unplayed)
      if (isPlayed) {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = '#525252';
      }

      // Symmetrical mirror waveform
      ctx.fillRect(barX, centerY - barH / 2, Math.max(1.5, barWidth - 1), barH);
    }

    // 4. Draw Hot Cues Flags
    hotCues.forEach((cue, index) => {
      if (!cue || duration <= 0) return;
      const cueX = (cue.position / duration) * width;

      // Flag pole
      ctx.strokeStyle = cue.color || '#eab308';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cueX, 0);
      ctx.lineTo(cueX, height);
      ctx.stroke();

      // Flag head
      ctx.fillStyle = cue.color || '#eab308';
      ctx.beginPath();
      ctx.moveTo(cueX, 0);
      ctx.lineTo(cueX + 12, 0);
      ctx.lineTo(cueX + 8, 8);
      ctx.lineTo(cueX + 12, 16);
      ctx.lineTo(cueX, 16);
      ctx.fill();

      // Cue number text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${index + 1}`, cueX + 3, 11);
    });

    // 5. Draw Playhead Needle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Playhead arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(currentX - 5, 0);
    ctx.lineTo(currentX + 5, 0);
    ctx.lineTo(currentX, 7);
    ctx.fill();
  }, [track, currentTime, duration, isPlaying, color, hotCues, loopStart, loopEnd, isLooping]);

  return (
    <div className="relative w-full overflow-hidden rounded border border-neutral-800 bg-neutral-950 select-none group" id={id}>
      <canvas
        ref={canvasRef}
        width={600}
        height={72}
        className="w-full h-16 md:h-18 cursor-crosshair block"
        onClick={handleClick}
      />
      {/* Time display overlay */}
      <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] font-mono font-bold text-neutral-300 bg-neutral-900/80 px-1.5 py-0.5 rounded border border-neutral-800">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
