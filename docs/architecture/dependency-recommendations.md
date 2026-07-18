# Dependency Recommendations

After reviewing the current `.dependency-cruiser.js`, the existing rules are robust.

## Observations
- The existing rules cover domain-independence, port purity, and cross-domain boundary enforcement.
- No immediate new rules are required.

## Recommendations
1. **Public API Enforcement**: Once the first domain is migrated, introduce a rule to enforce that only `index.ts` (the public barrel file) can be imported from domain packages.
2. **Layering**: Ensure that domain packages (in `packages/`) maintain the strict layered dependency order (Domain -> Application -> Ports -> Adapters).
3. **Template Sync**: Ensure the template structure is reflected in the automated validation rules for new packages.
