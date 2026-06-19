import React, { useState } from 'react';
import { Shuffle, ArrowDownToLine, RefreshCw, Send, AlertTriangle } from 'lucide-react';

interface RackProps {
  rack: string[];
  selectedTileIdx: number | null;
  onSelectTile: (letter: string, idx: number) => void;
  onDeselectTile: () => void;
  onShuffle: () => void;
  onRecall: () => void;
  onSubmit: () => { success: boolean; error?: string };
  onPass: () => void;
  onExchange: (tiles: string[]) => { success: boolean; error?: string } | void;
  bagCount: number;
  hasPlacements: boolean;
}

export function Rack({
  rack, selectedTileIdx, onSelectTile, onDeselectTile,
  onShuffle, onRecall, onSubmit, onPass, onExchange, bagCount, hasPlacements
}: RackProps) {
  const [exchangeMode, setExchangeMode] = useState(false);
  // Exchange selections stored as Set of rack indices
  const [exchangeIdxs, setExchangeIdxs] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTileClick = (letter: string, idx: number) => {
    setErrorMsg(null);
    if (exchangeMode) {
      setExchangeIdxs(prev => {
        const n = new Set(prev);
        n.has(idx) ? n.delete(idx) : n.add(idx);
        return n;
      });
    } else {
      if (selectedTileIdx === idx) onDeselectTile();
      else onSelectTile(letter, idx);
    }
  };

  const handleToggleExchange = () => {
    setErrorMsg(null);
    if (hasPlacements) { setErrorMsg('Recall your tiles before exchanging.'); return; }
    setExchangeMode(e => !e);
    setExchangeIdxs(new Set());
    onDeselectTile();
  };

  const handleExecuteExchange = () => {
    setErrorMsg(null);
    const tiles = [...exchangeIdxs].map(i => rack[i]);
    const res = onExchange(tiles);
    if (res && !res.success) { setErrorMsg(res.error || 'Exchange failed.'); return; }
    setExchangeMode(false);
    setExchangeIdxs(new Set());
  };

  const handleSubmit = () => {
    setErrorMsg(null);
    const res = onSubmit();
    if (!res.success) setErrorMsg(res.error || 'Invalid play.');
  };

  const handlePass = () => {
    if (window.confirm('Pass your turn? You will score 0 points.')) onPass();
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col items-center gap-3 glass-card p-4 rounded-2xl border border-white/5">
      {errorMsg && (
        <div className="w-full flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium animate-popup">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="w-full flex justify-between items-center px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {exchangeMode ? <span className="text-orange-400">Select tiles to exchange</span> : 'Your Rack'}
        </span>
        {exchangeMode && (
          <span className="text-[10px] text-orange-400 font-mono">{exchangeIdxs.size} selected</span>
        )}
      </div>

      {/* Tiles */}
      <div className="flex gap-2 p-3 bg-slate-950/80 w-full justify-center rounded-xl border border-white/5 min-h-[72px]">
        {rack.map((letter, idx) => {
          const isSelected = !exchangeMode && selectedTileIdx === idx;
          const isForExchange = exchangeMode && exchangeIdxs.has(idx);

          let cls = 'bg-gradient-to-b from-[#FEFEFE] to-[#F0EAE0] border-[#D8CEBE] text-[#B81C2C] shadow-md';
          if (isSelected) {
            cls = 'bg-gradient-to-b from-[#FFF8F0] to-[#F5E8D0] border-red-400 text-[#B81C2C] -translate-y-2.5 ring-4 ring-red-500/25 scale-110 shadow-lg shadow-red-500/20';
          } else if (isForExchange) {
            cls = 'bg-gradient-to-b from-orange-400/40 to-orange-500/40 border-orange-500 text-orange-200 scale-95 ring-2 ring-orange-500/40';
          }

          return (
            <button
              key={idx}
              onClick={() => handleTileClick(letter, idx)}
              draggable={!exchangeMode}
              onDragStart={(e) => {
                // Store letter as plain text for the drop handler
                e.dataTransfer.setData('text/plain', letter);
                e.dataTransfer.effectAllowed = 'move';
                onSelectTile(letter, idx);
              }}
              onDragEnd={() => onDeselectTile()}
              className={`h-11 w-11 rounded-lg border-2 font-bold font-serif-luxury text-lg transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center select-none ${cls}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="w-full flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          {!exchangeMode && (
            <>
              <button onClick={onShuffle}
                className="p-2.5 rounded-xl border border-white/10 bg-slate-950/40 hover:bg-slate-950/80 text-slate-400 hover:text-white transition-all active:scale-95"
                title="Shuffle rack">
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={onRecall} disabled={!hasPlacements}
                className="p-2.5 rounded-xl border border-white/10 bg-slate-950/40 hover:bg-slate-950/80 text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                title="Recall tiles">
                <ArrowDownToLine className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2 flex-1 justify-end">
          {exchangeMode ? (
            <>
              <button onClick={handleToggleExchange}
                className="px-4 py-2 border border-white/10 rounded-xl bg-slate-950/40 text-xs font-semibold text-slate-400 hover:text-white transition-all active:scale-95">
                Cancel
              </button>
              <button onClick={handleExecuteExchange} disabled={exchangeIdxs.size === 0}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl active:scale-95 transition-all text-xs disabled:opacity-40 disabled:pointer-events-none">
                Swap ({exchangeIdxs.size})
              </button>
            </>
          ) : (
            <>
              <button onClick={handleToggleExchange} disabled={bagCount === 0}
                className="px-3 py-2 border border-white/10 rounded-xl bg-slate-950/40 text-xs font-semibold text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Exchange</span>
              </button>
              <button onClick={handlePass}
                className="px-3 py-2 border border-white/10 rounded-xl bg-slate-950/40 text-slate-400 hover:text-white text-xs font-semibold transition-all active:scale-95">
                Pass
              </button>
              <button onClick={handleSubmit} disabled={!hasPlacements}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl active:scale-95 transition-all text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 shadow-lg shadow-red-600/15">
                <Send className="h-3.5 w-3.5" />
                <span>Submit</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
