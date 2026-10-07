"use client";

import * as React from "react";

/**
 * useDialogFocusRestore — focus restoration for trigger-less dialogs/sheets.
 *
 * Root cause (F-A1): Radix restores focus on close via `triggerRef.current?.focus()`
 * inside `onCloseAutoFocus`. This codebase never renders `<DialogTrigger>` /
 * `<SheetTrigger>` (all dialogs are controlled via the `open` prop), so the ref
 * is always null, Radix's restore is a no-op, and its internal `preventDefault()`
 * suppresses any other restore path — focus drops to `<body>` on every close.
 *
 * This hook captures `document.activeElement` in `onOpenAutoFocus` (before focus
 * moves into the dialog) and restores focus to it in `onCloseAutoFocus`.
 * Each dialog instance gets its own capture, so nested dialogs restore
 * correctly innermost-first.
 *
 * Usage: attach the returned handlers to the Radix Content element, chaining
 * with any consumer-provided handlers. If the consumer called `preventDefault()`,
 * restoration is skipped (their intent wins).
 */
export function useDialogFocusRestore() {
  const restoreRef = React.useRef<HTMLElement | null>(null);

  const handleOpenAutoFocus = React.useCallback(
    (event: Event, consumerHandler?: (e: Event) => void) => {
      // Capture BEFORE the consumer handler runs: at this point focus is still
      // on the element that opened the dialog (Radix hasn't moved it yet).
      const el = document.activeElement;
      restoreRef.current = el instanceof HTMLElement ? el : null;
      consumerHandler?.(event);
    },
    []
  );

  const handleCloseAutoFocus = React.useCallback(
    (event: Event, consumerHandler?: (e: Event) => void) => {
      consumerHandler?.(event);
      if (event.defaultPrevented) return;
      const target = restoreRef.current;
      if (target && document.contains(target)) {
        // Suppress Radix's trigger-based restore (no-op without a trigger)
        // and restore to the element that opened the dialog instead.
        event.preventDefault();
        target.focus({ preventScroll: true });
      }
      restoreRef.current = null;
    },
    []
  );

  return { handleOpenAutoFocus, handleCloseAutoFocus };
}