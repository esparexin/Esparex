# ADR-012: Entity Lifecycle State Machines

## Metadata
- **Status**: Proposed
- **Date**: 2026-07-07
- **Authors**: Antigravity
- **Reviewers**: Technical Lead
- **Decision Category**: Architecture, Governance
- **Related Documents**: `GOVERNANCE_REGISTRY.md`, `CANONICAL_OWNERSHIP_RULES.md`
- **Related GitHub Issues**: DATA-GOV-001
- **Related Pull Requests**: None

---

## Context
In the current architecture, entity lifecycle behaviors (e.g., transition of an Ad from `live` to `expired` or `deleted`) are managed independently across several components: 
1. Database Schema (`core/src/models/Ad.ts`)
2. Background Workers (`core/src/workers/adWorker.ts`)
3. Visibility Guards (`core/src/utils/FeedVisibilityGuard.ts`)
4. Assorted Backend Scripts

This decentralized ownership creates architectural duplication and bugs. For example, if the background worker stalls, the database retains an ad in the `live` status while the visibility guard dynamically filters it out based on its `expiresAt` date, causing the API to return zero results (as uncovered during `FUNC-DATA-001`).

## Problem Statement
The absence of a centralized "Lifecycle Engine" means there is no Single Source of Truth (SSOT) defining valid state transitions, their triggers, owners, and rules. If multiple systems modify state independently, it results in data drift and fractured UI experiences.

## Decision
We will implement a **Centralized Lifecycle Engine** (`core/src/engine/LifecycleEngine.ts`).
1. **Single Lifecycle Owner**: The Engine strictly defines all valid states (`draft`, `pending`, `live`, `expired`, `archived`, `deleted`).
2. **Transition Definitions**: For every transition, the engine defines:
   - **Owner**: Who is allowed to execute it (e.g., Worker, Admin, User).
   - **Trigger**: The event condition (e.g., `expiresAt` < `now`).
   - **Validation**: Schema or invariant checks required before saving.
   - **Rollback/Recovery**: Compensating action if a transition fails mid-flight.
3. **Strict Consumption**: Models, Workers, APIs, and Visibility Guards **must** consume the Lifecycle Engine rules instead of duplicating logic.

## Alternatives Considered
- **Alternative A: Decentralized Mongoose Hooks**: Enforcing lifecycle rules entirely within `pre('save')` hooks in Mongoose models. 
  - *Pros*: Data-layer consistency.
  - *Cons*: Mongoose hooks don't define *who* or *why*, they only react. They cannot easily govern visibility logic (which requires parsing queries) or worker rules without heavy tight-coupling.
- **Alternative B: Pure Worker Ownership**: The worker handles all expiry/transitions via cron.
  - *Pros*: Simple off-loading.
  - *Cons*: Already proved fragile. If the worker fails, the API serves stale or contradictory data.

## Consequences
- **Pros**: 
  - Absolute clarity on how an entity changes state.
  - Reduced duplication.
  - Bug prevention (preventing manual scripts from bypassing lifecycles).
- **Cons**: 
  - Higher initial implementation cost to migrate all existing endpoints and workers to the Engine.
  - Strict learning curve for developers.

---

## Technical & Operational Impact

### Migration Strategy
1. Introduce the `LifecycleEngine` namespace in `core`.
2. Refactor `FeedVisibilityGuard.ts` to consume rules from the Engine.
3. Refactor `adWorker.ts` to call `LifecycleEngine.transition(ad, 'expired')`.
4. Deploy in a "shadow" mode where exceptions are logged but not thrown, before turning on hard enforcement.

### Operational Impact
Debugging state transitions becomes deterministic. Every transition routes through one function, making logging highly concentrated.

### Security Impact
Prevents broken-access-control vulnerabilities where users might manually manipulate `status` fields directly through API payloads.

### Performance Impact
Negligible. The engine operates purely in-memory as a rule-evaluator before submitting to the database.

### Testing Strategy
Extensive unit testing of the state machine matrix (ensuring invalid transitions, like `deleted` -> `live`, throw errors immediately).

### Rollback Strategy
The engine can be bypassed via an emergency feature flag (`LIFECYCLE_ENGINE_BYPASS=true`), temporarily allowing raw DB mutations in case of critical production bugs.

---

## Future Considerations
As the platform scales, the Lifecycle Engine could be extracted into its own package (`@esparex/lifecycle`) or integrated with an event-sourcing model (e.g., Kafka) to publish transition events reliably.

## References
- DATA-GOV-001 Spec
- Architecture Ownership Matrix
