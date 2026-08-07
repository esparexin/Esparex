---
version: 1.1
status: Approved
owner: Platform Architecture
last_updated: 2026-08-06
---

# UI Foundation Blueprint (SSOT)

This document serves as the permanent architectural constitution and master plan for the Esparex UI Modernization Program. It defines the universal standards, pipelines, and governance for achieving parity across Web, Admin, and React Native platforms.

## Core Architecture Principles

Every sprint must adhere to the following principles:
- **Single Source of Truth (SSOT)**
- **Mobile-first responsive design**
- **Platform-specific rendering**
- **Shared headless business logic**
- **Token-driven styling**
- **Accessibility by default (WCAG 2.2 AA)**
- **Canonical UI primitives must have a single owner**. Platform-specific implementations are allowed when required by rendering differences, but they must preserve a consistent API wherever practical.
- **No arbitrary design values without documented justification**
- **One logical concern per PR**
- **Evidence before implementation**

## Out of Scope & Backward Compatibility

**Out of Scope:** The modernization program does not include:
- UI redesign (Preserve existing UX; focus is strictly on architecture, consistency, maintainability, and parity)
- Feature development
- Backend refactoring or Business logic refactoring (unless required for architectural separation)
- API redesign or Database schema changes
- Business workflow changes, Authentication redesign, or Payment flow redesign

**Backward Compatibility:** UI modernization must preserve existing user-facing behavior. Any intentional UX change requires a documented proposal, stakeholder approval, and its own dedicated PR.

## Design System Hierarchy

When conflicts arise, the order of authority is as follows:
1. **UI Foundation Blueprint (SSOT)**
2. **Architecture Decision Records (ADR)**
3. **`packages/design-tokens`**
4. **`packages/ui` / `packages/mobile-ui`**
5. **Feature Components**
6. **Pages**

## Repository Structure

The intended package ownership is clearly defined so every engineer knows where new work belongs:
```text
packages/
    design-tokens
    core
    ui
    mobile-ui

apps/
    web
    admin
    mobile
```

## 1. Design Token Architecture & Pipeline

**Goal:** Establish a single canonical token pipeline that prevents parallel systems and duplicated effort.

`packages/design-tokens` is the only authoritative source for design tokens. Other packages and applications may consume generated artifacts but must not define or own foundational design tokens.

**Token Categories Managed:**
Colors, Typography, Spacing, Sizing, Radius, Elevation/Shadows, Motion, Breakpoints, Z-index, Opacity, Icon sizing, Safe-area constants.

**Design Token Governance:**
New design tokens may only be introduced when at least one of the following is true:
- Reused across multiple features.
- Represents a semantic design concept.
- Required for platform parity.
- Approved through ADR.

**Token Pipeline:**
```text
packages/design-tokens
        │
        ├───────────────┐
        │               │
CSS Variables       Native Tokens
        │               │
Tailwind          NativeWind
        │               │
packages/ui   packages/mobile-ui
        │               │
Web/Admin       Android/iOS
```

## 2. Component Ownership & Architecture Layer Boundaries

**Goal:** Eliminate duplicate components and enable true code sharing without forcing DOM elements into Native views.

**Architecture Dependency Direction:**
Higher layers may depend only on lower layers. Lower layers must never import from higher layers.

| Layer | Can Import | Allowed Responsibilities | Not Allowed |
| :--- | :--- | :--- | :--- |
| `packages/design-tokens` | Nothing | Design values only | Components, business logic |
| `packages/core` | `design-tokens` | Headless logic, state, validation | UI rendering |
| `packages/ui` | `design-tokens`, `core` | Web/Admin rendering | Business logic |
| `packages/mobile-ui` | `design-tokens`, `core` | Native rendering | Business logic |
| `apps/*` | `design-tokens`, `core`, `ui/mobile-ui` | Feature composition and routing | Duplicate primitives or tokens |

**Headless Logic Boundaries:** Headless logic packages may expose hooks, state machines, validation, and business workflows, but they must not import platform rendering libraries.

**Platform-Specific Responsibilities:**
- **Web:** HTML, DOM, CSS, Tailwind, ARIA
- **Native:** React Native Views, NativeWind, Platform APIs, Native accessibility

**Feature Component Ownership:**
Feature components are application-specific and live inside `apps/*`. They must compose shared primitives from `packages/ui` rather than redefining them.

**Architecture:** `Design Tokens` → `Headless Logic` → `Platform UI`
We will NOT attempt to share rendering primitives between Web and React Native. Instead, we share the API and the *headless hook* controlling the behavior, allowing the platform to handle rendering natively.

## 3. Responsive Foundation Rules

**Goal:** Standardize viewport adaptation without JavaScript hydration mismatches.
- Breakpoints are owned exclusively by `packages/design-tokens`.
- Layout decisions must be CSS-driven unless runtime measurements are required.
- Components must not duplicate markup solely for desktop/mobile variants.
- One responsive component, not separate Desktop/Mobile implementations.
- JavaScript viewport detection only when required (virtualization, gestures, measurements).
- Safe-area ownership defined once at the root level.

## 4. Platform Standards

- **Accessibility**:
  - Semantic HTML, Keyboard-first interaction, Focus restoration, Visible focus indicators, Accessible dialogs/forms, Reduced motion support.
  - WCAG 2.2 AA Compliance.
- **Performance Budget**:
  - Core Web Vitals optimized (LCP, INP, CLS)
  - Strict bundle size and JS payload targets
  - Lazy loading enforced, Hydration warnings = 0
  - Skeleton usage (preventing layout shifts), Virtualized lists for large data.
- **Navigation**: Define clear patterns for bottom navigation (mobile), sidebars (admin/desktop), and sticky headers.
- **Forms**: Consolidate form validation to a single pattern. Favor inline validation over toasts for form field errors.
- **Motion**: Standardize transition durations and easings to prevent jarring interactions.

## 5. Success Metrics

| Metric | Target |
| :--- | :--- |
| Duplicate components | 0 canonical duplicates |
| Duplicate tokens | 0 |
| Arbitrary colors | 0 |
| Arbitrary typography | < 5 documented exceptions |
| Shared primitive coverage | 100% |
| Accessibility | No Critical or High WCAG violations |
| Responsive issues | 0 Critical |
| React Native token parity | All shared tokens synchronized |
| Bundle regression | No regression beyond approved budget |
| Hydration warnings | 0 in production builds |

## 6. Architecture & Governance Strategy

### Document Governance
- Changes require architectural review and must reference an ADR. Version must be incremented.
- Existing sprint plans remain governed by the version active when they were approved.

### Architecture Decision Records (ADR)
ADRs are mandatory when introducing: New package, Dependency direction change, Design token architecture, Responsive architecture, Navigation architecture, Component ownership, Breaking API, or Cross-platform contract changes.

### Sprint Governance & Scope Freeze
- One sprint may contain multiple PRs. One PR addresses one logical concern only.
- Every PR must be independently reviewable and releasable.
- **Scope Freeze Rule**: During a sprint, only work defined within that sprint's scope may be implemented. Newly discovered issues must be documented and deferred to a future sprint unless they block completion of the current sprint.

### Definition of Evidence
"Evidence before implementation" means providing objective proof. Evidence may include: repository scan, dependency graph, import analysis, bundle analysis, Lighthouse report, accessibility audit, profiler trace, screenshot comparison, or production logs.

### Rollback Expectations
For every sprint/PR, expectations must be documented:
- Rollback strategy
- Affected packages
- Migration notes
- Compatibility notes

### Design Review Gate
Every sprint implementation must follow this flow:
`Audit` → `Architecture Review` → `Implementation` → `Verification` → `PR Review` → `Merge`

### Deprecation Policy
- Do not delete shared components immediately. Mark them as deprecated. Migrate all consumers.
- **Dependency Verification**: Verify imports, runtime behavior, tests, and zero external consumers.
- Remove them in a dedicated cleanup PR.

### Exception Policy
Exceptions are allowed ONLY when required by: Platform limitations, Accessibility requirements, Browser compatibility, or Native platform APIs.
Every exception must include: Reason, File location, Owner, and Review date.

### Definition of Done (DoD)
A sprint is complete only when:
- [ ] Build passes
- [ ] Lint passes
- [ ] Type check passes
- [ ] Tests pass
- [ ] Accessibility verified
- [ ] Responsive verified
- [ ] Documentation updated
- [ ] ADR updated (if required)
- [ ] Rollback documented
- [ ] PR approved
