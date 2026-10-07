"use client";

import { useEffect } from "react";

/**
 * useEscapeCapture — capture-phase Escape handler for dropdowns inside dialogs.
 *
 * Root cause (F-K1): Radix Dialog registers Escape on `document` with
 * capture:true, which runs before React bubble-phase onKeyDown. Attach at
 * `window` capture (runs before document) and stop propagation so the open
 * dropdown closes instead of the parent dialog.
 *
 * Extracted from useListKeyboardNavigation to keep the hook within the
 * file-size ratchet.
 */
export function useEscapeCapture(isOpen: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      e.preventDefault();
      onEscape();
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [isOpen, onEscape]);
}