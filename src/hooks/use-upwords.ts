import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Board, Player, PlayPlacement, PlayHistoryItem, createEmptyBoard,
  generateShuffledBag, validatePlay, copyBoard, getBoardStackHeight,
  BOARD_SIZE
} from '../lib/upwords-engine';
import { generateAllLegalMoves, getAiPlay, CandidateMove } from '../lib/upwords-ai';
import { loadDictionary } from '../lib/dictionary';

const DEFAULT_AI_NAMES = ['Seamus', 'Clodagh', 'Dervla'];

export function useUpwords() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [players, setPlayers] = useState<Player[]>([]);
  const [tileBag, setTileBag] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [consecutivePasses, setConsecutivePasses] = useState<number>(0);
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);

  const [dictLoaded, setDictLoaded] = useState<boolean>(false);
  const [dictLoadingProgress, setDictLoadingProgress] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  const [placements, setPlacements] = useState<PlayPlacement[]>([]);
  const [activeRack, setActiveRack] = useState<string[]>([]);

  const [hint, setHint] = useState<CandidateMove | null>(null);
  const [coachAnalysis, setCoachAnalysis] = useState<{
    userPlay: { placements: PlayPlacement[]; score: number; word: string } | null;
    bestPlay: CandidateMove | null;
  } | null>(null);

  // Track last play for board highlighting
  const [lastPlayPlacements, setLastPlayPlacements] = useState<{ r: number; c: number }[]>([]);

  const bestMoveRef = useRef<CandidateMove | null>(null);
  const allMovesRef = useRef<CandidateMove[]>([]);
  const showCoachRef = useRef<boolean>(true);

  useEffect(() => {
    loadDictionary((p) => {
      setDictLoadingProgress(p);
      if (p === 100) setDictLoaded(true);
    });
  }, []);

  const isFirstMoveOfGame = useCallback(() => {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c].length > 0) return false;
    return true;
  }, [board]);

  const calculateHumanMoves = useCallback(() => {
    if (!gameStarted || gameEnded) return;
    const active = players[currentTurn];
    if (!active || active.isAi) { bestMoveRef.current = null; allMovesRef.current = []; return; }
    setTimeout(() => {
      const moves = generateAllLegalMoves(board, active.rack, isFirstMoveOfGame());
      allMovesRef.current = moves;
      bestMoveRef.current = moves[0] || null;
    }, 100);
  }, [board, players, currentTurn, gameStarted, gameEnded, isFirstMoveOfGame]);

  useEffect(() => { calculateHumanMoves(); }, [currentTurn, gameStarted, calculateHumanMoves]);

  // ── Start New Game ─────────────────────────────────────────────────────────
  const startNewGame = (
    humanName: string,
    botDifficulty: 'easy' | 'medium' | 'hard',
    numAi: number = 3,
    showCoach: boolean = true
  ) => {
    showCoachRef.current = showCoach;
    const bag = generateShuffledBag();
    const count = Math.max(1, Math.min(3, numAi));
    const newPlayers: Player[] = [
      { id: 0, name: humanName.trim() || 'Player', score: 0, rack: bag.splice(0, 7), isAi: false },
      ...DEFAULT_AI_NAMES.slice(0, count).map((name, idx) => ({
        id: idx + 1, name, score: 0, rack: bag.splice(0, 7), isAi: true, aiLevel: botDifficulty
      }))
    ];
    setBoard(createEmptyBoard());
    setPlayers(newPlayers);
    setTileBag(bag);
    setCurrentTurn(0);
    setConsecutivePasses(0);
    setHistory([]);
    setGameEnded(false);
    setWinnerId(null);
    setPlacements([]);
    setCoachAnalysis(null);
    setHint(null);
    setLastPlayPlacements([]);
    setActiveRack(newPlayers[0].rack);
    setGameStarted(true);
    bestMoveRef.current = null;
    allMovesRef.current = [];
  };

  // ── Tile Placement ─────────────────────────────────────────────────────────
  const placeTileTemp = (r: number, c: number, letter: string) => {
    if (gameEnded || players[currentTurn]?.isAi) return;
    const existingIdx = placements.findIndex(p => p.r === r && p.c === c);
    if (existingIdx !== -1) {
      const prevLetter = placements[existingIdx].letter;
      setPlacements(prev => { const n = [...prev]; n.splice(existingIdx, 1); return [...n, { r, c, letter }]; });
      setActiveRack(rack => {
        const n = [...rack, prevLetter];
        const i = n.indexOf(letter); if (i !== -1) n.splice(i, 1);
        return n;
      });
      return;
    }
    setPlacements(prev => [...prev, { r, c, letter }]);
    setActiveRack(rack => { const n = [...rack]; const i = n.indexOf(letter); if (i !== -1) n.splice(i, 1); return n; });
    setHint(null);
  };

  const removeTileTemp = (r: number, c: number) => {
    const idx = placements.findIndex(p => p.r === r && p.c === c);
    if (idx === -1) return;
    const letter = placements[idx].letter;
    setPlacements(prev => prev.filter((_, i) => i !== idx));
    setActiveRack(rack => [...rack, letter]);
  };

  const recallTiles = () => {
    if (placements.length === 0) return;
    // BUG FIX: was players[0].rack — must use current player's rack
    setPlacements([]);
    setActiveRack([...players[currentTurn].rack]);
    setHint(null);
  };

  const shuffleRack = () => {
    setActiveRack(rack => {
      const n = [...rack];
      for (let i = n.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [n[i], n[j]] = [n[j], n[i]];
      }
      return n;
    });
  };

  // ── Submit Human Play ──────────────────────────────────────────────────────
  const submitPlay = () => {
    if (placements.length === 0) return { success: false, error: 'No tiles placed.' };
    const player = players[currentTurn];
    if (!player || player.isAi) return { success: false, error: 'Not your turn.' };

    const isFirst = isFirstMoveOfGame();
    const result = validatePlay(board, placements, isFirst, player.rack);
    if (!result.isValid || !result.wordsFormed || result.score === undefined)
      return { success: false, error: result.error || 'Invalid move.' };

    const nextBoard = copyBoard(board);
    for (const p of placements) nextBoard[p.r][p.c].push({ letter: p.letter, placedBy: player.id });

    const nextBag = [...tileBag];
    const drawn: string[] = [];
    for (let i = 0; i < placements.length; i++) {
      if (nextBag.length > 0) drawn.push(nextBag.shift()!);
    }
    const nextRack = [...activeRack, ...drawn];

    const updatedPlayers = players.map(p =>
      p.id === player.id ? { ...p, score: p.score + result.score!, rack: nextRack } : p
    );

    const allWords = result.wordsFormed.map(w => w.word);
    const historyItem: PlayHistoryItem = {
      playerId: player.id,
      playerName: player.name,
      word: allWords[0] || '',
      allWords,
      score: result.score!,
      type: 'play',
      placedTiles: placements.map(p => ({ r: p.r, c: p.c, letter: p.letter, prevHeight: getBoardStackHeight(board, p.r, p.c) })),
      turnIndex: history.length
    };

    setBoard(nextBoard);
    setPlayers(updatedPlayers);
    setTileBag(nextBag);
    setHistory(prev => [...prev, historyItem]);
    setConsecutivePasses(0);
    setLastPlayPlacements(placements.map(p => ({ r: p.r, c: p.c })));
    setPlacements([]);
    setActiveRack(nextRack);
    setHint(null);

    if (showCoachRef.current) {
      setCoachAnalysis({
        userPlay: { placements, score: result.score!, word: allWords[0] || '' },
        bestPlay: bestMoveRef.current
      });
    } else {
      advanceTurn(updatedPlayers, nextBag, 0);
    }

    return { success: true };
  };

  const passTurn = () => {
    const player = players[currentTurn];
    if (player.isAi) return;
    recallTiles();
    const historyItem: PlayHistoryItem = {
      playerId: player.id, playerName: player.name,
      word: '', allWords: [], score: 0, type: 'pass', placedTiles: [], turnIndex: history.length
    };
    setHistory(prev => [...prev, historyItem]);
    const nextPasses = consecutivePasses + 1;
    if (nextPasses >= players.length) endGame(players, tileBag);
    else advanceTurn(players, tileBag, nextPasses);
  };

  const exchangeTiles = (tilesToExchange: string[]) => {
    const player = players[currentTurn];
    if (player.isAi) return;
    if (tilesToExchange.length === 0) return { success: false, error: 'No tiles selected.' };
    if (tileBag.length < tilesToExchange.length)
      return { success: false, error: `Not enough tiles in bag (${tileBag.length} left).` };

    recallTiles();
    let tempRack = [...player.rack];
    for (const tile of tilesToExchange) {
      const idx = tempRack.indexOf(tile);
      if (idx !== -1) tempRack.splice(idx, 1);
    }
    const nextBag = [...tileBag];
    const drawn: string[] = [];
    for (let i = 0; i < tilesToExchange.length; i++) drawn.push(nextBag.shift()!);
    nextBag.push(...tilesToExchange);
    for (let i = nextBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextBag[i], nextBag[j]] = [nextBag[j], nextBag[i]];
    }
    const nextRack = [...tempRack, ...drawn];
    const updatedPlayers = players.map(p => p.id === player.id ? { ...p, rack: nextRack } : p);
    const historyItem: PlayHistoryItem = {
      playerId: player.id, playerName: player.name,
      word: '', allWords: [], score: 0, type: 'exchange', placedTiles: [], turnIndex: history.length
    };
    setPlayers(updatedPlayers);
    setTileBag(nextBag);
    setHistory(prev => [...prev, historyItem]);
    setActiveRack(nextRack);
    const nextPasses = consecutivePasses + 1;
    if (nextPasses >= players.length) endGame(updatedPlayers, nextBag);
    else advanceTurn(updatedPlayers, nextBag, nextPasses);
    return { success: true };
  };

  const closeCoachAndAdvance = () => {
    setCoachAnalysis(null);
    advanceTurn(players, tileBag, 0);
  };

  const advanceTurn = (currentPlayers: Player[], currentBag: string[], passesCount: number) => {
    const justPlayed = currentPlayers[currentTurn];
    if (justPlayed?.rack.length === 0 && currentBag.length === 0) {
      endGame(currentPlayers, currentBag);
      return;
    }
    setCurrentTurn((currentTurn + 1) % currentPlayers.length);
    setConsecutivePasses(passesCount);
  };

  // ── AI Turn ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameStarted || gameEnded || coachAnalysis !== null) return;
    const currentPlayer = players[currentTurn];
    if (!currentPlayer?.isAi) return;

    setIsAiThinking(true);
    const perform = async () => {
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      const isFirst = isFirstMoveOfGame();
      const aiPlay = getAiPlay(board, currentPlayer, isFirst);

      if (aiPlay) {
        const nextBoard = copyBoard(board);
        for (const p of aiPlay.placements) nextBoard[p.r][p.c].push({ letter: p.letter, placedBy: currentPlayer.id });

        const nextBag = [...tileBag];
        const drawn: string[] = [];
        for (let i = 0; i < aiPlay.placements.length; i++) {
          if (nextBag.length > 0) drawn.push(nextBag.shift()!);
        }
        let tempRack = [...currentPlayer.rack];
        for (const p of aiPlay.placements) {
          const idx = tempRack.indexOf(p.letter); if (idx !== -1) tempRack.splice(idx, 1);
        }
        const nextRack = [...tempRack, ...drawn];
        const updatedPlayers = players.map(p =>
          p.id === currentPlayer.id ? { ...p, score: p.score + aiPlay.score, rack: nextRack } : p
        );

        // Collect all words the AI formed
        const allAiWords = aiPlay.wordsFormed
          ? aiPlay.wordsFormed.map((w: any) => w.word)
          : [aiPlay.word];

        const historyItem: PlayHistoryItem = {
          playerId: currentPlayer.id, playerName: currentPlayer.name,
          word: aiPlay.word, allWords: allAiWords, score: aiPlay.score, type: 'play',
          placedTiles: aiPlay.placements.map((p: PlayPlacement) => ({ r: p.r, c: p.c, letter: p.letter, prevHeight: getBoardStackHeight(board, p.r, p.c) })),
          turnIndex: history.length
        };
        setBoard(nextBoard);
        setPlayers(updatedPlayers);
        setTileBag(nextBag);
        setHistory(prev => [...prev, historyItem]);
        setConsecutivePasses(0);
        setLastPlayPlacements(aiPlay.placements.map((p: PlayPlacement) => ({ r: p.r, c: p.c })));
        setIsAiThinking(false);
        advanceTurn(updatedPlayers, nextBag, 0);
      } else {
        // Exchange or pass
        const canExchange = tileBag.length > 0;
        if (canExchange) {
          const count = Math.min(tileBag.length, currentPlayer.rack.length);
          const exchanged = currentPlayer.rack.slice(0, count);
          let tempRack = currentPlayer.rack.slice(count);
          const nextBag = [...tileBag];
          const drawn: string[] = [];
          for (let i = 0; i < count; i++) drawn.push(nextBag.shift()!);
          nextBag.push(...exchanged);
          for (let i = nextBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nextBag[i], nextBag[j]] = [nextBag[j], nextBag[i]];
          }
          const nextRack = [...tempRack, ...drawn];
          const updatedPlayers = players.map(p => p.id === currentPlayer.id ? { ...p, rack: nextRack } : p);
          const hi: PlayHistoryItem = {
            playerId: currentPlayer.id, playerName: currentPlayer.name,
            word: '', allWords: [], score: 0, type: 'exchange', placedTiles: [], turnIndex: history.length
          };
          setPlayers(updatedPlayers); setTileBag(nextBag);
          setHistory(prev => [...prev, hi]);
          const np = consecutivePasses + 1;
          setIsAiThinking(false);
          if (np >= players.length) endGame(updatedPlayers, nextBag);
          else advanceTurn(updatedPlayers, nextBag, np);
        } else {
          const hi: PlayHistoryItem = {
            playerId: currentPlayer.id, playerName: currentPlayer.name,
            word: '', allWords: [], score: 0, type: 'pass', placedTiles: [], turnIndex: history.length
          };
          setHistory(prev => [...prev, hi]);
          const np = consecutivePasses + 1;
          setIsAiThinking(false);
          if (np >= players.length) endGame(players, tileBag);
          else advanceTurn(players, tileBag, np);
        }
      }
    };
    perform();
  }, [currentTurn, gameStarted, gameEnded, coachAnalysis]);

  const endGame = (currentPlayers: Player[], _bag: string[]) => {
    const finalized = currentPlayers.map(p => ({ ...p, score: Math.max(0, p.score - p.rack.length) }));
    let maxScore = -1; let winId = null;
    for (const p of finalized) { if (p.score > maxScore) { maxScore = p.score; winId = p.id; } }
    setPlayers(finalized);
    setGameEnded(true);
    setWinnerId(winId);
  };

  const getHint = () => {
    if (players[currentTurn]?.isAi || gameEnded) return;
    if (bestMoveRef.current) setHint(bestMoveRef.current);
  };

  const clearHint = () => setHint(null);

  const getPlacementsPreview = () => {
    if (placements.length === 0) return null;
    return validatePlay(board, placements, isFirstMoveOfGame(), players[currentTurn]?.rack || []);
  };

  return {
    board, players, tileBag, currentTurn, history, gameEnded, winnerId,
    dictLoaded, dictLoadingProgress, gameStarted, isAiThinking,
    placements, activeRack, hint, coachAnalysis, lastPlayPlacements,
    startNewGame, placeTileTemp, removeTileTemp, recallTiles, shuffleRack,
    submitPlay, passTurn, exchangeTiles, getHint, clearHint,
    closeCoachAndAdvance, getPlacementsPreview, isFirstMoveOfGame
  };
}
