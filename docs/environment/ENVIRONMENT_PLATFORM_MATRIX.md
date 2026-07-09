# Environment Platform Deployment Matrix

This matrix establishes the expected presence of environment variables across local development, GitHub CI, Vercel, and Render deployments.

## Platform Matrix

| Variable | Local | GitHub Actions | User Vercel | Admin Vercel | Render | Required | Secret | Public |
|---|---|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✔ | ✔ (Dummy) | ✔ | ✘ | ✘ | Yes | No | Yes |
| `NEXT_PUBLIC_APP_URL` | ✔ | ✘ | ✔ | ✘ | ✘ | Yes | No | Yes |
| `NEXT_PUBLIC_APP_ENV` | ✔ | ✔ (`local`) | ✔ | ✔ | ✘ | Yes | No | Yes |
| `NEXT_PUBLIC_FIREBASE_*` | ✔ | ✔ (Dummy) | ✔ | ✘ | ✘ | Yes | No | Yes |
| `NEXT_PUBLIC_ADMIN_API_URL` | ✔ | ✘ | ✘ | ✔ | ✘ | Yes | No | Yes |
| `SKIP_ENV_VALIDATION` | ✘ | ✔ (`true`) | ✘ | ✘ | ✘ | CI Only | No | No |
| `NODE_ENV` | ✔ | ✔ | ✘ | ✘ | ✔ | Yes | No | No |
| `PORT` | ✔ | ✘ | ✘ | ✘ | ✔ | Yes | No | No |
| `MONGODB_URI` | ✔ | ✔ (Mock) | ✘ | ✘ | ✔ | Yes | Yes | No |
| `JWT_SECRET` | ✔ | ✔ (Mock) | ✘ | ✘ | ✔ | Yes | Yes | No |
| `HMAC_SECRET` | ✔ | ✘ | ✘ | ✘ | ✔ | Yes | Yes | No |
| `S3_BUCKET_NAME` | ✘ | ✘ | ✘ | ✘ | ✔ (Prod) | Prod Only| No | No |

## Analysis of Drift

1. **GitHub Actions Mocking:** GitHub Actions intentionally lacks production secrets (e.g., `JWT_SECRET`, real `API_URL`). Tests rely on `jest.mock` environments, and builds use `SKIP_ENV_VALIDATION` to bypass Next.js requirements.
2. **Platform Segregation:** Vercel only ever receives `NEXT_PUBLIC_` edge variables. Render only ever receives server secrets. This guarantees isolated failure domains.
