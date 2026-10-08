"use client";

import { useVisualViewport } from "@esparex/ui";

/**
 * Mounts the visual-viewport/keyboard tracking system for the admin app.
 * Syncs the viewport-height and keyboard-height CSS custom properties
 * (via the canonical useVisualViewport hook) so dialogs, sheets, and
 * drawers elevate above the iOS/Android keyboard. Mirrors the web app's
 * RootClientShell mounting.
 */
export function AdminViewportShell() {
  useVisualViewport();
  return null;
}