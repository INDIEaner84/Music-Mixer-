import React from 'react';
import { TransitionCurvePoint } from '../types';

interface TransitionCurveDiagramProps {
  curves: TransitionCurvePoint[];
  progress: number; // 0 to 1
  isActive: boolean;
  fromDeck?: 'A' | 'B';
  toDeck?: 'A' | 'B';
}

export const TransitionCurveDiagram: React.FC<TransitionCurveDiagramProps> = ({
  curves,
  progress,
  isActive,
  fromDeck = 'A',
  toDeck = 'B',
}) => {
  const width = 500;
  const height = 130;
  const padX = 35;
  const padY = 20;
  const graphW = width - padX * 2;
  const graphH = height - padY * 2;

  // Generate SVG path strings from curve points
  const getPoint = (pt: TransitionCurvePoint) => {
    const x = padX + pt.timeRatio * graphW;
    return {
      x,
      yA: padY + (1 - pt.deckAGain) * graphH,
      yB: padY + (1 - pt.deckBGain) * graphH,
      yLowA: padY + (1 - Math.max(0, (pt.deckALow + 24) / 30)) * graphH,
      yLowB: padY + (1 - Math.max(0, (pt.deckBLow + 24) / 30)) * graphH,
      yFx: padY + (1 - pt.fxIntensity) * graphH,
    };
  };

  const points = curves.map(getPoint);

  const pathA = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yA}`, '');
  const pathB = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yB}`, '');
  const pathLowA = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLowA}`,
    ''
  );
  const pathLowB = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLowB}`,
    ''
  );
  const pathFx = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yFx}`, '');

  const needleX = padX + progress * graphW;

  return (
    <div className="w-full bg-neutral-950 rounded-xl p-2.5 border border-neutral-800 shadow-inner flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono px-1">
        <span className="text-neutral-400 font-bold">DSP AUTOMATIONS-KURVEN (ZEITVERLAUF)</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Deck {fromDeck} Lautstärke
          </span>
          <span className="flex items-center gap-1 text-pink-400">
            <span className="w-2 h-0.5 bg-pink-400 inline-block" /> Deck {toDeck} Lautstärke
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-0.5 border-b border-amber-400 border-dashed inline-block" /> Bass EQ
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2 h-0.5 bg-purple-400 inline-block" /> FX / Filter
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-28 md:h-32 select-none overflow-visible"
        >
          {/* Background Grid Lines */}
          <rect x={padX} y={padY} width={graphW} height={graphH} fill="#0d0d0d" rx={6} />

          {/* Horizontal grid lines */}
          <line
            x1={padX}
            y1={padY + graphH * 0.25}
            x2={padX + graphW}
            y2={padY + graphH * 0.25}
            stroke="#1e1e1e"
            strokeDasharray="2 2"
          />
          <line
            x1={padX}
            y1={padY + graphH * 0.5}
            x2={padX + graphW}
            y2={padY + graphH * 0.5}
            stroke="#262626"
          />
          <line
            x1={padX}
            y1={padY + graphH * 0.75}
            x2={padX + graphW}
            y2={padY + graphH * 0.75}
            stroke="#1e1e1e"
            strokeDasharray="2 2"
          />

          {/* Vertical Quarter Beat Markers */}
          <line
            x1={padX + graphW * 0.25}
            y1={padY}
            x2={padX + graphW * 0.25}
            y2={padY + graphH}
            stroke="#1e1e1e"
            strokeDasharray="2 2"
          />
          <line
            x1={padX + graphW * 0.5}
            y1={padY}
            x2={padX + graphW * 0.5}
            y2={padY + graphH}
            stroke="#2e2e2e"
          />
          <line
            x1={padX + graphW * 0.75}
            y1={padY}
            x2={padX + graphW * 0.75}
            y2={padY + graphH}
            stroke="#1e1e1e"
            strokeDasharray="2 2"
          />

          {/* Curves */}
          {/* FX / Filter Curve */}
          <path d={pathFx} fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />

          {/* Bass Curves */}
          <path
            d={pathLowA}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity="0.75"
          />
          <path
            d={pathLowB}
            fill="none"
            stroke="#eab308"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity="0.75"
          />

          {/* Deck A Volume */}
          <path
            d={pathA}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_3px_rgba(6,182,212,0.6)]"
          />

          {/* Deck B Volume */}
          <path
            d={pathB}
            fill="none"
            stroke="#ec4899"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_3px_rgba(236,72,153,0.6)]"
          />

          {/* Real-time Transition Needle Indicator */}
          {isActive && (
            <g>
              <line
                x1={needleX}
                y1={padY - 4}
                x2={needleX}
                y2={padY + graphH + 4}
                stroke="#ffffff"
                strokeWidth="2"
                className="filter drop-shadow-[0_0_6px_#ffffff]"
              />
              <circle
                cx={needleX}
                cy={padY + graphH * 0.5}
                r="4"
                fill="#ffffff"
                className="animate-ping"
              />
            </g>
          )}

          {/* Axis Labels */}
          <text x={padX} y={padY - 6} fill="#737373" fontSize="8" fontFamily="monospace">
            START (0%)
          </text>
          <text
            x={padX + graphW * 0.5}
            y={padY - 6}
            fill="#737373"
            fontSize="8"
            textAnchor="middle"
            fontFamily="monospace"
          >
            DROP / MITTE (50%)
          </text>
          <text
            x={padX + graphW}
            y={padY - 6}
            fill="#737373"
            fontSize="8"
            textAnchor="end"
            fontFamily="monospace"
          >
            ZIEL (100%)
          </text>

          <text x={padX - 4} y={padY + 8} fill="#737373" fontSize="7" textAnchor="end" fontFamily="monospace">
            100%
          </text>
          <text x={padX - 4} y={padY + graphH} fill="#737373" fontSize="7" textAnchor="end" fontFamily="monospace">
            0%
          </text>
        </svg>
      </div>
    </div>
  );
};
