import React, { useState } from 'react';
import { Shuffle, ArrowDownToLine, RefreshCw, Send, AlertTriangle } from 'lucide-react';

interface RackProps {
  rack: string[];
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  onShuffle: () => void;
  onRecall: () => void;
  onSubmit: () => { success: boolean; error?: string };
  onPass: () => void;
  onExchange: (tiles: string[]) => { success: boolean; error?: string };
  bagCount: number;
  hasPlacements: boolean;
}

export function Rack({
  rack,
  selectedLetter,
  onSelectLetter,
  onShuffle,
  onRecall,
  onSubmit,
  onPass,
  onExchange,
  bagCount,
  hasPlacements
}: RackProps) {
  const [exchangeMode, setExchangeMode] = useState(false);
  const [exchangeSelections, setExchangeSelections] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTileClick = (letter: string, index: number) => {
    setErrorMsg(null);
    if (exchangeMode) {
      // Toggle selection for exchange
      setExchangeSelections(prev => {
        const key = `${letter}-${index}`;
        if (prev.includes(key)) {
          return prev.filter(k => k !== key);
        } else {
          return [...prev, key];
        }
      });
    } else {
      // Select tile for placing
      if (selectedLetter === letter) {
        onSelectLetter(null); // Deselect
      } else {
        onSelectLetter(letter);
      }
    }
  };

  const handleToggleExchangeMode = () => {
    setErrorMsg(null);
    if (hasPlacements) {
      setErrorMsg('Recall your placed tiles before exchanging.');
      return;
    }
    setExchangeMode(!exchangeMode);
    setExchangeSelections([]);
    onSelectLetter(null);
  };

  const handleExecuteExchange = () => {
    setErrorMsg(null);
    const tiles = exchangeSelections.map(key => key.split('-')[0]);
    const res = onExchange(tiles);
    if (res.success) {
      setExchangeMode(false);
      setExchangeSelections([]);
    } else {
      setErrorMsg(res.error || 'Failed to exchange tiles.');
    }
  };

  const handleSubmitPlay = () => {
    setErrorMsg(null);
    const res = onSubmit();
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid play.');
    }
  };

  const handlePass = () => {
    if (window.confirm('Are you sure you want to pass your turn? You will score 0.')) {
      onPass();
    }
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col items-center gap-4 bg-slate-900/60 glass-card p-5 rounded-2xl border border-white/5 relative">
      {errorMsg && (
        <div className="w-full flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium animate-popup">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Indicators */}
      <div className="w-full flex justify-between items-center px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {exchangeMode ? (
            <span className="text-orange-400">Select tiles to exchange</span>
          ) : (
            <span>Your Tile Rack</span>
          )}
        </span>
        {exchangeMode && (
          <span className="text-[10px] text-orange-400 font-mono">
            {exchangeSelections.length} selected
          </span>
        )}
      </div>

      {/* Tiles Rack Display */}
      <div className="flex gap-2 p-3 bg-slate-950/80 w-full justify-center rounded-xl border border-white/5 min-h-[72px]">
        {rack.map((letter, idx) => {
          const isSelected = !exchangeMode && selectedLetter === letter;
          const key = `${letter}-${idx}`;
          const isSelectedForExchange = exchangeMode && exchangeSelections.includes(key);

          let tileClass = 'bg-gradient-to-b from-amber-100 to-amber-200 border-amber-300 text-slate-950 shadow-md';
          if (isSelected) {
            tileClass = 'bg-gradient-to-b from-amber-200 to-amber-400 border-amber-500 -translate-y-2 ring-4 ring-amber-500/30 scale-105';
          } else if (isSelectedForExchange) {
            tileClass = 'bg-gradient-to-b from-orange-400/40 to-orange-500/40 border-orange-500 text-orange-200 scale-95 ring-2 ring-orange-500/50';
          }

          return (
            <button
              key={idx}
              onClick={() => handleTileClick(letter, idx)}
              draggable={!exchangeMode}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', letter);
                onSelectLetter(letter);
              }}
              onDragEnd={() => onSelectLetter(null)}
              className={`h-11 w-11 rounded-lg border font-bold font-serif-luxury text-lg transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center select-none ${tileClass}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="w-full flex flex-wrap gap-2.5 justify-between items-center">
        {/* Helper Actions */}
        <div className="flex gap-2">
          {!exchangeMode && (
            <>
              <button
                onClick={onShuffle}
                className="p-2.5 rounded-xl border border-white/10 bg-slate-950/40 hover:bg-slate-950/80 text-slate-400 hover:text-white transition-all active:scale-95"
                title="Shuffle Rack"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                onClick={onRecall}
                disabled={!hasPlacements}
                className="p-2.5 rounded-xl border border-white/10 bg-slate-950/40 hover:bg-slate-950/80 text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                title="Recall Tiles"
              >
                <ArrowDownToLine className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Turn Submissions & Passes */}
        <div className="flex gap-2 flex-1 justify-end">
          {exchangeMode ? (
            <>
              <button
                onClick={handleToggleExchangeMode}
                className="px-4 py-2 border border-white/10 rounded-xl bg-slate-950/40 text-xs font-semibold text-slate-400 hover:text-white transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteExchange}
                disabled={exchangeSelections.length === 0}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl active:scale-95 transition-all text-xs disabled:opacity-40 disabled:pointer-events-none"
              >
                Swap ({exchangeSelections.length} tiles)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleExchangeMode}
                disabled={bagCount === 0}
                className="px-3 py-2 border border-white/10 rounded-xl bg-slate-950/40 text-xs font-semibold text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Exchange</span>
              </button>

              <button
                onClick={handlePass}
                className="px-3 py-2 border border-white/10 rounded-xl bg-slate-950/40 text-slate-400 hover:text-white text-xs font-semibold transition-all active:scale-95"
              >
                Pass
              </button>

              <button
                onClick={handleSubmitPlay}
                disabled={!hasPlacements}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl active:scale-95 transition-all text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Word</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
