# REPOSITORY_POLICY.md

- **Owner**: Principal Software Architect
- **Status**: Active
- **Version**: 1.0.0
- **Baseline Version**: 1
- **Last Updated**: 2026-07-03
- **Related Documents**:
  - [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)
  - [WORKSPACE_POLICY.md](./WORKSPACE_POLICY.md)
  - [DEPENDENCY_POLICY.md](./DEPENDENCY_POLICY.md)
  - [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
  - [FILE_LIFECYCLE.md](./FILE_LIFECYCLE.md)
  - [BASELINE.md](./BASELINE.md)
  - [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
  - [ARCHITECTURE.md](../../ARCHITECTURE.md)

---

## Purpose

This document is the master policy for the MAD Entertrainment monorepo. It defines the rules that govern all engineering work, repository organisation, workspace boundaries, naming standards, dependency flows, and governance operations.

All human developers and AI coding agents must read and follow this document. In any conflict between this document and a more specific policy document, the more specific document takes precedence within its domain.

---

## Scope

This policy applies to:

- All code committed to this repository
- All pull requests targeting `develop` or `live`
- All AI coding agents operating in this repository
- All automated tooling that reads or writes repository files

---

## Definitions

| Term | Definition |
|------|-----------|
| **Monorepo** | A single Git repository containing multiple related applications and shared packages managed with pnpm workspaces and Turborepo |
| **Application** | A deployable unit under `apps/` that has end-user or server-side responsibility |
| **Package** | A shared library under `packages/` consumed by one or more applications |
| **Workspace** | A pnpm workspace member declared in `pnpm-workspace.yaml` |
| **Governance engine** | The automated audit subsystem under `scripts/governance/` |
| **Finding** | A persisted record of a governance rule violation stored under `.governance/findings/` |
| **Baseline** | The machine-readable governance state snapshot at `.governance/baseline.json` |
| **ADR** | Architecture Decision Record — a permanent record of an architectural decision |

---

## Core Rules

### R-001 — Single Source of Truth

Every business rule, type, schema, and constant must have exactly one owner. Duplication of logic between workspaces is forbidden.

### R-002 — Workspace Isolation

Applications in `apps/` must not import directly from other applications. All shared logic must live in `packages/`.

### R-003 — Dependency Direction

Dependencies must flow in one direction only:

```
apps/*  →  packages/*
packages/types  →  packages/shared
packages/utils  →  packages/types
packages/validations  →  (external only: zod)
packages/ui  →  (external only: react)
packages/shared  →  (no internal deps)
```

Circular dependencies are forbidden at all levels.

### R-004 — Branch Protection

`develop` and `live` are protected branches. Direct commits are forbidden. All changes must arrive via pull request.

### R-005 — PR Scope

One PR must address exactly one problem category. Cross-cutting refactors, business logic changes, API contract changes, and UI redesigns must not be combined in a single PR.

### R-006 — Governance Compliance

All code must pass `pnpm governance:docs` without introducing new findings before a PR is merged to `develop`.

### R-007 — Dead Code Prohibition

Unused imports, functions, hooks, state, interfaces, types, constants, files, and routes must be removed before a PR is merged. Code kept "for future use" is forbidden.

### R-008 — File Size Limits

| File type | Preferred | Review required | Refactor required | PR blocked |
|-----------|-----------|----------------|-------------------|------------|
| Component | 0–300 lines | 301–500 | 501–700 | 701+ |
| Hook | 0–250 lines | 251–400 | 401–600 | 601+ |
| Service | 0–500 lines | 501–700 | 701–900 | 901+ |
| Controller | 0–200 lines | 201–350 | 351–500 | 501+ |
| Schema | 0–300 lines | 301–500 | — | 600+ |

### R-009 — Shared Ownership

Any utility, type, schema, constant, or validation that is used by more than one workspace must live in the appropriate `packages/*` library. It must not be duplicated per-workspace.

### R-010 — Repository Hygiene

Disallowed directory names: `temp`, `temp2`, `misc`, `old`, `backup`, `new-folder`, `final`, `test2`. Every directory must have a defined owner and purpose.

---

## Allowed Practices

- Creating feature branches from `develop` following the naming convention in [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
- Adding shared logic to the appropriate `packages/*` library after searching for existing implementations
- Adding ADRs to `docs/decisions/` following the ADR template
- Running `pnpm governance:docs` at any time to check compliance

---

## Forbidden Practices

- Importing from `apps/*` within another `apps/*` workspace
- Duplicating validation logic between packages
- Committing directly to `develop` or `live`
- Adding code marked as "temporary" without a removal plan
- Creating directories named after their date or iteration (`v2`, `final`, `new`)
- Storing runtime secrets or environment values in committed files

---

## Exceptions

Exceptions to any rule in this policy must be documented in `.governance/exceptions/` with:

- Justification
- Approval authority
- Expiration date
- Linked issue or PR

---

## Related Documents

- [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) — directory inventory and responsibilities
- [WORKSPACE_POLICY.md](./WORKSPACE_POLICY.md) — workspace boundary rules
- [DEPENDENCY_POLICY.md](./DEPENDENCY_POLICY.md) — allowed and forbidden dependency flows
- [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md) — naming standards
- [FILE_LIFECYCLE.md](./FILE_LIFECYCLE.md) — file creation, modification, and deletion rules
- [BASELINE.md](./BASELINE.md) — machine-readable governance baseline specification
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md) — roles, matrices, PR and branch policy
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — system architecture overview

---

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-07-03 | Principal Software Architect | Initial baseline for PR3 |
