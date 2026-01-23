import React from 'react';
import type { HintResult } from '../types/sudoku.types';

interface HintBoxProps {
  hint: HintResult;
  onAccept: () => void;
  onReject: () => void;
}

export const HintBox: React.FC<HintBoxProps> = ({ hint, onAccept, onReject }) => {
  return (
    <div className="hint-box">
      <div className="hint-box-header">
        <h3>💡 Hint: {hint.strategy}</h3>
      </div>

      <div className="hint-box-body">
        <div className="hint-explanation">
          <p>{hint.explanation}</p>
        </div>

        {hint.affectedCells && hint.affectedCells.length > 0 && (
          <div className="hint-affected">
            <strong>Affected cells:</strong> {hint.affectedCells.length} cell(s) highlighted
          </div>
        )}
      </div>

      <div className="hint-box-actions">
        <button 
          className="hint-button-reject" 
          onClick={onReject}
          aria-label="Reject hint"
          title="Reject hint"
        >
          ✕
        </button>
        <button 
          className="hint-button-accept" 
          onClick={onAccept}
          aria-label="Accept hint"
          title="Accept hint"
        >
          ✓
        </button>
      </div>
    </div>
  );
};
