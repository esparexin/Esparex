# Esparex AGENTS.md — Architecture Governance

## Similarity Threshold Rule

Components, hooks, or services must not be merged solely because they appear similar. Before consolidation, document:

- Shared UI %
- Shared business rules %
- Shared validation %
- Shared API contract %
- Shared workflow %

Consolidation is recommended only when overall similarity > 75% AND no single dimension is < 50%.

If similarity is below the threshold, keep components separate even if they appear structurally similar. Different responsibilities, future trajectory, and domain-specific behavior must be preserved.

---

# 🚨 GLOBAL ACCESSIBILITY & KEYBOARD NAVIGATION GOVERNANCE RULE (MANDATORY)

## Applies To

This rule applies to **every user-facing interface** across the entire Esparex platform.

- User Web App
- Admin Dashboard
- Mobile Web
- Progressive Web App (PWA)
- Authentication
- Forms
- Modals
- Drawers
- Dropdowns
- Tables
- Search
- Filters
- Wizards
- Settings
- Dashboards
- Chat
- Payments
- Every future UI component

No exceptions.

---

## 🚨 ACCESSIBILITY FIRST

Before creating, modifying, or fixing any UI component, perform a complete accessibility and keyboard audit.

Never implement or modify a component without verifying accessibility.

Accessibility is a **mandatory engineering requirement**, not a post-development enhancement.

---

## 1. Keyboard Navigation (Mandatory)

Every interactive element must be fully usable without a mouse.

Verify support for:

- Tab
- Shift + Tab
- Enter
- Space
- Escape
- Arrow Keys
- Home
- End

Every component must have:

- Logical tab order
- Visible focus indicator
- No skipped elements
- No keyboard traps
- Predictable navigation

---

## 2. Focus Management

Every screen must maintain proper focus behavior.

Verify:

- Initial focus
- Focus order
- Focus restoration
- Focus trapping in dialogs
- Focus after validation errors
- Focus after dynamic content updates

Users must never lose keyboard focus.

---

## 3. ARIA Compliance

Every interactive component must use appropriate ARIA attributes where required.

Audit:

- `aria-label`
- `aria-labelledby`
- `aria-describedby`
- `aria-invalid`
- `aria-required`
- `aria-expanded`
- `aria-controls`
- `aria-selected`
- `aria-checked`
- `aria-current`
- `aria-live`
- `aria-modal`

Do not add ARIA attributes unnecessarily. Prefer semantic HTML first, then use ARIA only where needed.

---

## 4. Semantic HTML First

Always prefer native HTML elements.

Examples:

- `<button>` instead of clickable `<div>`
- `<input>`
- `<label>`
- `<select>`
- `<fieldset>`
- `<legend>`

Never replace semantic elements with custom components unless there is a clear functional requirement.

---

## 5. Forms

Every form must support:

- Keyboard-only navigation
- Proper label association
- Required field indication
- Error announcements
- Helper text association
- Correct validation feedback

Every input must remain accessible.

---

## 6. Custom Components

Custom UI components must behave like native controls.

Examples:

- Cards
- Chips
- Tabs
- Toggles
- Dropdowns
- Comboboxes
- Multi-selects
- Date Pickers
- Image Uploaders

Verify:

- Keyboard navigation
- Selection via keyboard
- Focus visibility
- Correct state announcements

---

## 7. Modal & Dialog Rules

Every modal must:

- Use `role="dialog"` (or `alertdialog` where appropriate)
- Use `aria-modal="true"`
- Associate a title correctly
- Trap keyboard focus
- Close with Escape (unless intentionally prevented)
- Restore focus to the triggering element when closed

Background content must not be keyboard-accessible while the dialog is open.

---

## 8. Validation & Error Handling

Validation must be accessible.

Verify:

- Errors are linked to the relevant fields
- Errors are announced appropriately
- Focus moves to the first invalid field when submission fails
- Success and status messages are communicated accessibly

---

## 9. Screen Reader Compatibility

Every UI must be usable with common screen readers.

Verify compatibility with:

- VoiceOver
- NVDA
- TalkBack
- JAWS (where applicable)

Ensure:

- Correct reading order
- Meaningful control names
- Accurate state announcements
- Proper dialog and navigation announcements

---

## 10. Mobile Accessibility

Verify:

- Touch targets meet minimum size recommendations
- Virtual keyboard does not obscure active inputs
- Sticky headers/footers do not hide focused controls
- Portrait and landscape layouts remain accessible

---

## 11. WCAG 2.2 AA Compliance

All interfaces must meet WCAG 2.2 AA requirements where applicable.

Audit:

- Keyboard Accessibility
- Focus Visible
- Focus Order
- Labels and Instructions
- Error Identification
- Name, Role, Value
- Reflow
- Target Size
- Status Messages
- Color Contrast

---

## 12. Accessibility Audit Before Every UI Change

Before implementing any UI change, complete:

- Accessibility Audit
- Keyboard Navigation Audit
- Focus Management Audit
- ARIA Audit
- Screen Reader Audit
- Mobile Accessibility Audit

Fix the root cause before adding new functionality.

---

## 13. Testing Requirements

Every UI feature must be manually verified using:

- Keyboard only
- Mouse only
- Touch only (where applicable)
- Screen reader
- Desktop
- Tablet
- Mobile

Accessibility testing is required before considering a feature complete.

---

## Required Deliverables

For every UI implementation or modification, provide:

1. Accessibility Audit Summary
2. Keyboard Navigation Report
3. Focus Management Report
4. ARIA Compliance Report
5. Screen Reader Compatibility Report
6. WCAG 2.2 AA Compliance Summary
7. Accessibility Issues Found
8. Root Cause Analysis (if issues exist)
9. Minimal Fix Plan
10. Final Verification Confirmation

---

## Success Criteria

A UI change is considered complete only if:

- ✅ Fully operable using keyboard only
- ✅ Proper focus management
- ✅ Uses semantic HTML where possible
- ✅ ARIA implemented correctly where required
- ✅ Screen reader compatible
- ✅ Mobile accessible
- ✅ WCAG 2.2 AA compliant
- ✅ No keyboard traps
- ✅ No inaccessible interactive elements
- ✅ Existing functionality and workflow remain unchanged

**Accessibility is a mandatory quality gate for every user interface across the Esparex platform and must be validated before implementation, modification, or release.**

---

## 🚫 Accessibility Enforcement Gate (Mandatory)

No UI task may be marked complete, merged, or deployed unless the following gates pass.

The implementation **must not**:

- Introduce keyboard traps.
- Break existing keyboard navigation.
- Remove visible focus indicators.
- Replace semantic HTML with non-semantic elements without a justified reason.
- Introduce inaccessible custom controls.
- Break screen reader compatibility.
- Reduce WCAG 2.2 AA compliance.

If any of the above occur:

- Stop implementation.
- Identify the root cause.
- Fix the accessibility issue before continuing.
- Do not add workarounds that bypass accessibility.

Accessibility regressions are treated as functional regressions.

---

## Accessibility Regression Rule

Every UI modification must preserve or improve accessibility.

If an existing accessible behavior is degraded, the change is considered a failed implementation, even if the feature works visually.

---

## Pull Request Requirement

Every UI-related pull request must include confirmation that:

- Keyboard navigation was tested.
- Focus order was verified.
- Screen reader compatibility was checked where applicable.
- ARIA attributes were reviewed.
- WCAG 2.2 AA compliance was considered.
- No accessibility regressions were introduced.

---

## Definition of Done

A UI feature is **not complete** until all of the following are true:

- Functional requirements are satisfied.
- Responsive behavior is verified.
- Accessibility requirements are satisfied.
- Keyboard navigation is fully operational.
- Focus management is correct.
- Screen reader support is verified where applicable.
- No accessibility regressions remain.

---

## 🚨 SINGLE-INSTANCE RESPONSIVE ARCHITECTURE GOVERNANCE (MANDATORY)

Every user-facing screen, layout, header, footer, form, modal, and control across the platform MUST be rendered from a **single responsive component instance**.

### Mandatory Rules:
1. **No Duplicate Top-Level Components**: Never create separate component files or trees for different viewports (e.g. forbid `DesktopHeader` vs `MobileHeader`, `DesktopFooter` vs `MobileFooter`). Use a single component with CSS breakpoint utilities (`hidden md:flex`, `flex md:hidden`).
2. **CSS-Driven Responsiveness First**: Responsive behavior (grid columns, flex direction, padding, margins, visibility) MUST be driven by CSS media query utilities (`sm:`, `md:`, `lg:`, `xl:`).
3. **JS Viewport Check Restrictions**: JavaScript window checks (`useIsMobile`, `window.innerWidth`) are forbidden for static layout branching. JS checks are permitted ONLY for dynamic canvas calculations (e.g., virtualized list lane count) or event backdrop dismissal.
4. **Accessible Overlays & Focus Trapping**: Hidden subtrees (mobile drawers, navigation sheets) MUST use the `inert` attribute and trap focus properly to prevent keyboard navigation leaks (`Tab` focus traversal).

---

## 🚨 ENTERPRISE MONOREPO ENGINEERING GOVERNANCE (ELIMINATING CORE FALLACIES)

### 1. Scope & Applicability
This standard applies to all domain modules (Location, Listings, Payments, Auth, Chat, Search, and User Profiles) across the entire Esparex platform.

### 2. The 6 Pillars of Core Fallacy Elimination

#### Pillar 1: Contract-First SSOT Architecture (`packages/contracts`)
* **Shared Contracts as the Single Source of Truth:** All entity models must have their authoritative schema defined only in `packages/contracts`.
* **Pre-computed Canonical Fields:** Any field used for user presentation (e.g., `location.display`, `ad.formattedPrice`, `user.displayName`) must be computed **once** at the domain boundary and attached to the DTO response.
* **Frontend Contract Immutability:** UI apps (`apps/web`) must consume response DTO properties directly. Frontend code is prohibited from re-formatting or re-calculating canonical domain properties.

#### Pillar 2: Zero Primitive Obsession
* **Whole-Object Parameter Passing:** Function signatures, custom hooks, and context actions must take complete, typed DTOs (e.g. `(location: Location)`, `(ad: ListingDTO)`), rather than loose primitive parameters (e.g. `(city, state, name, id)`).
* **Immutable Boundary Crossing:** When data moves between layers (Controller → Core Service → Repository or Context → Hook → UI Component), the entity must cross the boundary as a single immutable object.

#### Pillar 3: Single-Instance Domain Formatters (One Domain, One Formatter)
* **Ban on Use-Case Formatters:** Creating UI-specific domain formatters (e.g., `getHeaderLocationLabel`, `getSearchPriceLabel`, `getMobileCardDate`) is strictly forbidden across all features.
* **Centralized Domain Formatter Standard:** Every domain concept has **exactly one canonical formatter** in `core/src/services` or `@esparex/shared`. All UI and state code must use this centralized formatter.

#### Pillar 4: 100% Spec Matrix Coverage for Domain Hierarchies
* **Variant Sufficiency:** Before implementing or refactoring any domain entity, developers must document a 100% Hierarchy & Variant Matrix in the design specification (e.g., Location levels: `Country` → `State` → `City` → `Area/Locality` → `Village`).
* **Complete Formatter Logic:** Every domain formatter must explicitly cover every row of its entity matrix. Partial fallbacks that truncate hierarchy levels are rejected.

#### Pillar 5: Zero-Leakage Layered Architecture Governance
* **UI Components (`apps/web`):** Own layout rendering, user gestures, and displaying pre-computed fields. Must **not** own string formatting, business logic, or raw calculation.
* **State Context (`apps/web`):** Owns UI state synchronization. Must **not** own custom string builders or domain transformations.
* **Controllers (`backend/api`):** Own request validation, HTTP status codes, and session auth. Must **not** perform direct database queries or business calculations.
* **Domain Services (`core`):** Own business logic, invariants, and canonical SSOT formatters.

#### Pillar 6: Automated CI/CD & Governance Gates
* **Pre-Implementation Gate (ADR):** Any change touching shared DTOs or domain formatters requires an Architectural Decision Record evaluating backwards compatibility.
* **Contract Impact Checklist:** Any PR changing an API contract dimension must complete the mandatory checklist verifying that Backend, Frontend, and Playwright E2E mocks are synchronized.

---

## 🚨 ARCHITECTURAL OWNERSHIP & ANTI-DUPLICATION GOVERNANCE STANDARD (MANDATORY)

### 1. Ownership Matrix

Every architectural responsibility across the Esparex platform must have exactly one designated owner:

| Responsibility | Architectural Owner | Allowed Consumers | Prohibited In |
| --- | --- | --- | --- |
| **Layout Shell & Bounds** | `PageContainer` / `PageShell` | Feature Pages | Feature sub-tabs, internal components |
| **Design Tokens** | `packages/ui/src/tokens` | All Packages & Apps | Local inline magic values |
| **UI Primitives** | `@esparex/ui` (`packages/ui`) | `apps/web`, `apps/admin` | App-level local implementations |
| **Business Components** | Feature Modules (`components/user/*`) | Feature Pages | Shared `@esparex/ui` package |
| **Business Logic & Rules** | `@esparex/core` | Controllers, Hooks, UI | UI presentation components |
| **API Contracts & DTOs** | `@esparex/contracts` | All Packages & Apps | App-level duplicate DTO types |

---

### 2. "Do Not Duplicate" Component Rule

The following foundational primitives must **NEVER** have multiple implementations across any package or app:

```text
PROHIBITED FROM DUPLICATION:
- Button          - Input           - Select          - Checkbox
- RadioGroup      - Switch          - Dialog          - Drawer
- Sheet           - Card            - Table           - Spinner
- Badge           - StatusChip      - Toast / Popup   - Modal
```

---

### 3. Duplication Boundary Criteria (Allowed vs. Prohibited)

```text
✅ ALLOWED
✓ Feature business logic & workflows
✓ Feature-specific forms & step wizards
✓ Page composition & layout slot wiring
✓ Feature-scoped custom hooks
✓ Domain validation rules

❌ STRICTLY PROHIBITED
✗ Duplicate UI primitives (e.g. apps/web/src/components/ui/Input.tsx)
✗ Nested layout containers (e.g. <PageContainer> inside <PageContainer>)
✗ Local token overrides or inline color/font/spacing duplicates
✗ Viewport-duplicated top-level headers/footers (e.g. DesktopHeader vs MobileHeader)
✗ Duplicate utility functions or string formatters
```

---

### 4. Component Creation Decision Tree

Before creating or adding any UI component, follow this exact decision tree:

```text
Need a UI component?
 │
 ├── Already exists in @esparex/ui?
 │    ├── YES ──► CONSUME IT (Do NOT create a local duplicate).
 │    └── NO
 │         │
 │         ├── Reusable across multiple apps or features?
 │         │    ├── YES ──► CREATE INSIDE @esparex/ui (with ADR approval).
 │         │    └── NO  ──► CREATE INSIDE FEATURE MODULE (as a business component).
```

---

### 5. Ownership Before Creation Rule

> Before creating any component, hook, utility, or schema, developer/agent must determine its authoritative architectural owner. If an owner already exists, extend or consume that implementation instead of creating a new one.

---

### 6. PR Anti-Duplication Audit Checklist

Every UI-related Pull Request must verify:

- [ ] **Primitive Check**: Is this component already available in `@esparex/ui`?
- [ ] **Single Implementation**: Does this introduce a second/parallel implementation of an existing control?
- [ ] **Package Location**: Does a reusable primitive belong inside `packages/ui`?
- [ ] **Single Container**: Does this introduce a duplicate/nested layout container (`PageContainer`)?
- [ ] **Responsive Unity**: Does this duplicate DOM structures for mobile vs desktop?
- [ ] **Design Tokens**: Does this use canonical design tokens (`--color-surface`, `--size-*`)?
- [ ] **SSOT Governance**: Does this preserve single-instance architectural ownership?

---

### 7. Architecture Decision Record (ADR) Requirement

Any new reusable primitive, layout container, design token, or cross-feature component requires a documented **Architecture Decision Record (ADR)** evaluating:
1. Rationale and intended consumers.
2. Why existing `@esparex/ui` implementations cannot be extended.
3. Backwards compatibility & migration strategy.

---

### 8. SSOT Violation Reference Matrix

```text
❌ PROHIBITED: Local primitive duplicate
   apps/web/src/components/ui/Input.tsx (Local implementation)
   packages/ui/src/atoms/Input.tsx      (Shared SSOT)
   👉 CORRECT: export { Input } from "@esparex/ui";

---------------------------------------------------------

❌ PROHIBITED: Nested layout containers
   <PageContainer variant="wide">
      <main>
         <PageContainer variant="default">  <-- DUPLICATE CONTAINER
         </PageContainer>
      </main>
   </PageContainer>
   👉 CORRECT: Sub-tabs use <div className="space-y-4 max-w-3xl"> inside <main>.

---------------------------------------------------------

❌ PROHIBITED: Viewport component duplication
   DesktopHeader.tsx
   MobileHeader.tsx
   👉 CORRECT: Header.tsx using CSS media query utilities (hidden md:flex, flex md:hidden).
```

---

### 9. Migration Before Creation Rule

> If a new feature requires modifying an existing shared primitive, developer/agent MUST migrate or extend the shared primitive rather than introducing a parallel implementation. Creating a second implementation to avoid modifying the shared component is strictly prohibited.

---

### 10. Repository Health Goals

- **Zero** duplicated UI primitives across all applications.
- **Zero** duplicated layout containers (`<PageContainer>` nesting).
- **Zero** duplicate responsive components (`Desktop*` vs `Mobile*`).
- **Zero** local implementations of shared foundation controls.
- **One** owner for every reusable component.
- **One** owner for every design token.
- **One** owner for every layout responsibility.
- **Zero** architectural drift.



