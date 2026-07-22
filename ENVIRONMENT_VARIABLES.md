# Esparex Environment Variables — Source of Truth

> **Canonical Schema:** `core/src/config/env.ts`  
> **Validation:** Zod schema at startup + production gates in `core/src/config/validateEnv.ts`  
> **Frontend Validation:** `apps/web/src/lib/api/validateApiEnv.ts`, `apps/admin/src/lib/api/validateAdminApiEnv.ts`  
> **Last Updated:** 2026-07-22

---

## Table of Contents

- [Quick Reference Table](#quick-reference-table)
- [Environment-Specific Notes](#environment-specific-notes)
- [Platform-Specific Notes](#platform-specific-notes)
- [Security Considerations](#security-considerations)
- [Secret vs Configuration Classification](#secret-vs-configuration-classification)
- [Migration Guide (Deprecated → Canonical)](#migration-guide)

---

## Quick Reference Table

| Variable | Required | Default | Environments | Platform | Secret | Description |
|----------|----------|---------|-------------|----------|--------|-------------|
| `NODE_ENV` | Yes | `development` | all | all | No | Runtime mode |
| `PORT` | No | `5001` | all | Render, local | No | HTTP server port |
| `TZ` | No | `UTC` | all | all | No | Timezone |
| `PROCESS_ROLE` | No | `api` | all | Render | No | Process role: `api`, `scheduler`, or `worker` |
| `CI` | No | `false` | CI | GitHub Actions | No | CI environment flag |
| `MONGODB_URI` | Yes | — | all | all | Yes | User database connection string |
| `ADMIN_MONGODB_URI` | Yes | — | all | all | Yes | Admin database connection string |
| `ALLOW_BOOT_AUTO_INDEX` | No | `false` | dev | local | No | Auto-create MongoDB indexes at boot |
| `ALLOW_DB_CONNECT` | No | `false` | dev | local | No | Allow database connection |
| `ALLOW_REDIS` | No | `false` | all | Render | No | Enable Redis |
| `REDIS_HOST` | No | `localhost` | dev | local | No | Redis host |
| `REDIS_PORT` | No | `6379` | dev | local | No | Redis port |
| `REDIS_URL` | Yes (prod) | — | all | Render | Yes | Redis connection string |
| `REDIS_USERNAME` | Yes (prod) | — | prod | Render | No | Redis ACL username |
| `REDIS_PASSWORD` | No | — | prod | Render | Yes | Redis password |
| `REDIS_DB` | No | `0` | dev | local | No | Redis database number |
| `REDIS_MODE` | No | `single` | prod | Render | No | Redis topology: `single`, `cluster`, `sentinel` |
| `JWT_SECRET` | Yes | — | all | all | Yes | JWT signing key (min 32 chars, 64+ in prod) |
| `JWT_EXPIRES_IN` | No | `7d` | all | all | No | JWT token expiry |
| `ADMIN_JWT_SECRET` | No | — | all | Render | Yes | Admin JWT signing key |
| `ADMIN_SESSION_TTL_MS` | No | — | all | Render | No | Admin session TTL |
| `AUTH_LOCAL_RELAXED` | No | `false` | dev only | local | No | Relaxed auth in dev (blocked in prod) |
| `ALLOW_DEFAULT_ADMIN_SEED` | No | `false` | dev only | local | No | Seed default admin (blocked in prod) |
| `OTP_HASH_SECRET` | No | — | prod | Render | Yes | OTP hashing secret |
| `HMAC_SECRET` | No | (dev fallback) | all | all | Yes | OTP HMAC signing key |
| `MSG91_AUTH_KEY` | No | — | prod | Render | Yes | MSG91 SMS API key |
| `MSG91_SENDER_ID` | No | — | prod | Render | No | SMS sender ID |
| `MSG91_TEMPLATE_ID` | No | — | prod | Render | No | SMS template ID |
| `AUTH_BYPASS_OTP_LOCK` | No | — | dev only | local | No | Disable OTP brute-force lock (blocked in prod) |
| `USE_DEFAULT_OTP` | No | `false` | dev only | local | No | Use static OTP (blocked in prod) |
| `DEV_STATIC_OTP` | No | `123456` | dev only | local | No | Static OTP value for dev |
| `COOKIE_DOMAIN` | Yes (prod) | — | prod | Render | No | Cookie domain (auto-inferred in prod) |
| `COOKIE_SAME_SITE` | No | — | all | all | No | SameSite policy: `strict`, `lax`, `none` |
| `COOKIE_SECURE` | No | — | all | Render | No | Cookie Secure flag |
| `CORS_ORIGIN` | Yes (prod) | `http://localhost:3000,http://localhost:3001` | all | Render | No | Allowed CORS origins |
| `FRONTEND_URL` | No | — | all | Render | No | Public frontend URL |
| `FRONTEND_INTERNAL_URL` | No | — | all | Render | No | Internal frontend URL for server-to-server |
| `ADMIN_FRONTEND_URL` | No | — | all | Render | No | Admin frontend URL |
| `AWS_ACCESS_KEY_ID` | No | — | all | Render | Yes | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | No | — | all | Render | Yes | AWS IAM secret key |
| `AWS_REGION` | No | `ap-south-1` | all | all | No | AWS region |
| `S3_BUCKET_NAME` | No | — | all | Render | No | S3 bucket for uploads |
| `AWS_CLOUDFRONT_URL` | No | — | prod | Render | No | CloudFront CDN URL |
| `RAZORPAY_KEY_ID` | No | — | prod | Render | No | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | No | — | prod | Render | Yes | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes (prod) | — | prod | Render | Yes | Razorpay webhook signing secret |
| `FIREBASE_PROJECT_ID` | No | — | prod | Render | No | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | No | — | prod | Render | No | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | No | — | prod | Render | Yes | Firebase service account private key |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | No | — | prod | Render | Yes | Full Firebase service account JSON |
| `ALLOW_FIREBASE_ADMIN` | No | `false` | dev | local | No | Enable Firebase Admin SDK |
| `AI_PROVIDER` | No | `gemini` | all | all | No | AI provider: `gemini` or `openai` |
| `GEMINI_API_KEY` | No | — | prod | Render | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | — | all | all | No | Gemini model name |
| `AI_MODEL` | No | — | all | all | No | AI model override |
| `AI_REQUEST_TIMEOUT_MS` | No | — | all | all | No | AI API timeout (ms) |
| `AI_MAX_IMAGE_BYTES` | No | — | all | all | No | Max image size for AI (bytes) |
| `FRAUD_DECISION_TIMEOUT_MS` | No | `1200` | all | all | No | Fraud decision timeout (ms) |
| `FRAUD_AUTO_SUSPEND_THRESHOLD` | No | `81` | all | all | No | Auto-suspend fraud score threshold |
| `PROD_RISK_OVERRIDE` | No | `false` | prod | all | No | Bypass production safety gates |
| `ATLAS_LOCATION_SEARCH_INDEX` | No | `location_autocomplete` | prod | all | No | Atlas Search index for location |
| `ATLAS_CATALOG_SEARCH_INDEX` | No | `catalog_search` | prod | all | No | Atlas Search index for catalog |
| `FEED_DEBUG` | No | `false` | dev only | local | No | Feed debug logging (blocked in prod) |
| `HOME_FEED_WARM_LOCATIONS` | No | — | dev | local | No | Pre-warm locations for home feed |
| `ENABLE_STRICT_DUPLICATE_INDEX` | No | `false` | prod | all | No | Enable strict duplicate index |
| `DUPLICATE_ROLLOUT_MIGRATION_TAG` | No | — | prod | all | No | Migration tag for duplicate rollout |
| `SENTRY_DSN` | No | — | prod | all | No | Sentry error tracking DSN |
| `SENTRY_ENVIRONMENT` | No | — | all | all | No | Sentry environment tag |
| `SENTRY_ENABLE_DEV` | No | `false` | dev only | local | No | Enable Sentry in dev (blocked in prod) |
| `SMTP_HOST` | No | — | prod | Render | No | SMTP server host |
| `SMTP_PORT` | No | — | prod | Render | No | SMTP server port |
| `SMTP_USER` | No | — | prod | Render | No | SMTP username |
| `SMTP_PASSWORD` | No | — | prod | Render | Yes | SMTP password |
| `SMTP_FROM` | No | — | prod | Render | No | SMTP from address |
| `RUN_SCHEDULERS` | No | `false` | all | Render | No | Enable scheduled jobs |
| `ENABLE_SCHEDULER` | No | `false` | prod | Render | No | Enable scheduler process |
| `ALLOW_SCHEDULER_QUEUE` | No | `false` | dev | local | No | Allow scheduler queue (blocked in prod) |
| `RELIABILITY_ALERTS_ENABLED` | No | `true` | prod | Render | No | Enable reliability monitoring |
| `RELIABILITY_SLACK_WEBHOOK_URL` | No | — | prod | Render | Yes | Slack webhook for alerts |
| `RELIABILITY_ALERT_EMAIL_TO` | No | — | prod | Render | No | Alert email recipient |
| `RELIABILITY_*` (22 vars) | No | varied | prod | Render | No | SLO/monitoring thresholds |
| `CONTAINER_MEMORY_LIMIT_MB` | No | — | prod | Render | No | Container memory limit |
| `SYSTEM_MONITOR_WARN_RATIO` | No | — | prod | Render | No | Memory warning threshold ratio |
| `ENABLE_SWAGGER` | No | `true` | dev only | local | No | Enable Swagger UI (blocked in prod) |
| `ENABLE_RATE_LIMITING` | No | `true` | all | all | No | Enable rate limiting |
| `ENABLE_MAINTENANCE_MODE` | No | `false` | all | Render | No | Enable maintenance mode |
| `BACKUP_DIR` | No | `./backups` | all | local | No | Backup output directory |
| `BACKUP_RETENTION_DAYS` | No | `30` | all | local | No | Backup retention period |
| `BACKUP_CRON_SCHEDULE` | No | `0 2 * * *` | all | local | No | Backup cron schedule |
| `ENABLE_AUTO_BACKUPS` | No | `false` | all | local | No | Enable automatic backups |
| `IPAPI_KEY` | No | — | prod | local | No | IP geolocation API key |
| `ADMIN_RATE_LIMIT_MAX` | No | — | all | all | No | Admin API rate limit max |
| `ADMIN_MUTATION_RATE_LIMIT_MAX` | No | — | all | all | No | Admin mutation rate limit max |

### Frontend Variables (NEXT_PUBLIC_*)

| Variable | Required | Default | Environment | Platform | Secret | Description |
|----------|----------|---------|-------------|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes (prod) | — | all | Vercel Web | No | Backend API base URL (exposed to browser) |
| `NEXT_PUBLIC_APP_URL` | No | `https://esparex.in` | all | Vercel Web | No | Frontend canonical URL |
| `NEXT_PUBLIC_APP_ENV` | No | `local` | all | Vercel | No | Deployment environment label |
| `NEXT_PUBLIC_PROD_RISK_OVERRIDE` | No | `false` | prod | Vercel | No | Bypass production validation guards |
| `NEXT_PUBLIC_LOCAL_DEV_AUTH` | No | `false` | dev only | local | No | Enable local auth bypass |
| `NEXT_PUBLIC_HMAC_SECRET` | No | — | all | Vercel Web | Yes* | Browser HMAC key (*exposed to client) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | No | — | all | Vercel Web | No | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | No | — | all | Vercel Web | No | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | No | — | all | Vercel Web | No | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | — | all | Vercel Web | No | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | — | all | Vercel Web | No | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | No | — | all | Vercel Web | No | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | — | all | Vercel Web | No | Firebase analytics measurement ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | No | — | all | Vercel Web | No | Firebase web push VAPID key |
| `NEXT_PUBLIC_ADMIN_API_URL` | Yes (prod) | — | all | Vercel Admin | No | Admin API base URL |
| `NEXT_PUBLIC_ADMIN_API_TIMEOUT_MS` | No | `20000` | all | Vercel Admin | No | Admin API request timeout |

### Server-Only Variables (Web/Admin)

| Variable | Required | Default | Environment | Platform | Secret | Description |
|----------|----------|---------|-------------|----------|--------|-------------|
| `BACKEND_INTERNAL_URL` | No | `NEXT_PUBLIC_API_URL` | all | Vercel Web | No | Server-to-server backend URL |
| `ADMIN_ALLOWED_IPS` | No | — | all | Vercel Web | No | IP whitelist for admin route protection |
| `INTERNAL_REVALIDATE_SECRET` | No | — | prod | Vercel Web | Yes | ISR revalidation secret |
| `REVALIDATE_SECRET` | No | — | prod | Vercel Web | Yes | Legacy revalidation fallback |
| `ANALYZE` | No | — | dev | Vercel Admin | No | Enable bundle analyzer |

### Test-Only Variables

| Variable | Description |
|----------|-------------|
| `SKIP_ENV_VALIDATION` | Skip env validation during build/tests |
| `BYPASS_POST_AD_QUOTA_CHECK` | Bypass ad posting quota in tests |
| `WEB_FRONTEND_PORT` | Web app port for Playwright |
| `SMOKE_FRONTEND_URL` | Base URL for smoke tests |
| `SMOKE_API_BASE_URL` | API URL for smoke tests |
| `SMOKE_AUTH_MOBILE` | Test phone number |
| `SMOKE_AUTH_OTP` | Test OTP |
| `SMOKE_AUTH_TOKEN` | Pre-existing auth token |
| `SMOKE_*` (4 more) | Smoke test fixture config |
| `ADMIN_FRONTEND_PORT` | Admin port for Playwright |
| `ADMIN_FRONTEND_BASE_URL` | Admin base URL for Playwright |
| `PLAYWRIGHT_CI_SERVER_MODE` | CI server mode flag |
| `E2E_*` (12 vars) | E2E orchestration config |
| `JEST_WORKER_ID` | Jest parallel worker (auto) |
| `JEST_VERBOSE_TEARDOWN` | Jest teardown verbosity |

### Ad-hoc Script Variables

| Variable | Script | Description |
|----------|--------|-------------|
| `API_BASE_URL` | `scripts/check-s3-images.ts` | API URL for image check |
| `S3_IMAGE_LIST_LIMIT` | `scripts/check-s3-images.ts` | Image list page size |
| `S3_IMAGE_DETAIL_LIMIT` | `scripts/check-s3-images.ts` | Image detail page size |
| `CATALOG_*` (5) | `scripts/catalog-*.js` | Catalog migration safe-guards |
| `SMOKE_FIXTURE_REVEAL_EXPECT` | `backend/api/src/scripts/` | Fixture generation config |
| `SMOKE_FIXTURE_OUTPUT_PATH` | `backend/api/src/scripts/` | Fixture output path |
| `BACKUP_ENCRYPTION_KEY` | `core/src/scripts/backup-database.ts` | Backup encryption |
| `CAPACITOR_SERVER_URL` | `apps/mobile/capacitor.config.ts` | Capacitor dev server |

---

## Environment-Specific Notes

### Local Development

Use `backend/api/.env.example` as the starting template. Key requirements:
- `MONGODB_URI` — local or Atlas MongoDB instance
- `JWT_SECRET` — any 32+ char string
- `USE_DEFAULT_OTP=true` — enables static OTP (`123456`) for ease of testing
- Optional: set `ALLOW_REDIS=false` if you don't have Redis running

Frontend: copy `apps/web/.env.local.example` → `apps/web/.env.local`
Admin: copy `apps/admin/.env.local.example` → `apps/admin/.env.local`

### Testing

- Set `NODE_ENV=test` — this skips many production validations
- `ALLOW_REDIS=false` by default in tests
- `SKIP_ENV_VALIDATION=true` is available to bypass frontend env checks

### Production

- All secrets must be injected via platform (Render/Vercel) — never committed
- `ENABLE_SWAGGER` must be `false` (enforced at startup)
- `USE_DEFAULT_OTP` must be `false` (enforced at startup)
- `CORS_ORIGIN` must not contain wildcards or localhost
- Redis requires ACL username + password
- `JWT_SECRET` should be 64+ characters

---

## Platform-Specific Notes

### Render (Backend API)

- `PORT` is overridden by Render to `10000`
- All secrets use `sync: false` — set in Render Dashboard
- `NODE_VERSION: "22"` is set for the runtime, not read by app code
- `COOKIE_SECURE` and `COOKIE_SAME_SITE` are hardcoded to production-safe values
- `NODE_ENV=production` is hardcoded

### Vercel (Web — esparex.in)

- `NEXT_PUBLIC_API_URL` is set in `vercel.json` as `https://api.esparex.in/api/v1`
- Firebase public config vars must be set in Vercel project environment
- `BACKEND_INTERNAL_URL` should be set to the Render internal URL for server-to-server

### Vercel (Admin — admin.esparex.in)

- `NEXT_PUBLIC_ADMIN_API_URL` must be set in Vercel project environment
- `HUSKY=0` is set in `vercel.json` build env

### GitHub Actions

- CI sets placeholder values for all `NEXT_PUBLIC_*` vars
- Backend startup smoke test injects required vars inline
- `SKIP_ENV_VALIDATION=true` in CI to skip frontend validation
- Release workflow uses `${{ secrets.GITHUB_TOKEN }}`

---

## Security Considerations

### Critical Secrets That Must Never Be Exposed

1. **`JWT_SECRET`** — Controls all user sessions. Rotate regularly.
2. **`MONGODB_URI` / `ADMIN_MONGODB_URI`** — Full database access.
3. **`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`** — S3 bucket access.
4. **`RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`** — Payment processing.
5. **`FIREBASE_SERVICE_ACCOUNT_JSON`** — Full Firebase Admin access.
6. **`HMAC_SECRET`** — OTP signing (has insecure dev fallback).
7. **`OTP_HASH_SECRET`** — OTP hashing.

### NEXT_PUBLIC_* Exposure

All `NEXT_PUBLIC_*` variables are bundled into the client-side JavaScript. Never put secrets here. The Firebase config values are intentionally public by Firebase's design (they are not secrets — Firebase enforces security through App Check and Security Rules).

⚠️ **`NEXT_PUBLIC_HMAC_SECRET`** is a special case — it IS a secret value exposed to the browser. The code notes this is "not a true security boundary." This should be removed when the browser-side HMAC implementation is refactored.

### Production Safety Gates

The validation system (`validateEnv.ts`) enforces:
- No default/weak JWT secrets in production
- No localhost URLs for database/Redis/CORS
- No unsafe debug flags (`FEED_DEBUG`, `SENTRY_ENABLE_DEV`, etc.)
- No Swagger exposure in production
- No verbose logging levels in production
- Redis ACL username required in production

These can all be overridden with `PROD_RISK_OVERRIDE=true` (not recommended).

---

## Secret vs Configuration Classification

### Secrets (Render Dashboard / Vercel Encrypted Env)

```
MONGODB_URI, ADMIN_MONGODB_URI, JWT_SECRET, ADMIN_JWT_SECRET,
HMAC_SECRET, OTP_HASH_SECRET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, GEMINI_API_KEY,
MSG91_AUTH_KEY, SMTP_PASSWORD, FIREBASE_SERVICE_ACCOUNT_JSON,
FIREBASE_PRIVATE_KEY, RELIABILITY_SLACK_WEBHOOK_URL, BACKUP_ENCRYPTION_KEY,
INTERNAL_REVALIDATE_SECRET, REVALIDATE_SECRET, REDIS_URL, REDIS_PASSWORD
```

### Configuration (Safe for `.env` files)

Everything else: ports, URLs, feature flags, timeouts, regions, index names, etc.

---

## Migration Guide

When transitioning from deprecated to canonical variable names, the system handles backward compatibility automatically:

| Deprecated | Canonical | Compatibility | Notes |
|------------|-----------|---------------|-------|
| `AWS_S3_BUCKET` | `S3_BUCKET_NAME` | Yes (auto-migration) | Logs deprecation warning, copies value |
| `MONGO_URI` | `MONGODB_URI` | Yes (fallback) | Only in `migrate-mongo-config.js` |
| `STATIC_OTP` | `DEV_STATIC_OTP` | No | Remove from all configs |
| `ADMIN_URL` | `ADMIN_FRONTEND_URL` | No | Remove; never actually read |

---

## Deprecated Variables (Removed)

The following variables have been removed and should not be used:

| Variable | Removed In | Reason | Replacement |
|----------|-----------|--------|-------------|
| `REFRESH_TOKEN_SECRET` | 2026-07 | Never read | — |
| `CSRF_SECRET` | 2026-07 | Never read | — |
| `SMS_PROVIDER` | 2026-07 | Never read | — |
| `STATIC_OTP` | 2026-07 | Never read | `DEV_STATIC_OTP` |
| `ALLOW_TEST_NUMBERS` | 2026-07 | Never read | — |
| `BYPASS_OTP_IN_DEVELOPMENT` | 2026-07 | Never read | — |
| `ADMIN_URL` | 2026-07 | Never read by runtime | `ADMIN_FRONTEND_URL` |
| `DRY_RUN_S3_CLEANUP` | 2026-07 | Never read | — |
| `NEXT_PUBLIC_DEBUG_API_CLIENT` | 2026-07 | Never read | — |
| `NEXT_PUBLIC_GA_ID` | 2026-07 | Never read | — |

---

> **Maintenance:** When adding a new environment variable, update this file AND `core/src/config/env.ts` schema AND the relevant `.env.example` files. Run `npm run guard:env-contracts` to validate consistency.
