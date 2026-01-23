import React from 'react';
import type { Board as BoardType, HintResult } from '../types/sudoku.types';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  selectedCell: { row: number; col: number } | null;
  highlightedValue: number | null;
  highlightNotes: boolean;
  onCellClick: (row: number, col: number) => void;
  hintAffectedCells?: { row: number; col: number }[];
  currentHint?: HintResult | null;
}

export const Board: React.FC<BoardProps> = ({
  board,
  selectedCell,
  highlightedValue,
  highlightNotes,
  onCellClick,
  hintAffectedCells = [],
  currentHint = null
}) => {
  const isCellHighlighted = (cell: BoardType[0][0]): boolean => {
    if (highlightedValue === null) return false;
    // Check if cell value matches
    if (cell.value === highlightedValue) return true;
    // Check if cell has the value in notes
    if (highlightNotes && cell.notes.has(highlightedValue)) return true;
    return false;
  };

  const isCellHintAffected = (row: number, col: number): boolean => {
    return hintAffectedCells.some(cell => cell.row === row && cell.col === col);
  };

  const isHintTargetCell = (row: number, col: number): boolean => {
    if (!currentHint) return false;
    
    // Check if this is one of the cells with invalid notes
    if (currentHint.allCellsWithInvalidNotes) {
      return currentHint.allCellsWithInvalidNotes.some(cell => cell.row === row && cell.col === col);
    }
    
    return currentHint.row === row && currentHint.col === col;
  };

  const getInvalidNotesForCell = (row: number, col: number): number[] | undefined => {
    if (!currentHint || !currentHint.allCellsWithInvalidNotes) return undefined;
    
    const cellInfo = currentHint.allCellsWithInvalidNotes.find(cell => cell.row === row && cell.col === col);
    return cellInfo?.invalidNotes;
  };

  return (
    <div className="board">
      {board.map((row, rowIdx) => (
        <div key={rowIdx} className="board-row">
          {row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              cell={cell}
              row={rowIdx}
              col={colIdx}
              isSelected={
                selectedCell?.row === rowIdx && selectedCell?.col === colIdx
              }
              isHighlighted={isCellHighlighted(cell)}
              isHintAffected={isCellHintAffected(rowIdx, colIdx)}
              isHintTarget={isHintTargetCell(rowIdx, colIdx)}
              hintValue={isHintTargetCell(rowIdx, colIdx) ? currentHint?.value : undefined}
              hintAction={isHintTargetCell(rowIdx, colIdx) ? currentHint?.action : undefined}
              invalidNotes={getInvalidNotesForCell(rowIdx, colIdx)}
              onClick={() => onCellClick(rowIdx, colIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
