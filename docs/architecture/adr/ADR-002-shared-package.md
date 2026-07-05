# ADR-002: Shared Package Responsibilities & Agnostic Code Execution

## Status
Accepted

## Date
2026-07-05

## Context
The `@esparex/shared` package serves as the Single Source of Truth (SSOT) for data types and schemas across frontend and backend workspaces. However, React client-side hooks (such as `usePopupQueue.ts`) were committed and exported from it, introducing React framework dependencies into Node.js backend environments.

## Decision
1. **Shared Responsibility**: `@esparex/shared` is reserved for environment-agnostic utilities, data transfer objects (DTOs), type contracts, Zod validator schemas, constants, and pure formatting utilities.
2. **Framework Decoupling**: `shared` must never import from frontend framework libraries (React, Next.js) or backend gateways (Express, Socket.io). It must contain only standard, portable JavaScript/TypeScript.
3. **Relocation of Hook**: The React-dependent hook (`usePopupQueue.ts`) will be moved out of `@esparex/shared` and placed inside a single React-only shared workspace (e.g. `packages/shared-react/` or `apps/shared-ui/`). If only one application consumes it, it will reside locally in that application's hooks.

## Consequences
* **Pros**: Node.js backends will compile and load `@esparex/shared` with zero risk of React dependency warning spikes or crash points.
* **Cons**: Frontend applications will need to update import paths for the relocated hook once it is moved out of the primary shared barrel index.
