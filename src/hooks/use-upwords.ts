import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Board,
  Player,
  PlayPlacement,
  PlayHistoryItem,
  GameState,
  createEmptyBoard,
  generateShuffledBag,
  validatePlay,
  copyBoard,
  getBoardStackHeight,
  getBoardTopLetter,
  BOARD_SIZE,
  MAX_STACK_HEIGHT
} from '../lib/upwords-engine';
import { generateAllLegalMoves, getAiPlay, CandidateMove } from '../lib/upwords-ai';
import { loadDictionary } from '../lib/dictionary';

const DEFAULT_AI_NAMES = ['AeroBot', 'LexiBot', 'WordBot'];

export function useUpwords() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [players, setPlayers] = useState<Player[]>([]);
  const [tileBag, setTileBag] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [consecutivePasses, setConsecutivePasses] = useState<number>(0);
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  
  // Interface/Loading States
  const [dictLoaded, setDictLoaded] = useState<boolean>(false);
  const [dictLoadingProgress, setDictLoadingProgress] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  
  // Placement State (Human temporary tiles)
  const [placements, setPlacements] = useState<PlayPlacement[]>([]);
  const [activeRack, setActiveRack] = useState<string[]>([]); // Current rack reflecting temporary placements
  
  // Hints & Coach Modes
  const [hint, setHint] = useState<CandidateMove | null>(null);
  const [coachAnalysis, setCoachAnalysis] = useState<{
    userPlay: { placements: PlayPlacement[]; score: number; word: string } | null;
    bestPlay: CandidateMove | null;
  } | null>(null);

  // Cache best move for current turn
  const bestMoveRef = useRef<CandidateMove | null>(null);
  const allMovesRef = useRef<CandidateMove[]>([]);

  // Load Dictionary on mount
  useEffect(() => {
    loadDictionary((progress) => {
      setDictLoadingProgress(progress);
      if (progress === 100) {
        setDictLoaded(true);
      }
    });
  }, []);

  // Check if first move of the game
  const isFirstMoveOfGame = useCallback(() => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].length > 0) return false;
      }
    }
    return true;
  }, [board]);

  // Pre-calculate best moves for the human player at the start of their turn
  const calculateHumanMoves = useCallback(() => {
    if (!gameStarted || gameEnded) return;
    const activePlayer = players[currentTurn];
    if (!activePlayer || activePlayer.isAi) {
      bestMoveRef.current = null;
      allMovesRef.current = [];
      return;
    }

    // Run solver for human rack
    setTimeout(() => {
      const isFirst = isFirstMoveOfGame();
      const moves = generateAllLegalMoves(board, activePlayer.rack, isFirst);
      allMovesRef.current = moves;
      bestMoveRef.current = moves[0] || null;
      console.log(`Pre-calculated ${moves.length} human moves. Best move:`, moves[0]);
    }, 100);
  }, [board, players, currentTurn, gameStarted, gameEnded, isFirstMoveOfGame]);

  useEffect(() => {
    calculateHumanMoves();
  }, [currentTurn, gameStarted, calculateHumanMoves]);

  // Start new game
  const startNewGame = (humanName: string, botDifficulty: 'easy' | 'medium' | 'hard') => {
    const bag = generateShuffledBag();
    
    // Create players (Human is player 0, Bots are 1, 2, 3)
    const newPlayers: Player[] = [
      {
        id: 0,
        name: humanName.trim() || 'Human',
        score: 0,
        rack: bag.splice(0, 7),
        isAi: false
      },
      ...DEFAULT_AI_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        score: 0,
        rack: bag.splice(0, 7),
        isAi: true,
        aiLevel: botDifficulty
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
    setActiveRack(newPlayers[0].rack);
    setGameStarted(true);
    bestMoveRef.current = null;
    allMovesRef.current = [];
  };

  // Place a tile temporarily
  const placeTileTemp = (r: number, c: number, letter: string) => {
    if (gameEnded || players[currentTurn]?.isAi) return;

    // Check if cell already has a temporary placement
    const existingIdx = placements.findIndex(p => p.r === r && p.c === c);
    if (existingIdx !== -1) {
      // Return old tile to rack
      const prevLetter = placements[existingIdx].letter;
      setPlacements(prev => {
        const next = [...prev];
        next.splice(existingIdx, 1);
        return [...next, { r, c, letter }];
      });
      setActiveRack(rack => {
        const next = [...rack, prevLetter];
        const idx = next.indexOf(letter);
        if (idx !== -1) next.splice(idx, 1);
        return next;
      });
      return;
    }

    // Place new tile
    setPlacements(prev => [...prev, { r, c, letter }]);
    setActiveRack(rack => {
      const next = [...rack];
      const idx = next.indexOf(letter);
      if (idx !== -1) next.splice(idx, 1);
      return next;
    });
    setHint(null); // Clear hint on placing
  };

  // Remove a temporary placement
  const removeTileTemp = (r: number, c: number) => {
    const idx = placements.findIndex(p => p.r === r && p.c === c);
    if (idx === -1) return;
    const letter = placements[idx].letter;
    setPlacements(prev => prev.filter((_, i) => i !== idx));
    setActiveRack(rack => [...rack, letter]);
  };

  // Recall all temporary tiles to rack
  const recallTiles = () => {
    if (placements.length === 0) return;
    const returnedTiles = placements.map(p => p.letter);
    setPlacements([]);
    setActiveRack([...players[0].rack]);
    setHint(null);
  };

  // Shuffle rack
  const shuffleRack = () => {
    setActiveRack(rack => {
      const next = [...rack];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  };

  // Finalize human move validation and scoring
  const submitPlay = () => {
    if (placements.length === 0) return { success: false, error: 'No tiles placed.' };
    const player = players[currentTurn];
    if (!player || player.isAi) return { success: false, error: 'Not your turn.' };

    const isFirst = isFirstMoveOfGame();
    const result = validatePlay(board, placements, isFirst, player.rack);

    if (!result.isValid || !result.wordsFormed || result.score === undefined) {
      return { success: false, error: result.error || 'Invalid move.' };
    }

    // Apply placements permanently
    const nextBoard = copyBoard(board);
    for (const p of placements) {
      nextBoard[p.r][p.c].push({ letter: p.letter, placedBy: player.id });
    }

    // Draw new tiles
    const newTilesCount = placements.length;
    const nextBag = [...tileBag];
    const drawn: string[] = [];
    for (let i = 0; i < newTilesCount; i++) {
      if (nextBag.length > 0) {
        drawn.push(nextBag.shift()!);
      }
    }
    const nextRack = [...activeRack, ...drawn];

    // Update player score
    const updatedPlayers = players.map(p => {
      if (p.id === player.id) {
        return {
          ...p,
          score: p.score + result.score!,
          rack: nextRack
        };
      }
      return p;
    });

    // Save in history
    const mainWord = result.wordsFormed[0]?.word || '';
    const historyItem: PlayHistoryItem = {
      playerId: player.id,
      playerName: player.name,
      word: mainWord,
      score: result.score!,
      type: 'play',
      placedTiles: placements.map(p => ({
        r: p.r,
        c: p.c,
        letter: p.letter,
        prevHeight: getBoardStackHeight(board, p.r, p.c)
      })),
      turnIndex: history.length
    };

    setBoard(nextBoard);
    setPlayers(updatedPlayers);
    setTileBag(nextBag);
    setHistory(prev => [...prev, historyItem]);
    setConsecutivePasses(0);

    // Compute coach feedback
    const bestMove = bestMoveRef.current;
    setCoachAnalysis({
      userPlay: { placements, score: result.score, word: mainWord },
      bestPlay: bestMove
    });

    // Clear placements
    setPlacements([]);
    setActiveRack(nextRack);
    setHint(null);

    return { success: true };
  };

  // Human player passes turn
  const passTurn = () => {
    const player = players[currentTurn];
    if (player.isAi) return;

    recallTiles();

    const historyItem: PlayHistoryItem = {
      playerId: player.id,
      playerName: player.name,
      word: '',
      score: 0,
      type: 'pass',
      placedTiles: [],
      turnIndex: history.length
    };

    setHistory(prev => [...prev, historyItem]);
    
    const nextPasses = consecutivePasses + 1;
    setConsecutivePasses(nextPasses);

    if (nextPasses >= players.length) {
      endGame(players, tileBag);
    } else {
      advanceTurn(players, tileBag, nextPasses);
    }
  };

  // Human player exchanges tiles
  const exchangeTiles = (tilesToExchange: string[]) => {
    const player = players[currentTurn];
    if (player.isAi) return;
    if (tilesToExchange.length === 0) return { success: false, error: 'No tiles selected.' };
    if (tileBag.length < tilesToExchange.length) {
      return { success: false, error: `Not enough tiles left in the bag. Remaining: ${tileBag.length}` };
    }

    recallTiles();

    // Remove tiles from rack
    let tempRack = [...player.rack];
    for (const tile of tilesToExchange) {
      const idx = tempRack.indexOf(tile);
      if (idx !== -1) tempRack.splice(idx, 1);
    }

    // Draw new tiles
    const nextBag = [...tileBag];
    const drawn: string[] = [];
    for (let i = 0; i < tilesToExchange.length; i++) {
      drawn.push(nextBag.shift()!);
    }

    // Put exchanged tiles back into bag and shuffle bag
    nextBag.push(...tilesToExchange);
    // Fisher-Yates shuffle
    for (let i = nextBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextBag[i], nextBag[j]] = [nextBag[j], nextBag[i]];
    }

    const nextRack = [...tempRack, ...drawn];

    const updatedPlayers = players.map(p => {
      if (p.id === player.id) {
        return { ...p, rack: nextRack };
      }
      return p;
    });

    const historyItem: PlayHistoryItem = {
      playerId: player.id,
      playerName: player.name,
      word: '',
      score: 0,
      type: 'exchange',
      placedTiles: [],
      turnIndex: history.length
    };

    setPlayers(updatedPlayers);
    setTileBag(nextBag);
    setHistory(prev => [...prev, historyItem]);
    
    // Exchanging takes the full turn
    const nextPasses = consecutivePasses + 1;
    setConsecutivePasses(nextPasses);

    if (nextPasses >= players.length) {
      endGame(updatedPlayers, nextBag);
    } else {
      advanceTurn(updatedPlayers, nextBag, nextPasses);
    }
    setActiveRack(nextRack);

    return { success: true };
  };

  // Close coach modal and advance game
  const closeCoachAndAdvance = () => {
    setCoachAnalysis(null);
    advanceTurn(players, tileBag, 0);
  };

  // Cycle turn
  const advanceTurn = (currentPlayers: Player[], currentBag: string[], passesCount: number) => {
    // Check if player has run out of tiles and bag is empty (Game End condition)
    const justPlayedPlayer = currentPlayers[currentTurn];
    if (justPlayedPlayer.rack.length === 0 && currentBag.length === 0) {
      endGame(currentPlayers, currentBag);
      return;
    }

    const nextTurn = (currentTurn + 1) % currentPlayers.length;
    setCurrentTurn(nextTurn);
    setConsecutivePasses(passesCount);
  };

  // Handle AI turn execution
  useEffect(() => {
    if (!gameStarted || gameEnded || coachAnalysis !== null) return;

    const currentPlayer = players[currentTurn];
    if (!currentPlayer || !currentPlayer.isAi) return;

    setIsAiThinking(true);

    const performAiTurn = async () => {
      // Simulate AI thinking delay
      const thinkTime = 1200 + Math.random() * 800;
      await new Promise(resolve => setTimeout(resolve, thinkTime));

      const isFirst = isFirstMoveOfGame();
      const aiPlay = getAiPlay(board, currentPlayer, isFirst);

      if (aiPlay) {
        // AI found a play
        const nextBoard = copyBoard(board);
        for (const p of aiPlay.placements) {
          nextBoard[p.r][p.c].push({ letter: p.letter, placedBy: currentPlayer.id });
        }

        // Draw new tiles
        const nextBag = [...tileBag];
        const drawn: string[] = [];
        for (let i = 0; i < aiPlay.placements.length; i++) {
          if (nextBag.length > 0) {
            drawn.push(nextBag.shift()!);
          }
        }

        // Remove placed tiles from AI's rack
        let tempRack = [...currentPlayer.rack];
        for (const p of aiPlay.placements) {
          const idx = tempRack.indexOf(p.letter);
          if (idx !== -1) tempRack.splice(idx, 1);
        }
        const nextRack = [...tempRack, ...drawn];

        const updatedPlayers = players.map(p => {
          if (p.id === currentPlayer.id) {
            return {
              ...p,
              score: p.score + aiPlay.score,
              rack: nextRack
            };
          }
          return p;
        });

        const historyItem: PlayHistoryItem = {
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          word: aiPlay.word,
          score: aiPlay.score,
          type: 'play',
          placedTiles: aiPlay.placements.map(p => ({
            r: p.r,
            c: p.c,
            letter: p.letter,
            prevHeight: getBoardStackHeight(board, p.r, p.c)
          })),
          turnIndex: history.length
        };

        setBoard(nextBoard);
        setPlayers(updatedPlayers);
        setTileBag(nextBag);
        setHistory(prev => [...prev, historyItem]);
        setConsecutivePasses(0);

        setIsAiThinking(false);
        advanceTurn(updatedPlayers, nextBag, 0);
      } else {
        // AI could not find a play: either exchange tiles or pass
        const tilesToExchangeCount = Math.min(tileBag.length, currentPlayer.rack.length);
        if (tilesToExchangeCount > 0) {
          // AI exchanges all tiles it can
          const tilesExchanged = currentPlayer.rack.slice(0, tilesToExchangeCount);
          let tempRack = currentPlayer.rack.slice(tilesToExchangeCount);

          const nextBag = [...tileBag];
          const drawn: string[] = [];
          for (let i = 0; i < tilesToExchangeCount; i++) {
            drawn.push(nextBag.shift()!);
          }

          nextBag.push(...tilesExchanged);
          // Shuffle bag
          for (let i = nextBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nextBag[i], nextBag[j]] = [nextBag[j], nextBag[i]];
          }

          const nextRack = [...tempRack, ...drawn];
          const updatedPlayers = players.map(p => {
            if (p.id === currentPlayer.id) {
              return { ...p, rack: nextRack };
            }
            return p;
          });

          const historyItem: PlayHistoryItem = {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            word: '',
            score: 0,
            type: 'exchange',
            placedTiles: [],
            turnIndex: history.length
          };

          setPlayers(updatedPlayers);
          setTileBag(nextBag);
          setHistory(prev => [...prev, historyItem]);

          const nextPasses = consecutivePasses + 1;
          setConsecutivePasses(nextPasses);

          setIsAiThinking(false);
          if (nextPasses >= players.length) {
            endGame(updatedPlayers, nextBag);
          } else {
            advanceTurn(updatedPlayers, nextBag, nextPasses);
          }
        } else {
          // AI passes
          const historyItem: PlayHistoryItem = {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            word: '',
            score: 0,
            type: 'pass',
            placedTiles: [],
            turnIndex: history.length
          };

          setHistory(prev => [...prev, historyItem]);

          const nextPasses = consecutivePasses + 1;
          setConsecutivePasses(nextPasses);

          setIsAiThinking(false);
          if (nextPasses >= players.length) {
            endGame(players, tileBag);
          } else {
            advanceTurn(players, tileBag, nextPasses);
          }
        }
      }
    };

    performAiTurn();
  }, [currentTurn, gameStarted, gameEnded, coachAnalysis]);

  // End Game and perform subtraction penalties
  const endGame = (currentPlayers: Player[], currentBag: string[]) => {
    console.log('Ending game. Calculating final penalties...');
    const finalizedPlayers = currentPlayers.map(p => {
      // Deduct 1 point per remaining tile in the rack
      const penalty = p.rack.length;
      return {
        ...p,
        score: Math.max(0, p.score - penalty)
      };
    });

    // Determine winner
    let maxScore = -1;
    let winningPlayerId = null;
    for (const p of finalizedPlayers) {
      if (p.score > maxScore) {
        maxScore = p.score;
        winningPlayerId = p.id;
      }
    }

    setPlayers(finalizedPlayers);
    setGameEnded(true);
    setWinnerId(winningPlayerId);
  };

  // Request a hint (shows best move coordinates and word)
  const getHint = () => {
    if (players[currentTurn]?.isAi || gameEnded) return;
    if (bestMoveRef.current) {
      setHint(bestMoveRef.current);
    }
  };

  // Clear active hint
  const clearHint = () => {
    setHint(null);
  };

  // Preview validation for the placements the user is currently dragging
  const getPlacementsPreview = () => {
    if (placements.length === 0) return null;
    const isFirst = isFirstMoveOfGame();
    return validatePlay(board, placements, isFirst, players[currentTurn]?.rack || []);
  };

  return {
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
    getPlacementsPreview,
    isFirstMoveOfGame
  };
}
