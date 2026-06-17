import React, { useState } from 'react';
import { useUpwords } from './hooks/use-upwords';
import { Header } from './components/Header';
import { GameSettings } from './components/GameSettings';
import { Board } from './components/Board';
import { Rack } from './components/Rack';
import { Scoreboard } from './components/Scoreboard';
import { TileBagInfo } from './components/TileBagInfo';
import { MoveLog } from './components/MoveLog';
import { CoachPanel } from './components/CoachPanel';
import { Trophy, HelpCircle, User, Cpu, Sparkles, RefreshCw } from 'lucide-react';
import { CandidateMove } from './upwords-ai';

export default function App() {
  const {
    board,
    players,
    tileBag,
    currentTurn,
    history,
    gameEnded,
    winnerId,
    dictLoaded,
    dictLoadingProgress,
    gameStarted,
    isAiThinking,
    placements,
    activeRack,
    hint,
    coachAnalysis,
    startNewGame,
    placeTileTemp,
    removeTileTemp,
    recallTiles,
    shuffleRack,
    submitPlay,
    passTurn,
    exchangeTiles,
    getHint,
    clearHint,
    closeCoachAndAdvance,
    getPlacementsPreview
  } = useUpwords();

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [bestMovePreview, setBestMovePreview] = useState<any | null>(null);

  const handleCellClick = (r: number, c: number) => {
    // If AI is thinking, ignore clicks
    if (players[currentTurn]?.isAi || gameEnded) return;

    const existingTemp = placements.find(p => p.r === r && p.c === c);

    if (existingTemp) {
      // Clicked on a temporary tile: remove it
      removeTileTemp(r, c);
    } else if (selectedLetter) {
      // Place selected letter
      placeTileTemp(r, c, selectedLetter);
      setSelectedLetter(null); // Deselect after placing
    }
  };

  const handleRestart = () => {
    if (window.confirm('Start a new game? Current progress will be lost.')) {
      window.location.reload();
    }
  };

  // Human placements preview (validates as you build a word)
  const preview = getPlacementsPreview();

  // Winning player details
  const winner = gameEnded && winnerId !== null ? players.find(p => p.id === winnerId) : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        onRestart={handleRestart}
        gameStarted={gameStarted}
        winnerId={winnerId}
        players={players}
      />

      {!gameStarted ? (
        <GameSettings
          onStart={startNewGame}
          isLoading={!dictLoaded}
          dictProgress={dictLoadingProgress}
        />
      ) : (
        <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 max-w-7xl w-full mx-auto min-h-0">
          
          {/* Main gameplay area (Board & Rack) */}
          <div className="flex-1 flex flex-col items-center gap-4 min-h-0 justify-center">
            {/* Word placement validation preview */}
            {placements.length > 0 && preview && (
              <div className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md animate-popup border flex items-center gap-2 ${
                preview.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {preview.isValid ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      Word: {preview.wordsFormed?.map(w => w.word).join(', ')} ({preview.score} pts)
                    </span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{preview.error}</span>
                  </>
                )}
              </div>
            )}

            <Board
              board={board}
              placements={placements}
              onCellClick={handleCellClick}
              selectedLetter={selectedLetter}
              hint={bestMovePreview || hint}
            />

            <Rack
              rack={activeRack}
              selectedLetter={selectedLetter}
              onSelectLetter={setSelectedLetter}
              onShuffle={shuffleRack}
              onRecall={recallTiles}
              onSubmit={submitPlay}
              onPass={passTurn}
              onExchange={exchangeTiles}
              bagCount={tileBag.length}
              hasPlacements={placements.length > 0}
            />
          </div>

          {/* Right column (Scoreboard, log, hints) */}
          <div className="w-full lg:w-[350px] flex flex-col gap-4 shrink-0 overflow-y-auto no-scrollbar max-h-[90vh]">
            <Scoreboard
              players={players}
              currentTurn={currentTurn}
              isAiThinking={isAiThinking}
              winnerId={winnerId}
              gameEnded={gameEnded}
            />

            <TileBagInfo bag={tileBag} />

            <CoachPanel
              onGetHint={getHint}
              onClearHint={clearHint}
              activeHint={hint}
              coachAnalysis={coachAnalysis}
              onCloseAnalysis={closeCoachAndAdvance}
              onShowBestMovePreview={setBestMovePreview}
              hasPlacements={placements.length > 0}
            />

            <MoveLog history={history} players={players} />
          </div>
        </main>
      )}

      {/* Game Over Banner Modal */}
      {gameEnded && winner && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-3xl border border-white/10 shadow-2xl p-8 text-center animate-popup">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 animate-bounce">
              <Trophy className="h-10 w-10" />
            </div>

            <h2 className="font-serif-luxury text-3xl font-bold text-white mb-2 leading-none">
              Game Complete!
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Final scores calculated (including hand penalties)
            </p>

            <div className="space-y-3 mb-8">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      player.id === winnerId
                        ? 'bg-emerald-500/10 border-emerald-500/30 font-bold'
                        : 'bg-slate-950/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-slate-500">{idx + 1}.</span>
                      <span className="text-xs text-slate-200">{player.name}</span>
                      {player.id === winnerId && (
                        <CrownIcon className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                      )}
                    </div>
                    <span className="font-mono text-sm text-white">
                      {player.score} <span className="text-[10px] text-slate-500 font-sans uppercase font-normal">pts</span>
                    </span>
                  </div>
                ))}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Small helper Crown icon
function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M5 20h14" />
    </svg>
  );
}
