import React from 'react';

interface VUMeterProps {
  id?: string;
  level: number; // 0.0 to 1.0+
  segments?: number;
  orientation?: 'vertical' | 'horizontal';
  height?: number | string;
  width?: number | string;
}

export const VUMeter: React.FC<VUMeterProps> = ({
  id,
  level,
  segments = 14,
  orientation = 'vertical',
  height = 120,
  width = 8,
}) => {
  const activeSegments = Math.round(Math.min(1.2, level) * segments);

  return (
    <div
      id={id}
      className={`flex ${
        orientation === 'vertical' ? 'flex-col-reverse justify-between' : 'flex-row'
      } bg-neutral-950 p-0.5 rounded border border-neutral-800 shadow-inner overflow-hidden`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        gap: '2px',
      }}
    >
      {Array.from({ length: segments }).map((_, i) => {
        const isActive = i < activeSegments;
        const ratio = i / segments;

        // Color mapping: Green -> Yellow -> Orange -> Red (Peak)
        let colorClass = 'bg-emerald-500';
        let offColorClass = 'bg-emerald-950/40';

        if (ratio >= 0.85) {
          colorClass = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]';
          offColorClass = 'bg-red-950/40';
        } else if (ratio >= 0.7) {
          colorClass = 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]';
          offColorClass = 'bg-amber-950/40';
        } else if (ratio >= 0.45) {
          colorClass = 'bg-lime-400 shadow-[0_0_3px_rgba(163,230,53,0.5)]';
          offColorClass = 'bg-lime-950/40';
        } else {
          colorClass = 'bg-emerald-400 shadow-[0_0_2px_rgba(52,211,153,0.4)]';
          offColorClass = 'bg-emerald-950/40';
        }

        return (
          <div
            key={i}
            className={`flex-1 rounded-[1px] transition-colors duration-75 ${
              isActive ? colorClass : offColorClass
            }`}
          />
        );
      })}
    </div>
  );
};
