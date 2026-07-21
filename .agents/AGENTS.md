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