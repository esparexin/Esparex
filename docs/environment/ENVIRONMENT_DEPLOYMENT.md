# Deployment & Release Checklists

This documentation provides the exact checklists required for deployment procedures.

## 1. Local Verification Checklist
- `[ ]` Ensure `.env`, `apps/web/.env.local`, and `apps/admin/.env.local` exist.
- `[ ]` Verify `npm run build` succeeds monorepo-wide.
- `[ ]` Verify `npm test` succeeds with local Redis/Mongo mocks.

## 2. GitHub Actions CI Checklist
- `[ ]` Ensure GitHub Secrets do not contain local development keys.
- `[ ]` Verify `SKIP_ENV_VALIDATION=true` is injected to bypass build errors.
- `[ ]` Ensure the `governance:all` step completes successfully.

## 3. User Web (Vercel) Checklist
1. **Required Variables:** Open `apps/web/.env.production.example`.
2. **Dashboard Configuration:** Paste all keys into the Vercel **Settings > Environment Variables** tab.
3. **Verify:** Check that `NEXT_PUBLIC_API_URL` points to the *production* Render backend.
4. **Deploy:** Trigger a Vercel Preview Build.
5. **Verify Firebase:** Ensure `NEXT_PUBLIC_FIREBASE_*` keys are accurately mapped to the production Firebase instance.

## 4. Admin Web (Vercel) Checklist
1. **Required Variables:** Open `apps/admin/.env.production.example`.
2. **Dashboard Configuration:** Paste all keys into the Vercel **Settings > Environment Variables** tab.
3. **Verify:** Check that `NEXT_PUBLIC_ADMIN_API_URL` points to the *production* Render Admin API.
4. **Deploy:** Trigger a Vercel Preview Build.

## 5. Backend API (Render) Checklist
1. **Required Variables:** Open `backend/api/.env.production.example`.
2. **Dashboard Configuration:** Map every key into the Render Environment tab.
3. **CRITICAL:** Generate a highly secure (64+ character) `JWT_SECRET`. If the key contains "change_me", the backend boot validation will crash the container.
4. **Verify Systems:** Ensure `MONGODB_URI` and `REDIS_URL` point to managed production instances (e.g., MongoDB Atlas, Upstash).
5. **Health Check:** Monitor the Startup Validation sequence via Render logs to ensure Zod passes the environment cleanly.
