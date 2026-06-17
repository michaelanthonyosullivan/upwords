import React, { useState } from 'react';
import { Play, Sparkles, User, Settings, ShieldAlert } from 'lucide-react';

interface GameSettingsProps {
  onStart: (name: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  isLoading: boolean;
  dictProgress: number;
}

export function GameSettings({ onStart, isLoading, dictProgress }: GameSettingsProps) {
  const [name, setName] = useState('Player');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onStart(name, difficulty);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-radial-gradient">
      <div className="max-w-md w-full glass-card rounded-3xl border border-white/10 shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 mb-4 ring-1 ring-amber-300/40">
            <span className="font-serif-luxury text-3xl font-bold text-slate-950 select-none">U</span>
          </div>
          <h2 className="font-serif-luxury text-3xl font-extrabold text-white mb-2 leading-tight">
            Upwords 3D
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Stack letters, build words in 3D, and refine your game against virtual opponents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-500" />
              <span>Player Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 15))}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm font-medium"
              placeholder="Your Name"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5 text-amber-500" />
              <span>AI Opponents Level</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    difficulty === level
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic text-center">
              {difficulty === 'easy' && 'Easy: Opponents play simple, low-scoring words.'}
              {difficulty === 'medium' && 'Medium: Balanced play style, moderate strategy.'}
              {difficulty === 'hard' && 'Hard: Masterful bots that optimize every stack.'}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-500" />
                  Compiling Dictionary...
                </span>
                <span className="font-mono font-bold text-amber-400">{dictProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 border border-white/5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${dictProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Launch Board</span>
            </button>
          )}
        </form>

        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-1 text-[10px] text-slate-600">
          <ShieldAlert className="h-3.5 w-3.5 text-slate-600" />
          <span>Local Tournament English dictionary (SOWPODS) included</span>
        </div>
      </div>
    </div>
  );
}
