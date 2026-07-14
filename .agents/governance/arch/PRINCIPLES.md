# Architecture Principles

**Module**: 1 of 6 — Architecture Governance Framework
**Version**: 1.0
**Status**: Stable
**Last Updated**: 2026-07-13
**Change Cadence**: Rare — principles are revised only when the fundamental nature of the system changes (e.g., microservices adoption, multi-team split, platform pivot)

---

## Purpose

Principles are **immutable design philosophy**. They describe the shape of the architecture in terms that remain true regardless of which packages exist, which frameworks are in use, or how the team is structured.

Principles do not reference specific packages, file paths, or tool names. Those belong in Standards.

When a Standard conflicts with a Principle, the Principle takes precedence. The Standard must be revised.

---

## P1 — Dependencies Flow Inward

> Higher-level layers depend on lower-level layers. Lower-level layers never depend on higher-level layers.

**Applied to Esparex**:

```
apps (presentation)
    ↓ depends on
shared (contracts)
    ↓ depends on
core (domain)
    ↓ depends on
shared (contracts)
    ↑ never depends on
backend-api (delivery)
    ↑ never depends on
apps (presentation)
```

**What this prevents**: Business logic leaking into the UI. UI frameworks appearing in the domain layer. HTTP request types appearing in domain services.

---

## P2 — Domain Must Not Depend on Delivery

> The domain layer (business logic, models, services) must have zero knowledge of the delivery mechanism (HTTP, WebSockets, GraphQL, CLI).

**Applied to Esparex**: `@esparex/core` must not import from Express, define HTTP request/response types, or reference route paths. Controllers are delivery concerns and belong in `@esparex/backend-api`.

**What this enables**: Domain services are testable without starting an HTTP server. The delivery mechanism can change (Express → Fastify, REST → GraphQL) without touching domain logic.

---

## P3 — UI Must Not Depend on Backend Infrastructure

> Frontend applications must not import server-side infrastructure. Backend infrastructure (databases, queues, server runtimes) must not appear in browser-executed code.

**Applied to Esparex**: `apps/web` and `apps/admin` must not import from `@esparex/core`. Mongoose models, Redis clients, BullMQ queues, and Node.js-only APIs must never reach the browser bundle.

**What this enables**: Frontend apps can be deployed to CDNs and edge runtimes. Backend infrastructure can change without requiring frontend rebuilds.

---

## P4 — Shared Packages Remain Platform-Neutral

> Code in a shared package must be executable in every environment that consumes it — browser, Node.js, edge runtime — without modification or polyfilling.

**Applied to Esparex**: `@esparex/shared` must not contain React hooks, Node.js `fs`/`process` APIs, Mongoose, or any runtime-specific code. It may contain pure TypeScript, Zod schemas, and utilities that use only Web APIs available in all target environments.

**What this enables**: New consumers (e.g., React Native, Cloudflare Workers, a CLI) can adopt `@esparex/shared` without modification.

---

## P5 — Every Architectural Boundary Has a Justified Reason

> No package, layer, or separation exists for its own sake. Every boundary must provide a measurable benefit: testability, coupling reduction, deployment isolation, or ownership clarity.

**Applied to Esparex**: Before creating a new package or extracting a bounded context, the team must be able to name which of the four benefits the boundary provides. If none apply, the boundary is premature abstraction.

---

## P6 — Architectural Decisions Are Documented Before Implementation

> Significant structural decisions are recorded in an ADR before the implementation begins, not after. The decision record is evidence that the change was intentional.

**Applied to Esparex**: See [ADR-006](../../decisions/ADR-006-adr-decision-lifecycle.md) for the definition of "significant structural decision."

---

## Principles vs. Standards

| Principles | Standards |
|---|---|
| Immutable design philosophy | Enforceable rules |
| No package names or file paths | References specific packages and tools |
| Change only when fundamental system nature changes | Change when implementation evolves |
| "Domain must not depend on delivery" | "Import from `@esparex/core` is blocked in `apps/*`" |
| Stable across years | May be revised quarterly |
