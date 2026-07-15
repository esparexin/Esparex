# Bounded Context Migration Workflow

This workflow provides a step-by-step checklist for migrating legacy bounded contexts in the Esparex codebase to the target DDD Ports & Adapters Architecture.

---

## 1. Discovery
- [ ] Run live codebase discovery on the target context files under `core/src/services/<context>` and `backend/api/src/controllers/<context>`.
- [ ] Inspect external dependencies (e.g., Mongoose models, Redis cache helpers, third-party libraries).
- [ ] Rebuild the local knowledge graph using `$env:GRAPHIFY_NO_BACKUP=1; graphify update .` to map context dependencies and composition roots.

## 2. Repository Capability Audit
- [ ] Audit all data retrieval and mutation methods in the context.
- [ ] List all queries, projection filters, and transaction scopes currently referencing Mongoose models directly.

## 3. Port Design
- [ ] Create domain port interfaces under `core/src/domains/<domain>/ports/` (e.g., `<Name>RepositoryPort.ts`).
- [ ] Ensure all port parameters and return values are pure, framework-agnostic TypeScript types or Domain Entities.
- [ ] Do **not** import Mongoose types (`ClientSession`, `Query`, `UpdateQuery`, `Types.ObjectId`) into port files.

## 4. Adapter Implementation
- [ ] Create concrete database adapters under `core/src/adapters/outbound/database/<domain>/` (e.g., `Mongo<Name>RepositoryAdapter.ts`).
- [ ] Implement the port interfaces, executing Mongoose operations internally.
- [ ] Map internal Mongoose Document instances to pure, read-only Domain Entities using a `toDomain()` mapping function.

## 5. UnitOfWork Integration
- [ ] If transaction coordination is needed across multiple operations, define `<Domain>UnitOfWorkPort` under `core/src/domains/<domain>/ports/` with an opaque `session: unknown` transaction scope.
- [ ] Implement the corresponding adapter under `core/src/adapters/outbound/database/<domain>/` wrapping Mongoose `session.withTransaction` internally.

## 6. Cache Decoupling
- [ ] Declare business invalidation intent behind a dedicated port (`core/src/domains/<domain>/ports/<Domain>CachePort.ts`).
- [ ] Implement the adapter (`Redis<Domain>CacheAdapter.ts`) wrapping low-level `redisCache` helpers, shielding domain services from caching mechanics.

## 7. Controller Cleanup
- [ ] Refactor incoming Express controllers and middlewares to consume Repository and UnitOfWork ports via the composition root rather than querying Mongoose models directly.
- [ ] Maintain transitional compatibility markers in spec files to support existing tests during the migration boundary cleanup.

## 8. Architecture Audit
- [ ] Run architecture scans targeting leaky abstractions in the refactored services and controllers.
- [ ] Verify that refactored services contain zero direct imports of:
  - `models/`
  - `mongoose`
  - `ClientSession`
  - `startSession`
  - `withTransaction`
  - `Types.ObjectId`
  - `redisCache`

## 9. Release Gate
- [ ] Validate TypeScript compilation:
  ```bash
  npx tsc --noEmit
  ```
- [ ] Run automated architectural boundary checks:
  ```bash
  npm run verify:architecture
  ```
- [ ] Run platform governance guardrail checks:
  ```bash
  npm run governance:guards
  ```
- [ ] Run all unit and integration tests:
  ```bash
  npm test -w @esparex/core
  npm test -w backend/api
  ```

## 10. Pull Request
- [ ] Stage and commit changes under conventional commit guidelines.
- [ ] Push the feature branch to the remote origin.
- [ ] Create a draft or formal Pull Request on GitHub linked to the closing issue.
- [ ] Include a detailed description detailing:
  - Architectural changes (before vs. after diagram/text)
  - Commit history log
  - Quantitative migration metrics
  - Verification check outputs
