import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';

const DEFAULT_COOLDOWN_SECONDS = 60;

/**
 * Resilient OTP cooldown timer that tracks absolute expiry timestamp.
 * Recomputes remaining seconds when app resumes from background/inactive state.
 */
export function useOtpTimer(cooldownSeconds: number = DEFAULT_COOLDOWN_SECONDS) {
  const [targetExpiry, setTargetExpiry] = useState<number>(() => Date.now() + cooldownSeconds * 1000);
  const [secondsLeft, setSecondsLeft] = useState<number>(cooldownSeconds);

  const calculateSecondsLeft = useCallback((targetTime: number) => {
    return Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      setSecondsLeft(calculateSecondsLeft(targetExpiry));
    };

    updateTimer();
    if (calculateSecondsLeft(targetExpiry) <= 0) return;

    const interval = setInterval(updateTimer, 500);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updateTimer();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [targetExpiry, calculateSecondsLeft]);

  const resetTimer = useCallback((customCooldown?: number) => {
    const duration = customCooldown ?? cooldownSeconds;
    const nextTarget = Date.now() + duration * 1000;
    setTargetExpiry(nextTarget);
    setSecondsLeft(duration);
  }, [cooldownSeconds]);

  const formattedTimer = `0:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;

  return {
    secondsLeft,
    formattedTimer,
    resetTimer,
  };
}
