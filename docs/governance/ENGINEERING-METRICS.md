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

## 4. Expected trajectory (2026)

| Metric | Q3 | Q4 | Q1'27 |
| --- | --- | --- | --- |
| Readiness | ≥ 65 | ≥ 72 | ≥ 80 |
| Security | ≥ 75 | ≥ 80 | ≥ 85 |
| Debt critical | 0 | 0 | 0 |
| Test (web+admin) | ≥ 35% | ≥ 50% | ≥ 70% |
| OpenAPI | ≥ 50% | ≥ 70% | ≥ 90% |

---

*Owner: Engineering. All numbers trace to `.governance/` evidence; no fictional scores (Manual §2).*