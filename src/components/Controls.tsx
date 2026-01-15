import React, { useState } from 'react';
import type { Difficulty } from '../types/sudoku.types';

interface ControlsProps {
  showIncorrect: boolean;
  notesMode: boolean;
  isComplete: boolean;
  theme: string;
  canUndo: boolean;
  canRedo: boolean;
  hasSnapshots: boolean;
  inputMode: 'cell-first' | 'number-first';
  highlightNotes: boolean;
  onNewGame: (difficulty: Difficulty) => void;
  onToggleIncorrect: () => void;
  onToggleNotes: () => void;
  onToggleTheme: () => void;
  onHint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTakeSnapshot: () => void;
  onUndoToSnapshot: () => void;
  onToggleInputMode: () => void;
  onToggleHighlightNotes: () => void;
}

type ExpandableSection = "newGame" | "settings" | null;

export const Controls: React.FC<ControlsProps> = ({
  showIncorrect,
  notesMode,
  isComplete,
  theme,
  canUndo,
  canRedo,
  hasSnapshots,
  inputMode,
  highlightNotes,
  onNewGame,
  onToggleIncorrect,
  onToggleNotes,
  onToggleTheme,
  onHint,
  onUndo,
  onRedo,
  onTakeSnapshot,
  onUndoToSnapshot,
  onToggleInputMode,
  onToggleHighlightNotes
}) => {
  const [showDifficultyMenu, setShowDifficultyMenu] = useState<ExpandableSection>(null);

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

      <div className="expandable-sections">
        <div className="expandable-buttons">
          <button 
            onClick={() => setShowDifficultyMenu(showDifficultyMenu !== "newGame" ? "newGame" : null)}
            className="new-game-toggle"
          >
            New Game {showDifficultyMenu === "newGame" ? '▲' : '▼'}
          </button>
          <button 
            onClick={() => setShowDifficultyMenu(showDifficultyMenu !== "settings" ? "settings" : null)}
            className="settings-toggle"
          >
            Settings {showDifficultyMenu === "settings" ? '▲' : '▼'}
          </button>
        </div>
        {showDifficultyMenu === "newGame" && (
          <div className="difficulty-menu">
            <button onClick={() => { onNewGame('easy'); setShowDifficultyMenu(null); }}>Easy</button>
            <button onClick={() => { onNewGame('medium'); setShowDifficultyMenu(null); }}>Medium</button>
            <button onClick={() => { onNewGame('hard'); setShowDifficultyMenu(null); }}>Hard</button>
          </div>
        )}
        {showDifficultyMenu === "settings" && (
          <div className="settings-menu">
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
                checked={inputMode === 'number-first'}
                onChange={onToggleInputMode}
              />
              <span>Number First Mode</span>
            </label>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={highlightNotes}
                onChange={onToggleHighlightNotes}
              />
              <span>Highlight Notes</span>
            </label>
          </div>
        )}
      </div>

      <div className="controls-row">
        <button onClick={onToggleNotes} disabled={isComplete} className={notesMode ? " selected" : ""} title="Toggle notes mode">
          {!notesMode
            ? (<svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.5" d="M16.6522 3.45508C16.6522 3.45508 16.7333 4.83381 17.9499 6.05034C19.1664 7.26687 20.5451 7.34797 20.5451 7.34797M10.1002 15.5876L8.4126 13.9" stroke="#1C274C" stroke-width="1.5"/>
                <path d="M16.652 3.45506L17.3009 2.80624C18.3759 1.73125 20.1188 1.73125 21.1938 2.80624C22.2687 3.88124 22.2687 5.62415 21.1938 6.69914L20.5449 7.34795L14.5801 13.3128C14.1761 13.7168 13.9741 13.9188 13.7513 14.0926C13.4886 14.2975 13.2043 14.4732 12.9035 14.6166C12.6485 14.7381 12.3775 14.8284 11.8354 15.0091L10.1 15.5876L8.97709 15.9619C8.71035 16.0508 8.41626 15.9814 8.21744 15.7826C8.01862 15.5837 7.9492 15.2897 8.03811 15.0229L8.41242 13.9L8.99089 12.1646C9.17157 11.6225 9.26191 11.3515 9.38344 11.0965C9.52679 10.7957 9.70249 10.5114 9.90743 10.2487C10.0812 10.0259 10.2832 9.82394 10.6872 9.41993L16.652 3.45506Z" stroke="#1C274C" stroke-width="1.5"/>
                <path opacity="0.5" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
              </svg>)
            : (<svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.1938 2.80624C22.2687 3.88124 22.2687 5.62415 21.1938 6.69914L20.6982 7.19469C20.5539 7.16345 20.3722 7.11589 20.1651 7.04404C19.6108 6.85172 18.8823 6.48827 18.197 5.803C17.5117 5.11774 17.1483 4.38923 16.956 3.8349C16.8841 3.62781 16.8366 3.44609 16.8053 3.30179L17.3009 2.80624C18.3759 1.73125 20.1188 1.73125 21.1938 2.80624Z" fill="#1C274C"/>
                <path d="M14.5801 13.3128C14.1761 13.7168 13.9741 13.9188 13.7513 14.0926C13.4886 14.2975 13.2043 14.4732 12.9035 14.6166C12.6485 14.7381 12.3775 14.8284 11.8354 15.0091L8.97709 15.9619C8.71035 16.0508 8.41626 15.9814 8.21744 15.7826C8.01862 15.5837 7.9492 15.2897 8.03811 15.0229L8.99089 12.1646C9.17157 11.6225 9.26191 11.3515 9.38344 11.0965C9.52679 10.7957 9.70249 10.5114 9.90743 10.2487C10.0812 10.0259 10.2832 9.82394 10.6872 9.41993L15.6033 4.50385C15.867 5.19804 16.3293 6.05663 17.1363 6.86366C17.9434 7.67069 18.802 8.13296 19.4962 8.39674L14.5801 13.3128Z" fill="#1C274C"/>
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 10.8082 21.7915 9.66511 21.409 8.60519L15.586 14.4283C15.2347 14.7797 14.9708 15.0437 14.6738 15.2753C14.3252 15.5473 13.948 15.7804 13.5488 15.9706C13.2088 16.1327 12.8546 16.2506 12.3833 16.4076L9.45143 17.3849C8.64568 17.6535 7.75734 17.4438 7.15678 16.8432C6.55621 16.2427 6.34651 15.3543 6.61509 14.5486L7.59236 11.6167C7.74936 11.1453 7.86732 10.7912 8.02935 10.4512C8.21958 10.052 8.45272 9.6748 8.72466 9.32615C8.9563 9.02918 9.22033 8.76527 9.57173 8.41403L15.3948 2.59098C14.3349 2.20849 13.1918 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#1C274C"/>
              </svg>)}
        </button>

        <button onClick={onUndo} disabled={isComplete || !canUndo} title="Undo">
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7H15C16.8692 7 17.8039 7 18.5 7.40193C18.9561 7.66523 19.3348 8.04394 19.5981 8.49999C20 9.19615 20 10.1308 20 12C20 13.8692 20 14.8038 19.5981 15.5C19.3348 15.9561 18.9561 16.3348 18.5 16.5981C17.8039 17 16.8692 17 15 17H8.00001M4 7L7 4M4 7L7 10" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button onClick={onRedo} disabled={isComplete || !canRedo} title="Redo">
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 7H9.00001C7.13077 7 6.19615 7 5.5 7.40193C5.04395 7.66523 4.66524 8.04394 4.40193 8.49999C4 9.19615 4 10.1308 4 12C4 13.8692 4 14.8038 4.40192 15.5C4.66523 15.9561 5.04394 16.3348 5.5 16.5981C6.19615 17 7.13077 17 9 17H16M20 7L17 4M20 7L17 10" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button onClick={onTakeSnapshot} disabled={isComplete} title="Save current state">
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.83 5H20C21.1 5 22 5.9 22 7V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V7C2 5.9 2.9 5 4 5H7.17L9 3H15L16.83 5ZM4 19H20V7H15.95L15.36 6.35L14.12 5H9.88L8.64 6.35L8.05 7H4V19Z" fill="#000000"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.93 17C14.1391 17 15.93 15.2091 15.93 13C15.93 10.7909 14.1391 9 11.93 9C9.72085 9 7.92999 10.7909 7.92999 13C7.92999 15.2091 9.72085 17 11.93 17ZM11.93 15C13.0346 15 13.93 14.1046 13.93 13C13.93 11.8954 13.0346 11 11.93 11C10.8254 11 9.92999 11.8954 9.92999 13C9.92999 14.1046 10.8254 15 11.93 15Z" fill="#000000"/>
          </svg>
        </button>

        <button onClick={onUndoToSnapshot} disabled={isComplete || !hasSnapshots} title="Restore last snapshot">
          <svg fill="#000000" width="20px" height="20px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <title>revert</title>
            <path d="M0.032 16.416q0.128 0.576 0.544 0.992l4 4q0.608 0.608 1.44 0.608 0.8 0 1.376-0.608l4.032-3.968q0.416-0.448 0.544-1.024t-0.128-1.184q-0.224-0.544-0.736-0.896t-1.088-0.32h-1.824q0.704-3.456 3.456-5.728t6.368-2.272q2.72 0 5.024 1.344t3.616 3.648 1.344 4.992-1.344 5.024-3.616 3.648-5.024 1.344q-2.336 0-4.352-1.024t-3.424-2.752l-2.848 2.592q0 0.032-0.032 0.032t-0.064 0.064-0.064 0.032q1.984 2.368 4.768 3.712t6.016 1.344q2.816 0 5.408-1.088t4.48-3.008 2.976-4.448 1.12-5.472-1.12-5.44-2.976-4.448-4.48-2.976-5.408-1.12q-2.624 0-4.992 0.928t-4.224 2.528-3.072 3.808-1.568 4.736h-2.144q-0.608 0-1.12 0.32t-0.736 0.896-0.128 1.184zM16 16q0 0.832 0.576 1.44t1.44 0.576h4q0.8 0 1.408-0.576t0.576-1.44-0.576-1.408-1.408-0.576h-2.016v-2.016q0-0.832-0.576-1.408t-1.408-0.576-1.44 0.576-0.576 1.408v4z"></path>
          </svg>
        </button>
        
        <button onClick={onHint} disabled={isComplete} title="Get a hint">
          💡
        </button>
      </div>
    </div>
  );
};
