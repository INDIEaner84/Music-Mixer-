import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useDJ } from '../context/DJContext';

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, setShowShortcutsModal } = useDJ();

  if (!showShortcutsModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <Keyboard className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">
              KEYBOARD PERFORMANCE SHORTCUTS
            </h2>
          </div>
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
          {/* Deck A Shortcuts */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
              DECK A CONTROLS
            </span>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Play / Pause</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 font-mono font-bold">
                Space
              </kbd>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Cue / Return to Cue</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 font-mono font-bold">
                Q
              </kbd>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Auto Beat-Sync</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 font-mono font-bold">
                S
              </kbd>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">Hot Cues 1, 2, 3, 4</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 font-mono font-bold">
                Z, X, C, V
              </kbd>
            </div>
          </div>

          {/* Deck B Shortcuts */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
            <span className="text-[11px] font-black text-pink-400 uppercase tracking-wider">
              DECK B CONTROLS
            </span>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Play / Pause</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-pink-300 font-mono font-bold">
                Enter
              </kbd>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Cue / Return to Cue</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-pink-300 font-mono font-bold">
                P
              </kbd>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Auto Beat-Sync</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-pink-300 font-mono font-bold">
                L
              </kbd>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">Hot Cues 1, 2, 3, 4</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-pink-300 font-mono font-bold">
                B, N, M, ,
              </kbd>
            </div>
          </div>

          {/* Mixer & Transitions */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
              MIXER & TRANSITIONS
            </span>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Crossfader Left / Right</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono font-bold">
                ← / →
              </kbd>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Snap Crossfader Center</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono font-bold">
                ↓
              </kbd>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">Trigger Auto-Mix Transition</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono font-bold">
                T
              </kbd>
            </div>
          </div>

          {/* Sampler Pads */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
              8-PAD SAMPLER
            </span>
            <div className="flex justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-300">Trigger Pads 1 - 8</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-300 font-mono font-bold">
                1, 2, 3, 4, 5, 6, 7, 8
              </kbd>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">Help / Shortcut modal</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-300 font-mono font-bold">
                ?
              </kbd>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-800 text-right">
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
