# Sprint 5 — Feature Delivery & Production Readiness Plan

**Sprint Objective**

Drive user-facing marketplace feature completion (Post Ad 2.0, Spare Parts Marketplace, Search & Filters, Real-time Chat) supported by production readiness engineering (health endpoints, security hardening, FlashList feed performance) and lightweight release packaging.

**Sprint Theme**

> Product Features • Production Reliability • Security • Release Readiness

---

# Priority 1 — User-Facing Product Features (FEAT-001)

- **Post Ad 2.0 Wizard Polish**: Finalize 4-step listing creation flow (Category ➔ Brand ➔ Model ➔ Parts), image upload preview states, draft auto-recovery, and Zod contract validation.
- **Spare Parts Marketplace & Search**: Complete category hierarchy filters, search keyword matching, and watchlists.
- **Chat & Notifications Polish**: Real-time message delivery feedback, unread indicators, and push notification triggers.
- **Business Profiles & Verification**: Finalize business registration wizards, document upload verification, and seller subscriptions.

---

# Priority 2 — Production Readiness & Operations

## Phase 0 — Health Checks & Observability (OPS-001)
- Express `/health/liveness` and `/health/readiness` endpoints in `backend/api`.
- MongoDB & Redis active connection health probes.
- Sentry error tracking & correlation ID request middleware.

## Phase 1 — Feed Performance Optimization (PERF-002)
- Migrate mobile `MarketplaceScreen` and `MyListingsScreen` feeds from `FlatList` to `@shopify/flash-list`.
- Validate 60fps smooth scrolling on high-density listing cards.

## Phase 2 — Security Hardening (SEC-001)
- CORS origin whitelist, CSRF protection, and strict cookie flags (`SameSite=Lax`, `HttpOnly`, `Secure`).
- CodeQL vulnerability scan and TruffleHog secret scanning verification (0 findings).

---

# Priority 3 — Lightweight Release Governance (REV-001)

- **Concise Release Evidence Bundle**:
  ```text
  docs/releases/release-v1.0.0/
  ├── release-notes.md
  ├── verification-matrix.md
  ├── rollback.md
  └── known-issues.md
  ```

---

# Mandatory Deliverables Per PR

Every Sprint 5 PR must include:
1. Engineering Execution Log
2. Verification Report
3. Evidence Report
4. Rollback Plan
5. Engineering Action Register Update (`docs/tracking/engineering-action-register.md`)
