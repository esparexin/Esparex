/**
 * spacing.ts — Single Source of Truth 8-Point Spacing Tokens for Esparex Platform
 *
 * Enforces canonical 8-point grid spacing utilities across apps/web, apps/admin, and @esparex/ui.
 */

export const SPACING_GRID_TOKENS: Record<string, string> = {
  '0': '0px',
  '1': '4px',    // 0.25rem
  '2': '8px',    // 0.5rem
  '3': '12px',   // 0.75rem
  '4': '16px',   // 1rem
  '6': '24px',   // 1.5rem
  '8': '32px',   // 2rem
  '10': '40px',  // 2.5rem
  '12': '48px',  // 3rem
  '16': '64px',  // 4rem
};

export const SHADOW_TOKENS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

export const BORDER_RADIUS_TOKENS: Record<string, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};
