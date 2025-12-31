import React, { useState, useEffect, useCallback } from 'react';
import { Board } from './Board';
import { Controls } from './Controls';
import { Keypad } from './Keypad';
import { StartPage } from './StartPage';
import type { GameState, Difficulty } from '../types/sudoku.types';
import { useTheme } from '../hooks/useTheme';
import {
  generateGame,
  convertToBoard,
  isBoardComplete,
  getHint,
  validateCell
} from '../utils/sudoku';

const STORAGE_KEY = 'sudoku-game-state';

// Load game from localStorage
const loadGameFromStorage = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    // Restore Set objects for notes
    parsed.board = parsed.board.map((row: { notes: number[] }[]) =>
      row.map((cell: { notes: number[] }) => ({
        ...cell,
        notes: new Set(cell.notes)
      }))
    );
    return parsed;
  } catch (error) {
    console.error('Failed to load game from storage:', error);
    return null;
  }
};

// Save game to localStorage
const saveGameToStorage = (gameState: GameState): void => {
  try {
    // Convert Set objects to arrays for JSON
    const toSave = {
      ...gameState,
      board: gameState.board.map(row =>
        row.map(cell => ({
          ...cell,
          notes: Array.from(cell.notes)
        }))
      )
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save game to storage:', error);
  }
};

export const Game: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [gameStarted, setGameStarted] = useState(() => {
    const saved = loadGameFromStorage();
    return !!saved;
  });
  
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load from localStorage first
    const saved = loadGameFromStorage();
    if (saved) return saved;
    
    // Generate new game if no saved state
    const { puzzle, solution } = generateGame('medium');
    return {
      board: convertToBoard(puzzle),
      solution,
      selectedCell: null,
      difficulty: 'medium',
      showIncorrect: true,
      notesMode: false,
      isComplete: false
    };
  });

  // Save to localStorage whenever game state changes
  useEffect(() => {
    saveGameToStorage(gameState);
  }, [gameState]);

  // Handle cell selection
  const handleCellClick = (row: number, col: number): void => {
    if (!gameState.board[row][col].isInitial) {
      setGameState(prev => ({
        ...prev,
        selectedCell: { row, col }
      }));
    }
  };

  // Handle number input
  const handleNumberInput = useCallback(
    (num: number): void => {
      if (
        !gameState.selectedCell ||
        gameState.isComplete ||
        gameState.board[gameState.selectedCell.row][gameState.selectedCell.col]
          .isInitial
      ) {
        return;
      }

      const { row, col } = gameState.selectedCell;

      setGameState(prev => {
        const newBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));

        if (prev.notesMode) {
          // Toggle note
          if (newBoard[row][col].notes.has(num)) {
            newBoard[row][col].notes.delete(num);
          } else {
            newBoard[row][col].notes.add(num);
          }
        } else {
          // Set value
          newBoard[row][col].value = num;
          newBoard[row][col].notes.clear();

          // Check if incorrect
          const isCorrect = validateCell(newBoard, prev.solution, row, col);
          newBoard[row][col].isIncorrect = !isCorrect;

          // Check if complete
          const complete = isBoardComplete(newBoard, prev.solution);
          
          return {
            ...prev,
            board: newBoard,
            isComplete: complete
          };
        }

        return {
          ...prev,
          board: newBoard
        };
      });
    },
    [gameState.selectedCell, gameState.isComplete, gameState.board]
  );

  // Handle cell clear
  const handleClearCell = useCallback((): void => {
    if (
      !gameState.selectedCell ||
      gameState.isComplete ||
      gameState.board[gameState.selectedCell.row][gameState.selectedCell.col]
        .isInitial
    ) {
      return;
    }

    const { row, col } = gameState.selectedCell;

    setGameState(prev => {
      const newBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      newBoard[row][col].value = null;
      newBoard[row][col].isIncorrect = false;
      newBoard[row][col].notes.clear();

      return {
        ...prev,
        board: newBoard
      };
    });
  }, [gameState.selectedCell, gameState.isComplete, gameState.board]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClearCell();
      } else if (gameState.selectedCell && !gameState.isComplete) {
        const { row, col } = gameState.selectedCell;
        let newRow = row;
        let newCol = col;

        switch (e.key) {
          case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            e.preventDefault();
            break;
          case 'ArrowDown':
            newRow = Math.min(8, row + 1);
            e.preventDefault();
            break;
          case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            e.preventDefault();
            break;
          case 'ArrowRight':
            newCol = Math.min(8, col + 1);
            e.preventDefault();
            break;
        }

        if (newRow !== row || newCol !== col) {
          setGameState(prev => ({
            ...prev,
            selectedCell: { row: newRow, col: newCol }
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberInput, handleClearCell, gameState.selectedCell, gameState.isComplete]);

  // Start new game
  const handleNewGame = (difficulty: Difficulty): void => {
    const { puzzle, solution } = generateGame(difficulty);
    setGameState({
      board: convertToBoard(puzzle),
      solution,
      selectedCell: null,
      difficulty,
      showIncorrect: gameState.showIncorrect,
      notesMode: false,
      isComplete: false
    });
    setGameStarted(true);
  };

  // Toggle show incorrect
  const handleToggleIncorrect = (): void => {
    setGameState(prev => ({
      ...prev,
      showIncorrect: !prev.showIncorrect
    }));
  };

  // Toggle notes mode
  const handleToggleNotes = (): void => {
    setGameState(prev => ({
      ...prev,
      notesMode: !prev.notesMode
    }));
  };

  // Get hint
  const handleHint = (): void => {
    if (gameState.isComplete) return;

    const hint = getHint(gameState.board, gameState.solution);
    if (!hint) return;

    const { row, col } = hint;

    setGameState(prev => {
      const newBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      newBoard[row][col].value = prev.solution[row][col];
      newBoard[row][col].isIncorrect = false;
      newBoard[row][col].notes.clear();

      const complete = isBoardComplete(newBoard, prev.solution);

      return {
        ...prev,
        board: newBoard,
        isComplete: complete
      };
    });
  };

  if (!gameStarted) {
    return (
      <StartPage
        theme={theme}
        onStartGame={handleNewGame}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="game-container">
      <Controls
        showIncorrect={gameState.showIncorrect}
        notesMode={gameState.notesMode}
        isComplete={gameState.isComplete}
        theme={theme}
        onNewGame={handleNewGame}
        onToggleIncorrect={handleToggleIncorrect}
        onToggleNotes={handleToggleNotes}
        onToggleTheme={toggleTheme}
        onHint={handleHint}
      />
      <div className="board-section">
        <Board
          board={gameState.board}
          selectedCell={gameState.selectedCell}
          showIncorrect={gameState.showIncorrect}
          onCellClick={handleCellClick}
        />
        <Keypad
          onNumberClick={handleNumberInput}
          onClear={handleClearCell}
          disabled={!gameState.selectedCell || gameState.isComplete}
        />
      </div>
    </div>
  );
};
