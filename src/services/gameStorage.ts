import type { Board, Difficulty, InputMode } from '../types/sudoku.types';

const DB_NAME = 'sudoku-db';
const DB_VERSION = 3;

const STORE_CORE = 'gameCore';
const STORE_HISTORY = 'history';
const STORE_SNAPSHOTS = 'snapshots';

/** Individual keys stored in the gameCore object store. */
export interface GameCoreFields {
  board: StoredBoard;
  solution: number[][];
  selectedCell: { row: number; col: number } | null;
  difficulty: Difficulty;
  showIncorrect: boolean;
  notesMode: boolean;
  isComplete: boolean;
  historyIndex: number;
  historyLength: number;
  snapshotCount: number;
  inputMode: InputMode;
  selectedNumber: number | null;
  highlightNotes: boolean;
}

export type GameCoreKey = keyof GameCoreFields;

/** Board serialised with notes as arrays (Sets don't survive structured clone in all browsers). */
export type StoredCell = {
  value: number | null;
  isInitial: boolean;
  notes: number[];
  isIncorrect?: boolean;
};
export type StoredBoard = StoredCell[][];

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

export const boardToStored = (board: Board): StoredBoard =>
  board.map(row =>
    row.map(cell => ({
      ...cell,
      notes: Array.from(cell.notes),
    }))
  );

export const storedToBoard = (stored: StoredBoard): Board =>
  stored.map(row =>
    row.map(cell => ({
      ...cell,
      notes: new Set(cell.notes),
    }))
  );

// ---------------------------------------------------------------------------
// Database lifecycle
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 3) {
        // Recreate all stores on any upgrade to v3.
        for (const name of [STORE_CORE, STORE_HISTORY, STORE_SNAPSHOTS]) {
          if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
        }
        db.createObjectStore(STORE_CORE);
        db.createObjectStore(STORE_HISTORY);
        db.createObjectStore(STORE_SNAPSHOTS);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

async function tx(
  storeNames: string | string[],
  mode: IDBTransactionMode
): Promise<IDBTransaction> {
  const db = await openDB();
  return db.transaction(storeNames, mode);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ---------------------------------------------------------------------------
// Public DAL — gameCore (one key per field)
// ---------------------------------------------------------------------------

/** Load all core fields. Returns null if no saved game exists. */
export async function loadGameCore(): Promise<GameCoreFields | null> {
  try {
    const t = await tx(STORE_CORE, 'readonly');
    const store = t.objectStore(STORE_CORE);

    // Check existence via a single required key
    const board = await reqToPromise(store.get('board'));
    if (board === undefined) return null;

    const [
      solution,
      selectedCell,
      difficulty,
      showIncorrect,
      notesMode,
      isComplete,
      historyIndex,
      historyLength,
      snapshotCount,
      inputMode,
      selectedNumber,
      highlightNotes,
    ] = await Promise.all([
      reqToPromise(store.get('solution')),
      reqToPromise(store.get('selectedCell')),
      reqToPromise(store.get('difficulty')),
      reqToPromise(store.get('showIncorrect')),
      reqToPromise(store.get('notesMode')),
      reqToPromise(store.get('isComplete')),
      reqToPromise(store.get('historyIndex')),
      reqToPromise(store.get('historyLength')),
      reqToPromise(store.get('snapshotCount')),
      reqToPromise(store.get('inputMode')),
      reqToPromise(store.get('selectedNumber')),
      reqToPromise(store.get('highlightNotes')),
    ]);

    return {
      board,
      solution,
      selectedCell: selectedCell ?? null,
      difficulty: difficulty ?? 'medium',
      showIncorrect: showIncorrect ?? false,
      notesMode: notesMode ?? false,
      isComplete: isComplete ?? false,
      historyIndex: historyIndex ?? 0,
      historyLength: historyLength ?? 1,
      snapshotCount: snapshotCount ?? 0,
      inputMode: inputMode ?? 'cell-first',
      selectedNumber: selectedNumber ?? null,
      highlightNotes: highlightNotes ?? true,
    };
  } catch {
    return null;
  }
}

/** Save all core fields (used for new game / full reset). */
export async function saveGameCore(core: GameCoreFields): Promise<void> {
  const t = await tx(STORE_CORE, 'readwrite');
  const store = t.objectStore(STORE_CORE);
  for (const key of Object.keys(core) as GameCoreKey[]) {
    store.put(core[key], key);
  }
  await txDone(t);
}

/** Save only the specified core fields (partial update). */
export async function saveGameCoreFields(
  fields: Partial<GameCoreFields>
): Promise<void> {
  const t = await tx(STORE_CORE, 'readwrite');
  const store = t.objectStore(STORE_CORE);
  for (const key of Object.keys(fields) as GameCoreKey[]) {
    store.put(fields[key as GameCoreKey], key);
  }
  await txDone(t);
}

/** Load a single core field. */
export async function loadGameCoreField<K extends GameCoreKey>(
  key: K
): Promise<GameCoreFields[K] | undefined> {
  try {
    const t = await tx(STORE_CORE, 'readonly');
    return await reqToPromise(t.objectStore(STORE_CORE).get(key));
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public DAL — history
// ---------------------------------------------------------------------------

/** Load a single history entry by index. */
export async function loadHistoryEntry(index: number): Promise<Board | null> {
  try {
    const t = await tx(STORE_HISTORY, 'readonly');
    const result = await reqToPromise(t.objectStore(STORE_HISTORY).get(index));
    return result ? storedToBoard(result) : null;
  } catch {
    return null;
  }
}

/** Append a history entry. */
export async function saveHistoryEntry(
  index: number,
  board: Board
): Promise<void> {
  const t = await tx(STORE_HISTORY, 'readwrite');
  t.objectStore(STORE_HISTORY).put(boardToStored(board), index);
  await txDone(t);
}

/** Remove history entries with index > keepUpTo. */
export async function truncateHistory(keepUpTo: number): Promise<void> {
  const t = await tx(STORE_HISTORY, 'readwrite');
  const store = t.objectStore(STORE_HISTORY);
  const allKeys: number[] = await reqToPromise(store.getAllKeys() as IDBRequest<number[]>);
  for (const key of allKeys) {
    if (key > keepUpTo) {
      store.delete(key);
    }
  }
  await txDone(t);
}

/** Clear all history entries. */
export async function clearHistory(): Promise<void> {
  const t = await tx(STORE_HISTORY, 'readwrite');
  t.objectStore(STORE_HISTORY).clear();
  await txDone(t);
}

// ---------------------------------------------------------------------------
// Public DAL — snapshots
// ---------------------------------------------------------------------------

/** Load a single snapshot by index. */
export async function loadSnapshot(index: number): Promise<Board | null> {
  try {
    const t = await tx(STORE_SNAPSHOTS, 'readonly');
    const result = await reqToPromise(t.objectStore(STORE_SNAPSHOTS).get(index));
    return result ? storedToBoard(result) : null;
  } catch {
    return null;
  }
}

/** Append a snapshot. */
export async function saveSnapshot(
  index: number,
  board: Board
): Promise<void> {
  const t = await tx(STORE_SNAPSHOTS, 'readwrite');
  t.objectStore(STORE_SNAPSHOTS).put(boardToStored(board), index);
  await txDone(t);
}

/** Remove the last snapshot (used when restoring). */
export async function removeLastSnapshot(currentCount: number): Promise<void> {
  if (currentCount <= 0) return;
  const t = await tx(STORE_SNAPSHOTS, 'readwrite');
  t.objectStore(STORE_SNAPSHOTS).delete(currentCount - 1);
  await txDone(t);
}

/** Clear all snapshots. */
export async function clearSnapshots(): Promise<void> {
  const t = await tx(STORE_SNAPSHOTS, 'readwrite');
  t.objectStore(STORE_SNAPSHOTS).clear();
  await txDone(t);
}

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

/** Wipe everything (on game complete or new game). */
export async function clearAllGameData(): Promise<void> {
  const t = await tx([STORE_CORE, STORE_HISTORY, STORE_SNAPSHOTS], 'readwrite');
  t.objectStore(STORE_CORE).clear();
  t.objectStore(STORE_HISTORY).clear();
  t.objectStore(STORE_SNAPSHOTS).clear();
  await txDone(t);
}

/** Export core state for clipboard (no history/snapshots). */
export async function exportGameState(): Promise<string | null> {
  const core = await loadGameCore();
  if (!core) return null;
  return JSON.stringify(core);
}
