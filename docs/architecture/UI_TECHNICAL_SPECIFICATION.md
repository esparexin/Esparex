# Esparex UI Technical Specification (`UI_TECHNICAL_SPECIFICATION.md`)

```text
Version:         v1.0.0
Status:          APPROVED & LOCKED
Owner:           Platform Architecture & Core UI/UX Team
Effective Date:  2026-08-07
Companion Doc:   PLATFORM_UI_GOVERNANCE.md
```

---

## 🎯 1. Purpose

This document provides the definitive technical specifications, dimensions, typography scales, spacing tokens, responsive breakpoint matrices, control standards, and display rules for all UI implementations across Esparex.

---

## 📐 2. Layout & Container Specifications

* **Maximum Page Width**: `1280px` (`max-w-7xl`) for wide layouts; `1536px` (`max-w-screen-2xl`) for dashboards.
* **Container Variants**:
  - `sm` / `compact`: `768px` (`max-w-3xl`) — Form wizards, auth screens, settings.
  - `md` / `default`: `1024px` (`max-w-5xl`) — Detail views and articles.
  - `lg` / `wide`: `1280px` (`max-w-7xl`) — Search feeds, catalog grids, dashboards.
  - `full`: `100%` (`max-w-full`) — Hero banners and full-bleed headers.
* **Gutters & Padding**: Horizontal gutters `px-4 sm:px-6 md:px-8`; section spacing `py-6 md:py-8`.

---

## 🔤 3. Typography Scale Specifications

* **Font Family**: Google Fonts `Inter` / `Outfit` (`var(--font-primary)`, `sans-serif`).
* **Scale Breakdown**:
  - `display`: `36px` (`2.25rem`), line height `1.2`, weight `700` (`bold`), tracking `-0.02em`.
  - `h1`: `30px` (`1.875rem`), line height `1.25`, weight `700` (`bold`), tracking `-0.02em`.
  - `h2`: `24px` (`1.5rem`), line height `1.3`, weight `600` (`semibold`), tracking `-0.01em`.
  - `h3`: `20px` (`1.25rem`), line height `1.35`, weight `600` (`semibold`), tracking `-0.01em`.
  - `h4`: `18px` (`1.125rem`), line height `1.4`, weight `600` (`semibold`), tracking `0`.
  - `body`: `14px` (`0.875rem`), line height `1.55`, weight `400` (`normal`).
  - `small`: `13px` (`0.8125rem`), line height `1.5`, weight `400` (`normal`).
  - `caption`: `12px` (`0.75rem`), line height `1.4`, weight `500` (`medium`).
  - `tiny`: `11px` (`0.6875rem`), line height `1.4`, weight `500` (`medium`).

---

## 📱 4. Comprehensive Responsive Behavior Matrix

Component layout and navigation behavior adapt dynamically across standard breakpoints:

| Breakpoint | Viewport Range | Layout Structure | Navigation Pattern | Sidebar Behavior | Dialog / Modal Presentation |
|---|:---:|---|---|---|---|
| **`sm`** | `< 768px` | Single Column (`grid-cols-1`) | Mobile Bottom Navigation + Drawer | Hidden / Slide-over Drawer | Full-screen or Bottom Sheet (`<Drawer>`) |
| **`md`** | `768px – 1023px` | Two Column (`md:grid-cols-2`) | Top Header Shell + Drawer Sheet | Collapsible Drawer | Centered Large Sheet / Dialog |
| **`lg`** | `1024px – 1279px` | Multi-Column (`lg:grid-cols-3`) | Top Header Shell + Nav Links | Collapsible Sidebar | Centered Standard `<Dialog>` |
| **`xl`** | `1280px – 1535px` | Wide Grid (`xl:grid-cols-4`) | Top Header Shell + Account Menu | Persistent Sidebar | Standard `<Dialog>` |
| **`2xl`** | `≥ 1536px` | Ultra-wide Dashboard Grid | Full Header Shell | Persistent Widescreen Sidebar | Standard `<Dialog>` |

---

## 🎛️ 5. Control & Form Component Specifications

* **Control Height**: Standardized 48dp (`h-12` / `48px`) across Web inputs (`Input.tsx`) and Mobile inputs (`AppInput.tsx`).
* **Button Heights**: `lg` = 56dp, `md` = 48dp, `sm` = 32dp + 8dp internal `hitSlop` (Satisfying 44dp WCAG minimum bound).
* **Label Spacing**: `mb-2` margin below form labels.
* **Error Presentation**: `FormError` primitive displaying `text-error text-xs mt-1`.

---

## 💬 6. Dialog, Modal & Data Display Specifications

* **Dialog Max Widths**: `sm` (`max-w-lg`), `md` (`max-w-xl`), `lg` (`max-w-2xl`).
* **Dialog Footer**: Right-aligned flex container `flex flex-row justify-end gap-3`.
* **Data Display**: Tables wrap inside `overflow-x-auto` with sticky headers (`sticky top-0 z-10`); integrated `DataTablePagination` and `EmptyStateShell`.
