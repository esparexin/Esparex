# ADR-007: Rule Engine Architecture

## Metadata
- **Status**: Accepted
- **Date**: 2026-07-04
- **Authors**: AI Architecture Agent & Repository Owner
- **Reviewers**: Repository Governance Owner, Architecture Review Board
- **Decision Category**: Platform Architecture
- **Related Documents**: [ADR-006](ADR-006-public-contract-freeze.md)
- **Related Pull Requests**: #452 (Phase 2 — contracts), #453 (Phase 2.5 — tests)
- **Phase**: Roadmap Phase 3

---

## Context

Phase 2 froze the public contracts. Phase 2.5 protected them with a
compatibility test suite. The engine now has:

- Stable `GovernanceRule` and `Finding` interfaces
- A `EngineContext` that carries snapshot, capabilities, and config
- A `RuleRegistry` concept declared in the contracts (not yet implemented)

The current engine executes governance logic through four procedural
analyzer files called directly from the runner:

```
run.ts
  → analyzers/ancestry.ts      (IntegrationLagRule concept)
  → analyzers/dead-branches.ts (OrphanedBranchRule concept)
  → analyzers/duplicates.ts    (DuplicateTreeRule concept)
  → analyzers/lifecycle.ts     (StaleBranchRule concept)
```

Each analyzer:
- Is called with ad-hoc parameters (not `EngineContext`)
- Returns untyped or loosely typed results
- Has no formal metadata (`id`, `version`, `category`, `severity`)
- Cannot declare dependencies on other analyzers
- Cannot be enabled/disabled per configuration

This couples the runner tightly to specific analyzer implementations and
makes it impossible to add, remove, or reorder rules without modifying
the runner.

---

## Problem Statement

Without a Rule Engine:

1. **No dependency ordering**: An analyzer that needs another's output must
   be hardcoded in sequence by the runner. Adding a new rule with a
   dependency requires modifying the runner.

2. **No rule metadata**: There is no formal way to identify a rule by ID,
   categorize it, set its severity, or toggle it on/off via configuration.

3. **No extensibility**: Adding a new rule requires modifying `run.ts` or
   `run-sections.ts`. There is no registration mechanism.

4. **No immutable findings**: Analyzers return mutable objects. The frozen
   `Readonly<Finding>` contract from ADR-006 is not enforced.

5. **No test isolation**: Each analyzer is tested indirectly through the
   full runner. Rules should be independently testable via `execute(context)`.

---

## Decision

We introduce a `RuleRegistry` that:
- Accepts `GovernanceRule` registrations
- Resolves execution order via topological sort of `metadata.dependencies`
- Executes each rule in dependency order, passing `EngineContext`
- Collects all `Readonly<Finding>[]` into a single immutable result set

We migrate all four existing analyzers to discrete `GovernanceRule` classes
with namespaced IDs, formal metadata, and `execute(context: EngineContext)`
signatures.

---

## Rule Migration Map

| Current File | New Rule Class | Namespaced ID |
|---|---|---|
| `analyzers/lifecycle.ts` | `rules/StaleBranchRule.ts` | `git.branch.stale` |
| `analyzers/dead-branches.ts` | `rules/OrphanedBranchRule.ts` | `git.branch.orphaned` |
| `analyzers/duplicates.ts` | `rules/DuplicateTreeRule.ts` | `git.branch.duplicate` |
| `analyzers/ancestry.ts` | `rules/IntegrationLagRule.ts` | `git.ancestry.lag` |
| _(new)_ | `rules/BranchNamingRule.ts` | `git.branch.naming` |

---

## RuleRegistry Design

```typescript
// INTERNAL — lives in platform/engine/, not platform/contracts/
class RuleRegistry {
  private rules: Map<string, GovernanceRule> = new Map();

  register(rule: GovernanceRule): void {
    if (this.rules.has(rule.metadata.id)) {
      throw new Error(`Duplicate rule ID: ${rule.metadata.id}`);
    }
    this.rules.set(rule.metadata.id, rule);
  }

  // Returns rules in topological dependency order
  resolveExecutionOrder(): GovernanceRule[] {
    return topologicalSort([...this.rules.values()]);
  }
}
```

**Topological sort rules:**
- A rule is eligible to execute only after all its `metadata.dependencies`
  have executed
- Circular dependencies are detected during dependency resolution
  (`resolveExecutionOrder()`). If a cycle exists, the registry throws
  `CircularDependencyError` and aborts execution before any rule runs
- Rules with no dependencies execute in registration order

---

## Execution Pipeline (Phase 3)

```
run.ts
  → RuleRegistry.register(StaleBranchRule)
  → RuleRegistry.register(OrphanedBranchRule)
  → RuleRegistry.register(DuplicateTreeRule)
  → RuleRegistry.register(IntegrationLagRule)
  → RuleRegistry.register(BranchNamingRule)
  → RuleRegistry.resolveExecutionOrder()
  → For each rule (in dependency order):
      findings.push(...rule.execute(context))
  → findings passed to Scorers → Planner → Writers
```

The runner no longer imports analyzer files directly.

---

## Rule Dependency Graph

```
git.branch.stale ─────────────┐
                               ↓
git.branch.orphaned ──────► git.ancestry.lag
                               ↑
git.branch.duplicate ─────────┘

git.branch.naming   (no dependencies — executes first)
```

**Execution order resolved:**
1. `git.branch.naming`     (no deps)
2. `git.branch.stale`      (no deps)
3. `git.branch.orphaned`   (no deps)
4. `git.branch.duplicate`  (no deps)
5. `git.ancestry.lag`      (depends on stale + orphaned + duplicate)

---

## File Structure

```
scripts/governance/platform/
├── contracts/              ← Frozen (ADR-006, unchanged)
├── engine/
│   └── rule-registry.ts   ← NEW: RuleRegistry + topological sort
├── rules/
│   ├── StaleBranchRule.ts       ← Migrated from analyzers/lifecycle.ts
│   ├── OrphanedBranchRule.ts    ← Migrated from analyzers/dead-branches.ts
│   ├── DuplicateTreeRule.ts     ← Migrated from analyzers/duplicates.ts
│   ├── IntegrationLagRule.ts    ← Migrated from analyzers/ancestry.ts
│   └── BranchNamingRule.ts      ← NEW
└── testing/
    └── contracts.test.ts   ← Existing (Phase 2.5, unchanged)
```

The `analyzers/` directory is **kept intact during Phase 3** and removed
only after all rules are verified to produce equivalent findings (regression
test pass). This ensures zero behavioral regression.

---

## Behavioral Regression Guarantee

Before removing any analyzer file, we must verify that the corresponding
rule produces **identical findings** for the same input. We will:

1. Run the engine with the old analyzer path (baseline)
2. Run the engine with the new rule class (candidate)
3. Compare `Finding.affectedBranch` + `Finding.ruleId` sets — they must match
4. Only after match confirmed: remove the old analyzer file

---

## Consequences

### Positive
- Rules are independently testable: `rule.execute(context)` with a stub context
- Adding a new rule requires only implementing `GovernanceRule` + registering it
- Dependency ordering is automatic and verifiable
- Runner no longer coupled to specific analyzer file paths
- All findings are `Readonly<Finding>` — immutable after emission

### Negative
- Migration effort: four analyzers must be rewritten as rule classes
- Topological sort adds a small startup cost (O(N) where N = rule count)

### Mitigations
- Analyzers are kept during migration — zero downtime risk
- Compatibility test suite (Phase 2.5) catches any contract violations introduced
- Regression guarantee enforced before old files are deleted

---

## Alternatives Considered

### A. Keep procedural analyzers, add metadata wrapper
**Rejected.** Wrapping the existing procedural code adds complexity without
achieving true independence. The `execute(context)` contract requires that
rules receive context, not ad-hoc parameters.

### B. Use a plugin loader (dynamic `import()`)
**Deferred to v1.1.** Appropriate for external rule packs. For the v1.0
rule set, static registration is simpler and more debuggable.

### C. Execute all rules in parallel
**Deferred.** Dependencies make parallel execution unsafe for the current
rule set. Parallel execution within dependency levels is a Phase 3 v1.1
optimization.


---

## Technical & Operational Impact

### Migration Strategy
Create `platform/engine/rule-registry.ts` and migrate existing rule logic (stale branch checks, dead branch checks, naming conventions) from procedural analyzers into individual `GovernanceRule` classes. Update runner `run.ts` to execute through the registry.

### Operational Impact
Implements a topological sort execution registry, decoupling rule details from runner coordination.

### Security Impact
Provides structured, isolated environments for rule checks, keeping operations read-only.

### Performance Impact
Stateless executions and clean sort orders ensure total execution time remains under 2 seconds.

### Testing Strategy
Unit tests for registration, deduplication, dependency sorting, and circular reference checks.

### Rollback Strategy
Revert runner `run.ts` to directly call the legacy procedural analyzer modules.

---

## Future Considerations
The following exit criteria are tracked for this phase:
- ADR-007 merged and indexed in `ADR_INDEX.md`
- All four Git analyzers migrated to discrete rule classes
- `RuleRegistry` DAG ordering verified by unit tests
- No direct `analyzers/` imports in `run.ts` or `run-sections.ts`
- Full CI test suite passes (no regressions)
- `pnpm run build` passes
- Engine runtime ≤ 2 seconds

---

## References
- [ADR-006](ADR-006-public-contract-freeze.md)
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
