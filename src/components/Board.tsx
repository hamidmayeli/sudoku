import React from 'react';
import type { Board as BoardType } from '../types/sudoku.types';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  selectedCell: { row: number; col: number } | null;
  highlightedValue: number | null;
  highlightNotes: boolean;
  onCellClick: (row: number, col: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  selectedCell,
  highlightedValue,
  highlightNotes,
  onCellClick
}) => {
  const isCellHighlighted = (cell: BoardType[0][0]): boolean => {
    if (highlightedValue === null) return false;
    // Check if cell value matches
    if (cell.value === highlightedValue) return true;
    // Check if cell has the value in notes
    if (highlightNotes && cell.notes.has(highlightedValue)) return true;
    return false;
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
              onClick={() => onCellClick(rowIdx, colIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
