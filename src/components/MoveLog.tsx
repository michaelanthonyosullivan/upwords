import React, { useEffect, useRef } from 'react';
import { ScrollText, Play, RefreshCw, XCircle } from 'lucide-react';
import { PlayHistoryItem } from '../lib/upwords-engine';

interface MoveLogProps {
  history: PlayHistoryItem[];
  players: any[];
}

export function MoveLog({ history, players }: MoveLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [history]);

  return (
    <div className="w-full glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-3 flex-1 min-h-[200px]">
      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-white/5 pb-2 flex items-center gap-1.5 shrink-0">
        <ScrollText className="h-4 w-4 text-red-500" />
        <span>Game History</span>
      </h3>
      <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 scroll-smooth">
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-600 italic text-xs py-8">
            No moves yet
          </div>
        ) : (
          history.map((item, idx) => {
            const player = players.find(p => p.id === item.playerId);
            const isHuman = player ? !player.isAi : false;

            // Show all words formed, falling back to single word field
            const wordsLabel = (item.allWords && item.allWords.length > 0)
              ? item.allWords.join(' + ')
              : item.word;

            let icon = <Play className="h-3.5 w-3.5 text-red-500" />;
            let text = '';

            if (item.type === 'exchange') {
              icon = <RefreshCw className="h-3.5 w-3.5 text-orange-400" />;
              text = 'swapped tiles';
            } else if (item.type === 'pass') {
              icon = <XCircle className="h-3.5 w-3.5 text-slate-500" />;
              text = 'passed';
            } else {
              text = 'played';
            }

            return (
              <div key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-white/5 text-xs animate-popup">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="shrink-0">{icon}</div>
                  <div className="text-slate-300 truncate">
                    <span className={`font-bold ${isHuman ? 'text-blue-400' : 'text-slate-400'}`}>
                      {item.playerName}
                    </span>{' '}
                    <span>{text}</span>
                    {wordsLabel && item.type === 'play' && (
                      <span className="font-serif-luxury font-bold text-red-300 text-sm ml-1 select-none tracking-tight">
                        {wordsLabel}
                      </span>
                    )}
                  </div>
                </div>
                {item.type === 'play' && (
                  <div className="font-mono font-bold text-slate-100 shrink-0 ml-2">
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
