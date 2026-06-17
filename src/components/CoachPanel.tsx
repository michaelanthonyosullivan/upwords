import React, { useState } from 'react';
import { HelpCircle, Sparkles, Award, ArrowUpRight, ArrowRight, Eye } from 'lucide-react';
import { CandidateMove } from '../lib/upwords-ai';
import { PlayPlacement } from '../lib/upwords-engine';

interface CoachPanelProps {
  onGetHint: () => void;
  onClearHint: () => void;
  activeHint: CandidateMove | null;
  coachAnalysis: {
    userPlay: { placements: PlayPlacement[]; score: number; word: string } | null;
    bestPlay: CandidateMove | null;
  } | null;
  onCloseAnalysis: () => void;
  onShowBestMovePreview: (move: CandidateMove | null) => void;
  hasPlacements: boolean;
}

export function CoachPanel({
  onGetHint,
  onClearHint,
  activeHint,
  coachAnalysis,
  onCloseAnalysis,
  onShowBestMovePreview,
  hasPlacements
}: CoachPanelProps) {
  const [showingPreview, setShowingPreview] = useState(false);

  const handleTogglePreview = () => {
    if (showingPreview) {
      onShowBestMovePreview(null);
      setShowingPreview(false);
    } else if (coachAnalysis?.bestPlay) {
      onShowBestMovePreview(coachAnalysis.bestPlay);
      setShowingPreview(true);
    }
  };

  const handleClose = () => {
    onShowBestMovePreview(null);
    setShowingPreview(false);
    onCloseAnalysis();
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. In-game Hint System Controls */}
      {!coachAnalysis && (
        <div className="w-full bg-slate-900/60 glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Coach Assist</h4>
              <p className="text-[10px] text-slate-500">Need help finding a placement?</p>
            </div>
          </div>

          {activeHint ? (
            <button
              onClick={onClearHint}
              className="px-3 py-1.5 border border-white/10 rounded-lg bg-slate-950/40 hover:bg-slate-950/80 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
            >
              Clear Hint
            </button>
          ) : (
            <button
              onClick={onGetHint}
              disabled={hasPlacements}
              className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg active:scale-95 transition-all text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              <span>Get Hint</span>
            </button>
          )}
        </div>
      )}

      {/* Visual active hint banner */}
      {activeHint && !coachAnalysis && (
        <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col gap-1.5 animate-popup">
          <div className="flex justify-between items-center text-xs font-bold text-indigo-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Suggested Play</span>
            </span>
            <span className="font-mono text-indigo-300">+{activeHint.score} pts</span>
          </div>
          <p className="text-[10px] text-slate-300">
            The coach suggests playing{' '}
            <span className="font-serif-luxury text-amber-400 font-bold text-xs select-none">
              {activeHint.word}
            </span>{' '}
            starting at cell{' '}
            <span className="font-bold text-slate-200 font-mono">
              {String.fromCharCode(65 + activeHint.placements[0].c)}
              {activeHint.placements[0].r + 1}
            </span>.
          </p>
        </div>
      )}

      {/* 2. Post-Turn Coach Analysis Modal/Overlay */}
      {coachAnalysis && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 animate-popup relative overflow-hidden">
            {/* Design backing glow */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-6 relative">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-3 shadow-inner">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-serif-luxury text-2xl font-bold text-white leading-tight">
                Coach Feedback
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Reviewing your word placement</p>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed mb-6">
              {/* Scenario 1: Optimal move played */}
              {coachAnalysis.bestPlay &&
              coachAnalysis.userPlay &&
              coachAnalysis.userPlay.score >= coachAnalysis.bestPlay.score ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <p className="text-emerald-400 font-bold text-sm mb-1.5">Excellent Placement!</p>
                  <p>
                    You played{' '}
                    <span className="font-serif-luxury font-bold text-amber-400 select-none text-sm">
                      {coachAnalysis.userPlay.word}
                    </span>{' '}
                    for{' '}
                    <span className="font-bold text-white font-mono">
                      {coachAnalysis.userPlay.score} points
                    </span>
                    . This was the absolute highest-scoring play available on your rack!
                  </p>
                </div>
              ) : (
                /* Scenario 2: Sub-optimal move played */
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/50 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">You Played</div>
                      <div className="font-serif-luxury text-sm font-bold text-indigo-400 mt-0.5 select-none">
                        {coachAnalysis.userPlay?.word || 'Pass/Exchange'}
                      </div>
                    </div>
                    <div className="font-mono text-base font-bold text-indigo-400">
                      {coachAnalysis.userPlay?.score || 0}{' '}
                      <span className="text-[9px] text-slate-500 font-sans uppercase">pts</span>
                    </div>
                  </div>

                  <div className="flex justify-center my-1">
                    <ArrowRight className="h-5 w-5 text-slate-600 rotate-90 md:rotate-0" />
                  </div>

                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-amber-500 uppercase tracking-wider font-bold">Optimal Play</div>
                      <div className="font-serif-luxury text-sm font-bold text-amber-400 mt-0.5 select-none">
                        {coachAnalysis.bestPlay?.word || 'No play'}
                      </div>
                    </div>
                    <div className="font-mono text-base font-bold text-amber-400">
                      {coachAnalysis.bestPlay?.score || 0}{' '}
                      <span className="text-[9px] text-amber-500/60 font-sans uppercase">pts</span>
                    </div>
                  </div>

                  {coachAnalysis.bestPlay && coachAnalysis.userPlay && (
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center text-[11px]">
                      You missed out on{' '}
                      <span className="font-bold text-amber-400 font-mono">
                        +{coachAnalysis.bestPlay.score - coachAnalysis.userPlay.score} points
                      </span>
                      .
                      <p className="text-slate-400 mt-1 text-[10px]">
                        Tip: Look for stacking letters to score points on both placed tiles and the tiles underneath.
                      </p>
                    </div>
                  )}

                  {coachAnalysis.bestPlay && (
                    <button
                      onClick={handleTogglePreview}
                      className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                        showingPreview
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/50 border-white/5 text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      <span>{showingPreview ? 'Hide Optimal Preview' : 'Preview Optimal Move'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl active:scale-95 transition-all text-xs cursor-pointer"
              >
                Continue Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
