# Database Persistence Stack Conventions

This reference defines database models, persistence, and queries constraints.

---

## 1. Mongoose & MongoDB Drivers
- **Primary Driver**: **Mongoose** (`mongoose`) for modeling.
- **Rules**:
  - All Mongoose schema models must be defined inside `core/src/models/`.
  - Direct database queries (e.g. `Ad.find()`, `Ad.updateOne()`) are prohibited in the route handlers (`backend/api/src/controllers/`) and frontend views. All database queries must be wrapped in Core services (`core/src/services/`).
  - Validation: Use Zod schemas in `core/src/validators/` to validate model inputs before querying.

---

## 2. Query Guidelines
- **Soft Deletes**: Hard deletes on listing models (Ads, Services, Spare Parts) are prohibited. All listing deletion queries must use a soft delete flag (`deletedAt` timestamp).
- **ObjectID Parity**: Always validate database ObjectId route parameters before query execution using the `objectIdSchema` validator in the route validation middlewares.
- **Indexes**: All custom field indexes must be defined in schema declarations and applied via `migrate-mongo` migrations.
