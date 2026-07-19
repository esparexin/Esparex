# ADR-001: Classify `packages/kernel` as Dormant Strategic Asset

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Repository Governance  
**Tags:** governance, kernel, dormant, architecture

---

## Context

The repository contains `packages/kernel`, a package providing DDD primitives (`Entity`, `ValueObject`, `Result`, `DomainEventBus`, `IntegrationEventBus`). It was intentionally created and preserved but has **zero consumers** today. There is no evidence it was intended to replace `core`.

The Phase 1 cleanup removed verified unused scaffold packages and disposable directories. A decision is needed on whether to delete, adopt, or preserve `packages/kernel`.

The current implementation authority for domain behavior is `core`.

## Decision

**Preserve `packages/kernel` as a dormant strategic asset.**

- Do **not** delete it.
- Do **not** adopt it now.
- Classify it as **dormant**, not aspirational.

## Rationale

| Action | Why Not |
|--------|---------|
| **Delete** | Saves very little but permanently discards a coherent DDD foundation that was intentionally created and preserved. |
| **Adopt now** | Would trigger a large cross-cutting refactor of `core` with a wide blast radius. Current focus is repository convergence and stabilization, not rewriting the domain model. |
| **Keep dormant** | Preserves the option to evaluate it later without forcing an architectural commitment today. |

The package contains real DDD primitives (`Entity`, `ValueObject`, `Result`, `DomainEventBus`, `IntegrationEventBus`). It has zero consumers today. There is no evidence it was intended to replace `core`. Do not delete until a future ADR revisits the decision.

## Package Classification

| Package | Classification | Decision |
|---------|---------------|----------|
| `packages/contracts` | Strategic | Active SSOT |
| `packages/kernel` | Dormant Strategic Asset | Preserve, no new development until evaluated |

## Governance Rules

1. `packages/kernel` is **not deprecated**.
2. `packages/kernel` is **not the current SSOT**.
3. No new code should depend on it until an Architecture Decision Record approves its adoption.
4. `core` remains the current implementation authority for domain behavior.

## Future Review Criteria

Only consider adopting `packages/kernel` if a planned domain-layer redesign demonstrates clear architectural value and an approved migration plan. Specifically, all of the following must be true:

- The domain layer is being redesigned.
- Multiple bounded contexts need common DDD primitives.
- The migration reduces duplication instead of increasing it.
- A measurable architectural benefit outweighs the migration cost.
- An ADR explicitly approves the change.

## Consequences

### Positive
- No forced architectural commitment.
- No cross-cutting refactor during stabilization phase.
- Option value preserved for future evaluation.

### Negative
- `packages/kernel` remains as inert code that must be maintained.
- Future developers may need to discover and evaluate it before adoption.

## Related Documents

- [`docs/DELETION_GATE.md`](../DELETION_GATE.md) — Repository deletion governance
- [`docs/architecture/Enterprise-Architecture-v1.md`](Enterprise-Architecture-v1.md) — Enterprise architecture specification
