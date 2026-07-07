# ADR-011: Database Governance Standard for MongoDB & Mongoose

## Metadata
- **Status**: Accepted
- **Date**: 2026-07-06
- **Authors**: Antigravity AI Pair
- **Reviewers**: Repository Governance Owner, Principal Architect
- **Decision Category**: Architecture / Database Governance
- **Related Documents**: [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md), [AGENTS.md](../../AGENTS.md), [ARCHITECTURE.md](../../ARCHITECTURE.md), [API_CONTRACTS.md](../../API_CONTRACTS.md)
- **Related GitHub Issues**: #525
- **Related Pull Requests**: None

---

## 1. Context
The MAD Entertainment platform relies on MongoDB with Mongoose as its primary data store. While governance policies exist for architecture boundaries, repository management, authentication, payments, and general code quality, there has been no formal governance standard for database design and implementation. Database-related changes (such as schema updates, indexing strategies, and transaction boundaries) have been reviewed on an ad-hoc, case-by-case basis. 

As the application continues to scale, this lack of standardized governance increases the risk of:
- Performance regressions from index starvation or unindexed collection scans.
- Data inconsistency due to concurrent operations lacking transaction locks.
- Schema drift between MongoDB schemas, TypeScript interfaces, and Zod validators.
- Redundant or conflicting indexes causing write overhead.
- Security vulnerabilities such as NoSQL injection.

## 2. Decision
We will establish a repository-wide **Database Governance Standard** that applies to every MongoDB and Mongoose implementation, feature, bug fix, refactor, migration, and audit. This standard will serve as the single source of truth (SSOT) for database decisions and define the verification criteria required for merging any database-related changes.

---

## 3. Principles
Every database design, query, or migration must adhere to the following principles:
1. **Safety First**: Prioritize data integrity and transaction safety over optimistic performance gains.
2. **Predictable Performance**: Prevent unindexed queries and inefficient pipelines before they reach staging or production.
3. **Strict Boundaries**: Maintain separation between raw database models and external-facing API contracts.
4. **Traceability**: All database schema changes and migrations must be fully auditable and reversible.
5. **No Duplication**: Reusable schemas, types, and validations must have a single source of truth.

---

## 4. Schema Governance
Mongoose schema designs must enforce typing, validation, and naming consistency:
- **Consistency**: All schema and model definitions must be located in `apps/server/src/models/`. No ad-hoc models may be defined in services or controllers.
- **Field Validation**: Every field must have explicit validations (e.g., `required`, `min`, `max`, `trim`). Schema-level string fields must utilize `lowercase: true` when case-insensitivity is desired (e.g., emails).
- **Default Values**: Ensure clear default values for fields with fallback states (e.g., boolean status flags).
- **Enums**: Enum fields must validate against shared constants or typescript enums. Never hardcode string enums inside schema definitions.
- **Embedded vs. Referenced**: Prefer referenced documents for unbounded collections (e.g., logs, tickets) and embedded documents only for bounded, low-cardinality nested structures (e.g., configuration objects, metadata pairs).
- **Naming Conventions**: Collections must use lowercase pluralized naming (e.g., `bookings`, `payments`). Fields must use camelCase.

---

## 5. Index Governance
Indexes must be deliberately designed and reviewed to prevent write degradation and query bottlenecks:
- **Index Justification**: Every index must correspond to a specific query pattern. Do not add indexes speculatively.
- **Single Indexes**: Fields queried in isolation (e.g., `slug` on events, `email` on users) must have single indexes.
- **Compound Indexes**: Queries utilizing multiple filter fields (e.g., `bookingId` + `status`) must utilize compound indexes, with the most selective fields placed first.
- **Unique Indexes**: Fields requiring uniqueness must use Mongoose `unique: true` to let the database enforce constraints. Adding a separate `index: true` on the same unique field is prohibited as it creates redundant index overhead.
- **Partial and Sparse Indexes**: Use partial or sparse indexes for fields that are frequently null or represent a small subset of queried documents.
- **TTL Indexes**: Collections requiring auto-expiration (e.g., temporary tokens, lock states) must use TTL indexes. Note that physical TTL deletions must not run on critical business entities where late updates may cause data corruption; use logical expirations instead.
- **Unused Index Review**: Run periodic index utilization checks to identify and drop unused or redundant indexes.

---

## 6. Query Governance
All queries must be optimized for performance and resource consumption:
- **Query Efficiency**: Ensure every read operation leverages an index. Collection scans (COLLSCAN) are strictly prohibited on collections exceeding 100 documents.
- **Projection**: Always select only the necessary fields (`.select('field1 field2')`) instead of loading entire documents, especially on large entities like `Booking` or `Event`.
- **Pagination**: Large lists must use cursor-based or limit-offset pagination. Never query unbounded collections without limits.
- **Sorting**: Sorting operations must match index ordering. Avoid in-memory sorting on unindexed fields.
- **Aggregation Optimization**: Aggregation pipelines must start with `$match` and `$sort` stages to filter data before processing. Avoid unnecessary `$lookup` operations.

---

## 7. Transaction Governance
Ensure atomic state changes and concurrency safety:
- **MongoDB Sessions**: Operations affecting multiple documents or requiring multi-step verification must execute inside a Mongoose transaction session (`withTransaction` or `runInTransaction`).
- **Atomic Operations**: Prefer atomic Mongoose updates (e.g., `$inc`, `$set`, `$push`) with filter guards over a "read-modify-save" sequence to prevent race conditions.
- **Retry Safety**: Transactions must handle transient write conflicts and retry appropriately.
- **Rollback Behavior**: Ensure all transaction failures result in a clean rollback. Never invoke external side effects (e.g., email dispatch, gateway API calls) inside transaction blocks.
- **Idempotency**: Maintain idempotency keys to ensure multiple identical requests do not produce duplicate database records.

---

## 8. Data Integrity Governance
- **Duplicate Prevention**: Enforce unique constraints at the database layer (via unique indexes) to prevent double writes.
- **Referential Consistency**: Maintain integrity when deleting or updating referenced records. Clean up child records or raise validation errors if parent documents are modified.
- **Orphan Prevention**: Check for and clean up orphaned records (e.g., tickets without a valid booking) using scheduled jobs or lifecycle hooks.

---

## 9. Security Governance
- **NoSQL Injection Prevention**: Never pass raw user inputs directly into Mongoose filters. Always sanitize query parameters and restrict filters to explicit properties.
- **Input Validation**: Use Zod schemas to validate payload types and shapes before inserting or updating documents.
- **Authorization Guards**: Confirm that the requesting actor has permission to read or modify the requested document before executing database queries.
- **Sensitive Field Protection**: Mask or encrypt sensitive data (e.g., PII, tokens) before storing. Ensure schemas omit sensitive fields (e.g., `password`, `salt`) from default JSON/Object transformations.

---

## 10. Performance Governance
- **Document Size Limits**: Keep document sizes within reasonable boundaries. Avoid unbounded arrays inside embedded documents; reference separate collections instead.
- **Bulk Operations**: Use bulk write operations (`bulkWrite`, `insertMany`) for high-volume insertions and updates.
- **Query Plan Analysis**: Developers must execute and verify `explain()` output (e.g., checking `totalDocsExamined` vs `nReturned`) for all new complex queries or aggregation pipelines before staging reviews.

---

## 11. Data Lifecycle Governance
- **Soft Deletes**: Implement soft deletes (e.g., setting `deletedAt: Date` or `status: 'deleted'`) for business-critical entities where history must be preserved.
- **Retention Policies**: Define strict data retention periods for operational logs, audit tracks, and temporary records.
- **Archive Strategies**: Offload historical data to cold storage once it falls outside the active retention period.

---

## 12. Migration Governance
- **Backward Compatibility**: Migrations must be designed to allow rolling deployments (the application code must support both the old and new schema shapes simultaneously).
- **Zero-Downtime**: Schema expansions (adding columns or nullable fields) are preferred over destructive modifications (renaming or removing fields).
- **Migration Scripts**: Write idempotent, tested migration scripts that can run safely in batches.
- **Rollback Strategy**: Every database migration script must include a companion rollback script.

---

## 13. Testing Governance
Database integrations must be tested to ensure correct behavior:
- **Schema Validation Tests**: Assert that validator rules correctly block malformed inputs.
- **Transaction Tests**: Test rollback behavior by throwing intentional errors during multi-document writes.
- **Index existence Tests**: Unit test suites must assert that vital indexes (e.g., unique constraints) are registered on models.
- **Query Performance Tests**: Verify that query paths use appropriate index structures.

---

## 14. Repository Alignment
Maintain synchronization across all code boundaries:
- Mongoose schemas must align with TypeScript interfaces defined in `packages/types`.
- Input validation Zod schemas in `packages/validations` must match schema typing.
- Changes affecting public API parameters must be updated in corresponding OpenAPI/API specifications (e.g., Swagger definitions or OpenAPI JSONs).
- Verify frontend contract assumptions whenever a database field type or status enum is modified.

---

## 15. Governance Validators
To automate enforcement of this standard, a future database governance validator package will be integrated into the repository governance engine, implementing the following rules:
- `VAL-DB-001` (Schema Consistency): Assures Mongoose schema alignments.
- `VAL-DB-002` (Missing Index): Checks for fields in queries lacking database indexes.
- `VAL-DB-003` (Duplicate Index): Detects duplicate indexes (e.g., redundant `index: true` on `unique: true`).
- `VAL-DB-004` (Collection Scan Detection): Flags queries likely to run collection scans.
- `VAL-DB-005` (Transaction Safety): Warns against calling external APIs inside transactions.
- `VAL-DB-006` (Referential Integrity): Asserts reference keys map to valid schemas.
- `VAL-DB-007` (Sensitive Field Exposure): Blocks sensitive fields lacking select suppression.
- `VAL-DB-008` (Query Performance): Analyzes aggregate stages for optimization.
- `VAL-DB-009` (TTL Validation): Asserts correct TTL configurations.
- `VAL-DB-010` (Schema Drift): Detects discrepancies between models and types.

---

## 16. Governance Reporting
Every database audit must produce evidence-based findings and include:
- **Schema Health Score** (Structural correctness and type safety)
- **Index Health Score** (Adequate indexing, no duplicates)
- **Query Performance Score** (Average read latency, index utilization)
- **Transaction Safety Score** (Rollbacks, lock times, concurrency blocks)
- **Data Integrity Score** (Ref integrity, orphan checks)
- **Security Score** (PII masking, sanitization)
- **Maintainability Score** (Code style, alignment with types)
- **Overall Database Health Score** (Aggregate performance and stability)

*Note on Scoring Model*: The health scoring model is **advisory** (informational) during standard feature PRs but **normative** (blocking) for major database migrations, performance refactors, and core platform releases.

---

## 17. Consequences
- **Pros**:
  - Consistent and reviewable schema changes.
  - Predictable database performance and index hygiene.
  - Lower risk of database lock contention and connection pool exhaustion.
  - Tighter security boundaries preventing data leakage and NoSQL injection.
- **Cons**:
  - Higher initial development friction due to strict testing and schema alignment requirements.
  - Manual overhead of writing migration and rollback scripts for schema updates.

---

## 18. Future Work
- Package database validators under `scripts/governance/validators/` for automated CI analysis.
- Build database audit engine (`GOV-DB-001`) to scan MongoDB status and query patterns.

---

## Appendix: Governance Enforcement

### Mandatory Review Triggers
A database governance review is mandatory before merging any PR that contains:
1. **New MongoDB Collection**: Addition of any new model or collection.
2. **Schema Modification**: Adding, removing, or changing any field in an existing schema.
3. **Index Changes**: Addition, removal, or modification of database indexes.
4. **Transaction Implementation**: Implementing or editing transaction logic or session usage.
5. **Aggregation Pipeline**: Introducing or modifying MongoDB aggregation pipelines.
6. **Query Modifications**: Modifying existing queries in a way that alters performance characteristics.
7. **Data Migration**: Creation of migration scripts.
8. **TTL or Retention Changes**: Modifying document expiration settings.
9. **Soft-delete Strategy Changes**: Altering record deletion behavior.
10. **Database Dependencies**: Introducing or modifying Mongoose plugins or driver dependencies.

### Required Review Gates
Every mandatory review must pass the following validation gates:
- **Architecture Review**: Verification of model boundaries, relationship choices (embed vs reference), and modularity.
- **Performance Review**: Verification of index usage and query plan analysis (`explain()`).
- **Security Review**: Sanitization check and validation of authorization guards before reads/writes.
- **Data Integrity Review**: Verification of transactional safety and constraints.
- **Migration & Rollback Review**: Verification of backward compatibility and successful execution of rollback scripts.
- **Validator Execution**: Successful pass of automated database validators (once integrated).
