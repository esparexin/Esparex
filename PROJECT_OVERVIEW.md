---
# Esparex — Project Overview
Generated: March 15, 2026

## What Esparex is
Esparex is a marketplace platform for automotive spare parts and services, built for high-trust transactions in India. It supports three listing types (devices, spare parts, services) and enforces strict identity verification, moderation, and lifecycle governance. The stack is Node.js + Express + MongoDB + Next.js, with a shared codebase for types, schemas, and contracts.


## Folder structure
backend/
  src/models/           Mongoose schemas for all collections
  src/routes/           Express route definitions
  src/controllers/      Request handlers per domain
  src/services/         Business logic layer
  src/middleware/       Auth, validation, rate limiting
  src/jobs/             Cron jobs (auto-expiry etc)
  src/utils/            Pure utility functions
  src/scripts/          One-off repair/backfill scripts
  migrations/           Database migration files
  coverage/             Test coverage reports
  docs/                 Documentation files
  logs/                 Log files

frontend/
  src/app/              Next.js App Router pages
  src/components/       React UI components
  src/hooks/            Custom React hooks
  src/api/              API call functions
  src/context/          React context providers
  src/types/            TypeScript type definitions
  src/schemas/          Zod schemas (frontend only)
  src/queries/          Data queries (frontend only)
  src/state-machines/   State machine logic (frontend only)
  __tests__/            Test files
  docs/                 Documentation files
  public/               Static assets
  reports/              Test and audit reports

admin-frontend/
  src/app/              Admin-only Next.js pages
  src/components/       Admin UI components
  src/lib/              Admin utilities
  docs/                 Documentation files

shared/
  types/                TypeScript types used by all layers
  schemas/              Zod schemas shared across layers
  enums/                Shared enumerations
  utils/                Shared utility functions
  contracts/            API route contracts

archive/                Deprecated files (deleted)
plans/                  Platform planning docs
logs/                   Log files
docs/                   Documentation files

## Naming convention
Single rule: camelCase for all field names everywhere.

| Field concept   | Name to use   | Never use     |
|----------------|---------------|---------------|
| User ID        | userId        | user_id       |
| Brand ID       | brandId       | brand_id      |
| Model ID       | modelId       | model_id      |
| Category ID    | categoryId    | category_id   |
| Listing type   | listingType   | listing_type  |
| Spare part ID  | sparePartId   | spare_part_id |
| Screen size ID | screenSizeId  | screen_size_id|
| Created date   | createdAt     | created_at    |
| Is active      | isActive      | is_active     |

File naming:
- Components: PascalCase (UserModal.tsx)
- Hooks: camelCase (useFormConfig.ts)
- Services: PascalCase (CatalogService.ts)
- Utils: camelCase (formatPrice.ts)
- API routes: kebab-case (/spare-parts)


## Architecture decisions
- Polymorphic listings collection (one collection, 3 types)
- form-config endpoint drives all listing forms dynamically
- Master collections: categories, brands, models, spare_parts, screen_sizes, services
- Shared/ folder used by both frontend and backend via @shared/ path alias
- Taxonomy migration: categoryId is now singular everywhere (categoryIds array removed)
- PostAdWizard context fix is in progress


## Documentation files audit
| File | Status | Outdated sections | What needs updating |
|------|--------|------------------|---------------------|
| README.md | Accurate | None | - |
| backend/README.md | Accurate | None | - |
| frontend/README.md | Accurate | None | - |
| admin-frontend/README.md | Accurate | None | - |
| shared/README.md | Accurate | None | - |
| SYSTEM_CONSTITUTION.md | Accurate | None | - |
| docs/00_README_ARCHITECTURE.md | Accurate | None | - |
| docs/01_PLATFORM_BLUEPRINT.md | Accurate | None | - |
| docs/02_ENGINEERING_GOVERNANCE.md | Accurate | None | - |
| docs/03_ENUM_GOVERNANCE_ROLLOUT.md | Accurate | None | - |
| docs/04_ADMIN_SYSTEM_ARCHITECTURE.md | Accurate | None | - |
| docs/05_API_CONTRACTS.md | Accurate | None | - |
| docs/06_DATA_LIFECYCLE_RULES.md | Accurate | None | - |
| docs/07_FRONTEND_SYSTEM_RULES.md | Accurate | None | - |

## Cleanup Status
### Completed
- @shared/ alias fixes (done)
- Dead files deleted (done)
- archive/ deleted (done)
- 7 profile hooks moved (done)
- useAdminAdsQuery duplicate removed (done)
- Build errors resolved (done)
- Brand taxonomy migration (categoryId singular everywhere)

### In Progress
- PostAdWizard context fix
- Brand taxonomy validation fix

## Known Issues
- PostAdWizard context fix needed (context not fully harmonized)
- Brand categoryId taxonomy fix needed (validation logic not fully migrated)

## Folder Structure (Updated)
- Includes frontend/src/schemas/, frontend/src/queries/, frontend/src/state-machines/
- All folders listed reflect actual workspace

## Architecture Decisions (Updated)
- Taxonomy migration (categoryId singular) noted
- PostAdWizard context fix noted

---
Start of session reminder
Paste this at the top of every new AI conversation:
"Working on Esparex marketplace.
Root: /Users/admin/Desktop/EsparexAdmin.
Convention: camelCase everywhere for all field names.
Check if component/hook/service already exists before creating. Edit existing files, never create _v2 versions."
---

## Start of session reminder
Paste this at the top of every new AI conversation:
"Working on Esparex marketplace.
Root: /Users/admin/Desktop/EsparexAdmin.
Convention: camelCase everywhere for all field names.
Check if component/hook/service already exists before creating. Edit existing files, never create _v2 versions."
---
