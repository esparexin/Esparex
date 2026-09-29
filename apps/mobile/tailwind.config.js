/**
 * apps/mobile/tailwind.config.js — NativeWind v4 configuration
 *
 * IMPORTANT: React Native's StyleSheet.create() cannot resolve CSS custom
 * properties (hsl(var(--...))). All color values MUST be concrete hex strings
 * resolved at NativeWind build time. This config sources concrete values from
 * @esparex/design-tokens mobileSemanticColors (the canonical SSOT).
 *
 * Dark mode is intentionally not supported in this application.
 * The app always renders in light mode regardless of OS preference.
 * darkMode is omitted so NativeWind does not generate dark: variant output.
 */
const { typography, base, mobileSemanticColors } = require("../../packages/design-tokens/dist/index.js");

const light = mobileSemanticColors.light;

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./App.tsx",
    "../../packages/mobile-ui/src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  // darkMode is intentionally omitted — the app is light-mode only.
  // NativeWind will not generate dark: variant classes without this key.
  theme: {
    extend: {
      fontFamily: typography.mobileFonts,
      fontSize: typography.fontSizes,
      fontWeight: typography.fontWeights,
      colors: {
        // Primitive palettes — kept for direct usage (brand-600, slate-400, etc.)
        brand: base.brand,
        slate: base.slate,
        action: base.action,

        // ─── Semantic Tokens ────────────────────────────────────────────────────
        // RC-2 FIX: All values are concrete hex strings from @esparex/design-tokens.
        // No hsl(var(--...)) — those are browser-only and unresolvable by NativeWind.
        // Light-mode only: darkMode is intentionally omitted so NativeWind does
        // not generate dark: variant classes.

        background: light.background,
        foreground: light.foreground,

        // RC-4 FIX: foreground-subtle and foreground-secondary were undefined
        // in the previous mobile Tailwind config. Now mapped to concrete hex.
        'foreground-secondary': light['foreground-secondary'],
        'foreground-subtle': light['muted-foreground'],

        card: {
          DEFAULT: light.card,
          foreground: light['card-foreground'],
        },
        popover: {
          DEFAULT: light.popover,
          foreground: light['popover-foreground'],
        },
        primary: {
          DEFAULT: light.primary,
          foreground: light['primary-foreground'],
        },
        secondary: {
          DEFAULT: light.secondary,
          foreground: light['secondary-foreground'],
        },
        destructive: {
          DEFAULT: light.destructive,
          foreground: light['destructive-foreground'],
        },
        muted: {
          DEFAULT: light.muted,
          foreground: light['muted-foreground'],
        },
        accent: {
          DEFAULT: light.accent,
          foreground: light['accent-foreground'],
        },
        success: {
          DEFAULT: light.success,
          foreground: light['success-foreground'],
        },
        warning: {
          DEFAULT: light.warning,
          foreground: light['warning-foreground'],
        },
        info: {
          DEFAULT: light.info,
          foreground: light['info-foreground'],
        },
        border: light.border,
        input: light.input,
        ring: light.ring,
        link: {
          DEFAULT: light.action,
          foreground: light['primary-foreground'],
        },
      },
    },
  },
  plugins: [],
};
