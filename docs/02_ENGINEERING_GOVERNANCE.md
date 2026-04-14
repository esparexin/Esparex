# 02_ENGINEERING_GOVERNANCE — Coding & Architectural Standards

## 🏗️ Layered Architecture (Backend)
The backend follows a strict 5-layer delegation model. **Logic leakage between layers is a critical failure.**

1.  **Routes**: Thin entry points that delegate to controllers.
2.  **Controllers**: Request/Response handlers that delegate to services.
3.  **Services (ZONE A)**: The only layer allowed to contain business logic.
4.  **Models (ZONE A)**: Mongoose schemas, indexes, and lifecycle hooks.
5.  **Middleware**: Cross-cutting concerns (Auth, Rate Limiting, OTP Guard).

---

## 🏗️ Thin-Page Architecture (Frontend)
- **Pages**: Must be thin (<50 lines). They serve only as layout containers and route anchors.
- **API Client**: All HTTP calls must go through the centralized `api/` layer. Direct `axios` or `fetch` calls in components are forbidden.
- **Logic-Free Components**: UI components should be pure and logic-free, relying on props and services for data and behavior.

---

## 🔤 Naming Conventions
- **Files**: `camelCase` (e.g., `adService.ts`).
- **React Components**: `PascalCase`.
- **Entities**: Singular `PascalCase` (e.g., `Ad.ts`).
- **Collections**: Plural `lowercase` (e.g., `users/`).
- **Constants**: `UPPER_SNAKE_CASE`.

---

## 🛡️ Code Quality & Safety
- **Soft Delete**: Data must never be hard deleted. Use `isDeleted` with `deletedAt` and `deletedBy` fields.
- **Audit Trails**: Every status mutation must be logged in `StatusHistory`.
- **OTP Security**: Production environments require verified SMS providers; fallback or mock OTPs are allowed only in local dev.
- **Slug Governance**: SEO slugs must have collision prevention (retry/suffix) logic at the model level.
- **Express Route Hierarchy Law**: Static routes MUST be defined before parameterized ones (e.g., `/summary` before `/:id`). Enforced by `npm run guard:route-hierarchy`.

---

---

## 🛡️ Mandatory Documentation Impact Audit
Before any architectural, lifecycle, API, or system change is implemented, a mandatory impact audit must be performed. Documentation integrity is a platform safety requirement.

### 1. Scope Identification
Identify which canonical document(s) are impacted: Platform Blueprint, Engineering Governance, Enum Rollout, Admin Architecture, API Contracts, Lifecycle Rules, or Frontend Rules.

### 2. Change Impact Mapping
Define affected lifecycle states, APIs, moderation logic, cron behaviors, aggregations, and UI filters. This impact must be documented before coding begins.

### 3. Update-First Rule
System behavior changes must be reflected in the relevant document **before** code changes are merged. Updates must include:
- Change rationale
- Affected modules
- Migration/Rollback considerations
- Architectural review confirmation

### 4. Lifecycle & Enum Protection
Changes to enums or naming require verification of the centralized source, rollout phase alignment, and validation of analytics normalization logic.

### 6. Moderation Entity ID Law
Any moderation list API MUST expose the **PRIMARY DOMAIN ENTITY ID** as the `id` field. Child document IDs (like `reportId`) must never be used as the primary list identity.

---

## 🚨 Enterprise Prevention — System Rules

### 1. API Response Contract Law
Every Admin List API must return a standardized identity field:
- `id`: MUST be the **PRIMARY_ENTITY_ID** (e.g., Ad ID, User ID).
- Never use child document IDs (reportId, logId, notificationId) as the primary `id`.

### 2. Aggregation Design Law
In MongoDB aggregation pipelines used for admin lists:
- The `$group` stage `_id` MUST correspond to the **PRIMARY ENTITY**.
- Example: `group: { _id: '$adId' }` is correct for an Ad list. `group: { _id: '$reportId' }` is a violation if the UI expects an Ad.

### 3. Admin UI Law
Admin frontend components MUST follow the "List -> Detail" fetch pattern using the primary identity:
- Always resolve the fetch target using the entity ID (e.g., `fetchDetail(item.id)` where `id` is the entity ID).
- Use defensive resolvers (like `resolveAdId`) if data sources vary.

### 4. Router Design Law
All Express routers must be structured predictably to prevent route shadowing:
1.  Static endpoints (`/summary`, `/stats`, `/health`)
2.  Global actions (`/export`, `/search`)
3.  Collection root (`/`)
4.  Parameterized entity endpoints (`/:entityId`, `/:id`) LAST.
