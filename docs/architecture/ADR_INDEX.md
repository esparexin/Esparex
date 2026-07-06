# ADR Index

This document indexes all Architecture Decision Records (ADRs) for the Esparex monorepo.

ADRs are immutable records. Once accepted, they are never deleted — only superseded by newer ADRs.

---

## Index

| ADR | Title | Status | Date | Supersedes |
| --- | --- | --- | --- | --- |
| [ADR-001](adr/ADR-001-core-package.md) | Core Package Architecture | Accepted | — | — |
| [ADR-002](adr/ADR-002-shared-package.md) | Shared Package Architecture | Accepted | — | — |
| [ADR-003](adr/ADR-003-backend-api.md) | Backend API Structure | Accepted | — | — |
| [ADR-004](adr/ADR-004-boundaries.md) | Package Boundary Rules | Superseded | — | ADR-006 |
| [ADR-005](adr/ADR-005-monorepo.md) | Monorepo Strategy | Accepted | — | — |
| [ADR-006](adr/ADR-006-namespace-governance.md) | Core Namespace Lockdown (v1.0.0) | Accepted | 2026-07-06 | ADR-004 |
| [ADR-007](adr/ADR-007-architecture-enforcement.md) | Architecture Enforcement Tooling (v1.1.0) | Accepted | 2026-07-06 | — |

---

## ADR Lifecycle

```
Draft → Proposed → Accepted → (optionally) Superseded → Deprecated
```

| Status | Meaning |
| --- | --- |
| **Draft** | Work in progress, not yet proposed |
| **Proposed** | Submitted for review, not yet approved |
| **Accepted** | Approved and in effect |
| **Superseded** | Replaced by a newer ADR (linked in its record) |
| **Deprecated** | No longer in effect, not replaced |

---

## Proposing a New ADR

1. Copy `adr/ADR-000-template.md` to `adr/ADR-NNN-short-title.md` where `NNN` is the next available number.
2. Fill out all sections.
3. Open a PR with the label `architecture-decision`.
4. The ADR must be reviewed and approved before the associated implementation begins.
5. Once approved, update this index and set the ADR status to `Accepted`.

---

## Relationship to Architecture Version

Each Architecture Version bump (see `ARCHITECTURE_VERSION.md`) must have at least one associated ADR.

| Architecture Version | Primary ADR |
| --- | --- |
| v1.0.0 | ADR-006 |
| v1.1.0 | ADR-007 |
