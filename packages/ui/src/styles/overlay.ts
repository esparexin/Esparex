/**
 * overlay.ts — Style Constants for Overlay Primitives (Dialog, AlertDialog, Sheet, Drawer)
 *
 * Consumes canonical SSOT design tokens (typography.ts) and defines centralized
 * semantic role style compositions for overlay component primitives in @esparex/ui.
 */

export const OVERLAY_STYLES = {
  modalTitle: "text-h3 font-semibold text-foreground",
  panelTitle: "text-h4 font-semibold text-foreground",
  description: "text-body text-muted-foreground",
} as const;
