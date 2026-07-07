# WORKSPACE_POLICY.md

- **Owner**: Principal Software Architect
- **Status**: Active
- **Version**: 1.0.0
- **Baseline Version**: 1
- **Last Updated**: 2026-07-03
- **Related Documents**:
  - [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
  - [DEPENDENCY_POLICY.md](./DEPENDENCY_POLICY.md)

---

## Purpose

This document defines the rules and boundaries for workspaces in the pnpm monorepo. It ensures separation of concerns, maintains clean build boundaries, and protects shared libraries from application-specific logic leakage.

---

## Scope

This policy applies to all subdirectories under `apps/*` and `packages/*` declared as workspace packages in `pnpm-workspace.yaml`.

---

## Workspace Categories

Workspaces are classified into exactly two categories:

### 1. Application Workspaces (`apps/*`)
Deployable targets that represent the final runtime bundles.
- `@mad/web`: User-facing web application (Next.js/React).
- `@mad/admin`: Administrative dashboard (Next.js/React).
- `@mad/server`: Backend API and service layer (Express.js/Node.js).

### 2. Package Workspaces (`packages/*`)
Reusable, shared library targets consumed by applications or other packages.
- `@mad/ui`: Shared design system components (React/CSS).
- `@mad/shared`: Cross-cutting utilities and shared domain configuration.
- `@mad/types`: Global TypeScript typings and contract declarations.
- `@mad/utils`: Reusable helper functions and formatting routines.
- `@mad/validations`: Validation schemas (Zod).

---

## Boundary Rules

### W-001 — Application Isolation
No workspace under `apps/` may import code, types, or configurations from another workspace under `apps/`. Cross-application integration must occur strictly via public APIs, WebSockets, or shared data stores.

### W-002 — Dependency Direction Limit
Package workspaces (`packages/*`) must never import from or depend on application workspaces (`apps/*`). All code in `packages/` must be entirely self-contained and application-agnostic.

### W-003 — UI Package Constraints
The `@mad/ui` package must remain framework-agnostic (beyond React) and must never contain business logic, database queries, Sentry reporting, environment variable configurations, or API-client invocations. It is purely presentational.

### W-004 — Validation Package Constraints
The `@mad/validations` package contains parsing and validation rules. It must never depend on the `@mad/ui` component library.

---

## Allowed Practices

- Consuming shared components from `@mad/ui` inside both `@mad/web` and `@mad/admin`.
- Importing schemas from `@mad/validations` in both `@mad/server` (for request validation) and `@mad/web` / `@mad/admin` (for form validation).
- Adding workspace-specific dev dependencies for testing or local building.

---

## Forbidden Practices

- Importing `@mad/server` logic inside `@mad/web` or `@mad/admin`.
- Copy-pasting TypeScript interface definitions between `@mad/web` and `@mad/admin` instead of publishing them in `@mad/types`.
- Adding React-based styling components to non-UI packages like `@mad/utils` or `@mad/validations`.

---

## Exceptions

- The server app `@mad/server` may consume `@mad/types` and `@mad/validations` but must not import `@mad/ui` as it is a headless Node.js environment.

---

## Related Documents

- [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
- [DEPENDENCY_POLICY.md](./DEPENDENCY_POLICY.md)

---

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-07-03 | Principal Software Architect | Initial baseline for PR3 |
