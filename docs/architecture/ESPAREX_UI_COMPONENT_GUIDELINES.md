# Esparex Enterprise UI Component Guidelines (Catalog & Anti-Patterns)

## 1. Component Lifecycle & Maturity Taxonomy

```text
Experimental  ──►  Internal  ──►  Public  ──►  Stable  ──►  Deprecated  ──►  Legacy
(Local feature)   (@esparex/ui)  (Documented)  (L4 Standard) (JSDoc notice)  (To be deleted)
```

- **Stable:** Fully tested, WCAG 2.2 AA compliant, tokenized, zero breaking changes permitted.
- **Deprecated:** Maintained only for backwards compatibility; points developers to the canonical replacement.
- **Legacy:** Scheduled for removal in the next cleanup phase.

---

## 2. Component Reference Catalog

### `<Button />` (Stable)
- **Source:** `@esparex/ui`
- **Purpose:** Primary interactive trigger for actions, form submissions, and dialog confirmations.
- **When to Use:** Every clickable action across user, business, and admin applications.
- **When NOT to Use:** Page navigation (use `next/link` or `<Button asChild><Link ...></Button>`).
- **Variants:** `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`.
- **Sizes:** `sm` (36px), `default` (44px), `lg` (48px), `icon` (44×44px).
- **Anti-Pattern:** `<button className="bg-blue-600 px-4 py-2 rounded-lg text-white">` ❌

---

### `<Input />` (Stable)
- **Source:** `@esparex/ui`
- **Purpose:** Single-line text, email, numeric, or search entry.
- **When to Use:** Standard form data collection and search inputs.
- **Variants:** `default` (44px height, rounded-xl).
- **Accessibility:** Automatically binds `aria-invalid` and `aria-describedby` when wrapped in `<FieldRoot>`.
- **Anti-Pattern:** Unlabeled inputs lacking `aria-label` or `<FieldLabel>`.

---

### `<Card />` (Stable)
- **Source:** `@esparex/ui`
- **Purpose:** Visual grouping for discrete, individually actionable marketplace entities.
- **When to Use:** Marketplace listings (`AdCardGrid`), seller summary cards, pricing plan tiers.
- **When NOT to Use:** Top-level page containers, static text paragraphs, nested inside another Card.
- **Variants:** `default` (opaque card), `soft` (subtle slate), `glass` (translucent blur), `outlined`.
- **Elevations:** `0` (flat), `1` (subtle shadow), `2` (hover lift), `3` (popover), `4` (modal).
- **Anti-Pattern:** Wrapping whole form pages or static text blocks in nested Cards ❌

---

### `<Container />` (Stable)
- **Source:** `@esparex/ui`
- **Purpose:** Horizontal max-width bounding and gutter management across responsive breakpoints.
- **When to Use:** Top-level page sections requiring standardized width limits.
- **Variants:** `sm` (max-w-3xl), `md` (max-w-5xl), `lg` (max-w-7xl), `xl` (max-w-screen-2xl), `full`.
- **Anti-Pattern:** Nesting `<Container variant="sm">` inside `<Container variant="xl">` ❌

---

### `<Badge />` (Stable)
- **Source:** `@esparex/ui`
- **Purpose:** Compact metadata label or status indicator.
- **When to Use:** Listing condition (`Power On`), category tag, promotion tier (`Spotlight`).
- **Variants:** `default`, `secondary`, `outline`, `destructive`, `success`, `warning`.
- **Anti-Pattern:** Multi-line text sentences or interactive buttons inside Badges.

---

### `<EmptyState />` (Stable — Canonical SSOT)
- **Source:** `@esparex/ui`
- **Purpose:** Standardized zero-data display for search, chat, notifications, and feeds.
- **Props:** `icon: LucideIcon`, `title: string`, `description: string`, `action?: ReactNode`.
- **Anti-Pattern:** Inlining raw emojis (`💬`, `✨`) or custom unstyled text blocks.
