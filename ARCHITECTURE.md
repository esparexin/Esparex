# High-Level Architecture

## Monorepo Structure
- `apps/web`: Next.js Frontend
- `apps/admin`: Admin Portal
- `backend/user`: API Backend
- `core/`: Core business logic and shared services
- `shared/`: Common utility functions, API contracts, and types

## Package Ownership
See `.github/CODEOWNERS` for package ownership.

## Dependency Rules
Cross-package boundaries are strictly guarded by `eslint-plugin-boundaries` and `dependency-cruiser`. No cyclic dependencies are permitted.

## Deployment Architecture
Monolithic deployment via custom gating scripts. Backend scales horizontally behind a load balancer, with Redis for state/cache management and MongoDB for persistence.
