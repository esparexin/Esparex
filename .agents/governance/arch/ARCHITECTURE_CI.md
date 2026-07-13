# Architecture Automation: CI & Verification Scripts

**Module**: 3B of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md), [ADR-009](../../decisions/ADR-009-integration-strategy.md)

---

## 1. CI Verification Commands

Our architectural fitness checks are automated and run in pre-commit hooks, pre-push checks, and CI merge pipelines.

| Check Name | Target Rule | CI Execution Command | Failure Behavior |
|---|---|---|---|
| **Dependency Cruise** | S2 Import Boundary Matrix | `npm run guard:dependencies` | Blocks merge |
| **Circular Check** | E-006 Circular Dependency | `npm run guard:circular` | Blocks merge |
| **Type Integrity** | E-007 Type Safety | `npm run type-check` | Blocks merge |
| **API Encapsulation** | Public API index.ts barrels | `npm run guard:public-api` | Blocks merge |
| **Manifest Check** | manifest.yaml Schema | `npm run guard:manifests` | Blocks merge |
| **Isolation Check** | Zero infra inside domains | `npm run guard:isolation` | Blocks merge |
| **Foundation Budget** | Foundation size & reference count | `npm run guard:foundation` | Blocks merge |

---

## 2. Verification & Tooling Scripts Directory (`tooling/architecture/`)

All architecture verification scripts are written in TypeScript and executed via ts-node within our CI workflows:

- **`verify-boundaries.ts`**: Runs dependency-cruiser validation to check our Dependency Rule Matrix, ensuring no upward or forbidden sideways imports.
- **`verify-public-api.ts`**: Parses imports using the TypeScript Compiler API (AST check) to verify that cross-domain imports only target domain root barrels (`index.ts`).
- **`verify-manifests.ts`**: Validates manifest structure, stability tags, criticality levels, and ownership coverage.
- **`verify-dependencies.ts`**: Checks for unexpected runtime and devDependency references in package configurations.
- **`verify-ports.ts`**: Scans domain contexts to ensure port interfaces conform to Hexagonal naming rules.
- **`verify-adapters.ts`**: Verifies that adapter wrappers conform to suffix standards and reside in inbound/outbound directories.
- **`verify-foundation.ts`**: Verifies that any file located inside `packages/foundation/` is allowed by primitive standards and content budgets.
- **`architecture-scorecard.ts`**: Computes domain sizes, coupling ratios, circular dependencies, and violation rates to print release scorecard reports.
- **`dependency-graph.ts`**: Generates visual dependency relationship models across contexts.
- **`ownership-report.ts`**: Maps code files to squad ownership directories based on manifest files.
