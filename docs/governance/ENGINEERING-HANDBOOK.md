# Esparex Engineering Handbook — The Entry Point

> **Status:** Living · **Owner:** Engineering Governance · For every engineer, first day and every day.
> Start here → follow links. Rules hierarchy: AGENTS.md > ENTERPRISE-AUDIT-MANUAL.md > discipline manuals.

---

## 1. Project Overview

Esparex is a multi-platform commerce marketplace monorepo:

- **Web app** (`apps/web`, Next.js) · **Admin** (`apps/admin`) · **Mobile** (`apps/mobile`, Expo RN)
- **Backend API** (`backend/api`, Express)
- **Core domain engine** (`core/`, 6 DDD domains) · **Shared packages** (`contracts`, `ui`, `mobile-ui`, `shared`, `design-tokens`, `kernel`)
- **Payments:** Razorpay · **SMS:** MSG91 · **Media:** S3 · **AI:** Gemini/OpenAI (moderation, SEO, catalog)
- Env: Render (API) + Vercel (web/admin) · Mongo Atlas · Redis (cache + BullMQ queues)

Depth: `docs/architecture/PLATFORM_ARCHITECTURE.md` (PADR), `ARCHITECTURE.md`.

## 2. Operating Principles (non-negotiables)

1. Business rules live in `core`; UIs present pre-computed fields only.
2. Contracts in `@esparex/contracts` are the SSOT for every schema.
3. One component per screen (responsive via CSS); no local primitives.
4. Accessibility (WCAG 2.2 AA) is a merge gate, not an afterthought.
5. Read-only audits; remediation via approved waves.
6. Zero suppressions; zero magic values; zero secrets in code.
7. Every change ships with Evidence: tests + guards + docs update.

## 3. Repository Layout

```
apps/          web · admin · mobile           # consumers
backend/api/   # HTTP layer (routes/controllers)
core/src/      # domains (business rules) + services/* (legacy — migrating)
packages/      # contracts, ui, mobile-ui, shared, design-tokens, kernel
docs/          # architecture/, governance/, releases/, performance/
audit-reports/ # audit evidence & certification records
```

Full standard: `REPOSITORY-GOVERNANCE.md`.

## 4. How to Work (per-ticket formula)

1. **Discover first** — `grep`/search SSOTs (contracts, ui, hooks, services) before writing any code.
2. **ALWAYS route through reviewers:** PR description must include Change Impact block (Manual §12) + ADR link when mandatory (§10).
3. Commit Conventional; label; milestone `wave-N`.
4. Run locally: `npm run type-check` `npm run lint:changed` `npm test` + package guards.
5. CI runs `repo:gate` — green required to merge.

## 5. SSOT / Contracts

- `packages/contracts` = DTOs + zod schemas. No local schema copies.
- Mapper-only boundary translation (Application/Infrastructure mappers).
- Formatters: 1 per domain concept in core services — no UI formatter clones.
- Verifier: `npm run repo:ssot` / `guard:shared-ssot`.

## 6. Design System

- Tokens (3-layer) from `@esparex/design-tokens`; primitives from `@esparex/ui` / `mobile-ui`.
- **Never** implement Button/Input/Dialog/Table locally (AGENTS Do-Not-Duplicate list).
- Dark mode via tokens; responsive = CSS breakpoints.
- a11y audit = 10-part mandatory checklist (AGENTS) before any UI PR.
- Manual: `UI-UX-GOVERNANCE.md`.

## 7. APIs

- `/api/v1`, canonical envelope (`success|data|meta|error`), pagination meta, zod validation.
- OpenAPI annotations required (RC ≥ 50% coverage gate).
- See `API-GOVERNANCE.md`.

## 8. Database

- Models in core; indexes justified + TTL named; transactions session-based; no hard deletes (guard).
- `DATABASE-GOVERNANCE.md`.

## 9. Security

- JWT + CSRF web/admin; OTP HMAC-hashed; prod OTP provider=msg91 (F51 — no launch w/ test provider).
- Secrets via env sync only; `repo:secret` nightly; SECURITY-GOVERNANCE.md.

## 10. Testing & Quality Gates

- `npm test` (backend+core+mobile today; web wiring = Wave 4), Playwright (Wave 5), axe-core.
- Gates: `npm run repo:gate` — mandatory GATE-001 list: `TESTING-GOVERNANCE.md`, `quality-gates.md`.

## 11. DevOps & Deploys

- CI jobs `ci.yml`/`codeql.yml`/`governance.yml`; Render for API, Vercel apps.
- Environments: dev → staging → UAT → prod; releases via RC tag & cert card.
- Rollback: versioned tags (WIP Wave 4). `DEVOPS-GOVERNANCE.md`, `RELEASE-GOVERNANCE.md`.

## 12. ADRs

Change touched architecture/schema/API break/auth/payments/infra/new package? → `docs/architecture/adr/` file per template (§10 manual) + ARB sign-off (§14 manual). Index: docs/architecture/adr/ (ADR-004/005 now).

## 13. Risk & Debts

- Risks: `docs/governance/risk-register.md` (RISK-001).
- Findings: `audit-reports/*` F-register; debt in Vol-4 §49; remediation waves in `ENTERPRISE-REMEDIATION-PROGRAM.md`.

## 14. Governance Map

```
AGENTS.md ─► ENTERPRISE-AUDIT-MANUAL.md ─► discipline manuals (12)
    │              │                            │
    ├─ Vol 1–5 evidence record                ├─ REPOSITORY / API / DB /
    ├─ certification ladder                   ├─ UI-UX / SECURITY / DEVOPS /
    ├─ cadence + exceptions                   ├─ TESTING / DOCUMENTATION /
    └─ continuous pipeline gate               └─ RELEASE / METRICS
```

## 15. Troubleshooting / Snaps (wip: extended in wave)

| Symptom | Doc |
| --- | --- |
| Guard failing & suppressed | ENFORCEMENT_HIERARCHY.md, `npm run repo:gate` output |
| Build/env issues | `ENVIRONMENT_VARIABLES.md` |
| Local mobile (Expo) | `docs/local-ios-development.md` |
| Payments↔webhook | Vol-2 §16.5 + DEVOPS |
| OTP not sending | `SECURITY-GOVERNANCE.md` §1 provider note |

---

*Handbook v1.0 — 2026-08-09. Governance library: docs/governance/* · Evidence: audit-reports/*.*