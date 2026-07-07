# Esparex Governance

## Single Source of Truth (SSOT)
Our repository operates on an SSOT model. CI/CD pipelines defer to local `npm` scripts as the authoritative source. Duplicate governance tools are strictly forbidden.

## Branch Strategy
- `main`: Production-ready. Only deployed via the Release flow.
- `develop`: Integration branch.
- `staging`: Pre-production validation.

## CI Gates
Every PR must pass `ci.yml` (Linting, Testing, Building, and Governance checks).

## Rollback Process
In the event of a failed deployment, hotfixes are applied via standard PR flows, or `git revert` is performed on `main` and cherry-picked to `develop`.
