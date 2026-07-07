# 04. Environment Issues

```text
ID: RSS-ENV-001
Category: Environment
Severity: Critical
Evidence: Derived from RIS Phase 6 (Environment Intelligence)
Problem: Environment variable naming conventions are inconsistent between frontend and backend. Missing schema validation for environment variables at runtime.
Impact: Frontend builds can fail or deploy with missing critical API keys, breaking client-side fetches. Backend services might boot without required secrets.
Risk: Production
Root Cause: Lack of centralized environment variable validation schema (e.g., using T3 Env or Zod Env).
Affected Modules: apps/web, apps/admin, backend/user
Dependencies: None
Prerequisites: None
Estimated Effort: S
Verification Steps: Introduce env schema validation. Run `npm run build` across frontends and `npm run start` on backend to verify successful compile/boot without missing ENV warnings.
Status: Open
```
