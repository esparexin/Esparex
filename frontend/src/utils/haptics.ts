"use client";
import logger from '@/lib/logger';

/**
 * Haptic Feedback Utility
 * Provides tactile feedback for mobile interactions
 * Follows iOS and Android haptic patterns
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Haptic vibration patterns (in milliseconds)
 */
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,           // Quick tap (button press)
  medium: 20,          // Medium tap (toggle)
  heavy: 30,           // Strong tap (important action)
  success: [10, 50, 10], // Double tap (success confirmation)
  warning: [15, 30, 15], // Alert pattern
  error: [20, 50, 20, 50, 20], // Multiple vibrations (error)
};

/**
 * Triggers haptic feedback if supported by the device
 * Falls back gracefully on unsupported devices
 * 
 * @param pattern - The type of haptic feedback
 * @returns boolean - Whether haptic was triggered
 * 
 * @example
 * ```tsx
 * import { haptic } from '@/utils/haptics';
 * 
 * const handleSave = () => {
 *   haptic('success');
 *   // ... save logic
 * };
 * ```
 */
export function haptic(pattern: HapticPattern = 'light'): boolean {
  // Check if running in browser
  if (typeof window === 'undefined') return false;

  // Check for Vibration API support
  if (!window.navigator?.vibrate) return false;

  const vibrationPattern = HAPTIC_PATTERNS[pattern];

  try {
    // Trigger vibration
    window.navigator.vibrate(vibrationPattern);
    return true;
  } catch (error) {
    // Silently fail on error
    logger.debug('Haptic feedback not supported', error);
    return false;
  }
}

/**
 * Specific haptic feedback functions for common actions
 */
export const haptics = {
  /**
   * Light tap - for general button presses
   */
  tap: () => haptic('light'),

  /**
   * Medium tap - for toggles and switches
   */
  toggle: () => haptic('medium'),

  /**
   * Heavy tap - for important actions (delete, submit)
   */
  impact: () => haptic('heavy'),

  /**
   * Success pattern - for successful operations
   */
  success: () => haptic('success'),

  /**
   * Warning pattern - for warning messages
   */
  warning: () => haptic('warning'),

  /**
   * Error pattern - for error states
   */
  error: () => haptic('error'),
};

/**
 * Hook for haptic feedback in React components
 * 
 * @example
 * ```tsx
 * import { useHaptics } from '@/utils/haptics';
 * 
 * function MyButton() {
 *   const { tap, success } = useHaptics();
 *   
 *   const handleClick = () => {
 *     tap(); // Immediate feedback
 *     // ... async operation
 *     success(); // Success feedback
 *   };
 * }
 * ```
 */
export function useHaptics() {
  return haptics;
}

/**
 * Utility to check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in window.navigator;
}
