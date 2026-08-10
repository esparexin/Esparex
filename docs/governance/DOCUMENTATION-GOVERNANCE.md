# DOCUMENTATION GOVERNANCE MANUAL (`DOCUMENTATION-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** Doc Governance (CODEOWNERS `docs/*`) · Manual ref: Enterprise Audit Manual §11/§14; C-8 docs coverage

---

## 1. Documentation hierarchy (single-true)

| Doc | Purpose | Location | Owner |
| --- | --- | --- | --- |
| AGENTS.md | supreme architecture+governance rules | repo root | Engineering |
| ENGINEERING-HANDBOOK.md | onboarding entry point | docs/governance/ | Engineering |
| ENTERPRISE-AUDIT-MANUAL.md | audit + certification methodology | docs/governance/ | Governance |
| Domain standards (12 manuals) | per-discipline rules | docs/governance/ | per-discipline |
| PLATFORM_ARCHITECTURE.md (PADR) | whether architecture decisions | docs/architecture/ | ARB |
| ADRs | individual decisions | docs/architecture/adr/ | ARB |
| RISK-REGISTER.md | risk management | docs/governance/ | Risk owner |
| QUALITY-GATES-GATE-001 | mandatory gates | docs/governance/ | Governance |
| RELEASE documents (RC card) | version certification bundle | docs/releases/ | Release mgr |

No two docs define the same rule; conflicts resolve up the hierarchy (handbook < manual < AGENTS).

## 2. ADR policy (see Audit Manual §10)

- All decisions per table §10.1 mandatory → ADR in `docs/architecture/adr/` with template (Context/Decision/Alternatives/Consequences/Rollback/money).
- Index for ADRs required (F54 currently missing ADR-001..003, index empty — Wave 4 item).

## 3. Templates (must exist under the governance library)

- ADR template (ADR-NNN-slug)
- PR CIA block
- Risk card (R-NNN)
- Exception (EX-ID)
- Release checklist card (RC)
- Runbook template (10 required — Wave 4)
- Finding template (F-NNN in audit reports)

## 4. Document standards

| Concern | Convention |
| --- | --- |
| Naming | UPPER-KEBAB at governance, dashed lower rest |
| Versioning | docs dated in headers; CHANGELOG.md updates on content change |
| Format | Markdown, tables, code blocks; link to evidence |
| Required headers | Status · Owner · Updated · Refs |

## 5. Review schedule

| Level | Frequency | Owner |
| --- | --- | --- |
| Governance library core | quarterly | Governance |
| ADRs | at decision; re-read on each altar | ARB |
| Runbooks | each DR drill/live incident | SRE |
| ENVIRONMENT_VARIABLES.md | at env change + quarterly | Backend |

A docs-coverage script (`manual §6-8`) runs at sprint-end: modules, APIs, architecture, ADRs, env, deployment, runbooks, testing, business rules — target ≥ 90% by Wave 5.

## 7. Anti-Sprawl & Markdown Governance Policy (Zero Micro-Docs)

To prevent documentation fragmentation, clutter, and merge conflicts:
- **Consolidate, Never Multiply**: Extend existing governance manuals and architecture documents instead of creating new standalone `.md` files. Operational procedures must be added as sections in `DEVOPS-GOVERNANCE.md` or `ENGINEERING-HANDBOOK.md`.
- **Ephemeral Notes Ban**: Analysis notes, audit scratchpads, and temporary plans belong in local AI agent memory (`.gemini/antigravity-ide/brain/`), never committed into the git repository tree.
- **Minimum Threshold (100 Lines)**: Any documentation under 100 lines must be integrated into its parent domain handbook rather than created as a separate file.
- **Single Source of Truth**: Every domain concept must have exactly one authoritative file in `docs/governance/` or `docs/architecture/`.

---

*Owner: DocGovernance; ref: Audit Manual §6-8, CODEPT docs; measurement: docs-coverage script.*