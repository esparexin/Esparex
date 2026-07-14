# Database Integration Checklist

Verify each requirement is satisfied before requesting code review:

- [ ] **Mongoose Location**: All schemas and models are defined in `core/src/models/`.
- [ ] **No Destructive Queries**: Database updates and deletes on listings models use soft deletes (setting `deletedAt`).
- [ ] **Migrations Boundaries**: Dynamic schema modifications and index additions are written as `migrate-mongo` migrations.
- [ ] **ObjectID Parsing**: ObjectId route arguments are validated before query execution.
