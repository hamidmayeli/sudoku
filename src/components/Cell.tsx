import React from 'react';
import type { CellData } from '../types/sudoku.types';

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isHintAffected?: boolean;
  isHintTarget?: boolean;
  hintValue?: number;
  hintAction?: 'add-value' | 'add-note' | 'remove-note';
  invalidNotes?: number[];
  onClick: () => void;
}

export const Cell: React.FC<CellProps> = ({
  cell,
  row,
  col,
  isSelected,
  isHighlighted,
  isHintAffected = false,
  isHintTarget = false,
  hintValue,
  hintAction,
  invalidNotes = [],
  onClick
}) => {
  const isNoteInvalid = (note: number): boolean => {
    return invalidNotes.includes(note);
  };
  const getClassName = (): string => {
    const classes = ['cell'];
    
    if (isSelected) classes.push('selected');
    if (isHighlighted) classes.push('highlighted');
    if (isHintAffected) classes.push('hint-affected');
    if (isHintTarget) classes.push('hint-target');
    if (cell.isInitial) classes.push('initial');
    if (cell.isIncorrect) classes.push('incorrect');
    
    // Add border classes for 3x3 boxes
    if (col % 3 === 2 && col !== 8) classes.push('right-border');
    if (row % 3 === 2 && row !== 8) classes.push('bottom-border');
    
    return classes.join(' ');
  };

  const renderContent = () => {
    // Show hint value preview for target cell
    if (isHintTarget && hintValue !== undefined) {
      if (hintAction === 'add-value') {
        return <span className="cell-value hint-preview-add">{hintValue}</span>;
      } else if (hintAction === 'remove-note') {
        // Show notes with those to be removed highlighted in red
        return (
          <div className="notes">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <span 
                key={num} 
                className={`note ${cell.notes.has(num) ? 'note-visible' : ''} ${cell.notes.has(num) && isNoteInvalid(num) ? 'note-hint-remove' : ''}`}
              >
                {cell.notes.has(num) ? num : ''}
              </span>
            ))}
          </div>
        );
      }
    }

    // Normal cell rendering
    if (cell.value !== null) {
      return <span className="cell-value">{cell.value}</span>;
    } else if (cell.notes.size > 0) {
      return (
        <div className="notes">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <span key={num} className="note">
              {cell.notes.has(num) ? num : ''}
            </span>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={getClassName()} onClick={onClick}>
      {renderContent()}
    </div>
  );
};
