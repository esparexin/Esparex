# Architecture Implementation Guide: DDD Core Consolidation

**Module**: 6B of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md)

---

## 1. Incremental Refactoring Mandate

To preserve product feature velocity and minimize regression risk, **all refactoring toward the Hexagonal DDD architecture must execute via small, focused pull requests (PRs)**. Large repository-wide structural rewrites are strictly prohibited.

Every incremental PR must:
1. Address a single bounded context or a single migration phase.
2. Compile cleanly with zero type-checking errors.
3. Pass all 540 automated tests (`npm test` in workspaces).
4. Introduce no circular dependencies or boundary violations.

---

## 2. 5-Phase Execution Roadmap

The implementation of the target architecture is structured across five sequential, low-disruption phases:

### Phase 1 — Internal Core Refactor (Current Priority)
- **Goal**: Consolidate `core/` services into bounded context subdirectories without changing workspaces.
- **Action Items**:
  1. Introduce `core/domains/` directory.
  2. Migrate one bounded context at a time (`Catalog` ──► `Listings` ──► `Payments` ──► `Users` ──► `Chat`) into the standard CQRS-ready layout (application/domain/ports/validation).
  3. Create public `index.ts` barrels for each domain context.
  4. Eliminate all cross-domain deep imports, forcing consumers to go through the barrel facades.

### Phase 2 — Architecture Automation
- **Goal**: Enforce boundary integrity automatically in the CI pipeline.
- **Action Items**:
  1. Implement all verification scripts inside `tooling/architecture/` (`verify-boundaries.ts`, `verify-public-api.ts`, `verify-manifests.ts`, `verify-kernel.ts`, `verify-scorecard.ts`).
  2. Add strict `dependency-cruiser` rules enforcing ports-and-adapters isolation and layer constraints.
  3. Add ESLint rules blocking deep subdirectory imports across domains.
  4. Generate and print scorecard reports on each pull request.

### Phase 3 — Shared Package Refinement
- **Goal**: Clean up universal dependencies.
- **Action Items**:
  1. Audit `@esparex/shared` and narrow its scope to true cross-platform contracts.
  2. Extract specialized packages (e.g. `packages/contracts`, `packages/foundation`, `packages/ui`) into the `packages/` workspace only when a package has a single, well-defined responsibility.

### Phase 4 — Runtime Evolution
- **Goal**: Evolve the server delivery topology.
- **Action Items**:
  1. Relocate the Express API runtime wrapper from `backend/api/` to `services/api/`.
  2. Introduce `services/worker/` to handle CPU-intensive or asynchronous tasks.
  3. Introduce `services/scheduler/` to manage recurring cron tasks.

### Phase 5 — Domain Graduation
- **Goal**: Graduate mature domain modules into standalone root-level packages.
- **Action Items**:
  1. Evaluate candidate domains against the Graduation Gate Criteria.
  2. Relocate the directory from `core/domains/<domain-name>/` to the root `domains/<domain-name>/` workspace via `git mv`.
  3. Update workspace configurations (`pnpm-workspace.yaml` / `package.json`).
