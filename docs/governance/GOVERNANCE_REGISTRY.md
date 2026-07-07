# Esparex Governance Registry (ARCH-001)

## Objective
Maintain a single SSOT (Single Source of Truth) registry documenting each governance capability across the Esparex platform. This prevents teams from unknowingly implementing the same governance area twice and ensures a clear inventory of all active and planned governance rules.

---

## Active & Planned Governance

| ID | Purpose | Canonical Owner | Consumers | Status | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-GOV-001** | API Contracts & Responses | `@esparex/shared` | `core`, `apps/web`, `apps/admin` | Planned | CI Validator (`verify-api-contract.js`) |
| **DATA-GOV-001** | Data Lifecycle & Integrity | `core/models` | Workers, APIs, Scripts | Planned | `catalog-governance-audit.js` |
| **ENV-GOV-001** | Environment Validation | `core/config` (Backend)<br>`apps/web` (Frontend) | Local Workspace | Active | Zod schemas run at process start |
| **WORKER-GOV-001**| Background Workers | `core/infrastructure` | `esparex-worker` | Planned | StartupGate & PM2 Health Checks |
| **DEPLOY-GOV-001**| Deployment Readiness | `scripts/ops` | CI/CD Pipelines | Planned | `deploy-gate.js` orchestrator |
| **SEED-GOV-001** | Local Dev Seeding | `backend/user/seeds`| Local Dev | Planned | `setup:dev` (safe), `reset:dev` (destructive) |
| **CODE-GOV-001** | Route Shadowing | `scripts` | Backend APIs | Active | `guard-route-shadowing.js` |
| **CODE-GOV-002** | Lifecycle Bypass | `scripts/policy` | Backend, Scripts | Active | `guard-platform-governance.js` |
| **ARCH-GOV-001** | Architecture Decisions | `docs/decisions` | All Developers | Active | ADR Template Standard |

## Extension Before Creation Rule
Before creating **any** new implementation, developers must answer:
1. Does something already exist in this registry?
2. Can the existing capability be extended?
3. Is it deprecated?
4. Is it experimental?
5. Is it dead code?

**Only if all answers are NO** should a new implementation be introduced.
