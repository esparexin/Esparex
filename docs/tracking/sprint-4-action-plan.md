# Sprint 4 — Engineering Execution Plan

**Sprint Objective**

Raise Esparex from a technically stable platform to an enterprise-quality platform by strengthening accessibility, design system governance, component architecture, build reliability, and engineering documentation.

**Sprint Theme**

> Quality • Accessibility • Architecture • Governance

---

# Phase 0 — Platform & CI Hardening

## IA-003 — CI Workflow Alignment

### Objective

Ensure every pull request executes the exact same validation pipeline locally and in CI.

### Scope

* Node version alignment
* npm workspace validation
* Type checking
* Unit testing
* Expo production bundle
* Lint
* Build verification

### Deliverables

* CI workflow updated
* Node version standardized
* Clean install verification
* Expo export verification
* Zero manual setup

### Acceptance Criteria

* `npm install` succeeds on clean clone
* `npm run type-check` passes
* `npm test` passes
* `expo export` iOS passes
* `expo export` Android passes
* CI passes without manual intervention

---

# Phase 1 — Accessibility Audit (A11Y-001)

## Objective

Bring both Web and Mobile closer to WCAG 2.2 AA compliance.

### Scope

Audit:
* Forms
* Buttons
* Inputs
* Dialogs
* Drawers
* Modals
* Navigation
* Post Ad Wizard
* Search
* Filters

### Verify

#### Web
* Keyboard navigation
* Focus order
* Visible focus ring
* `aria-label`
* `aria-labelledby`
* `aria-describedby`
* Contrast ratio

#### Mobile
* `accessibilityLabel`
* `accessibilityHint`
* `accessibilityRole`
* Screen reader order
* TalkBack
* VoiceOver

### Deliverables

* Accessibility report (`docs/audits/accessibility-audit.md`)
* Accessibility issue register
* WCAG mapping
* Verification screenshots

---

# Phase 2 — Enterprise State Matrix (SM-001)

## Objective

Every feature must implement identical application states.

### Required States

* Loading
* Skeleton
* Empty
* Error
* Success
* Offline
* Unauthorized
* Retry
* Partial Data

### Deliverables

* State Matrix (`docs/architecture/state-coverage-matrix.md`)
* Coverage report
* Missing states report
* Shared state components

---

# Phase 3 — Component Consolidation (AD-001)

## Objective

Eliminate duplicated UI primitives.

### Audit

```text
packages/ui
  vs
apps/web/src/components
  vs
apps/mobile/components
```

### Rules

Similarity > 75% ──► Consolidate to `@esparex/ui`

### Deliverables

* Duplicate report
* Migration report
* Deletion report
* Reference graph

---

# Phase 4 — Design System Governance

Audit every component against the design system.

### Verify

* Colors
* Spacing
* Radius
* Typography
* Shadows
* Elevation
* Icon sizing
* Button variants
* Input variants

### Output

* Design System Compliance Report (`docs/design-system/compliance-report.md`)

---

# Phase 5 — Performance Audit

### Audit

#### Web
* Next.js bundle
* Route splitting
* Image optimization
* CLS
* LCP
* INP
* Hydration

#### Mobile
* Unnecessary renders
* FlatList
* FlashList opportunity
* Memoization
* Expensive hooks
* Navigation performance

### Deliverables

* Performance baseline (`docs/performance/baseline-report.md`)
* Performance recommendations

---

# Phase 6 — Architecture Validation

### Audit

* Feature boundaries
* Package boundaries
* Dependency direction
* Circular imports
* Dead exports
* Shared contracts
* API usage

### Deliverables

* Architecture Compliance Report (`docs/architecture/compliance-report.md`)

---

# Mandatory Deliverables Per PR

Every Sprint 4 PR must include:

### 1. Engineering Execution Log
* Files changed
* Why changed
* Scope
* Breaking changes
* Rollback

### 2. Verification Report
* Type-check
* Tests
* Lint
* Build
* Bundle
* Screenshots

### 3. Evidence Report
* Command executed
* Output
* Metrics
* Before
* After

### 4. Rollback Plan
* Files
* Commits
* Recovery procedure
* Expected impact

### 5. Governance Updates
* Engineering Action Register (`docs/tracking/engineering-action-register.md`)
* Decision Register (`docs/architecture/decision-register.md`)
* Sprint Tracker (`docs/tracking/sprint-4.md`)
* Closing Report (`docs/tracking/sprint-4-closing-report.md`)
* Retrospective (`docs/tracking/sprint-4-retrospective.md`)

---

# Sprint 4 Success Metrics

| Metric | Target |
| --- | --- |
| TypeScript Errors | **0** |
| Test Failures | **0** |
| ESLint Errors | **0** |
| Production Bundle Errors | **0** |
| WCAG Critical Issues | **0** |
| Duplicate UI Components | **0** (>75% similarity) |
| Component Design System Compliance | **100%** |
| Architecture Violations | **0** |
| CI Success Rate | **100%** |
| Engineering Evidence Coverage | **100%** |

---

# Exit Criteria

Sprint 4 is complete only when:

* ✅ CI pipeline is fully automated and reproducible.
* ✅ Accessibility audit is complete with all critical issues resolved.
* ✅ State coverage matrix is implemented and documented.
* ✅ Duplicate UI primitives have been consolidated into `@esparex/ui`.
* ✅ Design system compliance reaches 100% for audited components.
* ✅ Performance audit establishes a baseline and documents improvements.
* ✅ Architecture audit reports no critical boundary violations.
* ✅ Every PR includes an execution log, verification report, evidence report, rollback plan, and governance updates.
* ✅ Sprint 4 closing report, retrospective, and Sprint 5 action plan are completed.
