# Esparex Typography Standard

## Single Font Family SSOT: Geist

**Geist** is the single font family SSOT across all Esparex web and admin applications via `--font-primary`.
Do NOT introduce alternative fonts (e.g. Inter, Outfit, Roboto).

---

## Discrete Product Typography Scale (`packages/design-tokens/src/typography.ts`)

| Level | Size (rem / px) | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|
| `display` | `2.25rem` (36px) | `1.2` | `-0.02em` | Hero section titles, marketing display |
| `h1` | `1.875rem` (30px) | `1.25` | `-0.02em` | Main page titles (`<h1>`) |
| `h2` | `1.5rem` (24px) | `1.3` | `-0.01em` | Section headers (`<h2>`) |
| `h3` | `1.25rem` (20px) | `1.35` | `-0.01em` | Card titles, sub-headers (`<h3>`) |
| `h4` | `1.125rem` (18px) | `1.4` | `0` | Small headers, modal titles (`<h4>`) |
| `body` | `0.875rem` (14px) | `1.55` | `0` | Default body text, description text |
| `small` | `0.8125rem` (13px) | `1.5` | `0` | Table cell data, form labels |
| `caption` | `0.75rem` (12px) | `1.4` | `0` | Badge text, timestamps, helper text |
| `tiny` | `0.6875rem` (11px) | `1.4` | `0` | Compact status tags, metadata chips |

---

## Admin vs Web Density Standards

- **Admin UI**: Prefers predictable discrete sizing (`0.8125rem` / `13px` small body, `0.75rem` / `12px` labels) for maximum data density and scannability.
- **Web Marketplace**: Uses `14px`–`16px` body text and `24px`–`36px` section headers for marketing appeal and conversion.
- **Fluid Typography Restriction**: Fluid typography (`clamp()`) is permitted strictly for marketing hero headings. Product and Admin UIs must use predictable discrete tokens.
