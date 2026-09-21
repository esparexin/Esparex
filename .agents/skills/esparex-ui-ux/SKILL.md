---
name: esparex-ui-ux
description: "Authoritative Esparex UI/UX Skill v2.0: design system tokens (@esparex/design-tokens), Geist typography SSOT, single-instance responsive architecture, WCAG 2.2 AA accessibility, native popup bus, Admin density, Web marketplace UX, mobile input zoom prevention, and visual QA. Includes code examples, checklists, decision trees, and 16 IDE AI prompts."
argument-hint: "[component|page|view] [web|admin|mobile]"
license: MIT
quality_score: "10/10"
maturity: "production"
metadata:
  author: esparex
  version: "2.0.0"
  last_updated: "2026-09-21"
  status: "Active"
---

# ⭐ Esparex UI/UX Design System & Experience Skill v2.0

**Authoritative, actionable guide with code examples, checklists, decision trees, and IDE AI workflows for building consistent, accessible, and high-performance UIs across Web, Admin, and Mobile.**

---

## 🧭 Companion Ecosystem & Quick Navigation

This skill is powered by a 6-part integrated documentation and execution system located in this folder:

| Document | Purpose | When to Use |
|---|---|---|
| [START-HERE.md](file://./START-HERE.md) | Entry point & daily developer workflow | First-time orientation, 10-minute quick start, routine daily structure |
| [QUICK-REFERENCE-CARD.md](file://./QUICK-REFERENCE-CARD.md) | 1-page printable desk cheat sheet | Fast token lookup, copy-paste snippets, 5-minute A11y checklist |
| [IDE-AI-PROMPTS.md](file://./IDE-AI-PROMPTS.md) | 16 production-ready IDE AI prompts | Generating components, a11y fixes, reviews, token conversion in chat |
| [HOW-TO-USE-THIS-SKILL.md](file://./HOW-TO-USE-THIS-SKILL.md) | Step-by-step scenario walkthroughs | Common developer scenarios, PR reviews, 40-minute onboarding |
| [IDE-SETUP-GUIDE.md](file://./IDE-SETUP-GUIDE.md) | IDE setup for Claude / Copilot / Cursor | Connecting design system files to your IDE AI assistant |
| [esparex-ui-ux-complete-skill.md](file://./esparex-ui-ux-complete-skill.md) | Full v2.0 core specification | Complete offline standalone reference |

---

## 🚨 Non-Negotiable Core Laws

These architectural and design rules are **MANDATORY across all packages and applications** (`apps/web`, `apps/admin`, `apps/mobile`, `@esparex/ui`). No exceptions.

### 1️⃣ Semantic Token Consumption Principle
**Rule**: Application code MUST consume semantic or component tokens, NEVER raw primitive colors or arbitrary hex values.

```tsx
// ❌ PROHIBITED (Arbitrary hex color & unmanaged contrast):
<button className="bg-[#0066ff] text-white px-4 py-2 rounded">
  Click Me
</button>

// ❌ DISCOURAGED (Primitive color names directly in features):
<button className="bg-blue-600 text-white px-4 py-2 rounded">
  Click Me
</button>

// ✅ MANDATORY (Semantic tokens automatically adapt to Dark Mode and Themes):
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md border border-border hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
  Click Me
</button>
```

- **Backgrounds**: `bg-background` (page root), `bg-card` (surface containers), `bg-muted` (subtle surfaces / hover states), `bg-primary`, `bg-secondary`, `bg-destructive`.
- **Text**: `text-foreground` (primary high-contrast body), `text-muted-foreground` (secondary hints, metadata), `text-primary-foreground`, `text-destructive`.
- **Borders**: `border-border` (default structural dividers), `border-destructive` (validation errors).
- **Spacing**: Tailwind scale (`px-3 py-2`, `gap-4`) on 4px baseline grid — **Zero arbitrary spacing** like `p-[17px]`.
- **Radius**: `rounded-sm` (4px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-full` — **Zero arbitrary radii** like `rounded-[13px]`.

---

### 2️⃣ Design Token SSOT (`@esparex/design-tokens`)
**Rule**: All colors, spacing, shadows, and radii are governed strictly by `@esparex/design-tokens` or canonical CSS variables.

```tsx
// ✅ CORRECT (Consuming token constants or Tailwind utility aliases):
import { colors, spacing } from '@esparex/design-tokens';

<div className="bg-card text-foreground p-4 md:p-6 rounded-lg border border-border">
  Content
</div>
```

---

### 3️⃣ Typography SSOT (Geist Font Family Only)
**Rule**: **Geist** is the single font family SSOT across all applications via `--font-primary`. Introducing competing font families (e.g. Inter, Roboto, Outfit, Poppins) is strictly prohibited.

```tsx
// ✅ CORRECT:
<h1 className="font-primary text-2xl md:text-3xl font-bold text-foreground">
  Heading
</h1>

// ❌ FORBIDDEN:
<h1 className="font-inter text-2xl font-bold">Heading</h1>
<h1 style={{ fontFamily: 'Roboto' }}>Heading</h1>
```

**Canonical Type Scale**:
- `text-tiny`: 12px (badge labels, helper captions)
- `text-sm`: 14px (secondary metadata, table cells)
- `text-base`: 16px (default body text; **mandatory minimum for mobile inputs**)
- `text-lg`: 18px (card titles, subheadings)
- `text-xl`: 20px (section headers)
- `text-2xl`: 24px (page subheaders)
- `text-3xl`: 30px (major view titles)
- `text-4xl`: 36px+ (hero display headings)

---

### 4️⃣ Single-Instance Responsive Architecture
**Rule**: Every user-facing UI screen, header, layout, modal, and control MUST be rendered from a **single responsive component instance**. Creating duplicate `Mobile*` vs `Desktop*` component files (e.g. `MobileNav` and `DesktopNav`) is prohibited.

```tsx
// ❌ FORBIDDEN (Component Duplication Anti-Pattern):
export const Header = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileHeader />;
  return <DesktopHeader />;
};

// ✅ MANDATORY (Single Responsive Instance via CSS Media Queries):
export const Header = () => (
  <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
    <Logo className="h-8 w-auto" />
    
    {/* Mobile drawer trigger: visible on mobile, hidden on desktop */}
    <button className="md:hidden p-2 text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open Navigation">
      <MenuIcon className="h-6 w-6" />
    </button>
    
    {/* Desktop navigation: hidden on mobile, flex on desktop */}
    <nav className="hidden md:flex items-center gap-6">
      <Link href="/browse" className="text-sm font-medium text-foreground hover:text-primary">Browse</Link>
      <Link href="/post" className="text-sm font-medium text-foreground hover:text-primary">Post Ad</Link>
    </nav>
  </header>
);
```

**Responsive Breakpoint Standard**:
- `sm:` `640px` (large phones)
- `md:` `768px` (tablets & transition from mobile to desktop layouts)
- `lg:` `1024px` (laptops / small desktops)
- `xl:` `1280px` (standard desktop container)
- `2xl:` `1536px` (wide monitors)

---

### 5️⃣ Native Popup & Notification SSOT (`popupBus`)
**Rule**: User notifications, toasts, and alerts MUST use Esparex's single-instance native popup bus (`@esparex/popup-bus`). External toast packages (`sonner`, `react-hot-toast`, `react-toastify`) are strictly banned.

```tsx
// ✅ CORRECT:
import { popupBus } from '@esparex/popup-bus';

// Success
popupBus.notify({
  type: 'success',
  title: 'Success',
  message: 'Ad posted successfully.',
  duration: 3000
});

// Error with recovery action
popupBus.notify({
  type: 'error',
  title: 'Payment Failed',
  message: 'Card declined. Please check details or use UPI.',
  action: { label: 'Retry', onClick: handleRetry }
});

// ❌ FORBIDDEN:
import { toast } from 'sonner';
toast.success('Done!');
```

---

### 6️⃣ WCAG 2.2 AA Compliance (Mandatory Engineering Requirement)
**Rule**: All user interfaces must be 100% WCAG 2.2 AA compliant. Accessibility is a blocking merge gate, not a post-launch enhancement.

- **Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (18pt+) and active graphical UI components.
- **Focus Indicators**: Every interactive control must have a visible, high-contrast focus ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`).
- **Touch Target Size**: Minimum 44×44px on all touch surfaces and mobile viewports.
- **Keyboard Navigation**: Full operation via `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape` without mouse interaction. Zero keyboard traps.
- **Semantic HTML First**: `<button>` instead of `<div onClick>`, `<label htmlFor="...">` associated with `<input id="...">`, `<table>`, `<thead>`, `<th>`, `<tbody>` for tabular data.

---

### 7️⃣ Mobile Form Input Font-Size & Viewport Zoom Prevention (Mandatory)
**Rule**: To prevent mobile WebKit / iOS Safari from automatically zooming in and permanently cropping the mobile layout, **all editable form inputs (`<input>`, `<textarea>`, `<select>`, `<SelectTrigger>`) MUST have a computed font-size of at least 16px (`text-base`) on mobile viewports (`< md:` / `< 768px`)**.

```tsx
// ✅ REQUIRED on all editable inputs:
className="text-base md:text-sm"

// ❌ FORBIDDEN (Triggers irreversible 14%-33% viewport zoom jump on iOS):
className="text-sm"
className="text-xs"
className="text-caption"
```
*Note: Viewport metadata MUST NOT disable pinch-to-zoom (`maximum-scale=1` is forbidden by WCAG 2.2 AA SC 1.4.4).*

---

### 8️⃣ Modal, Dialog & Drawer Governance
**Rule**: Every modal, dialog, sheet, and drawer MUST:
1. Consume canonical `@esparex/ui` primitives (`Dialog`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `Sheet`, `Drawer`).
2. Always render via `DialogPortal` to `document.body` to eliminate stacking context traps and header bleed-through bugs.
3. Centralize `Z_INDEX` tokens (`dialogOverlay = 1000 > userHeader: 999`).
4. Trap focus automatically, close on `Escape`, and restore focus to trigger element upon dismissal.
5. Prohibit raw unportalled `fixed inset-0` modal `<div>` overlays.

---

## 🎯 10-Step Quick Decision Tree

When building or updating any interface, follow this 30-second decision tree:

```text
1️⃣ BUTTON?
   → Consume Button from @esparex/ui or apply semantic tokens:
     className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

2️⃣ FORM INPUT?
   → Always link <label htmlFor="id"> with <input id="id">
   → Enforce mobile zoom prevention: className="text-base md:text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground"
   → Link error messages accessibly via aria-describedby and aria-invalid.

3️⃣ CARD OR CONTAINER?
   → Use: className="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm"

4️⃣ MODAL OR DIALOG?
   → Use Dialog from @esparex/ui (with DialogPortal to document.body)
   → Support Escape key, focus trapping, and return focus on close.

5️⃣ POPUP OR NOTIFICATION?
   → Use popupBus.notify({ type, title, message }) from @esparex/popup-bus (Zero Sonner).

6️⃣ DATA TABLE?
   → Use <table>, <thead>, <th scope="col">, <tbody>, <td className="px-4 py-3">.
   → Left-align text, right-align numbers/currency, center status chips.

7️⃣ RESPONSIVE LAYOUT?
   → Single component instance with CSS breakpoints (e.g. grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4).

8️⃣ SHOW/HIDE BY SCREEN SIZE?
   → Use hidden md:flex (mobile hidden, desktop visible) or md:hidden (mobile visible, desktop hidden).

9️⃣ DARK MODE?
   → Consume semantic tokens (bg-background, text-foreground). Zero manual mode branching required.

🔟 NOT FOUND IN THIS TREE?
   → Check @esparex/ui primitives first, then refer to the deep-dive guides below.
```

---

## ✅ Comprehensive A11y Compliance Checklist

Before submitting any UI for code review or PR approval, verify every item:

### 1. Contrast & Color
- [ ] Body text contrast is at least **4.5:1** against its background (light and dark modes).
- [ ] Large headings and active UI borders have at least **3:1** contrast.
- [ ] Color is **never the sole indicator of status** (e.g. use "✓ Success" or an icon alongside color).

### 2. Keyboard & Focus
- [ ] Every button, link, and form input is reachable using `Tab` and `Shift+Tab`.
- [ ] Focus indicator is **clearly visible** on all interactive elements (`focus-visible:ring-2`).
- [ ] Focus order matches the logical reading order.
- [ ] Modals and dialogs trap keyboard focus and dismiss cleanly on `Escape`.

### 3. Touch & Mobile Viewports
- [ ] All clickable and tappable elements meet the minimum **44×44px** touch target size.
- [ ] Minimum 8px spacing between adjacent touch targets.
- [ ] All editable text inputs have at least **16px (`text-base`)** font size on mobile viewports.

### 4. Screen Readers & ARIA
- [ ] Semantic HTML is preferred: `<button>` used for actions, `<a>` used for navigation.
- [ ] Icon-only buttons include an accessible label: `aria-label="Close dialog"`.
- [ ] Form fields are linked with labels via `htmlFor` and `id`.
- [ ] Dynamic errors use `aria-invalid="true"` and `aria-describedby="[error-id]"`.
- [ ] Loading and async states announce status via `aria-busy="true"` or `aria-live="polite"`.

---

## 📋 Copy-Paste Component Reference

### 1. Primary Action Button
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center font-medium bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  Save Changes
</button>
```

### 2. Accessible Responsive Form Input
```tsx
<div className="w-full space-y-1.5">
  <label htmlFor="user-email" className="block text-sm font-medium text-foreground">
    Email Address <span className="text-destructive">*</span>
  </label>
  <input
    id="user-email"
    name="email"
    type="email"
    placeholder="you@company.com"
    className="w-full text-base md:text-sm px-3.5 py-2.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    aria-invalid={Boolean(error)}
    aria-describedby={error ? "user-email-error" : undefined}
    required
  />
  {error && (
    <p id="user-email-error" className="text-sm text-destructive" role="alert">
      {error}
    </p>
  )}
</div>
```

### 3. Surface Card
```tsx
<div className="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-foreground">Account Summary</h3>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
      Active
    </span>
  </div>
  <p className="text-sm text-muted-foreground">
    Manage your subscription and credit balance across all services.
  </p>
</div>
```

---

## 📚 Deep-Dive Domain Guides Map

For detailed domain-specific architectural standards, consult the modular guides:

| Domain | Guide Link | Focus Areas |
|---|---|---|
| **Design Principles** | [`design-principles.md`](file://./design-principles.md) | Visual hierarchy, clarity, content-first layout |
| **Color System** | [`color-system.md`](file://./color-system.md) | 3-layer tokens (Sky Brand, Slate Neutrals, Indigo Action) |
| **Typography** | [`typography.md`](file://./typography.md) | Geist font SSOT, discrete scale, line-height tokens |
| **Spacing & Layout** | [`spacing-layout.md`](file://./spacing-layout.md) | 4px baseline grid, container boundaries, surface stacking |
| **Components** | [`components.md`](file://./components.md) | `@esparex/ui` & `@esparex/mobile-ui` primitive contracts |
| **Interaction States** | [`interaction-states.md`](file://./interaction-states.md) | Default, hover, focus-visible, active, disabled, loading, error |
| **Responsive Architecture** | [`responsive.md`](file://./responsive.md) | Breakpoints, grid strategies, container queries |
| **Accessibility** | [`accessibility.md`](file://./accessibility.md) | Screen reader matrices, focus restoration, ARIA patterns |
| **Admin UX** | [`admin-ux.md`](file://./admin-ux.md) | High-density tables, filter toolbars, KPI overview cards |
| **Marketplace Web UX** | [`marketplace-ux.md`](file://./marketplace-ux.md) | Ad listings, pricing cards, verification badges, trust signals |
| **Mobile App UX** | [`mobile-ux.md`](file://./mobile-ux.md) | React Native / Expo, safe area insets, bottom sheets |
| **Visual QA** | [`visual-qa.md`](file://./visual-qa.md) | Chrome DevTools audits, axe DevTools scanning, visual regression |
| **Anti-Patterns** | [`anti-patterns.md`](file://./anti-patterns.md) | Registry of forbidden patterns with explicit fixes |

---

## 🤖 AI IDE Prompts Integration

When implementing or reviewing UI code, utilize the 16 structured prompts in [IDE-AI-PROMPTS.md](file://./IDE-AI-PROMPTS.md):

- **Prompt #1**: Build a Component (Design system & A11y compliant)
- **Prompt #2**: Audit Component Against Design System
- **Prompt #3**: Make Component Accessible (WCAG 2.2 AA)
- **Prompt #4**: Implement Single-Instance Responsive Layout
- **Prompt #5**: Ready Copy-Paste Component Template
- **Prompt #6**: Fix axe DevTools Accessibility Issues
- **Prompt #7**: Convert Arbitrary Hex Colors to Semantic Tokens
- **Prompt #8**: Create Standard Component Variants
- **Prompt #9**: Verify & Fix Dark Mode Compatibility
- **Prompt #10**: Complete Design System Compliance Review
- **Prompt #11**: Generate Storybook Stories & Unit Tests
- **Prompt #12**: Clarify Architectural Design Rule
- **Prompt #13**: Implement Quick Reference Card Snippets
- **Prompt #14**: Quick Fix for Code Review Comments
- **Prompt #15**: Debug Dark Mode Contrast Issues
- **Prompt #16**: Generate Component Documentation

---

## 🏁 Quality Assurance & Signoff Gate

Before marking any UI task complete, ensure:
1. `npm run type-check` passes with **0 errors**.
2. `npm run build` succeeds cleanly.
3. axe DevTools scan reports **0 critical or serious violations**.
4. Visual inspection verified on both Mobile (375px/390px) and Desktop (1280px+) viewports.
5. All 6 Non-Negotiable Core Laws are fully satisfied.
