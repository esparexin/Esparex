# CI Enforcement Catalog

**Module**: 3 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13

> Enforcement defines which automated controls prevent violations of the Standards. Controls run in CI and block merge when they fail. This document is the authoritative catalog — if a Standard rule does not appear here, it is enforced by convention only.

---

## Enforcement Catalog

| Control ID | Standard enforced | Tool | Command | Failure action |
|---|---|---|---|---|
| E-001 | S2 Import Boundary — no frontend→core imports | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-002 | S2 Import Boundary — no shared→core imports | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-003 | S2 Import Boundary — no upstream core→api imports | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-004 | S3 Package Content — no direct model imports in controllers | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-005 | S2 Import Boundary — no legacy transport paths | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-006 | S2/S3 — No circular dependencies | `madge` | `npm run guard:circular` | Blocks merge |
| E-007 | S3 Package Content — type safety across all workspaces | `tsc --noEmit` | `npm run type-check` | Blocks merge |
| E-008 | Repository hygiene — unused imports | `eslint-plugin-unused-imports` | `npm run lint` | Warning (upgrade to error planned) |
| E-009 | Repository hygiene — code duplication > 10 lines | `jscpd` | `npm run guard:duplicates` | Blocks merge |
| E-010 | Repository discipline — forbidden keywords (`legacy`, `@deprecated`, etc.) | Custom script | `npm run guard:platform` | Blocks merge |
| E-011 | Repository hygiene — unused exports and dead code | `knip` | `npm run guard:knip` | Blocks merge |

---

## Coverage Gaps

The following Standards currently have no automated enforcement — they rely on code review and audit:

| Standard | Rule | Gap | Mitigation |
|---|---|---|---|
| S1 Package Ownership | Every top-level directory documented or registered | No automated check for undocumented directories | Manual audit + README governance rule |
| S4 ADR Requirement | ADR created before structural change | CI cannot detect missing ADRs | Pre-commit checklist; ADR-006 defines criteria |
| S3 Package Content | `@esparex/shared` contains no Node.js-only APIs | No automated check | Manual audit; logger verified as browser-safe (2026-07-13) |

---

## Enforcement Status by Principle

| Principle | Automated? | Controls |
|---|---|---|
| P1 — Dependencies flow inward | ✅ Partial | E-001, E-002, E-003 |
| P2 — Domain must not depend on delivery | ✅ Yes | E-003, E-004 |
| P3 — UI must not depend on backend infrastructure | ✅ Yes | E-001 |
| P4 — Shared packages remain platform-neutral | ❌ Not automated | Manual audit |
| P5 — Every boundary has a justified reason | ❌ Not automated | ADR process |
| P6 — Architectural decisions documented before implementation | ❌ Not automated | ADR-006 lifecycle |

---

## Enforcement Evolution Roadmap

These controls are not yet in place but would close current coverage gaps:

| Proposed control | Standard | Tooling approach | Priority |
|---|---|---|---|
| Auto-detect undocumented top-level directories | S1 | Custom script comparing `workspaces` array vs. filesystem | Medium |
| Detect Node.js-only imports in `@esparex/shared` | S3/P4 | `dependency-cruiser` rule targeting `node:*` imports from `shared/` | High |
| Detect React imports in `@esparex/shared` | S3/P4 | `dependency-cruiser` rule targeting `react` imports from `shared/` | High (completed for hook; enforce at import level) |
