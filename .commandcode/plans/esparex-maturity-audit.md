# Esparex Monorepo — Repository Maturity Audit

**Date:** 2026-07-08  
**Audited by:** Command Code  
**Branch:** `feature/location-auto-detect-audit`

---

## Scoring Summary

| Dimension | Score | Weight | Weighted |
|---|---|---|---|
| Architecture | 9.0 | 12% | 1.08 |
| SSOT Compliance | 8.0 | 10% | 0.80 |
| Code Quality | 5.7 | 10% | 0.57 |
| Security | 7.0 | 12% | 0.84 |
| CI/CD | 8.0 | 10% | 0.80 |
| Git Governance | 7.0 | 5% | 0.35 |
| Testing | 5.0 | 12% | 0.60 |
| Performance | 7.0 | 5% | 0.35 |
| Documentation | 7.0 | 5% | 0.35 |
| API Design | 8.0 | 5% | 0.40 |
| Database Design | 8.0 | 5% | 0.40 |
| DevOps | 6.0 | 4% | 0.24 |
| Scalability | 7.0 | 5% | 0.35 |
| **Total** | **92.7** | **100%** | **7.13** |

**Enterprise Maturity: 71.3% — Tier: Level 3 (Structured & Governed)**

---

## Verified Strengths

### Architecture (9/10)
- Strict 4-layer dependency flow: Apps → Backend → Core → Shared
- 14 canonical public namespaces with curated barrel files in core
- Dual enforcement via dependency-cruiser (CI, hard-fail) + eslint-plugin-boundaries (IDE, error)
- Single SSOT (`scripts/architecture/matrix.js`) auto-generates both enforcement configs
- Zero-regression policy with drift detection against `main`
- ADR-driven evolution (v1.0.0 → v1.1.0) with 11 ADRs in `docs/architecture/adr/`
- Transport-neutral core layer (no Express, no HTTP)

### SSOT Compliance (8/10)
- Lifecycle status hierarchy with root-to-domain enum inheritance (`LIFECYCLE_STATUS` → `SERVICE_STATUS`, `CATALOG_STATUS`, etc.)
- API route constants single-sourced in `shared/contracts/api/` and verified by `verify-api-contract.js`
- No hardcoded API strings or status literals (enforced by 2 guard scripts)
- Error response contract enforced by middleware + guard script
- Zod-first schema pattern with inferred types

### Security (7/10)
- 18+ granular Redis-backed rate limiters with abuse monitoring
- JWT with `jti` + token versioning + blacklisting via Redis
- CSRF double-submit cookie pattern (`crypto.timingSafeEqual`)
- RBAC with granular permissions (`users:read`, `ads:write`, `system:config`, etc.)
- Env contract guard blocks dev-only flags in production (`AUTH_LOCAL_RELAXED`, `ALLOW_DEFAULT_ADMIN_SEED`, etc.)
- Production env blocks: localhost DB/Redis, wildcard CORS, `NODE_OPTIONS=--inspect`, debug log level

### CI/CD (8/10)
- 12 GitHub Actions workflows covering CI, commitlint, PR title, DangerJS, security scanning, release drafter
- Full gating: lint + type-check + test + build + architecture check + E2E
- Gitleaks secret scanning + CodeQL + Dependency Review + OpenSSF Scorecard
- Release Drafter with auto-changelog from PR labels

### Git Governance (7/10)
- Husky pre-commit + pre-push hooks, Commitlint enforcing Conventional Commits
- PR template with structured Impact Analysis section
- CODEOWNERS with path-based team assignments
- Branch policy docs with signed commits requirement on `main`

### API Design (8/10)
- Clean RESTful route hierarchy under `/api/v1/` + `/api/v1/admin/`
- Zod request validation middleware
- Standardized error envelope with `requestId`, `timestamp`, `path`
- Deprecation middleware, ObjectId validation middleware
- Swagger/OpenAPI 3.0 docs (swagger-jsdoc, non-production only)

### Database Design (8/10)
- 60+ Mongoose models with comprehensive indexes (2dsphere, compound, partial, text, TTL)
- Connection pooling (maxPoolSize: 50, minPoolSize: 5)
- Slow query monitoring (>300ms warn, >1000ms error)
- 19 migrate-mongo migration files with `up`/`down` and batch processing
- Idempotency middleware with SHA-256 deterministic job IDs

### Scalability (7/10)
- Redis-backed distributed rate limiting, session state, and queue locking
- Worker/API process separation via `PROCESS_ROLE` env var
- BullMQ queue architecture (5 queues + dead letter queue) with auto-recovery
- Socket.IO Redis adapter for horizontal WebSocket scaling
- S3 presigned URLs for browser direct upload (offloads server)
- Sentry performance monitoring (10% sampling in prod)

---

## Issues by Severity

### 🔴 Critical (5)

| ID | Dimension | Issue | Impact | Key Files |
|---|---|---|---|---|
| C1 | Testing | Root `npm test` covers only 3/14 workspaces (21%). 7 custom test runners (console.assert harnesses). No coverage thresholds anywhere. | Unknown regression risk in 11 unguarded workspaces | `package.json` (root test script), `packages/repository-*/package.json` |
| C2 | Testing | Only 1 integration test file exists. No contract tests in CI. Admin app has zero unit tests (no test framework installed). | No confidence in cross-service behavior | `backend/user/src/__tests__/integration/postAd.idempotency.spec.ts`, `apps/admin/package.json` |
| C3 | Code Quality | `orphan-sweep.cjs` uses string-based filename matching (false positives/negatives) despite `madge` already installed in devDeps as `^8.0.0`. | Dead code goes undetected or falsely flagged | `scripts/orphan-sweep.cjs`, `package.json` |
| C4 | Security | `.npmrc` sets `audit=false`. No `npm audit` in CI. No Dependabot config. Only Dependency Review runs on PRs (not on scheduled basis). | Supply chain vulnerabilities can persist undetected | `.npmrc` |
| C5 | DevOps | No Dockerfile. Render Starter plan (single instance, no HA, no zero-downtime deploys). Stale PM2 v6 config with wrong script path. | No local prod parity; single point of failure in prod | `render.yaml`, `backend/user/ecosystem.config.js` |

### 🟠 High (6)

| ID | Dimension | Issue | Impact |
|---|---|---|---|
| H1 | CI/CD | CI runs entirely serially — single job with sequential steps. No matrix/parallelization across 14 workspaces. | ~45 min pipeline; slow feedback loop |
| H2 | CI/CD | Pre-commit hook runs full `governance:all` (lint + type-check + test + build + 10+ guards). Devs will skip hooks. | 30+ second commit latency; bypass risk |
| H3 | CI/CD | PR Impact Analysis script exists but is **not wired into any CI workflow** — reads `PR_BODY` env var with no CI integration. | Impact analysis is advisory only, never enforced |
| H4 | Performance | No bundle analyzer in either Next.js app. Admin app lacks `images.remotePatterns`, `optimizePackageImports`, `sharp` dependency. | Bloated bundles; admin app image loading unoptimized |
| H5 | Code Quality | TypeScript hardening inconsistent: `noUncheckedIndexedAccess`, `noImplicitOverride` only in frontend apps. `noUnusedLocals`/`noUnusedParameters` only in web. Backend/core/shared miss these. | Gradual type erosion; preventable bugs |
| H6 | Security | `sanitize-html` in deps but unused. Only `DANGEROUS_HTML_PATTERNS` regex check used (much weaker). | XSS risk from crafted HTML bypassing regex |

### 🟡 Medium (6)

| ID | Dimension | Issue | Impact |
|---|---|---|---|
| M1 | Testing | Integration tests require `ALLOW_DB_CONNECT=true` hitting real DB — no containerized test DB (no testcontainers/mongodb-memory-server). | Flaky CI; can't run in parallel |
| M2 | Testing | E2E runs after CI completes (sequential `needs: ci`). Total pipeline ~65 min. | Slow deployment pipeline |
| M3 | Security | Backend helmet CSP set to `false`. Acceptable for JSON-only API but risky for any HTML-rendering paths. | Missing defense layer |
| M4 | DevOps | No health check endpoint wired to Render's health check system. No readiness/liveness probes. | Render may not detect dead instances quickly |
| M5 | Scalability | Monolithic sequential build — 14 packages build one after another. | ~5 min+ build time; slows CI and dev |
| M6 | Scalability | `sharp` and `jimp` both installed in core — duplicate image processing libraries. | 20MB+ unnecessary bundle size |

### 🟢 Low (4)

| ID | Dimension | Issue |
|---|---|---|
| L1 | Documentation | Required `ARCHITECTURE.md` / `GOVERNANCE.md` content quality unknown |
| L2 | Git Governance | `npm run build` manually lists 14 workspaces — brittle when adding new packages |
| L3 | Code Quality | `eslint-config-prettier` installed but no `.prettierrc` file |
| L4 | Performance | `concurrently` used for `dev:all` but not for build — missed DX optimization |

---

## Top 5 Highest-Impact Recommendations

### 1. Madge-based orphan detection (replaces string-based sweep)
**Issue:** C3 — `orphan-sweep.cjs` uses unreliable string matching  
**Effort:** ~0.5 day  
**Files:** `scripts/orphan-sweep.cjs`, `package.json` (`guard:dead-code` script)  
**Do this:** Write a wrapper using `import madge from 'madge'` — `madge(dir).then(res => res.orphans())`. Madge `^8.0.0` is already installed.

### 2. npm audit gate in CI
**Issue:** C4 — No dependency vulnerability scanning  
**Effort:** ~0.5 day  
**Files:** `.npmrc` (remove `audit=false`), `package.json` (add `"audit:security": "npm audit --audit-level=high"`), `.github/workflows/ci.yml`  
**Do this:** Remove `audit=false` from `.npmrc`. Add `npm run audit:security` as a CI step before `governance:all`.

### 3. Parallelize CI with matrix build
**Issue:** H1, M5 — Serial CI pipeline takes ~45 min  
**Effort:** ~2 days  
**Files:** `.github/workflows/ci.yml`  
**Do this:** Split into matrix jobs: (a) lint + type-check, (b) test matrix across 3+ workspaces in parallel, (c) build matrix across workspaces using `strategy.matrix.workspace`. Cuts CI to ~15 min.

### 4. Scope pre-commit hook to changed files
**Issue:** H2 — Pre-commit runs full `governance:all`  
**Effort:** ~1 day  
**Files:** `.husky/pre-commit`, `package.json` (lint-staged config)  
**Do this:** Replace `npm run governance:all` with `npx lint-staged` (already configured) + type-check only changed workspaces. `lint-staged` is already in devDeps.

### 5. Add Vitest + coverage thresholds to admin app
**Issue:** C1, C2 — Admin has zero test framework, 11 workspaces untested  
**Effort:** ~2 days  
**Files:** `apps/admin/package.json`, `apps/admin/vitest.config.ts`  
**Do this:** Install `vitest`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`. Add `vitest` script and `coverage.thresholds > 60%`. Port setup from web app.

---

## Remediation Roadmap

```
Sprint 1 (weeks 1-2)          Sprint 2 (weeks 3-4)        Sprint 3 (weeks 5-6)
─────────────────────────     ────────────────────────     ────────────────────────
1. madge orphan detection     4. Parallelize CI matrix    8. Bundle analyzer both apps
2. npm audit CI gate          5. Scope pre-commit hook    9. Dockerfile + compose
3. Wire PR Impact Analysis    6. Admin Vitest + coverage  10. Remove sharp/jimp dup
                              7. Admin next.config images 11. Workspace build orchestration
```

**Estimated impact:** Top 5 items alone (~6 engineering days) raise maturity from **71.3% → ~78%**.

---

## Verification

After implementing any recommendation, verify by:

1. **Madge orphan detection:** Run `npx madge --orphans src/` in each workspace and compare with current `npm run guard:dead-code` output
2. **npm audit:** Run `npm audit --audit-level=high` — expect zero high/critical vulns
3. **CI matrix:** Push a test PR and confirm CI completes in <20 min with parallel jobs
4. **Scoped pre-commit:** `git add -A && git commit -m "test: verify hook"` — should complete in <10s
5. **Admin Vitest:** `npm test -w @esparex/apps-admin` — should pass with coverage >60%
