# Theme Contract

**Owner:** Platform  
**Status:** Active  
**Since:** @mad/ui v1.2.0  
**Last Reviewed:** 2026-07-06

---

## Purpose

This document defines the complete set of CSS custom properties that every theme **must** implement. A theme that is missing any required token is considered invalid and will fail future governance validation.

This contract ensures that all `@mad/ui` components can render correctly in any theme without modification.

---

## Required Token Groups

### Surface

These tokens define the background layering system.

| Token | Description |
|---|---|
| `--color-surface` | Primary page/app background |
| `--color-surface-secondary` | Slightly elevated backgrounds (sidebars, panels) |
| `--color-surface-card` | Card and container backgrounds |

### Text

| Token | Description |
|---|---|
| `--color-text-primary` | Primary readable text |
| `--color-text-secondary` | Secondary/supporting text |
| `--color-text-muted` | Placeholder and inactive text |

### Brand

| Token | Description |
|---|---|
| `--color-primary` | Primary brand color (CTAs, highlights) |
| `--color-secondary` | Secondary brand accent |
| `--color-tertiary` | Tertiary accent (rare use) |

### Semantic

| Token | Description |
|---|---|
| `--color-success` | Positive states, confirmations |
| `--color-warning` | Caution states |
| `--color-danger` | Error and destructive actions |
| `--color-info` | Informational states |

### Border

| Token | Description |
|---|---|
| `--color-border` | Default border color |
| `--color-border-subtle` | Subtle dividers and separators |

### Radius

| Token | Description |
|---|---|
| `--radius-sm` | Small elements (badges, tags) |
| `--radius-md` | Form inputs, buttons |
| `--radius-lg` | Cards, dialogs |
| `--radius-xl` | Large modals, sheets |
| `--radius-2xl` | Full-bleed rounded containers |
| `--radius-full` | Pill/circle shapes |

### Shadow

| Token | Description |
|---|---|
| `--shadow-sm` | Subtle elevation (dropdowns) |
| `--shadow-md` | Card elevation |
| `--shadow-lg` | Modal/drawer elevation |
| `--shadow-glow` | Brand-colored ambient glow |

### Motion

| Token | Description |
|---|---|
| `--transition-duration-fast` | Micro-interactions (hover, focus) — recommended: 150ms |
| `--transition-duration-base` | Standard transitions — recommended: 250ms |
| `--transition-duration-slow` | Complex animations — recommended: 400ms |
| `--transition-ease-smooth` | Standard easing — recommended: cubic-bezier(0.4, 0, 0.2, 1) |
| `--transition-ease-bounce` | Playful easing — recommended: cubic-bezier(0.34, 1.56, 0.64, 1) |

### Typography

| Token | Description |
|---|---|
| `--font-family-sans` | Primary UI font |
| `--font-family-mono` | Code and monospace font |

### Z-Index Layers

| Token | Description |
|---|---|
| `--z-base` | Default stacking (0) |
| `--z-dropdown` | Dropdown menus |
| `--z-sticky` | Sticky headers/elements |
| `--z-fixed` | Fixed position elements |
| `--z-modal` | Modal dialogs |
| `--z-popover` | Popovers and tooltips |
| `--z-toast` | Toast notifications |

### Opacity

| Token | Description |
|---|---|
| `--opacity-disabled` | Disabled element opacity |
| `--opacity-muted` | Muted/secondary element opacity |
| `--opacity-hover` | Hover state opacity |

---

## Creating a New Theme

1. Start with the `default` theme: `packages/ui/src/themes/default/index.css`
2. Copy it to `packages/ui/src/themes/<product>/index.css`
3. Override values with brand-specific tokens
4. Add an export entry in `packages/ui/package.json`:
   ```json
   "./themes/<product>": "./src/themes/<product>/index.css"
   ```
5. Document the new theme in `docs/design-system/future-themes.md`
6. Import in the product application's root layout:
   ```css
   @import "@mad/ui/themes/<product>";
   ```

---

## Theme Validation (Phase 4)

The following checks will become CI gates in Phase 4:

| Check | Severity |
|---|---|
| Missing required token | ❌ Build failure |
| Circular alias (A → B → A) | ❌ Build failure |
| Duplicate token definition | ⚠️ Warning |
| Orphaned token (defined, never used) | ⚠️ Warning |
| Text/background WCAG AA contrast failure | ⚠️ Warning |

---

## Existing Themes

| Theme | Status | Entry Point | Used By |
|---|---|---|---|
| `mad` | Stable | `@mad/ui/themes/mad` | apps/web, apps/admin |
| `default` | Stable | `@mad/ui/themes/default` | Reference implementation |

## Planned Themes

See [future-themes.md](../future-themes.md) for the roadmap.
