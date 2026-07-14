# Backend API Stack Conventions

This reference defines the coding conventions, route setups, and middleware architecture for backend services.

---

## 1. REST Routing & Express Architecture
- **Framework**: Express (v5.x).
- **Format**: JSON-in / JSON-out.
- **Pattern**: Thin Controllers. Route controllers must only:
  1. Extract route parameters (`req.params`, `req.query`, `req.body`).
  2. Invoke validator schemas (e.g. `validateRequest(Schema)` middleware).
  3. Call domain services in `core/` to process logic.
  4. Construct the standard envelope response (`res.status(code).json({ success: true, data })`).

---

## 2. API Response Formatting

All API endpoints must return a standardized envelope structure.

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error explanation",
    "details": []
  }
}
```

---

## 3. Database Migration Management
- **Tool**: `migrate-mongo` for schema index creations and database schema migrations.
- **Migrations Boundary**: Every migration must be backward-compatible (using expand-and-contract model changes) to support zero-downtime deployment pipelines.
