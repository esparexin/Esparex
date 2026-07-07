# Architecture Stabilization Plan

## Current Recovery State

- Root workspace metadata has been restored: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, and root `tsconfig.json`.
- Package manifests have been restored for `apps/server`, `packages/shared`, and the referenced local packages `@mad/types`, `@mad/ui`, `@mad/utils`, and `@mad/validations`.
- Generated artifacts are now ignored and removed from git tracking: `.turbo`, `.next`, `dist`, generated PWA service workers, and `apps/server/.env`.
- Committed merge conflict markers have been removed from the known conflicted source files.
- Source-map recovery is limited: the committed sourcemaps do not include `sourcesContent`, so original TypeScript cannot be faithfully restored from them. Missing server files must be reconstructed from compiled JS plus manual review.

## Phase 0: Repository Integrity

Files:
- `.gitignore`
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `apps/*/.env.example`

Rules:
- Never track `.env`, `.next`, `.turbo`, `dist`, `node_modules`, generated `sw.js`, or generated `workbox-*.js`.
- CI must fail on conflict markers using `rg -n '^(<<<<<<<|=======|>>>>>>>)'`.
- CI must fail if generated artifacts are tracked using `git ls-files .turbo '**/.next/**' '**/dist/**' '**/node_modules/**'`.

Rollback:
- Revert only the metadata commit if workspace restoration causes install issues.
- Do not re-add generated artifacts; regenerate them from a clean build.

## Phase 1: Missing Source Recovery

Files to reconstruct first from `apps/server/dist/apps/server/src`:
- `apps/server/src/config/env.ts`
- `apps/server/src/config/redis.ts`
- `apps/server/src/config/socket.ts`
- `apps/server/src/config/razorpay.ts`
- `apps/server/src/config/stripe.ts`
- `apps/server/src/middleware/error.middleware.ts`
- `apps/server/src/middleware/rate.middleware.ts`
- `apps/server/src/middleware/correlation.middleware.ts`
- `apps/server/src/utils/response.ts`
- `apps/server/src/utils/jwt.ts`
- `apps/server/src/controllers/public/payment.controller.ts`
- all missing admin/public route and controller files imported by `apps/server/src/routes/index.ts`
- missing models referenced by payment and booking services: `Payment`, `Ticket`, `Coupon`, `Notification`, venue/user/admin/content schemas

Acceptance:
- `pnpm install --frozen-lockfile` succeeds after a lockfile is committed.
- `pnpm --filter @mad/shared build` succeeds.
- `pnpm --filter @mad/server type-check` reaches real type errors only, not missing-file errors.

## Phase 2: Payment Hardening

Files:
- `apps/server/src/controllers/public/payment.controller.ts`
- `apps/server/src/services/public/payment.service.ts`
- `apps/server/src/models/payment.schema.ts`
- `apps/server/src/routes/public/payment.routes.ts`
- `apps/server/src/app.ts`

Required fixes:
- Add raw-body handling for `/api/payments/webhook/stripe` and `/api/payments/webhook/razorpay` before global JSON parsing.
- Verify Razorpay webhook signatures with `RAZORPAY_WEBHOOK_SECRET`.
- Verify Stripe webhooks with `STRIPE_WEBHOOK_SECRET`.
- Persist webhook event IDs with unique indexes for replay protection.
- Make payment finalization idempotent with atomic updates on `{ bookingId, status }`.
- Require booking ownership for `create-intent` and `verify`; guest checkout needs a signed checkout token, not just a booking ID.

Rollback:
- Keep existing manual verification endpoint behind strict ownership checks while webhooks are introduced.
- Deploy webhook processing in observe-only mode first, then enable finalization.

## Phase 3: Booking And Socket Authorization

Files:
- `apps/server/src/sockets/index.ts`
- `apps/server/src/config/socket.ts`
- `apps/server/src/services/public/booking.service.ts`
- `apps/web/src/providers/socket.provider.tsx`
- `apps/web/src/app/events/[slug]/event-detail-client.tsx`

Required fixes:
- Replace client-controlled `sessionId` with a server-issued signed seat-lock token.
- Authorize `booking:join` using authenticated user ownership or signed guest checkout token.
- Validate socket payloads with schemas and rate limits.
- Bind seat locks to `{ eventId, seatId, token subject }`, not arbitrary client strings.
- Move multi-seat lock acquisition to an atomic Redis Lua script or equivalent transaction.

## Phase 4: Redis Degraded Mode

Files:
- `apps/server/src/config/env.ts`
- `apps/server/src/config/redis.ts`
- `apps/server/src/server.ts`
- `apps/server/src/services/public/booking.service.ts`
- `apps/server/src/sockets/index.ts`

Required fixes:
- Make Redis optional for server startup.
- Public read APIs must run without Redis.
- Seat locking must return `503 seat locking unavailable` when Redis is down.
- Health checks should report degraded Redis separately from API/database health.

## Phase 5: Frontend/Backend Env Sync

Files:
- `apps/web/.env.example`
- `apps/admin/.env.example`
- `apps/web/src/lib/api/client.ts`
- `apps/admin/src/lib/api/client.ts`
- `apps/web/src/providers/socket.provider.tsx`
- `apps/admin/src/components/admin-realtime-sync.tsx`

Required fixes:
- Align frontend defaults to server port `5001`.
- Add runtime checks for missing Razorpay public key.
- Keep all frontend public env variables prefixed with `NEXT_PUBLIC_`.

## Phase 6: CI/CD Governance

Required checks:
- `pnpm install --frozen-lockfile`
- `pnpm build`
- `pnpm type-check`
- conflict marker scan
- generated artifact tracking scan
- secret scan for `.env`, private keys, and payment secrets
- smoke test for health, event listing, booking creation, payment intent creation, and webhook replay rejection
