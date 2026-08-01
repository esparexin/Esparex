---
id: agents-bootstrap
owner: root
type: bootstrap
version: 3.1
last_updated: 2026-07-21
depends_on: []
loads_when: ["*"]
status: active
confidence: stable
reviewed_on: 2026-07-21
review_frequency: quarterly
replaces: []
supersedes: []
tags: []
category: architecture
---
# AGENTS.md — AI Monorepo Operating Governance

This repository uses modular AI governance. `AGENTS.md` serves strictly as the bootstrap orchestrator for loading skills and operating rules.

---

## 1. Git Workflow

1. **Pre-Change Verification Checklist**:
   - `git fetch --all --prune`
   - `git checkout develop && git pull origin develop`
   - `git checkout -b <feature-branch>`
   - Confirm current branch is **not** `develop`.
2. **Mandatory Issue & Branch Coupling**:
   - Search GitHub Issues before any branch or code is created.
   - Branch naming format: `feat/issue-{N}-{description}`, `fix/issue-{N}-{description}`, `chore/issue-{N}-{description}`.
3. **Draft PR Gate**:
   - Open a draft PR targeting `develop` linked with `Closes #{N}` before implementation starts.
4. **Push Remote First Rule**:
   - Always push feature branch to origin and verify remote existence **before** touching `develop`.

---

## 2. Branch Strategy

- **`main`**: Production release branch. Merges strictly via approved release PRs.
- **`develop`**: Primary integration branch. All feature and bugfix branches merge here via PR.
- **`feat/*`**: New capabilities or domain migrations.
- **`fix/*`**: Defect remediation.
- **`chore/*`**: Governance, tooling, or documentation updates.
- **`audit/*`**: Read-only repository & security inspections.

### Branch Lifecycle Policy

- Every feature/fix/docs/perf branch must be deleted after merge.
- Branches superseded by architectural redesigns must be archived or retired with a documented rationale.
- Archive branches are reserved only for work with potential historical or reusable value.
- No long-lived development branches should remain without an active owner or roadmap.
- Perform a Git hygiene audit before each major release to remove merged, stale, and obsolete branches.
---

## 3. Architecture Rules

### Zero-Leakage Architecture Rule
1. **No direct infrastructure leakage**: Application services and orchestrators interact with database schemas strictly via domain-defined **Repository Ports**.
2. **Abstract transaction boundaries**: Session orchestration goes through **UnitOfWork Ports** using `session: unknown`. Direct Mongoose `ClientSession` references in application services are forbidden.
3. **Intent-focused caching**: Cache operations declared behind **Cache Ports**; no low-level Redis helper imports in core services.
4. **Composition wiring**: All dependencies wired at package boundaries via factory functions inside **Composition Roots**.

### Architecture Ownership Rule
Every major component must document exact single-responsibility boundaries:
| Component | Owns | Must NOT Own |
| --- | --- | --- |
| `ListingModalLayout` | Responsive shell, modal presentation, layout slots | Form state, validation, API calls |
| `PostAdWizard` | Wizard step orchestration | Modal layout presentation |
| `ListingFormBase` | Form component rendering & layout | Service/Spare upload logic |
| `SearchFilters` | Filter UI controls | Search execution / API calls |
| `PostAdProvider` | Shared form & wizard state | UI Layout styling |

### Breaking Change Rule
Before merging any architectural change, evaluate:
- Does it change public behavior?
- Does it change API contracts?
- Does it change routes or URLs?
- Does it change persisted state or DB schemas?

If **YES**, explicit approval and a documented migration strategy are mandatory before implementation begins.

### Similarity Threshold Governance Heuristic
Consolidation is **recommended** when overall similarity > 75% AND no single dimension is < 50%. This is a governance heuristic—final approval requires an architecture review confirming readability, domain boundaries, and maintainability improve.

---

## 4. UI/UX Rules

- **Design Standard**: Rich aesthetics, dark modes, glassmorphism, dynamic micro-animations, curated color palettes, Google Fonts (Inter/Outfit).
- **Responsive Layout**: Single-instance responsive component pattern; no duplicate DOM rendering across mobile/desktop viewports.
- **No Placeholders**: Real demonstration assets via `generate_image` or SVG graphics.

---

## 5. Security Rules

- **CodeQL & Taint Barriers**: In-line validation using `mongoose.Types.ObjectId.isValid()`, enum sets, or primitive string sanitization.
- **MongoDB Operator Protection**: Explicit `` operators for user input in queries; strip `$` and `.` from object keys in update payloads (`safeSpecs`).
- **Input Sanitization**: Shared utilities (`assertValidObjectId`, `normalizeSlug`, `sanitizePlainText`, `escapeRegExp`).

---

## 6. Performance Rules

- **Profiler-Gated Optimization**: Performance optimizations run strictly after functional verification using React Profiler / CWV measurements.
- **Unbounded Query Guard**: All list and search queries must be paginated (`limit`/`skip` or cursor).
- **Scan vs Keys**: Redis key scans must use `SCAN` instead of `KEYS`.

---

## 7. Accessibility Rules (WCAG 2.2 AA)

- **Unique DOM IDs**: Every `id`, `aria-labelledby`, `aria-describedby`, and `htmlFor` attribute must be unique across the document.
- **Focus Protection (`inert`)**: Hidden subtrees (mobile drawer / off-screen overlays) must use `inert` to prevent keyboard `Tab` focus leaks.
- **Keyboard Navigation**: All interactive elements focusable with visible focus rings.

---

## 8. Refactoring Rules

### Refactoring Exit Criteria
A refactoring task is complete ONLY when:
1. Functionality is unchanged.
2. Public APIs remain unchanged.
3. TypeScript passes with `0` errors across all packages (`npm run type-check`).
4. Automated test suites pass with 100% green status (`npm test`).
5. No new WCAG 2.2 AA accessibility violations.
6. Measurable duplication reduction or maintainability improvement.
7. Resulting architecture is demonstrably simpler than before.
8. **Architecture Decision Record (ADR)**: Documented rationale, alternatives considered, chosen option, risk analysis, and rollback strategy.
9. **Rollback Plan Verified**: Clear instructions for reverting changes and validating post-rollback state.

---

## 9. Review Checklist

- [ ] Desktop verified
- [ ] Tablet verified
- [ ] Mobile verified
- [ ] Keyboard navigation & screen reader verified
- [ ] Existing workflow unchanged
- [ ] API contract & Backend unchanged
- [ ] Monorepo build & tests passed (`npm run type-check && npm test`)
- [ ] No unrelated files modified (File count guardrails: 1–5 ideal, 6–10 acceptable)

---

## 10. Contract Impact Review (Mandatory)

Any PR that changes an **API contract dimension** must include a completed Contract Impact Checklist before it is considered mergeable.

### What counts as a contract change

| Dimension | Examples |
|---|---|
| HTTP method | `PUT` → `PATCH`, `POST` → `PUT` |
| Route path | `/listings/:id` → `/listings/:id/edit` |
| Request payload | Field renamed, added, removed, or type changed |
| Response envelope | Shape, status code, or field names changed |
| Validation | New required field, changed constraint |
| DTO / Shared schema | Any change in `packages/contracts` |

### Mandatory Contract Impact Checklist

When any of the above dimensions change, the PR description must confirm:

- [ ] **Frontend** — all API calls use the new contract
- [ ] **Backend** — routes, controllers, and validators updated
- [ ] **Playwright mocks** — all `page.route()` interceptors reflect the new method, path, and shape
- [ ] **Integration / unit tests** — mocks and stubs updated
- [ ] **Shared contracts** (`packages/contracts`) — schema and types updated if applicable
- [ ] **API documentation** — OpenAPI / README updated if applicable

### Enforcement

A PR that changes an API contract dimension but does **not** include the above checklist must be blocked at review.

Reviewers must verify each item independently — do not accept "tests pass" as a substitute for the checklist.

### Rationale

This rule was introduced after a `PUT → PATCH` migration landed in `listingMutationAPI.ts` without updating the Playwright route interceptors. The production code was correct, but the test suite diverged silently. Both failures (`capturedPayload.images undefined` and `Ad Updated not visible`) shared the same root cause and would have been caught by this checklist.

---

## 11. Esparex Engineering Governance Standard (Mandatory)

All human engineers and AI agents must adhere strictly to these processes when introducing modifications, additions, or deprecations in the monorepo.

### 11.1 Scope & Applicability
This standard applies to:
- Feature development, bug/hotfixes, refactoring.
- Infrastructure, deployment configurations, and security controls.
- API and database additions, modifications, and deprecations.

This standard does NOT apply to:
- Documentation typos or content edits.
- Markdown formatting adjustments.
- Comment-only changes.

### 11.2 Engineering Principles
1. **Test Isolation:** Frontend components and tests must be decoupled from running database or backend dependencies. Mocks should be utilized for UI regression testing.
2. **Explicit Dependency Inversion:** Components must rely on interface abstractions (e.g., `TelemetryProvider`) rather than direct implementation bindings.
3. **No Test Logic in Production Code:** Production paths must remain free of E2E-specific conditionals.
4. **Contract-First Development:** Shared types in `packages/contracts` serve as the SSOT. Backend validation and frontend E2E mocks must implement these types directly.

### 11.3 Change Classifications
Every change must be classified before implementation to trigger the relevant checklists:
- **API Contract:** Payload schemas, query validations, route paths, HTTP methods, DTOs.
- **Database & Cache:** Database schemas, validation rules, indexing, Redis key policies.
- **Authentication & AuthZ:** Middleware, guards, session cookie flags, token validation.
- **Environment & Build:** Env variables, configuration schemas, Docker setups, build variables.
- **UI & UX Flow:** Dom structure, page selectors, form controls, styling, accessibility.
- **Telemetry & Analytics:** Tracking providers, location loggers, event triggers.

### 11.4 Risk Classification Matrix
The classification of risk determines the required approval gate:
- **Low:** Documentation edits, styling refinements, comments, or UI text adjustments. Approved by standard PR review.
- **Medium:** New UI flows, internal refactoring, non-breaking performance optimizations. Approved by team review.
- **High:** API contracts, authentication handlers, payment checkouts, database schema migrations. Approved by architecture review + evidence gates.
- **Critical:** Core security config, production infrastructure, financial transactions, AuthZ guards. Approved by architecture + security + DevOps approval.

### 11.5 Pre-Implementation Decision Gate
Before starting implementation (excluding Low risk changes), the author must document answers to the following:
- What problem are we solving? (Core motivation).
- Is this the correct architectural solution? (Compare at least one alternative).
- Does it affect backwards compatibility? (Will this break external clients or mobile app versions?).
- What are the risks? (Analyze concurrency, performance, security, and integration vulnerabilities).
- Is there a simpler way? (Enforce simplicity).

#### Architectural Decision Records (ADRs)
An ADR is **mandatory** before starting implementation for:
- Introducing new infrastructure (e.g. database, queue, cache engines).
- Redesigning API routing or authentication architectures.
- Introducing a new framework, package, or third-party SDK.
- Applying cross-cutting architectural patterns.

### 11.6 Breaking Changes
If a change breaks backwards compatibility, the following must be prepared before code implementation:
- **Migration Guide:** A clear guide for downstream consumers describing how to transition.
- **Versioning Strategy:** Incrementing major/minor versions or establishing deprecation headers.
- **Rollout Plan:** Canary deployments or feature-flag-based migrations.
- **Rollback Plan:** Immediate reversion strategy in the event of production failure.
- **Consumer Communication:** Notification template to alert team members and dependent service owners.

### 11.7 Dependency Checklists
Apply the appropriate checklists based on the Change Classification:
- **API Contract Checklist:**
  - [ ] Shared types (`packages/contracts`) updated.
  - [ ] Backend controller body/query validators updated.
  - [ ] Frontend client API services and hooks updated.
  - [ ] Playwright E2E mocks and interceptors (`tests/interceptors`) updated.
  - [ ] OpenAPI documentation/schemas synchronized.
- **Environment & Build Checklist:**
  - [ ] Default values added to local config templates (`.env.local.example`).
  - [ ] Build-time environment configs (`NEXT_PUBLIC_*`) verified.
  - [ ] E2E variables configured in Playwright (`webServer.command`/`env`).
  - [ ] Staging and production secrets updated.
- **Database & Cache Checklist:**
  - [ ] Database schema models updated.
  - [ ] Up-migration script provided and verified locally.
  - [ ] Down-migration script provided and verified for rollbacks.
  - [ ] Redis caching keys and cache-invalidation logic updated.

### 11.8 Telemetry & Endpoint Class Alignment
- [ ] Telemetry calls must use the `TelemetryProvider` abstraction.
- [ ] No telemetry requests should be sent to the network layer during automated E2E runs (must be handled by the `NullTelemetryProvider`).
- [ ] Next.js rewrites must be configured to fail fast (404 fallback) for unmocked routes rather than logging proxy TCP connection timeouts to console logs.

### 11.9 Test Run Proxy Isolation Rule
Playwright configurations must enforce strict E2E routing. Any request matching `/api/v1/**` that is not registered with an active mock must be intercepted and rejected with a mock `404` or `500` error directly at the browser layer, avoiding Node-level socket leaks and proxy socket warnings.

### 11.10 Ownership Matrix
To prevent the "someone else will update it" assumption, downstream dependencies must be assigned to owners:
- **Shared Contracts:** Platform Architect / Core Backend Team
- **API Endpoints & Controllers:** Backend Team / Security Reviewer
- **Frontend Clients & Hooks:** Web Team / Frontend QA
- **E2E Test Mocks & Specs:** Frontend QA / Web Team
- **CI/CD Pipelines & DevOps:** DevOps Team / Platform Architect

### 11.11 Evidence Gates
For every pull request, the author must provide:
1. What changed?
2. Where was it updated?
3. How was it verified? (Provide E2E test runs, local build status, or screenshots).

### 11.12 Definition of Done (DoD)
A feature is considered **complete** only when it satisfies the following DoD checklist:
- [ ] Requirements fully implemented and verified.
- [ ] No dead, unused, or orphaned code remaining.
- [ ] No duplicate component or service implementations.
- [ ] Build compiles cleanly and type-checks pass.
- [ ] All automated tests (unit, integration, regression) pass according to repository quality standards.
- [ ] Documentation and OpenAPI/Swagger specs updated.
- [ ] Downstream dependency impact checklists completed.
- [ ] Mandatory code reviews completed and approved.

---

## 12. Enterprise Monorepo Engineering Governance Standard (Eliminating Core Fallacies)

> **Single Source of Truth**: The complete Enterprise Monorepo Engineering Governance Standard and 6 Pillars of Core Fallacy Elimination are authoritatively maintained in [AGENTS.md (Root)](../AGENTS.md#🚨-enterprise-monorepo-engineering-governance-eliminating-core-fallacies). All developers and AI agents must follow the canonical standard documented in the root AGENTS.md.

---

## 13. Native Popup Governance Standard (Strict Ban on External Toast & Sonner Packages)

### 13.1 Mandatory Rules
1. **Strict Ban on Third-Party Toast Libraries**: Introducing, importing, or installing external toast libraries (`sonner`, `react-hot-toast`, `react-toastify`, `toast`, etc.) is strictly forbidden across all packages and applications in the Esparex platform.
2. **Single-Instance Native Popup SSOT**: All notifications, error alerts, info banners, warnings, and action confirmations MUST be dispatched exclusively through Esparex's canonical single-instance native popup architecture (`popupBus`, `notify`, `PopupProvider`, `AppPopup` / `PopupDialogView`).
3. **Forbidden Toast Containers**: Developers and AI agents MUST NOT render `<Toaster />`, `<ToastContainer />`, or any ad-hoc toast provider elements in layouts or page components.
4. **Queueing & Priority SSOT**: All user-facing popups must flow through `createUnifiedPopupBus` and `usePopupQueue` to preserve single-instance rendering, priority queueing (`error`/`confirm` = 3 > `warning` = 2 > `info` = 1), and 2000ms deduplication.

---

## 14. UI/UX Audit Standard: Oversized Bottom Padding

**Objective**

Prevent unnecessary vertical whitespace that reduces information density, increases scrolling, or creates inconsistent layouts.

**Audit Scope**

* Page containers
* Forms
* Lists
* Cards
* Drawers
* Modals
* Sticky footer layouts
* Mobile safe-area handling

**Required Checks**

1. **Single source of bottom spacing**

   * Bottom spacing must originate from one layer only.
   * Avoid cumulative spacing from:
     * parent `padding-bottom`
     * child `margin-bottom`
     * `gap`
     * spacer elements

2. **Sticky footer compensation**

   * Reserve only the space required for fixed/sticky controls.
   * Do not duplicate footer height with additional page padding.

3. **Safe-area compliance**

   * Apply `env(safe-area-inset-bottom)` once.
   * Never combine it with large arbitrary padding unless justified.

4. **Responsive consistency**

   * Every breakpoint-specific increase in bottom spacing must have a documented UX reason.

5. **Design token compliance**

   * Use spacing tokens instead of arbitrary values.
   * Avoid large spacing values without justification.

**Failure Conditions**

* More than ~120px of empty scroll space after the final interactive element.
* Stacked bottom spacing from multiple layout layers.
* Duplicate safe-area compensation.
* Empty spacer elements used solely to create visual space.
* Legacy padding left after component removal.

**Preferred Fix Order**

1. Remove redundant spacing.
2. Consolidate spacing into a single container.
3. Use design-system spacing tokens.
4. Apply safe-area padding only where required.
5. Re-test on mobile devices.

---

## 15. UI/UX Engineering Rule — Preserve Design System Primitives

### Principle

Never remove or bypass design system primitives solely to eliminate spacing issues.

Design system components exist to provide standardized layout behavior, consistency, accessibility, and maintainability. If excessive whitespace exists, the root cause should be identified and corrected rather than replacing foundational components with ad hoc styling.

### Root Cause First

Before modifying any design system component, identify where the additional space is actually introduced.

Audit the complete layout hierarchy:

* Parent layout containers
* Section wrappers
* Card wrappers
* Design system primitives (`Card`, `CardHeader`, `CardContent`, `CardFooter`)
* Child component margins
* Grid and flex gaps
* Viewport-height behavior
* Safe-area compensation
* Sticky footer offsets

The objective is to locate the first layer introducing unnecessary spacing.

### Preserve Design System Integrity

Components such as:

* `Card`
* `CardHeader`
* `CardContent`
* `CardFooter`

should remain the default implementation unless there is a verified architectural reason to replace them.

Do not replace them simply to:

* remove padding
* reduce margins
* hide layout problems
* compensate for duplicate spacing

Doing so duplicates design-system behavior, reduces consistency, and increases long-term maintenance costs.

### Fix the Responsible Layer

Correct the layer that introduces redundant whitespace.

Typical root causes include:

* Duplicate wrapper components
* Nested cards
* Stacked margins
* Multiple bottom paddings
* Excessive grid or flex gaps
* Incorrect viewport-height usage (`min-h-screen`, `h-screen`, `flex-1`)
* Duplicate safe-area compensation
* Legacy layout containers

Removing the source preserves the integrity of reusable UI primitives.

### Acceptable Reasons to Replace a Primitive

Replacing or overriding a design system primitive is appropriate only when:

* The primitive cannot support a documented product requirement.
* An accessibility issue requires structural changes.
* The design system itself is being intentionally evolved.
* A verified performance concern justifies the change.
* The change is approved as part of a design-system update.

Spacing adjustments alone are not sufficient justification.

### Engineering Decision Order

When excessive whitespace is detected:

1. Verify the issue through inspection.
2. Identify the exact layer introducing the spacing.
3. Remove duplicate or unnecessary layout wrappers.
4. Eliminate cumulative spacing.
5. Preserve design system primitives whenever possible.
6. Override primitive styling only when the primitive itself is the verified root cause.

### Expected Outcome

Following this rule ensures:

* Consistent UI across the application.
* No duplicated layout logic.
* Reduced technical debt.
* Better long-term maintainability.
* Predictable spacing behavior.
* Strong adherence to the design system and SSOT architecture.

**Engineering Principle:** Fix the layer responsible for the problem—not the reusable component that correctly implements the design system.

---

## 16. UI/UX Engineering Rule: Layout Responsibility

### Principle

Every layout concern must have a single owner. Padding, spacing, sizing, scrolling, alignment, and viewport behavior should each be controlled by one layer only.

#### Ownership Matrix

| Concern                | Owner                         |
| ---------------------- | ----------------------------- |
| Page margins           | Page/Layout container         |
| Section spacing        | Section wrapper               |
| Card internal spacing  | Design system (`CardContent`) |
| Component spacing      | Component itself              |
| Grid/List spacing      | Grid/Flex `gap`               |
| Sticky footer offset   | Sticky footer container       |
| Safe-area compensation | Root mobile layout            |
| Viewport height        | Page layout only              |

No concern should have multiple owners.

### Audit Questions

For every spacing issue, verify:

* Which component owns this spacing?
* Is another layer also applying the same spacing?
* Is this spacing duplicated?
* Is this spacing compensating for another layout bug?
* Can the spacing be removed without breaking the layout hierarchy?

### Failure Conditions

Reject implementations that:

* Add padding to compensate for another component.
* Add margins to hide layout problems.
* Nest identical layout containers without purpose.
* Duplicate safe-area spacing.
* Stack multiple spacing utilities to achieve one visual result.
* Override design-system primitives when the issue originates elsewhere.

### Preferred Fix Order

1. Remove redundant wrapper components.
2. Eliminate duplicated spacing.
3. Consolidate ownership into a single layer.
4. Preserve design-system primitives.
5. Validate on:
   * Mobile
   * Tablet
   * Desktop
   * Large desktop
   * High viewport heights

### Engineering Principle

> **One layout concern → One owner.**

---

## 17. UI/UX Engineering Rule: Eliminate Redundant Layout Wrappers

### Principle

Every layout wrapper must have a unique responsibility.

A wrapper that does not introduce a distinct layout, accessibility, or behavioral concern should be removed.

More wrappers do not improve architecture—they increase DOM complexity, spacing conflicts, rendering cost, and maintenance overhead.

### Wrapper Audit

For every layout container, ask:

* Why does this wrapper exist?
* What responsibility does it own?
* Could its responsibility belong to its parent?
* Could its responsibility belong to its child?
* Does it exist only because another wrapper already exists?

If no clear responsibility exists, remove it.

### Valid Responsibilities

A wrapper should exist only if it provides one or more of the following:

* Page layout
* Responsive breakpoint behavior
* Grid or flex layout
* Accessibility semantics
* Scroll container
* Sticky positioning
* Animation boundary
* Error boundary
* Loading boundary
* Portal target
* Context provider
* Theme boundary

Anything else should be questioned.

### Invalid Wrappers

Remove wrappers that only:

* Add one margin
* Add one padding
* Center a single child already capable of self-alignment
* Wrap another identical layout
* Contain only one child with no additional responsibility
* Exist because of historical refactoring
* Duplicate spacing already owned elsewhere

### Nested Component Audit

Avoid structures like:

```text
Page
└── Container
    └── Section
        └── Wrapper
            └── Card
                └── CardContent
                    └── Wrapper
                        └── Content
```

Prefer:

```text
Page
└── Section
    └── Card
        └── CardContent
            └── Content
```

Every removed wrapper reduces complexity.

### DOM Depth Audit

For every screen:

* Audit nesting depth.
* Remove unnecessary intermediate containers.
* Keep the component tree as shallow as practical.

Large screens often suffer more from wrapper accumulation than from actual styling issues.

### Design System Integration

Never introduce wrappers to compensate for:

* Card padding
* Grid gaps
* Stack spacing
* Safe-area padding
* Responsive layout

Fix the owner instead.

### Failure Conditions

Reject implementations that:

* Nest identical layout components
* Wrap components without adding behavior
* Add wrappers only to solve spacing
* Introduce wrapper layers that duplicate existing layout responsibilities

### Expected Outcome

This rule results in:

* Smaller DOM trees
* Better rendering performance
* Cleaner component hierarchy
* Easier debugging
* Fewer spacing conflicts
* More predictable responsive behavior
* Stronger adherence to the design system

### Engineering Principle

> **Every wrapper must justify its existence. If it has no unique responsibility, remove it.**

---

## 18. UI/UX Engineering Rule: Content-Driven Layouts (Never Viewport-Driven)

### Principle

Layouts should be driven by content, not by available screen height.

Increasing the viewport height must never introduce additional empty space, stretch unrelated sections, or separate content that belongs together.

A larger screen should reveal more content—not create more whitespace.

### Core Rules

#### 1. Content Determines Height

Components should size themselves to their content by default.

Avoid using viewport height (`vh`, `dvh`, `min-h-screen`, `h-screen`) unless the page genuinely requires a full-screen experience.

#### 2. Group Related Content

Elements that belong together should remain visually grouped regardless of screen size.

Examples:

* Title + description
* Form fields
* Card header + content
* Profile information
* Dashboard widgets
* CTA + supporting text

Large monitors should never pull these apart.

#### 3. Viewport Height Is Not Spacing

Never use viewport height to simulate spacing.

Avoid patterns such as:

* `min-h-screen`
* `h-screen`
* `100vh`
* `100dvh`
* `justify-between`
* `space-between`

when their only purpose is distributing content vertically.

#### 4. Desktop Should Increase Visibility, Not Distance

On larger displays:

✔ Show more content.

✔ Increase usable width where appropriate.

✔ Improve readability.

Do **not**:

* stretch cards vertically
* stretch forms
* increase empty regions
* push actions toward the bottom

#### 5. Scroll Should Be Natural

Pages should scroll because there is more content—not because empty layout space was created.

### Audit Checklist

Verify:

* No large empty region appears when browser height increases.
* Cards remain content-sized.
* Forms remain compact.
* CTA buttons stay close to related fields.
* Lists don't end with excessive whitespace.
* Dashboards maintain information density.
* Empty state components don't stretch vertically.

### Common Root Causes

* `min-h-screen`
* `h-screen`
* `100vh`
* `flex-1`
* `justify-between`
* `place-content-between`
* nested `flex-grow`
* unnecessary wrapper layers
* duplicated bottom spacing

### Preferred Fix Order

1. Remove unnecessary viewport-height constraints.
2. Replace `justify-between` with explicit spacing (`gap` or margins) where appropriate.
3. Keep cards and forms content-sized.
4. Group related content visually.
5. Verify behavior across mobile, tablet, desktop, and tall displays.

### Failure Conditions

Reject implementations that:

* Grow whitespace as the browser height increases.
* Use viewport height to create visual balance.
* Stretch cards or forms without functional benefit.
* Separate related UI elements simply because more vertical space is available.

### Engineering Principle

> **Screen size should reveal more interface—not create more emptiness.**

---

## 19. UI/UX Engineering Rule: Layout Review Gate

### Principle

No UI change may be merged until it passes the Layout Review Gate.

Layout correctness is a quality requirement, not a visual preference.

### Mandatory Review Checklist

Every UI-related PR must verify the following.

#### Layout

* [ ] No oversized bottom padding.
* [ ] No unnecessary empty vertical space.
* [ ] No viewport-height driven whitespace.
* [ ] No duplicated spacing ownership.
* [ ] No redundant layout wrappers.

#### Design System

* [ ] Core primitives are preserved.
* [ ] No duplicated component styling.
* [ ] Spacing follows design tokens.
* [ ] No arbitrary padding or margin values without justification.

#### Responsive Behavior

Validate on:

* [ ] Mobile
* [ ] Tablet
* [ ] Desktop
* [ ] Large desktop
* [ ] Tall viewport

The layout should remain content-driven across all viewport sizes.

#### Component Hierarchy

* [ ] Every wrapper has a defined responsibility.
* [ ] DOM nesting is minimized.
* [ ] Layout ownership is clear.
* [ ] No duplicated containers.

#### Accessibility

* [ ] Logical focus order preserved.
* [ ] Keyboard navigation unaffected.
* [ ] No clipping or hidden interactive elements.
* [ ] Zoom (200%) remains usable.
* [ ] Safe-area behavior verified.

#### Performance

* [ ] No unnecessary DOM nodes introduced.
* [ ] No unnecessary re-renders caused by layout changes.
* [ ] No layout shifts introduced.
* [ ] No scroll performance regressions.

#### Verification Evidence

Every layout PR should include:

* Before screenshots (mobile + desktop)
* After screenshots (mobile + desktop)
* Tall viewport verification
* Responsive verification
* Root cause summary
* Files modified
* Confirmation that Rules 14–18 remain satisfied

### Automatic Rejection Criteria

Reject the PR if it:

* Removes design system primitives to solve spacing.
* Introduces wrapper components without a clear responsibility.
* Uses viewport height to create visual balance.
* Adds spacing to compensate for another spacing issue.
* Creates duplicate ownership of layout concerns.
* Increases empty scroll space.
* Introduces arbitrary spacing values outside the design system.

### Engineering Principle

> **A layout change is complete only when it is architecturally correct, visually consistent, responsive, accessible, and verified.**
---

## 18. Code Change Justification Protocol (Mandatory)

Before adding, modifying, or deleting any code, the AI must answer the following questions with evidence.

### 18.1 Why Are You Adding This Code?

For every new line of code, explain:

* What problem does this solve?
* Which requirement, bug, or issue requires this code?
* Why can't the existing implementation be reused?
* Which existing file or function was evaluated before deciding to add new code?
* What evidence proves a new implementation is necessary?

If these questions cannot be answered, **do not add the code**.

---

### 18.2 Why Are You Deleting This Code?

For every deleted line, explain:

* Why is this code no longer needed?
* Is it unused, dead, duplicate, obsolete, or replaced?
* How was this verified?
* Which files reference this code?
* Will deleting it affect any functionality?

If deletion cannot be justified with evidence, **do not delete the code**.

---

### 18.3 Why Are You Modifying This Code?

Before changing existing code, explain:

* What is wrong with the current implementation?
* What evidence proves it needs modification?
* Why is this the smallest safe change?
* Could the issue be solved without modifying this code?

---

### 18.4 What Engineering Basis Are You Using?

Every change must explicitly identify its basis from the following list:

* Existing repository architecture
* SSOT (Single Source of Truth)
* DRY (Don't Repeat Yourself)
* SOLID principles
* Performance optimization
* Security improvement
* Bug fix
* Accessibility
* Code simplification
* Dead code removal
* Duplicate elimination
* Approved design document
* Existing coding standard

**"No reason" or "seems better" is not acceptable.**

---

### 18.5 Why Not Reuse Existing Code?

Before writing new code, answer:

* Did you search for an existing implementation?
* Which files were inspected?
* Why can't the existing implementation be reused?
* Why is extraction or refactoring not sufficient?

If reusable code exists, **reuse it instead of creating new code**.

---

### 18.6 Change Impact Analysis

Before making changes, describe:

* Files affected
* Components affected
* APIs affected
* Database impact
* UI impact
* Performance impact
* Security impact
* Breaking changes (if any)

---

### 18.7 Line Change Accountability

For every commit, report:

```text
Lines Added:    +XX
Lines Deleted:  -YY
Net Change:     ±ZZ

Reason for Additions:   ...
Reason for Deletions:   ...
Reason for Modifications: ...
Evidence:               ...
```

---

### 18.8 Anti-Code-Bloat Rule

The AI must not add code simply to satisfy a request.

Before writing code, it must ask itself:

* Can this be solved by deleting code?
* Can this be solved by refactoring?
* Can this be solved by reusing existing code?
* Can this be solved by extracting shared logic?
* Can this be solved by configuration instead of new code?

**Preferred order of operations:**

1. Delete unnecessary code.
2. Reuse existing code.
3. Refactor existing code.
4. Extract shared code.
5. Add new code only as a last resort.

---

### 18.9 Evidence-Based Change Rule

Every code change must include evidence such as:

* Repository search results
* Call hierarchy
* Dependency analysis
* Duplicate analysis
* Usage analysis
* Type references
* Import graph
* Runtime verification (when applicable)

**Never make changes based on assumptions.**

---

### 18.10 Block Condition

The AI must stop and refuse to proceed if it cannot answer:

> **On what engineering basis am I adding, modifying, or deleting this code?**

If the answer is not supported by repository evidence, the change must not be made.

---

### Summary

This protocol shifts every code change from speculative editing to evidence-based engineering decisions, ensuring that every `+1` or `-1` line in a diff has a documented technical justification rooted in repository evidence.

---

## 19. Engineering Decision Challenge (Mandatory)

> **The AI is not a code generator. It is an engineering reviewer that writes code only after proving, with repository evidence, that the change is necessary, correct, minimal, and preferable to all simpler alternatives.**

Before writing, modifying, or deleting any code, the AI must pause and answer every question below using repository evidence. If any question cannot be answered with evidence, the change must not proceed.

---

### 19.1 Why Am I Changing This Code?

* What exact problem am I solving?
* Who requested this change?
* What evidence proves this problem exists?
* Can I reproduce or verify the problem?

**If there is no evidence, stop.**

---

### 19.2 On What Engineering Basis Am I Making This Change?

Every change must explicitly identify one or more of the following:

* Bug fix
* SSOT (Single Source of Truth)
* DRY (Don't Repeat Yourself)
* SOLID principles
* Performance optimization
* Security improvement
* Accessibility
* Architecture consistency
* Duplicate elimination
* Dead code removal
* Technical debt reduction
* Compliance with repository standards

**If none apply, stop.**

---

### 19.3 Why This Solution?

Before implementing, answer:

* Why is this the best solution?
* What alternatives were considered?
* Why were they rejected?
* Why is this the smallest safe change?

---

### 19.4 Why Not Delete Code Instead?

Before adding any code, verify:

* Can deleting obsolete code solve the issue?
* Can simplifying existing logic solve it?
* Can removing duplication solve it?

**If yes, prefer deletion over addition.**

---

### 19.5 Why Not Reuse Existing Code?

Repository-first policy. Before creating anything new, answer:

* Which files were searched?
* Which existing implementations were evaluated?
* Why can't they be reused?
* Why can't shared logic be extracted?

**Creating new code is the last option.**

---

### 19.6 Explain Every `+1` and `-1`

Every added, modified, or deleted line must have an explicit reason:

```text
+ Added because...

- Removed because...

~ Modified because...
```

**"No reason" is not acceptable.**

---

### 19.7 What Happens If I Do Nothing?

Before making any change, answer:

* What breaks if this code remains unchanged?
* Is the change necessary or merely desirable?
* Is the benefit measurable?

**If nothing important changes, reconsider making the edit.**

---

### 19.8 Could This Introduce New Problems?

Assess the risk of:

* Duplicate code
* Dead code
* Regression
* Performance degradation
* Security issues
* API breakage
* UI inconsistencies

Explain how each identified risk is mitigated.

---

### 19.9 What Evidence Supports This Decision?

Every change must cite repository evidence such as:

* Search results
* Call hierarchy
* Type references
* Import graph
* Dependency analysis
* Duplicate report
* Runtime verification
* Test results

**Assumptions are prohibited.**

---

### 19.10 Final Engineering Gate

Before proceeding with any change, the AI must be able to answer:

> **If a senior engineer reviewed this change tomorrow, could I defend every added, modified, and deleted line with repository evidence?**

**If the answer is No, the change must not proceed.**

---

### Enforcement Summary

This section operates as a pre-flight checklist. No code change — regardless of request urgency or apparent simplicity — may bypass this challenge. Every gate must pass before a single line is written, modified, or deleted.

---

## 20. Change Classification (Mandatory Risk Gate)

Before any modification, classify the change into one of the four levels below. The level determines which protocol gates apply. Misclassifying a higher-risk change as a lower level is a governance violation.

---

### Level 0 — No Code Change

**Examples:** Documentation, code comments, formatting, whitespace, README edits.

**Required:**
* One-sentence justification explaining what was corrected and why.

---

### Level 1 — Low Risk

**Examples:** Variable rename, typo fix, UI label text, log message, small CSS adjustment, minor copy change.

**Required:**
* Problem — what is being fixed and why.
* Engineering basis — which principle applies (§19.2).
* Evidence — repository proof the problem exists.
* Impact — confirm no functional, API, or accessibility change.

---

### Level 2 — Medium Risk

**Examples:** New component, refactor, hook extraction, utility changes, API modifications, business logic changes, shared package updates.

**Required:**
* Full Section 19 Engineering Decision Challenge.
* All §18 Code Change Justification questions.

---

### Level 3 — High Risk

**Examples:** Authentication, payments, database schema, RBAC, security controls, core architecture, shared packages (`packages/contracts`, `packages/ui`, `packages/core`).

**Required:**
* Full Section 19 Engineering Decision Challenge.
* Full §18 Code Change Justification.
* Duplicate audit — proof no parallel implementation exists or will be created.
* Dead code audit — proof no orphaned references remain after the change.
* Impact analysis — all affected files, components, APIs, and consumers documented.
* Test plan — how the change will be verified (unit, integration, E2E).
* Rollback plan — explicit steps to revert if the change causes a regression.
* Senior engineer gate (§19.10) — all lines defensible with repository evidence.

---

### Classification Integrity Rule

The AI must classify the change **before** searching the repository or writing any code. If mid-implementation the change grows in scope, the classification must be upgraded and the corresponding additional gates applied before continuing.

---

## 21. Burden of Proof Rule

The burden of proof belongs to the change, not to the reviewer.

Before any code is written, modified, or deleted, the AI must prove — with repository evidence — all five of the following:

1. **The problem exists.** Evidence: reproduction steps, error logs, failing tests, or an explicit user report.
2. **The proposed solution is correct.** Evidence: architecture review, analogous patterns in the codebase, or documented design decision.
3. **Simpler alternatives were rejected.** Evidence: alternatives listed, evaluated, and dismissed with reasoning.
4. **Repository evidence supports the decision.** Evidence: search results, call hierarchy, import graph, or type references.
5. **The change is the minimum necessary.** Evidence: no additional lines were added beyond what is required to solve the stated problem.

**If the AI cannot prove all five points, the repository must remain unchanged.**

This rule is not a suggestion. It is a hard gate applied before any edit — regardless of how obvious the change appears.

---

## 22. Stability Principle

Existing, correct, maintainable code has higher value than newly written code.

The AI must not modify code solely because:

* it prefers a different style or naming convention;
* another implementation looks cleaner or more elegant;
* it wants architectural symmetry across files;
* it wants to increase abstraction without a concrete requirement;
* it anticipates future requirements without current evidence.

### What "correct" and "maintainable" mean

Code is considered correct and maintainable if:

* It passes existing tests.
* It meets current accessibility and performance standards.
* It has no known bugs related to the task at hand.
* It does not violate an active governance rule.

If all four conditions are true, the code must not be modified unless a specific, measurable defect requires it.

### Stability Violation Examples

The following are prohibited without a filed, evidence-backed justification:

* Renaming a working function because the new name "reads better."
* Splitting a working component because it "feels too large."
* Adding an abstraction layer because the code "might grow."
* Restructuring a file because the layout "seems inconsistent."
* Replacing a working pattern because a newer pattern "is preferred."

### Engineering Principle

> **Code changes require demonstrable value — not preference, aesthetic judgment, or speculative future benefit.**

A change that makes code look different without making it measurably more correct, more performant, more accessible, or more secure is net-negative: it adds review cost, regression risk, and diff noise with no verified return.

---

## 🚨 Mobile Presentation Layer Dependency Rule (Mandatory)

### Applies To

All mobile application code in `apps/mobile`.

### Layering Rule

```text
Presentation (screens, components)
        ↓
Hooks (useSubmitAd, useListingDetails, useSearch, …)
        ↓
Application Services (PostAdService, ListingService, …)
        ↓
Repository Interfaces (IListingRepository, IImageUploadService, …)
        ↓
Infrastructure (ApiListingRepository, ApiImageUploadService, apiClient, …)
```

### Explicit Constraint

> A **presentation hook** may depend on application services, but **must never** import or instantiate a repository, infrastructure class, or `apiClient` directly.

Presentation hooks are defined as any hook living in `features/*/presentation/hooks/`.

### Prohibited Patterns

```ts
// ❌ PROHIBITED — hook reaching into infrastructure directly
import { apiClient } from '../../../infrastructure/api/apiClient';
const useSubmitAd = () => {
  const result = await apiClient.post('/v1/listings', ...);
};

// ❌ PROHIBITED — hook instantiating a repository
import { ApiListingRepository } from '../../application/ApiListingRepository';
const useSearch = () => {
  const repo = new ApiListingRepository();
};
```

### Required Pattern

```ts
// ✅ CORRECT — hook delegates to a service from the composition root
import { services } from '../../../../bootstrap';
const useSubmitAd = () => {
  const result = await services.postAdService.submit(draft, onPhaseChange);
};
```

### Control Flow Rule

> Application services must **not throw exceptions for expected failure conditions** (validation errors, upload failures, API errors). They must return a typed discriminated union (`SubmitResult`, etc.) instead.

Exceptions are reserved for truly unexpected conditions (programmer errors, missing required constructor arguments).

### State Machine Rule

> Hooks that orchestrate multi-stage async operations must expose a typed **status** string union rather than a single `isLoading` boolean.

This enables richer UI labels, retry logic, and analytics without architectural changes:

```ts
// ❌ Limited — binary state
isLoading: boolean

// ✅ Required — typed lifecycle
status: 'idle' | 'uploading' | 'creating' | 'success' | 'error'
```

### Navigation Ownership

> Navigation decisions (which screen to go to after a mutation) belong in **screen components**, not in hooks.

Hooks return typed results. Screens pattern-match on those results and call `navigationRef` or `useNavigation`.

```ts
// ❌ PROHIBITED — hook navigates
const submit = async () => {
  await service.submit(draft);
  navigationRef.current?.navigate(...); // belongs in PostAdScreen
};

// ✅ CORRECT — screen navigates based on typed result
const result = await submit();
if (result.success) {
  navigationRef.current?.reset({ ... });
}
```

### Validation Result Rule

> Validators must return **structured `ValidationResult` discriminated unions**, not raw booleans or thrown errors.

This enables field-level error highlighting without changing validators or services.

```ts
// ❌ Limited — boolean only
static canAdvanceFrom(step, draft): boolean

// ✅ Required — structured result
static validate(step, draft): ValidationResult
// Convenience wrapper (allowed)
static canAdvanceFrom(step, draft): boolean = validate(step, draft).valid
```

---
### Layer-by-Layer Dependency Direction Rule (Mandatory)

A layer may depend ONLY on the layer directly beneath it. Skipping layers is strictly prohibited.

```text
Presentation (Screens, Views, Presentation Components)
        ↓
Presentation Hooks
        ↓
Application Services
        ↓
Repository Interfaces
        ↓
Infrastructure (API clients, Database adapters, Storage drivers)
```

**Prohibited Layer Bypasses:**
- Screens/Views importing Repositories or Infrastructure directly.
- Presentation Hooks importing `apiClient`, Axios, or Infrastructure classes directly.
- Application Services importing React or UI components.
- Domain models importing Infrastructure/Network dependencies.
- Contracts importing Application or Infrastructure code.

---
