# API Contract SSOT

This is the Tier 1 Canonical Single Source of Truth (SSOT) for all API design standards, request/response validation contracts, and networking protocols on the Esparex platform. All client interfaces, back-office admin portals, and backend endpoints must align strictly to these specifications.

---

## 1. API Namespaces & Routing Standards

To prevent unversioned or colliding routes, all REST endpoints must reside within versioned namespaces:

### 1.1 Public Client API
- Namespace: `/api/v1/*`
- Example: `GET https://api.esparex.in/api/v1/listings`
- Handled by: `backend/user`

### 1.2 Back-Office Admin API
- Namespace: `/api/v1/admin/*`
- Example: `GET https://api.esparex.in/api/v1/admin/listings`
- Handled by: `backend/user` (Gated strictly by Admin Authentication & Wildcard Role Checks)
- Direct root `/api/admin/*` or unversioned routes are deprecated and forbidden.

### 1.3 Contract Shared Types
All DTO interfaces, query params, and payload schemas must be defined under `shared/src/contracts/api/` and shared between `apps/web`, `apps/admin`, and `backend/user` to avoid payload mapping mismatches.

---

## 2. HTTP Method Strictness

All endpoints must respect the idempotent and stateful properties of HTTP methods:

| Method | Behavior | Idempotent? | Expected Usage |
| :--- | :--- | :---: | :--- |
| **`GET`** | Idempotent data retrieval only. Zero side-effects. | Yes | Fetching listings, retrieving user profiles |
| **`POST`** | Creation of new entities or complex state mutations. | No | Creating a listing, submitting OTP, login |
| **`PUT`** | Complete resource replacement. | Yes | Replacing a full listing wizard step configuration |
| **`PATCH`** | Partial resource updates. | No | Deactivating an ad, changing listing status |
| **`DELETE`** | Resource soft-delete flagging or session removal. | Yes | Soft-deleting an ad (`isDeleted: true`), logout |

---

## 3. Data Sanitization & Security Contracts

All inbound mutations must pass through strict sanitation layers before hitting business logic services:

### 3.1 CSRF Protection
- The `CSRF_SECRET` must be set in production to protect all API mutation endpoints (`POST`, `PUT`, `PATCH`, `DELETE`).
- A valid token must be fetched from `GET /api/v1/csrf-token` before committing updates.

### 3.2 Body Sanitization
- API controllers must strip hidden, internal, or non-permitted fields from incoming request bodies.
- Client payloads must never be trusted. Directly mapping user input arrays to DB update queries is strictly forbidden.

### 3.3 Redis Rate Limiting
- Redis is strictly required for rate-limiting (e.g. OTP validation, login brute-forcing). Fallback to in-memory is banned.

---

## 4. Standard Unified Error Envelope

To ensure predictable handling of exceptions in frontend workspaces, all API errors must conform to the following standard JSON payload:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title contains forbidden keywords.",
    "details": [
      {
        "field": "title",
        "message": "Title cannot exceed 100 characters"
      }
    ]
  }
}
```

- `success`: Always `false` in error payloads.
- `error.code`: A standard uppercase string key identifying the error category (e.g. `UNAUTHORIZED`, `RATE_LIMIT_EXCEEDED`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`).
- `error.message`: A readable explanation of the failure.
- `error.details`: (Optional) An array of field-level validation messages.
