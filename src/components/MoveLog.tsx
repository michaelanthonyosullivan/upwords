import React, { useEffect, useRef } from 'react';
import { ScrollText, Play, RefreshCw, XCircle } from 'lucide-react';
import { PlayHistoryItem } from '../lib/upwords-engine';

interface MoveLogProps {
  history: PlayHistoryItem[];
  players: any[];
}

export function MoveLog({ history, players }: MoveLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new moves are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="w-full bg-slate-900/60 glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-3 flex-1 min-h-[220px]">
      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-white/5 pb-2 flex items-center gap-1.5 shrink-0">
        <ScrollText className="h-4 w-4 text-amber-500" />
        <span>Game History</span>
      </h3>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 scroll-smooth"
      >
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic text-xs py-10">
            <span>No moves played yet.</span>
          </div>
        ) : (
          history.map((item, idx) => {
            const player = players.find(p => p.id === item.playerId);
            const isHuman = player ? !player.isAi : false;
            
            let icon = <Play className="h-3.5 w-3.5 text-amber-500" />;
            let text = '';
            let detail = '';

            if (item.type === 'play') {
              text = `played `;
              detail = item.word;
            } else if (item.type === 'exchange') {
              icon = <RefreshCw className="h-3.5 w-3.5 text-orange-400" />;
              text = 'swapped tiles';
            } else {
              icon = <XCircle className="h-3.5 w-3.5 text-slate-500" />;
              text = 'passed';
            }

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-white/5 text-xs animate-popup"
              >
                <div className="flex items-center gap-2">
                  <div className="shrink-0">{icon}</div>
                  <div className="text-slate-300">
                    <span className={`font-bold ${isHuman ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {item.playerName}
                    </span>{' '}
                    <span>{text}</span>
                    {detail && (
                      <span className="font-serif-luxury font-bold text-amber-400 text-sm ml-1 select-none tracking-tight">
                        {detail}
                      </span>
                    )}
                  </div>
                </div>

                {item.type === 'play' && (
                  <div className="font-mono font-bold text-slate-100 shrink-0">
                    +{item.score} <span className="text-[9px] text-slate-500 font-sans uppercase">pts</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
