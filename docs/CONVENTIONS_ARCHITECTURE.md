# Esparex Platform — Architectural Conventions

## 1. Path Aliasing
- Use `@shared/` for all shared code imports.
- Avoid deep relative imports (../../../../). Refactor to use aliases.
- Path aliases must be defined in `tsconfig.json` for backend, frontend, and admin-frontend.

## 2. Import Hygiene
- No direct `fetch()` calls in React components. Use API/services/hooks.
- SSR exceptions must be documented in code and README.
- Remove unused imports and dead code regularly.

## 3. Naming Conventions
- Use camelCase for field names: `userId`, `listingType`, `brandId`, `categoryId`.
- Avoid snake_case except for legacy compatibility.
- Component filenames should be PascalCase and match exported default.

## 4. Dead Code & Comments
- Delete files with zero active imports.
- Remove obsolete TODO/FIXME/HACK comments.
- Retain migration and deprecated comments for historical clarity.

## 5. Directory Structure
- `backend/` for API, models, services.
- `frontend/` for user-facing app.
- `admin-frontend/` for admin dashboard.
- `shared/` for cross-app utilities and types.

## 6. API Layer
- All API calls must go through designated API/service layer.
- No business logic in controllers or components.

## 7. Governance
- Document exceptions and migration plans in `docs/`.
- Use `SYSTEM_CONSTITUTION.md` for platform-wide rules.

---
_Last updated: March 15, 2026_