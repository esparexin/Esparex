# Esparex Admin System

This project is an npm workspaces monorepo for the Esparex marketplace, admin control plane, backend API, and shared packages.
## Governance & Safety Rules
Esparex follows strict non-destructive engineering rules.

📄 AI governance entry point: [ai-governance/README.md](./ai-governance/README.md)  
📄 AI SSOT: [ai-governance/SSOT.md](./ai-governance/SSOT.md)  
📄 AI SOP: [ai-governance/SOP.md](./ai-governance/SOP.md)  
📄 Canonical architecture and platform SSOT hierarchy: [docs/00_README_ARCHITECTURE.md](./docs/00_README_ARCHITECTURE.md)

The repo is organized as a monorepo workspace:

### 1. Backend (`/backend`)
A Node.js + Express + TypeScript application that handles:
- **API Endpoints** (`/api/v1/*`)
- **Database Logic** (MongoDB / Mongoose)
- **Authentication** (JWT, Sessions)
- **Business Logic** (Services, Controllers)
- **Integrations** (S3, OpenAI-backed AI, MSG91)

#### Key Directories
- `src/controllers`: Handles incoming requests and sends responses.
- `src/services`: Contains the core business logic.
- `src/models`: Database schemas (Mongoose).
- `src/routes`: API route definitions.
- `src/validators`: Request validation logic.
- `src/config`: Configuration (DB, Env).

### 2. User Frontend (`/frontend`)
A Next.js application that handles:
- **User Interface** (React Components)
- **Client-Side Routing** (App Router)
- **API Interaction** (Services calling Backend)

#### Key Directories
- `src/app`: Pages and Layouts.
- `src/components`: UI Components.
- `src/services`: API wrappers (e.g. `catalog.service`, `ad.service`).
- `src/lib`: Core utilities (API client).

### 3. Admin Frontend (`/admin-frontend`)
A separate Next.js admin application that handles:
- **Admin Interface** (moderation, catalog, finance, system tools)
- **Admin Authentication** (isolated auth/session handling)
- **Admin API Interaction** (`/api/v1/admin/*`)

#### Key Directories
- `src/app`: Admin pages and protected routes.
- `src/components`: Admin UI modules.
- `src/lib/api`: Admin API client and env validation.

### 4. Shared Packages (`/shared`, `/shared/observability`)
Shared contracts, schemas, types, utilities, and observability helpers consumed by multiple apps.

---

## Setup & Running

### Prerequisites
- Node.js `>=24 <26`
- npm `>=11.8 <12`
- MongoDB (Running locally or Atlas URI)
- AWS S3 Credentials (optional, for images)
- OpenAI API Key via system configuration (optional, for runtime AI)

### 1. Install Workspace Dependencies
From the repo root, install once:
```bash
npm install
```

Do not run `npm install` inside `backend`, `frontend`, `admin-frontend`, or `shared`. The repo uses one root lockfile and workspace-local installs create drift.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure Environment:
   - The `.env` file should be present. Ensure `MONGODB_URI` and `JWT_SECRET` are set.
3. Run the server:
   ```bash
   npm run dev
   ```
   *Server runs on port 5001 by default.*

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Configure Environment:
   - Check `.env.local` to ensure `NEXT_PUBLIC_API_URL` points to `http://localhost:5001/api/v1` (or your proxy path).
3. Run the application:
   ```bash
   npm run dev
   ```
   *App runs on port 3000.*

### 4. Admin Frontend Setup
1. Navigate to the admin frontend directory:
   ```bash
   cd admin-frontend
   ```
2. Configure Environment:
   - Copy `admin-frontend/.env.local.example` to `.env.local`.
   - Ensure `NEXT_PUBLIC_ADMIN_API_URL` points to `http://localhost:5001/api/v1/admin`.
3. Run the application:
   ```bash
   npm run dev
   ```
   *App runs on port 3001.*

---

## Development Guidelines

For contribution rules and duplication-prevention guardrails, see [CONTRIBUTING.md](./CONTRIBUTING.md).

1. **API Calls**:
   - Frontend components should **NEVER** use `axios` or `fetch` directly.
   - Always use or create a service in `frontend/src/services` to communicate with the API.

2. **Backend Logic**:
   - Create a Route -> Controller -> Service flow.
   - Put validation in `src/validators`.
   - Put logic in `src/services`.

3. **Environment Variables**:
   - Backend secrets go in `backend/.env`.
   - Frontend public variables go in `frontend/.env.local` prefixed with `NEXT_PUBLIC_`.

## Daily Flow (Required)

Use this flow for every `feature/*`, `fix/*`, `refactor/*`, and `hotfix/*` branch:

```bash
git checkout develop
git pull --rebase origin develop
git checkout -b fix/<short-name>   # or feature/refactor/hotfix
# make changes
npm --workspace backend run lint && npm --workspace backend run typecheck && npm --workspace backend run build
npm --workspace frontend run lint && npm --workspace frontend run typecheck && npm --workspace frontend run build
git add .
git commit -m "fix: <clear message>"
git push -u origin fix/<short-name>
```

PR targets:
- `feature/*`, `fix/*`, `refactor/*` -> `develop`
- `develop` or `hotfix/*` -> `main`

Automation in this repo enforces this policy:
- `./scripts/start-branch.sh <type> <short-name>` bootstraps branch creation from `develop`.
- `.husky/commit-msg` enforces commit prefixes: `feat|fix|refactor|chore|docs`.
- `.husky/pre-push` enforces branch governance and mandatory quality gates.

## Branch Protection Checklist (GitHub Settings)

Configure these in repository settings:
- `main`: block direct pushes, require PR, require all CI checks, optionally require squash merge.
- `develop`: require PR and required CI checks.

## Backup Branch Retention

Keep local backup branches for 7 days after major cleanup, then delete:
- `backup-before-cleanup`
- `backup-develop-local-20260221-123754`
- `backup-main-local-20260221-123941`
