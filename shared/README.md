# Shared Directory - Ownership & Governance Rules

This directory contains **shared types, schemas, and utilities** used by both frontend and backend.

## Directory Structure

```
shared/
├── schemas/         # Zod schemas (single source of truth)
├── types/           # TypeScript types
└── README.md        # This file
```

## Ownership Rules

### Schema Ownership

| Schema | Owner | Used By |
|--------|-------|---------|
| `adPayload.schema.ts` | Backend Team | Frontend, Backend |
| `ad.schema.ts` | Frontend Team | Frontend Only |
| `catalog.schema.ts` | Frontend Team | Frontend Only |
| `location.schema.ts` | Backend Team | Frontend, Backend |
| `sparePart.schema.ts` | Frontend Team | Frontend Only |

### Schema Guidelines

1. **Single Source of Truth** - All Zod schemas must exist in `shared/schemas/`
2. **No Duplication** - Backend and frontend must import from `shared/`, not re-define
3. **Schema Evolution** - Changes to shared schemas require review
4. **Type Exports** - Each schema file must export inferred types

### Type Ownership

| Type | Owner | Used By |
|------|-------|---------|
| `User.ts` | Backend Team | Frontend, Backend |

## Usage

### Importing Schemas

```typescript
// Frontend
import { AdPayloadSchema } from '@/shared/schemas/adPayload.schema';
import type { Ad } from '@/shared/schemas/ad.schema';

// Backend
import { AdPayloadSchema } from '../../shared/schemas/adPayload.schema';
```

### Re-exporting for Backward Compatibility

Frontend/backend can re-export from `shared/` to maintain imports:

```typescript
// frontend/src/schemas/ad.schema.ts
export * from '../../../shared/schemas/ad.schema';
```

## CI Guard Enforcement

This directory is validated by `.github/workflows/structure-lock-guard.yml`:

- ✅ `backend/src/scripts/**` must never exist
- ✅ Schemas must only exist in `shared/schemas/`
- ✅ `shared/README.md` must exist with ownership rules
- ✅ Changes require PR review

## Adding New Shared Assets

1. Create schema/type in appropriate subdirectory
2. Update this README with ownership information
3. Add index export to `schemas/index.ts` or `types/index.ts`
4. Update consumers to import from `shared/`
5. Ensure CI passes

## Contact

- **Backend Issues**: Backend Team
- **Frontend Issues**: Frontend Team
- **Shared Schema Issues**: Architecture Guild
