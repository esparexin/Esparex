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

  // ── Listing Actions ──────────────────────────────────────────────────────
  listingBottomActions: 70,

  // ── Floating Elements ────────────────────────────────────────────────────
  // Tooltips, popovers, dropdowns
  dropdown: 1000,
  popover: 1000,
  tooltip: 1200,

  // ── User Interface Headers & Fixed Elements ──────────────────────────────
  userHeader: 999,              // Sticky user header
  desktopHeader: 999,
  userHeaderPopover: 1005,      // First visit wrapper under header
  userHeaderDropdown: 1000,     // Location selector, account dropdown

  // ── Sheet/Drawer System ─────────────────────────────────────────────────
  sheetOverlay: 1050,           // Sheet/drawer backdrop (must be above userHeader: 999)
  sheetContent: 1051,           // Sheet/drawer content (must be above userHeader: 999)

  // ── Dialog System ────────────────────────────────────────────────────────
  // Architectural Stacking Invariant (F-Z2 fixed 2026-10-07):
  // alertDialogContent (1110) > alertDialogOverlay (1100) > dialogContent (1070)
  //   > dialogOverlay (1060) > sheetContent (1051) > sheetOverlay (1050)
  //   > userHeader (999).
  // Dialogs sit ABOVE sheets: a Dialog opened over an open Sheet is the more
  // focused interaction and must render on top (previously inverted).
  dialogOverlay: 1060,          // Background overlay for modals (above sheets)
  dialogContent: 1070,          // Modal content card (always above overlay)
  wizardModal: 1070,            // Wizard modal content
  listingModal: 1070,           // Listing modal content

  // ── AlertDialog System ───────────────────────────────────────────────────
  alertDialogOverlay: 1100,     // AlertDialog backdrop (above standard dialogs)
  alertDialogContent: 1110,     // AlertDialog content card (above alert backdrop)

  // ── Auth Modal System ────────────────────────────────────────────────────
  authModalOverlay: 1060,       // Auth modal backdrop (aligned with dialogOverlay)
  authModalContent: 1070,       // Auth modal dialog card (aligned with dialogContent)

  // ── Popovers & Selection Overlays ────────────────────────────────────────
  locationSelectorBackdrop: 9998,
  locationSelectorDropdown: 9999,
  brandSearchBackdrop: 9998,
  selectContent: 99999,         // Select dropdown content (above all)

  // ── Notifications & Alerts ──────────────────────────────────────────────
  toast: 400,                   // One-time notifications
  alert: 401,                   // Alert dialogs
  statusBanner: 999,            // Single status strip (StatusBannerHost). Shares the
                                // header layer: banner renders after the header in DOM
                                // order, so it stays visible over page chrome, while
                                // every dialog/sheet system (>= dialogOverlay 1000)
                                // always covers it. Never raise above 999.
  appErrorBanner: 11900,        // App-wide error banner (below popup modals;
                                // F-Z1: was 12000, colliding with popupOverlay)

  // ── Popup System (popupBus / notify) ────────────────────────────────────
  popupOverlay: 12000,          // Popup dialog backdrop (above all dialogs/drawers)
  popupContent: 12010,          // Popup dialog content card

  // ── Debugging/Special ────────────────────────────────────────────────────
  debugLayer: 99998,            // For development only (F-Z5: was 99999,
                                // colliding with selectContent)
} as const;

/**
 * Type-safe z-index getter
 * Ensures all z-index values are explicitly defined
 */
type ZIndexKey = keyof typeof Z_INDEX;

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