# ADR-005: Git Governance Engine Core Design Principles & Schema Contracts

## Metadata
- **Status**: Accepted
- **Date**: 2026-07-04
- **Authors**: AI Architecture Agent & Repository Owner
- **Reviewers**: Repository Governance Owner, Architecture Review Board
- **Decision Category**: Governance
- **Related Documents**: [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md), [AGENTS.MD](../../AGENTS.MD), [ADR-004-governance-execution-engine.md](ADR-004-governance-execution-engine.md)
- **Related GitHub Issues**: None
- **Related Pull Requests**: None

---

## Context
As the MAD Entertrainment workspace evolved, managing branch hygiene shifted from an ad-hoc cleanup task ("which branches can I delete?") to a strict verification and proof exercise ("what can I prove about the repository?"). 

To prevent errors, protect production systems, and allow automated tools (including AI coding agents) to safely operate on Git branches, we need a formalized set of architectural principles and stable interface schemas. 

The Git Governance Engine is defined strictly as an **audit and decision-support system**, not an autonomous repository management system. It does not perform writes or mutations on Git repositories directly without human review.

---

## Problem Statement
Without explicit design rules and stable contracts:
1. **Ambiguity of Intent**: Recommendations to keep/delete/rebase branches can rely on heuristics or hidden developer assumptions, leading to accidental branch deletions or missed dead branches.
2. **Conflated Logic**: Conflating a branch's lifecycle state (e.g., whether it has an open PR or is stale) with the required operation (e.g., safe to delete) creates complex, unmaintainable conditional statements.
3. **Integration Instability**: Downstream systems (such as CI jobs, dashboards, and automated PR review agents) face breaking changes if the engine's internal data models and JSON outputs are refactored.

---

## Decision

We adopt five core design principles to govern the development and maintenance of the Git Governance Engine:

### 1. Evidence Precedes Recommendation
Every recommendation must be traceable to explicit Git evidence (reachability tree, worktree checkouts, squash/cherry analyses). If crucial evidence is missing, the engine identifies the missing pieces and reports lower confidence rather than guessing.

### 2. State and Action are Different Concepts
A branch's lifecycle (e.g., `Protected`, `Active Development`, `Duplicate Candidate`, `Archived`, `Stale`, `Ready For Delete`, `Blocked`) describes the repository state. Recommended actions (`KEEP`, `REBASE`, `SAFE_DELETE`, `BLOCKED`) are derived from this state and verification results, but are represented as distinct attributes in the registry schema.

### 3. Determinism Over Heuristics
Given the same repository state, the engine must produce identical JSON registries, reports, and action queues on every run. Heuristics, timers, or environment-dependent assumptions must be fully parameterized or excluded.

### 4. Schemas are the Long-Term Contract
A stable, documented interface allows downstream consumers (CI pipelines, dashboards, AI agents) to depend on the engine's outputs regardless of how internal checks are implemented.

### 5. Trust Through Transparency
Reports must clearly partition evidence:
- What was inspected (e.g., commit logs, config limits)
- What was verified (e.g., branch is an ancestor of develop)
- What was inferred (e.g., PR is closed based on lack of unmerged commits)
- What remains unknown
- Why each recommendation exists

---

## Implemented Architecture (v3.0)

The v3.0 implementation realizes these principles using three JSON contracts written to the `.agents/` workspace directory:

### 1. Branch Registry Schema (`branch_registry.json`)
Registers current raw information collected from git commands.
```typescript
export interface BranchInfo {
  name: string;
  isLocal: boolean;
  isRemote: boolean;
  sha: string;
  upstream: string | null;
  authorName: string;
  authorEmail: string;
  authorDate: string;
  commitTime: number;
  tipMsg: string;
  ahead: number;
  behind: number;
  uniqueCommits: string[];
}

export interface RegisteredBranch extends BranchInfo {
  lifecycleState: string;
  verification: VerificationInfo;
}
```

### 2. Verification Registry Schema (`verification_registry.json`)
Traces explicit git evidence and verification outputs.
```typescript
export interface VerificationInfo {
  branchName: string;
  hasUniqueCommits: boolean;
  isMerged: boolean;
  isSquashMerged: boolean;
  hasOpenPR: 'YES' | 'NO' | 'UNKNOWN';
  prNumber: string | null;
  hasActiveWorktree: boolean;
  isProtected: boolean;
  isAnotherBranchBasedOnIt: boolean;
  isPartOfActiveStack: boolean;
  usedByBranches: string[];
  upstream: string | null;
  hasReleaseDependency: boolean;
  hasTags: boolean;
  hasActiveDeployment: boolean;
  remediationIntegrated: boolean;
  verificationStatus: 'VERIFIED' | 'INFERRED' | 'UNKNOWN';
  evidence: {
    commands: Record<string, string>;
    outputs: Record<string, string>;
  };
}
```

### 3. Action Queue Schema (`action_queue.json`)
Lists actionable recommendations derived from the lifecycle state and verification checks.
```typescript
export interface ActionItem {
  branchName: string;
  verification: 'VERIFIED' | 'INFERRED' | 'UNKNOWN';
  action: string;
  risk: 'Low' | 'Medium' | 'High' | 'N/A';
  status: 'Execute Now' | 'Pending' | 'Blocked';
  confidence: string; // e.g., "99%", "0%"
  evidence: string[];
  reason: string;
  preconditions: string[];
  rollbackStrategy: string;
  estimatedEffort: string;
  shellCommand: string;
}
```

---

## Non-Goals
The Git Governance Engine does **not**:
- Automatically delete local or remote branches.
- Automatically merge or rebase branches.
- Infer developer intent behind unmerged commits.
- Replace or override GitHub's branch protection policies.
- Execute destructive Git commands without passing verification gates.

---

## Alternatives Considered
- **Alternative A**: *Heuristic-based cleanup recommendation*. Recommended action is evaluated inline using a simple list of branch age thresholds. Cons: violates "evidence precedes recommendation", lacks traceability, high risk of deleting active work.
- **Alternative B**: *Direct automation execution*. Let the engine run Git mutations (`git branch -d` / `git push --delete`) immediately on detection. Cons: violates safety protocols, increases risk of data loss.

---

## Consequences
- **Pros**:
  - Predictable, auditable branch lifecycle recommendations.
  - Safe to consume in automated scripts because blocking conditions (such as worktrees, tags, active stacks) are checked explicitly.
  - Changes in internal analyzers do not break downstream parser integrations.
- **Cons**:
  - Higher initial implementation effort to collect, format, and structure evidence compared to heuristic checks.

---

## Technical & Operational Impact

### Migration Strategy
The Git Governance Engine is integrated as a local static utility and CI step. No runtime database migrations or live schema changes are required.

### Operational Impact
The engine will run locally and as part of workspace build verification. It outputs report files under `reports/governance/`.

### Security Impact
The engine performs read-only Git metadata evaluations and secret scanning checks. It does not execute destructive actions on branches without developer authorization.

### Performance Impact
Execution is designed to complete in under 2 seconds, minimizing compile/CI pipeline latency.

### Testing Strategy
Rules and schema validation are covered by standard Vitest unit and integration suites.

### Rollback Strategy
If the engine causes build blockages, its execution gate can be temporarily disabled or bypassed in CI by removing the build command hooks.

---

## Future Considerations

The following future milestones separate the accepted core design from planned enhancements:

### v3.5 — Versioned Repository Governance Schema
- Introduce JSON Schema schemas (`.schema.json`) for registries.
- Setup build-time contract validation.

### v4.0 — Branch Decision Cards & Evolution Timeline
- Generate individual branch decision card artifacts in Markdown.
- Add historical tracking of branch creation/rebase/merge paths.

### v5.0 — Safe Automation Assistance
- Build interactive terminal CLI scripts that prompt owners to execute actions from `action_queue.json`.

### v6.0 — CI Governance Integration
- Block Pull Request merges if the branch fails stack containment checks or is behind develop by more than 30 commits without a fresh rebase.

---

## References
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
- [AGENTS.MD](../../AGENTS.MD)
