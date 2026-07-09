# Environment Governance Policy

To prevent configuration drift, silent failures, and documentation rot, the following governance policy applies universally across the Esparex monorepo.

## 1. Approval Matrix

Any Pull Request that introduces, modifies, or deprecates an environment variable MUST pass this checklist before it can be merged:

1. **One Owner:** The variable must be claimed by exactly one package (`apps/web`, `apps/admin`, or `core`).
2. **Template Inclusion:** The variable MUST be added to the respective `.example` template (`.env.local.example`, `.env.production.example`).
3. **SSOT Registration:** The variable MUST be documented in `ENVIRONMENT_VARIABLE_MATRIX.md`.
4. **Validation Guard:** The variable MUST be added to the appropriate validation layer (`core/src/config/env.ts` or Next.js assertions).
5. **Platform Mapping:** The variable MUST be mapped to its target environments in `ENVIRONMENT_PLATFORM_MATRIX.md`.
6. **Platform UI Sync:** If required, the DevOps/Release Engineer must configure the variable in the GitHub Actions, Vercel, or Render dashboards *prior* to merge.

**Any Pull Request containing undocumented or unvalidated environment variables will be automatically rejected.**

## 2. Environment Variable Change Process

When modifying the environment contract, the following mandatory change workflow must be executed:

1. Add variable to the correct `.env.example`
2. Add validation (`env.ts` or Next.js assertions)
3. Update `ENVIRONMENT_VARIABLE_MATRIX.md`
4. Update `ENVIRONMENT_PLATFORM_MATRIX.md`
5. Configure GitHub Actions (if applicable)
6. Configure Vercel/Render (if applicable)
7. Verify local bootstrap
8. Verify CI
9. Verify deployment
10. Merge PR
