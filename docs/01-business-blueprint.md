# Master SSOT: Esparex Complete Developer Blueprint

Status: Active  
Effective Date: 2026-05-14  
Owner: Product Management  
**Governance Layer:** Layer 1 (Business Truth) - Overrides all other layers in case of conflict.

## 1. Core Platform Purpose
Esparex is a premier marketplace for buying and selling spare parts. The primary business objective is to connect verified sellers with buyers through a robust, geolocation-aware search engine.

## 2. Business Domains & Lifecycles
### 2.1 User Identity
- **Roles:** Super Admin, Admin, Moderator, User.
- **Authentication:** Strict resilient sessions (requires 401/403 for logout, ignoring transient network failures).
- **Authorization:** Granular permissions mapping with wildcard `*` support for super admins.

### 2.2 Ad Lifecycle
- **Status Flow:** Draft -> Pending Approval -> Active -> Sold -> Expired.
- **Moderation:** All listings must pass automated AI screening (Gemini/OpenAI) and manual admin reviews before going live.

### 2.3 Location Services
- **Single Prompt Rule:** Users must only ever see exactly one location permission prompt per viewport (Global/Desktop via `UserHeader`, Mobile via `MobileHeader`).
- **Geo-Search:** All proximity searches enforce strict GeoJSON standards (`2dsphere` indexed).

## 3. Strict Business Rules (Do Not Violate)
1. **Audit First:** No code changes without prior business approval and technical audit.
2. **Root Cause Only:** Fix exact sources of errors, never patch downstream consumers.
3. **One Source of Truth:** Business logic exists only in this blueprint. Do not duplicate rules in API schemas or UI layers.
4. **No Duplicate Logic:** Do not invent parallel APIs, schemas, or components when a canonical owner exists.
