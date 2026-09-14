import React from 'react';
import {
  Headphones,
  Sliders,
  Flame,
  Volume2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useDJ } from '../context/DJContext';
import { CrossfaderCurve, DeckId } from '../types';
import { Knob } from './Knob';
import { VUMeter } from './VUMeter';

export const MixerPanel: React.FC = () => {
  const {
    deckA,
    deckB,
    crossfader,
    crossfaderCurve,
    vuLevels,
    setVolume,
    setGainTrim,
    setEQ,
    toggleEQKill,
    setFilter,
    setCrossfader,
    setCrossfaderCurve,
    togglePFL,
    triggerAutoTransition,
    transition,
  } = useDJ();

  const handleCrossfaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrossfader(parseFloat(e.target.value));
  };

  const handleSnapCenter = () => {
    setCrossfader(0);
  };

  return (
    <div
      id="central-mixer-panel"
      className="w-full lg:w-80 xl:w-96 flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-2xl relative"
      style={{
        boxShadow: '0 4px 25px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Top Mixer Brand Tag */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-black tracking-widest text-neutral-200">
            PRO MIXER 2-CH
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-neutral-500">CURVE:</span>
          <select
            value={crossfaderCurve}
            onChange={(e) => setCrossfaderCurve(e.target.value as CrossfaderCurve)}
            className="bg-neutral-950 text-cyan-400 font-mono text-[9px] font-bold rounded px-1.5 py-0.5 border border-neutral-800 outline-none"
          >
            <option value="smooth">SMOOTH</option>
            <option value="constant-power">CONST PWR</option>
            <option value="linear">LINEAR</option>
            <option value="sharp">SCRATCH/CUT</option>
          </select>
        </div>
      </div>

      {/* 2-Channel EQ & Filter Strips */}
      <div className="grid grid-cols-2 gap-3 pb-2 border-b border-neutral-800">
        {/* Channel 1 (Deck A) */}
        <div className="flex flex-col items-center gap-2 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
          <div className="flex items-center gap-1 w-full justify-between pb-1 border-b border-neutral-800">
            <span className="text-[10px] font-black text-cyan-400 tracking-wider">CH 1 [A]</span>
            <button
              onClick={() => togglePFL('A')}
              className={`p-1 rounded transition ${
                deckA.pfl ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Headphone Cue PFL"
            >
              <Headphones className="w-3 h-3" />
            </button>
          </div>

          {/* GAIN TRIM */}
          <Knob
            id="knob-gain-a"
            value={deckA.gain}
            min={0}
            max={2}
            step={0.01}
            defaultValue={1.0}
            label="TRIM"
            color="#06b6d4"
            size="sm"
            onChange={(val) => setGainTrim('A', val)}
          />

          {/* HIGH EQ */}
          <div className="flex flex-col items-center relative">
            <Knob
              id="knob-eq-high-a"
              value={deckA.high}
              min={-24}
              max={6}
              defaultValue={0}
              label="HIGH"
              unit="dB"
              color="#06b6d4"
              centerDetent
              onChange={(val) => setEQ('A', 'high', val)}
            />
            <button
              onClick={() => toggleEQKill('A', 'high')}
              className={`mt-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded border transition ${
                deckA.highKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {deckA.highKill ? 'KILL' : 'HI-K'}
            </button>
          </div>

          {/* MID EQ */}
          <div className="flex flex-col items-center relative">
            <Knob
              id="knob-eq-mid-a"
              value={deckA.mid}
              min={-24}
              max={6}
              defaultValue={0}
              label="MID"
              unit="dB"
              color="#06b6d4"
              centerDetent
              onChange={(val) => setEQ('A', 'mid', val)}
            />
            <button
              onClick={() => toggleEQKill('A', 'mid')}
              className={`mt-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded border transition ${
                deckA.midKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {deckA.midKill ? 'KILL' : 'MID-K'}
            </button>
          </div>

          {/* LOW EQ */}
          <div className="flex flex-col items-center relative">
            <Knob
              id="knob-eq-low-a"
              value={deckA.low}
              min={-24}
              max={6}
              defaultValue={0}
              label="LOW"
              unit="dB"
              color="#06b6d4"
              centerDetent
              onChange={(val) => setEQ('A', 'low', val)}
            />
            <button
              onClick={() => toggleEQKill('A', 'low')}
              className={`mt-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded border transition ${
                deckA.lowKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {deckA.lowKill ? 'KILL' : 'LOW-K'}
            </button>
          </div>

          {/* DUAL FILTER */}
          <div className="pt-1 border-t border-neutral-850 w-full flex justify-center">
            <Knob
              id="knob-filter-a"
              value={deckA.filter}
              min={-100}
              max={100}
              defaultValue={0}
              label="LPF / HPF"
              color="#eab308"
              centerDetent
              onChange={(val) => setFilter('A', val)}
            />
          </div>
        </div>

        {/* Channel 2 (Deck B) */}
        <div className="flex flex-col items-center gap-2 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
          <div className="flex items-center gap-1 w-full justify-between pb-1 border-b border-neutral-800">
            <span className="text-[10px] font-black text-pink-400 tracking-wider">CH 2 [B]</span>
            <button
              onClick={() => togglePFL('B')}
              className={`p-1 rounded transition ${
                deckB.pfl ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Headphone Cue PFL"
            >
              <Headphones className="w-3 h-3" />
            </button>
          </div>

          {/* GAIN TRIM */}
          <Knob
            id="knob-gain-b"
            value={deckB.gain}
            min={0}
            max={2}
            step={0.01}
            defaultValue={1.0}
            label="TRIM"
            color="#ec4899"
            size="sm"
            onChange={(val) => setGainTrim('B', val)}
          />

          {/* HIGH EQ */}
          <div className="flex flex-col items-center relative">
            <Knob
              id="knob-eq-high-b"
              value={deckB.high}
              min={-24}
              max={6}
              defaultValue={0}
              label="HIGH"
              unit="dB"
              color="#ec4899"
              centerDetent
              onChange={(val) => setEQ('B', 'high', val)}
            />
            <button
              onClick={() => toggleEQKill('B', 'high')}
              className={`mt-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded border transition ${
                deckB.highKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {deckB.highKill ? 'KILL' : 'HI-K'}
            </button>
          </div>

          {/* MID EQ */}
          <div className="flex flex-col items-center relative">
            <Knob
              id="knob-eq-mid-b"
              value={deckB.mid}
              min={-24}
              max={6}
              defaultValue={0}
              label="MID"
              unit="dB"
              color="#ec4899"
              centerDetent
              onChange={(val) => setEQ('B', 'mid', val)}
            />
            <button
              onClick={() => toggleEQKill('B', 'mid')}
              className={`mt-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded border transition ${
                deckB.midKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {deckB.midKill ? 'KILL' : 'MID-K'}
            </button>
          </div>

          {/* LOW EQ */}
          <div className="flex flex-col items-center relative">
            <Knob
              id="knob-eq-low-b"
              value={deckB.low}
              min={-24}
              max={6}
              defaultValue={0}
              label="LOW"
              unit="dB"
              color="#ec4899"
              centerDetent
              onChange={(val) => setEQ('B', 'low', val)}
            />
            <button
              onClick={() => toggleEQKill('B', 'low')}
              className={`mt-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded border transition ${
                deckB.lowKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {deckB.lowKill ? 'KILL' : 'LOW-K'}
            </button>
          </div>

          {/* DUAL FILTER */}
          <div className="pt-1 border-t border-neutral-850 w-full flex justify-center">
            <Knob
              id="knob-filter-b"
              value={deckB.filter}
              min={-100}
              max={100}
              defaultValue={0}
              label="LPF / HPF"
              color="#eab308"
              centerDetent
              onChange={(val) => setFilter('B', val)}
            />
          </div>
        </div>
      </div>

      {/* Channel Volume Faders + VU Meters Section */}
      <div className="grid grid-cols-2 gap-4 py-3 items-center">
        {/* Channel 1 Volume */}
        <div className="flex items-center justify-center gap-2">
          <VUMeter id="vu-deck-a" level={vuLevels.deckA} height={90} width={8} />
          <div className="relative h-28 flex items-center justify-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={deckA.volume}
              onChange={(e) => setVolume('A', parseFloat(e.target.value))}
              className="accent-cyan-400 h-24 w-2 cursor-pointer appearance-none bg-neutral-950 rounded-lg slider-vertical"
              style={{
                writingMode: 'vertical-lr',
                direction: 'rtl',
              }}
              title="Channel 1 Volume Fader"
            />
          </div>
        </div>

        {/* Channel 2 Volume */}
        <div className="flex items-center justify-center gap-2">
          <div className="relative h-28 flex items-center justify-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={deckB.volume}
              onChange={(e) => setVolume('B', parseFloat(e.target.value))}
              className="accent-pink-400 h-24 w-2 cursor-pointer appearance-none bg-neutral-950 rounded-lg slider-vertical"
              style={{
                writingMode: 'vertical-lr',
                direction: 'rtl',
              }}
              title="Channel 2 Volume Fader"
            />
          </div>
          <VUMeter id="vu-deck-b" level={vuLevels.deckB} height={90} width={8} />
        </div>
      </div>

      {/* Master Crossfader Section */}
      <div className="mt-auto pt-2 border-t border-neutral-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-cyan-400">DECK A</span>
          <button
            onClick={handleSnapCenter}
            className="text-neutral-500 hover:text-amber-400 uppercase tracking-wider font-mono text-[9px]"
            title="Snap Crossfader to Center"
          >
            [ CENTER ]
          </button>
          <span className="text-pink-400">DECK B</span>
        </div>

        {/* Crossfader Track */}
        <div className="relative flex items-center py-1">
          {/* Center detent marker */}
          <div className="absolute left-1/2 -top-1 bottom-0 w-0.5 bg-neutral-600 pointer-events-none transform -translate-x-1/2" />

          <input
            id="crossfader-slider"
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={crossfader}
            onChange={handleCrossfaderChange}
            onDoubleClick={handleSnapCenter}
            className="w-full h-5 appearance-none bg-neutral-950 rounded border border-neutral-800 cursor-pointer accent-amber-400 shadow-inner"
            title="Crossfader (Double click for center)"
          />
        </div>

        {/* Auto-Transition Quick Trigger Button */}
        <button
          id="btn-auto-transition"
          onClick={() => triggerAutoTransition()}
          className={`w-full py-2 px-3 rounded-lg font-black text-xs tracking-wider uppercase border transition shadow-lg flex items-center justify-center gap-2 ${
            transition.isActive
              ? 'bg-amber-500 text-neutral-950 border-amber-400 animate-pulse'
              : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:opacity-90 text-white border-neutral-700'
          }`}
          title="Trigger Automated Beat-Matched Seamless Transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {transition.isActive
            ? `AUTO-MIXING (${Math.round(transition.progress * 100)}%)`
            : 'TRIGGER AUTO-TRANSITION'}
        </button>
      </div>
    </div>
  );
};
