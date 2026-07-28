/**
 * typography.ts — Single Source of Truth Typography Tokens for Esparex Platform
 *
 * Defines the canonical public typography scales, weights, line heights, and font families
 * consumed across apps/web, apps/admin, and @esparex/ui primitives.
 */

export const TYPOGRAPHY_FONT_FAMILY: Record<string, string[]> = {
  sans: ['var(--font-primary)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
};

export const TYPOGRAPHY_FONT_SIZE: Record<string, [string, { lineHeight: string; letterSpacing: string }]> = {
  'display': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],  // 36px
  'h1': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],   // 30px
  'h2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],      // 24px
  'h3': ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],     // 20px
  'h4': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0' }],           // 18px
  'body': ['0.875rem', { lineHeight: '1.55', letterSpacing: '0' }],        // 14px (Default Body)
  'small': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0' }],       // 13px (Secondary / Tables)
  'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0' }],       // 12px (Helper / Badges)
  'tiny': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0' }],        // 11px (Dense Labels / Timestamps)
};

export const TYPOGRAPHY_FONT_WEIGHT: Record<string, string> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const TYPOGRAPHY_TOKENS = {
  fontFamily: TYPOGRAPHY_FONT_FAMILY,
  fontSize: TYPOGRAPHY_FONT_SIZE,
  fontWeight: TYPOGRAPHY_FONT_WEIGHT,
};

export type TypographyFontSize = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption' | 'tiny';
export type TypographyFontWeight = 'normal' | 'medium' | 'semibold' | 'bold';
