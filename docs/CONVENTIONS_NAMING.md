# Esparex Platform — Naming Conventions

## 1. Field Naming
- Use camelCase for all new fields: `userId`, `listingType`, `brandId`, `categoryId`.
- Snake_case (`user_id`, `listing_type`, etc.) allowed only for legacy compatibility.
- Consistency enforced in models, API, and frontend.

## 2. Component Naming
- Component filenames must be PascalCase.
- Exported default should match filename.
- Avoid lowercase filenames for components.

## 3. Directory Naming
- Use singular for model/service/controller directories.
- Use plural for collections (e.g., `services/`, `controllers/`).

## 4. Import Paths
- Use path aliases (`@shared/`) for shared code.
- No deep relative imports.

---
_Last updated: March 15, 2026_