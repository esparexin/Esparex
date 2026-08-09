import { typography } from '@esparex/design-tokens';

/**
 * typography.ts — Typography Tokens for Esparex Platform
 * Re-exports canonical public typography scales, weights, line heights, and font families
 * derived from @esparex/design-tokens SSOT.
 */

export const TYPOGRAPHY_FONT_FAMILY: Record<string, string[]> = typography.fonts;

export const TYPOGRAPHY_FONT_SIZE: Record<string, readonly [string, { readonly lineHeight: string; readonly letterSpacing: string }]> = typography.fontSizes;


export const TYPOGRAPHY_FONT_WEIGHT: Record<string, string> = typography.fontWeights;

export const TYPOGRAPHY_TOKENS = {
  fontFamily: TYPOGRAPHY_FONT_FAMILY,
  fontSize: TYPOGRAPHY_FONT_SIZE,
  fontWeight: TYPOGRAPHY_FONT_WEIGHT,
};

export type TypographyFontSize = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption' | 'tiny';
export type TypographyFontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

