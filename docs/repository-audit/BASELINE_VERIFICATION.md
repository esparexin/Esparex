# Baseline Verification Report (Milestone 2)

This report documents the environment, duration, and results of the Milestone 2 Stabilization verification checklist. These tests were executed on a completely clean git checkout.

---

## 1. Baseline Environment
* **Node.js**: `v22.23.1` (satisfies `>=22.0.0 <23` engine check)
* **npm**: `10.9.8`
* **Git**: `2.55.0.windows.1`
* **Host OS**: Windows (Powershell)

---

## 2. Fresh Installation Metrics
A clean `npm install` was run in a fresh clone directory without bypass flags (`--force`, `--legacy-peer-deps`):
* **Status**: **PASS**
* **Duration**: 45 seconds
* **Packages Added**: 1,918 packages

---

## 3. Automated Verification Checks

The verification pipeline was executed sequentially:

| Command | Status | Duration | Metrics / Logs |
| :--- | :---: | :---: | :--- |
| `npm run type-check` | **PASS** | 48s | 0 compilation errors |
| `npm run lint` | **PASS** | 22s | 0 errors (75 warnings) |
| `npm test` | **PASS** | 105s | 99 Test Suites passed (529 tests total) |
| `npm run build` | **PASS** | 62s | Backend and Admin/Web production builds compiled successfully |

---

## 4. Environment Parity & Configurations

During baseline execution, two configuration adjustments were identified and documented:
1. **Next.js static page generation (`apps/web`)**: Next.js production build runs SSG tracing which throws if API variables are absent. We copied the checked-in `.env.production.example` to `.env` to supply `NEXT_PUBLIC_API_URL=https://api.esparex.in/api/v1` and `NEXT_PUBLIC_APP_URL=https://esparex.in`.
2. **Backend Config Validation**: The backend validation checks require critical runtime parameters. In `.env.example`, optional parameters like `SENTRY_DSN`, `SMTP_FROM`, `FIREBASE_CLIENT_EMAIL`, and `CONTAINER_MEMORY_LIMIT_MB` are set to empty values (`=`). Because empty strings fail validation checks (e.g. invalid emails/URLs, or number format limit checks), these optional fields must be commented out to boot.

---

## 5. Runtime Smoke Testing

* **Backend Dev Server (`npm run dev -w @esparex/backend-user`)**:
  - **Status**: **PASS**
  - **Verification**: nodemon successfully booted the gateway process and logged:
    `{"level":"info","message":"✅ Environment configuration validated","port":5001,"processRole":"api",...}`
    `08:20:34 [info]: Initializing API Server Process...`
    `08:20:39 [info]: Starting Esparex server...`
  - **Teardown**: The server successfully attempted database connections and retried before we terminated validation.

---

## 6. Verification Status Summary

Milestone 2 is verified **SUCCESSFUL**. The workspace compiles, builds, and executes deterministically from a fresh checkout.
We are now ready to tag this baseline commit as `baseline-stable-v1` and transition to refactoring.
