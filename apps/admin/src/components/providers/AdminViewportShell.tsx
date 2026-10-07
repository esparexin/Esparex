"use client";

import { useVisualViewport } from "@esparex/ui";

/**
 * Mounts the visual-viewport/keyboard tracking system for the admin app.
 * Syncs `--visual-viewport-height` and `--keyboard-height` CSS custom
 * properties so dialogs, sheets, and drawers elevate above the iOS/Android
 * keyboard. Mirrors the web app's RootClientShell mounting.
 */
export function AdminViewportShell() {
  useVisualViewport();
  return null;
}