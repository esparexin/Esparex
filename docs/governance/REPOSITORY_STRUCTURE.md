# REPOSITORY_STRUCTURE.md

- **Owner**: Principal Software Architect
- **Status**: Active
- **Version**: 1.0.0
- **Baseline Version**: 1
- **Last Updated**: 2026-07-03
- **Related Documents**:
  - [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
  - [WORKSPACE_POLICY.md](./WORKSPACE_POLICY.md)

---

## Purpose

This document outlines the architectural intent, ownership, allowed contents, and disallowed contents for every top-level directory in the MAD Entertrainment monorepo. It establishes repository boundaries to prevent directory drift and structure rot.

---

## Scope

This policy applies to all directories and files residing at the root level of the repository.

---

## Directory Inventory

### 1. `apps/`
* **Purpose**: Houses deployable applications and services.
* **Ownership**: Individual product teams (e.g., Platform Team, UI/UX Guild).
* **Allowed Contents**: Next.js apps, Express API servers, desktop clients, e2e test suites.
* **Disallowed Contents**: Shared packages, generic UI components meant for consumption by multiple apps.
* **Dependencies**: May depend on any package in `packages/`. Must never depend on other workspaces in `apps/`.

### 2. `packages/`
* **Purpose**: Houses reusable, shared code modules.
* **Ownership**: Monorepo Governance Owner & Shared Package Owners.
* **Allowed Contents**: Component libraries (`ui`), type definitions (`types`), common validation schemas (`validations`), utilities (`utils`), shared business logic (`shared`).
* **Disallowed Contents**: Deployable binaries, page-level routing configurations, API routes, database connection instances.
* **Dependencies**: Must only depend on other packages in `packages/` according to the strict dependency flow. Must never depend on `apps/`.

### 3. `scripts/`
* **Purpose**: Contains maintenance scripts, build tooling, and governance engines.
* **Ownership**: Platform Team & DevOps.
* **Allowed Contents**: Automation scripts (TypeScript, JS, Bash), database migration scripts, custom validation scripts.
* **Disallowed Contents**: Production application code, components, packages.
* **Dependencies**: May import from `packages/` if necessary for data types or utilities, but should remain largely standalone.

### 4. `docs/`
* **Purpose**: Centralised repository documentation and Architecture Decision Records (ADRs).
* **Ownership**: All developer guilds and team owners.
* **Allowed Contents**: Markdown documentation (`.md`), ADRs (`docs/decisions/`), diagrams (SVG, Mermaid), system runbooks, and roadmaps.
* **Disallowed Contents**: Executable source code, production code files.
* **Dependencies**: None.

### 5. `.governance/`
* **Purpose**: Persisted state, exceptions, and baseline configurations for the automated Governance Engine.
* **Ownership**: Governance Engine / Monorepo Owner.
* **Allowed Contents**: Validated findings (`findings/active/`, `findings/closed/`, `findings/suppressed/`), bypass exceptions (`exceptions/`), execution history (`history/`), performance metrics (`metrics/`), manifest (`manifest.json`), baseline (`baseline.json`).
* **Disallowed Contents**: Temporary dev scratchpads, application source files.
* **Dependencies**: None.

### 6. `.github/`
* **Purpose**: GitHub-specific configurations, issue templates, and CI/CD workflow files.
* **Ownership**: DevOps & Platform Team.
* **Allowed Contents**: GitHub Action YAML workflows, pull request templates, issue templates, dependabot configurations.
* **Disallowed Contents**: Arbitrary build outputs, unrelated helper scripts.
* **Dependencies**: None.

### 7. `.agents/`
* **Purpose**: Holds custom instructions, rules, and skills for autonomous AI agents.
* **Ownership**: AI Governance Guild.
* **Allowed Contents**: Global rules (`AGENTS.md`), custom skills directories containing instructions (`SKILL.md`) and supporting references.
* **Disallowed Contents**: Source code files belonging to apps or packages.
* **Dependencies**: None.

### 8. `reports/`
* **Purpose**: Generated outputs from testing, coverage checks, linting, and audit tools.
* **Ownership**: Automations & CI Runner.
* **Allowed Contents**: Test reports, coverage summaries, lint reports, dependency analysis output.
* **Disallowed Contents**: Checked-in source code or documentation. (Note: Root `reports/` is git-ignored, but structured reporting is allowed).
* **Dependencies**: None.

---

## Allowed Practices

- Creating new deployable units within `apps/` using the workspace configuration.
- Creating new shared libraries within `packages/` after formal architecture review.
- Documenting directory-specific rules inside a local `README.md` within that directory.

---

## Forbidden Practices

- Creating ad-hoc, untracked root directories (e.g. `temp/`, `backup/`, `old-code/`).
- Storing transient assets or build artifacts in version-controlled directories.
- Violating the separation between deployable (`apps/`) and shared library (`packages/`) directories.

---

## Exceptions

- Temporary debug scratch files may be created inside `/scratch/` (which is git-ignored).

---

## Related Documents

- [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
- [WORKSPACE_POLICY.md](./WORKSPACE_POLICY.md)

---

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-07-03 | Principal Software Architect | Initial baseline for PR3 |
