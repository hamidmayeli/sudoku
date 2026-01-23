import type { Board } from '../types/sudoku.types';

export interface HintResult {
  row: number;
  col: number;
  value: number;
  invalidNotes?: number[]; // For remove-note action, all notes to remove from primary cell
  allCellsWithInvalidNotes?: { row: number; col: number; invalidNotes: number[] }[]; // All cells with invalid notes
  strategy: string;
  explanation: string;
  action?: 'add-value' | 'add-note' | 'remove-note';
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
            action: 'add-value',
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
          action: 'add-value',
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
          action: 'add-value',
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
          action: 'add-value',
          affectedCells: [],
          highlightedRegions: [{ type: 'block', index: blockIdx }]
        };
      }
    }
  }

  return null;
};

// Helper: Apply candidate elimination and find if it leads to a single
const applyCandidateElimination = (
  allCandidates: Map<string, Set<number>>,
  eliminationMap: Map<string, Set<number>>
): HintResult | null => {
  // Create a copy of candidates with eliminations applied
  const updatedCandidates = new Map(allCandidates);
  
  for (const [key, toRemove] of eliminationMap) {
    if (updatedCandidates.has(key)) {
      const current = new Set(updatedCandidates.get(key)!);
      toRemove.forEach(num => current.delete(num));
      updatedCandidates.set(key, current);
      
      // Check if this creates a naked single
      if (current.size === 1) {
        const [row, col] = key.split(',').map(Number);
        const value = Array.from(current)[0];
        return { row, col, value } as HintResult;
      }
    }
  }
  
  return null;
};

// Strategy 3: Pointing Pairs/Triples (Candidate Lines)
export const findPointingPair = (board: Board): HintResult | null => {
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
      if (positions.length >= 2 && positions.length <= 3 && positions.every(p => p.row === positions[0].row)) {
        const row = positions[0].row;
        const eliminationMap = new Map<string, Set<number>>();
        
        // Check if we can eliminate candidates in the same row outside the block
        for (let col = 0; col < 9; col++) {
          const inBlock = col >= blockCol && col < blockCol + 3;
          if (!inBlock) {
            const key = `${row},${col}`;
            if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
              eliminationMap.set(key, new Set([num]));
            }
          }
        }
        
        if (eliminationMap.size > 0) {
          const result = applyCandidateElimination(allCandidates, eliminationMap);
          if (result) {
            return {
              ...result,
              strategy: 'Pointing Pair/Triple (Row)',
              explanation: `In block at row ${blockRow + 1}, column ${blockCol + 1}, the number ${num} can only appear in row ${row + 1}. This means ${num} cannot be in row ${row + 1} outside this block. After eliminating these candidates, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
              affectedCells: Array.from(eliminationMap.keys()).map(k => {
                const [r, c] = k.split(',').map(Number);
                return { row: r, col: c };
              }),
              highlightedRegions: [{ type: 'row', index: row }, { type: 'block', index: blockIdx }]
            };
          }
        }
      }

      // Check if all positions are in the same column
      if (positions.length >= 2 && positions.length <= 3 && positions.every(p => p.col === positions[0].col)) {
        const col = positions[0].col;
        const eliminationMap = new Map<string, Set<number>>();
        
        for (let row = 0; row < 9; row++) {
          const inBlock = row >= blockRow && row < blockRow + 3;
          if (!inBlock) {
            const key = `${row},${col}`;
            if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
              eliminationMap.set(key, new Set([num]));
            }
          }
        }
        
        if (eliminationMap.size > 0) {
          const result = applyCandidateElimination(allCandidates, eliminationMap);
          if (result) {
            return {
              ...result,
              strategy: 'Pointing Pair/Triple (Column)',
              explanation: `In block at row ${blockRow + 1}, column ${blockCol + 1}, the number ${num} can only appear in column ${col + 1}. This means ${num} cannot be in column ${col + 1} outside this block. After eliminating these candidates, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
              affectedCells: Array.from(eliminationMap.keys()).map(k => {
                const [r, c] = k.split(',').map(Number);
                return { row: r, col: c };
              }),
              highlightedRegions: [{ type: 'col', index: col }, { type: 'block', index: blockIdx }]
            };
          }
        }
      }
    }
  }

  return null;
};

// Strategy 4: Box/Line Reduction (Omission)
export const findBoxLineReduction = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      const positions: number[] = [];
      
      for (let col = 0; col < 9; col++) {
        const key = `${row},${col}`;
        if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
          positions.push(col);
        }
      }

      // Check if all positions are in same block
      if (positions.length >= 2 && positions.length <= 3) {
        const blockCol = Math.floor(positions[0] / 3) * 3;
        if (positions.every(col => Math.floor(col / 3) * 3 === blockCol)) {
          const blockRow = Math.floor(row / 3) * 3;
          const blockIdx = Math.floor(blockRow / 3) * 3 + Math.floor(blockCol / 3);
          const eliminationMap = new Map<string, Set<number>>();
          
          // Remove from other cells in same block
          for (let r = blockRow; r < blockRow + 3; r++) {
            if (r !== row) {
              for (let c = blockCol; c < blockCol + 3; c++) {
                const key = `${r},${c}`;
                if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
                  eliminationMap.set(key, new Set([num]));
                }
              }
            }
          }
          
          if (eliminationMap.size > 0) {
            const result = applyCandidateElimination(allCandidates, eliminationMap);
            if (result) {
              return {
                ...result,
                strategy: 'Box/Line Reduction (Row)',
                explanation: `In row ${row + 1}, the number ${num} only appears within the block at row ${blockRow + 1}, column ${blockCol + 1}. This means ${num} cannot appear in other rows of this block. After eliminating these candidates, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                affectedCells: Array.from(eliminationMap.keys()).map(k => {
                  const [r, c] = k.split(',').map(Number);
                  return { row: r, col: c };
                }),
                highlightedRegions: [{ type: 'row', index: row }, { type: 'block', index: blockIdx }]
              };
            }
          }
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      const positions: number[] = [];
      
      for (let row = 0; row < 9; row++) {
        const key = `${row},${col}`;
        if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
          positions.push(row);
        }
      }

      if (positions.length >= 2 && positions.length <= 3) {
        const blockRow = Math.floor(positions[0] / 3) * 3;
        if (positions.every(row => Math.floor(row / 3) * 3 === blockRow)) {
          const blockCol = Math.floor(col / 3) * 3;
          const blockIdx = Math.floor(blockRow / 3) * 3 + Math.floor(blockCol / 3);
          const eliminationMap = new Map<string, Set<number>>();
          
          for (let r = blockRow; r < blockRow + 3; r++) {
            for (let c = blockCol; c < blockCol + 3; c++) {
              if (c !== col) {
                const key = `${r},${c}`;
                if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
                  eliminationMap.set(key, new Set([num]));
                }
              }
            }
          }
          
          if (eliminationMap.size > 0) {
            const result = applyCandidateElimination(allCandidates, eliminationMap);
            if (result) {
              return {
                ...result,
                strategy: 'Box/Line Reduction (Column)',
                explanation: `In column ${col + 1}, the number ${num} only appears within the block at row ${blockRow + 1}, column ${blockCol + 1}. This means ${num} cannot appear in other columns of this block. After eliminating these candidates, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                affectedCells: Array.from(eliminationMap.keys()).map(k => {
                  const [r, c] = k.split(',').map(Number);
                  return { row: r, col: c };
                }),
                highlightedRegions: [{ type: 'col', index: col }, { type: 'block', index: blockIdx }]
              };
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 5: Naked Pairs
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
        
        if (arr1[0] === arr2[0] && arr1[1] === arr2[1]) {
          const nums = new Set(arr1);
          const eliminationMap = new Map<string, Set<number>>();
          
          // Eliminate from other cells in row
          for (let col = 0; col < 9; col++) {
            if (col !== c1.col && col !== c2.col) {
              const key = `${row},${col}`;
              if (allCandidates.has(key)) {
                const toRemove = new Set<number>();
                nums.forEach(n => {
                  if (allCandidates.get(key)!.has(n)) {
                    toRemove.add(n);
                  }
                });
                if (toRemove.size > 0) {
                  eliminationMap.set(key, toRemove);
                }
              }
            }
          }
          
          if (eliminationMap.size > 0) {
            const result = applyCandidateElimination(allCandidates, eliminationMap);
            if (result) {
              return {
                ...result,
                strategy: 'Naked Pair (Row)',
                explanation: `In row ${row + 1}, cells at columns ${c1.col + 1} and ${c2.col + 1} form a naked pair with candidates ${arr1.join(' and ')}. These two numbers must go in these two cells, so they can be eliminated from all other cells in this row. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                affectedCells: [{ row, col: c1.col }, { row, col: c2.col }],
                highlightedRegions: [{ type: 'row', index: row }]
              };
            }
          }
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const cells: { row: number; candidates: Set<number> }[] = [];
    for (let row = 0; row < 9; row++) {
      const key = `${row},${col}`;
      if (allCandidates.has(key)) {
        const candidates = allCandidates.get(key)!;
        if (candidates.size === 2) {
          cells.push({ row, candidates });
        }
      }
    }

    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const c1 = cells[i];
        const c2 = cells[j];
        const arr1 = Array.from(c1.candidates).sort();
        const arr2 = Array.from(c2.candidates).sort();
        
        if (arr1[0] === arr2[0] && arr1[1] === arr2[1]) {
          const nums = new Set(arr1);
          const eliminationMap = new Map<string, Set<number>>();
          
          for (let row = 0; row < 9; row++) {
            if (row !== c1.row && row !== c2.row) {
              const key = `${row},${col}`;
              if (allCandidates.has(key)) {
                const toRemove = new Set<number>();
                nums.forEach(n => {
                  if (allCandidates.get(key)!.has(n)) {
                    toRemove.add(n);
                  }
                });
                if (toRemove.size > 0) {
                  eliminationMap.set(key, toRemove);
                }
              }
            }
          }
          
          if (eliminationMap.size > 0) {
            const result = applyCandidateElimination(allCandidates, eliminationMap);
            if (result) {
              return {
                ...result,
                strategy: 'Naked Pair (Column)',
                explanation: `In column ${col + 1}, cells at rows ${c1.row + 1} and ${c2.row + 1} form a naked pair with candidates ${arr1.join(' and ')}. These two numbers must go in these two cells, so they can be eliminated from all other cells in this column. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                affectedCells: [{ row: c1.row, col }, { row: c2.row, col }],
                highlightedRegions: [{ type: 'col', index: col }]
              };
            }
          }
        }
      }
    }
  }

  // Check blocks
  for (let blockIdx = 0; blockIdx < 9; blockIdx++) {
    const blockRow = Math.floor(blockIdx / 3) * 3;
    const blockCol = (blockIdx % 3) * 3;
    const cells: { row: number; col: number; candidates: Set<number> }[] = [];
    
    for (let r = blockRow; r < blockRow + 3; r++) {
      for (let c = blockCol; c < blockCol + 3; c++) {
        const key = `${r},${c}`;
        if (allCandidates.has(key)) {
          const candidates = allCandidates.get(key)!;
          if (candidates.size === 2) {
            cells.push({ row: r, col: c, candidates });
          }
        }
      }
    }

    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const c1 = cells[i];
        const c2 = cells[j];
        const arr1 = Array.from(c1.candidates).sort();
        const arr2 = Array.from(c2.candidates).sort();
        
        if (arr1[0] === arr2[0] && arr1[1] === arr2[1]) {
          const nums = new Set(arr1);
          const eliminationMap = new Map<string, Set<number>>();
          
          for (let r = blockRow; r < blockRow + 3; r++) {
            for (let c = blockCol; c < blockCol + 3; c++) {
              if ((r !== c1.row || c !== c1.col) && (r !== c2.row || c !== c2.col)) {
                const key = `${r},${c}`;
                if (allCandidates.has(key)) {
                  const toRemove = new Set<number>();
                  nums.forEach(n => {
                    if (allCandidates.get(key)!.has(n)) {
                      toRemove.add(n);
                    }
                  });
                  if (toRemove.size > 0) {
                    eliminationMap.set(key, toRemove);
                  }
                }
              }
            }
          }
          
          if (eliminationMap.size > 0) {
            const result = applyCandidateElimination(allCandidates, eliminationMap);
            if (result) {
              return {
                ...result,
                strategy: 'Naked Pair (Block)',
                explanation: `In block at row ${blockRow + 1}, column ${blockCol + 1}, cells at (${c1.row + 1},${c1.col + 1}) and (${c2.row + 1},${c2.col + 1}) form a naked pair with candidates ${arr1.join(' and ')}. These two numbers must go in these two cells, so they can be eliminated from all other cells in this block. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                affectedCells: [{ row: c1.row, col: c1.col }, { row: c2.row, col: c2.col }],
                highlightedRegions: [{ type: 'block', index: blockIdx }]
              };
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 6: Hidden Pairs
export const findHiddenPair = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num1 = 1; num1 <= 8; num1++) {
      for (let num2 = num1 + 1; num2 <= 9; num2++) {
        const positions: number[] = [];
        
        for (let col = 0; col < 9; col++) {
          const key = `${row},${col}`;
          if (allCandidates.has(key)) {
            const cands = allCandidates.get(key)!;
            if (cands.has(num1) || cands.has(num2)) {
              positions.push(col);
            }
          }
        }
        
        // If exactly 2 cells contain these numbers and nowhere else
        if (positions.length === 2) {
          const col1 = positions[0];
          const col2 = positions[1];
          const key1 = `${row},${col1}`;
          const key2 = `${row},${col2}`;
          const cands1 = allCandidates.get(key1)!;
          const cands2 = allCandidates.get(key2)!;
          
          // Both cells must have both numbers
          if (cands1.has(num1) && cands1.has(num2) && cands2.has(num1) && cands2.has(num2)) {
            // Check if either cell has other candidates
            if (cands1.size > 2 || cands2.size > 2) {
              const eliminationMap = new Map<string, Set<number>>();
              
              if (cands1.size > 2) {
                const toRemove = new Set<number>();
                cands1.forEach(n => {
                  if (n !== num1 && n !== num2) toRemove.add(n);
                });
                eliminationMap.set(key1, toRemove);
              }
              
              if (cands2.size > 2) {
                const toRemove = new Set<number>();
                cands2.forEach(n => {
                  if (n !== num1 && n !== num2) toRemove.add(n);
                });
                eliminationMap.set(key2, toRemove);
              }
              
              if (eliminationMap.size > 0) {
                const result = applyCandidateElimination(allCandidates, eliminationMap);
                if (result) {
                  return {
                    ...result,
                    strategy: 'Hidden Pair (Row)',
                    explanation: `In row ${row + 1}, the numbers ${num1} and ${num2} can only appear in columns ${col1 + 1} and ${col2 + 1}. All other candidates can be removed from these cells. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                    affectedCells: [{ row, col: col1 }, { row, col: col2 }],
                    highlightedRegions: [{ type: 'row', index: row }]
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 7: Naked Triples
export const findNakedTriple = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check rows
  for (let row = 0; row < 9; row++) {
    const cells: { col: number; candidates: Set<number> }[] = [];
    for (let col = 0; col < 9; col++) {
      const key = `${row},${col}`;
      if (allCandidates.has(key)) {
        const candidates = allCandidates.get(key)!;
        if (candidates.size === 2 || candidates.size === 3) {
          cells.push({ col, candidates });
        }
      }
    }

    // Find triples
    for (let i = 0; i < cells.length - 2; i++) {
      for (let j = i + 1; j < cells.length - 1; j++) {
        for (let k = j + 1; k < cells.length; k++) {
          const union = new Set([
            ...Array.from(cells[i].candidates),
            ...Array.from(cells[j].candidates),
            ...Array.from(cells[k].candidates)
          ]);
          
          if (union.size === 3) {
            const nums = Array.from(union);
            const eliminationMap = new Map<string, Set<number>>();
            
            for (let col = 0; col < 9; col++) {
              if (col !== cells[i].col && col !== cells[j].col && col !== cells[k].col) {
                const key = `${row},${col}`;
                if (allCandidates.has(key)) {
                  const toRemove = new Set<number>();
                  nums.forEach(n => {
                    if (allCandidates.get(key)!.has(n)) {
                      toRemove.add(n);
                    }
                  });
                  if (toRemove.size > 0) {
                    eliminationMap.set(key, toRemove);
                  }
                }
              }
            }
            
            if (eliminationMap.size > 0) {
              const result = applyCandidateElimination(allCandidates, eliminationMap);
              if (result) {
                return {
                  ...result,
                  strategy: 'Naked Triple (Row)',
                  explanation: `In row ${row + 1}, cells at columns ${cells[i].col + 1}, ${cells[j].col + 1}, and ${cells[k].col + 1} form a naked triple with candidates ${nums.join(', ')}. These three numbers must go in these three cells, so they can be eliminated from all other cells in this row. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                  affectedCells: [
                    { row, col: cells[i].col },
                    { row, col: cells[j].col },
                    { row, col: cells[k].col }
                  ],
                  highlightedRegions: [{ type: 'row', index: row }]
                };
              }
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 8: Naked Quads
export const findNakedQuad = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check rows (simplified - only checking rows for performance)
  for (let row = 0; row < 9; row++) {
    const cells: { col: number; candidates: Set<number> }[] = [];
    for (let col = 0; col < 9; col++) {
      const key = `${row},${col}`;
      if (allCandidates.has(key)) {
        const candidates = allCandidates.get(key)!;
        if (candidates.size >= 2 && candidates.size <= 4) {
          cells.push({ col, candidates });
        }
      }
    }

    if (cells.length >= 4) {
      // Find quads
      for (let i = 0; i < cells.length - 3; i++) {
        for (let j = i + 1; j < cells.length - 2; j++) {
          for (let k = j + 1; k < cells.length - 1; k++) {
            for (let l = k + 1; l < cells.length; l++) {
              const union = new Set([
                ...Array.from(cells[i].candidates),
                ...Array.from(cells[j].candidates),
                ...Array.from(cells[k].candidates),
                ...Array.from(cells[l].candidates)
              ]);
              
              if (union.size === 4) {
                const nums = Array.from(union);
                const eliminationMap = new Map<string, Set<number>>();
                
                for (let col = 0; col < 9; col++) {
                  if (col !== cells[i].col && col !== cells[j].col && 
                      col !== cells[k].col && col !== cells[l].col) {
                    const key = `${row},${col}`;
                    if (allCandidates.has(key)) {
                      const toRemove = new Set<number>();
                      nums.forEach(n => {
                        if (allCandidates.get(key)!.has(n)) {
                          toRemove.add(n);
                        }
                      });
                      if (toRemove.size > 0) {
                        eliminationMap.set(key, toRemove);
                      }
                    }
                  }
                }
                
                if (eliminationMap.size > 0) {
                  const result = applyCandidateElimination(allCandidates, eliminationMap);
                  if (result) {
                    return {
                      ...result,
                      strategy: 'Naked Quad (Row)',
                      explanation: `In row ${row + 1}, four cells form a naked quad with candidates ${nums.join(', ')}. These four numbers must go in these four cells, so they can be eliminated from all other cells in this row. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                      affectedCells: [
                        { row, col: cells[i].col },
                        { row, col: cells[j].col },
                        { row, col: cells[k].col },
                        { row, col: cells[l].col }
                      ],
                      highlightedRegions: [{ type: 'row', index: row }]
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 9: X-Wing
export const findXWing = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check rows
  for (let num = 1; num <= 9; num++) {
    const rowsWithNum: { row: number; cols: number[] }[] = [];
    
    for (let row = 0; row < 9; row++) {
      const cols: number[] = [];
      for (let col = 0; col < 9; col++) {
        const key = `${row},${col}`;
        if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
          cols.push(col);
        }
      }
      if (cols.length === 2) {
        rowsWithNum.push({ row, cols });
      }
    }
    
    // Find X-Wing pattern
    for (let i = 0; i < rowsWithNum.length - 1; i++) {
      for (let j = i + 1; j < rowsWithNum.length; j++) {
        const r1 = rowsWithNum[i];
        const r2 = rowsWithNum[j];
        
        if (r1.cols[0] === r2.cols[0] && r1.cols[1] === r2.cols[1]) {
          // Found X-Wing
          const col1 = r1.cols[0];
          const col2 = r1.cols[1];
          const eliminationMap = new Map<string, Set<number>>();
          
          // Eliminate from columns
          for (let row = 0; row < 9; row++) {
            if (row !== r1.row && row !== r2.row) {
              const key1 = `${row},${col1}`;
              const key2 = `${row},${col2}`;
              
              if (allCandidates.has(key1) && allCandidates.get(key1)!.has(num)) {
                eliminationMap.set(key1, new Set([num]));
              }
              if (allCandidates.has(key2) && allCandidates.get(key2)!.has(num)) {
                eliminationMap.set(key2, new Set([num]));
              }
            }
          }
          
          if (eliminationMap.size > 0) {
            const result = applyCandidateElimination(allCandidates, eliminationMap);
            if (result) {
              return {
                ...result,
                strategy: 'X-Wing',
                explanation: `An X-Wing pattern was found for number ${num} in rows ${r1.row + 1} and ${r2.row + 1}, columns ${col1 + 1} and ${col2 + 1}. This forms a rectangle where ${num} must occupy opposite corners. Therefore, ${num} can be eliminated from columns ${col1 + 1} and ${col2 + 1} in all other rows. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                affectedCells: [
                  { row: r1.row, col: col1 },
                  { row: r1.row, col: col2 },
                  { row: r2.row, col: col1 },
                  { row: r2.row, col: col2 }
                ],
                highlightedRegions: [
                  { type: 'row', index: r1.row },
                  { type: 'row', index: r2.row },
                  { type: 'col', index: col1 },
                  { type: 'col', index: col2 }
                ]
              };
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 10: Swordfish
export const findSwordfish = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Check rows (simplified)
  for (let num = 1; num <= 9; num++) {
    const rowsWithNum: { row: number; cols: number[] }[] = [];
    
    for (let row = 0; row < 9; row++) {
      const cols: number[] = [];
      for (let col = 0; col < 9; col++) {
        const key = `${row},${col}`;
        if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
          cols.push(col);
        }
      }
      if (cols.length >= 2 && cols.length <= 3) {
        rowsWithNum.push({ row, cols });
      }
    }
    
    // Find Swordfish pattern (3 rows)
    if (rowsWithNum.length >= 3) {
      for (let i = 0; i < rowsWithNum.length - 2; i++) {
        for (let j = i + 1; j < rowsWithNum.length - 1; j++) {
          for (let k = j + 1; k < rowsWithNum.length; k++) {
            const allCols = new Set([
              ...rowsWithNum[i].cols,
              ...rowsWithNum[j].cols,
              ...rowsWithNum[k].cols
            ]);
            
            if (allCols.size === 3) {
              const cols = Array.from(allCols);
              const rows = [rowsWithNum[i].row, rowsWithNum[j].row, rowsWithNum[k].row];
              const eliminationMap = new Map<string, Set<number>>();
              
              // Eliminate from columns
              for (let row = 0; row < 9; row++) {
                if (!rows.includes(row)) {
                  cols.forEach(col => {
                    const key = `${row},${col}`;
                    if (allCandidates.has(key) && allCandidates.get(key)!.has(num)) {
                      eliminationMap.set(key, new Set([num]));
                    }
                  });
                }
              }
              
              if (eliminationMap.size > 0) {
                const result = applyCandidateElimination(allCandidates, eliminationMap);
                if (result) {
                  return {
                    ...result,
                    strategy: 'Swordfish',
                    explanation: `A Swordfish pattern was found for number ${num} in rows ${rows.map(r => r + 1).join(', ')} and columns ${cols.map(c => c + 1).join(', ')}. This advanced pattern means ${num} must occupy specific positions, allowing elimination from other cells in these columns. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                    affectedCells: [],
                    highlightedRegions: []
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 11: XY-Wing
export const findXYWing = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Find all cells with exactly 2 candidates (bi-value cells)
  const biValueCells: { row: number; col: number; candidates: number[] }[] = [];
  allCandidates.forEach((cands, key) => {
    if (cands.size === 2) {
      const [row, col] = key.split(',').map(Number);
      biValueCells.push({ row, col, candidates: Array.from(cands) });
    }
  });

  // Try to find XY-Wing pattern
  for (const pivot of biValueCells) {
    const [X, Y] = pivot.candidates;
    
    // Find wings that share a candidate with pivot
    const wings: typeof biValueCells = [];
    
    for (const cell of biValueCells) {
      if (cell.row === pivot.row && cell.col === pivot.col) continue;
      
      // Check if cell sees pivot (same row, col, or block)
      const sameRow = cell.row === pivot.row;
      const sameCol = cell.col === pivot.col;
      const sameBlock = Math.floor(cell.row / 3) === Math.floor(pivot.row / 3) &&
                        Math.floor(cell.col / 3) === Math.floor(pivot.col / 3);
      
      if (sameRow || sameCol || sameBlock) {
        const [a, b] = cell.candidates;
        // Wing should have one common with pivot and one different
        if ((a === X && b !== Y) || (b === X && a !== Y) ||
            (a === Y && b !== X) || (b === Y && a !== X)) {
          wings.push(cell);
        }
      }
    }
    
    // Find two wings that form XY-Wing
    for (let i = 0; i < wings.length - 1; i++) {
      for (let j = i + 1; j < wings.length; j++) {
        const w1 = wings[i];
        const w2 = wings[j];
        
        const pivotCands = new Set(pivot.candidates);
        
        // Check if wings form valid XY-Wing
        const allCands = new Set([...w1.candidates, ...w2.candidates, ...pivot.candidates]);
        if (allCands.size === 3) {
          // Find the common candidate between wings (the one to eliminate)
          const Z = w1.candidates.find(c => w2.candidates.includes(c) && !pivotCands.has(c));
          if (Z) {
            const eliminationMap = new Map<string, Set<number>>();
            
            // Find cells that see both wings
            for (let row = 0; row < 9; row++) {
              for (let col = 0; col < 9; col++) {
                if ((row === w1.row && col === w1.col) || (row === w2.row && col === w2.col)) continue;
                
                const seesW1 = row === w1.row || col === w1.col ||
                              (Math.floor(row / 3) === Math.floor(w1.row / 3) &&
                               Math.floor(col / 3) === Math.floor(w1.col / 3));
                const seesW2 = row === w2.row || col === w2.col ||
                              (Math.floor(row / 3) === Math.floor(w2.row / 3) &&
                               Math.floor(col / 3) === Math.floor(w2.col / 3));
                
                if (seesW1 && seesW2) {
                  const key = `${row},${col}`;
                  if (allCandidates.has(key) && allCandidates.get(key)!.has(Z)) {
                    eliminationMap.set(key, new Set([Z]));
                  }
                }
              }
            }
            
            if (eliminationMap.size > 0) {
              const result = applyCandidateElimination(allCandidates, eliminationMap);
              if (result) {
                return {
                  ...result,
                  strategy: 'XY-Wing',
                  explanation: `An XY-Wing pattern was found with pivot at (${pivot.row + 1},${pivot.col + 1}) containing ${pivot.candidates.join('/')} and wings at (${w1.row + 1},${w1.col + 1}) and (${w2.row + 1},${w2.col + 1}). This pattern allows eliminating ${Z} from cells that can see both wings. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                  affectedCells: [
                    { row: pivot.row, col: pivot.col },
                    { row: w1.row, col: w1.col },
                    { row: w2.row, col: w2.col }
                  ],
                  highlightedRegions: []
                };
              }
            }
          }
        }
      }
    }
  }

  return null;
};

// Strategy 12: Unique Rectangle
export const findUniqueRectangle = (board: Board): HintResult | null => {
  const allCandidates = getAllCandidates(board);

  // Find all cells with exactly 2 candidates
  const biValueCells: { row: number; col: number; candidates: Set<number> }[] = [];
  allCandidates.forEach((cands, key) => {
    if (cands.size === 2) {
      const [row, col] = key.split(',').map(Number);
      biValueCells.push({ row, col, candidates: cands });
    }
  });

  // Look for rectangle patterns
  for (let i = 0; i < biValueCells.length - 2; i++) {
    for (let j = i + 1; j < biValueCells.length - 1; j++) {
      for (let k = j + 1; k < biValueCells.length; k++) {
        const c1 = biValueCells[i];
        const c2 = biValueCells[j];
        const c3 = biValueCells[k];
        
        // Check if they share same 2 candidates
        const arr1 = Array.from(c1.candidates).sort();
        const arr2 = Array.from(c2.candidates).sort();
        const arr3 = Array.from(c3.candidates).sort();
        
        if (arr1[0] === arr2[0] && arr1[1] === arr2[1] &&
            arr1[0] === arr3[0] && arr1[1] === arr3[1]) {
          // Check if they form 3 corners of a rectangle
          const rows = [c1.row, c2.row, c3.row];
          const cols = [c1.col, c2.col, c3.col];
          const uniqueRows = [...new Set(rows)];
          const uniqueCols = [...new Set(cols)];
          
          if (uniqueRows.length === 2 && uniqueCols.length === 2) {
            // Find the 4th corner
            const missingRow = uniqueRows.find(r => rows.filter(x => x === r).length === 1);
            const missingCol = uniqueCols.find(c => cols.filter(x => x === c).length === 1);
            
            if (missingRow !== undefined && missingCol !== undefined) {
              const key4 = `${missingRow},${missingCol}`;
              if (allCandidates.has(key4)) {
                const cands4 = allCandidates.get(key4)!;
                // 4th corner should have these candidates plus maybe others
                if (cands4.has(arr1[0]) && cands4.has(arr1[1]) && cands4.size > 2) {
                  const eliminationMap = new Map<string, Set<number>>();
                  const toRemove = new Set<number>();
                  cands4.forEach(n => {
                    if (n !== arr1[0] && n !== arr1[1]) toRemove.add(n);
                  });
                  
                  if (toRemove.size > 0) {
                    eliminationMap.set(key4, toRemove);
                    const result = applyCandidateElimination(allCandidates, eliminationMap);
                    if (result) {
                      return {
                        ...result,
                        strategy: 'Unique Rectangle',
                        explanation: `A Unique Rectangle pattern was found with candidates ${arr1.join(' and ')}. To avoid multiple solutions, cell at row ${missingRow + 1}, column ${missingCol + 1} cannot be just ${arr1.join('/')}. Extra candidates can be eliminated. After elimination, cell at row ${result.row + 1}, column ${result.col + 1} must be ${result.value}.`,
                        affectedCells: [
                          { row: c1.row, col: c1.col },
                          { row: c2.row, col: c2.col },
                          { row: c3.row, col: c3.col },
                          { row: missingRow, col: missingCol }
                        ],
                        highlightedRegions: []
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
};

// Find invalid notes - notes that cannot be valid based on filled cells in row, col, or block
export const findInvalidNote = (board: Board): HintResult | null => {
  const cellsWithInvalidNotes: { row: number; col: number; invalidNotes: number[] }[] = [];
  const allAffectedCells: { row: number; col: number }[] = [];
  const affectedCellsSet = new Set<string>();

  // Scan entire board for cells with invalid notes
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      
      // Skip cells with values or no notes
      if (cell.value !== null || cell.notes.size === 0) continue;

      // Get all values in the same row, column, and block
      const invalidValues = new Set<number>();

      // Check row
      for (let c = 0; c < 9; c++) {
        const val = board[row][c].value;
        if (val !== null) {
          invalidValues.add(val);
        }
      }

      // Check column
      for (let r = 0; r < 9; r++) {
        const val = board[r][col].value;
        if (val !== null) {
          invalidValues.add(val);
        }
      }

      // Check 3x3 block
      const blockRow = Math.floor(row / 3) * 3;
      const blockCol = Math.floor(col / 3) * 3;
      for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
          const val = board[r][c].value;
          if (val !== null) {
            invalidValues.add(val);
          }
        }
      }

      // Find all notes that match invalid values for this cell
      const invalidNotes = Array.from(cell.notes).filter(note => invalidValues.has(note));
      
      if (invalidNotes.length > 0) {
        cellsWithInvalidNotes.push({ row, col, invalidNotes });

        // Collect affected cells for this cell's invalid notes
        for (const note of invalidNotes) {
          // Find cells in row with this value
          for (let c = 0; c < 9; c++) {
            if (board[row][c].value === note) {
              const key = `${row},${c}`;
              if (!affectedCellsSet.has(key)) {
                allAffectedCells.push({ row, col: c });
                affectedCellsSet.add(key);
              }
            }
          }

          // Find cells in column with this value
          for (let r = 0; r < 9; r++) {
            if (board[r][col].value === note) {
              const key = `${r},${col}`;
              if (!affectedCellsSet.has(key)) {
                allAffectedCells.push({ row: r, col });
                affectedCellsSet.add(key);
              }
            }
          }

          // Find cells in block with this value
          for (let r = blockRow; r < blockRow + 3; r++) {
            for (let c = blockCol; c < blockCol + 3; c++) {
              if (board[r][c].value === note) {
                const key = `${r},${c}`;
                if (!affectedCellsSet.has(key)) {
                  allAffectedCells.push({ row: r, col: c });
                  affectedCellsSet.add(key);
                }
              }
            }
          }
        }
      }
    }
  }

  if (cellsWithInvalidNotes.length === 0) {
    return null;
  }

  // Count total invalid notes
  const totalInvalidNotes = cellsWithInvalidNotes.reduce((sum, cell) => sum + cell.invalidNotes.length, 0);
  const cellCount = cellsWithInvalidNotes.length;
  
  return {
    row: cellsWithInvalidNotes[0].row, // First cell for display
    col: cellsWithInvalidNotes[0].col,
    value: cellsWithInvalidNotes[0].invalidNotes[0],
    invalidNotes: cellsWithInvalidNotes[0].invalidNotes,
    allCellsWithInvalidNotes: cellsWithInvalidNotes,
    strategy: 'Remove Invalid Notes',
    explanation: `Found ${totalInvalidNotes} invalid note${totalInvalidNotes > 1 ? 's' : ''} across ${cellCount} cell${cellCount > 1 ? 's' : ''}. These notes conflict with values already placed in their row, column, or block and can be safely removed.`,
    action: 'remove-note',
    affectedCells: allAffectedCells
  };
};

// Main hint function - tries strategies in order of complexity
export const getAdvancedHint = (board: Board, solution: number[][]): HintResult | null => {
  // First priority: Remove invalid notes
  let hint = findInvalidNote(board);
  if (hint) return hint;

  // Try strategies in order of simplicity
  hint = findNakedSingle(board);
  if (hint) return hint;

  hint = findHiddenSingle(board);
  if (hint) return hint;

  hint = findPointingPair(board);
  if (hint) return hint;

  hint = findBoxLineReduction(board);
  if (hint) return hint;

  hint = findNakedPair(board);
  if (hint) return hint;

  hint = findHiddenPair(board);
  if (hint) return hint;

  hint = findNakedTriple(board);
  if (hint) return hint;

  hint = findNakedQuad(board);
  if (hint) return hint;

  hint = findXWing(board);
  if (hint) return hint;

  hint = findSwordfish(board);
  if (hint) return hint;

  hint = findXYWing(board);
  if (hint) return hint;

  hint = findUniqueRectangle(board);
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
