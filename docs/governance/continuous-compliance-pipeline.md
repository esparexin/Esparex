# Continuous Compliance Pipeline (`CONTINUOUS-COMPLIANCE-PIPELINE.md`)

> **Status:** Enforced standard · **Owner:** CI/Governance · **Baseline:** 2026-08-09
> Makes the Audit Manual's certification checks **permanent, automated, and scheduled** so regressions are caught at commit-time rather than audit-time.

---

## 1. Pipeline design goals

1. **Every PR is a mini-audit gate** (10-minute budget).
2. **Every merge is certified against the same Guard Registry** the audit uses.
3. **Nightlies monitor drift** (dead code, duplication, secrets, deps, perf, docs).
4. **Release Candidates gate on the full §6 certification suite** (Manual).
5. **Zero suppressions** — violations must be fixed, not whitelisted (per AGENTS.md).

---

## 2. Check → tool mapping (single source)

| # | Check | Command / Tool | Gate level |
| --- | --- | --- | --- |
| 1 | TypeScript strict | `npm run type-check` | PR · RC · nightly |
| 2 | Dead code / orphans | `npm run guard:knip` + `guard:dead-code` | PR · nightly |
| 3 | Duplication | `npm run guard:duplicate-code` (jscpd ≤0.15%) | PR · nightly |
| 4 | Circular deps | `npm run guard:circular` | PR · RC |
| 5 | Type casts | `npm run guard:type-casts` (≤ core baseline 352) | nightly (trend) |
| 6 | Dependencies | `npm run guard:dependencies` + `repo:lockfile` + dependabot | PR · weekly |
| 7 | Secrets | `npm run repo:secret` + CodeQL + TruffleHog | PR · nightly |
| 8 | API surface | `npm run guard:api-surface` + `repo:contracts` | PR · RC |
| 9 | Architecture | `guard:buildgraph`, `guard:component-api-boundary`, `geo:*` | PR · RC |
| 10 | Route collisions | `guard:route-collision` + `repo:routes` | PR |
| 11 | Env contract | `guard:env-contracts` / `repo:env-vars` | PR · RC |
| 12 | SSOT | `repo:ssot` + `guard:shared-ssot` + `guard:api-ssot` | PR · RC |
| 13 | Domain guardrails | `guard:no-ad-hard-delete`, `guard:moderation-namespace`, `guard:mobile-architecture`, `guard:typography-ssot` | PR · RC |
| 14 | Accessibility | axe-core run on CI (web screens + core templates), keyboard nav smoke | PR · nightly |
| 15 | Performance | LCP/CLS bundles CI job (budget per baseline-report.md) + API p95 | RC · nightly |
| 16 | E2E (Playwright) | module-based critical journeys J01–J19 + admin (once Wave 5 restores suite) | RC · nightly |
| 17 | Docs coverage | `docs/**` coverage script (Manual §6-8) | sprint-end · quarterly |
| 18 | Data quality | data-quality scan (Manual C-3) | quarterly |
| 19 | Governance health | `npm run repo:governance-dashboard` / `repo:governance-report` | sprint-end · RC |

---

## 3. Schedules

| Frequency | Scope | Artifact to whom |
| --- | --- | --- |
| **Daily (nightly)** | #1–7, #14–16, #19 + nightly smoke | CI dashboard, async to #eng-gov |
| **Per PR** | #1–#13 + lint:changed + secret scan | PR check-set (fail = block merge) |
| **Weekly** | dependabot merge review, npm audit, knip trend | Security/Dep officer |
| **Sprint-end** | demo + #17 docs + risk-register update | Eng/QA |
| **Release candidate (RC)** | FULL §6 (all 8 certification checklists incl. perf, E2E suite, Playwright full run) | Release manager approves |
| **Quarterly** | DR drill + data-quality audit (#18) + full 60-phase audit | Governance |
| **Annual** | enterprise re-certification (Manual §8) | CTO/Exec |

---

## 3. Gate policy (Go/No-Go)

| Gate | Red | Amber (warning) | Green |
| --- | --- | --- | --- |
| PR merge | any critical check fail | guard warnings + no severity | all pass |
| RC | any §6 item red | Amber list ≤ 3 w/ owner | full green |
| Release | certification card < Soft-launch level, or F51-class | Amber only | Green + cert |

**Rule:** An RC may be released only at the certification level earned (Manual §5 ladder). No skipping levels.

---

## 4. Enforcement hooks (concrete)

1. `ci.yml`: add the full guard block as job matrix (only guard scripts to avoid 10-min overflow: split `code` vs `guard` jobs).
2. `governance.yml`: runs `guard:*` + `repo:governance-report` on schedule and PRs touching core/contracts.
3. `codeql.yml`: auto-create dbs + report to dashboard.
4. `release.yml`: runs RC checks; gate on certification per Manual §7 ladder (certification artifact committed to audit-reports/).
5. **Playwright**: re-add `e2e.yml` once Wave 5 lands; currently a PENDING item (F42-style) — do not add placeholder.

---

## 5. Dashboards & reporting

- `repo:governance-report` → composite Green/Amber/Red per dimension (13 rows: the KPI matrix).
- CI artifact: audit ledger JSON (per check → pass/fail + date) in `.governance/` for trend query.
- Release notes: `release-notes.md` + `engineering-action-register.md` updated per ship.

---

## 6. Ownership & RACI

| Area | Owner |
| --- | --- |
| Guardrail scripts (packages/guard) | Core team |
| CI orchestration (`ci.yml`, e2e) | DevOps |
| Perf budget owner | Performance lead |
| Docs coverage | Docs owner (CODEOWNERS `docs/*`) |
| Non-repeatable enforcement (DR drills, data-quality) | Governance (quarterly) |

---

*Owner: CI/CD Governance · Derivates: `enterprise-audit-manual.md` §6-§10, AGENTS.md gate matrix.*