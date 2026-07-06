# ADR-007: Architecture Enforcement Tooling

**Status:** Accepted  
**Date:** 2026-07-06  
**Architecture Version:** v1.1.0  
**Depends on:** ADR-006 (Namespace Lockdown)  
**Authors:** Platform Team

---

## Context

ADR-006 established the 14-namespace public API contract and migrated 182 consumer files to use canonical namespace imports. However, the enforcement was **passive** — relying on:
- TypeScript path mappings (prevents undefined imports from resolving)
- Manual verification gates run on demand
- Governance documentation

This means:
- A new file added inside `core/src/services` can freely import from `core/src/infrastructure/db`, violating the internal namespace dependency matrix.
- CI does not automatically catch namespace boundary violations in new code.
- The rules exist as documentation but not as executable policy.

Without active enforcement, the namespace contract will drift as new code is added under time pressure.

---

## Decision

Introduce automated architecture enforcement via two complementary tools:

### 1. Architecture Dependency Matrix (`scripts/architecture/matrix.js`)

A single JavaScript module that is the **sole source of truth** for all dependency rules. Both tools below are generated from it. Rule changes must be made in the matrix and the configs regenerated — not hand-authored in either tool.

### 2. Dependency Cruiser (`.dependency-cruiser.cjs`)

- Tool: `dependency-cruiser`
- Config: **generated** from `matrix.js` by `scripts/architecture/generate-depcruiser.js`
- Analyzes the compiled import graph at the file level
- Runs in CI as part of `architecture:check`
- **Staged rollout**: report-only first, then warnings, then hard-fail

### 3. ESLint Boundaries (`eslint.config.mjs` — boundaries block)

- Tool: `eslint-plugin-boundaries`
- Config: **generated** from `matrix.js` by `scripts/architecture/generate-eslint-boundaries.js`
- Analyzes import statements at the source AST level
- Provides **editor-time feedback** (surfaces violations in IDE as warnings)
- **Mode**: `warn` initially; promoted to `error` once baseline is confirmed clean

### 4. Composite `architecture:check` command

A single npm script that runs all architecture checks in order:
1. Deep import detection (`git grep`)
2. Circular dependency detection (madge)
3. Dependency Cruiser boundary check (core/src)
4. Dependency Cruiser boundary check (backend/user/src)
5. Public API namespace load test
6. Architecture report generation (`.architecture-report.md`)

Integrated into CI as a mandatory step after `governance:all`.

---

## Architecture Dependency Matrix (Summary)

The full matrix is authoritative. This is a summary of the governing principles:

| Layer | Allowed to Import | Forbidden |
| --- | --- | --- |
| `apps/*` | `@esparex/shared`, `@esparex/core/types`, `@esparex/core/domain` | All other core namespaces |
| `backend/user` | Any `@esparex/core/*` namespace | `core/src/**` internals |
| `core/src/domain` | `types` | Everything else |
| `core/src/infrastructure` | `config`, `utils` | `services`, `models`, `domain`, `tooling` |
| `core/src/services` | `models`, `domain`, `validators`, `utils`, `events`, `infrastructure`, `config` | `tooling`, `jobs`, `queues`, `workers` |
| `core/src/tooling` | `infrastructure`, `config`, `utils` | `services`, `models`, `domain` |
| `shared` | *(nothing from this monorepo)* | Everything |

---

## Exception Policy

Exceptions to the matrix require:
1. An entry in the `EXCEPTIONS` array in `matrix.js` with a justification, approver, and date.
2. No inline tool-level silencing (`/* depcruise-ignore */`) without a corresponding exception entry.
3. Exception entries are reviewed in the same PR as the code that triggers them.

---

## Rollout Plan

| Phase | Action | Timing |
| --- | --- | --- |
| 1 | Install tools, generate configs, run in report mode | Architecture v1.1.0 activation |
| 2 | Fix any violations (expected: 0 from v1.0 migration) | Architecture v1.1.0 activation |
| 3 | Enable `warn` mode for ESLint Boundaries | Architecture v1.1.0 activation |
| 4 | Enable hard-fail for Dependency Cruiser | After 2 weeks of clean report |
| 5 | Promote ESLint Boundaries from `warn` to `error` | After hard-fail is stable |

---

## Rollback Strategy

If Dependency Cruiser produces false positives that block CI:
1. Add a targeted exception to `matrix.js` with justification.
2. Regenerate `.dependency-cruiser.cjs`.
3. The `[skip-arch]` commit token can bypass `architecture:check` for emergency hotfixes (rate-limited to once per quarter).

Do not disable the `architecture:check` script entirely.

---

## Consequences

### Positive
- Boundary violations are caught automatically before they merge.
- Rules cannot drift between tools — both are generated from the same source.
- Editor-time feedback (ESLint) reduces friction for developers.
- Architecture Report provides a dated audit trail.

### Negative
- Matrix generation step must be run when rules change (`npm run architecture:generate`).
- Generated files (`.dependency-cruiser.cjs`, `boundaries-config.js`) must be committed alongside rule changes.
- Initial baseline period (report-only mode) reduces enforcement value temporarily.

### Neutral
- Existing exceptions (e.g., dynamic `require()` in `reliabilityAlerts.ts`) are tracked in the `EXCEPTIONS` registry rather than inline silencing comments.
