# Canonical Design Tokens

This document serves as the Single Source of Truth (SSOT) for UI tokens across the Esparex platform. All new components must consume these semantic tokens rather than relying on raw utility classes.

## 🎨 Semantic Colors

### Surfaces & Backgrounds
| Token | CSS Variable | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `--background` | `hsl(0 0% 100%)` | `hsl(222.2 84% 4.9%)` | App background, page shell base. |
| **Card** | `--card` | `hsl(0 0% 100%)` | `hsl(222.2 84% 4.9%)` | Card components, elevated surfaces. |
| **Popover** | `--popover` | `hsl(0 0% 100%)` | `hsl(222.2 84% 4.9%)` | Dropdowns, menus, tooltips. |
| **Muted** | `--muted` | `hsl(210 40% 98%)` | `hsl(217.2 32.6% 17.5%)` | Secondary/muted surfaces (e.g., active tabs, disabled states). |
| **Accent** | `--accent` | `hsl(210 40% 96.1%)` | `hsl(217.2 32.6% 17.5%)` | Hover states, selected items. |
| **Border** | `--border` | `hsl(214.3 31.8% 91.4%)` | `hsl(217.2 32.6% 17.5%)` | Default component borders, dividers. |
| **Input** | `--input` | `hsl(214.3 31.8% 91.4%)` | `hsl(217.2 32.6% 17.5%)` | Form field borders. |

### Text & Foreground
| Token | CSS Variable | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Foreground** | `--foreground` | `hsl(0 0% 10.2%)` | `hsl(210 40% 98%)` | Primary body text, headings, prominent text. |
| **Foreground Sec** | `--foreground-secondary`| `hsl(215.4 25% 26.7%)`| `hsl(215 20.2% 75.1%)` | Secondary body text. |
| **Foreground Ter** | `--foreground-tertiary` | `hsl(215.3 19.3% 34.5%)`| `hsl(215 20.2% 65.1%)` | Captions, small labels. |
| **Foreground Subtle**| `--foreground-subtle` | `hsl(215.4 16.3% 40%)` | `hsl(215 20.2% 45.1%)` | Placeholders, disabled text (Maintains WCAG 4.5:1 ratio). |

### Interactive & Status
| Token | CSS Variable | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `--primary` | `hsl(142.1 76.2% 45.3%)` | `hsl(142.1 70% 50%)` | Primary brand action (Green). |
| **Interactive** | `--link` | `hsl(221.2 83.2% 53.3%)` | `hsl(213.1 93.9% 67.8%)` | Links, primary buttons, active trust indicators. |
| **Success** | `--success` | `hsl(158.1 84.4% 39.4%)` | `hsl(158.1 84.4% 39.4%)` | Positive feedback, success states. |
| **Warning** | `--warning` | `hsl(37.7 92.1% 50.2%)` | `hsl(37.7 92.1% 50.2%)` | Warnings, pending states, alert banners. |
| **Destructive**| `--destructive`| `hsl(0 84.2% 60.2%)` | `hsl(0 62.8% 30.6%)` | Errors, deletion actions, destructive feedback. |

## 🖱️ Interaction & State Tokens

These tokens decouple user interaction from semantic colors, ensuring consistent behavior across inputs, buttons, and rows.

### Interaction Tokens
| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Hover** | `--interaction-hover` | `rgba(0,0,0,0.05)` (Light) / `rgba(255,255,255,0.1)` (Dark) | Background modifier for hovered elements. |
| **Pressed** | `--interaction-pressed` | `rgba(0,0,0,0.1)` (Light) / `rgba(255,255,255,0.15)` (Dark)| Background modifier for active/pressed elements. |
| **Selected**| `--interaction-selected`| `rgba(0,0,0,0.03)` (Light) / `rgba(255,255,255,0.05)` (Dark)| Background modifier for selected items (e.g. table rows). |
| **Focus Ring** | `--interaction-focus-ring` | `var(--ring)` | Universal focus ring color. |
| **Focus Offset**| `--interaction-focus-offset`| `var(--background)` | Universal focus ring offset background. |
| **Disabled Opacity**| `--interaction-disabled-opacity` | `0.5` | Default opacity for disabled surfaces. |
| **Disabled BG**| `--interaction-disabled-background` | `var(--muted)` | Semantic background for disabled inputs. |
| **Disabled Border**| `--interaction-disabled-border` | `var(--border)` | Semantic border for disabled inputs. |
| **Disabled FG**| `--interaction-disabled-foreground` | `var(--muted-foreground)` | Semantic text/icon color for disabled inputs. |

### State Tokens
| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Loading** | `--state-loading` | `var(--muted)` | Background for skeletons and loading surfaces. |
| **Success** | `--state-success` | `var(--success)` | Semantic color for valid/success states. |
| **Warning** | `--state-warning` | `var(--warning)` | Semantic color for warning states. |
| **Error** | `--state-error` | `var(--destructive)` | Semantic color for invalid/error states. |
| **Info** | `--state-info` | `var(--info)` | Semantic color for informational states. |

## 📐 Usage Guidelines

### ✅ Do: Use Semantic Tailwind Utilities
Always use the semantic class maps provided by Tailwind based on these tokens.
```tsx
// ✅ Correct (Semantic)
<div className="bg-card text-foreground border border-border">
<p className="text-foreground-secondary">
<button className="bg-primary text-primary-foreground">
```

### ❌ Don't: Use Hardcoded Palette Colors for UI
Avoid using raw palette classes (`blue-500`, `gray-100`, etc.) for core UI elements, as they do not adapt to dark mode automatically and violate the SSOT.
```tsx
// ❌ Incorrect (Raw Palettes)
<div className="bg-white text-gray-900 border border-gray-200">
<p className="text-gray-500">
<button className="bg-green-500 text-white">
```

> **Exception (Stage B):** Raw utility colors are permitted for charts, status badges, syntax highlighting, and specific visual examples where semantic inheritance does not apply.

## 📏 Layout Primitives (UI-001 Guard)

To preserve architectural integrity, avoid using raw layout strings when a corresponding primitive exists.

| Raw Implementation | Primitive Counterpart | Example Usage |
| :--- | :--- | :--- |
| `max-w-7xl mx-auto px-6` | `<Container>` | `<Container variant="wide">` |
| `space-y-4` | `<Stack>` | `<Stack gap="md">` |
| `grid-cols-1 md:grid-cols-3` | `<Grid>` | `<Grid cols={3}>` |
| Nested layout divs | `<PageLayout>` | `<PageLayout header={<Header />} />` |

> **Exception:** Raw grid layouts (e.g., `grid-cols-12`) or arbitrary spacing used for complex dashboards and specific CSS hacks are allowed, but the primitive guard will flag standard layouts for review.
