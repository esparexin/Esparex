# Esparex v1.0.0 Beta Release Notes

**Target Milestone**: `v1.0.0-beta`  
**Target Release Date**: August 2026  
**Commit SHA**: `cf467f31e44981ec9725196f8a29349337874f7f`  

---

## Key Highlights

- **Post Ad 2.0 Wizard**: 4-step streamlined listing creation flow with Zod validation, auto-draft recovery, and WebP image optimization.
- **Single-Instance Responsive UI**: Unified responsive layouts across Web and Mobile with zero component duplication (`hidden md:flex`).
- **Platform Reliability Probes**: Express `/health/liveness` and `/health/readiness` endpoints monitoring Redis & MongoDB connectivity.
- **Design System SSOT**: 100% design token compliance across all 11 workspace packages with 0 suppressions.
- **High-Performance Feeds**: `@shopify/flash-list` mobile feed rendering for 60fps scrolling performance.

---

## Included Deliverables Matrix

| Pillar | Capability | Status | Reference |
|---|---|:---:|---|
| **Marketplace Experience** | Post Ad 2.0 Wizard | ✅ Beta Ready | `apps/web`, `apps/mobile` |
| **Marketplace Experience** | Search & Keyword Matching | ✅ Beta Ready | `@esparex/core` AdQueryService |
| **Platform Reliability** | Express Health Probes | ✅ Beta Ready | `backend/api/src/routes/health.ts` |
| **Performance** | FlashList Feed Integration | ✅ Beta Ready | `apps/mobile/src/features/listings` |
| **Security** | CORS & Secure Cookies | ✅ Beta Ready | `backend/api` Middleware |

---

## Engineering & Reliability Notes

- **CI lifecycle fix — recurring 45-minute workflow cancellation eliminated**: The `Esparex CI / Lint, Test, and Build Monorepo` smoke step booted the full backend and never exited, so GitHub killed runs at the job timeout. The backend lifecycle is now explicit (`bootstrap()` → `startListener()` → `shutdownServer()`) with a dedicated bounded smoke entrypoint (`backend/api/src/smoke.ts`) that verifies the real `/health` endpoint and shuts down cleanly in ~1s. Reference `EA-034`.
