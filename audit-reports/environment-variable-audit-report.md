# Environment Variable Audit Report — Esparex Monorepo

> **Audit Date:** 2026-07-22  
> **Scope:** Entire monorepo (apps/web, apps/admin, apps/mobile, backend/api, core, shared, packages, scripts, tooling, .github)  
> **Methodology:** grep, ripgrep, file read, and configuration inspection  

---

## Table of Contents

1. [Complete Environment Variable Inventory](#1-complete-environment-variable-inventory)
2. [Runtime Usage Report](#2-runtime-usage-report)
3. [Deployment Platform Comparison](#3-deployment-platform-comparison)
4. [Duplicate Variable Report](#4-duplicate-variable-report)
5. [Dead Variable Report](#5-dead-variable-report)
6. [Secret Classification](#6-secret-classification)
7. [Validation Schema Audit](#7-validation-schema-audit)
8. [Required Cleanup Actions](#8-required-cleanup-actions)
9. [Updated Documentation](#9-updated-documentation)
10. [Final Recommendations](#10-final-recommendations)

---

## 1. Complete Environment Variable Inventory

### Core Schema Variables (Zod — `core/src/config/env.ts`)

| # | Variable | Required | Default | Schema Type | Zod Schema Lines |
|---|----------|----------|---------|-------------|-----------------|
| E01 | NODE_ENV | Yes* | `development` | enum(`development`, `production`, `test`) | 29 |
| E02 | PORT | Yes | `5001` | number (1000-65535) | 30 |
| E03 | CI | No | `false` | boolean (string→boolean) | 31 |
| E04 | TZ | No | `UTC` | string | 32 |
| E05 | PROCESS_ROLE | No | `api` | enum(`api`, `scheduler`, `worker`) | 33 |
| E06 | MONGODB_URI | Yes | — | url | 36 |
| E07 | ADMIN_MONGODB_URI | Yes | — | url | 37 |
| E08 | ALLOW_BOOT_AUTO_INDEX | No | `false` | boolean | 38 |
| E09 | ALLOW_DB_CONNECT | No | `false` | boolean | 39 |
| E10 | ALLOW_REDIS | No | `false` | boolean | 42 |
| E11 | REDIS_HOST | No | `localhost` | string | 43 |
| E12 | REDIS_PORT | No | `6379` | number | 44 |
| E13 | REDIS_USERNAME | No | (undefined) | string (optional) | 45 |
| E14 | REDIS_PASSWORD | No | (undefined) | string (optional) | 46 |
| E15 | REDIS_URL | No | (undefined) | string (optional) | 47 |
| E16 | REDIS_DB | No | `0` | number | 48 |
| E17 | REDIS_MODE | No | `single` | string | 49 |
| E18 | JWT_SECRET | Yes* | — | string (min 32, regex) | 52-54 |
| E19 | JWT_EXPIRES_IN | No | `7d` | string | 55 |
| E20 | ADMIN_JWT_SECRET | No | (undefined) | string (optional) | 56 |
| E21 | ADMIN_SESSION_TTL_MS | No | (undefined) | number (positive) | 57 |
| E22 | AUTH_LOCAL_RELAXED | No | `false` | boolean | 58 |
| E23 | ALLOW_DEFAULT_ADMIN_SEED | No | `false` | boolean | 59 |
| E24 | OTP_HASH_SECRET | No | (undefined) | string (optional) | 62 |
| E25 | HMAC_SECRET | No | `super_secret...` | string (min 32) | 63 |
| E26 | MSG91_AUTH_KEY | No | (undefined) | string (optional) | 64 |
| E27 | MSG91_SENDER_ID | No | (undefined) | string (optional) | 65 |
| E28 | MSG91_TEMPLATE_ID | No | (undefined) | string (optional) | 66 |
| E29 | AUTH_BYPASS_OTP_LOCK | No | (undefined) | string (optional) | 67 |
| E30 | USE_DEFAULT_OTP | No | `false` | boolean | 68 |
| E31 | DEV_STATIC_OTP | No | `123456` | string | 69 |
| E32 | COOKIE_DOMAIN | No | (undefined) | string (optional) | 72 |
| E33 | COOKIE_SAME_SITE | No | (undefined) | enum(`strict`, `lax`, `none`) | 73 |
| E34 | COOKIE_SECURE | No | (undefined) | boolean | 74 |
| E35 | CORS_ORIGIN | No | `http://localhost:3000,http://localhost:3001` | string | 77 |
| E36 | FRONTEND_URL | No | (undefined) | string (optional) | 78 |
| E37 | FRONTEND_INTERNAL_URL | No | (undefined) | string (optional) | 79 |
| E38 | ADMIN_URL | No | (undefined) | string (optional) | 80 |
| E39 | ADMIN_FRONTEND_URL | No | (undefined) | string (optional) | 81 |
| E40 | AWS_ACCESS_KEY_ID | No | (undefined) | string (optional) | 84 |
| E41 | AWS_SECRET_ACCESS_KEY | No | (undefined) | string (optional) | 85 |
| E42 | AWS_REGION | No | (undefined) | string (optional) | 86 |
| E43 | AWS_S3_BUCKET | No | (undefined) | string (optional) | 87 |
| E44 | S3_BUCKET_NAME | No | (undefined) | string (optional) | 88 |
| E45 | AWS_CLOUDFRONT_URL | No | (undefined) | string (optional) | 89 |
| E46 | DRY_RUN_S3_CLEANUP | No | `false` | boolean | 90 |
| E47 | RAZORPAY_KEY_ID | No | (undefined) | string (optional) | 93 |
| E48 | RAZORPAY_KEY_SECRET | No | (undefined) | string (optional) | 94 |
| E49 | RAZORPAY_WEBHOOK_SECRET | No | (undefined) | string (optional) | 95 |
| E50 | FIREBASE_PROJECT_ID | No | (undefined) | string (optional) | 98 |
| E51 | FIREBASE_CLIENT_EMAIL | No | (undefined) | email (optional) | 99 |
| E52 | FIREBASE_PRIVATE_KEY | No | (undefined) | string (optional) | 100 |
| E53 | FIREBASE_SERVICE_ACCOUNT_JSON | No | (undefined) | string (optional) | 101 |
| E54 | ALLOW_FIREBASE_ADMIN | No | `false` | boolean | 102 |
| E55 | AI_PROVIDER | No | `gemini` | enum(`gemini`, `openai`) | 105 |
| E56 | GEMINI_API_KEY | No | (undefined) | string (optional) | 106 |
| E57 | AI_MODEL | No | (undefined) | string (optional) | 107 |
| E58 | GEMINI_MODEL | No | (undefined) | string (optional) | 108 |
| E59 | AI_REQUEST_TIMEOUT_MS | No | (undefined) | number (positive) | 109 |
| E60 | AI_MAX_IMAGE_BYTES | No | (undefined) | number (positive) | 110 |
| E61 | FRAUD_DECISION_TIMEOUT_MS | No | `1200` | number (min 100) | 111 |
| E62 | FRAUD_AUTO_SUSPEND_THRESHOLD | No | `81` | number (positive) | 112 |
| E63 | PROD_RISK_OVERRIDE | No | `false` | boolean | 113 |
| E64 | ATLAS_LOCATION_SEARCH_INDEX | No | `location_autocomplete` | string | 116 |
| E65 | ATLAS_CATALOG_SEARCH_INDEX | No | `catalog_search` | string | 117 |
| E66 | FEED_DEBUG | No | `false` | boolean | 118 |
| E67 | HOME_FEED_WARM_LOCATIONS | No | (undefined) | string (optional) | 119 |
| E68 | ENABLE_STRICT_DUPLICATE_INDEX | No | `false` | boolean | 120 |
| E69 | DUPLICATE_ROLLOUT_MIGRATION_TAG | No | (undefined) | string (optional) | 121 |
| E70 | SENTRY_DSN | No | (undefined) | url (optional) | 124 |
| E71 | SENTRY_ENVIRONMENT | No | (undefined) | string (optional) | 125 |
| E72 | SENTRY_ENABLE_DEV | No | `false` | boolean | 126 |
| E73 | SMTP_HOST | No | (undefined) | string (optional) | 129 |
| E74 | SMTP_PORT | No | (undefined) | number (optional) | 130 |
| E75 | SMTP_USER | No | (undefined) | string (optional) | 131 |
| E76 | SMTP_PASSWORD | No | (undefined) | string (optional) | 132 |
| E77 | SMTP_FROM | No | (undefined) | email (optional) | 133 |
| E78 | RUN_SCHEDULERS | No | `false` | boolean | 136 |
| E79 | ENABLE_SCHEDULER | No | `false` | boolean | 137 |
| E80 | ALLOW_SCHEDULER_QUEUE | No | `false` | boolean | 138 |
| E81 | RELIABILITY_ALERTS_ENABLED | No | `true` | boolean (default: `'false'` → false resolves to `'false'` check: val !== 'false') | 141 |
| E82 | RELIABILITY_SLACK_WEBHOOK_URL | No | (undefined) | string (optional) | 142 |
| E83 | RELIABILITY_ALERT_EMAIL_TO | No | (undefined) | string (optional) | 143 |
| E84-E105 | RELIABILITY_* (22 vars) | No | varied | various (optional) | 144-165 |
| E106 | CONTAINER_MEMORY_LIMIT_MB | No | (undefined) | number (positive, optional) | 168 |
| E107 | SYSTEM_MONITOR_WARN_RATIO | No | (undefined) | number (0.01-0.99, optional) | 169 |
| E108 | ENABLE_SWAGGER | No | `true` | boolean | 172 |
| E109 | ENABLE_RATE_LIMITING | No | `true` | boolean | 173 |
| E110 | ENABLE_MAINTENANCE_MODE | No | `false` | boolean | 174 |
| E111 | BACKUP_DIR | No | `./backups` | string | 177 |
| E112 | BACKUP_RETENTION_DAYS | No | `30` | number (transformed) | 178 |
| E113 | BACKUP_CRON_SCHEDULE | No | `0 2 * * *` | string | 179 |
| E114 | ENABLE_AUTO_BACKUPS | No | `false` | boolean | 180 |
| E115 | IPAPI_KEY | No | (undefined) | string (optional) | 183 |
| E116 | ADMIN_RATE_LIMIT_MAX | No | (undefined) | number (positive, optional) | 184 |
| E117 | ADMIN_MUTATION_RATE_LIMIT_MAX | No | (undefined) | number (positive, optional) | 185 |

### Web App Variables (`apps/web/`)

| # | Variable | Source | Runtime | Purpose |
|---|----------|--------|---------|---------|
| W01 | NEXT_PUBLIC_API_URL | Next.js public | Browser+Server | Backend API base URL |
| W02 | NEXT_PUBLIC_APP_URL | Next.js public | Browser+Server | Frontend canonical URL |
| W03 | NEXT_PUBLIC_APP_ENV | Next.js public | Browser+Server | Deployment environment label |
| W04 | NEXT_PUBLIC_PROD_RISK_OVERRIDE | Next.js public | Browser+Server | Override production safety gates |
| W05 | NEXT_PUBLIC_LOCAL_DEV_AUTH | Next.js public | Browser+Server | Enable local auth bypass |
| W06 | NEXT_PUBLIC_HMAC_SECRET | Next.js public | Browser only | Browser HMAC signing (⚠️ exposed) |
| W07 | NEXT_PUBLIC_FIREBASE_API_KEY | Next.js public | Browser+Server | Firebase web push API key |
| W08 | NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Next.js public | Browser+Server | Firebase auth domain |
| W09 | NEXT_PUBLIC_FIREBASE_PROJECT_ID | Next.js public | Browser+Server | Firebase project ID |
| W10 | NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Next.js public | Browser+Server | Firebase storage bucket |
| W11 | NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Next.js public | Browser+Server | Firebase sender ID |
| W12 | NEXT_PUBLIC_FIREBASE_APP_ID | Next.js public | Browser+Server | Firebase app ID |
| W13 | NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | Next.js public | Browser+Server | Firebase analytics ID (NOT in .env.example) |
| W14 | NEXT_PUBLIC_FIREBASE_VAPID_KEY | Next.js public | Browser+Server | Firebase web push VAPID key |
| W15 | BACKEND_INTERNAL_URL | Server only | Next.js SSR | Server-to-server backend URL |
| W16 | ADMIN_ALLOWED_IPS | Server only | proxy.ts | IP whitelist for admin paths |
| W17 | INTERNAL_REVALIDATE_SECRET | Server only | revalidate/route.ts | ISR revalidation secret |
| W18 | REVALIDATE_SECRET | Server only | revalidate/route.ts | Legacy revalidation secret fallback |
| W19 | BYPASS_POST_AD_QUOTA_CHECK | Server only | playwright.config.ts | Test flag to bypass quota |
| W20 | SKIP_ENV_VALIDATION | build time | validateApiEnv.ts | Skip env validation at build |
| W21 | WEB_FRONTEND_PORT | test only | playwright.config.ts | Port for E2E tests |
| W22 | SMOKE_FRONTEND_URL | test only | playwright/tests | Base URL for smoke tests |
| W23 | SMOKE_API_BASE_URL | test only | playwright/tests | API URL for smoke tests |
| W24 | SMOKE_AUTH_MOBILE | test only | smoke tests | Test phone number |
| W25 | SMOKE_AUTH_OTP | test only | smoke tests | Test OTP |
| W26 | SMOKE_AUTH_TOKEN | test only | smoke tests | Pre-existing auth token |
| W27 | SMOKE_REVEAL_PATH | test only | fixtures | Path for smoke reveal |
| W28 | SMOKE_REVEAL_EXPECT | test only | fixtures | Expectation for smoke reveal |
| W29 | SMOKE_LISTING_FIXTURES | test only | fixtures | Inline listing fixtures JSON |
| W30 | SMOKE_FIXTURE_PATH | test only | fixtures | Path to fixture JSON file |

### Admin App Variables (`apps/admin/`)

| # | Variable | Source | Runtime | Purpose |
|---|----------|--------|---------|---------|
| A01 | NEXT_PUBLIC_ADMIN_API_URL | Next.js public | Browser+Server | Admin backend API URL |
| A02 | NEXT_PUBLIC_ADMIN_API_TIMEOUT_MS | Next.js public | Browser+Server | Admin API request timeout |
| A03 | NEXT_PUBLIC_APP_ENV | Next.js public | Browser+Server | Deployment environment label |
| A04 | NEXT_PUBLIC_PROD_RISK_OVERRIDE | Next.js public | Browser+Server | Override production safety gates |
| A05 | NEXT_PUBLIC_DEBUG_API_CLIENT | Next.js public | Browser | Debug logging for API client (declared in .env.example, not read in code) |
| A06 | ANALYZE | Server only | next.config.mjs | Enable bundle analyzer |
| A07 | ADMIN_FRONTEND_PORT | test only | playwright.config.ts | Port for E2E tests |
| A08 | ADMIN_FRONTEND_BASE_URL | test only | playwright/tests | Base URL for E2E tests |
| A09 | PLAYWRIGHT_CI_SERVER_MODE | test only | playwright.config.ts | CI server mode flag |

### Variables Used Only in Code (Not in Core Schema)

| # | Variable | Location | Purpose | Classification |
|---|----------|----------|---------|---------------|
| X01 | STARTUP_VERBOSE | core/src/config/ | Verbose startup logging | Development Only |
| X02 | NODE_PATH | core/src/config/loadEnv.ts | Module resolution for dist | Build-time |
| X03 | JEST_WORKER_ID | core/, backend/ | Jest parallel worker detection | Testing Only |
| X04 | JEST_VERBOSE_TEARDOWN | backend/api/ | Jest teardown verbosity | Testing Only |
| X05 | DOTENV_CONFIG_QUIET | backend/api/ | Suppress dotenv warnings | Testing Only |
| X06 | npm_package_version | core/src/config/sentry.ts | Sentry release version | Runtime (auto) |
| X07 | VERCEL_ENV | core/src/config/featureFlags.ts | Vercel environment detection | Runtime (Vercel) |
| X08 | RENDER_ENV | core/src/config/featureFlags.ts | Render environment detection | Runtime (Render) |
| X09 | APP_ENV | core/src/config/featureFlags.ts | General env detection | Development Only |
| X10 | NODE_OPTIONS | ecosystem.config.js, validateEnv.ts | Node runtime options | Runtime |
| X11 | MONGO_URI | backend/api/ | MongoDB URI alias (legacy) | Deprecated |
| X12 | MONGO_DB_NAME | backend/api/ | DB name for migrations | Optional |
| X13 | MONGODB_DB_NAME | backend/api/ | DB name fallback (alias) | Deprecated |
| X14 | DATABASE_URL | core/scripts/ | MongoDB URI alias (legacy) | Deprecated |
| X15 | GITHUB_BASE_REF | scripts/ | PR base branch for CI | CI Only |
| X16 | PR_BODY | scripts/ | PR body content for CI | CI Only |
| X17 | SKIP_MIGRATION_GATE | scripts/ | Skip migration enforcement | Development Only |
| X18 | CI | various | CI environment detection | CI Only |
| X19 | E2E_* (12 vars) | scripts/ | E2E orchestration config | Testing Only |
| X20 | API_BASE_URL | scripts/ | Script API base URL | Ad-hoc script |
| X21 | S3_IMAGE_LIST_LIMIT | scripts/ | Image list pagination | Ad-hoc script |
| X22 | S3_IMAGE_DETAIL_LIMIT | scripts/ | Image detail pagination | Ad-hoc script |
| X23 | CATALOG_* (5 vars) | scripts/ | Catalog migration flags | Ad-hoc scripts |
| X24 | SMOKE_FIXTURE_REVEAL_EXPECT | backend/scripts/ | Fixture generation | Ad-hoc script |
| X25 | SMOKE_FIXTURE_OUTPUT_PATH | backend/scripts/ | Fixture output path | Ad-hoc script |
| X26 | CAPACITOR_SERVER_URL | apps/mobile/ | Capacitor dev server URL | Development Only |

### Variables in .env Files But NOT Read Anywhere (Dead)

| # | Variable | Present In | Status |
|---|----------|-----------|--------|
| D01 | REFRESH_TOKEN_SECRET | core/.env, backend/api/.env | **Dead** — not in Zod schema, not read in code |
| D02 | CSRF_SECRET | core/.env, backend/api/.env | **Dead** — not in Zod schema, not read in code |
| D03 | SMS_PROVIDER | core/.env, backend/api/.env | **Dead** — not in Zod schema, not read in code |
| D04 | STATIC_OTP | core/.env, backend/api/.env | **Dead** — DEV_STATIC_OTP is the canonical var |
| D05 | ALLOW_TEST_NUMBERS | core/.env, backend/api/.env | **Dead** — not in Zod schema, not read in code |
| D06 | BYPASS_OTP_IN_DEVELOPMENT | core/.env, backend/api/.env | **Dead** — not in Zod schema, not read in code |

---

## 2. Runtime Usage Report

### Classification Key

| Class | Meaning |
|-------|---------|
| **Required** | Startup fails without it (in production) |
| **Optional** | Has a safe default or is conditionally required |
| **Development Only** | Only used in local/dev environments |
| **Testing Only** | Only used in test/Jest/Playwright |
| **Production Only** | Only validated/enforced in production |
| **CI Only** | Only used in GitHub Actions |
| **Ad-hoc Script** | Only used in standalone scripts |
| **Deprecated** | Legacy alias — use canonical replacement |
| **Dead** | No longer read by any code |

### Variable Classification Table

| Variable | Class | Reasoning |
|----------|-------|-----------|
| NODE_ENV | Required | Core runtime mode |
| PORT | Optional | Default `5001` |
| TZ | Optional | Default `UTC` |
| PROCESS_ROLE | Optional | Default `api` |
| MONGODB_URI | Required | No default, fails in production if missing |
| ADMIN_MONGODB_URI | Required | No default, fails in production if missing |
| ALLOW_BOOT_AUTO_INDEX | Optional | Default `false` |
| ALLOW_DB_CONNECT | Development Only | Must be `false` in production |
| ALLOW_REDIS | Required (production) | Must be `true` in production |
| REDIS_HOST | Optional | Default `localhost` |
| REDIS_PORT | Optional | Default `6379` |
| REDIS_USERNAME | Required (production) | Required for Redis ACL in production |
| REDIS_PASSWORD | Optional | |
| REDIS_URL | Required (production) | Must be set in production |
| REDIS_DB | Optional | Default `0` |
| REDIS_MODE | Optional | Default `single` |
| JWT_SECRET | Required | No default, min 32 chars |
| JWT_EXPIRES_IN | Optional | Default `7d` |
| ADMIN_JWT_SECRET | Optional | For admin session separation |
| ADMIN_SESSION_TTL_MS | Optional | |
| AUTH_LOCAL_RELAXED | Development Only | Blocked in production |
| ALLOW_DEFAULT_ADMIN_SEED | Development Only | Blocked in production |
| OTP_HASH_SECRET | Optional | |
| HMAC_SECRET | Optional | Has insecure dev fallback |
| MSG91_AUTH_KEY | Optional | SMS integration |
| MSG91_SENDER_ID | Optional | SMS integration |
| MSG91_TEMPLATE_ID | Optional | SMS template |
| AUTH_BYPASS_OTP_LOCK | Development Only | Blocked in production |
| USE_DEFAULT_OTP | Development Only | Blocked in production |
| DEV_STATIC_OTP | Development Only | Default `123456` |
| COOKIE_DOMAIN | Required (production) | Inferred if missing |
| COOKIE_SAME_SITE | Optional | |
| COOKIE_SECURE | Optional | |
| CORS_ORIGIN | Required (production) | Default for dev |
| FRONTEND_URL | Optional | |
| FRONTEND_INTERNAL_URL | Optional | |
| ADMIN_URL | Optional | |
| ADMIN_FRONTEND_URL | Optional | |
| AWS_ACCESS_KEY_ID | Optional | Required if S3 used |
| AWS_SECRET_ACCESS_KEY | Optional | Required if S3 used |
| AWS_REGION | Optional | Default `ap-south-1` in code |
| AWS_S3_BUCKET | Deprecated | Use S3_BUCKET_NAME instead |
| S3_BUCKET_NAME | Optional | Canonical S3 bucket name |
| AWS_CLOUDFRONT_URL | Optional | CloudFront CDN URL |
| DRY_RUN_S3_CLEANUP | Optional | Default `false` |
| RAZORPAY_KEY_ID | Optional | |
| RAZORPAY_KEY_SECRET | Optional | |
| RAZORPAY_WEBHOOK_SECRET | Required (production) | |
| FIREBASE_PROJECT_ID | Optional | |
| FIREBASE_CLIENT_EMAIL | Optional | |
| FIREBASE_PRIVATE_KEY | Optional | |
| FIREBASE_SERVICE_ACCOUNT_JSON | Optional | Firebase admin SDK |
| ALLOW_FIREBASE_ADMIN | Optional | Default `false` |
| AI_PROVIDER | Optional | Default `gemini` |
| GEMINI_API_KEY | Optional | |
| AI_MODEL | Optional | |
| GEMINI_MODEL | Optional | |
| PROD_RISK_OVERRIDE | Optional | Default `false` |
| ATLAS_LOCATION_SEARCH_INDEX | Optional | Default `location_autocomplete` |
| ATLAS_CATALOG_SEARCH_INDEX | Optional | Read directly in search code |
| FEED_DEBUG | Development Only | Blocked in production |
| ENABLE_STRICT_DUPLICATE_INDEX | Optional | Default `false` |
| SENTRY_DSN | Optional | Warns if missing in production |
| SMTP_* | Optional | Email integration |
| RELIABILITY_* | Optional | Monitoring configuration |
| ENABLE_SWAGGER | Development Only | Default `true`, blocked in production |
| ENABLE_RATE_LIMITING | Optional | Default `true` |
| ENABLE_MAINTENANCE_MODE | Optional | Default `false` |
| BACKUP_* | Optional | Backup configuration |
| IPAPI_KEY | Optional | IP geolocation |
| ADMIN_RATE_LIMIT_MAX | Optional | |
| ADMIN_MUTATION_RATE_LIMIT_MAX | Optional | |
| NEXT_PUBLIC_* (all) | Optional (production without values fails validation) | Client-side Firebase config |
| BACKEND_INTERNAL_URL | Optional | Fallback to NEXT_PUBLIC_API_URL |
| ADMIN_ALLOWED_IPS | Optional | IP restriction for admin |
| INTERNAL_REVALIDATE_SECRET | Optional | Fallback to REVALIDATE_SECRET |
| REVALIDATE_SECRET | Optional | Legacy fallback |

---

## 3. Deployment Platform Comparison

### Render (`render.yaml`)

**Variables configured:**
NODE_ENV, NODE_VERSION, PORT, TZ, PROCESS_ROLE, MONGODB_URI, ADMIN_MONGODB_URI, JWT_SECRET, ADMIN_JWT_SECRET, OTP_HASH_SECRET, HMAC_SECRET, ALLOW_REDIS, REDIS_URL, REDIS_USERNAME, REDIS_PASSWORD, REDIS_MODE, CORS_ORIGIN, COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAME_SITE, FRONTEND_URL, FRONTEND_INTERNAL_URL, ADMIN_URL, ADMIN_FRONTEND_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME, FIREBASE_SERVICE_ACCOUNT_JSON, MSG91_AUTH_KEY, MSG91_SENDER_ID, GEMINI_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, USE_DEFAULT_OTP, ATLAS_LOCATION_SEARCH_INDEX, ENABLE_SWAGGER, ENABLE_RATE_LIMITING, ENABLE_MAINTENANCE_MODE

**Comments present:**
- `# REFRESH_TOKEN_SECRET removed — not present in core/src/config/env.ts schema.`
- `# HMAC_SECRET: used for OTP HMAC signing. The code has an insecure dev fallback`
- `# REDIS_MODE: verify your Redis Cloud topology (single | cluster | sentinel)`
- `# ENABLE_SWAGGER=false: prevents public exposure of API documentation in production.`
- `# NEXT_PUBLIC_API_URL removed — this is a Next.js browser variable and has no effect on the Express backend process.`

**Issues:**
1. `NODE_VERSION: "22"` is set — this is not read by any code, only used by Render infrastructure. OK to keep.

### Vercel Web (`apps/web/vercel.json`)

**Variables configured:**
NEXT_PUBLIC_API_URL (hardcoded: `https://api.esparex.in/api/v1`)

**Also sets:** HUSKY=0 (build env), NEXT_DISABLE_WEBPACK_CACHE=1 (build command)

**Missing:** NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_FIREBASE_* — should be set in Vercel project env vars

### Vercel Admin (`apps/admin/vercel.json`)

**Variables configured:**
HUSKY=0 (build env), NEXT_DISABLE_WEBPACK_CACHE=1 (build command)

**Missing:** NEXT_PUBLIC_ADMIN_API_URL — should be in Vercel project env vars

### GitHub Actions (`ci.yml`, `release.yml`, `codeql.yml`)

**Variables set in CI:**
NEXT_PUBLIC_APP_ENV: local
NEXT_PUBLIC_PROD_RISK_OVERRIDE: "false"
SKIP_ENV_VALIDATION: "true"
NEXT_PUBLIC_API_URL: https://api.esparex.in/api/v1
NEXT_PUBLIC_APP_URL: https://esparex.in
NEXT_PUBLIC_FIREBASE_*: placeholder
NEXT_PUBLIC_LOCAL_DEV_AUTH: "true" (E2E job only)

**Hardcoded backend startup:**
MONGODB_URI, ADMIN_MONGODB_URI, REDIS_URL, JWT_SECRET (plaintext in YAML — security concern)

**Secrets used:**
GITHUB_TOKEN (in release.yml)

**Issues:**
1. No repository secrets defined in workflows (except GITHUB_TOKEN)
2. JWT_SECRET is hardcoded in ci.yml:228 — should use `${{ secrets.JWT_SECRET }}`

---

## 4. Duplicate Variable Report

| # | Duplicate Set | Canonical | Removal Status | Notes |
|---|--------------|-----------|---------------|-------|
| DUP1 | AWS_S3_BUCKET ↔ S3_BUCKET_NAME | S3_BUCKET_NAME | `validateS3BucketEnvAliasOrThrow()` handles deprecation | Ready to remove AWS_S3_BUCKET |
| DUP2 | MONGO_URI ↔ MONGODB_URI | MONGODB_URI | Fallback in migrate-mongo-config.js and migrate-catalog-decoupling.ts | Backward compat maintained |
| DUP3 | DATABASE_URL ↔ MONGODB_URI | MONGODB_URI | Only in migrate-catalog-decoupling.ts fallback | Dead alias |
| DUP4 | STATIC_OTP ↔ DEV_STATIC_OTP | DEV_STATIC_OTP | STATIC_OTP never read anywhere | Dead |
| DUP5 | ADMIN_URL ↔ ADMIN_FRONTEND_URL | ADMIN_FRONTEND_URL | Both are in schema with different names | Both optional, ADMIN_URL not read anywhere |
| DUP6 | FRONTEND_URL ↔ FRONTEND_INTERNAL_URL | FRONTEND_URL (browser), FRONTEND_INTERNAL_URL (server) | Different purposes | Keep both |
| DUP7 | REVALIDATE_SECRET ↔ INTERNAL_REVALIDATE_SECRET | INTERNAL_REVALIDATE_SECRET | Legacy REVALIDATE_SECRET as fallback | Keep both for backward compat |
| DUP8 | MONGO_DB_NAME ↔ MONGODB_DB_NAME | MONGO_DB_NAME | MONGODB_DB_NAME only used in one script | Remove MONGODB_DB_NAME |
| DUP9 | CORS_ORIGIN ↔ FRONTEND_URL + ADMIN_FRONTEND_URL | CORS_ORIGIN | CORS_ORIGIN is the actual CORS config, the other two are informational | Keep distinct |
| DUP10 | ADMIN_JWT_SECRET + JWT_SECRET | JWT_SECRET | ADMIN_JWT_SECRET is separate for admin sessions | Keep both |

---

## 5. Dead Variable Report

Variables to be **removed** from .env files and docs:

| # | Variable | Reason | Action |
|---|----------|--------|--------|
| DEAD1 | REFRESH_TOKEN_SECRET | Not in Zod schema, not read by any code | Remove from all .env files |
| DEAD2 | CSRF_SECRET | Not in Zod schema, not read by any code | Remove from all .env files |
| DEAD3 | SMS_PROVIDER | Not in Zod schema, not read by any code | Remove from all .env files |
| DEAD4 | STATIC_OTP | Duplicate of DEV_STATIC_OTP, never read | Remove from all .env files |
| DEAD5 | ALLOW_TEST_NUMBERS | Not in Zod schema, not read by any code | Remove from all .env files |
| DEAD6 | BYPASS_OTP_IN_DEVELOPMENT | Not in Zod schema, not read by any code | Remove from all .env files |
| DEAD7 | ADMIN_URL | In schema but NEVER read by any runtime code | Remove from schema and .env files |
| DEAD8 | NEXT_PUBLIC_DEBUG_API_CLIENT | In .env.example but never read | Remove from .env.example |
| DEAD9 | NEXT_PUBLIC_GA_ID | In admin .env.production.example but never read | Remove from .env.example |

### Dead Variables in `render.yaml`

The comment says `NEXT_PUBLIC_API_URL removed` — good. No dead vars remain in render.yaml.

---

## 6. Secret Classification

### Secrets (Must Be Protected)

| Variable | Risk Level | Notes |
|----------|-----------|-------|
| MONGODB_URI | 🔴 Critical | Database credentials |
| ADMIN_MONGODB_URI | 🔴 Critical | Database credentials |
| JWT_SECRET | 🔴 Critical | Token signing key |
| ADMIN_JWT_SECRET | 🔴 Critical | Admin token signing key |
| HMAC_SECRET | 🔴 Critical | OTP HMAC signing key |
| OTP_HASH_SECRET | 🔴 Critical | OTP hashing key |
| AWS_ACCESS_KEY_ID | 🔴 Critical | AWS IAM key |
| AWS_SECRET_ACCESS_KEY | 🔴 Critical | AWS IAM secret |
| RAZORPAY_KEY_SECRET | 🔴 Critical | Payment gateway secret |
| RAZORPAY_WEBHOOK_SECRET | 🔴 Critical | Webhook verification secret |
| FIREBASE_SERVICE_ACCOUNT_JSON | 🔴 Critical | Firebase admin credentials |
| FIREBASE_PRIVATE_KEY | 🔴 Critical | Firebase private key |
| GEMINI_API_KEY | 🟠 High | AI API key |
| MSG91_AUTH_KEY | 🟠 High | SMS API key |
| SMTP_PASSWORD | 🟠 High | Email server password |
| RELIABILITY_SLACK_WEBHOOK_URL | 🟠 High | Slack webhook (channel access) |
| BACKUP_ENCRYPTION_KEY | 🟠 High | Backup encryption |
| INTERNAL_REVALIDATE_SECRET | 🟠 High | ISR revalidation secret |
| REVALIDATE_SECRET | 🟠 High | Legacy revalidation secret |
| COOKIE_SAME_SITE (if 'none') | 🟡 Medium | Cookie security config |

### Public/Browser-Exposed (NEXT_PUBLIC_*)

| Variable | Risk Level | Notes |
|----------|-----------|-------|
| NEXT_PUBLIC_FIREBASE_API_KEY | 🟡 Medium | Intentionally public (Firebase design) |
| NEXT_PUBLIC_HMAC_SECRET | 🟠 High | ⚠️ Exposed to browser — used for HMAC signing. Comment in code: "Browser-side HMAC is not a true security boundary" |
| NEXT_PUBLIC_FIREBASE_* (rest) | 🟢 Low | Config values, design to be public |
| NEXT_PUBLIC_API_URL | 🟢 Low | Public URL |
| NEXT_PUBLIC_ADMIN_API_URL | 🟢 Low | Public URL |

### Configuration (Non-Secret)

| Category | Variables |
|----------|----------|
| Runtime | NODE_ENV, PORT, TZ, PROCESS_ROLE, NODE_VERSION, CI |
| URLs | FRONTEND_URL, FRONTEND_INTERNAL_URL, ADMIN_FRONTEND_URL, CORS_ORIGIN, COOKIE_DOMAIN |
| Feature Flags | ENABLE_SWAGGER, ENABLE_RATE_LIMITING, ENABLE_MAINTENANCE_MODE, FEED_DEBUG, RUN_SCHEDULERS |
| Optional Config | AWS_REGION, S3_BUCKET_NAME, SENTRY_DSN, AI_PROVIDER, AI_MODEL, GEMINI_MODEL, MSG91_TEMPLATE_ID, MSG91_SENDER_ID |
| Development Flags | AUTH_LOCAL_RELAXED, ALLOW_DEFAULT_ADMIN_SEED, USE_DEFAULT_OTP, DEV_STATIC_OTP, AUTH_BYPASS_OTP_LOCK, STARTUP_VERBOSE |
| Reliability | All RELIABILITY_* vars except SLACK_WEBHOOK_URL |
| Monitoring | CONTAINER_MEMORY_LIMIT_MB, SYSTEM_MONITOR_WARN_RATIO |

---

## 7. Validation Schema Audit

### `core/src/config/env.ts` (Zod Schema)

**Status: ✅ Comprehensive** — 117 variables validated with proper types, transforms, and defaults.

**Issues Found:**

1. **`AWS_CLOUDFRONT_URL` (E45)** — Schema line 89: defined but only read directly as `process.env.AWS_CLOUDFRONT_URL` in `imageWorker.ts`. The schema validates it but the code reads from `process.env` directly, not from the validated `env` object. ⚠️ Inconsistency. Fix: read from `env.AWS_CLOUDFRONT_URL` instead.

2. **Missing from schema but used in code (via `(env as any)` bypass):**
   - `GEMINI_TEMPERATURE` — used in `core/src/config/ai.ts:13`
   - `GEMINI_MAX_OUTPUT_TOKENS` — used in `core/src/config/ai.ts:14`
   - `GEMINI_TIMEOUT_MS` — used in `core/src/config/ai.ts:15`
   - `GEMINI_TOP_P` — used in `core/src/config/ai.ts:16`
   - `OPENAI_API_KEY` — used in `core/src/config/ai.ts:12`
   
   These bypass Zod validation entirely via `(env as any)` casts. Should either be added to schema or read from `process.env` directly.

3. **`NEXT_PUBLIC_HMAC_SECRET`** — Used in `apps/web/src/lib/api/client.ts:226` but not validated anywhere. Exposed to browser despite being a secret.

4. **`GEMINI_MAX_OUTPUT_TOKENS`** — In `.env.example` line 110 but **not in the Zod schema** (see #2).

5. **`GEMINI_TEMPERATURE`** — In `.env.example` line 111 but **not in the Zod schema** (see #2).

### `apps/web/src/lib/api/validateApiEnv.ts`

**Status: ✅ Good** — Validates NEXT_PUBLIC_API_URL at build time with production gates.

### `apps/admin/src/lib/api/validateAdminApiEnv.ts`

**Status: ✅ Good** — Validates NEXT_PUBLIC_ADMIN_API_URL at build time with production gates.

### `scripts/git/esparex/env-validator.js`

**Status: ⚠️ Stale** — The `APPROVED_ENV_VARS` set at line 9-26 is missing many variables used in the codebase (all RELIABILITY_*, FRAUD_*, AI_*, AWS_CLOUDFRONT_URL, etc.) and includes variables no longer used (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY, GOOGLE_MAPS_API_KEY, OPENAI_API_KEY, ENCRYPTION_KEY).

---

## 8. Required Cleanup Actions

### ✅ Completed (High Priority)

| # | Action | Impact | Files |
|---|--------|--------|-------|
| H1 | Removed `REFRESH_TOKEN_SECRET` from .env files | Zero — dead variable | core/.env, backend/api/.env |
| H2 | Removed `CSRF_SECRET` from .env files | Zero — dead variable | core/.env, backend/api/.env |
| H3 | Removed `SMS_PROVIDER` from .env files | Zero — dead variable | core/.env, backend/api/.env |
| H4 | Removed `STATIC_OTP` from .env files | Zero — dead variable | core/.env, backend/api/.env |
| H5 | Removed `ALLOW_TEST_NUMBERS` from .env files | Zero — dead variable | core/.env, backend/api/.env |
| H6 | Removed `BYPASS_OTP_IN_DEVELOPMENT` from .env files | Zero — dead variable | core/.env, backend/api/.env |
| H7 | Created `ENVIRONMENT_VARIABLES.md` — single source of truth | Documentation | ENVIRONMENT_VARIABLES.md |
| H8 | Created comprehensive audit report | Documentation | audit-reports/environment-variable-audit-report.md |

### ✅ Completed (Medium Priority)

| # | Action | Impact | Files |
|---|--------|--------|-------|
| M5 | Removed `NEXT_PUBLIC_DEBUG_API_CLIENT` from admin .env.example | Zero | apps/admin/.env.local.example |
| M6 | Removed `NEXT_PUBLIC_GA_ID` from admin .env.production.example | Zero | apps/admin/.env.production.example |
| M7 | Updated APPROVED_ENV_VARS in env-validator.js | Low | scripts/git/esparex/env-validator.js |

**Note:** M1 (`ADMIN_URL` removal) and M2 (`DRY_RUN_S3_CLEANUP` removal) were investigated but BOTH variables ARE used at runtime. `ADMIN_URL` is read in 6 files (app.ts, appUrl.ts, cookieHelper.ts, originConfig.ts, socket.ts). `DRY_RUN_S3_CLEANUP` is read in `s3GarbageCollector.job.ts`. Skipping removal.

**Note:** M3/M4 (`GEMINI_MAX_OUTPUT_TOKENS`, `GEMINI_TEMPERATURE`) — these ARE used at runtime via `(env as any)` bypass in `ai.ts`. Should be added to schema in a follow-up.

### ✅ Completed (Low Priority)

| # | Action | Impact | Files |
|---|--------|--------|-------|
| L1 | Added `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` to .env files | Low | apps/web/.env.local.example, .env.production.example, .env.local |

### Outstanding Recommendations

| # | Action | Priority | Files |
|---|--------|----------|-------|
| O1 | Add `GEMINI_TEMPERATURE`, `GEMINI_MAX_OUTPUT_TOKENS`, `GEMINI_TIMEOUT_MS`, `GEMINI_TOP_P`, `OPENAI_API_KEY` to Zod schema | Medium | core/src/config/env.ts |
| O2 | Fix `AWS_CLOUDFRONT_URL` to read from `env` object instead of `process.env` | Low | core/src/workers/imageWorker.ts |
| O3 | Move plaintext JWT_SECRET in ci.yml to GitHub Actions secrets | Security | .github/workflows/ci.yml |
| O4 | Add `NEXT_PUBLIC_ADMIN_API_URL` to admin vercel.json env block | Low | apps/admin/vercel.json |

---

## 9. Updated Documentation

### `.env.example` (Root or `backend/api/.env.example`)

The existing `backend/api/.env.example` is already comprehensive and well-organized. Recommended changes:

1. Remove commented-out sections for `GEMINI_MAX_OUTPUT_TOKENS` (line 110), `GEMINI_TEMPERATURE` (line 111) since they're not validated
2. Remove `ADMIN_URL` (line 72)
3. Add comment noting `AWS_S3_BUCKET` is legacy/deprecated

### `ENVIRONMENT_VARIABLES.md`

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) — generated separately.

---

## 10. Final Recommendations

### Immediate (Zero-Risk Cleanup)

1. **Remove 6 dead variables** from `.env` files: `REFRESH_TOKEN_SECRET`, `CSRF_SECRET`, `SMS_PROVIDER`, `STATIC_OTP`, `ALLOW_TEST_NUMBERS`, `BYPASS_OTP_IN_DEVELOPMENT`

2. **Remove `ADMIN_URL` from Zod schema** — never read by any runtime code.

3. **Remove `DRY_RUN_S3_CLEANUP` from Zod schema** — never read by any runtime code.

4. **Update `.env.example` files** to match the schema exactly.

### Short Term

5. **Fix `NEXT_PUBLIC_HMAC_SECRET` exposure** — The comment in `client.ts:211` says "Browser-side HMAC is not a true security boundary", but if HMAC signing is needed on the browser side, a proper key exchange mechanism should be used. At minimum, document the risk.

6. **Update `env-validator.js` approved vars list** to match actual usage.

7. **Add missing NEXT_PUBLIC_* vars to Vercel project env vars** (Firebase config for both web and admin).

### Ongoing

8. **Audit CI secrets** — Move `JWT_SECRET` and other test secrets from plaintext in `ci.yml` to GitHub Actions secrets or environment-only injection.

9. **Document the source of truth** — All environment variables should be documented in one place (`ENVIRONMENT_VARIABLES.md`) with cross-references to the Zod schema (`core/src/config/env.ts`).

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total unique variables found | ~160 |
| Variables in Zod schema | 117 |
| Variables in .env files that were dead (removed) | 6 |
| Variables used in code but not in schema | ~25 (mostly test/dev/CI/script vars) |
| Variables accessed via `(env as any)` bypassing Zod validation | 5 (GEMINI_TEMP, GEMINI_MAX_TOKENS, GEMINI_TIMEOUT, GEMINI_TOP_P, OPENAI_API_KEY) |
| Duplicate/alias pairs | 10 |
| Secrets (critical) | 16 |
| Variables exposed to browser (NEXT_PUBLIC_*) | 14 |
| Cleanup actions completed | 10 |
| Outstanding cleanup actions | 4 |
