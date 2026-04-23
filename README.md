# Esparex Admin System

Esparex is an npm workspaces monorepo with five active workspaces:

- `backend`
- `frontend`
- `admin-frontend`
- `shared`
- `shared/observability`

## Structure

- `backend/src`: API, services, models, routes, validators, config
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
