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

### 11.1 Engineering Principles
1. **Test Isolation:** Frontend components and tests must be decoupled from running database or backend dependencies. Mocks should be utilized for UI regression testing.
2. **Explicit Dependency Inversion:** Components must rely on interface abstractions (e.g., `TelemetryProvider`) rather than direct implementation bindings.
3. **No Test Logic in Production Code:** Production paths must remain free of E2E-specific conditionals (e.g., no raw checks for `window.navigator.webdriver` in business controllers).
4. **Contract-First Development:** Shared types in `packages/contracts` serve as the Single Source of Truth (SSOT). Backend validation and frontend E2E mocks must implement these types directly.

### 11.2 Change Classifications
Every change must be classified before implementation to trigger the relevant checklists:
- **API Contract:** Payload schemas, query validations, route paths, HTTP methods, DTOs.
- **Database & Cache:** Database schemas, validation rules, indexing, Redis key policies.
- **Authentication & AuthZ:** Middleware, guards, session cookie flags, token validation.
- **Environment & Build:** Env variables, configuration schemas, Docker setups, build variables.
- **UI & UX Flow:** Dom structure, page selectors, form controls, styling, accessibility.
- **Telemetry & Analytics:** Tracking providers, location loggers, event triggers.

### 11.3 Pre-Implementation Decision Gate
Before starting implementation, the author must document answers to the following:
- What problem are we solving? (Core motivation).
- Is this the correct architectural solution? (Compare at least one alternative).
- Does it affect backwards compatibility? (Will this break external clients or mobile app versions?).
- What are the risks? (Analyze concurrency, performance, security, and integration vulnerabilities).
- Is there a simpler way? (Enforce simplicity).

### 11.4 Dependency Checklists
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

### 11.5 Telemetry & Endpoint Class Alignment
- [ ] Telemetry calls must use the `TelemetryProvider` abstraction.
- [ ] No telemetry requests should be sent to the network layer during automated E2E runs (must be handled by the `NullTelemetryProvider`).
- [ ] Next.js rewrites must be configured to fail fast (404 fallback) for unmocked routes rather than logging proxy TCP connection timeouts to console logs.

### 11.6 Test Run Proxy Isolation Rule
Playwright configurations must enforce strict E2E routing. Any request matching `/api/v1/**` that is not registered with an active mock must be intercepted and rejected with a mock `404` or `500` error directly at the browser layer, avoiding Node-level socket leaks and proxy socket warnings.

### 11.7 Ownership Matrix
To prevent the "someone else will update it" assumption, downstream dependencies must be assigned to owners:
- **Shared Contracts:** Platform Architect / Core Backend Team
- **API Endpoints & Controllers:** Backend Team / Security Reviewer
- **Frontend Clients & Hooks:** Web Team / Frontend QA
- **E2E Test Mocks & Specs:** Frontend QA / Web Team
- **CI/CD Pipelines & DevOps:** DevOps Team / Platform Architect

### 11.8 Evidence Gates
For every pull request, the author must provide:
1. What changed?
2. Where was it updated?
3. How was it verified? (Provide E2E test runs, local build status, or screenshots).

---