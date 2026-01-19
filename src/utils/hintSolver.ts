import type { Board } from '../types/sudoku.types';

export interface HintResult {
  row: number;
  col: number;
  value: number;
  strategy: string;
  explanation: string;
  affectedCells?: { row: number; col: number }[];
  highlightedRegions?: {
    type: 'row' | 'col' | 'block';
    index: number;
  }[];
}

// Calculate possible candidates for each cell
export const getCandidates = (board: Board, row: number, col: number): Set<number> => {
  if (board[row][col].value !== null) {
    return new Set();
  }

  const candidates = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // Remove numbers in the same row
  for (let c = 0; c < 9; c++) {
    const val = board[row][c].value;
    if (val !== null) {
      candidates.delete(val);
    }
  }

  // Remove numbers in the same column
  for (let r = 0; r < 9; r++) {
    const val = board[r][col].value;
    if (val !== null) {
      candidates.delete(val);
    }
  }

  // Remove numbers in the same 3x3 block
  const blockRow = Math.floor(row / 3) * 3;
  const blockCol = Math.floor(col / 3) * 3;
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      const val = board[r][c].value;
      if (val !== null) {
        candidates.delete(val);
      }
    }
  }

  return candidates;
};

// Get all candidates for the entire board
export const getAllCandidates = (board: Board): Map<string, Set<number>> => {
  const allCandidates = new Map<string, Set<number>>();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null) {
        const key = `${row},${col}`;
        allCandidates.set(key, getCandidates(board, row, col));
      }
    }
  }

  return allCandidates;
};

// Strategy 1: Naked Singles - Cells with only one candidate
export const findNakedSingle = (board: Board): HintResult | null => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null) {
        const candidates = getCandidates(board, row, col);
        if (candidates.size === 1) {
          const value = Array.from(candidates)[0];
          return {
            row,
            col,
            value,
            strategy: 'Naked Single',
            explanation: `Cell at row ${row + 1}, column ${col + 1} can only be ${value}. All other numbers (1-9) are already present in the same row, column, or 3×3 block, leaving only ${value} as a valid option.`,
            affectedCells: [],
            highlightedRegions: [
              { type: 'row', index: row },
              { type: 'col', index: col },
              { type: 'block', index: Math.floor(row / 3) * 3 + Math.floor(col / 3) }
            ]
          };
        }
      }
    }
  }
  return null;
};

// Strategy 2: Hidden Singles - Only place for a number in a row/column/block
export const findHiddenSingle = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check each row
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      const positions: number[] = [];
      for (let col = 0; col < 9; col++) {
        const key = `${row},${col}`;
        if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
          positions.push(col);
        }
      }
      if (positions.length === 1) {
        const col = positions[0];
        return {
          row,
          col,
          value: num,
          strategy: 'Hidden Single (Row)',
          explanation: `In row ${row + 1}, the number ${num} can only go in column ${col + 1}. Even though this cell may have other candidates, ${num} has no other valid position in this row.`,
          affectedCells: Array.from({ length: 9 }, (_, c) => ({ row, col: c })).filter(c => c.col !== col),
          highlightedRegions: [{ type: 'row', index: row }]
        };
      }
    }
  }

  // Check each column
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      const positions: number[] = [];
      for (let row = 0; row < 9; row++) {
        const key = `${row},${col}`;
        if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
          positions.push(row);
        }
      }
      if (positions.length === 1) {
        const row = positions[0];
        return {
          row,
          col,
          value: num,
          strategy: 'Hidden Single (Column)',
          explanation: `In column ${col + 1}, the number ${num} can only go in row ${row + 1}. Even though this cell may have other candidates, ${num} has no other valid position in this column.`,
          affectedCells: Array.from({ length: 9 }, (_, r) => ({ row: r, col })).filter(c => c.row !== row),
          highlightedRegions: [{ type: 'col', index: col }]
        };
      }
    }
  }

  // Check each 3x3 block
  for (let blockIdx = 0; blockIdx < 9; blockIdx++) {
    const blockRow = Math.floor(blockIdx / 3) * 3;
    const blockCol = (blockIdx % 3) * 3;

    for (let num = 1; num <= 9; num++) {
      const positions: { row: number; col: number }[] = [];
      for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
          const key = `${r},${c}`;
          if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
            positions.push({ row: r, col: c });
          }
        }
      }
      if (positions.length === 1) {
        const { row, col } = positions[0];
        return {
          row,
          col,
          value: num,
          strategy: 'Hidden Single (Block)',
          explanation: `In the 3×3 block starting at row ${blockRow + 1}, column ${blockCol + 1}, the number ${num} can only go in row ${row + 1}, column ${col + 1}. ${num} has no other valid position within this block.`,
          affectedCells: [],
          highlightedRegions: [{ type: 'block', index: blockIdx }]
        };
      }
    }
  }

  return null;
};

// Strategy 3: Visualization/Pointing Pairs - Only line for a number in a block
export const findVisualization = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  for (let blockIdx = 0; blockIdx < 9; blockIdx++) {
    const blockRow = Math.floor(blockIdx / 3) * 3;
    const blockCol = (blockIdx % 3) * 3;

    for (let num = 1; num <= 9; num++) {
      const positions: { row: number; col: number }[] = [];
      
      for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
          const key = `${r},${c}`;
          if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
            positions.push({ row: r, col: c });
          }
        }
      }

      // Check if all positions are in the same row
      if (positions.length >= 2 && positions.every(p => p.row === positions[0].row)) {
        const row = positions[0].row;
        // Check if we can eliminate candidates in the same row outside the block
        for (let col = 0; col < 9; col++) {
          const inBlock = col >= blockCol && col < blockCol + 3;
          if (!inBlock) {
            const key = `${row},${col}`;
            if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
              // Found a cell where we can apply this logic
              // But we need to find a naked/hidden single that results from this
              // For now, skip this strategy in favor of simpler ones
            }
          }
        }
      }

      // Check if all positions are in the same column
      if (positions.length >= 2 && positions.every(p => p.col === positions[0].col)) {
        // Similar logic for columns - skip for now in favor of simpler strategies
      }
    }
  }

  return null;
};

// Strategy 4: Naked Pairs - Two cells in same row/col/block with same two candidates
export const findNakedPair = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check rows
  for (let row = 0; row < 9; row++) {
    const cells: { col: number; candidates: Set<number> }[] = [];
    for (let col = 0; col < 9; col++) {
      const key = `${row},${col}`;
      if (allCandidates.has(key)) {
        const candidates = allCandidates.get(key)!;
        if (candidates.size === 2) {
          cells.push({ col, candidates });
        }
      }
    }

    // Find pairs
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const c1 = cells[i];
        const c2 = cells[j];
        const arr1 = Array.from(c1.candidates).sort();
        const arr2 = Array.from(c2.candidates).sort();
        
        if (arr1.length === 2 && arr2.length === 2 && arr1[0] === arr2[0] && arr1[1] === arr2[1]) {
          // Found a naked pair, but we need to find a resulting single
          // For simplicity, we'll skip this for now
        }
      }
    }
  }

  return null;
};

// Main hint function - tries strategies in order of complexity
export const getAdvancedHint = (board: Board, solution: number[][]): HintResult | null => {
  // Try strategies in order of simplicity
  let hint = findNakedSingle(board);
  if (hint) return hint;

  hint = findHiddenSingle(board);
  if (hint) return hint;

  // If no logical hint found, fall back to a random correct cell
  const emptyCells: { row: number; col: number }[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null || board[row][col].value !== solution[row][col]) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return null;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const candidates = getCandidates(board, randomCell.row, randomCell.col);
  const candidatesList = Array.from(candidates).join(', ');

  return {
    row: randomCell.row,
    col: randomCell.col,
    value: solution[randomCell.row][randomCell.col],
    strategy: 'Guided Hint',
    explanation: `This cell requires more advanced techniques to solve logically. The possible candidates are: ${candidatesList}. The correct value is ${solution[randomCell.row][randomCell.col]}.`,
    affectedCells: []
  };
};
