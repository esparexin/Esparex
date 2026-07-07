# ADR-004: Component Lifecycle Model

**Status:** Accepted  
**Date:** 2026-07-06  
**Owner:** Platform  
**Deciders:** Engineering Lead

---

## Context

As the component library grows, there needs to be a shared understanding of what stability guarantees consumers can rely on at each stage of a component's life. Without a formal model, teams may depend on unstable APIs or not realize when breaking changes are permitted.

---

## Decision

Every `@mad/ui` component carries a lifecycle state, tracked in the component manifest and in `Component.md`:

```
Experimental → Preview → Stable → Deprecated → Removed
```

The full breaking-change policy per state is defined in [API_STABILITY.md](../../design-system/standards/API_STABILITY.md).

**Key rules:**
- Phase 2B components ship as **Preview**
- Promotion to **Stable** requires Phase 2.5 adoption complete and no breaking API changes in the prior release cycle
- **Stable** components never have breaking changes — only a major version (`v2.0.0`) may introduce them
- **Deprecated** components have a minimum one-version grace period before removal

---

## Consequences

**Positive:**
- Teams know exactly what stability to expect when importing a component.
- Governance tooling can enforce lifecycle rules automatically (Phase 4).
- The component manifest becomes a source of truth for release tooling.

**Negative:**
- Promotion decisions require deliberate review, adding a small process overhead.
- Components can stay in `preview` longer than ideal if adoption is slow.

---

## Lifecycle State Machine

```
              ┌──────────────┐
              │ experimental │
              └──────┬───────┘
                     │ implementation complete, at least one consumer
                     ▼
              ┌──────────────┐
              │   preview    │ ← all Phase 2B components start here
              └──────┬───────┘
                     │ Phase 2.5 adoption complete, no breaking changes in prior cycle
                     ▼
              ┌──────────────┐
              │    stable    │ ← breaking changes prohibited
              └──────┬───────┘
                     │ replacement exists, migration notes written
                     ▼
              ┌──────────────┐
              │  deprecated  │ ← no new features, bug fixes only
              └──────┬───────┘
                     │ major version release (v2.0.0+)
                     ▼
              ┌──────────────┐
              │   removed    │
              └──────────────┘
```

---

## Alternatives Considered

**Option A: No lifecycle model — all components are treated as stable**  
Rejected. Early-stage components need the freedom to iterate. A single "stable" status would either prevent necessary evolution or lead to silent breaking changes.

**Option B: semver per component**  
Considered. Per-component semver is how some large design systems (e.g. Carbon) operate. Rejected for now because it adds tooling complexity that isn't justified at the current scale. Package-level semver combined with the lifecycle state model provides sufficient granularity.
