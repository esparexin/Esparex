# RELEASE GOVERNANCE MANUAL (`RELEASE-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** Release manager · Manual refs: Audit Manual §16 (environments/promotion), §15 (versions); REV-001 (docs/releases/) · Evidence: Vol-5 §60 (certification ladder)

## 1. Release types & certification mapping

| Release | Certification level required | Route |
| --- | --- | --- |
| Development | — | any branch |
| QA | — | staging |
| UAT | — | staging snapshot |
| **Beta** | Beta Only (Manual §5) | invited cohort |
| **Soft Launch** | Soft Launch Only | web-only |
| **GA** | Certified for Production | full |
| **Hotfix** | Critical-path fix | quick lane (§6) |

> Current state (2026-08-09): platform at **Soft Launch Only — HOLD** (F51 blocks; Vol-5 §60.3). No release may exceed its earned level.

## 2. RC (Release Candidate) process

1. RC branch/tag `vX.Y.Z-rcN` cut from develop.
2. Run full certification suite (Manual §6 checklists C-1..C-8) — green required.
3. RC card artifact (docs/releases/release-vX.Y.Z/) with evidence links (REV-001).
4. ARB + Release-Manager sign-off (Manual §14 quorum).

## 3. UAT & Beta rules

- UAT: staged users; block destructive ops; seeded data only.
- Beta: cohort limited; telemetry events; **feature flags: rollout only for flags ON**.

## 4. GA

- Gate C conditions (Vol 4 §50.2): refunds on, OpenAPI≥50%, SLOs defined, DR drill done, mobile certified, error budgets, release checklist signed.
- GA checklist per DEFEND GATE-001 Release Evidence row.

## 5. Rollback

| Trigger | Action |
| --- | --- |
| Failed `POST /health` post-deploy | immediate rollback of tag + notify |
| Data migration issue | R3 (migration back or feature-flag off) |
| Critical bug in soft categories | feature-flag off before rollback; revert PR |

**Rollback readiness is a release gate today — currently missing (Vol 4 §45) → Wave 4 implements versioned deploys.**

## 6. Sign-off matrix

| Signature | Demonstrable |
| --- | --- |
| QA | e2e + (RC) suite green |
| Security | `repo:secret`, CodeQL, pentest weeklies |
| ARB | ADR cross-checks |
| Release mgr | RC card + rollback plan |
| CTO | go/no-decision & cert card |

## 7. Hotfix process

1. On prod incident → `hotfix/<slug>` from last release tag.
2. Min changes; tests; release-level: React preserve.
3. After: hotfix cherry-picks back to develop + tag patch (`vX.Y.Z+1`).

## 8. Versioning ties (Manual §15)

- API path `/v1`; breaking via ADR.
- Contracts MAJOR bumps only on breaking + ARB.
- Apps per semver; tags `vX.Y.Z`.

Release hygiene: every release updates `release-notes.md` + `engineering-action-register.md`.

---

*Owner: release mgr; pairs with quality-gates GATE-001 & audit manual §5.*