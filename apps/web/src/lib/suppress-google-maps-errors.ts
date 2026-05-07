/**
 * Suppresses Google Maps retry console errors.
 * Uses a single shared wrapper with ref counting to avoid nested console overrides.
 */
const getGlobalConsole = (): Console => globalThis.console;

let originalConsoleError: Console["error"] | null = null;
let activeSuppressors = 0;

export function suppressGoogleMapsRetryErrors(): () => void {
  activeSuppressors += 1;

  if (activeSuppressors === 1) {
    // Intentional override: Google Maps loader emits noisy retry errors that are safe to suppress.
    const globalConsole = getGlobalConsole();
    originalConsoleError = globalConsole.error;
    globalConsole.error = (...args: unknown[]) => {
      const message = args[0] ? String(args[0]) : "";
      if (message.includes("Failed to load Google Maps script, retrying")) {
        return;
      }

      if (originalConsoleError) {
        originalConsoleError.apply(globalConsole, args as Parameters<Console["error"]>);
      }
    };
  }

  return () => {
    activeSuppressors = Math.max(0, activeSuppressors - 1);
    if (activeSuppressors === 0 && originalConsoleError) {
      getGlobalConsole().error = originalConsoleError;
      originalConsoleError = null;
    }
  };
}
