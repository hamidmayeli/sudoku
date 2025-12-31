import React from 'react';
import type { Difficulty } from '../types/sudoku.types';

interface StartPageProps {
  theme: string;
  onStartGame: (difficulty: Difficulty) => void;
  onToggleTheme: () => void;
}

export const StartPage: React.FC<StartPageProps> = ({
  theme,
  onStartGame,
  onToggleTheme
}) => {
  return (
    <div className="start-page">
      <div className="start-header">
        <h1>Sudoku</h1>
        <button onClick={onToggleTheme} className="theme-toggle" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      
      <div className="difficulty-selection">
        <h2>Select Difficulty</h2>
        <div className="difficulty-buttons-start">
          <button 
            className="difficulty-btn easy"
            onClick={() => onStartGame('easy')}
          >
            Easy
          </button>
          <button 
            className="difficulty-btn medium"
            onClick={() => onStartGame('medium')}
          >
            Medium
          </button>
          <button 
            className="difficulty-btn hard"
            onClick={() => onStartGame('hard')}
          >
            Hard
          </button>
        </div>
      </div>

      <div className="start-instructions">
        <h3>How to Play</h3>
        <ul>
          <li>Fill the 9×9 grid with digits 1-9</li>
          <li>Each row, column, and 3×3 box must contain all digits 1-9</li>
          <li>Use keyboard (1-9, arrows) or click cells and use the keypad</li>
          <li>Enable Notes Mode to add candidate numbers</li>
          <li>Use hints if you get stuck</li>
        </ul>
      </div>
    </div>
  );
};
