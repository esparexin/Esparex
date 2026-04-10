# admin-frontend

Isolated admin web app for `admin.esparex.in`.

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

- `NEXT_PUBLIC_ADMIN_API_URL` (default local: `http://localhost:5001/api/v1/admin`)
- `NEXT_PUBLIC_APP_ENV` (`local` for local dev, `production` for deployment)
- Production baseline: `https://api.exparex.in/api/v1/admin`
- Copy `admin-frontend/.env.local.example` to `.env.local` for local development
