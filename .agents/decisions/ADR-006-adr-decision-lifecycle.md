# ADR-006: Architecture Decision Lifecycle

**Date:** 2026-07-13
**Status:** Accepted

## Context

ADRs 001–005 were created organically — there was no explicit rule governing when an ADR is required, what it must contain, or how it relates to other governance controls. This means the ADR record is incomplete: some decisions were documented, others were not, and there is no way to determine whether a missing ADR represents an undocumented decision or a correctly-omitted one.

## Decision

We adopt a formal ADR Decision Lifecycle that defines when an ADR is required, what it must contain, and what states it can be in.

### When an ADR is Required

An ADR is **required** for any of the following changes:

| Change type | Rationale |
|---|---|
| New npm workspace / package | Adds to the monorepo's architectural surface |
| New bounded context extracted from an existing package | Changes the ownership and dependency boundary model |
| New deployment unit or runtime process | Changes the runtime topology |
| New external infrastructure dependency (database, queue, cache engine) | Affects the operational model |
| Change to an enforced import boundary rule in `dependency-cruiser.js` | Modifies the architectural contract |
| Major framework replacement within a package | Affects the entire package surface |

An ADR is **not required** for:

| Change type | Rationale |
|---|---|
| Internal refactor within a single package | Does not affect other packages or boundaries |
| Bug fix | Does not change architecture |
| Feature implementation following existing patterns | Follows established decisions |
| Dependency version upgrade without behavior change | Does not change architectural intent |

**Rule of thumb**: If the change would require modifying `dependency-cruiser.js`, the root `package.json` `workspaces` array, or any `tsconfig.json` project references, an ADR is required.

### Required ADR Content

Every ADR must contain:

1. **Date** — when the decision was made
2. **Status** — current lifecycle state (see below)
3. **Context** — the problem or situation that necessitated the decision
4. **Decision** — what was decided and why this option over alternatives
5. **Consequences** — positive and negative effects of the decision
6. **Boundary Enforcement** — which automated controls (CI rules, linting, type checks) enforce this decision, if any

### ADR Lifecycle States

| State | Definition |
|---|---|
| `Proposed` | Under review — not yet in effect |
| `Accepted` | Decision is active and enforced |
| `Superseded` | Replaced by a newer ADR (link to successor required) |
| `Deprecated` | No longer applicable; kept for historical record |

### ADR Numbering

ADRs are numbered sequentially: `ADR-NNN-slug.md`. The number is permanent and is never reused, even if the ADR is superseded or deprecated.

## Consequences

- **Positive**: The ADR record is now self-documenting. A missing ADR for a change listed above is an explicit governance gap, not an ambiguity.
- **Positive**: New contributors can determine whether a structural decision requires an ADR by checking this document alone.
- **Negative**: Requires discipline to check this rule before every structural change. The CI system cannot currently enforce ADR creation automatically.
- **Note**: Retroactive ADRs for pre-existing decisions are encouraged but not required. If created retroactively, use the original decision date, not the documentation date.
