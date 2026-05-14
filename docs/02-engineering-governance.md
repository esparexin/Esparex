# Engineering Governance

Status: Active  
Effective Date: 2026-05-14  
Owner: Enterprise Architect

## 1. Core Architectural Guards

The following guards are enforced in CI/CD to prevent architectural drift.

### 1.1. Single Service Worker Strategy
- The platform MUST maintain exactly one Service Worker implementation to avoid messaging collisions.
- Forbidden: `firebase-messaging-sw.js` in root or duplicate templates.
- Enforced by: `guard:platform-governance`

### 1.2. Compatibility Marker Baseline
- New usage of `@deprecated`, `legacy`, or `compatibility` markers requires a documented removal plan.
- Increases in marker counts are blocked unless the baseline in `scripts/policy/` is intentionally updated.
- Enforced by: `guard:platform-governance`

### 1.3. Database Mutation Restrictions
- JS-based database mutations outside of `backend/user/migrations/` are strictly forbidden.
- Scripts that bypass lifecycle hooks or audit trails must be baseline-tracked and approved.
- Enforced by: `guard:platform-governance`

## 2. API Surface Protection

- All routes must use the canonical versioned namespace: `/api/v1/*`.
- Direct access to `/api/admin/` or unversioned routes is deprecated.
- Enforced by: `guard:api-surface`

## 3. Deployment Discipline

- No direct push to `main`.
- PR Impact Analysis is mandatory (Header: `## Impact Analysis`).
- Enforced by: `guard:pr-impact-analysis`
