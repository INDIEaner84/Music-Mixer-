import React, { useEffect, useRef, useState } from 'react';

interface KnobProps {
  id?: string;
  value: number; // e.g. -24 to +6 or 0 to 100 or -100 to 100
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  centerDetent?: boolean;
  onChange: (value: number) => void;
  onDoubleClick?: () => void;
}

export const Knob: React.FC<KnobProps> = ({
  id,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  label,
  unit = '',
  size = 'md',
  color = '#06b6d4',
  centerDetent = false,
  onChange,
  onDoubleClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(value);

  // Map value to angle (-135 deg to +135 deg -> 270 deg total range)
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -135 + normalized * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startValRef.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = 0.005;
      let newVal = startValRef.current + deltaY * range * sensitivity;

      if (centerDetent && Math.abs(newVal - defaultValue) < range * 0.03) {
        newVal = defaultValue;
      }

      newVal = Math.max(min, Math.min(max, newVal));
      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      onChange(Number(newVal.toFixed(2)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.touches[0].clientY;
      const range = max - min;
      const sensitivity = 0.005;
      let newVal = startValRef.current + deltaY * range * sensitivity;

      if (centerDetent && Math.abs(newVal - defaultValue) < range * 0.03) {
        newVal = defaultValue;
      }

      newVal = Math.max(min, Math.min(max, newVal));
      onChange(Number(newVal.toFixed(2)));
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
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
  }, [centerDetent, defaultValue, isDragging, max, min, onChange, step]);

  const handleReset = () => {
    if (onDoubleClick) {
      onDoubleClick();
    } else {
      onChange(defaultValue);
    }
  };

  const sizePx = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;

  return (
    <div className="flex flex-col items-center select-none" id={id}>
      <div
        className="relative cursor-ns-resize flex items-center justify-center group"
        style={{ width: sizePx, height: sizePx }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleReset}
        title={`${label}: ${value}${unit} (Double click to reset)`}
      >
        {/* Outer dial background */}
        <div
          className="absolute inset-0 rounded-full bg-neutral-900 border border-neutral-700 shadow-inner group-hover:border-neutral-500 transition-colors"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.05)',
          }}
        />

        {/* Center detent marker */}
        {centerDetent && (
          <div className="absolute top-0.5 w-1 h-1 rounded-full bg-neutral-500" />
        )}

        {/* Rotary Cap with rotation */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-neutral-700 to-neutral-850 flex items-center justify-center border border-neutral-600 shadow-md"
          style={{
            width: sizePx - 8,
            height: sizePx - 8,
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Indicator Notch */}
          <div
            className="absolute top-1 w-1 rounded-full shadow-sm"
            style={{
              height: sizePx * 0.28,
              backgroundColor: isDragging ? '#ffffff' : color,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        </div>
      </div>

      {/* Label and Value */}
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1 truncate max-w-[56px] text-center">
        {label}
      </span>
      <span className="text-[10px] font-mono text-neutral-300 font-medium">
        {value > 0 && unit === 'dB' ? `+${value}` : value}
        {unit}
      </span>
    </div>
  );
};
