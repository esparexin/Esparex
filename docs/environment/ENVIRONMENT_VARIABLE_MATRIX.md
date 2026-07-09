# Environment Variable Matrix

This matrix establishes the definitive traceability chain, lifecycle tracking, and build/runtime classification for all required variables.

## 1. Traceability & Ownership

| Variable | Defined In | Loaded By | Validated By | Consumed By | Owner |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local.example` | Next.js | `validateAdminApiEnv.ts` / Next.js | API Client | `apps/web` |
| `NEXT_PUBLIC_APP_URL` | `apps/web/.env.local.example` | Next.js | Next.js | UI Components | `apps/web` |
| `NEXT_PUBLIC_APP_ENV` | `apps/web/.env.local.example` | Next.js | `validateAdminApiEnv.ts` | Analytics / Logging | `apps/web` |
| `NEXT_PUBLIC_FIREBASE_*` | `apps/web/.env.local.example` | Next.js | Next.js | Firebase Client SDK | `apps/web` |
| `NEXT_PUBLIC_ADMIN_API_URL`| `apps/admin/.env.local.example`| Next.js | `validateAdminApiEnv.ts` | Admin API Client | `apps/admin` |
| `NODE_ENV` | `core/.env` / System | Node.js | `core/src/config/env.ts` | Backend System | `core` |
| `PORT` | `backend/user/.env.example` | `dotenv` | `core/src/config/env.ts` | Express Server | `core` |
| `MONGODB_URI` | `backend/user/.env.example` | `dotenv` | `core/src/config/env.ts` | Mongoose Connection | `core` |
| `JWT_SECRET` | `backend/user/.env.example` | `dotenv` | `core/src/config/env.ts` | Auth Middleware | `core` |
| `HMAC_SECRET` | `backend/user/.env.example` | `dotenv` | `core/src/config/env.ts` | OTP System | `core` |
| `S3_BUCKET_NAME` | `backend/user/.env.production.example`| `dotenv` | `core/src/config/env.ts` | Upload Handlers | `core` |

## 2. Build vs Runtime Classification

| Variable | Build Time | Runtime | Justification |
|---|---|---|---|
| `NEXT_PUBLIC_*` | ✔ | ✔ | Next.js edge variables are statically embedded during build time (`getStaticPaths`), requiring them in both contexts. |
| Server Secrets (e.g., `JWT_SECRET`) | ✘ | ✔ | Backend variables are securely injected dynamically at runtime by Render/Node and are never bundled. |

## 3. Variable Lifecycles

### Frontend Next.js Lifecycle (`NEXT_PUBLIC_API_URL`)
```text
Defined (.env.local / Vercel Settings)
↓
Loaded (next.config.mjs / Next.js Boot)
↓
Validated (validateAdminApiEnv.ts / Edge)
↓
Build (Inlined into Edge bundle)
↓
Runtime (Browser execution)
```

### Backend API Lifecycle (`JWT_SECRET`)
```text
Defined (.env / Render Settings)
↓
Loaded (dotenv / loadEnvFiles.ts)
↓
Validated (core/src/config/env.ts - Zod)
↓
Runtime (Express / Authentication Middleware)
```
