import React, { useState } from 'react';
import type { Difficulty } from '../types/sudoku.types';

interface ControlsProps {
  showIncorrect: boolean;
  notesMode: boolean;
  isComplete: boolean;
  theme: string;
  onNewGame: (difficulty: Difficulty) => void;
  onToggleIncorrect: () => void;
  onToggleNotes: () => void;
  onToggleTheme: () => void;
  onHint: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  showIncorrect,
  notesMode,
  isComplete,
  theme,
  onNewGame,
  onToggleIncorrect,
  onToggleNotes,
  onToggleTheme,
  onHint
}) => {
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);

  return (
    <div className="controls">
      <div className="controls-header">
        <h2>Sudoku</h2>
        <button onClick={onToggleTheme} className="theme-toggle" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {isComplete && (
        <div className="complete-message">
          🎉 Congratulations! You solved the puzzle! 🎉
        </div>
      )}

      <div className="new-game-section">
        <button 
          onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
          className="new-game-toggle"
        >
          New Game {showDifficultyMenu ? '▲' : '▼'}
        </button>
        {showDifficultyMenu && (
          <div className="difficulty-menu">
            <button onClick={() => { onNewGame('easy'); setShowDifficultyMenu(false); }}>Easy</button>
            <button onClick={() => { onNewGame('medium'); setShowDifficultyMenu(false); }}>Medium</button>
            <button onClick={() => { onNewGame('hard'); setShowDifficultyMenu(false); }}>Hard</button>
          </div>
        )}
      </div>

      <div className="controls-row">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={showIncorrect}
            onChange={onToggleIncorrect}
          />
          <span>Show Incorrect</span>
        </label>
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={notesMode}
            onChange={onToggleNotes}
          />
          <span>Notes Mode</span>
        </label>
        <button onClick={onHint} disabled={isComplete} className="hint-btn">
          💡 Hint
        </button>
      </div>
    </div>
  );
};
