# Contracts Migration Design

**Domain**: Shared Contracts (`packages/contracts`)
**Date**: 2026-07-18

## 1. Architectural Role
`packages/contracts` is a **high-stability public contract library**. It is strictly a leaf node in the dependency graph.

**Allowed Contents**: DTOs, API Request/Response Models, Zod Schemas, Shared Enums, Event Payloads, Pagination/Error Models, API Metadata, Public Type Aliases.
**Forbidden Contents**: Business Logic, Services, Repositories, React Hooks/Components, Database Models, Mongoose/Prisma Schemas, Infrastructure, Config, Utilities, Business Validation, Domain Entities, Aggregate Roots, Value Objects, Commands, Queries.

*Rule: If it contains business behavior, it does not belong here. Only types that cross a boundary belong in `packages/contracts`.*

## 2. Dependency Rules
- **Allowed Dependencies**: `typescript`, `zod`, `tslib`.
- **Forbidden Dependencies**: Any internal esparex workspace package (`@esparex/kernel`, `@esparex/platform`, `@esparex/domain-*`).

## 3. Package Structure
Contracts are grouped by domain and versioned for future evolution:
```text
src/
  v1/
    common/
      errors/, metadata/, pagination/
    identity/
      dto/, schema/, events/, enums/
    catalog/
    listings/
    payments/
```

## 4. Quality Gates
Before merging, all contracts must pass:
1. Every DTO is immutable where appropriate.
2. Zod schemas exactly match DTOs.
3. Event payloads are serializable.
4. No `Date` objects in wire contracts unless standardized.
5. No functions or class instances crossing boundaries.

## 5. Rollout Strategy
1. **Move files**: Map legacy `shared/src/*` into the new domain structure.
2. **Export**: Re-export through `@esparex/contracts/v1`.
3. **Update imports**: Refactor 1,800+ files to point to the new package.
4. **Delete legacy exports**: Remove old files.
5. **Run cleanup**: Enforce dependency cruiser guards.
