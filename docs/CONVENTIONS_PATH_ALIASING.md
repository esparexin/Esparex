# Esparex Platform — Path Aliasing Conventions

## 1. Shared Code
- All shared code must be imported using `@shared/` alias.
- Path alias must be defined in `tsconfig.json` for backend, frontend, and admin-frontend.

## 2. Import Rules
- No deep relative imports (../../../../).
- Refactor imports to use path aliases.

## 3. Directory Structure
- `shared/` contains cross-app utilities, types, and constants.
- Backend, frontend, and admin-frontend must reference shared code via alias.

## 4. Enforcement
- Lint rules and code reviews must check for alias usage.
- Violations should be documented and fixed promptly.

---
_Last updated: March 15, 2026_