# DEPENDENCY_POLICY.md

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

This document establishes rules for dependencies within the MAD Entertrainment monorepo. It details permitted and prohibited dependency paths to support automated dependency validators and to ensure build caching can run optimally without cycle-induced cache busting.

---

## Scope

This policy governs:
- Direct imports in source files (`import ... from '...'` or `require('...')`).
- Workspace-level dependencies declared in `package.json` configurations.
- Third-party packages installed via `pnpm`.

---

## Allowed Dependency Flow

The permitted direction of dependency flows between monorepo workspaces is strictly defined as follows:

```
[ Application Workspaces ]
       │            │
       ▼            ▼
  [ @mad/ui ]   [ @mad/validations ]
       │            │
       ▼            ▼
   [ @mad/utils / @mad/types ]
       │
       ▼
   [ @mad/shared ]
```

### Table of Allowed Direct Dependencies

| Workspace | Allowed Internal Dependencies |
|---|---|
| `@mad/web` | `@mad/ui`, `@mad/validations`, `@mad/utils`, `@mad/types`, `@mad/shared` |
| `@mad/admin` | `@mad/ui`, `@mad/validations`, `@mad/utils`, `@mad/types`, `@mad/shared` |
| `@mad/server` | `@mad/validations`, `@mad/utils`, `@mad/types`, `@mad/shared` |
| `@mad/ui` | `@mad/types`, `@mad/shared` |
| `@mad/validations` | `@mad/types`, `@mad/shared` |
| `@mad/utils` | `@mad/types`, `@mad/shared` |
| `@mad/types` | `@mad/shared` |
| `@mad/shared` | None |

---

## Dependency Rules

### D-001 — Circular Dependency Prohibition
Circular dependency loops of any length are strictly forbidden (e.g., A → B → A, or A → B → C → A). This applies to file-level imports and workspace-level dependencies.

### D-002 — Third-Party Dependency Version Synchronization
To ensure single-version consistency inside the monorepo:
- Shared third-party packages (e.g., `zod`, `react`, `typescript`) must use identical version ranges in all `package.json` files where they are declared.
- Root `package.json` overrides must be used to enforce specific sub-dependency resolutions across the workspace.

### D-003 — Framework Lock-in Prevention
Shared libraries (`@mad/shared`, `@mad/utils`, `@mad/types`, `@mad/validations`) must remain framework-agnostic. They must not depend on or import Next.js, Express.js, React, or browser-specific objects unless scoped to UI-specific packages.

### D-004 — Peer Dependency Enforcement
If a shared package requires a specific runtime host (e.g., `@mad/ui` requiring `react`), it must declare that host as a `peerDependency` in its `package.json` to ensure the consuming application supplies the singleton instance.

---

## Allowed Practices

- Utilizing `@mad/validations` in frontend forms and backend controllers.
- Updating dependencies collectively via Turborepo commands.
- Declaring common TypeScript configuration rules in `tsconfig.base.json` at the root and extending them in workspace-specific `tsconfig.json` configurations.

---

## Forbidden Practices

- Importing components from `@mad/ui` inside backend-focused modules (such as database migrations or background queue workers).
- Using relative paths (`../../`) to import modules outside of the current workspace directory; all external references must resolve via workspace package names (e.g. `@mad/shared`).

---

## Exceptions

- Scripts under `scripts/` (e.g., governance engine tools) may import dev-specific helper libraries that are not packaged for production distribution.

---

## Related Documents

- [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
- [WORKSPACE_POLICY.md](./WORKSPACE_POLICY.md)

---

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-07-03 | Principal Software Architect | Initial baseline for PR3 |
