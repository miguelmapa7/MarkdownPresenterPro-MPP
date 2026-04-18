import { useSyncExternalStore, useCallback } from "react";

/**
 * Hook de cronómetro compatible con React 19 strict rules.
 * Usa useSyncExternalStore con un store externo (no refs en render).
 */

// Store externo — vive fuera de React, sin refs
let timerSeconds = 0;
let timerIntervalId: ReturnType<typeof setInterval> | null = null;
const timerListeners = new Set<() => void>();

function timerNotify() {
  for (const listener of timerListeners) {
    listener();
  }
}

function timerSubscribe(listener: () => void) {
  timerListeners.add(listener);
  return () => {
    timerListeners.delete(listener);
  };
}

function timerGetSnapshot() {
  return timerSeconds;
}

function timerStart() {
  timerStop();
  timerSeconds = 0;
  timerNotify();
  timerIntervalId = setInterval(() => {
    timerSeconds += 1;
    timerNotify();
  }, 1000);
}

function timerStop() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  timerSeconds = 0;
  timerNotify();
}

export function useTimer(isActive: boolean): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsub = timerSubscribe(onStoreChange);
      if (isActive) {
        timerStart();
      } else {
        timerStop();
      }
      return () => {
        unsub();
        timerStop();
      };
    },
    [isActive]
  );

  return useSyncExternalStore(subscribe, timerGetSnapshot);
}
