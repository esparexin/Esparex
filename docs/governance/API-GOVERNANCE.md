# API Governance Manual (`API-GOVERNANCE.md`)

> **Status:** Last standard · **Authority:** AGENTS.md (§Mapper Ownership), Enterprise Audit Manual §11–12 · Current audit evidence: Vol-4 §43

---

## 1. REST conventions

- Base path: `/api/v1` (app.ts). All verbs at resource nouns.
- Collection/plural nouns, `GET /resource?…`, `POST /resource`, `PATCH /resource/:id`, `DELETE /resource/:id`.
- IDs: Mongo ObjectIds validated (`validateObjectId`).
- AuthN: `protect` + `extractUser` (95 guarded routes); authZ: documented roles (admin, verified business, seller guards).
- Idempotency: mutation routes with `X-Idempotency-Key` (`listingMutationAPI`, `mutationLimiter`).

## 2. Response envelope (single source)

SSOT: `backend/api/src/utils/apiResponse.ts` + enforcement middleware `errorResponseContract.ts` (patches `res.json` at app.ts:235).

```json
{ "success": true, "data": {}, "meta": { "requestId": "", "timestamp": "", "path": "", "pagination": {}, "statusCode": 200 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "status": 400, "details": [] }, "meta": { ... } }
```

- **Every response** in wireshape; none else (allowed legacy list valid; consolidate).
- 429: MUST emit envelope — violation F48 currently; rate-limit writers return through wrapper.
- Canonical codes: `VALIDATION_ERROR (400)`, `VALIDATION_FAILED` `INVALID_REFERENCE (404)`, `DUPLICATE_* (409)`, `AI_QUOTA_EXHAUSTED (429)`, `AUTH_REQUIRED (401)`, `FORBIDDEN (403)`.

## 3. Pagination · filtering · sorting

| Rule | Value |
| --- | --- |
| Pagination | cursor (listing/chat) or `skip+limit` with `meta.pagination`; **admin lists must not do unbounded skip+count** (V2-7 → Wave 3) |
| Keyset | chat uses cursor `before/after` |
| Filtering | typed query-schema per route (zod); no free-text SQL-like |
| Sorting | field allowlist, direction `asc|desc` |
| Limits | `pageSize ≤ 50` default 20; validation in schema |

## 4. Versioning & DTO rules

1. **Contracts-first:** schemas live in `@esparex/contracts`; route handlers import from `packages/contracts` NOT `core/validators` (F08 — Wave 2 migration).
2. Version path = discontinuous breaking changes (`/v2`); majors gated by ADR + ARB (§15 manual).
3. DTO rules: PascalCase types; optionality explicit; typed enums over strings; data can be nullable only when semantically required; never return model objects — DTO mappers sanctioned (mapper-only rule).

## 5. Validation

- Zod schemas in contracts; run `validateRequest` on ALL writes (12 modules today — every new route must include).
- Error → `VALIDATION_ERROR` with field-level `details` keys accessible in UI.
- Refuse body parsing >10kb? route-appropriate limits for media (upload via S3 path only).

## 6. OpenAPI standards

- Tool: `swagger-jsdoc` + `swagger-ui-express` (per-package deps), mounted `/api-docs` (prod: `ENABLE_SWAGGER=false`).
- **Policy:** every public route annotated with `@openapi`; coverage measured in CI; RC gate ≥ 50% (today 0.3% — Wave 2 backlog), target 90%.
- Spec must stay in sync with contracts; no hand-edited spec files.

## 7. Contract lifecycle

1. Propose (DTO + schema change) → 2. ARB review (§15) → 3. `repo:contracts`/`balance` check → 4. Release notes entry → 5. Breaking = ADR + version bump → 6. Deprecation: mark `@deprecated` next RELEASE, remove following.

**Gates:** `guard:api-surface`, `repo:contracts`, `guard:route-collision`, `repo:routes`, `guard:pr-impact-analysis` (PRs touching contracts).

---

*Part of Esparex governance library. Evidence: Vol-2 §16, Vol-4 §43, Vol-5 §52-findings.*