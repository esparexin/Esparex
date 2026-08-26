export const base = {
  transparent: 'transparent',
  current: 'currentColor',
  black: '#000000',
  white: '#ffffff',
  brand: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a', // Primary Green (#16A34A)
    700: '#15803d',
    800: '#087a3e', // Deep Green (#087A3E)
    900: '#14532d',
    950: '#052e16',
  },
  warmNeutral: {
    50: '#fafaf8',  // App Background (#FAFAF8)
    100: '#f5f5f4', // Muted Surface
    200: '#e7e5e4', // Border & Dividers (#E7E5E4)
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e', // Text Secondary (#57534E)
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#171717', // Text Primary (#171717)
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  success: '#16a34a',
  'success-subtle': '#dcfce7',
  'success-dark': '#087a3e',
  error: '#dc2626',
  'error-dark': '#991b1b',
  warning: '#d97706',
  'warning-subtle': '#fef3c7',
  'warning-dark': '#b45309',
  info: '#2563eb',
  'info-subtle': '#eff6ff',
  'info-dark': '#1d4ed8',
  // Primary brand interactive control color (buttons, links, prices)
  'action': '#16a34a',
  // Inverse surface (dark stone) — used for dark-background cards in light mode (e.g. wallet card)
  'inverse-surface': '#1c1917',
  'inverse-muted': '#a8a29e',
  'inverse-subtle': '#d6d3d1',
  // Scrim / overlay
  'overlay': 'rgba(23, 23, 23, 0.6)',
};

// Semantic intent mapping directly to base primitives, independent of platform rendering tools (e.g. CSS Vars)
export const semantic = {
  light: {
    background: base.warmNeutral[50], // #FAFAF8
    foreground: base.warmNeutral[950], // #171717
    'foreground-secondary': base.warmNeutral[600], // #57534E
    card: base.white, // #FFFFFF
    'card-foreground': base.warmNeutral[950],
    popover: base.white,
    'popover-foreground': base.warmNeutral[950],
    primary: base.brand[600], // #16A34A
    'primary-foreground': base.white,
    'primary-hover': base.brand[800], // #087A3E
    'primary-subtle': base.brand[100], // #DCFCE7
    secondary: base.warmNeutral[100],
    'secondary-foreground': base.warmNeutral[950],
    destructive: base.error, // #DC2626
    'destructive-foreground': base.white,
    'destructive-dark': base['error-dark'],
    success: base.success,
    'success-foreground': base.white,
    'success-subtle': base['success-subtle'],
    'success-dark': base['success-dark'],
    warning: base.warning, // #D97706
    'warning-foreground': base.white,
    'warning-subtle': base['warning-subtle'],
    'warning-dark': base['warning-dark'],
    info: base.info,
    'info-foreground': base.white,
    'info-subtle': base['info-subtle'],
    'info-dark': base['info-dark'],
    muted: base.warmNeutral[100],
    'muted-foreground': base.warmNeutral[500],
    accent: base.warmNeutral[100],
    'accent-foreground': base.warmNeutral[950],
    border: base.warmNeutral[200], // #E7E5E4
    input: base.warmNeutral[200],
    ring: base.brand[600],
    // Primary interactive control color
    action: base.action,
    // Inverse surface (dark card in light mode context)
    'inverse-surface': base['inverse-surface'],
    'inverse-muted': base['inverse-muted'],
    'inverse-subtle': base['inverse-subtle'],
    // Overlay / modal scrim
    overlay: base.overlay,
  },
  dark: {
    background: base.warmNeutral[950],
    foreground: base.warmNeutral[50],
    'foreground-secondary': base.warmNeutral[400],
    card: base.warmNeutral[900],
    'card-foreground': base.warmNeutral[50],
    popover: base.warmNeutral[900],
    'popover-foreground': base.warmNeutral[50],
    primary: base.brand[500],
    'primary-foreground': base.warmNeutral[950],
    'primary-hover': base.brand[400],
    'primary-subtle': base.brand[900],
    action: base.brand[500],
    secondary: base.warmNeutral[800],
    'secondary-foreground': base.warmNeutral[50],
    destructive: base.error,
    'destructive-foreground': base.warmNeutral[50],
    'destructive-dark': base['error-dark'],
    success: base.success,
    'success-foreground': base.warmNeutral[950],
    'success-subtle': base['success-subtle'],
    'success-dark': base['success-dark'],
    warning: base.warning,
    'warning-foreground': base.warmNeutral[950],
    'warning-subtle': base['warning-subtle'],
    'warning-dark': base['warning-dark'],
    info: base.info,
    'info-foreground': base.warmNeutral[950],
    'info-subtle': base['info-subtle'],
    'info-dark': base['info-dark'],
    muted: base.warmNeutral[800],
    'muted-foreground': base.warmNeutral[400],
    accent: base.warmNeutral[800],
    'accent-foreground': base.warmNeutral[50],
    border: base.warmNeutral[800],
    input: base.warmNeutral[800],
    ring: base.brand[500],
    'inverse-surface': base.warmNeutral[50],
    'inverse-muted': base.warmNeutral[400],
    'inverse-subtle': base.warmNeutral[300],
    overlay: 'rgba(23, 23, 23, 0.7)',
  }
};

export const colors = {
  base,
  semantic
};
