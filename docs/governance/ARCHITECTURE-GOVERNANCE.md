# Architecture Governance Manual (`ARCHITECTURE-GOVERNANCE.md`)

> **Status:** Enforced standard · **Owner:** Architecture Review Board (ARB) · **Governing doc:** AGENTS.md (supreme), `ENTERPRISE-AUDIT-MANUAL.md` §10/§14

---

## 1. Architecture principles

1. **Business rules never depend on platform** (Platform Operating Model) — core owns rules; UI owns presentation.
2. **SSOT-first** — extend existing owners (`@esparex/contracts`, `core`, `@esparex/ui`) before creating anything.
3. **Contracts are the single source of truth** — every entity schema lives in `packages/contracts`; apps consume DTOs directly, never re-compute/format.
4. **Single-instance responsive** — one component per screen; CSS breakpoints only; no `Desktop*`/`Mobile*` twins.
5. **Mapper ownership** — boundary translation lives in mappers; repositories/services never map.
6. **Similarity Threshold Rule** — consolidation only when overall similarity >75% AND no dimension <50%.
7. **Read-only audits, gated change** — fixes land through the Remediation Program waves, not ad hoc.

## 2. Layer rules (authoritative)

| Layer | Owns | Prohibited | Evidence |
| --- | --- | --- | --- |
| `apps/web` components | layout, gestures, display of pre-computed | formatting, business logic | Vol-3 §21, F-list |
| `apps/web` context/hooks | UI state sync | domain transforms | Vol-3 §21 |
| `backend/api` controllers | validation, HTTP status, session auth | direct DB queries, business math | Vol-4 §41 (20/91 import mongoose = minor violation A-1) |
| `core` domains | business rules, invariants, canonical formatters | React, HTTP concerns | Vol-1 §3 |
| `core/src/services` (legacy) | — deprecated shim tree | — | F05 (migration Wave 2) |
| `packages/contracts` | DTOs, validation schemas, SSOT | duplicate local schemas | F08 |
| `packages/ui` | primitives, tokens | app-local duplicates | AGENTS §3 |

**Gate:** `guard:component-api-boundary`, `guard:buildgraph` (0 circles), `repo:architecture`.

## 3. Dependency & package boundaries

- Allowed: `web → shared → contracts`; `web → ui → tokens`; `core → shared → kernel`; `backend/api → core`, `backend/api → contracts`.
- Disallowed: `apps/* → core` (web verified 0 imports), `core → backend`, reverse edges, cycles.
- Cross-domain edges inside core (catalog→reviews, listings→wallet etc.) are allowed **only** one-directional and listed (Vol-3 §32.2, 34 edges legacy — Wave 2 target).
- New cross-domain edge → ARB review (§14 manual).

## 4. Package creation policy

New `packages/*` requires: ADR (§10 manual), ARB approval, consumers ≥ 2 surfaces, kernel dependency check, `guard:shared-ssot` not bypassed.

## 5. Naming conventions

| Artifact | Convention |
| --- | --- |
| Domains | `core/src/domains/<domain>/application|domain|infrastructure|ports` |
| Legacy migration | rename on move only (no alias shims) |
| Controllers | `<noun>Controller` |
| Handlers | HTTP verb semantics in route files |
| DTOs | `*DTO.ts` in `packages/contracts` |
| Indexes | `idx_` prefix + purpose suffix |
| Flags | `ENABLE_*`/`USE_*` enum in `featureFlags.ts` |

## 6. Module ownership

Canonical matrix: `.github/CODEOWNERS` (38 lines, 7 groups). Orphan rule: zero files without an owner (`guard:shared-ssot`, `knip`).

## 7. Refactoring policy

1. **Migration before creation** — extend the SSOT; no parallel implementations.
2. Ship small; each refactor = one wave item; rollback = revert PR.
3. Legacy → domain (F05) must preserve behavior via contract-compat tests before cutover (verify mappers).
4. No refactor without passing `repo:gate` on the same PR (guard).
5. Dead code: `guard:dead-code` must stay 0 new per PR.

---

*Owner: ARGB · Reviews: quarterly re-cert (Manual §8).*