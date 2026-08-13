# Esparex Enterprise UI/UX Design Standards (Permanent Governance)

## 1. Foundational Design Principles

Every design, layout, component, and interaction decision across the Esparex platform MUST align with these 10 non-negotiable principles:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                      THE 10 ESPAREX DESIGN PRINCIPLES                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. User-First, Task-Oriented      │ Streamline completion of user intent.    │
│ 2. Mobile-First, Desktop Enhanced │ Build touch ergonomics first.            │
│ 3. Progressive Disclosure         │ Reveal details only when needed.         │
│ 4. Surfaces Are Earned            │ Default to flat layouts; no auto-boxing. │
│ 5. Single Responsibility          │ One component, one architectural owner.  │
│ 6. Consistency Over Creativity    │ Predictable patterns build trust.        │
│ 7. Accessibility by Default       │ WCAG 2.2 AA compliance is mandatory.     │
│ 8. Performance Is Part of UX      │ Zero frame drops, CLS < 0.1, LCP < 2.5s. │
│ 9. Reuse Before Creating          │ Discover existing SSOT before coding.    │
│ 10. Cognitive Load Reduction      │ Eliminate duplicate visual noise.        │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **User-First, Task-Oriented:** Every screen exists to help a buyer discover/purchase or a seller post/manage listings. Remove extraneous UI decorations that do not serve that core task.
2. **Mobile-First with Desktop Enhancement:** Design layouts, touch targets, and bottom action zones for 360px mobile viewports first, then enhance for wide viewports.
3. **Progressive Disclosure Over Visual Overload:** Prioritize essential data (Title, Price, Location, Seller Trust) on primary surfaces; push secondary technical specs into expandable drawers or tabs.
4. **Surfaces Are Earned, Not Default:** Do NOT place content in a `Card` simply because it exists. Content defaults to flat sections with clean dividers (`border-b border-border`). A `Card` is earned only by discrete, draggable, or individually actionable marketplace entities.
5. **One Responsibility Per Component:** A component renders layout OR manages state—never both. Layout components must not execute API calls.
6. **Consistency Over Creativity:** Established patterns (e.g., standard dialogs, standard filters) must not be reinvented for individual sub-pages.
7. **Accessibility by Default:** Visual polish without full keyboard navigation, screen reader compatibility, and visible focus rings is considered broken code.
8. **Performance Is Part of UX:** Jittery layout shifts (CLS), unoptimized images, or blocking main threads degrade trust.
9. **Reuse Before Creating:** Search `@esparex/ui`, `@esparex/design-tokens`, and `components/user/shared` before creating any new `.tsx` file.
10. **Every Interaction Should Reduce Cognitive Load:** Ensure instant feedback on all taps, clear error recovery guidance, and predictable back-navigation.

---

## 2. Canonical Page Architecture & Surface Hierarchy

### Canonical Page Structure
Every public and private route across the Esparex platform MUST follow this single layout hierarchy:

```text
Page Shell (PageLayout)
│
├── HeaderShell / AppHeader (Sticky, Zero-Render Scroll Transition)
│
├── BreadcrumbBar (Optional: Search / Category / Detail Navigation)
│
├── HeroBanner (Optional: Homepage / Brand Landing Only)
│
├── PageContainer (Width Constraint: sm | md | lg | xl | full)
│   │
│   ├── PageHeader (Title, Subtitle, Primary Actions)
│   │
│   ├── MainContent (flex-1 min-w-0)
│   │   ├── PageSection (Logical Section 1)
│   │   ├── PageSection (Logical Section 2)
│   │   └── PageSection (Logical Section 3)
│   │
│   └── AsideSidebar (Optional: 260px Sticky Filters / 320px Seller Profile)
│
└── AppFooter / MobileBottomBar
```

### Surface Hierarchy Matrix

| Surface Primitive | Purpose | Permitted Children | Prohibited Usages |
|---|---|---|---|
| **Page Surface** | Viewport background and scroll boundary. | `Container`, `Header`, `Footer` | Never nest inside another page shell. |
| **Container** | Width constraints (`sm: max-w-3xl`, `lg: max-w-7xl`, `xl: max-w-screen-2xl`). | `PageSection`, `PageHeader`, `Grid` | **Never nest a Container inside another Container.** |
| **PageSection** | Semantic content grouping with 18px title and border-b divider. | `ListRow`, `Grid`, `Form`, `Card` | Do not add artificial outer borders unless `variant="bordered"`. |
| **Card** | Discrete marketplace entity (Ad card, Business card, Subscription plan). | `CardHeader`, `CardContent` | **Do NOT wrap forms or static text blocks in nested Cards.** |
| **Panel** | Interactive filter bar or search toolbar container. | Inputs, Selects, Badges | Do not use for long-form narrative content. |
| **Dialog** | Focused, blocking modal workflow (Confirmation, Delete, Report). | DialogHeader, DialogBody, DialogFooter | Avoid multi-step forms exceeding 2 steps (use Sheet/Wizard). |
| **Drawer / Sheet** | Mobile-first slide-over for filters, navigation menus, or quick edits. | Navigation links, Filter controls | Avoid full-screen complex dashboards. |

---

## 3. Information Architecture & Cognitive Load Standards

### Information Tiers
Every screen must strictly separate content into 5 hierarchical tiers:
1. **Primary Tier (Immediate Decision Makers):** Essential data required to understand the entity (e.g., Photos, Title, Price, Verification Badge). Must be visible within the initial viewport.
2. **Secondary Tier (Trust & Context):** Seller details, location distance, posting date, ratings.
3. **Supporting Tier (Deep Evaluation):** Technical specifications, full narrative description, device condition details.
4. **Action Tier (Clear Next Step):** Primary conversion CTA (Chat, Call, Make Offer, Post Ad).
5. **Related Tier (Cross-Discovery):** Nearby repair services, similar spare parts, seller's other items.

### Measurable Cognitive Load Limits
- **Maximum 3 Primary CTAs per Screen:** Only 1 high-emphasis primary button (e.g., solid blue); secondary actions must use `outline` or `ghost` variants.
- **Maximum 2 Competing Accent Colors:** Reserve brand blue (`#2563eb`) for interactive actions and emerald green (`#16a34a`) for success/verification.
- **Maximum 1 Dominant Surface:** Do not stack bordered cards upon bordered sections upon colored backgrounds.
- **Maximum 2 Nested Navigation Levels:** Breadcrumbs must not exceed 4 segments (`Home > Category > Subcategory > Listing`).
- **5-Second Comprehension Rule:** A first-time user must understand the item, price, and primary action within 5 seconds of landing.

---

## 4. Marketplace & Search UX Standards

### Listing Card SSOT Specification
A listing card (`AdCardGrid` / `AdCardList`) MUST display ONLY the following canonical elements:
```text
┌──────────────────────────────────────┐
│ [ Image Thumbnail ]  [Condition Tag] │
│                      [Spotlight Tag] │
├──────────────────────────────────────┤
│ [Price (e.g., ₹4,500)]               │
│ [Title (line-clamp-2)]               │
│ [Location (Brief)] • [Posted Time]   │
│ [Verified Seller Badge (if verified)]│
└──────────────────────────────────────┘
```
*Prohibited on Cards:* Long descriptions, direct phone numbers, multiple competing action buttons.

### Listing Detail Priority Sequence (Mobile & Desktop)
```text
Desktop 2-Column Grid:
Left Column:  1. Image Gallery ──► 5. Description & Specs ──► 6. Nearby Services ──► 7. Similar Ads
Right Column: 2. Title & Price ──► 3. Seller Profile & Trust ──► 4. Safety Guidelines ──► Actions

Mobile Single-Column Sequence (Strict Order):
1. Image Gallery (AdImageCarousel)
2. Title, Price, Location & Badges (AdTitlePriceCard)
3. Seller Profile & Instant Chat/Call CTA (AdSellerCard)
4. Device Specifications & Description (ListingDescriptionCard)
5. Safety Guidelines (AdSafetyTips)
6. Nearby Repair Services (ListingRelatedBusinessesSection)
7. Similar Listings
```

### Search, Filter & Sort Standards
- **Global Search Bar:** Real-time query sync, debounced (300ms) autocomplete suggestions, clear recent search pills.
- **Filters:** Faceted sidebar on desktop (sticky top-4); slide-over bottom sheet on mobile with active filter count badges.
- **Sorting:** Relevance (default), Newest First, Price: Low to High, Price: High to Low.
- **Pagination & Infinite Scroll:** List and search feeds use cursor-based "Load More" pagination with loading spinner and end-of-results messaging.
- **Zero-State Fallbacks:** When 0 results match, provide (1) clear explanation of query, (2) 1-click "Reset All Filters" button, (3) alternative popular categories.

---

## 5. Dashboard, Table & Data Density Standards

### Dashboard Tier Architecture
- **User Dashboard (`/account/*`):** Task-focused, personal inventory, smart alerts, wallet credits. Uses comfortable density.
- **Business Dashboard (`/business/*`):** Storefront analytics, verified badge status, service inquiries. Uses compact density.
- **Admin Dashboard (`apps/admin`):** High-density moderation queues, audit logs, user management tables. Uses dense density.

### Data Density Scale

| Density Tier | Row Height | Font Size | Cell Padding | Primary Target Surface |
|---|:---:|:---:|:---:|---|
| **Comfortable** | `56px` | `14px` (Body) | `p-4` (16px) | Marketplace listings, mobile account screens. |
| **Compact** | `44px` | `13px` (Small) | `px-3 py-2` | Business analytics, transaction tables, user listings tab. |
| **Dense** | `36px` | `12px` (Caption) | `px-2 py-1` | Admin moderation queues, audit log tables. |

### Canonical Data Table Standards (`DataTable`)
- **Sticky Headers:** Table headers remain fixed during vertical scrolling.
- **Sorting:** Column header click toggles Ascending → Descending → Natural.
- **Selection & Bulk Actions:** Checkbox column with floating bulk action bar on selection > 0.
- **Responsive Collapse:** Mobile viewports automatically transform wide data tables into stacked card list rows (`ListRow`).

---

## 6. Form, Validation & Feedback Standards

- **Single-Page Forms:** For ≤ 4 fields (e.g. Login, Quick Profile Edit).
- **Multi-Step Wizards:** For complex workflows (e.g. Post Ad, Business Registration). Max 2–3 steps with persistent step indicators (`Step 1 of 2: Listing Information`).
- **Autosave & Local Draft Recovery:** Form state must save to LocalStorage (`usePostAdForm`) so unexpected reloads or network drops do not erase user input.
- **Validation Timing:**
  - *On Blur:* Validate field formatting (e.g., invalid phone format).
  - *On Submit:* Trigger full schema validation, shake invalid fields (`animateOnError`), and auto-focus the first invalid field.
- **Unified Feedback Hierarchy:**
  1. *Global Critical Alerts:* Native Popup SSOT (`popupBus.notify`, `PopupDialogView`).
  2. *Section Warnings:* Inline `PageSection` alert banners.
  3. *Field Errors:* Inline `FieldMessage` directly attached to `id` / `aria-describedby`.

---

## 7. Motion, Transition & Design Token Governance

### Standard Motion Tokens
Defined in [`packages/design-tokens/src/motion.ts`](file:///Users/admin/Desktop/Esparex/packages/design-tokens/src/motion.ts):
- **Micro-Interactions (Hover/Active):** `150ms cubic-bezier(0.4, 0, 0.2, 1)` (Active scale: `scale-[0.98]`).
- **Dialogs & Dropdowns:** `200ms cubic-bezier(0, 0, 0.2, 1)` (Fade in + zoom 95% → 100%).
- **Drawers & Sheets:** `300ms cubic-bezier(0.32, 0.72, 0, 1)` (Slide in from bottom/right).
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is active, all transitions reduce to `0.01ms`.

### Design Token Gatekeeper Rule
- **Zero Local Token Definition:** No application or component may introduce new colors, spacing, radius, or shadow tokens.
- **All updates MUST be committed to `@esparex/design-tokens` first**, published to `@esparex/design-tokens/dist`, and referenced via CSS variables.

---

## 8. Automated CI/CD Enforcement Gates

The following automated checks are mandatory in CI pipelines (`npm run repo:gate`):

```text
CI GATE FAILURE CONDITIONS:
❌ Nested <Container> detected in JSX AST.
❌ Nested <Card> detected in JSX AST.
❌ Duplicate responsive DOM subtrees mapping the same data array (e.g. lg:hidden vs hidden lg:grid).
❌ Hardcoded hex colors (#...) or raw palette literals (slate-500, blue-600) in component files.
❌ Direct native <button> tags bypassing @esparex/ui <Button>.
❌ More than one <h1> element on a single page.
❌ Touch target bounding box < 44×44px on mobile viewports.
❌ Route JavaScript bundle budget > 150KB gzipped.
```

---

## 9. Design Decision Records (DDR) Standard

Any structural UI change, new reusable component, or layout modification requires a committed DDR in `docs/ddr/` using this format:

```markdown
# DDR-001: [Title of UI Architecture Decision]

- **Status:** [Proposed | Approved | Superseded]
- **Author:** [Name / Agent]
- **Date:** [YYYY-MM-DD]

## 1. Problem Statement
[What UX, accessibility, or architectural problem is being solved?]

## 2. Alternatives Considered
- Option A: [Description & why rejected]
- Option B: [Description & why rejected]

## 3. Chosen Solution
[Detailed technical specification of the approved design/component]

## 4. Trade-offs & Impact
[Performance impact, bundle size impact, accessibility impact]
```
