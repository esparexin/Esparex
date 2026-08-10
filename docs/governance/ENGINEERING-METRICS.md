# ENGINEERING METRICS DASHBOARD (`ENGINEERING-METRICS.md`)

> **Status:** Quarterly-updated · **Owner:** Engineering Governance · Data sources: guard scripts output, CI artifacts, audit volumes, trend store `.governance/`

---

## 1. Dashboard (single table — updated each sprint-end/quarter)

| Metric | Current (2026-08-09) | Target | Source | Cadence |
| --- | --- | --- | --- | --- |
| Build success | ✅ (12 workflows) | 100% | CI | every push |
| Unit test coverage | Core+backend+mobile ✅ _web not in CI_ (V2-1) | web ≥50% | coverage json | sprint |
| Security score | 66/100 (Vol-4 §50) | ≥ 80 | audit + `repo:secret` | quarter |
| Architecture score | 66/100 | ≥ 75 | `repo:architecture` + manual | quarter |
| Code health | 62/100 | ≥ 70 | guard outputs | sprint |
| Technical debt | 39 findings (8 crit) | ↓ weekly | `guard:knip`/F-register | sprint |
| Performance | LCP/CLS budget (baseline) | within budget | perf CI job | RC/nightly |
| Open risks (R) | 6 active (RISK-001) | trend ↓ | risk-register | sprint |
| Open ADRs | ~2 filed, 4 backlog (F54) | 0 unbacklogged | adr/ + index | sprint |
| Open findings | F01–F56 (8 critical) | critical = 0 | audit volumes | wave gate |
| Production readiness | 59.1/100 (Vol-4 §50) | ≥ 80 GA | certification card | RC |

## 2. How to read the dashboard

- Green = target met and trending stable; Amber = within 10%; Red = below or blocked; all dashboards link to evidence rows.
- **Auto-generation:** CI `repo:governance-report` emits JSON → `docs/governance/ENGINEERING-METRICS.md` templated view. Human adds qualitative commentary quarterly.

## 3. Metric owners

| Metric | Owner |
| --- | --- |
| Build/test/coverage | QA + CI |
| Security | Security owner |
| Architecture/code-health | ARB |
| Debt/knip | Governance |
| Performance | Perf lead |
| Risks/findings | Governance + Risk owner |
| Readiness | Release mgr |

## 5. Platform Service Level Objectives (SLOs) & Error Budgets (F52)

| Platform Service | Service Level Indicator (SLI) | Target (SLO) | Monthly Error Budget |
| :--- | :--- | :--- | :--- |
| **Authentication & OTP** | Proportion of successful OTP requests and verification cycles | **≥ 99.5%** | 0.5% (~216 min/month) |
| **Listing Discovery & Search** | Proportion of `/v1/listings/search` requests served with p95 < 250ms | **≥ 99.0%** | 1.0% |
| **Ad Posting & Ingestion** | Proportion of valid ad creation transactions committed without 5xx | **≥ 99.9%** | 0.1% (~43 min/month) |
| **Payment & Webhooks** | Proportion of Razorpay webhook events acknowledged and processed | **≥ 99.9%** | 0.1% |
| **Smart Alerts Dispatch** | Match notifications delivered to users within ≤ 60s of listing publish | **≥ 98.0%** | 2.0% |

**Error Budget Policy**:
- If 30-day error budget consumption exceeds **80%**, non-critical feature deployments pause until reliability fixes land.
- If error budget is **exhausted (100%)**, all engineering efforts shift exclusively to stability and bug remediation.

---

*Owner: Engineering. All numbers trace to `.governance/` evidence; no fictional scores (Manual §2).*