# Esparex Admin System

Esparex is an npm workspaces monorepo with the following structure:

### 📦 Workspaces

- **`@esparex/apps-admin`** (`apps/admin`): Admin dashboard UI (Next.js)
- **`@esparex/apps-web`** (`apps/web`): User-facing web application (Next.js)
- **`@esparex/backend-api`** (`backend/api`): Unified API services (user + admin namespaces)
- **`@esparex/core`** (`core`): Business logic, domain models, and DB services (Clean Architecture)
- **`@esparex/shared`** (`shared`): Shared contracts, types, and utility constants
- **`apps/mobile`** *(not an npm workspace)*: Capacitor shell that wraps `apps/web` for native iOS/Android deployment. It has no independent TypeScript build pipeline — it loads the web app via a configured server URL. Mobile-specific native code (Android/iOS) lives here. See `apps/mobile/capacitor.config.ts`.

### 📁 Folder Breakdown

- `apps/`: Presentation layer (UI only)
- `backend/`: API gateway layer (routing + validation)
- `core/`: The "Brain" — ONLY place for business logic and DB access
- `shared/`: SSOT for types, enums, and interfaces
- `scripts/`: Repo governance, guardrails, and CI tooling
- `ai-governance`: Canonical instructions for repo-aware AI agents
- `docs/`: [Master Documentation Registry](docs/00-index.md)

> **Workspace Governance Rule**: Every top-level directory in this repository must either be a registered npm workspace (listed in the root `package.json` `workspaces` array), or explicitly documented as an infrastructure/runtime wrapper in this README. Undocumented directories are not permitted.
>
> `apps/mobile` is the current documented exception — a Capacitor native shell with no independent TypeScript build pipeline.

## Setup

Requirements:

- Node.js `22.x`
- npm `>=11.8 <12`

Install dependencies from the repo root only:

```bash
npm install
```

## CI/CD (GitHub Actions)

CI is intentionally consolidated to a single workflow:

- Workflow file: `.github/workflows/ci.yml`
- Trigger: `push` to `main`, `pull_request` to `main`, and manual `workflow_dispatch`
- Runtime: Node `22.x`
- Install strategy: deterministic root install (`HUSKY=0 npm ci`)
- Validation stage: `npm run ci:strict` (`lint:ci` + type-check + tests)
- Build order:
  1. `@esparex/shared`
  2. `@esparex/core`
  3. `@esparex/backend-api`
  4. `@esparex/apps-admin`
  5. `@esparex/apps-web`

## Governance & Guardrails

This project uses strict automated guardrails to maintain code quality and architectural integrity.

### Pre-commit & Pre-push
Standard checks run automatically on every commit/push:
- **Linting**: `npm run lint` (Checks for unused imports, `any` types, and cascading renders).
- **Type Safety**: `npm run type-check` (Ensures full TypeScript coverage across all workspaces).
- **Duplication**: `npm run guard:duplication` (Flags code blocks with >10 lines of identical content).

### Platform Governance
The project enforces a "zero-legacy" policy via:
```bash
npm run guard:platform-governance
```
This will fail if forbidden keywords (`legacy`, `compatibility`, `@deprecated`) are found in comments, variables, or routes. Use `OLD` or descriptive alternatives instead.

## Reliability Layer

The backend exposes enterprise reliability surfaces:

- `GET /metrics`: Prometheus metrics (API latency/error rate, queue duration/failures, DB latency, subsystem gauges)
- `GET /system/status`: runtime subsystem dashboard (DB, Redis, Queue, Worker)
- `GET /system/metrics-summary`: SLO-oriented reliability summary (API, queue backlog, failure rates, worker state, security signals)
- `GET /health`: health contract for uptime checks

Environment switches for alerting are in `backend/api/.env.example`:

- `RELIABILITY_SLACK_WEBHOOK_URL`
- `RELIABILITY_ALERT_EMAIL_TO`
- `RELIABILITY_ALERT_THROTTLE_MS`
- `RELIABILITY_API_LATENCY_THRESHOLD_MS`
- `RELIABILITY_HIGH_ERROR_RATE_THRESHOLD`
- `RELIABILITY_QUEUE_DELAY_THRESHOLD_MS`
- `RELIABILITY_DB_RESPONSE_THRESHOLD_MS`
- `RELIABILITY_QUEUE_FAILURE_SPIKE_THRESHOLD`

### Pull Request Requirements
The `guard:pr-impact-analysis` CI check requires every PR to have a description following the repository template. If your PR description is empty, the CI build **will fail**.

### Current CI Note
The CI workflow is strict by default and fails on lint/type-check/test/build regressions.

Run workspaces as needed:

```bash
npm run dev -w @esparex/backend-api
npm run dev -w @esparex/apps-web
npm run dev -w @esparex/apps-admin
```

## Deployment & Environment Configuration

The project is deployed using **Vercel** (Frontends) and **Render** (Backends).

### Frontend Deployments (Vercel)
Create **two separate Vercel projects**:

- `@esparex/apps-web`
  - **Root Directory**: `apps/web`
  - **Install Command**: *(Use Vercel default install)*
  - **Build Command**: `cd ../.. && npm run build -w @esparex/apps-web`
- `@esparex/apps-admin`
  - **Root Directory**: `apps/admin`
  - **Install Command**: *(Use Vercel default install)*
  - **Build Command**: `cd ../.. && npm run build -w @esparex/apps-admin`

Use root-workspace builds so shared/core/backend artifacts stay consistent.

### Unified Backend Deployment (Render)
When creating the Web Service (e.g., named `esparex-api`) for the API system:
- **Root Directory**: (Leave Empty)
- **Build Command**: `HUSKY=0 npm ci && npm run build -w @esparex/shared && npm run build -w @esparex/core && npm run build -w @esparex/backend-api && test -f backend/api/dist/index.js`
- **Start Command**: `npm start -w @esparex/backend-api`

Do not use cross-directory commands such as `cd backend` or `cd backend/api`.

### Admin System Configuration (Vercel/Render)

To fix 404/403 errors during login/CSRF discovery, ensure the following environment variables are aligned:

| Workspace | Platform | Variable | Recommended Value |
| :--- | :--- | :--- | :--- |
| `@esparex/apps-web` | Vercel | `NEXT_PUBLIC_API_URL` | `https://api.esparex.in/api/v1` |
| `@esparex/apps-admin` | Vercel | `NEXT_PUBLIC_ADMIN_API_URL` | `https://api.esparex.in/api/v1/admin` |
| `@esparex/apps-admin` | Vercel | `NEXT_PUBLIC_PROD_RISK_OVERRIDE` | `false` |
| `@esparex/apps-admin` | Vercel | `NEXT_PUBLIC_APP_ENV` | `production` |
| `@esparex/backend-api` | Render | `COOKIE_DOMAIN` | `.esparex.in` (required for CSRF) |
| `@esparex/backend-api` | Render | `CORS_ALLOWED_ORIGINS` | `https://admin.esparex.in` |
| `@esparex/backend-api` | Render | `CSRF_SECRET` | *[Random 32-char string]* |

**Note**: Admin routes are served from the unified API under `/api/v1/admin`.
