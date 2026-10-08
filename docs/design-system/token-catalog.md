# Esparex Design Token Catalog

> **Canonical Source of Truth:** `packages/design-tokens` (`colors.ts`, `typography.ts`, `durations.ts`, `generate-css.ts`) and `AGENTS.md` §21 Green palette.

**Version**: Design Tokens SSOT — Authoritative  
**Package**: `@esparex/design-tokens`  
**Import**: `import { semantic, base, spacing, typography, radius, shadows, motion, durations } from '@esparex/design-tokens'`  
**API Status**: Active SSOT. Extensions require ADR.

---

## Layer Architecture

```
Primitive (base)
  └── Raw values. No semantic meaning. Never used directly in application code.

Semantic (semantic.light / semantic.dark)
  └── Intent-mapped values. Always what application code should reference.
```

---

## Foundation Tokens

### Colors — Primitive Palette (`base`)

#### Brand (Green)

| Token | Value | Notes |
|-------|-------|-------|
| `base.brand[50]` | `#f0fdf4` | Tinted background / subtle fill |
| `base.brand[100]` | `#dcfce7` | Light accent |
| `base.brand[200]` | `#bbf7d0` | Soft highlight |
| `base.brand[300]` | `#86efac` | Muted brand tint |
| `base.brand[400]` | `#4ade80` | Accent border / hover |
| `base.brand[500]` | `#22c55e` | Secondary green |
| `base.brand[600]` | `#16a34a` | Primary Green (`#16A34A` SSOT) |
| `base.brand[700]` | `#15803d` | Dark brand shade |
| `base.brand[800]` | `#087a3e` | Deep Green (`#087A3E` SSOT) |
| `base.brand[900]` | `#14532d` | Deepest brand shade |
| `base.brand[950]` | `#052e16` | Darkest brand contrast |

#### Warm Neutral

| Token | Value | Notes |
|-------|-------|-------|
| `base.warmNeutral[50]` | `#fafaf8` | App background (`#FAFAF8`) |
| `base.warmNeutral[100]` | `#f5f5f4` | Muted surface |
| `base.warmNeutral[200]` | `#e7e5e4` | Border & dividers (`#E7E5E4`) |
| `base.warmNeutral[300]` | `#d6d3d1` | Subtle divider |
| `base.warmNeutral[400]` | `#a8a29e` | Placeholder / muted secondary |
| `base.warmNeutral[500]` | `#78716c` | Muted text |
| `base.warmNeutral[600]` | `#57534e` | Text secondary (`#57534E`) |
| `base.warmNeutral[700]` | `#44403c` | Deep neutral |
| `base.warmNeutral[800]` | `#292524` | Inverse text secondary |
| `base.warmNeutral[900]` | `#1c1917` | Inverse surface |
| `base.warmNeutral[950]` | `#171717` | Text primary (`#171717`) |

#### Slate (Neutral)

| Token | Value | Notes |
|-------|-------|-------|
| `base.slate[50]` | `#f8fafc` | Crisp Ice Slate / App background |
| `base.slate[100]` | `#f1f5f9` | Muted surface |
| `base.slate[200]` | `#e2e8f0` | Border & input border (`#E2E8F0`) |
| `base.slate[300]` | `#cbd5e1` | Divider line |
| `base.slate[400]` | `#94a3b8` | Muted text (dark) |
| `base.slate[500]` | `#64748b` | Muted text (light) |
| `base.slate[600]` | `#475569` | Secondary foreground |
| `base.slate[700]` | `#334155` | Charcoal slate / high-contrast secondary |
| `base.slate[800]` | `#1e293b` | Dark card / inverse surface |
| `base.slate[900]` | `#0f172a` | Deep obsidian ink / dark card (`#0F172A`) |
| `base.slate[950]` | `#020617` | Deep OLED obsidian (`#020617`) |

#### Semantic Primitives (Status)

| Token | Value | Description |
|-------|-------|-------------|
| `base.success` | `#16a34a` | Success indicator |
| `base['success-subtle']` | `#dcfce7` | Success tinted background |
| `base['success-dark']` | `#087a3e` | High-contrast success |
| `base.error` | `#dc2626` | Destructive / error indicator |
| `base['error-dark']` | `#991b1b` | High-contrast error |
| `base.warning` | `#d97706` | Warning indicator |
| `base['warning-subtle']` | `#fef3c7` | Warning tinted background |
| `base['warning-dark']` | `#b45309` | High-contrast warning |
| `base.info` | `#2563eb` | Info indicator |
| `base['info-subtle']` | `#eff6ff` | Info tinted background |
| `base['info-dark']` | `#1d4ed8` | High-contrast info |

#### Special Primitives

| Token | Value | Intent |
|-------|-------|--------|
| `base.action` | `#16a34a` | Primary brand interactive control color |
| `base['inverse-surface']` | `#1c1917` | Dark stone card in light mode (e.g. wallet card) |
| `base['inverse-muted']` | `#a8a29e` | Muted text on inverse surface |
| `base['inverse-subtle']` | `#d6d3d1` | Subtle text on inverse surface |
| `base.overlay` | `rgba(23, 23, 23, 0.6)` | Scrim / modal backdrop |

---

## Semantic Tokens

> Use these in all application code. Never reference `base.*` directly.

### `semantic.light` — Light Mode

#### Surface & Text

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.light.background` | `#f8fafc` (`base.slate[50]`) | Screen / page background |
| `semantic.light.foreground` | `#0f172a` (`base.slate[900]`) | Primary text |
| `semantic.light['foreground-secondary']` | `#334155` (`base.slate[700]`) | High-contrast secondary text, labels, metadata |
| `semantic.light.card` | `#ffffff` (`base.white`) | Card, sheet, modal background |
| `semantic.light['card-foreground']` | `#0f172a` (`base.slate[900]`) | Text on cards |
| `semantic.light.popover` | `#ffffff` (`base.white`) | Popover surface |
| `semantic.light['popover-foreground']` | `#0f172a` (`base.slate[900]`) | Text in popovers |
| `semantic.light.muted` | `#f1f5f9` (`base.slate[100]`) | Disabled / muted surface |
| `semantic.light['muted-foreground']` | `#64748b` (`base.slate[500]`) | Subdued / helper text |

#### Brand & Interaction

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.light.primary` | `#2563eb` | Royal Blue (WCAG 2.2 AA compliant, 5.17:1 contrast) |
| `semantic.light['primary-foreground']` | `#ffffff` | Text on primary |
| `semantic.light['primary-hover']` | `#1d4ed8` | Hover state on primary |
| `semantic.light['primary-subtle']` | `#eff6ff` | Subtle primary background |
| `semantic.light.secondary` | `#f1f5f9` (`base.slate[100]`) | Secondary surface |
| `semantic.light['secondary-foreground']` | `#0f172a` (`base.slate[900]`) | Text on secondary |
| `semantic.light.accent` | `#f1f5f9` (`base.slate[100]`) | Accent surface |
| `semantic.light['accent-foreground']` | `#0f172a` (`base.slate[900]`) | Text on accent |
| `semantic.light.border` | `#e2e8f0` (`base.slate[200]`) | Dividers, card borders |
| `semantic.light.input` | `#e2e8f0` (`base.slate[200]`) | Input field border |
| `semantic.light.ring` | `#2563eb` | Focus ring |
| `semantic.light.action` | `#2563eb` | Primary interactive control color |

#### Status

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.light.destructive` | `#dc2626` (`base.error`) | Error state, delete actions |
| `semantic.light['destructive-foreground']` | `#ffffff` | Text on destructive |
| `semantic.light['destructive-dark']` | `#991b1b` (`base['error-dark']`) | Destructive text on light bg |
| `semantic.light.success` | `#059669` | Success state (WCAG AA 4.5:1) |
| `semantic.light['success-foreground']` | `#ffffff` | Text on success |
| `semantic.light['success-subtle']` | `#ecfdf5` | Success tinted background |
| `semantic.light['success-dark']` | `#047857` | Success text on light bg |
| `semantic.light.warning` | `#d97706` (`base.warning`) | Warning state |
| `semantic.light['warning-foreground']` | `#ffffff` | Text on warning |
| `semantic.light['warning-subtle']` | `#fef3c7` (`base['warning-subtle']`) | Warning tinted background |
| `semantic.light['warning-dark']` | `#b45309` (`base['warning-dark']`) | Warning text on light bg |
| `semantic.light.info` | `#2563eb` (`base.info`) | Informational state |
| `semantic.light['info-foreground']` | `#ffffff` | Text on info |
| `semantic.light['info-subtle']` | `#eff6ff` (`base['info-subtle']`) | Info tinted background |
| `semantic.light['info-dark']` | `#1d4ed8` (`base['info-dark']`) | Info text on light bg |

#### Surface Variants

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.light['inverse-surface']` | `#0f172a` (`base.slate[900]`) | Dark card on light page |
| `semantic.light['inverse-muted']` | `#94a3b8` (`base.slate[400]`) | Muted text on inverse surface |
| `semantic.light['inverse-subtle']` | `#e2e8f0` (`base.slate[200]`) | Subtle text on inverse surface |
| `semantic.light.overlay` | `rgba(15, 23, 42, 0.6)` | Modal / drawer scrim |

---

### `semantic.dark` — Dark Mode

#### Surface & Text

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.dark.background` | `#020617` (`base.slate[950]`) | Screen / page background |
| `semantic.dark.foreground` | `#f8fafc` (`base.slate[50]`) | Primary text |
| `semantic.dark['foreground-secondary']` | `#94a3b8` (`base.slate[400]`) | Secondary text |
| `semantic.dark.card` | `#0f172a` (`base.slate[900]`) | Card, sheet, modal background |
| `semantic.dark['card-foreground']` | `#f8fafc` (`base.slate[50]`) | Text on cards |
| `semantic.dark.popover` | `#0f172a` (`base.slate[900]`) | Popover surface |
| `semantic.dark['popover-foreground']` | `#f8fafc` (`base.slate[50]`) | Text in popovers |
| `semantic.dark.muted` | `#1e293b` (`base.slate[800]`) | Disabled / muted surface |
| `semantic.dark['muted-foreground']` | `#94a3b8` (`base.slate[400]`) | Subdued / helper text |

#### Brand & Interaction

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.dark.primary` | `#3b82f6` | Blue-500 (vivid on dark surfaces) |
| `semantic.dark['primary-foreground']` | `#ffffff` | Text on primary |
| `semantic.dark['primary-hover']` | `#60a5fa` | Blue-400 hover |
| `semantic.dark['primary-subtle']` | `#1e3a8a` | Blue-900 subtle |
| `semantic.dark.action` | `#3b82f6` | Interactive control |
| `semantic.dark.secondary` | `#1e293b` (`base.slate[800]`) | Secondary surface |
| `semantic.dark['secondary-foreground']` | `#f8fafc` (`base.slate[50]`) | Text on secondary |
| `semantic.dark.accent` | `#1e293b` (`base.slate[800]`) | Accent surface |
| `semantic.dark['accent-foreground']` | `#f8fafc` (`base.slate[50]`) | Text on accent |
| `semantic.dark.border` | `#1e293b` (`base.slate[800]`) | Dividers, borders |
| `semantic.dark.input` | `#1e293b` (`base.slate[800]`) | Input border |
| `semantic.dark.ring` | `#94a3b8` (`base.slate[400]`) | Focus ring |

#### Status & Surface Variants

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.dark.destructive` | `#dc2626` (`base.error`) | Destructive / error |
| `semantic.dark['destructive-foreground']` | `#f8fafc` (`base.slate[50]`) | Text on destructive |
| `semantic.dark['destructive-dark']` | `#991b1b` (`base['error-dark']`) | Destructive dark |
| `semantic.dark.success` | `#10b981` | Vibrant emerald for dark |
| `semantic.dark['success-foreground']` | `#020617` (`base.slate[950]`) | Text on success |
| `semantic.dark['success-subtle']` | `#064e3b` | Tinted subtle success |
| `semantic.dark['success-dark']` | `#047857` | High contrast success |
| `semantic.dark.warning` | `#d97706` (`base.warning`) | Warning state |
| `semantic.dark['warning-foreground']` | `#020617` (`base.slate[950]`) | Text on warning |
| `semantic.dark['warning-subtle']` | `#fef3c7` (`base['warning-subtle']`) | Tinted warning |
| `semantic.dark['warning-dark']` | `#b45309` (`base['warning-dark']`) | High contrast warning |
| `semantic.dark.info` | `#2563eb` (`base.info`) | Informational |
| `semantic.dark['info-foreground']` | `#020617` (`base.slate[950]`) | Text on info |
| `semantic.dark['info-subtle']` | `#eff6ff` (`base['info-subtle']`) | Tinted info |
| `semantic.dark['info-dark']` | `#1d4ed8` (`base['info-dark']`) | High contrast info |
| `semantic.dark['inverse-surface']` | `#f8fafc` (`base.slate[50]`) | Inverse light card |
| `semantic.dark['inverse-muted']` | `#94a3b8` (`base.slate[400]`) | Muted on inverse |
| `semantic.dark['inverse-subtle']` | `#cbd5e1` (`base.slate[300]`) | Subtle on inverse |
| `semantic.dark.overlay` | `rgba(2, 6, 23, 0.7)` | Scrim / backdrop |

---

## Spacing (`spacing`)

| Token | Value | Tailwind Equivalent |
|-------|-------|---------------------|
| `spacing[0]` | `0px` | `space-0` |
| `spacing[1]` | `4px` | `space-1` |
| `spacing[2]` | `8px` | `space-2` |
| `spacing[3]` | `12px` | `space-3` |
| `spacing[4]` | `16px` | `space-4` |
| `spacing[5]` | `20px` | `space-5` |
| `spacing[6]` | `24px` | `space-6` |
| `spacing[8]` | `32px` | `space-8` |
| `spacing[10]` | `40px` | `space-10` |
| `spacing[12]` | `48px` | `space-12` |
| `spacing[16]` | `64px` | `space-16` |
| `spacing[20]` | `80px` | `space-20` |
| `spacing[24]` | `96px` | `space-24` |

---

## Typography (`typography`)

### Font Sizes (Canonical 10-Level Scale — EA-039)

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `typography.fontSizes.display` | 36px / 2.25rem | 1.2 | Hero headings |
| `typography.fontSizes.h1` | 30px / 1.875rem | 1.25 | Page titles |
| `typography.fontSizes.h2` | 24px / 1.5rem | 1.3 | Section headings |
| `typography.fontSizes.h3` | 20px / 1.25rem | 1.35 | Card headings |
| `typography.fontSizes.h4` | 18px / 1.125rem | 1.4 | Sub-headings |
| `typography.fontSizes['body-lg']` | 16px / 1.0rem | 1.5 | Large body text / Mobile input base |
| `typography.fontSizes.body` | 14px / 0.875rem | 1.55 | Body copy |
| `typography.fontSizes.small` | 13px / 0.8125rem | 1.5 | Secondary text |
| `typography.fontSizes.caption` | 12px / 0.75rem | 1.4 | Labels, captions |
| `typography.fontSizes.tiny` | 11px / 0.6875rem | 1.4 | Badges, chips |

### Font Weights

| Token | Value |
|-------|-------|
| `typography.fontWeights.normal` | `400` |
| `typography.fontWeights.medium` | `500` |
| `typography.fontWeights.semibold` | `600` |
| `typography.fontWeights.bold` | `700` |

---

## Durations (`durations`)

| Token | Value | Usage |
|-------|-------|-------|
| `durations.fast` | `100ms` | Fast transitions |
| `durations.fastPlus` | `150ms` | Quick hovers and badge reveals |
| `durations.normal` | `200ms` | Standard transitions, dropdowns |
| `durations.normalPlus` | `250ms` | Smooth accordion transitions |
| `durations.keyboard` | `300ms` | Keyboard animation sync (matches iOS/Android deploy) |
| `durations.slow` | `400ms` | Modals, sheets, page transitions |
| `durations.slowPlus` | `500ms` | Slow deliberate animations |

---

## Radius (`radius`)

| Token | Value | Usage |
|-------|-------|-------|
| `radius.none` | `0px` | No rounding |
| `radius.sm` | `calc(var(--radius) - 4px)` | Tight elements |
| `radius.md` | `calc(var(--radius) - 2px)` | Inputs, chips |
| `radius.lg` | `var(--radius)` | Cards (default: 8px) |
| `radius.full` | `9999px` | Pills, avatars |

---

## Shadows (`shadows`)

| Token | Usage |
|-------|-------|
| `shadows.sm` | Subtle lift |
| `shadows.DEFAULT` | Standard card shadow |
| `shadows.md` | Elevated cards |
| `shadows.lg` | Modals, sheets |
| `shadows.xl` | Dialogs, popovers |
| `shadows['2xl']` | Maximum elevation |
| `shadows.inner` | Inset depth |
| `shadows.premium` | Feature cards |
| `shadows['premium-hover']` | Feature card hover state |

---

## Motion (`motion`)

### Keyframes

| Name | Description |
|------|-------------|
| `motion.keyframes.shake` | Horizontal shake (error feedback) |
| `motion.keyframes['reveal-up']` | Fade up entrance |

### Animations

| Token | Value | Usage |
|-------|-------|-------|
| `motion.animation.shake` | `shake 0.4s ease-in-out` | Form validation errors |
| `motion.animation['reveal-up']` | `reveal-up 0.5s ease-out forwards` | Panel / card entrance |

---

## Platform Support

| Token Group | Web (`apps/web`) | React Native (`apps/mobile`) |
|-------------|-----------------|------------------------------|
| `semantic.*` | ✅ Via CSS variables | ✅ Via `StyleSheet` import |
| `spacing` | ✅ Via Tailwind | ✅ Direct reference |
| `typography` | ✅ Via Tailwind | ✅ Direct reference |
| `durations` | ✅ Via CSS variables | ✅ Direct reference |
| `radius` | ✅ Via CSS variable `--radius` | ✅ Direct reference |
| `shadows` | ✅ Via Tailwind | ⚠️ No native equivalent — not used |
| `motion` | ✅ Via Tailwind animate | ⚠️ No native equivalent — use Reanimated |

---

## Governance & Maintenance

- **Canonical Authority:** All values are defined in `packages/design-tokens/src` and emitted to CSS via `packages/design-tokens/scripts/generate-css.ts`.
- **Enforcement:** Enforced in CI by `scripts/enforce-design-token-adoption.js` and `scripts/enforce-typography-ssot.js`.
- **Change Management:** Any changes to tokens or typography scales require an ADR and synchronization with `AGENTS.md`.
