import { isValidWord } from './dictionary';

export interface Tile {
  letter: string; // 'A'-'Z' or 'QU'
  placedBy: number; // player index (0-3)
}

export type BoardCell = Tile[]; // stack of tiles, top is at index BoardCell.length - 1
export type Board = BoardCell[][]; // 10x10 board

export interface Player {
  id: number;
  name: string;
  score: number;
  rack: string[]; // e.g., ['A', 'C', 'QU']
  isAi: boolean;
  aiLevel?: 'easy' | 'medium' | 'hard';
}

export interface PlayPlacement {
  r: number;
  c: number;
  letter: string;
}

export interface PlayHistoryItem {
  playerId: number;
  playerName: string;
  word: string;
  score: number;
  type: 'play' | 'pass' | 'exchange';
  placedTiles: { r: number; c: number; letter: string; prevHeight: number }[];
  turnIndex: number;
}

export interface GameState {
  board: Board;
  players: Player[];
  tileBag: string[];
  currentTurn: number;
  consecutivePasses: number;
  history: PlayHistoryItem[];
  gameEnded: boolean;
  winnerId: number | null;
}

export const BOARD_SIZE = 10;
export const MAX_STACK_HEIGHT = 5;

// Standard English Upwords tile distribution (100 tiles)
export const TILE_DISTRIBUTION: { [letter: string]: number } = {
  E: 8,
  A: 7, I: 7, O: 7,
  S: 6,
  D: 5, L: 5, M: 5, N: 5, R: 5, T: 5, U: 5,
  C: 4,
  B: 3, F: 3, G: 3, H: 3, P: 3,
  K: 2, W: 2, Y: 2,
  J: 1, QU: 1, V: 1, X: 1, Z: 1
};

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push([]);
    }
    board.push(row);
  }
  return board;
}

export function copyBoard(board: Board): Board {
  return board.map(row => row.map(cell => [...cell]));
}

export function getBoardTopLetter(board: Board, r: number, c: number): string | null {
  const cell = board[r]?.[c];
  if (!cell || cell.length === 0) return null;
  return cell[cell.length - 1].letter;
}

export function getBoardStackHeight(board: Board, r: number, c: number): number {
  return board[r]?.[c]?.length || 0;
}

export function generateShuffledBag(): string[] {
  const bag: string[] = [];
  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      bag.push(letter);
    }
  }
  
  // Shuffle bag (Fisher-Yates)
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export interface WordFormed {
  word: string;
  cells: { r: number; c: number }[];
}

/**
 * Validates a play on the board.
 * Returns information about validity, error message, words formed, and score.
 */
export function validatePlay(
  board: Board,
  placements: PlayPlacement[],
  isFirstMove: boolean,
  playerRack: string[]
): {
  isValid: boolean;
  error?: string;
  wordsFormed?: WordFormed[];
  score?: number;
} {
  if (placements.length === 0) {
    return { isValid: false, error: 'No tiles placed.' };
  }

  // 1. Check stack height limits and identical stacking
  for (const p of placements) {
    if (p.r < 0 || p.r >= BOARD_SIZE || p.c < 0 || p.c >= BOARD_SIZE) {
      return { isValid: false, error: 'Tiles placed out of board boundaries.' };
    }
    const height = getBoardStackHeight(board, p.r, p.c);
    if (height >= MAX_STACK_HEIGHT) {
      return { isValid: false, error: `Stack height at (${p.r + 1}, ${p.c + 1}) exceeds maximum height of ${MAX_STACK_HEIGHT}.` };
    }
    const currentLetter = getBoardTopLetter(board, p.r, p.c);
    if (currentLetter === p.letter) {
      return { isValid: false, error: `Cannot stack letter '${p.letter}' on top of an identical letter.` };
    }
  }

  // 2. Check if player has the required letters in their rack
  const rackCopy = [...playerRack];
  for (const p of placements) {
    const index = rackCopy.indexOf(p.letter);
    if (index === -1) {
      return { isValid: false, error: `Player rack does not contain tile '${p.letter}'.` };
    }
    rackCopy.splice(index, 1);
  }

  // 3. Verify all placements are in a single straight line (horizontal or vertical)
  const firstP = placements[0];
  const allSameRow = placements.every(p => p.r === firstP.r);
  const allSameCol = placements.every(p => p.c === firstP.c);

  if (!allSameRow && !allSameCol) {
    return { isValid: false, error: 'Tiles must be placed in a single straight line (horizontal or vertical).' };
  }

  const playDirection: 'horizontal' | 'vertical' | 'both' = 
    placements.length === 1 ? 'both' : (allSameRow ? 'horizontal' : 'vertical');

  const mainRow = firstP.r;
  const mainCol = firstP.c;

  // Let's create a temporary board with the placements applied
  const tempBoard = copyBoard(board);
  for (const p of placements) {
    tempBoard[p.r][p.c].push({ letter: p.letter, placedBy: -1 });
  }

  // 4. Center square requirement for first move
  if (isFirstMove) {
    const centers = [
      { r: 4, c: 4 }, { r: 4, c: 5 },
      { r: 5, c: 4 }, { r: 5, c: 5 }
    ];
    const coversCenter = placements.some(p => centers.some(c => c.r === p.r && c.c === p.c));
    if (!coversCenter) {
      return { isValid: false, error: 'First word must cover at least one of the four center squares.' };
    }
  } else {
    // 5. Connection requirement: at least one placed tile must touch (or stack on) an existing tile
    let connected = false;
    for (const p of placements) {
      // Stacking on an existing tile counts as connected
      if (getBoardStackHeight(board, p.r, p.c) > 0) {
        connected = true;
        break;
      }
      // Check adjacent neighbors
      const neighbors = [
        { r: p.r - 1, c: p.c },
        { r: p.r + 1, c: p.c },
        { r: p.r, c: p.c - 1 },
        { r: p.r, c: p.c + 1 }
      ];
      for (const n of neighbors) {
        if (n.r >= 0 && n.r < BOARD_SIZE && n.c >= 0 && n.c < BOARD_SIZE) {
          if (getBoardStackHeight(board, n.r, n.c) > 0) {
            connected = true;
            break;
          }
        }
      }
      if (connected) break;
    }
    if (!connected) {
      return { isValid: false, error: 'Placements must connect with existing tiles.' };
    }
  }

  // 6. Check that we don't cover a word entirely
  // Find all words on the board before the move
  if (!isFirstMove) {
    const existingWords = findWordsOnBoard(board);
    const placedSet = new Set(placements.map(p => `${p.r},${p.c}`));
    for (const word of existingWords) {
      const allCovered = word.cells.every(cell => placedSet.has(`${cell.r},${cell.c}`));
      if (allCovered) {
        return { isValid: false, error: `Illegal stack: you cannot completely cover the word '${word.word}'. At least one letter must remain visible.` };
      }
    }
  }

  // Helper to extract word string and coordinates from board
  const getWordAt = (r: number, c: number, dir: 'h' | 'v'): WordFormed | null => {
    let start = dir === 'h' ? c : r;
    let end = dir === 'h' ? c : r;

    // Scan backwards
    while (start > 0) {
      const prev = start - 1;
      const cell = dir === 'h' ? tempBoard[r][prev] : tempBoard[prev][c];
      if (cell.length === 0) break;
      start = prev;
    }

    // Scan forwards
    while (end < BOARD_SIZE - 1) {
      const next = end + 1;
      const cell = dir === 'h' ? tempBoard[r][next] : tempBoard[next][c];
      if (cell.length === 0) break;
      end = next;
    }

    if (start === end) return null; // Single letter is not a word

    const cells: { r: number; c: number }[] = [];
    let wordStr = '';
    for (let idx = start; idx <= end; idx++) {
      const cellRow = dir === 'h' ? r : idx;
      const cellCol = dir === 'h' ? idx : c;
      const letter = getBoardTopLetter(tempBoard, cellRow, cellCol);
      if (letter) {
        wordStr += letter;
        cells.push({ r: cellRow, c: cellCol });
      }
    }

    return { word: wordStr, cells };
  };

  // 7. Find all words formed
  const wordsFormed: WordFormed[] = [];
  const wordSignatures = new Set<string>(); // to prevent duplicates

  const addWord = (wf: WordFormed) => {
    const sig = `${wf.cells[0].r},${wf.cells[0].c}_${wf.cells[wf.cells.length - 1].r},${wf.cells[wf.cells.length - 1].c}`;
    if (!wordSignatures.has(sig)) {
      wordSignatures.add(sig);
      wordsFormed.push(wf);
    }
  };

  // 8. Find gaps in placing:
  // For horizontal play, verify that all cells in [minCol, maxCol] are occupied.
  // For vertical play, verify that all cells in [minRow, maxRow] are occupied.
  if (playDirection === 'horizontal') {
    const cols = placements.map(p => p.c);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    for (let col = minCol; col <= maxCol; col++) {
      if (getBoardStackHeight(tempBoard, mainRow, col) === 0) {
        return { isValid: false, error: 'Horizontal placements cannot have gaps.' };
      }
    }
    // Main word formed
    const mainW = getWordAt(mainRow, minCol, 'h');
    if (mainW) addWord(mainW);
  } else if (playDirection === 'vertical') {
    const rows = placements.map(p => p.r);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    for (let row = minRow; row <= maxRow; row++) {
      if (getBoardStackHeight(tempBoard, row, mainCol) === 0) {
        return { isValid: false, error: 'Vertical placements cannot have gaps.' };
      }
    }
    // Main word formed
    const mainW = getWordAt(minRow, mainCol, 'v');
    if (mainW) addWord(mainW);
  } else {
    // Single tile placement
    const mainH = getWordAt(mainRow, mainCol, 'h');
    const mainV = getWordAt(mainRow, mainCol, 'v');
    if (mainH) addWord(mainH);
    if (mainV) addWord(mainV);
  }

  // 9. Find perpendicular (cross) words for each placement
  for (const p of placements) {
    if (playDirection === 'horizontal') {
      const crossW = getWordAt(p.r, p.c, 'v');
      if (crossW) addWord(crossW);
    } else if (playDirection === 'vertical') {
      const crossW = getWordAt(p.r, p.c, 'h');
      if (crossW) addWord(crossW);
    } else {
      // Handled above in single tile check
    }
  }

  if (wordsFormed.length === 0) {
    return { isValid: false, error: 'Placements do not form any words.' };
  }

  // 10. Check that all words are valid dictionary words
  for (const wf of wordsFormed) {
    if (!isValidWord(wf.word)) {
      return { isValid: false, error: `'${wf.word}' is not a valid word.` };
    }
  }

  // Calculate score
  const score = calculateScore(tempBoard, placements, wordsFormed);

  return {
    isValid: true,
    wordsFormed,
    score
  };
}

/**
 * Calculates score for a play.
 */
export function calculateScore(
  board: Board,
  placements: PlayPlacement[],
  wordsFormed: WordFormed[]
): number {
  let totalScore = 0;

  for (const wf of wordsFormed) {
    let wordScore = 0;
    let isFlat = true;

    // Check if the entire word is 1 tile high
    for (const cell of wf.cells) {
      if (getBoardStackHeight(board, cell.r, cell.c) > 1) {
        isFlat = false;
      }
    }

    // Accumulate base points
    if (isFlat) {
      // 2 points per tile for flat words
      wordScore += wf.cells.length * 2;
    } else {
      // 1 point per tile in the stack for stacked words
      for (const cell of wf.cells) {
        wordScore += getBoardStackHeight(board, cell.r, cell.c);
      }
    }

    // Add Qu bonus: 2 extra points per QU tile
    for (const cell of wf.cells) {
      const cellTop = getBoardTopLetter(board, cell.r, cell.c);
      if (cellTop === 'QU') {
        wordScore += 2;
      }
    }

    totalScore += wordScore;
  }

  // 7-tile bonus: 20 points
  if (placements.length === 7) {
    totalScore += 20;
  }

  return totalScore;
}

/**
 * Scans the board to find all contiguous words of length >= 2
 */
export function findWordsOnBoard(board: Board): WordFormed[] {
  const words: WordFormed[] = [];
  const wordSignatures = new Set<string>();

  const addWord = (wf: WordFormed) => {
    const sig = `${wf.cells[0].r},${wf.cells[0].c}_${wf.cells[wf.cells.length - 1].r},${wf.cells[wf.cells.length - 1].c}`;
    if (!wordSignatures.has(sig)) {
      wordSignatures.add(sig);
      words.push(wf);
    }
  };

  // Horizontal scan
  for (let r = 0; r < BOARD_SIZE; r++) {
    let currentWord: { r: number; c: number }[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getBoardStackHeight(board, r, c) > 0) {
        currentWord.push({ r, c });
      } else {
        if (currentWord.length >= 2) {
          const wordStr = currentWord.map(cell => getBoardTopLetter(board, cell.r, cell.c)).join('');
          addWord({ word: wordStr, cells: [...currentWord] });
        }
        currentWord = [];
      }
    }
    if (currentWord.length >= 2) {
      const wordStr = currentWord.map(cell => getBoardTopLetter(board, cell.r, cell.c)).join('');
      addWord({ word: wordStr, cells: currentWord });
    }
  }

  // Vertical scan
  for (let c = 0; c < BOARD_SIZE; c++) {
    let currentWord: { r: number; c: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (getBoardStackHeight(board, r, c) > 0) {
        currentWord.push({ r, c });
      } else {
        if (currentWord.length >= 2) {
          const wordStr = currentWord.map(cell => getBoardTopLetter(board, cell.r, cell.c)).join('');
          addWord({ word: wordStr, cells: [...currentWord] });
        }
        currentWord = [];
      }
    }
    if (currentWord.length >= 2) {
      const wordStr = currentWord.map(cell => getBoardTopLetter(board, cell.r, cell.c)).join('');
      addWord({ word: wordStr, cells: currentWord });
    }
  }

  return words;
}
