# ADR-005: Monorepo Organization & Phased Execution Strategy

## Status
Accepted

## Date
2026-07-05

## Context
Executing multiple cleanup, renaming, and architectural refactoring tasks simultaneously leads to complex merge conflicts, build breaking, and regression risks.

## Decision
1. **Workspaces Layout**: We utilize npm workspaces monorepo structure. For long-term layout, we will eventually introduce a `packages/` directory and move internal packages (`core` and `shared`) under it to clean up the root namespace. This structural migration is a low-priority enhancement and will **not** be performed until the repository has been stable through at least one production release.
2. **Phased Execution Order**: Cleanups and changes are sequenced in five distinct stages:
   * **Stage 1**: Repository Cleanup (Safe deletions, duplicates removal, and git hygiene).
   * **Stage 2**: Repository Stabilization (Full verification pipeline and end-to-end tests).
   * **Stage 3**: Architecture Refactoring (Split into 3A: Transport Separation and 3B: Domain Cleanup).
   * **Stage 4**: Repository Improvements (Rename `backend/user` -> `backend/api`, reorganize scripts/docs).
   * **Stage 5**: Governance (Enforcing dependency contracts and import check gates in CI).
3. **Stabilization Checkpoint**: A strict checklist is run before Stage 3, concluding in tagging the commit `baseline-stable-v1` on a known-good configuration.

## Consequences
* **Pros**: Incremental, low-risk execution, easy rollbacks, clear validation gates at every stage, and regression isolation.
* **Cons**: Slower execution speed relative to executing all modifications in a single large pull request.
