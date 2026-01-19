export type CellValue = number | null;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type InputMode = 'cell-first' | 'number-first';

export interface CellData {
  value: CellValue;
  isInitial: boolean;
  notes: Set<number>;
  isIncorrect?: boolean;
}

export type Board = CellData[][];

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

export interface GameState {
  board: Board;
  solution: number[][];
  selectedCell: { row: number; col: number } | null;
  difficulty: Difficulty;
  showIncorrect: boolean;
  notesMode: boolean;
  isComplete: boolean;
  history: Board[];
  historyIndex: number;
  snapshots: Board[];
  inputMode: InputMode;
  selectedNumber: number | null;
  highlightNotes: boolean;
}
