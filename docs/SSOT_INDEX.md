# SSOT_INDEX.md — Single Source of Truth Index

**Status:** Active  
**Owner:** platform-team  
**Last Updated:** 2026-07-08  

This file lists every Single Source of Truth (SSOT) document in the repository. All SSOTs are authoritative within their scope. If a non-SSOT document contradicts an SSOT, the SSOT wins.

---

## Tier 1 — Canonical SSOTs (Domain & Architecture)

| Document | Scope | Location |
|----------|-------|----------|
| Repository Single Source of Truth | Master repository architecture SSOT, layer layouts, coding, naming, build and test rules | `docs/architecture/REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md` |
| Repository Directory Standard | Allowed directory contents, package structure templates, and folder layout rules | `docs/architecture/REPOSITORY_DIRECTORY_STANDARD.md` |
| Current Architecture | Current system package graph, request flows, authentication, payments and chat lifecycles | `docs/architecture/CURRENT_ARCHITECTURE.md` |
| Domain Model SSOT | User roles, listing lifecycle, GeoJSON, DB schema | `docs/ssot/DOMAIN_MODEL_SSOT.md` |
| API Contract SSOT | API namespaces, HTTP methods, error envelopes, CSRF | `docs/ssot/API_CONTRACT_SSOT.md` |
| Architecture Flow SSOT | Post/Edit Ad, Location prompts, Admin approval | `docs/ssot/ARCHITECTURE_FLOW_SSOT.md` |
| CI/CD SSOT | CI pipeline, Husky hooks, quality gates, environments | `docs/ssot/CI_CD_SSOT.md` |
| Governance Policy | Developer standards, TypeScript rules, lifecycle states | `docs/governance/GOVERNANCE_POLICY.md` |
| AI Governance Boundary | AI prompt isolation, One-Brain Rule, conflict resolution | `docs/governance/AI_GOVERNANCE_BOUNDARY.md` |
| Package Contract | Enforced dependency rules, 14 core namespaces | `docs/architecture/PACKAGE_CONTRACT.md` |
| AI Agent Entry Point | Context discovery, conflict resolution, SSOT loading | `AGENTS.md` |
| AI Runtime Specification | Runtime architecture, execution flow, CLI reference, skill taxonomy | `docs/AI_RUNTIME_SPEC.md` |
| SSOT Index (this document) | Consolidated index of all Single Sources of Truth with tier hierarchy | `docs/SSOT_INDEX.md` |
| Architecture ADR-001 | Core Package Architecture | `docs/architecture/adr/ADR-001-core-package.md` |
| Architecture ADR-002 | Shared Package Architecture | `docs/architecture/adr/ADR-002-shared-package.md` |
| Architecture ADR-003 | Backend API Structure | `docs/architecture/adr/ADR-003-backend-api.md` |
| Architecture ADR-004 | Package Boundary Rules | `docs/architecture/adr/ADR-004-boundaries.md` |
| Architecture ADR-005 | Monorepo Strategy | `docs/architecture/adr/ADR-005-monorepo.md` |

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
