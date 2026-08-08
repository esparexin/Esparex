import { colors } from '@esparex/design-tokens';

/**
 * colors.ts — Single Source of Truth Color Tokens for Esparex Platform
 * Re-exports canonical color palette, semantic color tokens, and CSS variable mappings
 * derived from @esparex/design-tokens SSOT.
 */

export const COLOR_PALETTE = colors.base;

export const SEMANTIC_COLOR_TOKENS = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  card: 'var(--card)',
  cardForeground: 'var(--card-foreground)',
  popover: 'var(--popover)',
  popoverForeground: 'var(--popover-foreground)',
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  secondary: 'var(--secondary)',
  secondaryForeground: 'var(--secondary-foreground)',
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  accent: 'var(--accent)',
  accentForeground: 'var(--accent-foreground)',
  destructive: 'var(--destructive)',
  destructiveForeground: 'var(--destructive-foreground)',
  success: 'var(--success)',
  successForeground: 'var(--success-foreground)',
  warning: 'var(--warning)',
  warningForeground: 'var(--warning-foreground)',
  info: 'var(--info)',
  infoForeground: 'var(--info-foreground)',
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
} as const;

export type ColorPalette = typeof COLOR_PALETTE;
export type SemanticColorToken = keyof typeof SEMANTIC_COLOR_TOKENS;
