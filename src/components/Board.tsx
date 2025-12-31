import React from 'react';
import type { Board as BoardType } from '../types/sudoku.types';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  selectedCell: { row: number; col: number } | null;
  showIncorrect: boolean;
  onCellClick: (row: number, col: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  selectedCell,
  showIncorrect,
  onCellClick
}) => {
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
              showIncorrect={showIncorrect}
              onClick={() => onCellClick(rowIdx, colIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
