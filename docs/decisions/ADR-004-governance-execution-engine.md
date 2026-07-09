# ADR-004: Governance Rule Execution Engine

## Metadata
- **Status**: Implemented
- **Date**: 2026-07-03
- **Authors**: AI Architecture Agent & Repository Owner
- **Reviewers**: Principal Software Architect
- **Decision Category**: Governance
- **Related Documents**: [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md), [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Related GitHub Issues**: None
- **Related Pull Requests**: None

---

## Context
Before this decision, the governance scanning tool (executed via `pnpm governance:docs` or `scripts/governance/index.ts`) ran standard validators, UI design validators, and dead asset/duplicate validators in three separate, hardcoded loaders. Validator execution ordering was determined solely by array push sequences, with no ability to resolve validator prerequisites, handle dynamic execution filtering, track memory foot-prints, or enforce cycle checking.

## Problem Statement
Hardcoded validator loading and execution logic inside the CLI runner results in:
1. Orchestration duplication: parsing results and translating them to stateless violations across multiple independent blocks.
2. Lack of dependency resolution: no way to ensure one validator runs after another.
3. Rigid filtering: inability to filter validator execution by rule, category, owner, or severity.
4. Hard to maintain or scale: adding a new validator requires modifying the core index runner pipeline.

## Decision
Refactor the execution orchestration to introduce a centralized **Governance Rule Execution Engine** composed of:
1. **ValidatorRegistry**: Central registry storing validator metadata (such as priority, supported rules, supported file types, and prerequisites).
2. **ExecutionPlanner**: Determines active validators, resolves dependencies via topological sorting (DFS), and checks for circular dependencies.
3. **ExecutionScheduler**: Runs validators sequentially in deterministic order, collects metrics (such as duration and memory heap delta), and isolates failures.

All validator execution orchestration is removed from the CLI, which is simplified to parsing flags and calling `ExecutionEngine.execute()`.

## Alternatives Considered
- **Alternative A**: *Keep the split loaders structure*. Pros: simple to understand. Cons: high CLI code complexity, lacks topological sorting, cycle checking, or metrics.
- **Alternative B**: *Convert validators into async worker threads*. Pros: parallel execution. Cons: introduces thread safety issues, filesystem lock contentions, and high resource usage overhead on small developer machines.

## Consequences
- **Pros**:
  - Centralized, clean, single-point of execution orchestration.
  - Fail-fast validation of validator registry states (checks for circular dependencies, duplicate rule claims, invalid rules).
  - Flexible CLI filtering options.
  - Deterministic and identical execution plans on repeated runs.
- **Cons**:
  - Minor abstraction overhead (Registry/Planner/Scheduler classes).

---

## Technical & Operational Impact

### Migration Strategy
No historical data migration is required, as the change only affects the in-memory execution pipeline and orchestration flow. All output JSON formats remain backwards-compatible.

### Operational Impact
Adds precise timing and memory footprint metrics to the console when `--performance` is used.

### Security Impact
No security impact, as all checks execute locally or within secure CI runners without outbound connections or privilege changes.

### Performance Impact
Ensures each file type is only passed to validators that declare support, reducing unnecessary file scans.

### Testing Strategy
Verify with Vitest unit tests covering planner sorting, circle checks, filter applications, and registry validations.

### Rollback Strategy
To roll back this execution engine, revert the changes made to `scripts/governance/index.ts` to restore the manual `ValidatorLoader` orchestration.

---

## Future Considerations
Assess parallelizing validator runs or moving to worker threads if scan sizes grow beyond current single-thread thresholds.

## References
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
