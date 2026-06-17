import React from 'react';
import { Board as BoardType, PlayPlacement, BOARD_SIZE } from '../lib/upwords-engine';
import { CandidateMove } from '../lib/upwords-ai';

interface BoardProps {
  board: BoardType;
  placements: PlayPlacement[];
  onCellClick: (r: number, c: number) => void;
  selectedLetter: string | null;
  hint: CandidateMove | null;
  onDropTile: (r: number, c: number, letter: string) => void;
  lastPlayPlacements?: { r: number; c: number }[];
}

export function Board({
  board,
  placements,
  onCellClick,
  selectedLetter,
  hint,
  onDropTile,
  lastPlayPlacements
}: BoardProps) {
  // Center coordinates on 10x10 board (0-indexed 4 & 5)
  const isCenter = (r: number, c: number) => {
    return (r === 4 || r === 5) && (c === 4 || c === 5);
  };

  // Find if a tile is temporarily placed here
  const getTempPlacement = (r: number, c: number) => {
    return placements.find(p => p.r === r && p.c === c);
  };

  // Find if this cell is part of the active hint
  const getHintPlacement = (r: number, c: number) => {
    if (!hint) return null;
    return hint.placements.find(p => p.r === r && p.c === c);
  };

  return (
    <div className="w-full flex justify-center items-center py-4">
      {/* Wooden board frame */}
      <div className="wood-panel p-2 md:p-3 shadow-2xl max-w-full aspect-square w-[92vw] sm:w-[85vw] md:w-[600px]">
        {/* Playable grid */}
        <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-1 md:gap-1.5 bg-slate-950 p-2 md:p-3 rounded-xl">
          {Array.from({ length: BOARD_SIZE }).map((_, r) =>
            Array.from({ length: BOARD_SIZE }).map((_, c) => {
              const cell = board[r][c];
              const stackHeight = cell.length;
              const topLetter = stackHeight > 0 ? cell[stackHeight - 1].letter : null;
              
              const tempPlacement = getTempPlacement(r, c);
              const hintPlacement = getHintPlacement(r, c);
              
              const isCenterCell = isCenter(r, c);
              const isLastPlay = lastPlayPlacements?.some(lp => lp.r === r && lp.c === c);
              
              // Determine tile to display (temporary takes priority, then hint preview, then board top)
              let displayLetter: string | null = null;
              let isTemp = false;
              let isHint = false;
              let displayHeight = stackHeight;

              if (tempPlacement) {
                displayLetter = tempPlacement.letter;
                isTemp = true;
                displayHeight = stackHeight + 1;
              } else if (hintPlacement) {
                displayLetter = hintPlacement.letter;
                isHint = true;
                displayHeight = stackHeight + 1;
              } else if (topLetter) {
                displayLetter = topLetter;
              }

              // CSS depth layer styling
              let tileDepthClass = '';
              if (displayHeight > 0) {
                if (displayHeight === 1) tileDepthClass = 'tile-depth-1';
                else if (displayHeight === 2) tileDepthClass = 'tile-depth-2';
                else if (displayHeight === 3) tileDepthClass = 'tile-depth-3';
                else if (displayHeight === 4) tileDepthClass = 'tile-depth-4';
                else tileDepthClass = 'tile-depth-5';
              }

              // Color styles based on tile state
              let tileBgClass = 'from-amber-100 to-amber-200 text-slate-900 border-amber-300';
              if (isTemp) {
                // Temporary tile
                tileBgClass = 'from-sky-100 to-sky-300 text-sky-950 border-sky-400 ring-2 ring-sky-500/50 shadow-sky-500/20';
              } else if (isHint) {
                // Hint ghost tile
                tileBgClass = 'from-emerald-300/40 to-emerald-400/40 text-emerald-100 border-emerald-500/50 ring-2 ring-emerald-500/40 animate-pulse';
              } else if (stackHeight > 1) {
                // Stacked tiles: slightly darker wood/beige shades depending on height
                if (displayHeight === 2) tileBgClass = 'from-amber-200 to-amber-300 text-slate-900 border-amber-400';
                else if (displayHeight === 3) tileBgClass = 'from-amber-300 to-amber-400 text-slate-950 border-amber-500';
                else if (displayHeight === 4) tileBgClass = 'from-orange-200 to-amber-400 text-slate-950 border-amber-600';
                else tileBgClass = 'from-orange-300 to-amber-500 text-slate-950 border-orange-600';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => onCellClick(r, c)}
                  onDragOver={(e) => {
                    // Only allow dragging onto empty or stackable slots
                    if (displayHeight < 5 || isTemp || hintPlacement) {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const letter = e.dataTransfer.getData('text/plain');
                    if (letter) {
                      onDropTile(r, c, letter);
                    }
                  }}
                  disabled={displayHeight >= 5 && !isTemp && !hintPlacement}
                  className={`relative aspect-square w-full rounded-md flex items-center justify-center transition-all duration-200 select-none cursor-pointer group outline-none ${
                    displayHeight === 0
                      ? isCenterCell
                        ? 'border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/30'
                        : 'border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
                      : 'border'
                  } ${
                    isCenterCell && displayHeight === 0 ? 'pulse-glow-amber' : ''
                  } ${
                    isLastPlay ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/30 z-[2]' : ''
                  }`}
                >
                  {/* Grid cell labels shown in background when cell is empty */}
                  {displayHeight === 0 && (
                    <span className="absolute text-[8px] md:text-[9px] text-slate-700 font-bold uppercase pointer-events-none group-hover:text-slate-500 transition-colors">
                      {String.fromCharCode(65 + c)}
                      {r + 1}
                    </span>
                  )}

                  {/* Tile Block */}
                  {displayLetter && (
                    <div
                      className={`w-[92%] h-[92%] rounded-[4px] bg-gradient-to-b flex flex-col items-center justify-center font-bold relative transition-all duration-200 ${tileBgClass} ${tileDepthClass}`}
                    >
                      {/* Highlight border on hover for placing */}
                      <div className="absolute inset-0 rounded-[4px] border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      {/* Main Letter */}
                      <span className="font-serif-luxury text-sm sm:text-base md:text-xl leading-none pt-0.5 tracking-tighter">
                        {displayLetter}
                      </span>

                      {/* Stack Height Number Badge */}
                      <span className={`absolute bottom-0.5 right-1 text-[8px] md:text-[9px] leading-none ${isTemp ? 'text-sky-900' : 'text-slate-600'}`}>
                        {displayHeight}
                      </span>
                    </div>
                  )}

                  {/* Overlay indicators */}
                  {displayHeight >= 5 && !isTemp && (
                    <div className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-red-500/80 pointer-events-none shadow shadow-red-500/50" title="Max height reached" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
