# CI/CD SSOT

This is the Tier 1 Canonical Single Source of Truth (SSOT) defining all automated integration workflows, repository quality gates, git discipline rules, and production deployment protections. Every contribution must pass all checks defined here before being merged.

---

## 1. Automated Integration Pipelines (GitHub Actions)

The repository runs a deterministic two-stage CI pipeline defined in `.github/workflows/ci.yml`:

```
[PR Target: main]
       │
       ▼
┌──────────────┐
│    Job 1:    │
│  ci (45m)    │ ── (Validate Env, Run governance:all, Verify backend build)
└──────┬───────┘
       │
       ▼ (Pass)
┌──────────────┐
│    Job 2:    │
│ e2e (20m)    │ ── (Build apps-web, Start server, Run serial Playwright E2E)
└──────────────┘
```

### 1.1 Job 1: Lint, Test, and Build Monorepo (`ci`)
This job operates synchronously and executes the following steps in order:
1. **Dependency Installation**: Runs `HUSKY=0 npm ci` to ensure locked reproducible packages.
2. **Environment Validation**: Runs `npm run guard:env-contracts` to check all configuration schemas.
3. **Core Governance Validation**: Runs `npm run governance:all` (linting, typechecking, tests, code duplication, and custom governance guards).
4. **Backend Verification**: Asserts that `backend/user/dist/index.js` builds successfully.

### 1.2 Job 2: Playwright E2E Listing Edit Suite (`e2e-listing-edit`)
This job is gated on Job 1 and executes Playwright integration checks:
- **Parallelism Protection**: Executes with `workers: 1` in CI to eliminate CPU contention and flake, and `workers: 4` locally for developer velocity.
- **Production Build**: Builds `@esparex/apps-web` using Next.js production compiler and boots the server on port `3000`.
- **Hydration Sync**: Intercepts all database queries with mock routes to guarantee zero dependency on a live backend database.

---

## 2. Local Git Hooks & Workspace Quality Gates

Local developer workflows are guarded strictly by Husky git hooks residing in the `.husky/` directory:

- **Pre-Commit Hook (`.husky/pre-commit`)**: Executes `npm run governance:all` locally before any commit is written, asserting strict format, lint, type safety, and test compliance.
- **Pre-Push Hook (`.husky/pre-push`)**: Serves as a redundant check to execute full monorepo builds and validations before code leaves the local machine.

### 2.1 Quality Gate Execution Hierarchy
All quality gates are programmatically executed in the `npm run governance:all` target. The execution hierarchy is:

| Guard Command | Target Script | Purpose / Enforcement Rule |
| :--- | :--- | :--- |
| `npm run docs:lint` | `check-doc-duplicates.js` | Authoritative validation of registration, tiers, and ownership in `MASTER_DOCUMENT_REGISTRY.md` |
| `npm run guard:naming` | `enforce-file-naming-conventions.js` | Enforces `camelCase` for scripts/functions, `PascalCase` for React components |
| `npm run guard:objectid` | `enforce-objectid-validation.js` | Enforces strict validation of all database ObjectIds |
| `npm run guard:platform-governance` | `guard-platform-governance.js` | Blocks unauthorized JS database mutations, blocks duplicate service workers |
| `npm run guard:ai-governance` | `enforce-ai-governance-ssot.js` | Restricts prompt/IDE settings from competing with repository SSOT files |
| `npm run guard:duplicate-code` | `jscpd` | Flags and blocks copy-paste code duplicates |
| `npm run guard:dead-code` | `orphan-sweep.cjs` | Performs cleanups on unused files |

---

## 3. Production Environments & Infrastructure Mappings

The Esparex platform is distributed across three authoritative hosting platforms:

### 3.1 Backend User API (Render Hosting)
- **Service Name**: `esparex-api` (Web Service)
- **Deployment Spec**: Declared in `render.yaml`. Builds dynamically on commits to `main`.
- **Build Target**: `HUSKY=0 npm ci && npm run build -w @esparex/shared && npm run build -w @esparex/core && npm run build -w @esparex/backend-user`
- **Execution Target**: PM2 cluster runner configured via `ecosystem.config.js`.
- **Environment Safety**: Timezones and overrides are checked in `guard-env-contracts.js`. Timezone `TZ` must be declared singular.

### 3.2 Frontend Admin and Web Portals (Vercel Hosting)
- **Vercel Web App**: Compiles `@esparex/apps-web` statically to `.next` output directory configured in `apps/web/vercel.json`. `NEXT_PUBLIC_API_URL` is set to `https://api.esparex.in/api/v1`.
- **Vercel Admin App**: Compiles `@esparex/apps-admin` to `.next` configured in `apps/admin/vercel.json`.

### 3.3 Hybrid Mobile App (Capacitor Webview Wrapper)
- **App Shell**: The mobile app (located in `apps/mobile`) operates as a native shell pointing to the authoritative production domain.
- **Config Sync**: `apps/mobile/capacitor.config.ts` reads the variable `CAPACITOR_SERVER_URL` (defaulting to `https://esparex.in`) and uses Capacitor Cookies to session-sync authentication flags.

---

## 4. Git Branching & PR Protections

### 4.1 Branch Naming Conventions
Developers must scope work to a single purpose and name branches as follows:
- `fix/<module>-<short-description>` (e.g. `fix/auth-cookie-refresh`)
- `feat/<module>-<short-description>` (e.g. `feat/spotlight-slots`)
- `refactor/<module>-<short-description>` (e.g. `refactor/geojson-point`)
- `docs/<topic>` (e.g. `docs/consolidate-ssots`)

### 4.2 PR Gate Requirements
- **No Direct Push**: Direct commits to the `main` branch are disabled. All changes must pass through a Pull Request.
- **Scope Restriction**: Unrelated changes or refactors mixed with feature/bug code are blocked.
- **Mandatory Impact Analysis**: Every PR must contain a `## Impact Analysis` header documenting files affected, potential regression areas, and verification commands executed.

---

## 5. Feature Flag & Rollout Policy

All new architectural changes or major integrations must follow a safe rollout cycle:
1. **Disabled Default**: Roll out with code gated behind a system configuration flag set to `false` (e.g. `ENABLE_ATLAS_CATALOG_SEARCH=false`).
2. **Resource Provisioning**: Create backend search indexes or S3 credentials in production.
3. **Parity Validation**: Validate baseline operational parity between legacy and new codes.
4. **Activation**: Toggle the environment variable config to `true` to enable.
