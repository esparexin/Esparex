# ROADMAP-001 — Post-Launch Engineering Roadmap (Free Infrastructure Edition)

- **Owner**: Release Governance Board
- **Status**: ACTIVE / CANONICAL POLICY
- **Effective Date**: 2026-06-27

---

## 1. Objective
Transition the MAD Entertrainment platform from engineering completion into stable production operations while explicitly operating within the current free-tier infrastructure constraints.

---

## 2. Current Infrastructure Constraints
The project is configured to operate on free-tier services. Operational checks dependent on paid features or deployment hosting configurations are intentionally deferred:
- **No Paid CI/CD**: Standard lint, build, test, and dependency checks run automatically in GitHub Actions, but premium pipelines and auto-deployments are deferred.
- **Limited Render Compute**: Render free instance limits memory and uptime. Automatic monitoring and uptime tracking are deferred.
- **Limited Vercel Resources**: Free-tier serverless limits execution logs, custom SSL key bindings, and edge caching metrics.
- **Observability Restrictions**: Paid error tracking (Sentry Business/Datadog), synthetic monitoring, and live alerting are inactive.

---

## 3. Operational Guiding Principles

### ✅ Verified (Local & Static Gates)
These elements are validated before release commits:
- Local development & preview execution.
- Successful builds via `pnpm build`.
- 100% success on `pnpm type-check`, `pnpm lint`, and `pnpm test`.
- Visual alignment checks on Chrome, Safari, Firefox, and mobile engines.
- Automated static checks (GitHub Actions CI workflow execution).

### ⚠ Deferred (Infrastructure Limitations)
These capabilities depend on paid infrastructure:
- Live Core Web Vitals profiling.
- Real-user monitoring (RUM) and live alert metrics.
- Paid integration monitoring (live SMTP delivery success rates, production DB latency).
- Auto-deployment configuration mapping and environment verification.

---

## 4. Release Validation Policy
All releases must be manually verified locally before being promoted:
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build && pnpm governance:docs
```

---

## 5. Immediate Engineering Focus
Future PR work should prioritize:
1. Operational reliability and business risk reduction (MAD-500 outcomes).
2. Functional fixes and security hardening.
3. Feature additions and enhancements.
4. User interface bugs and customer feedback.

---

## 6. Prioritized Epic Roadmap (Post MAD-500)
Based on the End-to-End Production Runtime Audit, engineering priorities are organized in the following phases:

### Phase 1: Critical Reliability & Security Hardening
- **PROD-001**: Restrict and secure diagnostic API routes (`/api/admin/diagnostics/*`) to SuperAdmin authorization.
- **PROD-002**: Configure MongoDB Replica Set Cluster connection topologies to ensure High Availability database failover.

### Phase 2: High Priority Transaction & Scanner Hardening
- **SEC-001**: Implement concurrency locking queue in Axios frontend interceptors to prevent multi-tab token reuse rotation logouts.
- **SCAN-001**: Implement local storage check-in databases in mobile scanners to enable offline venue ticket validation.

### Phase 3: Technical Debt Reduction & Refactoring
- **ARCH-001**: Modularize `payment.service.ts` to separate Stripe/Razorpay adapters and validation logic, aligning with file size limits.
- **ADMIN-001**: Integrate interactive gateway refund buttons inside the admin dashboard cards.
