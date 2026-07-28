import type { RefObject } from "react";

/**
 * Focuses and smoothly scrolls the window to the first invalid form element (`aria-invalid="true"` or matching `.border-destructive`).
 * Respects element ref boundaries when provided.
 */
export function scrollToFirstError(containerRef?: RefObject<HTMLElement | null>): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const root = containerRef?.current || document;
  const invalidElement = root.querySelector<HTMLElement>(
    '[aria-invalid="true"], input.border-destructive, select.border-destructive, textarea.border-destructive, [data-invalid="true"]'
  );

  if (invalidElement) {
    invalidElement.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      invalidElement.focus({ preventScroll: true });
    } catch {
      // Ignore focus failures on un-focusable elements
    }
    return true;
  }

  return false;
}
