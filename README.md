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
npm run dev -w backend
npm run dev -w frontend
npm run dev -w admin-frontend
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
