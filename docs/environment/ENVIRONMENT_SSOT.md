# Environment SSOT

This document defines the core principles governing environment configuration across the Esparex platform.

## 1. Architectural Authority

No package or module may arbitrarily invent new environment variables. All variables must be strictly validated by the consuming host application.
- `apps/web` owns all `NEXT_PUBLIC_` variables used in the User UI.
- `apps/admin` owns all `NEXT_PUBLIC_` variables used in the Admin UI.
- `backend/user` runs the Node.js API and delegates validation to `core`.
- `core/src/config/env.ts` is the single source of truth for all backend validation.

## 2. File Hygiene & Templates

Every application that loads variables MUST expose a `.example` template.

| Host Application | Template | Usage |
|---|---|---|
| `apps/web` | `.env.local.example` | Local UI Development |
| `apps/web` | `.env.production.example` | Vercel Deployment Reference |
| `apps/admin` | `.env.local.example` | Local Admin UI Development |
| `apps/admin` | `.env.production.example` | Vercel Deployment Reference |
| `backend/user` | `.env.example` | Local API Development |
| `backend/user` | `.env.production.example` | Render Deployment Reference |

## 3. Drift Prevention Principle

Environment variables must be as closely aligned as possible between Local, CI, and Production. 
The only accepted drift is the GitHub Actions CI override (`SKIP_ENV_VALIDATION`), which intentionally bypasses Next.js UI validation to securely complete builds without requiring production secrets.
