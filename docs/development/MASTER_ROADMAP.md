# Esparex Platform Master Roadmap (v1.0.0 Release Architecture)

**Strategic Single Source of Truth** for product capabilities, release blockers, release gates, and post-launch KPIs. Operational work items are tracked directly in **GitHub Issues, Projects, and PRs**.

---

## 🚫 1. Current Release Blockers

| Blocker ID | Description | Component / Module | Impact | Target Fix | Status |
|:---:|---|---|:---:|:---:|:---:|
| **RB-001** | Real-time chat message delivery acknowledgment & receipt states | `@esparex/core` ChatService | High | `v1.0.0-rc1` | 🟡 In Progress |
| **RB-002** | Push Notification retry queue & FCM token cleanup on logout | `@esparex/core` NotificationService | Medium | `v1.0.0-rc1` | 🟡 In Progress |
| **RB-003** | High-density feed FlashList performance validation on 1,000+ listings | `apps/mobile` MarketplaceScreen | Medium | `v1.0.0-rc1` | 🟡 In Progress |
| **RB-004** | Express `/health/liveness` and `/health/readiness` probe endpoints | `backend/api/src/routes/rootRoutes.ts` | Medium | `v1.0.0-rc1` | 🟡 In Progress |

---

## 📋 2. Evidence-Based Capability Matrix

| Capability | Implementation Code | Unit/Integration Tests | E2E Mocks & Tests | Target Release |
|---|:---:|:---:|:---:|:---:|
| **User Registration & Auth** | ✅ Code Complete | ✅ Tests Pass | ✅ E2E Verified | `v1.0.0-beta` |
| **OTP Authentication** | ✅ Code Complete | ✅ Tests Pass | ✅ E2E Verified | `v1.0.0-beta` |
| **Browse Listings & Watchlist** | ✅ Code Complete | ✅ Tests Pass | ✅ E2E Verified | `v1.0.0-beta` |
| **Post Ad 2.0 Wizard** | ✅ Code Complete | ✅ Tests Pass | 🟡 In Progress | `v1.0.0-beta` |
| **Admin Catalog Management** | ✅ Code Complete | ✅ Tests Pass | ✅ E2E Verified | `v1.0.0-beta` |
| **Search & Keyword Filters** | ✅ Code Complete | 🟡 In Progress | 🔴 Pending | `v1.0.0-beta` |
| **Smart Alerts & Watchlist** | ✅ Code Complete | ✅ Tests Pass | 🟡 In Progress | `v1.0.0-beta` |
| **Business Registration & Profiles** | ✅ Code Complete | ✅ Tests Pass | 🟡 In Progress | `v1.0.0-beta` |
| **Real-time Chat Messaging** | 🟡 In Progress | 🟡 In Progress | 🔴 Pending | `v1.0.0-rc1` |
| **Push Notifications** | 🟡 In Progress | 🟡 In Progress | 🔴 Pending | `v1.0.0-rc1` |
| **Payment Gateway & Subscriptions** | 🟡 In Progress | 🟡 In Progress | 🔴 Pending | `v1.0.0-rc1` |
| **Express Health Probes (`/health`)** | 🟡 In Progress | 🟡 In Progress | 🔴 Pending | `v1.0.0-rc1` |
| **Product Telemetry & Analytics** | 🔴 Pending | 🔴 Pending | 🔴 Pending | `v1.0.0-ga` |

---

## 🎯 3. Release Gates

### A. Functional Release Gates
- [x] **Registration & Authentication**: User can register, authenticate via OTP/Social, and manage sessions securely.
- [x] **Listing Discovery**: Buyer can browse marketplace feeds, apply category filters, and view ad details.
- [ ] **Seller Listing Velocity**: Seller can complete Post Ad 2.0 wizard in ≤ 120s with draft auto-recovery.
- [ ] **Real-Time Communication**: Buyer & Seller can exchange chat messages with <1s delivery latency.
- [ ] **Payment Checkout**: User can select promotion/subscription plans and complete checkout.

### B. Non-Functional Release Gates
- [x] **Security & Audit**: Zero Critical / High vulnerabilities; strict CORS and SameSite/HttpOnly/Secure cookies.
- [x] **Type Safety & Buildgraph**: 0 TypeScript errors (`tsc --noEmit`), 0 circular package dependencies (`buildgraph`).
- [ ] **Feed Fluidity**: Average FPS ≥ 55 on supported mobile devices rendering 1,000+ listings (`FlashList`).
- [ ] **Platform Reliability Probes**: Express `/health`, `/readiness`, `/liveness` endpoints return 200 OK for 72h in staging.
- [ ] **Observability**: Sentry error tracking & OpenTelemetry request correlation IDs active in production.
- [ ] **Disaster Recovery**: Automated database backup restoration and rollback procedures validated.

---

## 🏆 4. Release Milestone Definitions

### v1.0.0 Beta (Target: August 2026)
- Feature complete for core Buyer/Seller flows (Browse, Search, Watchlist, Post Ad 2.0, Admin Catalog, Smart Alerts).
- Internal test users validated; known non-blocking issues tracked.
- Monorepo build, type-check, and automated unit tests pass 100%.

### v1.0.0 RC1 (Target: September 2026)
- Zero release-blocking bugs (`RB-*` resolved).
- Real-time Chat, Push Notifications, and Payment Checkout verified end-to-end.
- Performance SLA (≥55 FPS) and Security SLA (0 findings) satisfied.

### v1.0.0 GA (Target: October 2026)
- Zero Critical / High vulnerability or reliability issues.
- Backup, restore, and rollback plans validated in staging.
- Production deployment approved with full Sentry & OpenTelemetry observability.

---

## 📊 5. Post-Launch Product Success KPIs

| Product KPI Metric | Target Threshold SLA | Operational Measurement Method |
|---|:---:|---|
| **Listing Creation Success Rate** | **> 98.0%** | Telemetry `post_ad_success` events |
| **Search Response Latency** | **< 300 ms (P95)** | Express API APM & OpenTelemetry |
| **Chat Message Delivery Rate** | **> 99.0%** | WebSocket message delivery ACK probes |
| **Crash-Free Session Rate** | **> 99.5%** | Sentry Crash Reporting |
| **API Availability Uptime** | **> 99.9%** | Production Health Check Monitors |
| **Seller Task Completion Time** | **< 120 seconds** | User journey analytics funnel |

---

## 🛡️ 6. Open Risks Reference

All long-lived project risks are maintained in the [Project Risk Register](file:///Users/admin/Desktop/Esparex/docs/governance/risk-register.md) (`docs/governance/risk-register.md`).

---

## 🔄 7. Living Operational Workflow

```text
MASTER_ROADMAP.md (Strategic SSOT)
  └── GitHub Issues & Projects (Operational Work Items)
        └── Pull Requests (Strict Feature Definition of Done)
              └── Release Package (docs/releases/v1.0.0/)
```
