# Esparex Admin System

Esparex is an npm workspaces monorepo with seven active workspaces:

- `user-backend`
- `admin-backend`
- `core`
- `user-frontend`
- `admin-frontend`
- `shared`
- `shared/observability`
- `apps/mobile-app`

## Structure

- `user-backend/src`: API, services, routes, validators, config
- `core/src`: Canonical domain models, shared business services, database config
- `user-frontend/src`: user application
- `admin-frontend/src`: admin application
- `shared`: shared contracts, schemas, enums, types, and utilities
- `scripts`: repo guardrails and maintenance scripts
- `ai-governance`: canonical AI/governance instructions still referenced by repo tooling

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
npm run dev -w @esparex/user-backend
npm run dev -w @esparex/user-frontend
npm run dev -w @esparex/admin-frontend
```

## Deployment & Environment Configuration

The project is deployed using **Vercel** (Frontends) and **Render** (Backends).

### Admin Backend Deployment (Render)
When creating the Web Service (e.g., named `backend` or `admin-api`) for the admin system:
- **Root Directory**: (Leave Empty)
- **Build Command**: `export NODE_OPTIONS="--max-old-space-size=4096" && npm install && npm run build -w core && npm run build -w admin-backend`
- **Start Command**: `npm start -w admin-backend`

### Admin System Configuration (Vercel/Render)

To fix 404/403 errors during login/CSRF discovery, ensure the following environment variables are aligned:

| Workspace | Platform | Variable | Recommended Value |
| :--- | :--- | :--- | :--- |
| `admin-frontend` | Vercel | `NEXT_PUBLIC_ADMIN_API_URL` | `https://api.esparex.in/api/v1/admin` |
| `admin-frontend` | Vercel | `PROD_RISK_OVERRIDE` | `true` |
| `admin-backend` | Render | `COOKIE_DOMAIN` | `.esparex.in` (required for CSRF) |
| `admin-backend` | Render | `CORS_ALLOWED_ORIGINS` | `https://admin.esparex.in` |
| `admin-backend` | Render | `CSRF_SECRET` | *[Random 32-char string]* |

**Note**: The `admin-backend` routes are prefixed with `/api/v1/admin`. If your frontend points to `api.esparex.in`, ensure your load balancer/proxy correctly routes those requests to the admin service.

