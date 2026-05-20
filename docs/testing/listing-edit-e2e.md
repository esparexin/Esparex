# Listing Edit — E2E Test Strategy

> **Suite:** `apps/web/tests/edit-listing.spec.ts`  
> **Status:** ✅ Production-ready — 6/6 passing, parallel-verified

---

## Overview

This document describes the end-to-end test strategy for the **Edit Listing** feature. Tests exercise the full browser-layer workflow: authentication, data hydration, form interaction, image upload/removal, sensitive-change detection, validation, and network failure recovery.

All backend API calls are intercepted by Playwright route mocks. No live backend or database is required.

---

## Test Matrix

| # | Test Name | Scenario | Sensitive Change? |
|---|-----------|----------|:-----------------:|
| 1 | Load Existing Listing & Locked Identity Fields | Page hydrates with existing data; Step 1 fields are locked | — |
| 2 | (combined with 1) | Category/brand/model buttons are disabled in edit mode | — |
| 3 | Non-Sensitive Edit | Submit with unchanged sensitive fields; listing stays `live` | ❌ |
| 4 | Sensitive Edit (Triggers Re-review) | Change title → listing transitions to `pending` | ✅ |
| 5 | Remove Existing Image | Remove one of two existing images | ✅ |
| 6 | (combined with 5) | Upload a new replacement image; blob preview appears | ✅ |
| 9 | Validation Errors | Clear title → submit → validation error visible | — |
| 10 | Network Failure Recovery | PUT aborted → error indicator shown to user | — |

---

## Architecture

### Mock Layer

All API mocks are registered in `test.beforeEach` using **regex patterns** to ensure interception regardless of host resolution (`localhost` vs `127.0.0.1`).

| Endpoint | Mock | Reason |
|----------|------|--------|
| `/api/v1/health` | `{ success: true, status: "ok" }` | Unblocks `apiClient.checkHealth()` in `AuthContext` |
| `/api/v1/csrf-token` | `{ csrfToken: "..." }` | Required for state-changing PUT requests |
| `/api/v1/users/me` | `mockUser` envelope | Establishes authenticated session in `AuthContext` |
| `/api/v1/users/saved-ads` | `[]` envelope | Background fetch — must not 404 |
| `/api/v1/listings/:id` (GET) | `mockListing` envelope | Hydrates `EditAdWrapper` |
| `/api/v1/listings/:id/edit` (PUT) | Dynamic — returns `pending`/`live` based on diff | Default edit handler |
| `/api/v1/catalog/**` | Static catalog fixtures | Populates Step 1 dropdowns |
| `/api/upload/ad-image` | `{ success: true, url: "..." }` | Satisfies `useImageUploadWorkflow` |

### Auth Simulation

Two mechanisms work together to prevent auth redirects:

1. **Cookie injection** (`page.context().addCookies`) — satisfies the Next.js server-side `initialHasAuthCookie` check in `PrivateLayout`
2. **`localStorage` hint** (`page.addInitScript`) — satisfies `AuthContext`'s client-side `esparex_user_session` check

### Hydration Gate (`gotoEditPage`)

The helper navigates and waits for `.edit-ad-wrapper` to be visible (timeout: 25 s). This CSS class is applied only after `EditAdWrapper` successfully fetches and initialises the listing, guaranteeing that all tests start from a fully hydrated state.

---

## Running Locally

```bash
# Full suite — 4 parallel workers (~8 s)
npm run e2e:listing-edit

# Single test
cd apps/web && npx playwright test tests/edit-listing.spec.ts -g "3. Non-Sensitive Edit"

# With headed browser (debug)
cd apps/web && npx playwright test tests/edit-listing.spec.ts --headed --workers=1
```

> **Prerequisite:** The Next.js dev server must be running on `localhost:3000` (`npm run dev -w @esparex/apps-web`).

---

## CI Integration

The suite runs as a dedicated `e2e-listing-edit` job in `.github/workflows/ci.yml`, gated after the `ci` job (lint + unit tests + build).

```
ci ──────► e2e-listing-edit
           (build prod, start server, run at workers=1, upload artifacts on failure)
```

CI uses `workers: 1` to avoid race conditions on GitHub-hosted runners. Locally, `workers: 4` is used for speed.

| Setting | Local | CI |
|---------|-------|----|
| `workers` | 4 | 1 |
| `retries` | 0 | 2 |
| `actionTimeout` | 10 s | 15 s |
| Reporter | `list` | `list` + `github` |

---

## Design Decisions

### Why regex mocks instead of glob patterns?

Playwright's glob `**` patterns only match the path segment after the last `/`. Regex patterns (`/\/api\/v1\/health/`) match anywhere in the URL, making interception reliable regardless of whether the browser resolves `localhost` or `127.0.0.1`.

### Why `workers: 1` in CI?

GitHub Actions runners share CPU with the Next.js server process. Running tests in parallel causes CPU contention, leading to flaky timeouts. Single-worker serial execution is deterministic and completes in ~14 s.

### Why is there no `networkidle` wait?

Next.js HMR WebSocket connections prevent `networkidle` from ever resolving in dev mode. The suite uses `.edit-ad-wrapper` visibility as the hydration signal instead.

### Image upload flow

The `useImageUploadWorkflow` hook compresses images and generates a blob preview asynchronously. Tests wait for `img[src^="blob:"]` to appear before clicking Save to ensure the async pipeline has completed before the PUT is sent.

---

## Known Limitations

- **Mobile Chrome project:** Not included in E2E CI job (Pixel 5 viewport has not been validated for the edit wizard layout). To enable, add `--project=mobile-chrome` to the CI script.
- **S3 remote images:** Existing listing images (`esparex.s3.amazonaws.com`) emit `net::ERR_BLOCKED_BY_ORB` in tests. This is expected and benign — the images are mocked at the upload layer only.
- **No live backend validation:** Server-side field constraints (e.g. max title length enforced by Mongoose) are not exercised. These are covered by the `AdUpdateService.spec.ts` unit test suite.

---

## Related Files

| File | Purpose |
|------|---------|
| `apps/web/tests/edit-listing.spec.ts` | This E2E suite |
| `apps/web/playwright.config.ts` | Playwright configuration |
| `core/src/__tests__/services/AdUpdateService.spec.ts` | Backend unit tests for update logic |
| `apps/web/src/components/user/post-ad/hooks/useImageUploadWorkflow.ts` | Image upload hook |
| `apps/web/src/components/user/post-ad/EditAdWrapper.tsx` | Listing hydration component |
| `.github/workflows/ci.yml` | CI pipeline definition |
