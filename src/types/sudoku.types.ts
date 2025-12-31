export type CellValue = number | null;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CellData {
  value: CellValue;
  isInitial: boolean;
  notes: Set<number>;
  isIncorrect?: boolean;
}

export type Board = CellData[][];

export interface GameState {
  board: Board;
  solution: number[][];
  selectedCell: { row: number; col: number } | null;
  difficulty: Difficulty;
  showIncorrect: boolean;
  notesMode: boolean;
  isComplete: boolean;
}
