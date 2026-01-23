import type { Board, Difficulty } from '../types/sudoku.types';

// Check if a number is valid in a specific position
export const isValidMove = (
  board: number[][],
  row: number,
  col: number,
  num: number
): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false;
    }
  }

  return true;
};

// Solve sudoku using backtracking
export const solveSudoku = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidMove(board, row, col, num)) {
            board[row][col] = num;

            if (solveSudoku(board)) {
              return true;
            }

            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

// Generate a complete valid sudoku board
export const generateCompleteSudoku = (): number[][] => {
  const board: number[][] = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes first (they don't affect each other)
  for (let box = 0; box < 9; box += 3) {
    fillBox(board, box, box);
  }

  // Solve the rest
  solveSudoku(board);

  return board;
};

const fillBox = (board: number[][], row: number, col: number): void => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffleArray(numbers);

  let idx = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[row + i][col + j] = numbers[idx++];
    }
  }
};

const shuffleArray = <T>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// Remove numbers from a complete board to create a puzzle
export const createPuzzle = (
  completedBoard: number[][],
  difficulty: Difficulty
): number[][] => {
  const board = completedBoard.map(row => [...row]);
  
  const cellsToRemove = {
    easy: 35,
    medium: 45,
    hard: 55
  }[difficulty];

  let removed = 0;
  const attempts = cellsToRemove * 2;

  for (let i = 0; i < attempts && removed < cellsToRemove; i++) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (board[row][col] !== 0) {
      const backup = board[row][col];
      board[row][col] = 0;

      // Ensure the puzzle still has a unique solution
      const testBoard = board.map(r => [...r]);
      if (hasUniqueSolution(testBoard)) {
        removed++;
      } else {
        board[row][col] = backup;
      }
    }
  }

  return board;
};

// Check if a puzzle has a unique solution
const hasUniqueSolution = (board: number[][]): boolean => {
  const solutions: number[][] = [];
  countSolutions(board.map(row => [...row]), solutions, 2);
  return solutions.length === 1;
};

const countSolutions = (
  board: number[][],
  solutions: number[][],
  limit: number
): void => {
  if (solutions.length >= limit) return;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidMove(board, row, col, num)) {
            board[row][col] = num;
            countSolutions(board, solutions, limit);
            board[row][col] = 0;

            if (solutions.length >= limit) return;
          }
        }
        return;
      }
    }
  }

  // Found a solution
  const solutionCopy = board.map(row => [...row]);
  solutions.push(solutionCopy as unknown as number[]);
};

// Generate a new game
export const generateGame = (
  difficulty: Difficulty
): { puzzle: number[][]; solution: number[][] } => {
  const solution = generateCompleteSudoku();
  const puzzle = createPuzzle(solution, difficulty);

  return { puzzle, solution };
};

// Convert number board to CellData board
export const convertToBoard = (
  puzzle: number[][]
): Board => {
  return puzzle.map(row =>
    row.map(value => ({
      value: value === 0 ? null : value,
      isInitial: value !== 0,
      notes: new Set<number>(),
      isIncorrect: false
    }))
  );
};

// Check if the board is complete and correct
export const isBoardComplete = (board: Board, solution: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
};

// Get a hint (fill one random empty cell)
export const getHint = (board: Board, solution: number[][]): { row: number; col: number } | null => {
  const emptyCells: { row: number; col: number }[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null || board[row][col].value !== solution[row][col]) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
};

// Check if a value creates a duplicate in row, col, or box
export const hasDuplicate = (
  board: Board,
  row: number,
  col: number
): boolean => {
  const value = board[row][col].value;
  if (value === null) return false;

  // Check row for duplicates
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c].value === value) {
      return true;
    }
  }

  // Check column for duplicates
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col].value === value) {
      return true;
    }
  }

  // Check 3x3 box for duplicates
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c].value === value) {
        return true;
      }
    }
  }

  return false;
};

// Recalculate isIncorrect flags for all cells in the board
export const recalculateIncorrectCells = (
  board: Board,
  solution: number[][],
  showIncorrect: boolean
): void => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null) {
        board[row][col].isIncorrect = false;
      } else {
        const isDuplicate = hasDuplicate(board, row, col);
        const isIncorrectValue = showIncorrect && !validateCell(board, solution, row, col);
        board[row][col].isIncorrect = isDuplicate || isIncorrectValue;
      }
    }
  }
};

// Validate current cell against solution
export const validateCell = (
  board: Board,
  solution: number[][],
  row: number,
  col: number
): boolean => {
  const value = board[row][col].value;
  if (value === null) return true;
  return value === solution[row][col];
};
