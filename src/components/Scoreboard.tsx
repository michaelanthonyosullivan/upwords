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

export function Scoreboard({ players, currentTurn, isAiThinking, winnerId, gameEnded }: ScoreboardProps) {
  return (
    <div className="w-full glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-white/5 pb-2">
        Scores
      </h3>
      <div className="flex flex-col gap-2.5">
        {players.map((player, idx) => {
          const isTurn = currentTurn === idx && !gameEnded;
          const isWinner = winnerId === player.id && gameEnded;

          let cardClass = 'bg-slate-950/40 border-white/5';
          if (isTurn) cardClass = 'bg-red-600/10 border-red-500/30 ring-1 ring-red-500/10 shadow-lg shadow-red-600/5';
          else if (isWinner) cardClass = 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/15';

          return (
            <div key={player.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${cardClass}`}>
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  isTurn ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : player.isAi ? 'bg-slate-800 text-slate-300'
                  : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {player.isAi ? <Cpu className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${isTurn ? 'text-red-400' : 'text-slate-100'}`}>
                      {player.name}
                    </span>
                    {player.isAi && (
                      <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                        {player.aiLevel}
                      </span>
                    )}
                    {isWinner && <Crown className="h-3.5 w-3.5 text-yellow-400 fill-current animate-bounce" />}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{player.rack.length} tiles</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-base font-bold text-slate-100">
                  {player.score} <span className="text-[10px] text-slate-500 font-sans uppercase">pts</span>
                </div>
                {isTurn && isAiThinking && (
                  <div className="flex items-center justify-end gap-1 text-[8px] text-red-400 font-bold uppercase tracking-wider mt-0.5">
                    <Sparkles className="h-2.5 w-2.5 animate-spin" />
                    <span>Thinking…</span>
                  </div>
                )}
                {isTurn && !isAiThinking && (
                  <div className="text-[8px] text-red-400/70 font-bold uppercase tracking-wider mt-0.5">Your turn</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
