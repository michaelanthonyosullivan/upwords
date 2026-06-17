import React, { useState } from 'react';
import { HelpCircle, RefreshCw, Trophy, BookOpen } from 'lucide-react';

interface HeaderProps {
  onRestart: () => void;
  gameStarted: boolean;
  winnerId: number | null;
  players: any[];
}

export function Header({ onRestart, gameStarted, winnerId, players }: HeaderProps) {
  const [showRules, setShowRules] = useState(false);

  return (
    <header className="shrink-0 border-b border-border/40 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50">
          <span className="font-serif-luxury text-xl font-bold text-slate-950 select-none">U</span>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-amber-500 font-semibold leading-none">Vercel Deployable Clone</div>
          <h1 className="font-serif-luxury text-xl md:text-2xl font-bold leading-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            Upwords 3D
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowRules(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-medium"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Rules</span>
        </button>

        {gameStarted && (
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>New Game</span>
          </button>
        )}
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl p-6 md:p-8 animate-popup shadow-2xl border border-white/10">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-serif-luxury text-2xl md:text-3xl text-amber-400 font-bold">Upwords Rules</h2>
              <button 
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-white transition-all text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed overflow-x-hidden">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-300 font-semibold mb-1">Stack letters to change words!</p>
                Unlike standard word games, Upwords allows you to stack letters on top of existing ones. Scoring is based on the height of the tile stacks.
              </div>

              <div>
                <h3 className="text-white font-bold mb-1 text-base">1. Placing Tiles</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Words must be at least 2 letters long.</li>
                  <li>All tiles played in a turn must form a single word in a straight line (horizontal or vertical).</li>
                  <li><strong>First move:</strong> Must cover at least one of the four center squares (highlighted gold).</li>
                  <li><strong>Subsequent moves:</strong> Must connect with tiles already on the board (by touching or stacking).</li>
                  <li>You cannot have gaps in the tiles placed during your turn.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-1 text-base">2. Stacking Tiles</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>You can stack letters on top of others to change words.</li>
                  <li>Maximum stack height is <strong>5 tiles</strong>.</li>
                  <li>You **cannot** stack a tile on top of an identical letter (e.g. no 'E' on 'E').</li>
                  <li>You **cannot** cover an entire word. At least one letter of the original word must remain visible.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-1 text-base">3. Scoring</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Flat Words:</strong> If all letters in a newly formed or modified word are only 1 tile high, you score <strong>2 points per tile</strong>.</li>
                  <li><strong>Stacked Words:</strong> If a word contains any stacked letters, you score <strong>1 point per tile in its stack</strong> (e.g., a letter on stack 3 counts as 3 points).</li>
                  <li><strong>'QU' Bonus:</strong> The 'QU' tile counts as a single tile. You score <strong>+2 bonus points</strong> whenever you use it.</li>
                  <li><strong>7-Tile Bonus:</strong> Using all 7 tiles from your rack in a single turn earns a <strong>20-point bonus</strong>.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-1 text-base">4. Ending the Game</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>The game ends when all tiles are drawn and one player empties their rack, or all players pass in a row.</li>
                  <li>At the end of the game, players subtract <strong>1 point for every remaining tile</strong> on their rack.</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10 mt-6">
                <button
                  onClick={() => setShowRules(false)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl active:scale-95 transition-all text-xs"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
