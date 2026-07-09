# Esparex Environment & Deployment SSOT

```text
Document Version: 1.0.0
Status: Approved
Owner: Platform Engineering
Review Cycle: Quarterly
Last Reviewed: 2026-07-09
Supersedes: None
```

Welcome to the Esparex Environment & Deployment Single Source of Truth (SSOT). This documentation set is the canonical reference for developers, DevOps, Release Engineering, and CI/CD systems.

## Documentation Index

1. **[Core Environment SSOT](./ENVIRONMENT_SSOT.md)** - The primary rules, architecture, and deployment targets.
2. **[Variable Matrix](./ENVIRONMENT_VARIABLE_MATRIX.md)** - The definitive ownership, lifecycle, and build/runtime classification for every variable.
3. **[Platform Matrix](./ENVIRONMENT_PLATFORM_MATRIX.md)** - Deployment matrix mapping variables across Local, GitHub Actions, Vercel, and Render.
4. **[Loading Flow](./ENVIRONMENT_LOADING_FLOW.md)** - Execution sequences and load order diagrams for Next.js and Express.
5. **[Validation Rules](./ENVIRONMENT_VALIDATION.md)** - Documentation of validation layers (Zod, Runtime assertions).
6. **[Bootstrap Guide](./ENVIRONMENT_BOOTSTRAP.md)** - Exact onboarding procedures for fresh repository checkouts.
7. **[Deployment Checklists](./ENVIRONMENT_DEPLOYMENT.md)** - Vercel and Render release and configuration checklists.
8. **[Security Posture](./ENVIRONMENT_SECURITY.md)** - Naming conventions, secret isolation, and Git hygiene.
9. **[Risk Register](./ENVIRONMENT_RISK_REGISTER.md)** - Classified tracking of accepted tech debt and architectural risks.

## Fixed Deployment Architecture

- **User Web** → Vercel
- **Admin Web** → Vercel
- **Backend API** → Render

*Core and Shared packages are consumed by the host applications and do not own distinct deployment environments.*
