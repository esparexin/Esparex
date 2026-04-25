# Esparex Admin System

Esparex is an npm workspaces monorepo with seven active workspaces:

- `backend`
- `admin-backend`
- `core`
- `frontend`
- `admin-frontend`
- `shared`
- `shared/observability`

## Structure

- `backend/src`: API, services, routes, validators, config
- `core/src`: Canonical domain models, shared business services, database config
- `frontend/src`: user application
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

Run workspaces as needed:

```bash
npm run dev -w backend
npm run dev -w frontend
npm run dev -w admin-frontend
```
