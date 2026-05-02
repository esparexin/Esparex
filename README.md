# Esparex Admin System

Esparex is an npm workspaces monorepo with the following structure:

### 📦 Workspaces

- **`@esparex/apps-admin`** (`apps/admin`): Admin dashboard UI (Next.js)
- **`@esparex/apps-web`** (`apps/web`): User-facing web application (Next.js)
- **`@esparex/backend-admin`** (`backend/admin`): Administrative API services
- **`@esparex/backend-user`** (`backend/user`): Main user API services (Express)
- **`@esparex/core`** (`core`): Business logic, domain models, and DB services (Clean Architecture)
- **`@esparex/shared`** (`shared`): Shared contracts, types, and utility constants
- **`@esparex/shared-observability`** (`shared/observability`): Logging and monitoring utilities

### 📁 Folder Breakdown

- `apps/`: Presentation layer (UI only)
- `backend/`: API gateway layer (routing + validation)
- `core/`: The "Brain" — ONLY place for business logic and DB access
- `shared/`: SSOT for types, enums, and interfaces
- `scripts/`: Repo governance, guardrails, and CI tooling
- `ai-governance`: Canonical instructions for repo-aware AI agents

## Setup

Requirements:

- Node.js `>=24 <26`
- npm `>=11.8 <12`

Install dependencies from the repo root only:

```bash
npm install
```

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

### Pull Request Requirements
The `guard:pr-impact-analysis` CI check requires every PR to have a description following the repository template. If your PR description is empty, the CI build **will fail**.

Run workspaces as needed:

```bash
npm run dev -w @esparex/backend-user
npm run dev -w @esparex/apps-web
npm run dev -w @esparex/apps-admin
```

## Deployment & Environment Configuration

The project is deployed using **Vercel** (Frontends) and **Render** (Backends).

### Admin Backend Deployment (Render)
When creating the Web Service (e.g., named `backend` or `admin-api`) for the admin system:
- **Root Directory**: (Leave Empty)
- **Build Command**: `export NODE_OPTIONS="--max-old-space-size=4096" && npm install && npm run build -w core && npm run build -w @esparex/backend-admin`
- **Start Command**: `npm start -w @esparex/backend-admin`

### Admin System Configuration (Vercel/Render)

To fix 404/403 errors during login/CSRF discovery, ensure the following environment variables are aligned:

| Workspace | Platform | Variable | Recommended Value |
| :--- | :--- | :--- | :--- |
| `@esparex/apps-admin` | Vercel | `NEXT_PUBLIC_ADMIN_API_URL` | `https://api.esparex.in/api/v1/admin` |
| `@esparex/apps-admin` | Vercel | `PROD_RISK_OVERRIDE` | `true` |
| `@esparex/backend-admin` | Render | `COOKIE_DOMAIN` | `.esparex.in` (required for CSRF) |
| `@esparex/backend-admin` | Render | `CORS_ALLOWED_ORIGINS` | `https://admin.esparex.in` |
| `@esparex/backend-admin` | Render | `CSRF_SECRET` | *[Random 32-char string]* |

**Note**: The `@esparex/backend-admin` routes are prefixed with `/api/v1/admin`. If your frontend points to `api.esparex.in`, ensure your load balancer/proxy correctly routes those requests to the admin service.

