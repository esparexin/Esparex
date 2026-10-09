/**
 * Durations (SSOT)
 * 
 * Canonical animation/transition durations for the Esparex platform.
 * All components should reference these tokens instead of hardcoding values.
 */
export const durations = {
  /** Fast transitions (100-150ms) */
  fast: '100ms',
  fastPlus: '150ms',
  
  /** Standard transitions (200-300ms) */
  normal: '200ms',
  normalPlus: '250ms',
  
  /** Keyboard animation synchronization (matches iOS/Android keyboard deploy) */
  keyboard: '300ms',
  
  /** Slow transitions (400-500ms) */
  slow: '400ms',
  slowPlus: '500ms',
} as const;

export type DurationKey = keyof typeof durations;