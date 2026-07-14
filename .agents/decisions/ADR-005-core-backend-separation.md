# ADR-005: Core / Backend-API Package Separation

**Date:** 2026-07-13
**Status:** Accepted

## Context

Prior to April 2026, the repository had a monolithic `backend/` directory containing routes, controllers, middleware, and domain services together. As the codebase grew, the conflation of HTTP-delivery concerns with business-logic concerns made the service layer difficult to test, reason about, and enforce rules on.

## Decision

We extracted a dedicated `@esparex/core` package at commit `7c8d9354` ("Final Architecture: Core + Admin Split + DB Split + PM2 Runtime"). This package contains:

- **Mongoose models** — database schema definitions
- **Domain services** — business logic (auth, catalog, payments, notifications, AI, etc.)
- **Background infrastructure** — BullMQ queues, workers, scheduled jobs
- **Infrastructure config** — DB connection, Redis, Socket.IO, Sentry, env loader

The `@esparex/backend-api` package retains only:

- **Express routes and middleware** — HTTP delivery
- **Controllers** — thin request/response handlers that delegate to core services
- **Request validators** — input validation at the HTTP boundary

This separation follows the **Clean Architecture** principle: the domain layer (`core`) has no knowledge of the delivery mechanism (`backend-api`). `core` has no dependency on Express, no HTTP request or response types, and no middleware. All controller logic was deliberately migrated back out of `core` at commit `14287a20`.

## Physical Placement

`@esparex/core` is located at `core/` (repository root) rather than `backend/core/`. This placement reflects that `core` is designed as a **compilation-unit package** with its own `dist/` output and a formal npm-style exports map (`./config/*`, `./models/*`, `./services/*`, etc.). The physical location has no correctness impact — the dependency direction and boundary rules are enforced by `dependency-cruiser`.

If the repository adds a second backend service in the future (e.g., a background worker process as a separate deployment), `core/` is available as a shared domain layer without requiring a structural move. This future-proofing is a secondary reason for keeping it at the root rather than nested under `backend/`.

## Consequences

- **Positive:** Domain logic is testable independently of HTTP. The `guard:dependencies` check enforces `core → api` direction at CI. `guard:circular` ensures no circular imports.
- **Positive:** A future second backend service (e.g., a dedicated worker process) can import `@esparex/core` without structural change.
- **Negative:** Developers must understand the two-package backend model on onboarding. This ADR exists to document that understanding.
- **Negative:** The build pipeline requires two sequential build steps (`shared → core → backend-api`) instead of one.

## Boundary Enforcement

The following automated rules enforce this decision:

| Rule | Tool | Enforces |
|---|---|---|
| `no-upstream-core-to-api` | dependency-cruiser | `core` cannot import from `backend-api` or `apps/*` |
| `no-direct-model-imports-in-controllers` | dependency-cruiser | Controllers cannot bypass services to import models directly |
| `no-frontend-imports-from-core` | dependency-cruiser | Frontend apps cannot import `@esparex/core` |
| `no-shared-imports-from-core` | dependency-cruiser | `@esparex/shared` cannot import `@esparex/core` |
