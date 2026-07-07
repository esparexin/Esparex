# ADR-003: Public API Freeze During Infrastructure Changes

**Status:** Accepted  
**Date:** 2026-07-06  
**Owner:** Platform  
**Deciders:** Engineering Lead

---

## Context

Phase 2A restructures `packages/ui` from a flat component directory into a grouped hierarchy (`primitives/`, `composites/`, `layouts/`). The existing flat files in `src/components/` are used by both applications.

There is a risk that moving files silently changes component behavior if any code runs during the move — for example, if a file is rewritten rather than simply relocated, or if an import shim introduces a wrapper.

---

## Decision

During Phase 2A (infrastructure PR), **no existing component behavior changes**. The rule is:

> An import shim may only re-export. It may not wrap, transform, or add logic.

Concretely, every file in `src/components/` that is converted to a shim must contain exactly:

```ts
export * from '../primitives/ComponentName';
// or
export * from '../composites/ComponentName';
```

No default export changes. No prop type widening or narrowing. No additional logic.

This ensures `import { Button } from '@mad/ui'` returns **exactly the same component** before and after Phase 2A, with no behavioral difference.

---

## Consequences

**Positive:**
- Phase 2A carries near-zero regression risk.
- The shim-to-implementation migration can be verified by a mechanical test: import the old path and the new path; assert they are reference-equal.
- CI remains green throughout the restructuring.

**Negative:**
- The old flat `src/components/` shim files remain until Phase 2.5, adding a layer of indirection.
- Developers must know not to edit shim files — they are routing only.

---

## Alternatives Considered

**Option A: Migrate all consumers in the same PR**  
Rejected. Touching both `packages/ui` and application code in the same PR creates a large diff that is difficult to review and increases regression risk.

**Option B: Delete old files immediately**  
Rejected. Immediate deletion breaks any application import that references the old canonical path before the consumer has been updated. Shims allow a clean, incremental migration through Phase 2.5.
