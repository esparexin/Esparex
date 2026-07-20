# CI Enforcement & Automation Catalog

**Module**: 3 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-20
**Status**: Active

---

## Merged From
- `.agents/governance/arch/ENFORCEMENT.md` (Module 3)
- `.agents/governance/arch/ARCHITECTURE_CI.md` (Module 3B)
- **Merged:** 2026-07

---

## 1. Automated CI Controls Catalog

This is the authoritative catalog of automated controls that run in our CI/CD pipelines (pre-commit, pre-push, and pull request merge checks). If a Standard rule does not appear here, it is enforced by review/convention only.

| Control ID | Standard enforced | Tool | Command | Failure action |
|---|---|---|---|---|
| E-001 | S2 Import Boundary — no frontend→core | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-002 | S2 Import Boundary — no shared→core | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-003 | S2 Import Boundary — no upstream core→api | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-004 | S3 Package Content — no direct model imports in controllers | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-005 | S2 Import Boundary — no legacy transport paths | `dependency-cruiser` | `npm run guard:dependencies` | Blocks merge |
| E-006 | S2/S3 — No circular dependencies | `madge` | `npm run guard:circular` | Blocks merge |
| E-007 | S3 Package Content — type safety across all | `tsc --noEmit` | `npm run type-check` | Blocks merge |
| E-008 | Repository hygiene — unused imports | `eslint-plugin-unused-imports` | `npm run lint` | Warning (upgrade to error planned) |
| E-009 | Repository hygiene — code duplication > 10 lines | `jscpd` | `npm run guard:duplicates` | Blocks merge |
| E-010 | Repository discipline — forbidden keywords (`legacy`, etc.) | Custom script | `npm run guard:platform` | Blocks merge |
| E-011 | Repository hygiene — unused exports and dead code | `knip` | `npm run guard:knip` | Blocks merge |

---

## 2. CI Verification Commands Reference

The following table lists the command targets executed during verification gates:

| Check Name | Target Rule / Standard | CI Execution Command | Failure Behavior |
|---|---|---|---|
| **Dependency Cruise** | S2 Import Boundary Matrix | `npm run guard:dependencies` | Blocks merge |
| **Circular Check** | E-006 Circular Dependency | `npm run guard:circular` | Blocks merge |
| **Type Integrity** | E-007 Type Safety | `npm run type-check` | Blocks merge |
| **API Encapsulation** | Public API index.ts barrels | `npm run guard:public-api` | Blocks merge |
| **Manifest Check** | manifest.yaml Schema | `npm run guard:manifests` | Blocks merge |
| **Isolation Check** | Zero infra inside domains | `npm run guard:isolation` | Blocks merge |
| **Building Blocks Budget**| Building blocks size & references| `npm run guard:building-blocks` | Blocks merge |

### Output Reports
Every execution of `npm run guard:architecture` automatically compiles and generates visual developer-friendly reports inside `tooling/architecture/reports/`:
- **`architecture-report.json`**: Machine-readable violation list and coupling metrics.
- **`architecture-report.html`**: Interactive web dashboard displaying the coupling scorecard, ownership maps, and dependency graphs.

---

## 3. Verification & Tooling Scripts (`tooling/architecture/`)

All architecture verification scripts are written in TypeScript and executed via ts-node within our CI workflows:

- **`verify-boundaries.ts`**: Runs dependency-cruiser validation to check our Dependency Rule Matrix, ensuring no upward or forbidden sideways imports.
- **`verify-public-api.ts`**: Parses imports using the TypeScript Compiler API (AST check) to verify that cross-domain imports only target domain root barrels (`index.ts`).
- **`verify-manifests.ts`**: Validates manifest structure, stability tags, criticality levels, SLAs, and ownership coverage.
- **`verify-dependencies.ts`**: Checks for unexpected runtime and devDependency references in package configurations.
- **`verify-ports.ts`**: Scans domain contexts to ensure port interfaces conform to Hexagonal naming rules.
- **`verify-adapters.ts`**: Verifies that adapter wrappers conform to suffix standards and reside in inbound/outbound directories.
- **`verify-building-blocks.ts`**: Verifies that any file located inside `core/building-blocks/` is consumed by three or more distinct bounded contexts, and validates the file count budget.
- **`architecture-scorecard.ts`**: Computes domain sizes, coupling ratios, circular dependencies, and violation rates to print release scorecard reports and compile the report files.
- **`dependency-graph.ts`**: Generates visual dependency relationship models across contexts.
- **`ownership-report.ts`**: Maps code files to squad ownership directories based on manifest files.

---

## 4. Coverage Gaps & Evolution Roadmap

The following Standards currently have no automated enforcement — they rely on code review and manual audit:

| Standard | Rule | Gap | Mitigation |
|---|---|---|---|
| S1 Package Ownership | Every top-level directory documented or registered | No automated check for undocumented directories | Manual audit + README governance rule |
| S4 ADR Requirement | ADR created before structural change | CI cannot detect missing ADRs | Pre-commit checklist; ADR-006 defines criteria |
| S3 Package Content | `@esparex/shared` contains no Node.js-only APIs | No automated check | Manual audit; logger verified as browser-safe |

### Enforcement Status by Principle

| Principle | Automated? | Controls |
|---|---|---|
| P1 — Dependencies flow inward | ✅ Partial | E-001, E-002, E-003 |
| P2 — Domain must not depend on delivery | ✅ Yes | E-003, E-004 |
| P3 — UI must not depend on backend infrastructure | ✅ Yes | E-001 |
| P4 — Shared packages remain platform-neutral | ❌ Not automated | Manual audit |
| P5 — Every boundary has a justified reason | ❌ Not automated | ADR process |
| P6 — Architectural decisions documented before implementation | ❌ Not automated | ADR-006 lifecycle |

### Enforcement Evolution Roadmap
These proposed controls are planned to close current coverage gaps:
* **Auto-detect undocumented top-level directories (S1):** Custom script comparing `workspaces` array vs. filesystem (Priority: Medium).
* **Detect Node.js-only imports in `@esparex/shared` (S3/P4):** `dependency-cruiser` rule targeting `node:*` imports from `shared/` (Priority: High).
* **Detect React imports in `@esparex/shared` (S3/P4):** `dependency-cruiser` rule targeting `react` imports from `shared/` (Priority: High - hooks completed; enforce at import level).
