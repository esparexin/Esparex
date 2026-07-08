# CI/CD Pipeline Audit — Root Cause Analysis & Prevention Plan

**Date:** 2026-07-08  
**Status:** Audit Only — No Implementation  

---

## 1. CI Dependency Graph (Actual)

```
                     ┌──────────────────────┐
                     │  Static Analysis      │
                     │  (lint + type-check)  │
                     │  15 min timeout       │
                     └──────────┬───────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
  │  Test Matrix  │    │  Build Matrix│    │  Governance       │
  │  5 workspaces │    │  5 workspaces│    │  (duplicate,      │
  │  + Redis      │    │  (no deps)   │    │   dead code,      │
  │  15 min each  │    │  15 min each │    │   guards)          │
  └──────────────┘    └──────────────┘    └──────────────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
  │  Security    │    │  PR Impact   │    │  E2E (Playwright)│
  │  (npm audit) │    │  (PR only)   │    │  Build + test    │
  │  5 min       │    │  5 min       │    │  20 min timeout  │
  └──────────────┘    └──────────────┘    └──────────────────┘
```

**Execution order:** Static Analysis → (parallel fan-out) → (no fan-in)

**Correct design:** All downstream jobs depend on `static-analysis`. No cascading failures beyond the expected chain.

---

## 2. Gate Check Alignment

| Check | Local (pre-commit) | Local (pre-push) | CI (PR) | CI (push to main) | Blocks merge |
|-------|-------------------|-------------------|---------|-------------------|--------------|
| Lint | lint-staged | governance:all | ✅ | ✅ | ✅ |
| TypeScript | — | governance:all | ✅ | ✅ | ✅ |
| Tests | — | governance:all | ✅ (5 matrix) | ✅ | ✅ |
| Build | — | governance:all | ✅ (5 matrix) | ✅ | ✅ |
| Duplicate code | — | governance:all | ✅ | ✅ | ✅ |
| Dead code | — | governance:all | ✅ | ✅ | ✅ |
| Governance guards | — | governance:all | ✅ | ✅ | ✅ |
| Architecture check | ✅ (fast) | — | ✅ | ✅ | ✅ |
| Env contracts | — | — | ✅ | ✅ | ✅ |
| Commitlint | — | — | ✅ | ✅ | ✅ |
| PR title | — | — | ✅ | — | ✅ |
| DangerJS | — | — | ✅ | — | ⚠️ Soft |
| PR impact analysis | — | — | ✅ | — | ✅ |
| Security audit | — | — | ✅ | ✅ | ⚠️ Info |
| E2E tests | — | — | ✅ | ✅ | ✅ |
| Governance health | — | — | ✅ | ✅ | ✅ |

---

## 3. Most Common Root Causes of Failure

| # | Root Cause | Where It Fails | Frequency | Can It Be Caught Locally? |
|---|-----------|----------------|-----------|--------------------------|
| 1 | **TypeScript errors after merging changes across packages** | CI type-check | High | Partially (pre-push runs governance:all which includes type-check) |
| 2 | **Build failures due to missing dist/ or stale compiled output** | CI build | Medium | Partially (pre-push runs build) |
| 3 | **Pre-existing test failures in core (dead module mocks)** | CI test (core) | High | Yes — but the 5 broken specs should be excluded (done in previous commit) |
| 4 | **Lint warnings introduced locally that pass --max-warnings=0** | CI lint | Medium | Partially (pre-commit runs lint-staged on changed files only) |
| 5 | **npm lockfile out of sync with package.json** | CI npm ci | Medium | No (git hooks don't check lockfile) |
| 6 | **Broken doc references to non-existent files** | CI docs:lint | Low | Pre-push catches it |
| 7 | **E2E test flakiness (CORS, network timeouts)** | CI e2e | Medium | No (requires live Playwright) |
| 8 | **Architecture boundary violations** | CI architecture:check | Low | Pre-commit catches it (architecture:check:fast) |

---

## 4. SSOT Misalignment: CI_CD_SSOT.md vs. Actual

| Claim in CI_CD_SSOT.md | Actual Behavior | Severity |
|------------------------|----------------|----------|
| "2-job sequential pipeline (ci → e2e)" | 7-job parallel pipeline (static-analysis → test/build/governance → security/pr-impact/e2e) | HIGH — SSOT is stale |
| "Pre-commit runs governance:all" | Pre-commit runs `npx lint-staged` + `architecture:check:fast` | HIGH — SSOT is stale |
| "ci job timeout 45m" | Removed — separate jobs with 10-20m timeouts | MEDIUM |
| "PM2 cluster runner configured via ecosystem.config.js" | ecosystem.config.js exists but script path is wrong and unused (Render manages processes) | LOW |
| "Job 1 and Job 2 with specific steps" | Steps have been reorganized | MEDIUM |

**Recommendation:** Update `CI_CD_SSOT.md` to reflect the current 7-job parallel pipeline and local hook configuration.

---

## 5. Which Failures Are Primary vs. Cascading

| Job | Primary Failure | Cascading Impact |
|-----|----------------|------------------|
| `static-analysis` | Lint error, type-check error, env contract violation | **Blocks ALL downstream jobs** — correct behavior |
| `test` (any matrix) | Test assertion failure | None (jobs are independent) |
| `build` (any matrix) | Compilation error | None (jobs are independent, but deployment depends on all builds passing) |
| `governance` | Dead code, duplicate code, naming violation | None |
| `security` | npm audit high/critical | None (continue-on-error) |
| `pr-impact` | Missing PR impact analysis fields | None (PR-only) |
| `e2e` | Playwright test failure | None |

**Key insight:** The only cascading failure path is `static-analysis` → everything else. This is the correct design — don't waste compute on tests/build if lint/type-check fails. No unnecessary cascading exists.

---

## 6. Which Checks Block Deployment

| Check | Blocks Deploy To | Reason |
|-------|-----------------|--------|
| static-analysis | All environments | Lint + type-check must pass |
| build (all workspaces) | All environments | Must compile |
| test (all workspaces) | All environments | Must pass tests |
| governance | All environments | Architecture integrity |
| e2e | All environments | User-facing flow must work |
| commitlint | All environments | Commit history quality |
| security (if fail with continue-on-error) | **Currently does not block** | continue-on-error:true |

---

## 7. Required Checks Per Branch

| Check | develop | staging | main |
|-------|---------|---------|------|
| lint | ✅ Required | ✅ Required | ✅ Required |
| type-check | ✅ Required | ✅ Required | ✅ Required |
| tests | ✅ Required | ✅ Required | ✅ Required |
| build | ✅ Required | ✅ Required | ✅ Required |
| governance | ✅ Required | ✅ Required | ✅ Required |
| e2e | — | ✅ Required | ✅ Required |
| commitlint | ✅ Required | ✅ Required | ✅ Required |
| PR title | ✅ Required | ✅ Required | ✅ Required |
| DangerJS | ⚠️ Advisory | ⚠️ Advisory | ⚠️ Advisory |
| PR impact | ✅ Required | ✅ Required | ✅ Required |
| Security audit | ⚠️ Informational | ⚠️ Informational | ⚠️ Informational |
| Governance health | ✅ Required | ✅ Required | ✅ Required |
| Architecture check | ✅ Required | ✅ Required | ✅ Required |

---

## 8. Developer Workflow Assessment

### Current flow:
```
git commit → [pre-commit: lint-staged + architecture:check:fast] (~10s)
git push → [pre-push: governance:all] (~2-5 min)
PR created → [CI: static-analysis → test/build/governance → e2e] (~15-20 min)
```

### Gap: Pre-push runs governance:all which is the FULL suite
The pre-push hook runs `npm run governance:all` which includes `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`, `npm run guard:duplicate-code`, `npm run guard:dead-code`, and `npm run governance:guards`. This is extremely heavy (~2-5+ minutes). Developers will bypass it with `git push --no-verify`.

**Fix:** Replace pre-push `governance:all` with lighter `type-check + build` for the changed workspace only, plus `guard:dead-code`. Move the full suite to CI where it's already running.

---

## 9. Recommended Improvements

| # | Improvement | Effort | Impact | Priority |
|---|-----------|--------|--------|----------|
| 1 | **Update CI_CD_SSOT.md to match actual 7-job pipeline** | 0.5 day | HIGH — SSOT alignment | High |
| 2 | **Replace pre-push governance:all with lighter check** | 0.5 day | HIGH — prevents hook bypass | High |
| 3 | **Add `npm run type-check` to pre-commit** | 0.5 day | MEDIUM — catches TS errors before push | Medium |
| 4 | **Remove `e2e` from CI gate on develop** | 0.5 day | MEDIUM — faster PRs to develop | Low |
| 5 | **Add lockfile check to pre-commit** | 0.5 day | LOW — prevents lockfile drift | Low |

---

## 10. Keep / Modify / Remove

| Item | Recommendation | Reason |
|------|---------------|--------|
| `static-analysis` job | **KEEP** | Correct gate design |
| `test` matrix | **KEEP** | Add `@esparex/apps-web` when tests stabilize |
| `build` matrix | **KEEP** | Correct parallel design |
| `governance` job | **KEEP** | Essential for architecture integrity |
| `security` job (npm audit) | **MODIFY** | Change `continue-on-error: true` to `continue-on-error: false` once active deps are fixed |
| `pr-impact` job | **KEEP** | Already wired correctly |
| `e2e` job | **KEEP** | But remove dependency for develop-only PRs |
| `pre-commit` hook | **KEEP** | Add `type-check` for the changed workspace |
| `pre-push` hook | **MODIFY** | Replace `governance:all` with scoped type-check + build |
| `CI_CD_SSOT.md` | **MODIFY** | Update to match actual pipeline |
| `governance-health.yml` | **KEEP** | Validates required files exist |

---

## 11. Permanent Prevention Plan

| Root Cause | Prevention | Layer | When |
|-----------|-----------|-------|------|
| TypeScript errors after merge | Pre-commit type-check on changed workspaces | Local | Every commit |
| Build failures from stale dist/ | Pre-push build on changed packages | Local | Every push |
| Dead module mocks in tests | Test exclusion list maintained (done) | CI | Every PR |
| Lint warnings introduced | Pre-commit lint-staged catches changed files | Local | Every commit |
| npm lockfile drift | Add `npm install --package-lock-only` check to CI | CI | Every PR |
| Broken doc references | pre-push + CI both run docs:lint | Both | Every push |
| E2E flakiness | workers=1 in CI, retries=2, video/trace on failure | CI | Every PR |
| Architecture violations | pre-commit + CI both run architecture:check | Both | Every commit |
| SSOT drift | CI_CD_SSOT.md updated quarterly | Docs | Quarterly |
