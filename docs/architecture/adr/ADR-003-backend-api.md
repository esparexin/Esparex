# ADR-003: Backend API Gateway Architecture & Workspace Scope

## Status
Accepted

## Date
2026-07-05

## Context
The repository gateway is currently housed in the `backend/user` folder. Despite its name, this workspace contains all REST and routing configurations for both customer-facing applications and back-office administrative portals.

## Decision
1. **Gateway Responsibility**: The API package serves as the ingress/routing gateway for HTTP and Socket.io endpoints. It owns route registrations, controllers, HTTP serialization/deserialization, and middleware gates.
2. **Business Rules Delegation**: The API package must not contain business logic. It translates HTTP payloads into types, runs input validation (using Zod schemas from `shared`), and delegates all processing to services inside `core`.
3. **Renaming & Consolidation**: Renaming `backend/user` to `backend/api` is deferred to Stage 4 (Repository Improvements) to prevent import noise during cleanup. We will keep a single unified server gateway rather than splitting it prematurely.

## Consequences
* **Pros**: Clean routing structure, explicit gateway namespace separation, and isolated HTTP lifecycles.
* **Cons**: Renaming folder paths in Stage 4 will require refactoring Vercel/Render build commands and npm workspace root scripts.
