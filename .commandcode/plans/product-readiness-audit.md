# Product Engineering Readiness Audit — Esparex

**Date:** 2026-07-08  
**Status:** Audit Only — No Implementation  
**Branch:** pr-66  

---

## Readiness Scores

| Category | Score | Status |
|----------|-------|--------|
| Product Readiness | 85% | High |
| Backend Completion | 95% | Near-complete |
| Frontend Completion (Web) | 90% | High |
| Admin Completion | 95% | Near-complete |
| Mobile Completion | 0% | Not started |
| API Completion | 98% | Production-ready |
| Database Completion | 90% | High |
| Security Readiness | 75% | Needs fixes |
| Production Readiness | 85% | High |

---

## Module Assessment

### COMPLETE (13 modules)

| Module | Why Complete |
|--------|-------------|
| **Listings** | Full CRUD, 6-state lifecycle, search, feed, trending, nearby, repost, promote, soft delete, 26 endpoints, 519-line model with 45+ indexes |
| **Categories/Brands/Models** | Full hierarchy CRUD, approval workflow, catalog requests, bulk import, admin management, frontend browsing |
| **Business Profiles** | Registration, document upload, GST, verification, lifecycle, public profiles, search, 16 endpoints |
| **Chat** | Full threaded chat, cursor pagination, read receipts, block/hide, image attachments, reports, 11 endpoints, 13 frontend components |
| **Notifications** | Push (FCM), in-app, WebSocket, 15+ templates, queue delivery, dedup, admin targeting, TTL retention |
| **Payments/Orders** | Full Razorpay, order creation, HMAC webhook, wallet, invoices with GST, PDF, reconciliation, 7+ services |
| **Reports/Moderation** | Report creation (ad/user/chat/business), admin queue, content scanning, fraud/spam detection |
| **Location** | Atlas Search, reverse geocode, hierarchical State->City->Area, 2dsphere proximity, geofencing, Redis cache, 10 endpoints |
| **Smart Alerts** | CRUD, geo-proximity matching, keyword/brand/model/category/price filters, expiry, 7 endpoints |
| **Authentication** | OTP (bcrypt, rate limited, lockout), JWT (HS256, jti, tokenVersion, blacklist), Admin (sessions, 2FA TOTP, IP whitelist) |
| **Monitoring** | Prometheus (15 metrics), health checks (3 endpoints), Sentry (DSN, profiling, breadcrumbs) |
| **Logging** | Winston (rotation, PII masking, correlation IDs, child loggers, daily rotate) |
| **Background Jobs** | 13 jobs with distributed locking, 16 cron entries, 5 queue workers with auto-recovery, dead letter queue, telemetry |

### PARTIAL (3 modules)

| Module | Status | Gap |
|--------|--------|-----|
| **Reviews/Ratings** | Trust score exists (SellerReputation) | No user-facing star ratings or text reviews. No Review model, no rating endpoints, no UI. |
| **Security (Access Control)** | Auth is strong. RBAC exists. | 3 critical gaps: /system/status, /system/metrics-summary, /metrics are public. 11 admin read-endpoints lack requirePermission. No user token refresh (7-day JWT). |
| **Admin Vercel Config** | Deployable | Missing NEXT_PUBLIC_API_URL in vercel.json. Won't reach backend without it. |

### MISSING (3 modules)

| Module | Gap |
|--------|-----|
| **Reviews/Ratings UI** | No frontend components for displaying or submitting reviews |
| **Scanner/OCR** | No barcode/QR scanning, no image text extraction |
| **Inventory Management** | Only a stock field on Ad model. No tracking, history, low-stock alerts |

### NOT STARTED (1 module)

| Module | Status |
|--------|--------|
| **Mobile App** | Empty Capacitor scaffold. PWA via apps/web works independently. |

---

## Critical Issues (Production Blockers)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | /system/status public -- exposes DB/Redis/queue health | CRITICAL | Add requireAdmin middleware |
| 2 | /system/metrics-summary public -- security monitoring, circuit breakers | CRITICAL | Add requireAdmin middleware |
| 3 | /metrics public -- Prometheus endpoint | CRITICAL | Add HTTP basic auth or internal-only restriction |
| 4 | 11 admin read-endpoints lack requirePermission | HIGH | Add requirePermission calls |
| 5 | No user JWT refresh mechanism (7-day token) | HIGH | Implement refresh token + short-lived access token |
| 6 | GET /listings/:id/phone publicly accessible | HIGH | Add rate limiting per listing + require auth for reveal |
| 7 | Admin Vercel missing NEXT_PUBLIC_API_URL | HIGH | Add env var to admin vercel.json |
| 8 | ad-events queue has no-op processor | MEDIUM | Add handlers or remove queue |
| 9 | Static OTP bypass active in production | MEDIUM | Document removal timeline |
| 10 | notification_scheduler_poll runs every minute | MEDIUM | Consider increasing interval |

---

## Recommended 3-Sprint Roadmap

```
Sprint 1 (Production Blockers)     Sprint 2 (Business Value)        Sprint 3 (Quality & Infra)
1. Secure system endpoints         6. Reviews/Ratings system        11. render.yaml env vars
2. requirePermission on 11 routes  7. JWT refresh tokens            12. scheduler poll interval
3. Admin Vercel fix                8. Price suggestions             13. home_feed_warmup TTL
4. ad-events queue fix             9. Featured/Promoted listings    14-15. Integration tests
5. Phone reveal protection         10. Bulk listing tools           16-20. Cleanup & polish
```

## Production Launch Checklist

Before production launch, verify:

- [ ] All 3 system endpoints secured (/system/status, /system/metrics-summary, /metrics)
- [ ] All admin read-endpoints have requirePermission
- [ ] Admin Vercel NEXT_PUBLIC_API_URL configured
- [ ] ad-events queue processor added or queue removed
- [ ] render.yaml has all required env vars (SENTRY_DSN, BACKUP_CRON, etc.)
- [ ] USE_DEFAULT_OTP has documented deprecation timeline
- [ ] JWT refresh mechanism evaluated (may be post-launch)
- [ ] Mobile strategy decision documented (PWA vs Capacitor)
- [ ] All CI checks pass on PR to main
- [ ] Monitoring dashboards configured (Grafana/Prometheus)
