# ADR-006: Repository Governance Platform — Public Contract Freeze

## Metadata
- **Status**: Accepted
- **Date**: 2026-07-04
- **Authors**: AI Architecture Agent & Repository Owner
- **Reviewers**: Repository Governance Owner, Architecture Review Board
- **Decision Category**: Platform Architecture
- **Related Documents**: [ADR-005](ADR-005-git-governance-engine-design-principles.md)
- **Related Pull Requests**: #451 (chore/git-governance-engine — merged)
- **Phase**: Roadmap Phase 2

---

## Context

PR #451 delivered the first working version of the Git Governance Engine with
modular scoring, optimized metadata collectors, and structured output writers.
The engine executes in ~1.8 seconds and scores the repository across four
independent dimensions.

The next phase of evolution — introducing a Rule Engine (Phase 3), a Cleanup
Planner (Phase 4), a Trend Engine (Phase 5), and eventually additional governance
providers — requires that all components share a stable set of interfaces.

Without a formal contract freeze, each new phase risks introducing breaking
changes that force rewrites of already-delivered components.

---

## Problem Statement

Without frozen public contracts:

1. **Interface Instability**: The Rule Engine (Phase 3) will be built on top of
   `GovernanceRule`, `Finding`, and `EngineContext`. If these change during or
   after Phase 3, the Rule Engine requires a rewrite.

2. **Provider Coupling**: Future providers (Documentation, Security) must
   implement `GovernanceProvider`. If the provider contract changes, all
   providers must be updated simultaneously.

3. **Report Fragility**: Writers (`MarkdownReportWriter`, `ShellWriter`,
   `JsonWriter`) consume `ReportModel`. Without a stable model, every writer
   breaks when the model evolves.

4. **Semver Ambiguity**: Without a declared public API surface, there is no
   clear trigger for a major version bump. Internal refactors could silently
   break downstream consumers.

---

## Decision

We freeze the following interfaces as the **public API surface** of the
Repository Governance Platform v1.0. No breaking changes may be made to these
without a semver major version bump, a new ADR, and a migration guide.

---

## Public Contract Definitions

### 1. `EngineContext`
The single coordination object passed to all rules, planners, and writers.
Contains only the stable abstractions that providers and rules genuinely need.
`RuleRegistry` and the `EventBroker` implementation are internal engine concerns
and are therefore **not exposed** through this contract.

```typescript
export interface EngineContext {
  readonly snapshot: DomainSnapshot;
  readonly capabilities: RepositoryCapabilities;
  readonly config: GovernanceConfig;
}
```

---

### 2. `DomainSnapshot`
The immutable, in-memory representation of repository state at a point in time.
Collected once upfront. Never mutated after creation.

```typescript
export interface DomainSnapshot {
  readonly providerId: string;
  readonly timestamp: string;
  readonly schemaVersion: string;
  readonly data: Record<string, unknown>;
}
```

---

### 3. `GovernanceProvider`
The extension point for all governance domains (Git, Documentation, Security).
The platform engine knows only this interface — never the domain specifics.

```typescript
export interface ProviderMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly engineVersion: string;   // semver range, e.g. "^1.0.0"
  readonly apiVersion: string;      // e.g. "1.0"
  readonly description: string;
}

export interface GovernanceProvider {
  readonly metadata: ProviderMetadata;
  collect(context: EngineContext): Promise<DomainSnapshot>;
  rules(): GovernanceRule[];
  writers(): ReportWriter[];
}
```

---

### 4. `GovernanceRule`
The atomic unit of governance evaluation. Every rule is stateless and
deterministic: given the same `EngineContext`, it always returns the same
`Finding[]`.

```typescript
export type RuleCategory =
  | 'Branch Hygiene'
  | 'Repository Health'
  | 'Technical Debt'
  | 'Git Governance'
  | 'Security'
  | 'Documentation';

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface RuleMetadata {
  readonly id: string;          // Namespaced: git.branch.stale
  readonly name: string;
  readonly version: string;
  readonly category: RuleCategory;
  readonly severity: Severity;
  readonly enabled: boolean;
  readonly configurable: boolean;
  readonly tags: string[];
  readonly dependencies: string[]; // Rule IDs that must execute first
}

export interface GovernanceRule {
  readonly metadata: RuleMetadata;
  execute(context: EngineContext): Readonly<Finding>[];
}
```

---

### 5. `Finding`
The immutable output of a rule evaluation. Once emitted, a Finding is never
modified. Scorers, planners, and writers consume findings as read-only input.

```typescript
export enum Confidence {
  PROVEN = 'PROVEN',   // 100% certainty — e.g. tree SHA duplicate
  HIGH   = 'HIGH',     // e.g. branch stale by commit count
  MEDIUM = 'MEDIUM',   // e.g. possible superseded experiment
  LOW    = 'LOW'       // e.g. heuristic-based inference
}

export interface Finding {
  readonly id: string;
  readonly ruleId: string;
  readonly category: RuleCategory;
  readonly severity: Severity;
  readonly title: string;
  readonly evidence: string;
  readonly affectedBranch: string;
  readonly confidence: Confidence;
  readonly recommendation: string;
}
```

---

### 6. `CleanupAction`
Abstract representation of a cleanup operation. Contains no shell syntax.
Shell command generation is exclusively the responsibility of `GitCommandBuilder`.

```typescript
export type ActionType =
  | 'DELETE_LOCAL'
  | 'DELETE_REMOTE'
  | 'REBASE_SYNC'
  | 'MANUAL_REVIEW';

export interface CleanupAction {
  readonly branchName: string;
  readonly actionType: ActionType;
  readonly targetBranch: string;
  readonly confidence: Confidence;
  readonly preconditions: string[];
}
```

---

### 7. `ReportModel`
The structured data consumed by all writers. Writers must not add or modify
data — they only render what the model contains.

```typescript
export interface ReportModel {
  readonly schemaVersion: string;
  readonly engineVersion: string;
  readonly generatedAt: string;
  readonly repository: string;
  readonly scores: {
    readonly overall: number;
    readonly branchHygiene: number;
    readonly repositoryHealth: number;
    readonly technicalDebt: number;
    readonly gitGovernance: number;
  };
  readonly findings: Readonly<Finding>[];
  readonly actions: CleanupAction[];
}
```

---

### 8. `ReportWriter`
The extension point for all output formats. Writers receive a `ReportModel`
and produce an output artifact — markdown, JSON, shell script, or other.

```typescript
export interface ReportWriter {
  readonly id: string;
  readonly format: 'markdown' | 'json' | 'shell' | 'html';
  write(model: ReportModel): void;
}
```

---

### 9. `EventBroker` (Interface — Public Contract)
The **interface** is part of the frozen public API. External providers may
subscribe to platform events through this contract.

The **implementation** (`EventBrokerImpl` or equivalent) is an internal
platform detail and may evolve without a major version bump. Providers and
rules must only depend on the `EventBroker` interface, never the implementation
class.

```typescript
export type EngineEvent =
  | { type: 'CollectionStarted';   payload: { providerId: string } }
  | { type: 'CollectionCompleted'; payload: DomainSnapshot }
  | { type: 'RuleStarted';         payload: { ruleId: string } }
  | { type: 'FindingCreated';      payload: Readonly<Finding> }
  | { type: 'PlanGenerated';       payload: CleanupAction[] }
  | { type: 'ReportWritten';       payload: { paths: string[] } };

// PUBLIC — frozen by this ADR
export interface EventBroker {
  subscribe(listener: (event: EngineEvent) => void): void;
  publish(event: EngineEvent): void;
}

// INTERNAL — not frozen, not exported from platform/contracts/
// class EventBrokerImpl implements EventBroker { ... }
```

---

## Supporting Artefacts

### `platform.json` (root of governance platform directory)
```json
{
  "platformVersion": "1.0.0",
  "apiVersion": "1.0",
  "schemaVersion": "1.0",
  "providers": ["git"]
}
```

### Provider Manifest Schema (per provider)
```json
{
  "id": "git",
  "name": "Git Governance Provider",
  "version": "1.0.0",
  "engine": "^1.0.0",
  "api": "1.0"
}
```

### `RepositoryCapabilities`
```typescript
export interface RepositoryCapabilities {
  readonly supportsWorktrees: boolean;
  readonly supportsSubmodules: boolean;
  readonly supportsLFS: boolean;
  readonly hasRemoteOrigin: boolean;
  readonly defaultBranch: string;
}
```

### `BranchLifecycleState` enum
```typescript
export enum BranchLifecycleState {
  ACTIVE        = 'ACTIVE',
  READY_FOR_PR  = 'READY_FOR_PR',
  OPEN_PR       = 'OPEN_PR',
  MERGED        = 'MERGED',
  DELETE_READY  = 'DELETE_READY',
  STALE         = 'STALE',
  ARCHIVED      = 'ARCHIVED',
  ORPHANED      = 'ORPHANED'
}
```

---

## Public vs Internal API Split

| Public (semver-protected — this ADR) | Internal (may evolve freely) |
|---|---|
| `GovernanceProvider` | `RuleRegistry` |
| `GovernanceRule` | `EventBroker` (implementation) |
| `Finding` | `GitCommandBuilder` |
| `CleanupAction` | `TrendCalculator` |
| `ReportModel` | `CapabilityNegotiator` |
| `ReportWriter` | `ScoringAggregator` |
| `EngineContext` | `CleanupPlanner` (implementation) |
| `DomainSnapshot` | |
| `EventBroker` (interface) | |

---

## Reference Implementation Layout

The following directory structure is the **reference layout** for the platform
implementation. It is a recommendation, not a frozen public API. Folder names
are not part of the semver-versioned contract surface.

```
scripts/governance/
└── platform/
    ├── contracts/        ← All frozen interfaces live here (this ADR)
    ├── engine/           ← PlatformEngine coordinator (internal)
    ├── registry/         ← RuleRegistry implementation (internal)
    ├── providers/        ← GovernanceProvider implementations
    │   └── git/          ← Git provider (reference implementation)
    ├── rules/            ← GovernanceRule implementations
    ├── scoring/          ← Modular scorers (internal)
    ├── planning/         ← CleanupPlanner + GitCommandBuilder (internal)
    ├── writers/          ← ReportWriter implementations
    └── testing/          ← Compatibility test suite (Phase 2.5)
```

---

## Consequences

### Positive
- All Phase 3–8 components build on stable, versioned interfaces
- Adding a new rule requires only implementing `GovernanceRule` — no engine changes
- Adding a new provider requires only implementing `GovernanceProvider` — no engine changes
- Breaking changes are explicit, versioned, and documented
- Downstream consumers (CI, dashboards) have a stable schema to integrate against

### Negative
- Initial setup cost: interfaces must be declared before any implementation
- Early design mistakes in the contract are expensive to fix without a major bump
- Requires discipline to distinguish public from internal APIs

### Mitigations
- Phase 2.5 (Compatibility Test Suite) catches accidental contract breakage in CI
- The v1.1 Appendix in the roadmap captures known future refinements without forcing premature changes

---

## Alternatives Considered

### A. Continue building without frozen contracts
**Rejected.** Each new phase would risk breaking previous phases. The Rule
Engine cannot be safely built without knowing what `Finding` and `EngineContext`
look like.

### B. Freeze contracts after Phase 3
**Rejected.** Phase 3 (Rule Engine) directly consumes `GovernanceRule`,
`Finding`, and `EngineContext`. Freezing after implementation means the freeze
is describing what was built, not governing what will be built.

### C. Use an OpenAPI/JSON Schema instead of TypeScript interfaces
**Deferred to v1.1.** Appropriate for external API consumers. Not required
for an internal TypeScript monorepo platform at v1.0.


---

## Technical & Operational Impact

### Migration Strategy
Move all shared interfaces to `scripts/governance/platform/contracts/` and update references to use imports from this central location. Ensure `pnpm run build` passes with zero type errors.

### Operational Impact
Freezes public contracts for v1.0, ensuring long-term compatibility for subsequent engine features.

### Security Impact
No direct runtime impact. Enforces compile-time types for safety.

### Performance Impact
No execution latency or runtime overhead.

### Testing Strategy
Verified by typescript compiler checking all workspace components against the frozen types.

### Rollback Strategy
Restore original imports from local models and remove the dedicated contracts directory.

---

## Future Considerations
The following exit criteria are tracked for this phase:
- ADR-006 merged and indexed in `ADR_INDEX.md`
- All contract interfaces declared in `platform/contracts/` with no implementation logic
- `pnpm run build` passes
- No existing consumers have been modified to change behaviour

---

## References
- [ADR-005](ADR-005-git-governance-engine-design-principles.md)
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
