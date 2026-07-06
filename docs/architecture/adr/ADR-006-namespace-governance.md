# ADR-006: Core Namespace Lockdown

**Status:** Accepted  
**Date:** 2026-07-06  
**Architecture Version:** v1.0.0  
**Supersedes:** ADR-004 (Package Boundary Rules)  
**Authors:** Platform Team

---

## Context

Prior to Architecture v1.0.0, `@esparex/core` exposed a single wildcard export (`export * from './index'`) that allowed consumers to import any internal symbol directly, including deep internal paths such as `@esparex/core/src/infrastructure/db/connection`.

This created several problems:
- No stable public API contract: any rename of an internal file was a breaking change for consumers.
- No enforceable dependency boundaries: infrastructure symbols leaked into frontend apps.
- Wildcard exports made TypeScript path mappings effectively uncontrolled.
- No clear ownership of which symbols were public versus internal implementation details.

The codebase had grown to 182 consumer files with varying import patterns, including direct deep imports into `core/src` internals.

---

## Decision

Establish **14 canonical public namespaces** as the sole public API surface of `@esparex/core`.

Each namespace is a separate export condition in `core/package.json` with a curated, hand-maintained barrel file as its entry point. Wildcard re-exports from internal modules are replaced with named, explicit exports.

**The 14 canonical namespaces:**

```
@esparex/core              (root — index only)
@esparex/core/models       @esparex/core/services     @esparex/core/events
@esparex/core/utils        @esparex/core/config        @esparex/core/types
@esparex/core/infrastructure                @esparex/core/tooling
@esparex/core/validators   @esparex/core/jobs          @esparex/core/queues
@esparex/core/workers      @esparex/core/domain
```

TypeScript `paths` mappings in all `tsconfig.json` files are locked to exactly these 14 namespaces. Any attempt to import from an undefined namespace produces a TypeScript compile error.

---

## Consequences

### Positive
- Stable public API: consumers cannot import symbols that are not explicitly exported.
- Internal refactoring freedom: renaming or moving internal files no longer affects consumers.
- Clear ownership: each namespace has a single responsible barrel file.
- Frontend app isolation: apps can only import `@esparex/core/types` and `@esparex/core/domain`, not infrastructure.

### Negative
- Migration effort: 182 consumer files required import path updates (completed as part of this ADR).
- Barrel file maintenance: each namespace barrel must be updated when symbols are added or removed.
- Stricter discipline required: developers cannot take shortcuts via deep imports.

### Neutral
- One circular dependency (`reliabilityAlerts.ts`) was resolved via dynamic `require()`. This is the only known exception to the static import model.

---

## Verification

All 8 verification gates pass post-migration:

| Gate | Result |
| --- | --- |
| No deep imports (`git grep`) | ✅ 0 matches |
| No Express in core | ✅ 0 matches |
| No circular dependencies (madge) | ✅ 0 cycles |
| All 14 namespaces loadable | ✅ Pass |
| TypeScript compile | ✅ Exit 0 |
| No `@esparex/core/src` paths | ✅ 0 matches |
| No wildcard exports in core | ✅ 0 wildcard re-exports |
| Backend test suite | ✅ Passing |

---

## Supersedes

ADR-004 defined initial package boundary rules without namespace granularity. This ADR supersedes it with a concrete namespace contract and tooling enforcement.
