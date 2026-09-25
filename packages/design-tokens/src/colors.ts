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
    background: base.slate[50], // #F8FAFC (Crisp Ice Slate)
    foreground: base.slate[900], // #0F172A (Deep Obsidian Ink)
    'foreground-secondary': base.slate[600], // #475569
    card: base.white, // #FFFFFF
    'card-foreground': base.slate[900],
    popover: base.white,
    'popover-foreground': base.slate[900],
    primary: base.slate[900], // #0F172A (Obsidian Slate CTA - 15:1 contrast against white)
    'primary-foreground': base.white,
    'primary-hover': base.slate[800], // #1E293B
    'primary-subtle': base.slate[100], // #F1F5F9
    secondary: base.slate[100],
    'secondary-foreground': base.slate[900],
    destructive: base.error, // #DC2626
    'destructive-foreground': base.white,
    'destructive-dark': base['error-dark'],
    success: '#059669', // Precision Emerald (WCAG AA 4.5:1 on light)
    'success-foreground': base.white,
    'success-subtle': '#ecfdf5',
    'success-dark': '#047857',
    warning: base.warning, // #D97706
    'warning-foreground': base.white,
    'warning-subtle': base['warning-subtle'],
    'warning-dark': base['warning-dark'],
    info: base.info,
    'info-foreground': base.white,
    'info-subtle': base['info-subtle'],
    'info-dark': base['info-dark'],
    muted: base.slate[100],
    'muted-foreground': base.slate[500], // #64748B
    accent: base.slate[100],
    'accent-foreground': base.slate[900],
    border: base.slate[200], // #E2E8F0 (Crisp Slate-200, WCAG 2.2 AA compliant)
    input: base.slate[200],  // #E2E8F0
    ring: base.slate[900],
    // Primary interactive control color
    action: base.slate[900],
    // Inverse surface (dark card in light mode context)
    'inverse-surface': base.slate[900],
    'inverse-muted': base.slate[400],
    'inverse-subtle': base.slate[200],
    // Overlay / modal scrim
    overlay: 'rgba(15, 23, 42, 0.6)',
  },
  dark: {
    background: base.slate[950], // #020617 (Deep OLED Obsidian)
    foreground: base.slate[50], // #F8FAFC
    'foreground-secondary': base.slate[400], // #94A3B8
    card: base.slate[900], // #0F172A
    'card-foreground': base.slate[50],
    popover: base.slate[900],
    'popover-foreground': base.slate[50],
    primary: base.slate[50], // #F8FAFC (High-contrast inverse action)
    'primary-foreground': base.slate[950], // #020617
    'primary-hover': base.slate[200], // #E2E8F0
    'primary-subtle': base.slate[800], // #1E293B
    action: base.slate[50],
    secondary: base.slate[800],
    'secondary-foreground': base.slate[50],
    destructive: base.error,
    'destructive-foreground': base.slate[50],
    'destructive-dark': base['error-dark'],
    success: '#10b981', // Vibrant Emerald for dark background
    'success-foreground': base.slate[950],
    'success-subtle': '#064e3b',
    'success-dark': '#047857',
    warning: base.warning,
    'warning-foreground': base.slate[950],
    'warning-subtle': base['warning-subtle'],
    'warning-dark': base['warning-dark'],
    info: base.info,
    'info-foreground': base.slate[950],
    'info-subtle': base['info-subtle'],
    'info-dark': base['info-dark'],
    muted: base.slate[800],
    'muted-foreground': base.slate[400],
    accent: base.slate[800],
    'accent-foreground': base.slate[50],
    border: base.slate[800], // #1E293B
    input: base.slate[800],
    ring: base.slate[400],
    'inverse-surface': base.slate[50],
    'inverse-muted': base.slate[400],
    'inverse-subtle': base.slate[300],
    overlay: 'rgba(2, 6, 23, 0.7)',
  }
};

export const colors = {
  base,
  semantic
};
