# Environment Security Standards

This document establishes the security rules for environment configurations.

## 1. Naming Standards

Esparex employs a strict prefix-based classification system for environment variables.

### A. Public (Browser-Safe)
**Prefix:** `NEXT_PUBLIC_*`
**Scope:** Vercel edge runtime, Client browsers.
**Usage:** Any variable required for UI rendering, API routing, or third-party client SDKs (e.g., Firebase).
**Rule:** `NEXT_PUBLIC_` variables MUST NEVER contain symmetric keys, passwords, database URIs, or IAM credentials.

### B. Server-Only (Secrets)
**Prefix:** None (e.g., `JWT_SECRET`, `MONGODB_URI`, `FIREBASE_PRIVATE_KEY`)
**Scope:** Render backend runtime.
**Usage:** Keys, salts, passwords, URIs.
**Rule:** Server-only variables MUST NEVER be leaked into the UI or embedded into frontend source code.

## 2. Git Hygiene

To prevent credential leakage into GitHub:

- `.env`, `.env.local`, and `.env.development` MUST be strictly listed in the root `.gitignore`.
- `.env.example`, `.env.local.example`, and `.env.production.example` MUST be committed, and they MUST contain only placeholders or safe local-development defaults.

## 3. Zod Production Guard

The backend `core/src/config/env.ts` enforces active security guards during Boot when `NODE_ENV=production`:
- Blocks `JWT_SECRET` containing strings like "change_me" or "secret".
- Warns if `JWT_SECRET` is less than 64 characters long.
- Logs warnings if crash reporting (`SENTRY_DSN`) is missing in production.

## 4. Security Findings

- **Status:** **PASS**
- **Validation:** 0 secrets were detected in any committed `.env.example` file. `.env.local` files are correctly ignored by `.gitignore`.
