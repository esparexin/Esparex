# Enterprise Remediation Program (`ENTERPRISE-REMEDIATION-PROGRAM.md`)

> **Status:** Approved execution plan · **Owner:** Engineering Lead + SRE · **Baseline:** 2026-08-09
> Converts findings F01–F56 (+ V2 items) into executable waves with dependencies, effort, risk, rollback, and verification gates.
> Companion to: `enterprise-audit-manual.md`, `risk-register.md`, AGENTS.md DoD.

---

## 0. Objective & target state

| Metric | Now (2026-08-09) | After Wave 0–2 | After all Waves |
| --- | --- | --- | --- |
| Production Readiness (Vol-4 §50.1) | 59.1 | ≥ 72 (Gate B) | ≥ 80 (Gate C) |
| Open critical findings | 8 + F51 | 0 critical | 0 critical |
| Web tests in CI | ❌ | ✅ | ✅ |
| OpenAPI coverage | 0.3% | ≥ 50% | ≥ 90% |
| OTP provider (prod) | `test` | `msg91` | `msg91` |
| Certification level | Soft Launch (HOLD) | Soft Launch (GO) | Certified-conditions |

---

## 1. Execution principles

- **Dependency-first:** nothing lands before its upstream wave; each wave has an explicit gate.
- **Atomic PRs:** each task is one PR with its own rollback (revert-only PR).
- **Rollback strategy per task** (R1 revert PR · R2 feature-flag off · R3 migration-back).
- **Verification gate** = named script(s) that must be green (`npm run …`).
- Every merged PR updates `engineering-action-register.md` + `release-notes.md` (DoD).

---

## 2. Wave plan

### WAVE 0 — SAFETY (security-critical; highest priority) — IN FLIGHT
> Status: active on `fix/audit-remediation-master` (commits 328793cd, b3032339, d8ba7946).

| Task | F# | Deps | Effort | Risk | Rollback | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| OTP provider → `msg91` in prod config (block until DLT registered) | F51 | DLT registration | S | L | R1 | live SMS OTP test in staging |
| Mobile auth real login flow (J2) | F01 | contracts | L | M | R2 | mobile e2e + API chain test |
| Upload presign/image real routes (J4) | F03 | S3 | M | M | R2 | e2e media upload web+mobile |
| 429 canonical envelope (F48) | F48 | apiResponse | S | L | R1 | envelope contract test |
| Mobile CSRF bootstrap | F02 | auth | S | M | R1 | CSRF test on mobile client |
| Admin plans/geofence detail handlers | F04 | — | S | L | R1 | admin e2e |
| DLQ consumer + replay | F42 | queue infra | M | M | R2 | DLQ worker spec + replay tool |
| AlertDeliveryLog persist | F43 | notifications | S | L | R1 | dedupe behavior test |

**Gate 0:** F51 shipped + verified; critical findings = 0; `npm run guard:pr-quality` green; web soft launch unblocked.

### WAVE 1 — MOBILE PARITY
| Task | F# | Deps | Effort | Risk | Rollback | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| Mobile listing create (media via F03) | J3/J4 | Wave 0 | M | M | R2 | mobile e2e |
| Refund schema + endpoints + admin view | F06/V2-6 | contracts | L | H | R3 | refund integration spec |
| Wallet recharge route (F50) | F50 | payments | M | M | R3 | wallet e2e |
| Chat mobile pagination (J10/P2) | — | — | M | L | R2 | chat e2e |
| SellerListingNotification idempotency | F44 | events | S | M | R2 | listener spec |

**Gate 1:** mobile journeys J2/J4/J7/J18 green; `guard:mobile-architecture` pass.

### WAVE 2 — CONTRACT & SSOT
| Task | F# | Deps | Effort | Risk | Rollback | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| Move DTO SSOT → `@esparex/contracts` (kill dual zod) | F08 | ADR-B | L | H | R3 | `repo:contracts` + API compat suite |
| Merge dual state machines (F07) | F07 | ADR | L | H | R3 | lifecycle spec matrix |
| Legacy services → domains migration (F05) | F05 | — | XL | H | R2 | `repo:ssot` + dep graph |
| OpenAPI ≥ 50% docs + `@openapi` lint gate | V4-43 | — | M | L | R1 | coverage script |
| .tooling gates reconcile (F47) | F47 | — | S | L | R1 | `repo:gate` green both |

**Gate 2:** `repo:gate` + `repo:architecture` green; no duplicate DTOs.

### WAVE 3 — DATA INTEGRITY
| Task | F# | Deps | Effort | Risk | Rollback | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| Ad TTL race fix (V2-4) | V2-4 | — | M | M | R3 | TTL spec + soft-delete test |
| Business delete cascade (V2-2) | V2-2 | — | M | M | R3 | cascade spec |
| Boost/spotlight atomic 5-write (V2-3) | V2-3 | — | M | M | R3 | atomicity spec |
| Wallet txn fallback (V2-5) | V2-5 | — | S | M | R1 | wallet spec |
| Data quality + index audit ($indexStats) | C-3 | — | M | L | — | data-quality report |

**Gate 3:** DB integrity spec suite green; index duplicates = 0.

### WAVE 4 — FRONTEND & OBSERVABILITY
| Task | F# | Deps | Effort | Risk | Rollback | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| Web unit suite wired into `npm test` + CI | V2-1 | — | S | L | R1 | CI green w/ web |
| FE Sentry (web+admin) + RUM | F45 | — | M | L | R1 | Sentry test events |
| SLOs/SLIs + error budgets (5 targets) | F52 | — | M | L | — | dashboard + alert test |
| Prom dashboards + Grafana config | F52 | — | M | L | — | dashboard import test |
| Runbooks 0/10 → 10/10 templates | F53 | — | M | L | — | runbook review |

**Gate 4:** FE coverage ≥ 50% branch; 5 SLOs live; runbooks published in `docs/ops/`.

### WAVE 5 — CERTIFICATION READY
| Task | F# | Deps | Effort | Risk | Rollback | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| Playwright suite resurrection (e2e matrix) | C-2 | Waves 0–4 | M | M | — | RC gate e2e green |
| DR runbook + RTO/RPO + restore drill | F53/C-3 | — | M | H | — | drill report |
| Load suite (k6) + P48 simulations | F56 | staging | M | M | — | load report |
| Accessibility regression suite (axe) | AGENTS | — | S | L | — | axe gate |
| GDPR export/delete + license/security polish | F49 | — | M | L | R3 | compliance spec |
| Full Phase-50 re-certification | — | all | — | — | — | certification card |

**Gate 5:** re-run Vol-4 §50 certification; readiness ≥ 80 → propose GA to Exec.

---

## 3. Critical path (dependency chain)

```
F51(OTP) ─► Gate 0 ─► Wave1(mobile/refund) ─► Wave2(SSOT) ─► Wave3(DB)
                                                  │
Wave4(SLOs/runbooks) ◄──────── CI+FE(S) ──────────┘
          │
          ▼
Wave5 (e2e/DR/load/cert) ─► Gate 5 (GA)
```

**Long pole:** F05 legacy migration (XL) — parallelize with Wave 4.

---

## 4. Risk register hooks

| Risk | Mitigation | Owner |
| --- | --- | --- |
| Refund rollback complexity (R3) | feature-flag + idempotency-first design | Payments lead |
| SSOT migration breaking FE | contract-compat tests before cutover | Contracts lead |
| DR drill failure | staged drills (restore→verify→promote) | SRE |
| OTP msg91 DLT delay blocks Gate 0 | keep test provider DEV-ONLY; soft launch gated | Auth lead |

(Full matrix: `docs/governance/risk-register.md`.)

---

## 5. Sprint mapping & DoD

- Waves map to sprints per `docs/governance/sprint-execution-prompt.md`.
- Task DoD = AGENTS.md Definition of Done (tests, type-check, guards, a11y, telemetry).
- Every task carries **success criteria** (verification column) — no task ships without its gate green.

---

*Owner: Engineering Governance · Baseline findings: `audit-reports/enterprise-*.md` (F01–F56).*