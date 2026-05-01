"use client";

import { useEffect, useState } from "react";

type UseCountdownOptions = {
  onComplete?: () => void;
  intervalMs?: number;
};

const toRemainingSeconds = (targetTimeMs: number): number => {
  return Math.max(0, Math.ceil((targetTimeMs - Date.now()) / 1000));
};

export function useCountdown(
  targetTimeMs: number | null,
  options: UseCountdownOptions = {}
): { remainingSeconds: number; isActive: boolean } {
  const { onComplete, intervalMs = 1000 } = options;
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!targetTimeMs) {
      const timeoutId = window.setTimeout(() => {
        setRemainingSeconds(0);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const tick = (): boolean => {
      const remaining = toRemainingSeconds(targetTimeMs);
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        onComplete?.();
        return true;
      }
      return false;
    };

    let intervalId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      if (tick()) return;
      intervalId = window.setInterval(() => {
        if (tick() && intervalId !== null) {
          window.clearInterval(intervalId);
        }
      }, intervalMs);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [intervalMs, onComplete, targetTimeMs]);

  return {
    remainingSeconds,
    isActive: Boolean(targetTimeMs) && remainingSeconds > 0,
  };
}
