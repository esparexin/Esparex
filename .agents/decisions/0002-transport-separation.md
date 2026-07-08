# Central Decision Record: 0002-transport-separation

* **Status**: Approved
* **Date**: 2026-07-07
* **Author**: Antigravity Technical Architect
* **Target Version**: v1.0

## Context & Problem
Direct mutations of models and schema files inside `backend/user/` controllers were bypassing transaction gates and violating layered architecture patterns.

## Decision
Implemented strict architectural separation constraints:
1. `backend/user` API controllers must act as thin routing wrappers.
2. Direct Mongoose mutations are banned in the gateway. All database writes must delegate to service interfaces inside `core/`.
3. ESLint rules (`eslint-plugin-boundaries`) enforce this import constraint.

## Consequences
* Enhanced codebase modularity.
* Prevents raw DB mutations from leaking into routing layers.
