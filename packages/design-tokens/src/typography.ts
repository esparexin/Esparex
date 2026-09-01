export const typography = {
  fonts: {
    sans: ['var(--font-primary)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    mono: ['var(--font-mono)', 'monospace'],
  },
  mobileFonts: {
    sans: 'System',
    mono: 'monospace',
  },
  fontSizes: {
    'display': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 36px
    'h1': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],  // 30px
    'h2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],     // 24px
    'h3': ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],    // 20px
    'h4': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0' }],          // 18px
    'body-lg': ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],         // 16px
    'body': ['0.875rem', { lineHeight: '1.55', letterSpacing: '0' }],       // 14px
    'small': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0' }],      // 13px
    'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0' }],      // 12px
    'tiny': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0' }],       // 11px
  } as const,
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
};
