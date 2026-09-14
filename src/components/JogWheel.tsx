import React, { useEffect, useRef, useState } from 'react';
import { DeckId } from '../types';

interface JogWheelProps {
  id?: string;
  deckId: DeckId;
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  color?: string;
  onScratch?: (delta: number) => void;
  onNudge?: (delta: number) => void;
  onOpenTrackSelector?: () => void;
}

export const JogWheel: React.FC<JogWheelProps> = ({
  id,
  deckId,
  isPlaying,
  currentTime,
  bpm,
  color = '#06b6d4',
  onScratch,
  onNudge,
  onOpenTrackSelector,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [manualRotation, setManualRotation] = useState(0);
  const lastAngleRef = useRef(0);

  // Turntable 33 1/3 RPM rotation angle calculation based on currentTime
  const baseRotation = (currentTime * (bpm / 60) * 90) % 360;
  const currentAngle = isScratching ? manualRotation : baseRotation;

  const getAngleFromCenter = (clientX: number, clientY: number): number => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    return (rad * 180) / Math.PI;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    lastAngleRef.current = angle;
    setManualRotation(baseRotation);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsScratching(true);
    const touch = e.touches[0];
    const angle = getAngleFromCenter(touch.clientX, touch.clientY);
    lastAngleRef.current = angle;
    setManualRotation(baseRotation);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isScratching) return;
      const angle = getAngleFromCenter(e.clientX, e.clientY);
      let delta = angle - lastAngleRef.current;

      // Handle 360 wrap around
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      lastAngleRef.current = angle;
      setManualRotation((prev) => (prev + delta) % 360);

      if (onScratch) {
        onScratch(delta * 0.005);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScratching) return;
      const touch = e.touches[0];
      const angle = getAngleFromCenter(touch.clientX, touch.clientY);
      let delta = angle - lastAngleRef.current;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      lastAngleRef.current = angle;
      setManualRotation((prev) => (prev + delta) % 360);

      if (onScratch) {
        onScratch(delta * 0.005);
      }
    };

    const handleEnd = () => {
      setIsScratching(false);
    };

    if (isScratching) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isScratching, onScratch]);

  return (
    <div className="flex flex-col items-center justify-center select-none" id={id}>
      <div
        ref={wheelRef}
        className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center p-2.5 transition-shadow"
        style={{
          background: 'radial-gradient(circle, #262626 0%, #171717 60%, #0a0a0a 100%)',
          boxShadow: isPlaying
            ? `0 0 20px ${color}33, inset 0 2px 8px rgba(255,255,255,0.1), 0 8px 16px rgba(0,0,0,0.8)`
            : 'inset 0 2px 8px rgba(255,255,255,0.05), 0 8px 16px rgba(0,0,0,0.8)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Outer Beveled Platter Ring */}
        <div className="absolute inset-1 rounded-full border border-neutral-700/80 pointer-events-none" />
        <div className="absolute inset-2 rounded-full border border-neutral-800 pointer-events-none" />

        {/* Vinyl Grooves Texture */}
        <div
          className="absolute inset-4 rounded-full border border-neutral-850 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, transparent 20%, rgba(255,255,255,0.02) 21%, transparent 22%, rgba(255,255,255,0.02) 40%, transparent 41%, rgba(255,255,255,0.03) 60%, transparent 61%, rgba(255,255,255,0.02) 80%, transparent 81%)`,
          }}
        />

        {/* Outer Strobe Dots */}
        <div className="absolute inset-3 rounded-full overflow-hidden opacity-30 pointer-events-none">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 10}deg) translate(0, -${window.innerWidth > 640 ? 88 : 70}px)`,
              }}
            />
          ))}
        </div>

        {/* Rotating Center Disc */}
        <div
          className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-neutral-900 border-2 flex items-center justify-center shadow-xl"
          style={{
            borderColor: color,
            transform: `rotate(${currentAngle}deg)`,
            boxShadow: `inset 0 0 15px rgba(0,0,0,0.9), 0 0 10px ${color}44`,
          }}
        >
          {/* Glowing Position Pointer Notch */}
          <div
            className="absolute top-1.5 w-2 h-4 rounded-full shadow-lg"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />

          {/* Center Spindle & Deck Tag (Clickable for Track Select) */}
          <div
            onClick={(e) => {
              if (onOpenTrackSelector) {
                e.stopPropagation();
                onOpenTrackSelector();
              }
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center border border-neutral-700 bg-neutral-950 shadow-inner cursor-pointer hover:scale-105 active:scale-95 transition-transform group/hub"
            style={{
              borderTopColor: color,
            }}
            title="Klicken, um Song für dieses Deck auszuwählen oder zu importieren"
          >
            <span
              className="text-xs font-black tracking-widest group-hover/hub:scale-110 transition-transform"
              style={{ color }}
            >
              DECK {deckId}
            </span>
            <span className="text-[8px] font-mono text-neutral-400 group-hover/hub:text-cyan-300 font-bold uppercase">
              {isPlaying ? 'PLAY' : 'TRACK'}
            </span>
          </div>
        </div>
      </div>

      {/* Touch Pitch Nudge Buttons */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => onNudge && onNudge(-0.04)}
          className="px-2 py-0.5 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 active:bg-cyan-600 text-neutral-300 rounded border border-neutral-700 transition"
          title="Pitch Nudge Slow (-)"
        >
          NUDGE -
        </button>
        <span className="text-[9px] font-mono text-neutral-500 uppercase">Scratch / Touch</span>
        <button
          onClick={() => onNudge && onNudge(0.04)}
          className="px-2 py-0.5 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 active:bg-cyan-600 text-neutral-300 rounded border border-neutral-700 transition"
          title="Pitch Nudge Fast (+)"
        >
          NUDGE +
        </button>
      </div>
    </div>
  );
};
