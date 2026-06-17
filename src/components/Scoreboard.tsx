import React from 'react';
import { User, Cpu, Crown, Sparkles } from 'lucide-react';
import { Player } from '../lib/upwords-engine';

interface ScoreboardProps {
  players: Player[];
  currentTurn: number;
  isAiThinking: boolean;
  winnerId: number | null;
  gameEnded: boolean;
}

export function Scoreboard({
  players,
  currentTurn,
  isAiThinking,
  winnerId,
  gameEnded
}: ScoreboardProps) {
  return (
    <div className="w-full bg-slate-900/60 glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-white/5 pb-2">
        Scores & Players
      </h3>

      <div className="flex flex-col gap-3">
        {players.map((player, idx) => {
          const isTurn = currentTurn === idx && !gameEnded;
          const isWinner = winnerId === player.id && gameEnded;
          
          let cardClass = 'bg-slate-950/40 border-white/5';
          if (isTurn) {
            cardClass = 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/15 shadow-lg shadow-amber-500/5';
          } else if (isWinner) {
            cardClass = 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/15 shadow-lg shadow-emerald-500/5';
          }

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${cardClass}`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar Icon */}
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    isTurn
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                      : player.isAi
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {player.isAi ? (
                    <Cpu className="h-4.5 w-4.5" />
                  ) : (
                    <User className="h-4.5 w-4.5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${isTurn ? 'text-amber-400' : 'text-slate-100'}`}>
                      {player.name}
                    </span>
                    {player.isAi && (
                      <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                        {player.aiLevel}
                      </span>
                    )}
                    {isWinner && (
                      <Crown className="h-3.5 w-3.5 text-yellow-400 fill-current animate-bounce" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {player.rack.length} tiles in hand
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-base font-bold text-slate-100">
                  {player.score} <span className="text-[10px] text-slate-500 font-semibold uppercase font-sans">pts</span>
                </div>
                {isTurn && isAiThinking && (
                  <div className="flex items-center justify-end gap-1 text-[8px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">
                    <Sparkles className="h-2.5 w-2.5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
                {isTurn && !isAiThinking && (
                  <div className="text-[8px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">
                    Active Turn
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
