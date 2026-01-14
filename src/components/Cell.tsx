import React from 'react';
import type { CellData } from '../types/sudoku.types';

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  isSelected: boolean;
  showIncorrect: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

export const Cell: React.FC<CellProps> = ({
  cell,
  row,
  col,
  isSelected,
  showIncorrect,
  isHighlighted,
  onClick
}) => {
  const getClassName = (): string => {
    const classes = ['cell'];
    
    if (isSelected) classes.push('selected');
    if (isHighlighted) classes.push('highlighted');
    if (cell.isInitial) classes.push('initial');
    if (showIncorrect && cell.isIncorrect) classes.push('incorrect');
    
    // Add border classes for 3x3 boxes
    if (col % 3 === 2 && col !== 8) classes.push('right-border');
    if (row % 3 === 2 && row !== 8) classes.push('bottom-border');
    
    return classes.join(' ');
  };

  return (
    <div className={getClassName()} onClick={onClick}>
      {cell.value !== null ? (
        <span className="cell-value">{cell.value}</span>
      ) : cell.notes.size > 0 ? (
        <div className="notes">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <span key={num} className="note">
              {cell.notes.has(num) ? num : ''}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};
