# NAMING_CONVENTIONS.md

- **Owner**: Principal Software Architect
- **Status**: Active
- **Version**: 1.0.0
- **Baseline Version**: 1
- **Last Updated**: 2026-07-03
- **Related Documents**:
  - [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
  - [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)

---

## Purpose

This document defines standard naming conventions across the monorepo for directories, files, components, classes, variables, constants, hooks, scripts, configurations, and documentation. Adhering to these conventions maintains consistency, readability, and compatibility with automated linting rules.

---

## Scope

This policy applies to all files and directories written, generated, or renamed inside the repository.

---

## Naming Standards

### 1. Directories
* **Convention**: `kebab-case` (lowercase words separated by hyphens).
* **Allowed Characters**: `a-z`, `0-9`, `-`
* **Examples**:
  - `apps/admin`
  - `packages/shared`
  - `scripts/governance`
  - `src/components/button`
* **Exceptions**: Directory names representing Next.js route groups (e.g. `(auth)`) or dynamic segments (e.g. `[id]`) follow Next.js framework conventions.

### 2. Source Files (React / UI Components)
* **Convention**: `PascalCase` (words capitalised, no separators).
* **Extension**: `.tsx`
* **Examples**:
  - `CoolButton.tsx`
  - `dj-operators/DJFormActions.tsx`
  - `InviteAdminModal.tsx`

### 3. Source Files (Logic / Functions / Services / Utilities)
* **Convention**: `snake_case` or `kebab-case` based on context.
  - Server-side logic and utility files: `snake_case` (words separated by underscores).
  - Scripts and CLI entry points: `kebab-case` (words separated by hyphens).
* **Extensions**: `.ts`, `.js`
* **Examples**:
  - `scripts/governance/core/finding_manager.ts` (snake_case for engine core)
  - `scripts/cleanup-ports.js` (kebab-case for script run directly)
  - `packages/shared/src/utils/date_formatter.ts`

### 4. React Components (Classes / Functions)
* **Convention**: `PascalCase` for component declarations.
* **Examples**:
  ```tsx
  export function InviteAdminModal() { ... }
  ```

### 5. Custom React Hooks
* **Convention**: CamelCase starting with `use`.
* **Examples**:
  - `useAuth`
  - `useActiveBookings`
  - `useDebouncedState`

### 6. Variables and Functions
* **Convention**: `camelCase` (first letter lowercase, subsequent words capitalised).
* **Examples**:
  - `const activeFindingIds = new Set<string>();`
  - `function matchOrCreateFinding(violation: StatelessViolation): Finding`

### 7. Constants
* **Convention**: `UPPER_SNAKE_CASE` (all uppercase words separated by underscores).
* **Examples**:
  - `const MAX_RETRY_ATTEMPTS = 3;`
  - `export const SHARED_BUTTON_STYLES = "bg-blue-600 text-white";`

### 8. Types and Interfaces
* **Convention**: `PascalCase` for declaration names. Avoid prefixing interfaces with `I` (e.g. `IFinding` is forbidden; use `Finding` instead).
* **Examples**:
  - `export interface FindingOccurrence { ... }`
  - `export type FindingStatus = 'NEW' | 'CLOSED';`

### 9. Configuration Files
* **Convention**: Framework standard conventions (usually `kebab-case` or `camelCase`).
* **Examples**:
  - `turbo.json`
  - `tsconfig.base.json`
  - `eslint.config.mjs`
  - `postcss.config.js`
  - `vercel.json`

### 10. Documentation files
* **Convention**: `UPPER_SNAKE_CASE` or `kebab-case` based on hierarchy.
  - Root policies / manuals: `UPPER_SNAKE_CASE`
  - ADRs: `ADR-###-description-kebab-case`
* **Extension**: `.md`
* **Examples**:
  - `README.md`
  - `REPOSITORY_GOVERNANCE.md`
  - `docs/decisions/ADR-002-governance-persistence-v2.md`

---

## Allowed Practices

- Using standard camelCase for in-memory temporary variables.
- Grouping related components under a subdirectory named in `kebab-case`.

---

## Forbidden Practices

- Creating files with spaces in their names (e.g. `My Component.tsx`).
- Mixing PascalCase and snake_case in the same directory (e.g., having `date_formatter.ts` and `StringHelper.ts` side by side).
- Using names with trailing numbers indicating copies (e.g. `Button2.tsx`, `ButtonCopy.tsx`).

---

## Exceptions

- Dynamic route folders in Next.js applications (e.g. `[id]/page.tsx`).

---

## Related Documents

- [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
- [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)

---

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-07-03 | Principal Software Architect | Initial baseline for PR3 |
