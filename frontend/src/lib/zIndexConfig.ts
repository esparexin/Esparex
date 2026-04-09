/**
 * Centralized Z-Index Management
 *
 * This file manages all z-index values across the application to prevent
 * stacking context conflicts and ensure consistent layering behavior.
 *
 * Usage:
 *   - Avoid hardcoding z-index values in components
 *   - Always reference Z_INDEX constants instead
 *   - For Tailwind: use inline style={{ zIndex: Z_INDEX.X }} or CSS modules
 */

export const Z_INDEX = {
  // ── Base Layers ──────────────────────────────────────────────────────────
  base: 0,

  // ── Sticky/Relative Positioning ──────────────────────────────────────────
  // Elements that should stay in document flow
  sticky: 10,
  stickyHeader: 11,

  // ── Mobile Header ────────────────────────────────────────────────────────
  mobileHeaderTooltip: 60,

  // ── Floating Elements ────────────────────────────────────────────────────
  // Tooltips, popovers, dropdowns
  dropdown: 100,
  popover: 110,
  tooltip: 120,

  // ── User Interface Headers & Fixed Elements ──────────────────────────────
  userHeader: 999,              // Sticky user header
  desktopHeader: 999,
  userHeaderPopover: 105,       // First visit wrapper under header
  userHeaderDropdown: 110,      // Location selector, account dropdown

  // ── Sheet/Drawer System ─────────────────────────────────────────────────
  sheetOverlay: 200,            // Sheet/drawer backdrop
  sheetContent: 201,            // Sheet/drawer content

  // ── Dialog System ────────────────────────────────────────────────────────
  // Aligned with Radix UI dialog primitives
  dialogOverlay: 300,           // Background overlay for modals
  dialogContent: 301,           // Modal content (always above overlay)
  wizardModal: 301,             // Wizard modal uses same as dialog

  // ── Listing Modal ────────────────────────────────────────────────────────
  listingModal: 1001,           // Full-screen listing modal

  // ── Popovers & Selection Overlays ────────────────────────────────────────
  locationSelectorBackdrop: 9998,
  brandSearchBackdrop: 9998,
  selectContent: 99999,         // Select dropdown content (above all)

  // ── Notifications & Alerts ──────────────────────────────────────────────
  toast: 400,                   // One-time notifications
  alert: 401,                   // Alert dialogs
  connectivityBanner: 9999,     // Connectivity status
  backendStatusBanner: 10000,   // Backend status
  appErrorBanner: 12000,        // App-wide error banner

  // ── Debugging/Special ────────────────────────────────────────────────────
  debugLayer: 99999,            // For development only
} as const;

/**
 * Type-safe z-index getter
 * Ensures all z-index values are explicitly defined
 */
export type ZIndexKey = keyof typeof Z_INDEX;

/**
 * Validates that z-index value exists in config
 */
export function getZIndex(key: ZIndexKey): number {
  return Z_INDEX[key];
}

/**
 * Helper for creating z-index inline styles
 * Usage: <div style={zIndexStyle('dialogContent')} />
 */
export function zIndexStyle(key: ZIndexKey): React.CSSProperties {
  return { zIndex: Z_INDEX[key] };
}
