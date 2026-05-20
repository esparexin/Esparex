# Esparex Developer Rules & Engineering Standards

Status: Active  
Effective Date: 2026-05-14  
Owner: Engineering Lead  
**Governance Layer:** Layer 3 (Implementation Truth) - Dictates how code is written, subordinate to Layers 1 and 2.

## 1. Type Safety & Typescript Rules
1. **No `any` Types:** Do not introduce TypeScript `any`. Preserve existing strict typing and generate accurate interfaces for all data boundaries.
2. **Strict Null Checks:** Enable and abide by strict null checks. Avoid the non-null assertion operator (`!`) unless logically guaranteed.

## 2. General Code Quality
1. **No Blind Fixes:** Do not make speculative changes. Audit first, prove the root cause, and apply the minimal change required.
2. **Update In Place:** Always edit canonical files. Never create a "v2", "_final", or "_copy" of an existing function or file.
3. **No Duplicate Logic:** Reuse existing components, hooks, utilities, and services. If an existing entity needs modification, extend it safely rather than duplicating it.

## 3. Naming Conventions
1. **Casing Rules:** Use `camelCase` for variables and functions. Use `PascalCase` for components and classes.
2. **Boolean Variables:** All boolean fields and variables must start with a prefix indicating true/false nature, e.g., `is`, `has`, `can` (e.g., `isActive`, `hasAccess`).
3. **Singular/Plural Consistency:** Model names and database schemas must be strictly **Singular** (e.g., `User`, `Location`). REST API resources and route collections must be strictly **Plural** (e.g., `/users`, `/locations`).

## 4. Backend & Core Standards
1. **Clean Architecture Enforcement:** Business logic lives exclusively in `@esparex/core`. Do not leak business rules into the `@esparex/backend-user` API controllers.
2. **No Unused Imports:** Keep files clean. Lint checks will block PRs with unused imports.

## 5. UI/UX Protection (Frontend)
*(Note: See `06-frontend-admin-standards.md` for extended frontend rules)*
1. **Preserve Layout:** Do not alter layout, styling, spacing, responsiveness, or user flows unless explicitly required by a ticket.
2. **Component Purity:** Keep React components free of direct API calls. Use hooks or dedicated API library methods.
