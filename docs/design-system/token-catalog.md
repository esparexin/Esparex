# Esparex Design Token Catalog

**Version**: Sprint 2 — Final  
**Package**: `@esparex/design-tokens`  
**Import**: `import { semantic, base, spacing, typography, radius, shadows, motion } from '@esparex/design-tokens'`  
**API Status**: Frozen at Sprint 2 completion. Extensions require ADR.

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

#### Brand (Sky Blue)

| Token | Value | Notes |
|-------|-------|-------|
| `base.brand[50]` | `#f0f9ff` | |
| `base.brand[100]` | `#e0f2fe` | |
| `base.brand[200]` | `#bae6fd` | |
| `base.brand[300]` | `#7dd3fc` | |
| `base.brand[400]` | `#38bdf8` | |
| `base.brand[500]` | `#0ea5e9` | Dark mode primary |
| `base.brand[600]` | `#0284c7` | Light mode primary |
| `base.brand[700]` | `#0369a1` | |
| `base.brand[800]` | `#075985` | |
| `base.brand[900]` | `#0c4a6e` | |
| `base.brand[950]` | `#082f49` | |

#### Slate (Neutral)

| Token | Value | Notes |
|-------|-------|-------|
| `base.slate[50]` | `#f8fafc` | App background |
| `base.slate[100]` | `#f1f5f9` | Muted surface |
| `base.slate[200]` | `#e2e8f0` | Border |
| `base.slate[300]` | `#cbd5e1` | |
| `base.slate[400]` | `#94a3b8` | Muted text (dark) |
| `base.slate[500]` | `#64748b` | Muted text (light) |
| `base.slate[600]` | `#475569` | Secondary foreground |
| `base.slate[700]` | `#334155` | |
| `base.slate[800]` | `#1e293b` | Dark card / inverse surface |
| `base.slate[900]` | `#0f172a` | |
| `base.slate[950]` | `#020617` | Darkest foreground |

#### Semantic Primitives (Status)

| Token | Value | PR Added |
|-------|-------|----------|
| `base.success` | `#10b981` | PR 2 |
| `base['success-subtle']` | `#dcfce7` | PR 7 |
| `base['success-dark']` | `#16a34a` | PR 7 |
| `base.error` | `#ef4444` | PR 2 |
| `base['error-dark']` | `#dc2626` | PR 7 |
| `base.warning` | `#f59e0b` | PR 2 |
| `base['warning-subtle']` | `#fef3c7` | PR 7 |
| `base['warning-dark']` | `#d97706` | PR 7 |
| `base.info` | `#3b82f6` | PR 2 |
| `base['info-subtle']` | `#eff6ff` | PR 7 |
| `base['info-dark']` | `#1d4ed8` | PR 7 |

#### Special Primitives

| Token | Value | Intent | PR Added |
|-------|-------|--------|----------|
| `base.action` | `#2563eb` | Interactive control color. **ADR pending** before semantic promotion. | PR 7 |
| `base['inverse-surface']` | `#1e293b` | Dark card background in light mode context | PR 7 |
| `base['inverse-muted']` | `#94a3b8` | Muted text on inverse surface | PR 7 |
| `base['inverse-subtle']` | `#cbd5e1` | Subtle text on inverse surface | PR 7 |
| `base.overlay` | `rgba(15, 23, 42, 0.6)` | Modal / drawer scrim | PR 7 |

---

## Semantic Tokens

> Use these in all application code. Never reference `base.*` directly.

### `semantic.light` — Light Mode

#### Surface & Text

| Token | Value | Usage |
|-------|-------|-------|
| `semantic.light.background` | `#ffffff` | Screen / page background |
| `semantic.light.foreground` | `#020617` | Primary text |
| `semantic.light.card` | `#ffffff` | Card, sheet, modal background |
| `semantic.light['card-foreground']` | `#020617` | Text on cards |
| `semantic.light.popover` | `#ffffff` | Popover surface |
| `semantic.light['popover-foreground']` | `#020617` | Text in popovers |
| `semantic.light.muted` | `#f1f5f9` | Disabled / placeholder surface |
| `semantic.light['muted-foreground']` | `#64748b` | Subdued / helper text |

#### Brand & Interaction

| Token | Value | Usage | PR |
|-------|-------|-------|----|
| `semantic.light.primary` | `#0284c7` | Brand primary (sky blue) | PR 2 |
| `semantic.light['primary-foreground']` | `#ffffff` | Text on primary | PR 2 |
| `semantic.light.action` | `#2563eb` | Primary interactive control (buttons, links, prices) | Sprint 3 (ADR-004) |
| `semantic.light.secondary` | `#f1f5f9` | Secondary surface | PR 2 |
| `semantic.light['secondary-foreground']` | `#0f172a` | Text on secondary | PR 2 |
| `semantic.light.accent` | `#f1f5f9` | Accent surface | PR 2 |
| `semantic.light['accent-foreground']` | `#0f172a` | Text on accent | PR 2 |
| `semantic.light.ring` | `#0284c7` | Focus ring | PR 2 |
| `semantic.light.border` | `#e2e8f0` | Dividers, input borders | PR 2 |
| `semantic.light.input` | `#e2e8f0` | Input field border | PR 2 |

#### Status

| Token | Value | Usage | PR |
|-------|-------|-------|----|
| `semantic.light.destructive` | `#ef4444` | Error state, delete actions | PR 2 |
| `semantic.light['destructive-foreground']` | `#ffffff` | Text on destructive | PR 2 |
| `semantic.light['destructive-dark']` | `#dc2626` | Destructive text on light bg | PR 7 |
| `semantic.light.success` | `#10b981` | Success state | PR 2 |
| `semantic.light['success-foreground']` | `#ffffff` | Text on success | PR 2 |
| `semantic.light['success-subtle']` | `#dcfce7` | Success tinted background | PR 7 |
| `semantic.light['success-dark']` | `#16a34a` | Success text on light bg | PR 7 |
| `semantic.light.warning` | `#f59e0b` | Warning state | PR 2 |
| `semantic.light['warning-foreground']` | `#ffffff` | Text on warning | PR 2 |
| `semantic.light['warning-subtle']` | `#fef3c7` | Warning tinted background | PR 7 |
| `semantic.light['warning-dark']` | `#d97706` | Warning text on light bg | PR 7 |
| `semantic.light.info` | `#3b82f6` | Informational state | PR 2 |
| `semantic.light['info-foreground']` | `#ffffff` | Text on info | PR 2 |
| `semantic.light['info-subtle']` | `#eff6ff` | Info tinted background | PR 7 |
| `semantic.light['info-dark']` | `#1d4ed8` | Info text on light bg | PR 7 |

#### Surface Variants

| Token | Value | Usage | PR |
|-------|-------|-------|----|
| `semantic.light['inverse-surface']` | `#1e293b` | Dark card on light page (e.g. wallet) | PR 7 |
| `semantic.light['inverse-muted']` | `#94a3b8` | Muted text on inverse surface | PR 7 |
| `semantic.light['inverse-subtle']` | `#cbd5e1` | Subtle text on inverse surface | PR 7 |
| `semantic.light.overlay` | `rgba(15, 23, 42, 0.6)` | Modal / drawer scrim | PR 7 |

---

### `semantic.dark` — Dark Mode

#### Surface & Text

| Token | Value |
|-------|-------|
| `semantic.dark.background` | `#020617` |
| `semantic.dark.foreground` | `#f8fafc` |
| `semantic.dark.card` | `#020617` |
| `semantic.dark.muted` | `#1e293b` |
| `semantic.dark['muted-foreground']` | `#94a3b8` |
| `semantic.dark.border` | `#1e293b` |
| `semantic.dark.primary` | `#0ea5e9` |
| `semantic.dark['primary-foreground']` | `#020617` |
| `semantic.dark.overlay` | `rgba(2, 6, 23, 0.7)` |

> Full dark mode token list mirrors `semantic.light` structure. See `packages/design-tokens/src/colors.ts` for complete values.

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

### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `typography.fontSizes.display` | 36px | 1.2 | Hero headings |
| `typography.fontSizes.h1` | 30px | 1.25 | Page titles |
| `typography.fontSizes.h2` | 24px | 1.3 | Section headings |
| `typography.fontSizes.h3` | 20px | 1.35 | Card headings |
| `typography.fontSizes.h4` | 18px | 1.4 | Sub-headings |
| `typography.fontSizes.body` | 14px | 1.55 | Body copy |
| `typography.fontSizes.small` | 13px | 1.5 | Secondary text |
| `typography.fontSizes.caption` | 12px | 1.4 | Labels, captions |
| `typography.fontSizes.tiny` | 11px | 1.4 | Badges, chips |

### Font Weights

| Token | Value |
|-------|-------|
| `typography.fontWeights.normal` | `400` |
| `typography.fontWeights.medium` | `500` |
| `typography.fontWeights.semibold` | `600` |
| `typography.fontWeights.bold` | `700` |

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
| `radius` | ✅ Via CSS variable `--radius` | ✅ Direct reference |
| `shadows` | ✅ Via Tailwind | ⚠️ No native equivalent — not used |
| `motion` | ✅ Via Tailwind animate | ⚠️ No native equivalent — use Reanimated |

---

## Open Items (Sprint 3)

| Item | Description |
|------|-------------|
| `base.action` ADR | Resolve `#2563eb` vs `#0284c7` before promoting `semantic.light.action` |
| 13 suppressions | Replace `eslint-disable` in migrated screens once ADR resolves |
| 15 inline styles | Migrate pre-existing `no-inline-styles` violations (Chat, Listings, PostAd) |
| Dark mode audit | Verify all `semantic.dark.*` tokens render correctly across screens |
