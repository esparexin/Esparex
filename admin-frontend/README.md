# admin-frontend

Isolated admin web app for `admin.esparex.com`.

## Scope Rules

- Uses only admin APIs under `/api/v1/admin/*`.
- Own auth context (`AdminAuthContext`).
- Own login page (`/login`).
- Own route guard (`AdminRouteGuard`).
- No imports from `frontend/src/components`, `frontend/src/context`, or user route guards.

## Local Run

```bash
npm --workspace admin-frontend run dev
```

Env:

- `NEXT_PUBLIC_ADMIN_API_URL` (default: `http://localhost:5000/api/v1/admin`)
