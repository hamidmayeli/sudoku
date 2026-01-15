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

    parsed.history = parsed.history.map((board: { notes: number[] }[][]) =>
      board.map((row: { notes: number[] }[]) =>
        row.map((cell: { notes: number[] }) => ({
          ...cell,
          notes: new Set(cell.notes)
        }))
      )
    );

    parsed.snapshots = parsed.snapshots.map((board: { notes: number[] }[][]) =>
      board.map((row: { notes: number[] }[]) =>
        row.map((cell: { notes: number[] }) => ({
          ...cell,
          notes: new Set(cell.notes)
        }))
      )
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
      ),
      history: gameState.history.map(board =>
        board.map(row =>
          row.map(cell => ({
            ...cell,
            notes: Array.from(cell.notes)
          }))
        )
      ),
      snapshots: gameState.snapshots.map(board =>
        board.map(row =>
          row.map(cell => ({
            ...cell,
            notes: Array.from(cell.notes)
          }))
        )
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
    if (saved) {
      // Ensure history and snapshots exist
      return {
        ...saved,
        history: saved.history || [saved.board],
        historyIndex: saved.historyIndex ?? 0,
        snapshots: saved.snapshots || [],
        inputMode: saved.inputMode || 'cell-first',
        selectedNumber: saved.selectedNumber || null
      };
    }
    
    // Generate new game if no saved state
    const { puzzle, solution } = generateGame('medium');
    const initialBoard = convertToBoard(puzzle);
    return {
      board: initialBoard,
      solution,
      selectedCell: null,
      difficulty: 'medium',
      showIncorrect: true,
      notesMode: false,
      isComplete: false,
      history: [initialBoard],
      historyIndex: 0,
      snapshots: [],
      inputMode: 'cell-first',
      selectedNumber: null,
      highlightNotes: true
    };
  });

  // Save to localStorage whenever game state changes
  useEffect(() => {
    if(gameState.isComplete) {
      localStorage.removeItem(STORAGE_KEY);
    }
    else {
      saveGameToStorage(gameState);
    }
  }, [gameState]);

  // Handle cell selection
  const handleCellClick = (row: number, col: number): void => {
    if (gameState.inputMode === 'number-first') {
      // In number-first mode, prevent editing initial cells
      if (gameState.board[row][col].isInitial) return;
      
      // Clicking a cell fills it with the selected number
      if (gameState.selectedNumber === 0) {
        // 0 is used as a special value for clear action
        handleClearCellAt(row, col);
      } else if (gameState.selectedNumber !== null) {
        handleNumberInputAtCell(row, col, gameState.selectedNumber);
      }
    } else {
      // In cell-first mode, clicking a cell selects it (including initial cells for highlighting)
      setGameState(prev => ({
        ...prev,
        selectedCell: { row, col }
      }));
    }
  };

  // Helper function to clear a specific cell
  const handleClearCellAt = useCallback((row: number, col: number): void => {
    setGameState(prev => {
      if (
        prev.isComplete ||
        prev.board[row][col].isInitial
      ) {
        return prev;
      }

      const newBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      newBoard[row][col].value = null;
      newBoard[row][col].isIncorrect = false;
      newBoard[row][col].notes.clear();

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newBoard);

      return {
        ...prev,
        board: newBoard,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  // Helper function to input number at specific cell
  const handleNumberInputAtCell = useCallback((row: number, col: number, num: number): void => {
    setGameState(prev => {
      if (
        prev.isComplete ||
        prev.board[row][col].isInitial
      ) {
        return prev;
      }

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
        
        // Add to history
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(newBoard);
        
        return {
          ...prev,
          board: newBoard,
          isComplete: complete,
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }

      // Add to history for notes mode too
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newBoard);
      
      return {
        ...prev,
        board: newBoard,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  // Handle number input
  const handleNumberInput = useCallback(
    (num: number): void => {
      if (gameState.inputMode === 'number-first') {
        // In number-first mode, clicking a number selects it
        setGameState(prev => ({
          ...prev,
          selectedNumber: prev.selectedNumber === num ? null : num
        }));
      } else {
        // In cell-first mode, clicking a number fills the selected cell
        if (
          !gameState.selectedCell ||
          gameState.isComplete ||
          gameState.board[gameState.selectedCell.row][gameState.selectedCell.col].isInitial
        ) {
          return;
        }

        const { row, col } = gameState.selectedCell;
        handleNumberInputAtCell(row, col, num);
      }
    },
    [gameState.inputMode, gameState.selectedCell, gameState.isComplete, gameState.board, handleNumberInputAtCell]
  );

  // Handle cell clear
  const handleClearCell = useCallback((): void => {
    if (gameState.inputMode === 'number-first') {
      // In number-first mode, toggle clear mode (0 represents clear)
      setGameState(prev => ({
        ...prev,
        selectedNumber: prev.selectedNumber === 0 ? null : 0
      }));
    } else {
      // In cell-first mode, clear the selected cell
      if (
        !gameState.selectedCell ||
        gameState.isComplete ||
        gameState.board[gameState.selectedCell.row][gameState.selectedCell.col]
          .isInitial
      ) {
        return;
      }

      const { row, col } = gameState.selectedCell;
      handleClearCellAt(row, col);
    }
  }, [gameState.inputMode, gameState.selectedCell, gameState.isComplete, gameState.board, handleClearCellAt]);

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
    const initialBoard = convertToBoard(puzzle);
    setGameState({
      board: initialBoard,
      solution,
      selectedCell: null,
      difficulty,
      showIncorrect: gameState.showIncorrect,
      notesMode: false,
      isComplete: false,
      history: [initialBoard],
      historyIndex: 0,
      snapshots: [],
      inputMode: gameState.inputMode,
      selectedNumber: null,
      highlightNotes: true
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

  // Toggle input mode
  const handleToggleInputMode = (): void => {
    setGameState(prev => ({
      ...prev,
      inputMode: prev.inputMode === 'cell-first' ? 'number-first' : 'cell-first',
      selectedNumber: null // Clear selected number when switching modes
    }));
  };

  // Toggle highlight notes
  const handleToggleHighlightNotes = (): void => {
    setGameState(prev => ({
      ...prev,
      highlightNotes: !prev.highlightNotes
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

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newBoard);

      return {
        ...prev,
        board: newBoard,
        isComplete: complete,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  };

  // Undo
  const handleUndo = (): void => {
    if (gameState.historyIndex > 0) {
      setGameState(prev => {
        const newIndex = prev.historyIndex - 1;
        const boardToRestore = prev.history[newIndex];
        const complete = isBoardComplete(boardToRestore, prev.solution);
        
        return {
          ...prev,
          board: boardToRestore,
          historyIndex: newIndex,
          isComplete: complete
        };
      });
    }
  };

  // Redo
  const handleRedo = (): void => {
    if (gameState.historyIndex < gameState.history.length - 1) {
      setGameState(prev => {
        const newIndex = prev.historyIndex + 1;
        const boardToRestore = prev.history[newIndex];
        const complete = isBoardComplete(boardToRestore, prev.solution);
        
        return {
          ...prev,
          board: boardToRestore,
          historyIndex: newIndex,
          isComplete: complete
        };
      });
    }
  };

  // Take snapshot
  const handleTakeSnapshot = (): void => {
    setGameState(prev => {
      const currentBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      return {
        ...prev,
        snapshots: [...prev.snapshots, currentBoard]
      };
    });
  };

  // Undo to last snapshot
  const handleUndoToSnapshot = (): void => {
    if (gameState.snapshots.length > 0) {
      setGameState(prev => {
        const lastSnapshot = prev.snapshots[prev.snapshots.length - 1];
        const newSnapshots = prev.snapshots.slice(0, -1);
        const complete = isBoardComplete(lastSnapshot, prev.solution);
        
        // Add to history
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(lastSnapshot);
        
        return {
          ...prev,
          board: lastSnapshot,
          snapshots: newSnapshots,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isComplete: complete
        };
      });
    }
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
        canUndo={gameState.historyIndex > 0}
        canRedo={gameState.historyIndex < gameState.history.length - 1}
        hasSnapshots={gameState.snapshots.length > 0}
        inputMode={gameState.inputMode}
        highlightNotes={gameState.highlightNotes}
        onNewGame={handleNewGame}
        onToggleIncorrect={handleToggleIncorrect}
        onToggleNotes={handleToggleNotes}
        onToggleTheme={toggleTheme}
        onHint={handleHint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTakeSnapshot={handleTakeSnapshot}
        onUndoToSnapshot={handleUndoToSnapshot}
        onToggleInputMode={handleToggleInputMode}
        onToggleHighlightNotes={handleToggleHighlightNotes}
      />
      <div className="board-section">
        <Board
          board={gameState.board}
          selectedCell={gameState.selectedCell}
          showIncorrect={gameState.showIncorrect}
          highlightedValue={
            gameState.inputMode === 'number-first'
              ? gameState.selectedNumber && gameState.selectedNumber !== 0 ? gameState.selectedNumber : null
              : gameState.selectedCell
                ? gameState.board[gameState.selectedCell.row][gameState.selectedCell.col].value
                : null
          }
          highlightNotes={gameState.highlightNotes}
          onCellClick={handleCellClick}
        />
        <Keypad
          onNumberClick={handleNumberInput}
          onClear={handleClearCell}
          disabled={gameState.isComplete || (gameState.inputMode === 'cell-first' && !gameState.selectedCell)}
          selectedNumber={gameState.inputMode === 'number-first' ? gameState.selectedNumber : undefined}
          isClearSelected={gameState.inputMode === 'number-first' && gameState.selectedNumber === 0}
        />
      </div>
    </div>
  );
};
