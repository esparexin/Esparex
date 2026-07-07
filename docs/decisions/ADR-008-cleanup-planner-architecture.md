# ADR-008: Cleanup Planner Architecture

## Metadata
- **Status**: Accepted
- **Date**: 2026-07-04
- **Authors**: AI Architecture Agent & Repository Owner
- **Reviewers**: Repository Governance Owner, Architecture Review Board
- **Decision Category**: Platform Architecture
- **Related Documents**: [ADR-006](ADR-006-public-contract-freeze.md), [ADR-007](ADR-007-rule-engine-architecture.md)
- **Related Pull Requests**: #452 (Phase 2), #453 (Phase 2.5), #454 (Phase 3)
- **Phase**: Roadmap Phase 4

---

## Context

Phase 3 delivered the Rule Engine: rules execute against `EngineContext` and
emit `Readonly<Finding>[]`. The `Finding` type (frozen in ADR-006) describes
what was observed — it does not prescribe what to do.

The current `run.ts` translates lifecycle states directly into shell commands
(e.g., `git branch -d ${name}`) hardcoded into `ActionItem.shellCommand`. This
creates three problems:

1. **Shell logic in business data**: The `shellCommand` string lives inside the
   action queue model — mixing what-to-do with how-to-do-it.

2. **No abstraction layer**: There is no component that decides *whether* a
   finding warrants a cleanup action, or *what type* of action is appropriate.

3. **Untestable shell generation**: Shell strings are generated inline in `run.ts`
   with no unit-testable boundary.

---

## Problem Statement

Without a Cleanup Planner:

1. **Business logic in the runner**: The decision "this finding → delete local
   branch" is spread across a 300-line if/else block in `run.ts`, not in a
   dedicated component.

2. **CleanupAction unused**: ADR-006 froze `CleanupAction` as an abstract,
   shell-free type. It is not yet produced by anything.

3. **GitCommandBuilder missing**: There is no component that owns the
   translation from `CleanupAction` to shell syntax.

4. **Writers consume shell strings**: Current writers receive raw `shellCommand`
   strings. They should consume `CleanupAction[]` and generate shell syntax
   only at write time.

---

## Decision

We introduce two components with a strict boundary between them:

```
Finding[]
    ↓
CleanupPlanner          ← Business logic (pure, testable)
    ↓
CleanupAction[]         ← Abstract, shell-free (frozen in ADR-006)
    ↓
GitCommandBuilder       ← Shell translation (isolated)
    ↓
string[]                ← Shell commands (only in writers/shell output)
```

**Rule**: Shell syntax may only exist on the right side of `GitCommandBuilder`.
`CleanupPlanner` must contain zero shell strings.

---

## CleanupPlanner Design

`CleanupPlanner` makes decisions based on a **declarative mapping table**, not
a switch on rule IDs. This decouples the planner from rule naming — adding a
new rule requires only adding a row to the map, not modifying planner logic.

```typescript
// INTERNAL — platform/planning/cleanup-planner.ts

// Mapping table: ruleId → ActionType + preconditions
// Adding a new rule = adding one entry here. Planner logic stays unchanged.
const ACTION_MAP: Record<string, { actionType: ActionType; preconditions: string[] }> = {
  'git.branch.stale': {
    actionType: 'REBASE_SYNC',
    preconditions: ['Branch is not protected', 'Branch is not checked out in a worktree'],
  },
  'git.branch.duplicate': {
    actionType: 'DELETE_LOCAL',
    preconditions: ['Counterpart branch is merged', 'No open PR'],
  },
  'git.branch.orphaned': {
    actionType: 'MANUAL_REVIEW',
    preconditions: ['No active commits in last 30 days'],
  },
  // git.branch.naming and git.ancestry.lag → no CleanupAction (INFO / sync signal)
};

class CleanupPlanner {
  plan(findings: ReadonlyArray<Readonly<Finding>>): CleanupAction[] {
    const actions: CleanupAction[] = [];
    for (const finding of findings) {
      const entry = ACTION_MAP[finding.ruleId];
      if (!entry) continue; // no action for this rule

      // Confidence gate: demote destructive actions on low-confidence findings
      const actionType = this.applyConfidenceGate(entry.actionType, finding.confidence);

      actions.push({
        branchName: finding.affectedBranch,
        actionType,
        targetBranch: 'develop',
        confidence: finding.confidence,
        preconditions: entry.preconditions,
      });
    }
    return actions;
  }

  private applyConfidenceGate(actionType: ActionType, confidence: Confidence): ActionType {
    const isDestructive = actionType === 'DELETE_LOCAL' || actionType === 'DELETE_REMOTE';
    const isBelowThreshold = confidence === Confidence.LOW || confidence === Confidence.MEDIUM;
    return isDestructive && isBelowThreshold ? 'MANUAL_REVIEW' : actionType;
  }
}
```

---

## GitCommandBuilder Design

> **Policy boundary**: `GitCommandBuilder` validates command syntax only.
> It never evaluates confidence, branch safety, protection status, or policy.
> All policy decisions are made by `CleanupPlanner` before this point.
> Its sole responsibility is: `CleanupAction → Git command string`.

The `REBASE_SYNC` action type describes **intent** — synchronise a branch
with its integration target. `GitCommandBuilder` decides how that intent is
rendered. If the project policy later changes from merge to rebase or
fast-forward-only, only `GitCommandBuilder` changes — planner logic is
unaffected.

```typescript
// INTERNAL — platform/planning/git-command-builder.ts
class GitCommandBuilder {
  build(action: CleanupAction): string {
    switch (action.actionType) {
      case 'DELETE_LOCAL':
        return `git branch -d ${action.branchName}`;
      case 'DELETE_REMOTE':
        return `git push origin --delete ${action.branchName.replace('origin/', '')}`;
      case 'REBASE_SYNC':
        // Renders REBASE_SYNC intent as a pull with merge (project default).
        // Switch to rebase strategy here without touching CleanupPlanner.
        return `git checkout ${action.branchName} && git pull origin ${action.targetBranch}`;
      case 'MANUAL_REVIEW':
        return [
          `# MANUAL_REVIEW`,
          `# Branch: ${action.branchName}`,
          `# Preconditions: ${action.preconditions.join('; ')}`,
        ].join('\n');
    }
  }

  buildAll(actions: CleanupAction[]): string[] {
    return actions.map(a => this.build(a));
  }
}
```

---

## Confidence Gate

`CleanupPlanner` enforces a minimum confidence threshold before emitting
any destructive action (`DELETE_LOCAL`, `DELETE_REMOTE`):

```typescript
const DESTRUCTIVE_ACTIONS: ActionType[] = ['DELETE_LOCAL', 'DELETE_REMOTE'];
const MIN_CONFIDENCE_FOR_DESTRUCTIVE = Confidence.HIGH;
```

A finding with `Confidence.LOW` or `Confidence.MEDIUM` never produces a
destructive `CleanupAction`. It produces `MANUAL_REVIEW` instead.

---

## Writer Changes

Shell writers currently receive `shellCommand: string` from `ActionItem`.
After Phase 4, shell writers receive `CleanupAction[]` and use
`GitCommandBuilder` to render shell syntax at write time.

This means:
- JSON writers output `CleanupAction[]` — no shell strings in JSON
- Shell writers call `GitCommandBuilder.buildAll(actions)` — only place with shell strings
- Markdown writers render action type + preconditions — no shell strings

---

## File Structure

```
scripts/governance/platform/
├── contracts/                   ← Frozen (ADR-006, unchanged)
├── engine/
│   └── rule-registry.ts         ← Existing (Phase 3, unchanged)
├── planning/
│   ├── cleanup-planner.ts        ← NEW: Finding[] → CleanupAction[]
│   └── git-command-builder.ts    ← NEW: CleanupAction → shell string
├── rules/                        ← Existing (Phase 3, unchanged)
└── testing/
    ├── contracts.test.ts          ← Existing (Phase 2.5, unchanged)
    ├── rule-registry.test.ts      ← Existing (Phase 3, unchanged)
    └── cleanup-planner.test.ts    ← NEW: unit tests for planner + builder
```

---

## Consequences

### Positive
- `CleanupPlanner` is pure and fully unit-testable: `plan(findings)` returns
  `CleanupAction[]` with no side effects
- Shell syntax is isolated to one class — one place to audit for safety
- Writers become shell-free by default; only the shell writer uses `GitCommandBuilder`
- Confidence gating prevents low-confidence findings from producing destructive actions

### Negative
- Existing `run.ts` action queue logic must be refactored to use the new planner
- Shell writer must be updated to consume `CleanupAction[]`

### Mitigations
- Existing behaviour is preserved until the new planner and writers produce
  functionally equivalent output verified by regression tests. The old
  `ActionItem` path coexists until equivalence is confirmed.
- Full test suite catches any regression

---

## Alternatives Considered

### A. Keep shell commands inside CleanupAction
**Rejected.** Violates the ADR-006 contract which explicitly states:
> "Contains NO shell syntax. Shell command generation is exclusively the
> responsibility of GitCommandBuilder."

### B. Generate shell commands inside each Rule
**Rejected.** Rules must be stateless and produce only Findings. Mixing
cleanup planning into rules would violate single responsibility.

### C. Generate shell commands in writers directly
**Rejected.** Writers would need to understand business logic (is this branch
a duplicate? is it safe to delete?) — that belongs to the planner.

---


---

## Technical & Operational Impact

### Migration Strategy
Create `platform/planning/cleanup-planner.ts` and `platform/planning/git-command-builder.ts`. Update the runner and writers to consume structured `CleanupAction[]` objects rather than raw strings.

### Operational Impact
Isolates command generation, making the execution queue auditable and safe.

### Security Impact
Prevents shell injections by isolating shell compilation within the GitCommandBuilder.

### Performance Impact
No execution latency or runtime overhead.

### Testing Strategy
Unit tests for all `ActionType` mappings, confidence gates, builder commands, and edge cases.

### Rollback Strategy
Fallback to legacy procedural generation of `ActionItem` models in the runner.

---

## Future Considerations
The following exit criteria are tracked for this phase:
- ADR-008 merged and indexed in `ADR_INDEX.md`
- `CleanupPlanner` contains zero shell commands
- `GitCommandBuilder` contains zero business logic
- All writers consume `CleanupAction[]`
- Full CI test suite passes
- `pnpm run build` passes

---

## References
- [ADR-006](ADR-006-public-contract-freeze.md)
- [ADR-007](ADR-007-rule-engine-architecture.md)
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
