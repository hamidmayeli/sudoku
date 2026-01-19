import React from 'react';
import type { HintResult } from '../types/sudoku.types';

interface HintModalProps {
  hint: HintResult;
  onApply: () => void;
  onCancel: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({ hint, onApply, onCancel }) => {
  return (
    <div className="hint-modal-overlay" onClick={onCancel}>
      <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hint-modal-header">
          <h3>💡 Hint: {hint.strategy}</h3>
          <button className="hint-modal-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <div className="hint-modal-body">
          <div className="hint-explanation">
            <p>{hint.explanation}</p>
          </div>

          <div className="hint-solution">
            <div className="hint-cell-info">
              <strong>Cell:</strong> Row {hint.row + 1}, Column {hint.col + 1}
            </div>
            <div className="hint-value-info">
              <strong>Value:</strong> <span className="hint-value">{hint.value}</span>
            </div>
          </div>

          {hint.affectedCells && hint.affectedCells.length > 0 && (
            <div className="hint-affected">
              <strong>Affected cells:</strong> {hint.affectedCells.length} cell(s)
            </div>
          )}
        </div>

        <div className="hint-modal-footer">
          <button className="hint-button-cancel" onClick={onCancel}>
            Just Show Me
          </button>
          <button className="hint-button-apply" onClick={onApply}>
            Apply Hint
          </button>
        </div>
      </div>
    </div>
  );
};
