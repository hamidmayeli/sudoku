import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './Board';
import { Controls } from './Controls';
import { Keypad } from './Keypad';
import { StartPage } from './StartPage';
import { HintBox } from './HintBox';
import type { GameState, Difficulty, HintResult } from '../types/sudoku.types';
import { useTheme } from '../hooks/useTheme';
import { useGameEventBus } from '../hooks/useGameEventBus';
import {
  generateGame,
  convertToBoard,
  isBoardComplete,
  recalculateIncorrectCells
} from '../utils/sudoku';
import { getAdvancedHint } from '../utils/hintSolver';
import {
  loadGameCore,
  saveGameCore,
  saveGameCoreFields,
  saveHistoryEntry,
  loadHistoryEntry,
  truncateHistory,
  clearHistory,
  saveSnapshot,
  loadSnapshot,
  removeLastSnapshot,
  clearSnapshots,
  clearAllGameData,
  storedToBoard,
  boardToStored,
  type GameCoreFields,
} from '../services/gameStorage';

// ---------------------------------------------------------------------------
// Helpers to convert between in-memory GameState and StoredGameCore
// ---------------------------------------------------------------------------

function gameStateToCore(gs: GameState): GameCoreFields {
  return {
    board: boardToStored(gs.board),
    solution: gs.solution,
    selectedCell: gs.selectedCell,
    difficulty: gs.difficulty,
    showIncorrect: gs.showIncorrect,
    notesMode: gs.notesMode,
    isComplete: gs.isComplete,
    historyIndex: gs.historyIndex,
    historyLength: gs.historyLength,
    snapshotCount: gs.snapshotCount,
    inputMode: gs.inputMode,
    selectedNumber: gs.selectedNumber,
    highlightNotes: gs.highlightNotes,
  };
}

function coreToGameState(core: GameCoreFields): GameState {
  return {
    board: storedToBoard(core.board),
    solution: core.solution,
    selectedCell: core.selectedCell,
    difficulty: core.difficulty,
    showIncorrect: core.showIncorrect,
    notesMode: core.notesMode,
    isComplete: core.isComplete,
    historyIndex: core.historyIndex,
    historyLength: core.historyLength,
    snapshotCount: core.snapshotCount,
    inputMode: core.inputMode,
    selectedNumber: core.selectedNumber,
    highlightNotes: core.highlightNotes,
  };
}

function makeDefaultState(): GameState {
  const { puzzle, solution } = generateGame('medium');
  const initialBoard = convertToBoard(puzzle);
  return {
    board: initialBoard,
    solution,
    selectedCell: null,
    difficulty: 'medium',
    showIncorrect: false,
    notesMode: false,
    isComplete: false,
    historyIndex: 0,
    historyLength: 1,
    snapshotCount: 0,
    inputMode: 'number-first',
    selectedNumber: null,
    highlightNotes: true,
  };
}

export const Game: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentHint, setCurrentHint] = useState<HintResult | null>(null);
  const [gameState, setGameState] = useState<GameState>(makeDefaultState);

  // Track previous state for persistence diffing
  const prevStateRef = useRef<GameState | null>(null);

  // --- Initial load from IndexedDB ---
  useEffect(() => {
    (async () => {
      const core = await loadGameCore();
      if (core) {
        setGameState(coreToGameState(core));
        setGameStarted(true);
      }
      setLoading(false);
    })();
  }, []);

  // --- Persist changes to IndexedDB ---
  useEffect(() => {
    if (loading) return;

    const prev = prevStateRef.current;
    prevStateRef.current = gameState;

    // Nothing to persist until first real state
    if (!prev) {
      // Initial save after load
      if (!gameState.isComplete) {
        saveGameCore(gameStateToCore(gameState));
      }
      return;
    }

    if (gameState.isComplete) {
      clearAllGameData();
      return;
    }

    // Build a partial update with only the fields that changed
    const delta: Partial<GameCoreFields> = {};
    if (prev.board !== gameState.board) delta.board = boardToStored(gameState.board);
    if (prev.selectedCell !== gameState.selectedCell) delta.selectedCell = gameState.selectedCell;
    if (prev.showIncorrect !== gameState.showIncorrect) delta.showIncorrect = gameState.showIncorrect;
    if (prev.notesMode !== gameState.notesMode) delta.notesMode = gameState.notesMode;
    if (prev.inputMode !== gameState.inputMode) delta.inputMode = gameState.inputMode;
    if (prev.selectedNumber !== gameState.selectedNumber) delta.selectedNumber = gameState.selectedNumber;
    if (prev.highlightNotes !== gameState.highlightNotes) delta.highlightNotes = gameState.highlightNotes;
    if (prev.historyIndex !== gameState.historyIndex) delta.historyIndex = gameState.historyIndex;
    if (prev.historyLength !== gameState.historyLength) delta.historyLength = gameState.historyLength;
    if (prev.snapshotCount !== gameState.snapshotCount) delta.snapshotCount = gameState.snapshotCount;

    if (Object.keys(delta).length > 0) {
      saveGameCoreFields(delta);
    }

    // If board changed and a new history entry was added (not undo/redo)
    if (
      prev.board !== gameState.board &&
      gameState.historyLength > prev.historyLength
    ) {
      // Truncate old future entries then save new one
      const saveOps = async () => {
        if (prev.historyIndex < prev.historyLength - 1) {
          await truncateHistory(prev.historyIndex);
        }
        await saveHistoryEntry(gameState.historyIndex, gameState.board);
      };
      saveOps();
    }
  }, [gameState, loading]);

  // --- Event bus ---
  const dispatch = useGameEventBus(setGameState);

  const handleCellClick = useCallback(
    (row: number, col: number): void => dispatch({ type: 'CELL_CLICKED', row, col }),
    [dispatch]
  );

  const handleNumberInput = useCallback(
    (num: number): void => dispatch({ type: 'NUMBER_CLICKED', num }),
    [dispatch]
  );

  const handleClearCell = useCallback(
    (): void => dispatch({ type: 'CLEAR_CLICKED' }),
    [dispatch]
  );

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
  const handleNewGame = async (difficulty: Difficulty): Promise<void> => {
    await clearAllGameData();
    const { puzzle, solution } = generateGame(difficulty);
    const initialBoard = convertToBoard(puzzle);
    const newState: GameState = {
      board: initialBoard,
      solution,
      selectedCell: null,
      difficulty,
      showIncorrect: gameState.showIncorrect,
      notesMode: false,
      isComplete: false,
      historyIndex: 0,
      historyLength: 1,
      snapshotCount: 0,
      inputMode: gameState.inputMode,
      selectedNumber: null,
      highlightNotes: true,
    };
    setGameState(newState);
    setGameStarted(true);

    // Persist initial state
    await saveGameCore(gameStateToCore(newState));
    await saveHistoryEntry(0, initialBoard);
  };

  const handleRestartGame = async (): Promise<void> => {
    await clearHistory();
    await clearSnapshots();

    setGameState(prev => {
      const restartedBoard = prev.board.map(row =>
        row.map(cell => ({
          ...cell,
          value: cell.isInitial ? cell.value : null,
          notes: new Set<number>(),
          isIncorrect: false
        }))
      );

      const newState: GameState = {
        ...prev,
        board: restartedBoard,
        selectedCell: null,
        notesMode: false,
        isComplete: false,
        historyIndex: 0,
        historyLength: 1,
        snapshotCount: 0,
        selectedNumber: null,
      };

      // Save initial history entry
      saveHistoryEntry(0, restartedBoard);

      return newState;
    });
    setCurrentHint(null);
  };

  // Toggle show incorrect
  const handleToggleIncorrect = (): void => {
    setGameState(prev => {
      const newShowIncorrect = !prev.showIncorrect;
      const newBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      recalculateIncorrectCells(newBoard, prev.solution, newShowIncorrect);
      
      return {
        ...prev,
        board: newBoard,
        showIncorrect: newShowIncorrect
      };
    });
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
      selectedNumber: null
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
    const hint = getAdvancedHint(gameState.board, gameState.solution);
    if (!hint) return;
    setGameState(prev => ({
      ...prev,
      selectedCell: { row: hint.row, col: hint.col }
    }));
    setCurrentHint(hint);
  };

  // Apply hint
  const applyHint = (): void => {
    if (!currentHint) return;
    const { row, col, value, action, invalidNotes, allCellsWithInvalidNotes } = currentHint;

    setGameState(prev => {
      const newBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      
      if (action === 'remove-note') {
        if (allCellsWithInvalidNotes && allCellsWithInvalidNotes.length > 0) {
          allCellsWithInvalidNotes.forEach(cellInfo => {
            cellInfo.invalidNotes.forEach(note => {
              newBoard[cellInfo.row][cellInfo.col].notes.delete(note);
            });
          });
        } else {
          const notesToRemove = invalidNotes || [value];
          notesToRemove.forEach(note => {
            newBoard[row][col].notes.delete(note);
          });
        }
      } else {
        newBoard[row][col].value = prev.solution[row][col];
        newBoard[row][col].isIncorrect = false;
        newBoard[row][col].notes.clear();
      }

      const complete = isBoardComplete(newBoard, prev.solution);
      const newHistoryIndex = prev.historyIndex + 1;

      // Save new history entry
      saveHistoryEntry(newHistoryIndex, newBoard);
      if (prev.historyIndex < prev.historyLength - 1) {
        truncateHistory(prev.historyIndex);
      }

      return {
        ...prev,
        board: newBoard,
        isComplete: complete,
        historyIndex: newHistoryIndex,
        historyLength: newHistoryIndex + 1,
      };
    });

    setCurrentHint(null);
  };

  const closeHint = (): void => {
    setCurrentHint(null);
  };

  // Undo — load board from IndexedDB
  const handleUndo = async (): Promise<void> => {
    if (gameState.historyIndex <= 0) return;
    const newIndex = gameState.historyIndex - 1;
    const board = await loadHistoryEntry(newIndex);
    if (!board) return;

    setGameState(prev => {
      recalculateIncorrectCells(board, prev.solution, prev.showIncorrect);
      const complete = isBoardComplete(board, prev.solution);
      return {
        ...prev,
        board,
        historyIndex: newIndex,
        isComplete: complete,
      };
    });
  };

  // Redo — load board from IndexedDB
  const handleRedo = async (): Promise<void> => {
    if (gameState.historyIndex >= gameState.historyLength - 1) return;
    const newIndex = gameState.historyIndex + 1;
    const board = await loadHistoryEntry(newIndex);
    if (!board) return;

    setGameState(prev => {
      recalculateIncorrectCells(board, prev.solution, prev.showIncorrect);
      const complete = isBoardComplete(board, prev.solution);
      return {
        ...prev,
        board,
        historyIndex: newIndex,
        isComplete: complete,
      };
    });
  };

  // Take snapshot
  const handleTakeSnapshot = (): void => {
    setGameState(prev => {
      const currentBoard = prev.board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      const newCount = prev.snapshotCount + 1;
      saveSnapshot(prev.snapshotCount, currentBoard);
      return {
        ...prev,
        snapshotCount: newCount,
      };
    });
  };

  // Undo to last snapshot
  const handleUndoToSnapshot = async (): Promise<void> => {
    if (gameState.snapshotCount <= 0) return;
    const snapIndex = gameState.snapshotCount - 1;
    const board = await loadSnapshot(snapIndex);
    if (!board) return;

    await removeLastSnapshot(gameState.snapshotCount);

    setGameState(prev => {
      recalculateIncorrectCells(board, prev.solution, prev.showIncorrect);
      const complete = isBoardComplete(board, prev.solution);
      const newHistoryIndex = prev.historyIndex + 1;

      // Save to history
      saveHistoryEntry(newHistoryIndex, board);
      if (prev.historyIndex < prev.historyLength - 1) {
        truncateHistory(prev.historyIndex);
      }

      return {
        ...prev,
        board,
        snapshotCount: snapIndex,
        historyIndex: newHistoryIndex,
        historyLength: newHistoryIndex + 1,
        isComplete: complete,
      };
    });
  };

  // Disabled digits
  const getDisabledDigits = (): Set<number> => {
    if (gameState.notesMode) return new Set<number>();
    const digitCounts = new Map<number, number>();
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = gameState.board[row][col].value;
        if (value !== null) {
          digitCounts.set(value, (digitCounts.get(value) || 0) + 1);
        }
      }
    }
    const disabled = new Set<number>();
    for (let digit = 1; digit <= 9; digit++) {
      if (digitCounts.get(digit) === 9) disabled.add(digit);
    }
    return disabled;
  };

  if (loading) {
    return <div className="game-container"><p>Loading…</p></div>;
  }

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
        canRedo={gameState.historyIndex < gameState.historyLength - 1}
        hasSnapshots={gameState.snapshotCount > 0}
        snapshotCount={gameState.snapshotCount}
        inputMode={gameState.inputMode}
        highlightNotes={gameState.highlightNotes}
        onNewGame={handleNewGame}
        onRestartGame={handleRestartGame}
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
        {currentHint && (
          <HintBox
            hint={currentHint}
            onAccept={applyHint}
            onReject={closeHint}
          />
        )}
        <Board
          board={gameState.board}
          selectedCell={gameState.selectedCell}
          highlightedValue={
            gameState.inputMode === 'number-first'
              ? gameState.selectedNumber && gameState.selectedNumber !== 0 ? gameState.selectedNumber : null
              : gameState.selectedCell
                ? gameState.board[gameState.selectedCell.row][gameState.selectedCell.col].value
                : null
          }
          highlightNotes={gameState.highlightNotes}
          onCellClick={handleCellClick}
          hintAffectedCells={currentHint?.affectedCells || []}
          currentHint={currentHint}
        />
        <Keypad
          onNumberClick={handleNumberInput}
          onClear={handleClearCell}
          disabled={gameState.isComplete || (gameState.inputMode === 'cell-first' && !gameState.selectedCell)}
          selectedNumber={gameState.inputMode === 'number-first' ? gameState.selectedNumber : undefined}
          isClearSelected={gameState.inputMode === 'number-first' && gameState.selectedNumber === 0}
          disabledDigits={getDisabledDigits()}
        />
      </div>
    </div>
  );
};
