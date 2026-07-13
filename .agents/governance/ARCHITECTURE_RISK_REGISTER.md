# Architectural Risk Register

**Owner**: Architecture Governance
**Last Updated**: 2026-07-13
**Review Cadence**: Updated at every Fitness Audit (every 6–12 months), or when a new risk is identified

---

## Purpose

This register tracks **known architectural risks** — conditions that, if left unaddressed, may increase maintenance cost, reduce system reliability, or require disruptive restructuring.

A risk in this register is not a bug or a defect. It is a structural or architectural condition that is currently acceptable but warrants monitoring.

**Risks are never silently closed.** When a risk is resolved, it is marked `CLOSED` with a date and resolution note, and remains in the register for historical traceability.

---

## Risk Severity Scale

| Likelihood | Impact | Severity |
|---|---|---|
| Low / Medium / High | Low / Medium / High | Product of both |

---

## Open Risks

| ID | Risk | Likelihood | Impact | Trigger Threshold | Owner | Next Review |
|---|---|---|---|---|---|---|
| R-001 | **Worker/HTTP resource contention** — Background workers (image processing, fraud, notifications, geo-audit) share the same Render process and Node.js thread pool as the HTTP server. Under load, CPU-intensive worker jobs can increase HTTP P95 latency. | Medium | High | HTTP P95 latency increase correlated with worker execution windows; or Render plan upgrade required due to memory pressure | Platform | 2027-01 Fitness Review |
| R-002 | **`catalog` approaching bounded-context threshold** — `core/src/services/catalog/` contains 14+ files across orchestration, validation, resolution, notification, search, and hierarchy concerns. If catalog domain grows further or a second team is assigned to own it, the extraction cost increases. | Medium | Medium | Catalog subdirectory > 20% of `core` total file count, or merge conflicts involving catalog > 2/month | Core | 2027-01 Fitness Review |
| R-003 | **`payments/wallet` coupling to ad lifecycle** — Payment logic (wallet, plan, invoice, boost) is currently tightly coupled to the listing lifecycle (plan selection → ad creation → boost). Decoupling these for a potential payments extraction requires anti-corruption layer work. | Low | Medium | Second payment provider added, or wallet transaction volume requires dedicated scaling | Core | 2027-01 Fitness Review |
| R-004 | **`locationPrimitives.ts` architectural responsibility unclassified** — `shared/src/utils/locationPrimitives.ts` uses `slugify` and is consumed only by backend packages. Whether it belongs in `@esparex/shared` (string utility) or `@esparex/core` (domain normalization) has not been formally decided. Until classified, the `slugify` dependency in `@esparex/shared` is architecturally misaligned. | Low | Low | Before next dependency sprint | Core | Next cleanup sprint |
| R-005 | **GitHub Dependabot: 47 known vulnerabilities on default branch** — At the time of the last push, GitHub flagged 2 critical, 22 high, 20 moderate, and 3 low severity vulnerabilities. These are pre-existing and in the default branch, not introduced by recent changes. | High | High | Immediate — security vulnerabilities should not remain unaddressed | Security | Dedicated `npm audit` sprint |

---

## Closed Risks

| ID | Risk | Closed Date | Resolution |
|---|---|---|---|
| — | React hook (`usePopupQueue`) in `@esparex/shared` — undeclared React peer dependency | 2026-07-13 | Relocated to `apps/web` and `apps/admin`. Removed from `@esparex/shared`. Commit `a84fefe9`. |
| — | Missing dependency-cruiser rules for frontend→core and shared→core boundaries | 2026-07-13 | Rules `no-frontend-imports-from-core` and `no-shared-imports-from-core` added to `.dependency-cruiser.js`. Commit `a84fefe9`. |
| — | `apps/mobile` undocumented workspace status | 2026-07-13 | Documented in `README.md` as infrastructure/runtime wrapper. Workspace Governance Rule added. Commit `639d467f`. |
| — | `@esparex/core` / `@esparex/backend-api` separation not documented in ADR | 2026-07-13 | ADR-005 created. |

---

## Risk Register Maintenance Rules

1. **New risks** are added here when identified during any audit phase. They are not closed until verified resolved.
2. **Existing risks** have their Likelihood and Impact re-evaluated at every Fitness Audit.
3. **Trigger Thresholds** are the quantitative conditions defined in `ARCHITECTURE_GOVERNANCE.md §1.5` that escalate a risk from monitoring to action.
4. **Risks do not disappear** — they are either closed (with evidence) or remain open.
5. This document is the **single source of truth** for architectural debt. Findings from audit reports are migrated here; they do not remain as action items in audit documents only.
