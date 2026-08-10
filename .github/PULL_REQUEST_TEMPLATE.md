## What does this PR do?
<!-- One paragraph max. Link to GitHub issue: Closes #N -->


## Type of change
- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `chore` — refactor / cleanup / tooling
- [ ] `perf` — performance improvement
- [ ] `docs` — documentation only


## Packages affected
- [ ] `@esparex/contracts`
- [ ] `@esparex/ui`
- [ ] `@esparex/core`
- [ ] `backend/api`
- [ ] `apps/web`
- [ ] `apps/admin`
- [ ] `apps/mobile`


## 1. Repository Discovery & SSOT Audit (Clean Code Skill)
<!-- Required per clean-code skill. Must prove search before implementation. -->

- [ ] **Phase 0 Search Executed**: Searched existing repository before creating code.
  - *Search Command / Query Used*: `git grep ...` or `grep -rn ...`
  - *Existing Files Evaluated*: (list existing components/hooks/services checked)
- [ ] **SSOT & Canonical Ownership Verified**: No duplicate logic, schema, or component introduced.
- [ ] **Single Responsibility**: Every new/modified file has one clear domain responsibility.


## 2. Code Quality & Discipline Statement (Code Quality Skill)
<!-- Required per code-quality skill. Enforces principal engineering standards. -->

- **New files introduced:** _N_
- **Existing files modified:** _N_
- **Files deleted:** _N_

### File Size & Modularization Check
- [ ] **Component Threshold**: All `.tsx` components are ≤250 lines (or oversized legacy files did not grow).
- [ ] **Hook Threshold**: All custom hooks are ≤200 lines.
- [ ] **Service Threshold**: All core/domain services are ≤300 lines.
- [ ] **Utility/Schema Threshold**: All utilities and DTO schemas are ≤150–200 lines.

### Type Safety & Security Audit
- [ ] **Zero Unsafe Type Assertions**: Zero `as unknown as` / chained assertions repository-wide (`npm run guard:type-casts`).
- [ ] **Zero Log Exposure**: No `console.log` or unhandled exceptions left in production paths.
- [ ] **Input Sanitization**: All API parameters sanitized & validated against `@esparex/contracts`.


## 3. Automated Quality Gate Checklist
<!-- All checks must pass locally before requesting review -->

- [ ] `npm run type-check` passes cleanly (0 errors across 9 workspaces)
- [ ] `npm run guard:pr-quality` passes locally (file size & discipline ratchet)
- [ ] `npm run guard:knip` passes locally (0 unused files, 0 unused dependencies)
- [ ] `npm run guard:type-casts` passes locally (within baseline count)
- [ ] `npm run guard:unused-imports` passes locally (0 unused imports in changed files)
- [ ] `npm run guard:duplicate-code` passes locally (JSCPD duplicate rate ≤ 0.12%)
- [ ] `npm run repo:gate` passes locally (Health Score: 100%)
- [ ] `npm test` passes with 100% green status


## 4. Accessibility & Mobile Compliance (UI Changes)
<!-- Skip with: N/A — no UI changes -->
- [ ] Keyboard navigation verified (Tab, Enter, Escape, Arrow keys)
- [ ] Focus rings visible & focus restoration preserved
- [ ] Hidden overlays/drawers use `inert` to prevent keyboard traps
- [ ] Screen reader compatibility verified (aria-labels, semantic HTML)
- [ ] Single-Instance Responsive Architecture maintained (no `Desktop*` vs `Mobile*` split)


## 5. Post-Implementation Cleanup Ledger
- [ ] Dead/orphan code removed: (list deleted files/exports if any)
- [ ] Documentation / OpenAPI specs updated if contract modified
