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

## Mapper Ownership Rule

Mappers own boundary transformations between DTOs and Domain entities across all applications and packages.

```text
Application Mapper
Domain ──► Request DTO

Infrastructure Mapper
Response DTO ──► Domain
```

### Governance Constraints:
- Repositories never perform mapping logic.
- Services never perform mapping logic.
- Mapper-to-Mapper dependencies are strictly prohibited.
- All API DTO models MUST be defined in `@esparex/contracts`.

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

## Definition of Done (Mandatory PR Checklist)

Every pull request merged into Esparex MUST satisfy the non-negotiable Feature Definition of Done:

- [ ] **Feature Implementation**: Functional requirements fully satisfied according to SSOT contracts.
- [ ] **Automated Testing**: Unit tests (`npm test`), integration tests, contract compatibility checks, and Playwright E2E suites (`tests/plans-purchase.spec.ts`) pass with 100% green status.
- [ ] **Type Safety & Build**: Monorepo type-check (`npm run type-check`) and production build (`npm run build`) pass cleanly with exit code `0`.
- [ ] **Multi-Platform Verification**: Verified on Web (Desktop & Mobile viewports) and Mobile (Expo iOS & Android exports).
- [ ] **Accessibility Audit**: WCAG 2.2 AA compliant, visible focus rings, keyboard navigable, screen reader compatible (`accessibilityRole`/`accessibilityLabel`).
- [ ] **Performance Review**: Zero frame drops on list viewports, LCP < 2.5s, CLS < 0.1, unbounded queries paginated.
- [ ] **Security Review**: Input sanitized, CORS origin restricted, authentication & authorization guards enforced, 0 secret exposures.
- [ ] **Zero Suppression Policy**: 0 `no-color-literals` and 0 `no-inline-styles` suppressions added.
- [ ] **Contract Stability**: No breaking changes to public contracts in `@esparex/contracts` unless approved by ADR.
- [ ] **Feature Flags & Telemetry**: Feature flags documented/retired and telemetry events wired for new user flows.
- [ ] **Release Gate 16 (Operational Resilience & Disaster Recovery)**: Verified backend timeout recovery, MongoDB reconnect resilience, payment queue idempotency, and clean fallback error handling.
- [ ] **Release Notes & EA Ledger**: `engineering-action-register.md` updated and `release-notes.md` updated for user-facing changes.

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

> **THE CORE REPOSITORY PRINCIPLE**  
> **The repository is the product. New code is the last resort. Before creating anything, discover what already exists, determine the canonical owner, and extend the Single Source of Truth whenever possible. Only create a new file when repository discovery proves that no suitable implementation exists.**

---

### 1. Mandatory Development Lifecycle (Phase 0 to Phase 5)

Development MUST follow these 6 sequential phases. Implementation (`Phase 2`) is prohibited until `Phase 0` and `Phase 1` are complete.

```text
Phase 0 — Repository Discovery (Mandatory: search existing SSOT, packages, & contracts)
Phase 1 — Architecture Audit & Ownership Check (Determine canonical owner)
Phase 2 — Implementation (Reuse/extend existing; create new ONLY with justification)
Phase 3 — Verification (Run type-check, tests, and repo:gate)
Phase 4 — Cleanup (Zero dead wrappers, zero orphans)
Phase 5 — Merge & PR Approval
```

---

### 2. Ownership Matrix (Canonical Owners vs. Prohibited Locations)

Every artifact across the Esparex platform must have exactly one canonical owner:

| Artifact | Canonical Owner | Prohibited In |
| --- | --- | --- |
| **UI Primitives** | `@esparex/ui` (`packages/ui`) | `apps/*/src/components/ui` |
| **DTOs & Contracts** | `@esparex/contracts` (`packages/contracts`) | `apps/*/types`, `apps/*/schemas` |
| **Shared Utilities & Formatters**| `packages/shared`, `core/src/services` | Feature sub-folders, inline helpers |
| **Business Logic & Services** | `@esparex/core` | React components, hooks |
| **API Client Methods** | Shared API layer (`listingMutationAPI`, `client`) | Individual pages or components |
| **Validation Schemas** | `@esparex/contracts` | Duplicate feature schemas |
| **Layout Shell & Bounds** | `PageContainer` / `PageShell` | Feature sub-tabs, internal components |
| **Design Tokens** | `packages/ui/src/tokens` | Local inline magic values |

**Rule:** Every file must have exactly one canonical owner. If ownership is unclear, stop implementation until ownership is resolved.

---

### 3. "Do Not Duplicate" Component Rule

The following foundational primitives must **NEVER** have multiple implementations across any package or app:

```text
PROHIBITED FROM DUPLICATION:
- Button          - Input           - Select          - Checkbox
- RadioGroup      - Switch          - Dialog          - Drawer
- Sheet           - Card            - Table           - Spinner
- Badge           - StatusChip      - Toast / Popup   - Modal
```

---

### 4. Mandatory Repository Impact Statement (Before Coding)

Every non-trivial task or PR MUST document a **Repository Impact Statement** before writing code:

```text
Repository Impact Statement
---------------------------
Problem: <What problem is being solved?>
Existing SSOT: <Component / service / hook / DTO being reused>
New Files: 0 (or N with justification)
Existing Files Modified: <Count>
Duplicate Risk: None
Reason: Extending existing implementation.
```

If `New Files > 0`, the **New File Justification Gate** is required.

---

### 5. Mandatory Workflow: Repository Discovery First

Every implementation task MUST begin with Phase 0 discovery before any code is written.

```text
PROHIBITED WORKFLOW:
  Task Assigned ──► Open Target Directory ──► Write Code ──► Discover Duplicate Later ❌

REQUIRED WORKFLOW:
  Phase 0 Discovery ──► Architecture Audit ──► Find Existing SSOT ──► Reuse / Extend ──► Create New (Only if zero SSOT matches) ✅
```

Before creating any new `.ts` or `.tsx` file, complete the **Repository Discovery Checklist**:
- [ ] What existing component already solves part of this problem?
- [ ] Which package owns this responsibility?
- [ ] Is there already an API client method?
- [ ] Is there already a custom hook?
- [ ] Is there already a domain service?
- [ ] Is there already a DTO model in `@esparex/contracts`?
- [ ] Is there already a validation schema?
- [ ] Is there already a design-system component in `@esparex/ui`?
- [ ] Is there already a feature flag or utility?
- [ ] Is there already an existing test fixture?

If ANY answer is **YES**, you MUST reuse or extend that implementation.
Only create a new file if the answer is **NO** across all applicable layers.

---

### 6. Mandatory "New File Justification" Gate

Creating a new file requires documented evidence of repository discovery. Any PR introducing a new `.ts` or `.tsx` file must include a **New File Justification** block in the PR description:

```text
NEW FILE JUSTIFICATION
----------------------
Repository Search Completed:
  ✓ packages/ui
  ✓ apps/web/src/components/user/shared
  ✓ hooks / services / core
  ✓ packages/contracts

Reason: No existing component, primitive, or service supports the required behavior after audit.
Decision: New file approved.
```

PRs or automated changes adding new files without this justification are automatically rejected.

---

### 7. Component Creation Decision Tree

Before creating or adding any UI component, follow this exact decision tree:

```text
Need a UI component?
 │
 ├── Already exists in @esparex/ui or components/user/shared?
 │    ├── YES ──► CONSUME OR EXTEND IT (Do NOT create a local duplicate).
 │    └── NO
 │         │
 │         ├── Reusable across multiple apps or features?
 │         │    ├── YES ──► CREATE INSIDE @esparex/ui (with ADR approval).
 │         │    └── NO  ──► CREATE INSIDE FEATURE MODULE (with New File Justification).
```

---

### 8. Repository Health KPI Matrix

Continuous quality enforcement requires maintaining zero duplication across all architectural dimensions:

| Metric | Target | Verification Command |
| --- | :---: | --- |
| **Duplicate Components** | `0` | `npm run guard:duplicate-code` |
| **Duplicate APIs** | `0` | `npm run guard:api-surface` |
| **Duplicate DTOs** | `0` | `npm run repo:contracts` |
| **Duplicate Hooks** | `0` | `npm run repo:ssot` |
| **Duplicate Services** | `0` | `npm run repo:architecture` |
| **Duplicate Routes** | `0` | `npm run repo:routes` |
| **Duplicate Validation Schemas** | `0` | `npm run repo:contracts` |
| **Pass-through Wrappers** | `0` | `npm run guard:dead-code` |
| **Orphan Files** | `0` | `npm run guard:dead-code` |
| **Local UI Primitives** | `0` | `npm run guard:shared-ssot` |
| **Dead Code** | `0` | `npm run guard:dead-code` |
| **SSOT Violations** | `0` | `npm run repo:gate` |

---

### 9. Cultural Engineering Mindset Shift

All developers and AI agents must operate under the core governance mindset:

> ❌ **Prohibited Approach:** "How do I build this feature?"
> 
> ✅ **Mandatory Approach:** "What already exists in the repository that I can reuse or extend?"

---

### 9. PR Anti-Duplication Audit Checklist

Every UI-related Pull Request must verify:

- [ ] **Repository Discovery**: Completed repository search across `@esparex/ui`, `shared/`, `core`, and `contracts`.
- [ ] **New File Justification**: Included mandatory justification block for any newly created `.ts`/`.tsx` files.
- [ ] **Primitive Check**: Confirmed component is not available in `@esparex/ui` or local UI primitives folder.
- [ ] **Single Implementation**: Verified no parallel implementations or pass-through wrappers are introduced.
- [ ] **Package Location**: Reusable primitives placed inside `packages/ui`.
- [ ] **Single Container**: Verified no duplicate or nested layout containers (`PageContainer`).
- [ ] **Responsive Unity**: Single-instance responsive pattern enforced (no `Desktop*` vs `Mobile*` duplication).
- [ ] **Design Tokens**: Canonical design tokens used (`--color-surface`, `--size-*`).
- [ ] **SSOT Governance**: Single-instance architectural ownership preserved.

---

### 10. Architecture Decision Record (ADR) Requirement

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

---

# 🚨 ENTERPRISE PLATFORM STATE MATRIX GOVERNANCE RULE (MANDATORY)

## Applies To

This rule applies to **every feature, page, view, form, modal, drawer, search, wizard, or workflow** implemented across the Esparex platform.

---

## Pre-Implementation Requirement

Before implementing or modifying any user-facing feature, developers and AI agents MUST complete and document an **Enterprise State Coverage Matrix**.

For each state, the developer/agent must declare:
1. Whether the state applies to the feature.
2. The Single Source of Truth (SSOT) component used.
3. Confirmation that no duplicate state primitive or local fallback is introduced.

---

## Enterprise Platform State Matrix Standard

| Category | System State | Required | Mandatory SSOT Implementation |
| :--- | :--- | :---: | :--- |
| **Data** | Loading | ✅ | `Skeleton` (`@/components/ui/skeleton`) |
| **Data** | Empty | ✅ | `EmptyStateShell` (`@/components/ui/EmptyStateShell`) |
| **Data** | Error | ✅ | `ErrorBoundary` & `app/error.tsx` |
| **Network** | Offline | ✅ | `app/offline/page.tsx` & `ConnectivityBanner` |
| **Network** | Slow Network / Timeout | ✅ | `apiClient` Exponential Backoff Retry |
| **Network** | Rate Limited (429) | ✅ | `popupBus` / `notify.error()` |
| **Network** | Maintenance (503) | ✅ | `ClientChromeLoader` (`apiUnavailable={true}`) |
| **Search** | No Search Results | ✅ | `BrowseEmptyState` |
| **Search** | End of Results | ✅ | Standardized Pagination / Infinite Scroll Sentinel |
| **Auth** | Login Required | ✅ | `AuthContext` Drawer / Modal Trigger |
| **Auth** | Session Expired (401) | ✅ | `apiClient` 401 Interceptor + Auth Context Cleanup |
| **Auth** | Permission Denied (403)| ✅ | `app/(public)/unauthorized/page.tsx` or `notFound()` Anti-Enumeration |
| **Forms** | Input Validation | ✅ | Form Controls (`packages/ui`) + Zod Schemas |
| **Forms** | Unsaved Changes | ✅ | Browser `beforeunload` Guard |
| **Forms** | Upload Progress | ✅ | `ImageUploader` Progress Bar |
| **Forms** | Upload Failure | ✅ | `ImageUploader` Inline Failure Retry |
| **Forms** | Duplicate Submission | ✅ | Submit Control Disable + `X-Idempotency-Key` |
| **Marketplace**| Pending Approval | ✅ | `ListingStatusBadge` (`pending`) |
| **Marketplace**| Sold Listing | ✅ | `SoldOutDialog` & Read-Only Chat Guard |
| **Marketplace**| Expired Listing | ✅ | `UserListingsTemplate` Repost CTA |
| **Marketplace**| Rejected Listing | ✅ | Rejection Reason Banner + Edit Action |
| **Marketplace**| Listing 404 / Missing | ✅ | `listingUnavailable.ts` & `app/not-found.tsx` |
| **Permissions**| GPS / Location | ✅ | `useLocationSearch` Dropdown Fallback |
| **Permissions**| Camera / Gallery | ✅ | `ImageUploader` Browser Input Fallback |
| **Notifications**| Success Action | ✅ | `popupBus` / `notify.success()` |
| **Notifications**| Error Action | ✅ | `popupBus` / `notify.error()` |

---

## 🚫 Pull Request Quality Gate Checklist

No pull request containing UI or workflow changes may be merged unless all applicable items are confirmed:

- [ ] **Loading State**: Implemented via SSOT `Skeleton` / `loading.tsx`.
- [ ] **Empty State**: Implemented via SSOT `EmptyStateShell`.
- [ ] **Error State**: Handled via `ErrorBoundary` / `app/error.tsx`.
- [ ] **Success State**: Dispatched via `popupBus` / `notify.success()`.
- [ ] **Offline Behavior**: Verified with Service Worker & Connectivity Banner.
- [ ] **Permission Denied**: Verified (403 redirect or zero-leakage 404).
- [ ] **Session Expired**: Verified (401 interceptor + auth drawer trigger).
- [ ] **Form Validation**: Accessible inline validation errors (`aria-invalid`).
- [ ] **Marketplace Lifecycles**: Verified status badges & action guards.
- [ ] **Network Failure**: Timeout retries and rate limit alerts verified.
- [ ] **Anti-Duplication**: Zero local duplicate state components introduced.
- [ ] **SSOT Reuse**: Reuses existing `@esparex/ui` primitives.
- [ ] **Accessibility**: WCAG 2.2 AA compliant (keyboard, focus ring, screen reader).
- [ ] **Responsiveness**: Single-instance responsive component pattern verified across Mobile, Tablet, and Desktop.

---

## 🚨 LAYOUT GOVERNANCE STANDARD (MANDATORY)

1. **Layout Ownership Principle**:
   Every spacing concern (top, bottom, horizontal gutters, sticky footer offsets, safe-area compensation) MUST have a single owner. Parent and child containers MUST NOT compensate for the same viewport constraint independently.
2. **Single Owner for Bottom Spacing**:
   Sticky footer spacing and bottom action bar offsets MUST be owned by a single layout layer.
3. **No Duplicate Offset Compensation**:
   Content containers (`<form>`, `<main>`, `<section>`) MUST NOT independently apply arbitrary bottom padding (`pb-20`, `pb-32`) to compensate for fixed action bars if the action bar container already provides its own spacing/padding.
4. **Single Layout Responsibility**:
   Only one component or layout wrapper is responsible for managing vertical spacing between the form content and fixed/sticky bottom bars.
5. **Viewport Compensation Audit**:
   Before introducing any new fixed or sticky element (headers, footers, floating actions, bottom bars, drawers):
   - Audit existing viewport compensation.
   - Verify a single owner already exists.
   - Do not introduce additional spacing until ownership has been verified.

---

# 🚨 ESPAREX PLATFORM ARCHITECTURE OPERATING MODEL (MANDATORY)

## Core Architectural Axiom

> **Business rules must never depend on platform. Platform only changes how users interact with the system—not what the system does.**

This standard applies to **every feature, hook, application, component, capability, integration, and workflow** across the Esparex multi-platform monorepo (`apps/web`, `apps/mobile`, `apps/admin`, `@esparex/ui`, `@esparex/core`, `@esparex/contracts`).

---

## 1. Day-to-Day Development Decision Tree

Before writing any code, engineers and AI agents MUST process every feature through the architectural decision tree:

```text
Is this business logic, domain calculation, or validation?
    │
    ├── YES ──► Write in @esparex/core or @esparex/contracts
    │
    └── NO
         │
         ├── Is it a reusable presentation control, token, or layout primitive?
         │    │
         │    ├── YES ──► Write inside @esparex/ui
         │    │
         │    └── NO
         │         │
         │         ├── Is it a device hardware or browser OS capability?
         │         │    │
         │         │    ├── YES ──► Extend/Implement Platform Capability Catalog (Contract + Adapters)
         │         │    │
         │         │    └── NO
         │         │         │
         │         │         ├── Is it an external cloud service, payment gateway, or SDK integration?
         │         │         │    │
         │         │         │    ├── YES ──► Extend/Implement Platform Integration Catalog (Contract + Adapters)
         │         │         │    │
         │         │         │    └── NO ──► Feature Module Orchestration Layer
```

---

## 2. Platform Architecture Specifications & Checklists

For full platform governance specifications, decision records (PADR), capability/integration catalogs, and debt definitions, refer to the authoritative architecture documentation:

- 📘 **Operating Model Specification:** [PLATFORM_ARCHITECTURE.md](file:///Users/admin/Desktop/Esparex/docs/architecture/PLATFORM_ARCHITECTURE.md)
- 📙 **Capability & Integration Catalog:** [PLATFORM_CAPABILITY_CATALOG.md](file:///Users/admin/Desktop/Esparex/docs/architecture/PLATFORM_CAPABILITY_CATALOG.md)
- 📋 **Architectural Review Checklist:** [ARCHITECTURE_CHECKLIST.md](file:///Users/admin/Desktop/Esparex/docs/architecture/ARCHITECTURE_CHECKLIST.md)


---

## 3. Platform Verification Quality Gate Summary

No pull request containing platform capabilities or integrations may be merged unless all items pass verification:

- [ ] **Web Desktop Verified:** Verified on Desktop Chrome/Safari. Hardware/media capabilities use browser-native patterns (e.g., native OS File Picker). Zero mobile hardware dialogs rendered.
- [ ] **Web Mobile Verified:** Verified responsive behavior and web capability fallbacks on mobile browsers.
- [ ] **Tablet Web Verified:** Verified touch & pointer interaction parity on tablet viewports.
- [ ] **iOS Native Verified:** Verified native iOS device/simulator behavior with native permission handling.
- [ ] **Android Native Verified:** Verified native Android device/emulator behavior with native back button and permission handling.
- [ ] **Parity Verification:** Business logic, validation rules, and API DTO contracts are 100% identical across all 5 platforms.

---

## 4. Mongoose Dual-Connection Model Binding Governance Rule (Mandatory)

Every Mongoose schema & model defined inside `core/src/models/` MUST be bound via Esparex's multi-tenant connection helpers (`getUserConnection()` or `getAdminConnection()`). 

Direct exports using default `mongoose.model()` are strictly forbidden:

```ts
// ❌ PROHIBITED: Bypasses connection pool and queries disconnected default Mongoose instance
export default mongoose.models.Entitlement || mongoose.model<IEntitlement>('Entitlement', EntitlementSchema);

// ✅ MANDATORY: Binds model to tenant user connection pool
const connection = getUserConnection();
const Entitlement: Model<IEntitlement> = (connection.models.Entitlement as Model<IEntitlement>) ||
    connection.model<IEntitlement>('Entitlement', EntitlementSchema);
export default Entitlement;
```

---

## 5. Payment Gateway & Checkout Governance Rule (Mandatory)

1. **Strict Mock Payment Gating**: Silent auto-fulfillment of mock orders (`order_mock_*`) is strictly prohibited unless `MOCK_PAYMENTS=true` (backend) and `NEXT_PUBLIC_MOCK_PAYMENTS=true` (frontend) are explicitly configured in `.env`.
2. **No Silent Error Swallowing**: Controller catch blocks MUST extract human-readable error descriptions from third-party SDK error objects (e.g. Razorpay SDK exceptions) and surface diagnostic details when `NODE_ENV === 'development'`.
3. **Key Resolution Precedence**: `.env` variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) MUST take strict priority over seed values stored in database `SystemConfig`.
4. **Client Signature Verification Obligation**: All client-side checkout hooks (`usePlanCheckout.ts`) MUST submit third-party gateway response signatures (`razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`) to `POST /api/v1/payments/verify` immediately upon checkout completion to guarantee atomic transaction state transitions (`INITIATED` -> `SUCCESS`) regardless of webhook latency or local dev environments.

---

## 6. Documentation Hygiene & Anti-Sprawl Governance Rule (Mandatory)

1. **5 Master SSOT Pillars Only**: All architecture standards, API contracts, domain logic rules, and action registers MUST be maintained exclusively within the 5 Authoritative SSOT Pillars (`AGENTS.md`, `PLATFORM_ARCHITECTURE.md`, `REPOSITORY-GOVERNANCE.md`, `engineering-action-register.md`, `packages/ui/GOVERNANCE.md`).
2. **Strict Ban on Ad-hoc Documentation Files**: Creating ad-hoc, temporary, volume-based, or timestamped `.md` files in feature sub-folders, `audit-reports/`, or `docs/reports/` is strictly forbidden.
3. **Continuous Documentation Auditing**: Periodic repository hygiene audits must remove unreferenced, zombie, orphan, or duplicate markdown files after confirming zero code dependencies.

---

## 7. MANDATORY PRE-COMMIT CODE QUALITY & CLEAN CODE GOVERNANCE STANDARD (SSOT & SOP)

> **CORE OPERATING PRINCIPLE**:  
> Code quality, modularity, and repository hygiene audits MUST be performed BEFORE committing. Every code change must satisfy the `clean-code` and `code-quality` skills, pass pre-commit quality gates (`npm run guard:pr-quality`), and leave the repository cleaner than it was before.

### 1. Mandatory Pre-Commit Workflow Protocol (8 Sequential Steps)

Every developer and AI agent MUST execute these 8 steps sequentially before staging or committing changes:

1. **Phase 0 Discovery & Repository Audit (`clean-code` skill)**:
   - Verify live local repository state (`git status`).
   - Audit target files, imports, exports, and dependency chains.
   - Calculate existing component line counts (`wc -l`).

2. **Modularization Pre-Check (`code-quality` skill)**:
   - Check file size thresholds (Component ≤ 250, Hook ≤ 200, Service ≤ 300, Utility ≤ 150).
   - Baseline ratchet: Modified files cannot grow beyond `baseline + 5 lines`.
   - If adding logic will exceed the threshold, **extract sub-modules BEFORE editing**.

3. **Anti-Duplication & SSOT Search**:
   - Search the monorepo (`grep_search` / `list_dir`) for existing components, hooks, formatters, and DTOs.
   - Reuse or extend existing SSOT abstractions. Never introduce duplicate zombie files.

4. **Dead Code & Hygiene Sweep**:
   - Remove unused imports, dead logic, commented-out code, and temporary debugging console logs.

5. **Local Pre-Commit Quality Verification**:
   - Run `npm run guard:pr-quality` locally before running `git commit`.

6. **Static Analysis & Type Verification**:
   - Run `npm run type-check` across all packages (0 errors required).

7. **Automated Unit & Integration Testing**:
   - Run test suites (`npm test`) for affected packages (100% green status required).

8. **Repository Integrity Gate**:
   - Run `npm run repo:gate` to verify all 18 repository quality gates (100% Health Score).

---

### 2. File Size & Modularization Ratchet Matrix

| File Type | Max Allowed (New Files) | Ratchet Limit (Modified Files) | Action If Exceeded |
| --- | :---: | :---: | --- |
| **Component (`*.tsx`)** | `250 lines` | `Baseline + 5 lines` | Extract sub-components / hooks |
| **Hook (`use*.ts`)** | `200 lines` | `Baseline + 5 lines` | Extract sub-hooks / utilities |
| **Service (`*Service.ts`)** | `300 lines` | `Baseline + 5 lines` | Extract sub-services / domain logic |
| **Utility / Helper (`*.ts`)** | `150 lines` | `Baseline + 5 lines` | Split helper modules |
| **Controller (`*Controller.ts`)** | `200 lines` | `Baseline + 5 lines` | Split controllers |

---

### 3. Pre-Commit Verification Gate Command Checklist

Before any commit command is executed, run and confirm:
- [ ] `npm run guard:pr-quality` → **PASS** (Zero file size or ratchet violations)
- [ ] `npm run type-check` → **PASS** (Zero TypeScript errors)
- [ ] `npm test -w <target-package>` → **PASS** (100% green tests)
- [ ] `npm run repo:gate` → **PASS** (18/18 quality gates passed)

---

## 18. ESPAREX FRONTEND LAYOUT & SURFACE ARCHITECTURE GOVERNANCE (EFAS v1.0.0)

## 19. ESPAREX UI/UX SKILL PRECEDENCE & PERMANENT TYPOGRAPHY PREVENTION STANDARD

### 19.1 Four-Tier Skill & Governance Precedence Hierarchy
1. **Tier 1 (Master SSOT Pillars)**: `AGENTS.md`, `PLATFORM_ARCHITECTURE.md`, `REPOSITORY-GOVERNANCE.md`, `engineering-action-register.md`, `packages/ui/GOVERNANCE.md`. Highest authority.
2. **Tier 2 (AI Execution & Pre-Commit Gates)**: `AI_WORKFLOW.md`, `skill-orchestrator`, `clean-code`, `code-quality`. Mandatory lifecycle gates.
3. **Tier 3 (Authoritative Monorepo Skills)**: `esparex-ui-ux`, `esparex_engineering_stack`. Binding constraints for design tokens, Geist font, and library limits.
4. **Tier 4 (Auxiliary Design Guides)**: `ui-styling`, `ui-ux-pro-max`, `design-system`, `brand`, `slides`, `banner-design`. Subordinate auxiliary guides. Must NEVER override Tier 1–3 invariants.

### 19.2 Canonical 10-Level Discrete Typography Scale (SSOT)
All user-facing text across `@esparex/ui`, `apps/web`, `apps/admin`, and `apps/mobile` MUST consume canonical tokens:
- `text-display`: `2.25rem` (36px), line-height `1.2`, tracking `-0.02em` (Hero titles)
- `text-h1`: `1.875rem` (30px), line-height `1.25`, tracking `-0.02em` (Page headers `<h1>`)
- `text-h2`: `1.5rem` (24px), line-height `1.3`, tracking `-0.01em` (Section headers `<h2>`)
- `text-h3`: `1.25rem` (20px), line-height `1.35`, tracking `-0.01em` (Card group titles `<h3>`)
- `text-h4`: `1.125rem` (18px), line-height `1.4`, tracking `0` (Subsection headers, prominent desktop prices)
- `text-body-lg`: `1.0rem` (16px), line-height `1.5`, tracking `0` (Lead text, desktop card prices)
- `text-body`: `0.875rem` (14px), line-height `1.55`, tracking `0` (Standard body text, desktop card titles)
- `text-small`: `0.8125rem` (13px), line-height `1.5`, tracking `0` (Compact listings, helper text)
- `text-caption`: `0.75rem` (12px), line-height `1.4`, tracking `0` (Mobile card titles, footer links, form labels)
- `text-tiny`: `0.6875rem` (11px), line-height `1.4`, tracking `0` (Badges, chips, timestamps)

### 19.3 Non-Negotiable UI/UX Invariants
1. **Zero Arbitrary Font Size Rule**: `text-[13px]`, `text-[1.2rem]`, etc., are strictly prohibited.
2. **Font Family Invariant**: **Geist** (`var(--font-primary)`) is the single font family SSOT. Competing fonts (Inter, Roboto, Poppins) are forbidden.
3. **Single-Instance Responsive Invariant**: No duplicate `Desktop*` vs `Mobile*` component trees.
4. **Native Popup SSOT**: Alerts and notifications MUST use `popupBus` / `notify`. External toast packages (`sonner`, `react-hot-toast`) are banned.






