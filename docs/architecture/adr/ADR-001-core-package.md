# ADR-001: Core Package Responsibilities & Transport Neutrality

## Status
Accepted

## Date
2026-07-05

## Context
The `@esparex/core` package contains the backend business logic and database access rules. Previously, HTTP-specific Express routing controllers and middlewares were placed inside `core`, leading to tight coupling with the Express HTTP framework and violating layer boundaries.

## Decision
1. **Core Responsibility**: `@esparex/core` will function strictly as the Domain Layer. It owns Mongoose models/schemas, business logic services, task queues (BullMQ), CRON jobs, background workers, and business-focused orchestrators.
2. **Framework & Transport Neutrality**: `core` must be completely agnostic of the transport layer (Express, HTTP, sockets, etc.). It must not import Express typings, routes, request/response handlers, or any other web-specific dependencies.
3. **Decoupled Controllers**: All HTTP controllers and middlewares will be migrated out of `core` into the API Gateway package (`backend/user`). Any coordinator service retained in `core` must coordinate business workflows without references to HTTP Request or Response objects.

## Consequences
* **Pros**: Portability (domain logic can be loaded by CLI tools, queues, or different HTTP libraries), simplified testing (business logic can be unit-tested without HTTP mock shims), and clear layer boundaries.
* **Cons**: Short-term refactoring effort required to migrate existing controllers and middlewares, and to update import scopes.
