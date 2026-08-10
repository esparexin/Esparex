# Database Governance Manual (`DATABASE-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** Backend lead (ARB for schema changes) · Evidence: Vol-2 §23, Vol-4 §44; current audit: 273 index decls, 129 txn sites

---

## 1. Collections & naming

- Collection = domain plural lowercase (`ads`, `users`, `transactions`, `otpcodes`).
- One canonical model per collection in `core/src/models/*` — no per-app mongo config (F07 risk).
- Reserved: `ActivityLog`, `AdminLog`, `AlertDeliveryLog`.

## 2. Index policy (Rules)

1. Every index needs a **justification comment** (query pattern + purpose) in the schema.
2. TTL index naming: `idx_<collection>_<field>_ttl_idx`.
3. Guideline: ≤ 5 indexes per hot collection; total trending-down from 273 (Wave-3 audit).
4. Unused indexes (via `$indexStats()` — data-quality quarterlies) are dropped same quarter.
5. Composite over single for frequent co-query key sets; fields order = selectivity order.
6. Duplicated prefix combos currently flagged (Vol-4 §44.1) — Wave 3 eliminates.

## 3. Transactions & atomicity

| Pattern | Rule |
| --- | --- |
| Multi-doc updates | `startSession()` + `withTransaction()` — 129 usages live |
| Created/updated invariants | must be inside txn or idempotent compensation |
| Boost / wallet / slot | multi-write paths must be atomic (V2-3, V2-5 to fix) |
| No nested transactions | sessions only, commit once per endpoint |

## 4. Migrations

- Forward-only, versioned (`schema-migration` guard); backward-compatible by default.
- Destructive ops (drop/rename) = ADR + data plan + rollback path (R3).
- TTL expiry = NOT deletion of soft-deleted docs (V2-4 race must be fixed — do not reuse TTL for logical deletes).

## 5. Soft delete & audit

- Soft-delete canonical: `isDeleted`/`deletedAt` with lifecycle guard (`guard:no-ad-hard-delete`).
- Cascades: business→ads must cascade (V2-2 — currently missing).
- Audit logs: `AdminLog`/`ActivityLog` — every admin mutation writes deterministic entry.

## 6. Referential integrity

- FK-like relations defined in domain ports (boundaries), verified by data-quality scan quarterly (Manual C-3).
- Orphan cleanup scripts centralized in `core/src/jobs` — no ad hoc deletes.

## 7. Performance

- Cold query budget: `p95 < 100ms` for listing reads (baselines in `docs/performance/baseline-report.md`).
- No unbounded `skip+count` admin reads (V2-7 — Wave 3).
- Explain plan on new complex pipelines in PR; index-built aggregates prefer `$match` first.
- Mongo failover/DR per `DEVOPS-GOVERNANCE.md` §5.

## 8. Data quality cadence

Quarterly data-quality audit (Manual C-3): duplicates, orphans, invalid IDs, missing fields, soft-delete consistency, `$indexStats` — write to governance report.

---

*Owner: Backend; reviews at quarterly; gates: `guard:schema-migration`, `guard:objectid`.*