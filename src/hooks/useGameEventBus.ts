import { useRef, useCallback } from 'react';
import type { GameState, GameAction } from '../types/sudoku.types';
import { processAction } from '../utils/gameActions';

/**
 * A lightweight event bus for game actions.
 *
 * Actions are enqueued and drained **one at a time** through
 * `processAction`.  Each action sees the latest state because
 * `setGameState` is called with the functional-updater form.
 *
 * If a new action arrives while the queue is already being
 * drained, it is appended and will be picked up in the same
 * drain loop — no action is lost, and no action is processed
 * concurrently.
 */
export function useGameEventBus(
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  const queueRef = useRef<GameAction[]>([]);
  const drainingRef = useRef(false);

  const drain = useCallback(() => {
    if (drainingRef.current) return;
    drainingRef.current = true;

    while (queueRef.current.length > 0) {
      const action = queueRef.current.shift()!;
      setGameState(prev => processAction(prev, action));
    }

    drainingRef.current = false;
  }, [setGameState]);

  const dispatch = useCallback(
    (action: GameAction) => {
      queueRef.current.push(action);
      drain();
    },
    [drain]
  );

  return dispatch;
}
