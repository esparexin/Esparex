# ADR-004: Monorepo Boundary Enforcement & Package Public APIs

## Status
Accepted

## Date
2026-07-05

## Context
In a large monorepo, developers can easily bypass boundaries by importing deep internals of sibling packages, e.g., `@esparex/core/src/services/payment/PaymentService`. This makes refactoring core classes highly risky and leads to dependency loops.

## Decision
1. **Immutable Dependency Flow**: Dependencies flow only downward: `Apps` ➔ `Backend API` ➔ `Core` ➔ `Shared`. Sideways and upward imports are strictly forbidden.
2. **Public API Entry Points**: Sibling packages must only import from the public index barrel `src/index.ts` of each package (configured via `package.json` exports). Deep imports into a package's internal directories are strictly blocked.
3. **Automated CI Validation**: In Stage 5 (Governance), we will integrate tools (such as `dependency-cruiser` or ESLint boundary rules) into the CI pipeline. Any commit violating import directions or deep import rules will fail the build automatically.

## Consequences
* **Pros**: Private internals remain encapsulated, refactoring within a package is safe as long as the public API contract is preserved, and boundaries are enforced automatically by machines instead of humans.
* **Cons**: Developers must remember to export public API components from `src/index.ts`.
