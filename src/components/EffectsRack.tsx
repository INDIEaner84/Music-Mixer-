import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Power,
  Volume2,
  Layers,
  Flame,
  Activity,
  Waves,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { EffectSetting, EffectType } from '../types';
import { Knob } from './Knob';

export const EffectsRack: React.FC = () => {
  const { effects, updateEffect, toggleEffect } = useDJ();
  const [selectedEffectId, setSelectedEffectId] = useState<EffectType>('echo');

  const selectedEffect = effects.find((fx) => fx.id === selectedEffectId) || effects[0];

  return (
    <div
      id="live-effects-rack"
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-100 flex items-center gap-2">
              STUDIO FX PROCESSOR (12 EFFECTS)
              <span className="text-[10px] font-mono font-normal text-pink-400 bg-pink-950/60 px-1.5 py-0.2 rounded border border-pink-800">
                REAL-TIME DSP
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Live modulation, time delays, spectral filters, and distortion with wet/dry controls
            </p>
          </div>
        </div>

        {/* Global FX Stats */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-400">
            ACTIVE FX:{' '}
            <span className="text-pink-400 font-bold">
              {effects.filter((f) => f.enabled).length} / {effects.length}
            </span>
          </span>
        </div>
      </div>

      {/* Main Effects Area: Selector Tabs + Parameter Controls */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left 4 Cols: 12 Effect Preset Buttons */}
        <div className="col-span-12 md:col-span-7 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {effects.map((fx) => {
            const isSelected = selectedEffectId === fx.id;
            return (
              <div
                key={fx.id}
                id={`fx-btn-${fx.id}`}
                onClick={() => setSelectedEffectId(fx.id)}
                className={`p-2 rounded-lg border flex flex-col justify-between cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-neutral-800 border-pink-500/80 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-neutral-200 truncate">{fx.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEffect(fx.id);
                    }}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition ${
                      fx.enabled
                        ? 'bg-pink-500 text-neutral-950 shadow-[0_0_6px_rgba(236,72,153,0.8)]'
                        : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                    }`}
                    title="Toggle Effect ON / OFF"
                  >
                    <Power className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500">
                  <span className="uppercase">{fx.target}</span>
                  <span>{Math.round(fx.wet * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Cols: Selected Effect Live Modulation Knobs */}
        <div className="col-span-12 md:col-span-5 bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-pink-400">{selectedEffect.name}</span>
              <span className="text-[9px] font-mono uppercase bg-neutral-900 text-neutral-400 px-1 py-0.2 rounded border border-neutral-800">
                {selectedEffect.category}
              </span>
            </div>

            {/* Target Channel Assign */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-neutral-500">ROUTING:</span>
              <select
                value={selectedEffect.target}
                onChange={(e) =>
                  updateEffect(selectedEffect.id, {
                    target: e.target.value as 'A' | 'B' | 'MASTER',
                  })
                }
                className="bg-neutral-900 text-pink-400 font-mono text-[9px] font-bold rounded px-1 py-0.5 border border-neutral-700 outline-none"
              >
                <option value="A">DECK A</option>
                <option value="B">DECK B</option>
                <option value="MASTER">MASTER</option>
              </select>

              <button
                onClick={() => toggleEffect(selectedEffect.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                  selectedEffect.enabled
                    ? 'bg-pink-500 text-neutral-950 shadow-[0_0_8px_rgba(236,72,153,0.6)]'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                <Power className="w-3 h-3" />
                {selectedEffect.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Rotary Knobs for Selected Effect */}
          <div className="grid grid-cols-3 gap-2 py-2 items-center justify-center">
            {/* WET / DRY */}
            <Knob
              id="knob-fx-wet"
              value={Math.round(selectedEffect.wet * 100)}
              min={0}
              max={100}
              defaultValue={50}
              label="WET / DRY"
              unit="%"
              color="#ec4899"
              onChange={(val) => updateEffect(selectedEffect.id, { wet: val / 100 })}
            />

            {/* PARAM 1 */}
            <Knob
              id="knob-fx-param1"
              value={Math.round(selectedEffect.param1 * 100)}
              min={0}
              max={100}
              defaultValue={50}
              label={selectedEffect.param1Label}
              unit="%"
              color="#06b6d4"
              onChange={(val) => updateEffect(selectedEffect.id, { param1: val / 100 })}
            />

            {/* PARAM 2 */}
            <Knob
              id="knob-fx-param2"
              value={Math.round(selectedEffect.param2 * 100)}
              min={0}
              max={100}
              defaultValue={50}
              label={selectedEffect.param2Label}
              unit="%"
              color="#eab308"
              onChange={(val) => updateEffect(selectedEffect.id, { param2: val / 100 })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
