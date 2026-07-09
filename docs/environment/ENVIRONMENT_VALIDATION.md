# Environment Validation Rules

Esparex employs aggressive "Fail-Fast" validation to prevent silent configuration drift.

## 1. Validation Ownership Matrix

| Package | Validation File | Validation Type |
|---|---|---|
| `core` | `core/src/config/env.ts` | Zod Schema |
| `apps/web` | `apps/web/next.config.mjs` / inline | Manual Next.js Assertion |
| `apps/admin` | `apps/admin/src/lib/api/validateAdminApiEnv.ts` | Manual Next.js Assertion |

*There is no duplicated validation. Frontend code validates `NEXT_PUBLIC_` edge variables, while Backend code strictly validates server secrets.*

## 2. Backend Validation (`core/src/config/env.ts`)
- **Engine:** Zod schema (`envSchema`).
- **Behavior:** Synchronously throws on application boot if required variables (e.g., `MONGODB_URI`, `JWT_SECRET`) are missing or malformed.
- **Production Guard:** Enforces `JWT_SECRET` strength (>64 chars) and strictly prevents fallback keys if `NODE_ENV=production`.

## 3. Frontend Validation (`apps/web` & `apps/admin`)
- **Engine:** Manual runtime assertions and static checks during Next.js build.
- **Behavior:** Evaluates `NEXT_PUBLIC_` variables during `getStaticPaths` or runtime payload injections.

## 4. Engineering Exception: `SKIP_ENV_VALIDATION`

```text
Status: Temporary

Reason: Required for current CI pipeline. Next.js statically builds pages using real endpoint URLs, causing CI to fail without production secrets.

Target State: CI should validate against the same contract as production using safe placeholder values instead of bypassing validation entirely.

Owner: Platform Engineering

Review Frequency: Every release cycle.
```
