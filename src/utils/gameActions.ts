import type { GameState, GameAction } from '../types/sudoku.types';
import { isBoardComplete, validateCell, hasDuplicate } from './sudoku';

/** Deep-copy a board, cloning every cell's notes Set. */
const copyBoard = (board: GameState['board']) =>
  board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));

/** Pure state-transition: apply a number (value or note) to a cell. */
export const applyNumberInput = (
  state: GameState,
  row: number,
  col: number,
  num: number
): GameState => {
  if (state.isComplete || state.board[row][col].isInitial) {
    return state;
  }

  const newBoard = copyBoard(state.board);

  if (state.notesMode) {
    if (newBoard[row][col].notes.has(num)) {
      newBoard[row][col].notes.delete(num);
    } else {
      newBoard[row][col].notes.add(num);
    }
  } else {
    newBoard[row][col].value = num;
    newBoard[row][col].notes.clear();

    const isDuplicate = hasDuplicate(newBoard, row, col);
    const isIncorrectValue =
      state.showIncorrect && !validateCell(newBoard, state.solution, row, col);
    newBoard[row][col].isIncorrect = isDuplicate || isIncorrectValue;
  }

  const complete = isBoardComplete(newBoard, state.solution);

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newBoard);

  return {
    ...state,
    board: newBoard,
    isComplete: complete,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

/** Pure state-transition: clear a cell's value and notes. */
export const applyClearCell = (
  state: GameState,
  row: number,
  col: number
): GameState => {
  if (state.isComplete || state.board[row][col].isInitial) {
    return state;
  }

  const newBoard = copyBoard(state.board);
  newBoard[row][col].value = null;
  newBoard[row][col].isIncorrect = false;
  newBoard[row][col].notes.clear();

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newBoard);

  return {
    ...state,
    board: newBoard,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

/**
 * Process a single GameAction against the current state.
 * This is the sole consumer of the event bus – it routes every
 * user-intent action to the appropriate pure state-transition.
 */
export const processAction = (
  state: GameState,
  action: GameAction
): GameState => {
  switch (action.type) {
    case 'CELL_CLICKED': {
      const { row, col } = action;

      if (state.inputMode === 'number-first') {
        if (state.board[row][col].isInitial) return state;
        if (state.selectedNumber === 0) return applyClearCell(state, row, col);
        if (state.selectedNumber !== null)
          return applyNumberInput(state, row, col, state.selectedNumber);
        return state;
      }

      // cell-first: select the cell
      return { ...state, selectedCell: { row, col } };
    }

    case 'NUMBER_CLICKED': {
      const { num } = action;

      if (state.inputMode === 'number-first') {
        return {
          ...state,
          selectedNumber: state.selectedNumber === num ? null : num,
        };
      }

      // cell-first: fill the selected cell
      if (
        !state.selectedCell ||
        state.isComplete ||
        state.board[state.selectedCell.row][state.selectedCell.col].isInitial
      ) {
        return state;
      }
      return applyNumberInput(
        state,
        state.selectedCell.row,
        state.selectedCell.col,
        num
      );
    }

    case 'CLEAR_CLICKED': {
      if (state.inputMode === 'number-first') {
        return {
          ...state,
          selectedNumber: state.selectedNumber === 0 ? null : 0,
        };
      }

      // cell-first: clear the selected cell
      if (
        !state.selectedCell ||
        state.isComplete ||
        state.board[state.selectedCell.row][state.selectedCell.col].isInitial
      ) {
        return state;
      }
      return applyClearCell(
        state,
        state.selectedCell.row,
        state.selectedCell.col
      );
    }
  }
};
