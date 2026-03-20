/**
 * Suppresses Google Maps retry console errors.
 * Uses a single shared wrapper with ref counting to avoid nested console overrides.
 */
let originalConsoleError: typeof console.error | null = null;
let activeSuppressors = 0;

export function suppressGoogleMapsRetryErrors(): () => void {
  activeSuppressors += 1;

  if (activeSuppressors === 1) {
    // Intentional console override: Google Maps loader emits noisy retry errors that are safe to suppress.
    originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args[0] ? String(args[0]) : "";
      if (message.includes("Failed to load Google Maps script, retrying")) {
        return;
      }

      if (originalConsoleError) {
        originalConsoleError.apply(console, args as Parameters<typeof console.error>);
      }
    };
  }

  return () => {
    activeSuppressors = Math.max(0, activeSuppressors - 1);
    if (activeSuppressors === 0 && originalConsoleError) {
      console.error = originalConsoleError;
      originalConsoleError = null;
    }
  };
}
