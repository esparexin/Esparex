# 05_API_CONTRACTS — Backend Interface Standards

## 🌐 REST API Principles
- **Plural Resources**: Use plural nouns (e.g., `/api/ads`, `/api/users`).
- **Standard Methods**: 
    - `GET`: Retrieve resource(s).
    - `POST`: Create resource.
    - `PUT`/`PATCH`: Update resource.
    - `DELETE`: Soft-delete resource.

---

## 📦 Request & Response Shapes
Response bodies must follow a unified structure to simplify frontend parsing:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": { "total": 100, "page": 1 }
}
```

---

## 🚦 HTTP Status Codes
- `200 OK`: Success.
- `201 Created`: Successful creation.
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Authentication required.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: Server-side failure (logs generated).

---

## 🔄 Versioning & Stability
- **Header Versioning**: Requests should specify the target API version via headers or URL prefix (e.g., `/api/v1/...`).
- **Backward Compatibility**: Non-breaking changes (new fields) are allowed. Breaking changes (removing fields, changing types) require a new version.
