import { typography as canonicalTypography } from '@esparex/design-tokens';

/**
 * typography.ts — Mobile UI Typography Tokens for Esparex Platform
 * Re-exports canonical typography tokens derived from @esparex/design-tokens SSOT.
 */

export const typography = {
  fontFamily: canonicalTypography.mobileFonts,
  fontSize: canonicalTypography.fontSizes,
  fontWeight: canonicalTypography.fontWeights,
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.55,
    loose: 2,
  },
  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.02,
  },
};

export type TypographyFontSize = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption' | 'tiny';
export type TypographyFontWeight = 'normal' | 'medium' | 'semibold' | 'bold';
