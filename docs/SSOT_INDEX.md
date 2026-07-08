# SSOT_INDEX.md — Single Source of Truth Index

**Status:** Active  
**Owner:** platform-team  
**Last Updated:** 2026-07-08  

This file lists every Single Source of Truth (SSOT) document in the repository. All SSOTs are authoritative within their scope. If a non-SSOT document contradicts an SSOT, the SSOT wins.

---

## Tier 1 — Canonical SSOTs (Domain & Architecture)

| Document | Scope | Location |
|----------|-------|----------|
| Domain Model SSOT | User roles, listing lifecycle, GeoJSON, DB schema | `docs/ssot/DOMAIN_MODEL_SSOT.md` |
| API Contract SSOT | API namespaces, HTTP methods, error envelopes, CSRF | `docs/ssot/API_CONTRACT_SSOT.md` |
| Architecture Flow SSOT | Post/Edit Ad, Location prompts, Admin approval | `docs/ssot/ARCHITECTURE_FLOW_SSOT.md` |
| CI/CD SSOT | CI pipeline, Husky hooks, quality gates, environments | `docs/ssot/CI_CD_SSOT.md` |
| Governance Policy | Developer standards, TypeScript rules, lifecycle states | `docs/governance/GOVERNANCE_POLICY.md` |
| AI Governance Boundary | AI prompt isolation, One-Brain Rule, conflict resolution | `docs/governance/AI_GOVERNANCE_BOUNDARY.md` |
| Package Contract | Enforced dependency rules, 14 core namespaces | `docs/architecture/PACKAGE_CONTRACT.md` |

---

## Tier 2 — Supporting (Auto-Registered)

| Document | Scope | Location |
|----------|-------|----------|
| Architecture ADRs (001-007) | Core Package, Shared, Backend, Boundaries, Monorepo, Namespace Lockdown, Enforcement | `docs/architecture/adr/` |
| Other ADRs | Decisions, branch strategy, deployment, API versioning, governance | `docs/decisions/` |

---

## Tier 3 — AI Brain (Agent Initialization)

| Document | Scope | Location |
|----------|-------|----------|
| 12 Brain Modules (ERB-000 to ERB-011) | Repository identity, tech stack, structure, architecture, dependencies, coding standards, governance, CI/CD, skills, initialization, vocabulary | `.agents/brain/` |

---

## SSOT Principles

1. **One fact, one place** — Every piece of knowledge has exactly one authoritative source.
2. **Tiered authority** — If two SSOTs disagree, the lower-numbered tier wins.
3. **No shadow SSOTs** — Any document claiming authority must be registered here. Unregistered documents are non-authoritative.
4. **Cross-reference, don't duplicate** — Instead of repeating a fact, link to its SSOT.
