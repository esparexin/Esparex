# Environment Risk Register

This document classifies remaining environment architecture risks.

## CRITICAL
| Risk | Description | Mitigation |
|---|---|---|
| **Vercel Build Dependencies** | Frontend components aggressively invoke `.env` validation during static rendering (`getStaticPaths`). If Vercel environment variables are missing during a deployment trigger, the build completely crashes, potentially taking down production pipelines. | Ensure all keys listed in `.env.production.example` are manually verified in the Vercel Dashboard prior to triggering a production deployment. |

## HIGH
| Risk | Description | Mitigation |
|---|---|---|
| **CI Local Drift** | GitHub Actions actively injects `SKIP_ENV_VALIDATION="true"` to bypass Next.js build-time errors. This means CI tests the code, but does not test the actual environment pipeline that Vercel uses. | This is accepted tech debt to prevent exposing production secrets to the GitHub runner. Ensure thorough Vercel Preview Branch testing before merging to `main`. |
| **Monorepo File Sprawl** | `core`, `apps/web`, `apps/admin`, and `backend/user` all require distinct `.env` files. Developers may forget to update one, causing micro-fractures in the local environment. | Enforce the execution of the `ENVIRONMENT_BOOTSTRAP.md` procedures. |

## MEDIUM
| Risk | Description | Mitigation |
|---|---|---|
| **JWT_SECRET Lifecycle** | Backend `env.ts` enforces `JWT_SECRET` length in production, but does not enforce rotation. If a secret leaks, all existing sessions remain valid until they naturally expire. | Implement a Redis-backed session blocklist or explicit `ADMIN_SESSION_TTL_MS` rules. |
| **Firebase Exposed Keys** | `NEXT_PUBLIC_FIREBASE_*` keys are fundamentally exposed to the browser. | This is expected behavior for Firebase Web SDKs, but requires strict Firebase Security Rules (Firestore/Storage) to prevent malicious direct-access data manipulation. |

## LOW
| Risk | Description | Mitigation |
|---|---|---|
| **Redundant API Timeout Configs** | `apps/admin` allows `NEXT_PUBLIC_ADMIN_API_TIMEOUT_MS` overrides. If misconfigured locally, requests may drop unexpectedly. | A default of 20000ms is provided in code fallback. |
