# ADR-009: External System Integration Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: `@esparex/core`, `@esparex/backend-api`
**Related Decisions**: [ADR-007](./ADR-007-monorepo-package-topology.md), [ADR-008](./ADR-008-domain-architecture-and-bounded-contexts.md)

---

## 1. Context & Architectural Challenge

As Esparex expands, it integrates with numerous third-party vendor SDKs (Razorpay, Cloudinary, ZeptoMail, Firebase Admin) and external systems. If vendor-specific schemas, API models, and error behaviors bleed directly into the core business layer:
1. **Domain Pollution**: Domain services become tightly coupled to external schema changes, forcing updates to domain entities when vendor APIs change.
2. **Untracked Failure States**: Network errors, transient SDK crashes, and transaction failures become difficult to isolate.
3. **Eventual Consistency Failure**: Triggering downstream side effects (e.g. sending an email after a database write) can fail midway, leaving the system in an inconsistent state.

This decision record establishes a standardized **External System Integration Strategy** to guarantee domain isolation, reliable message delivery, and full operational visibility.

---

## 2. Decision

We enforce a strict integration protocol for all external services and SDKs based on Hexagonal boundaries and Enterprise Integration Patterns.

### 1. Hexagonal Ports & Adapters Isolation
External systems are strictly accessed via port abstractions. No business domain code may import external SDKs or call vendor APIs directly.
- **Port**: Resides in the domain context, declaring the functional capability required (e.g. `PaymentGatewayPort`).
- **Adapter**: Resides in `core/adapters/outbound/`, wrapping the vendor SDK and implementing the port (e.g. `RazorpayAdapter`).

### 2. Anti-Corruption Layer (ACL)
Every adapter acts as an Anti-Corruption Layer. The adapter is responsible for:
- Translating external API responses and webhook payloads into pure domain entities or foundation primitives.
- Catching vendor-specific exceptions and translating them into standard foundation errors (`DomainError`).
- Under no circumstances may an external vendor's payload structure be returned directly to a domain service.

### 3. Idempotency at the Boundary
All incoming mutation payloads (e.g., API requests, webhook events) must be verified for idempotency at the delivery or adapter boundary.
- Webhook adapters must parse and validate unique event identifiers (e.g. Razorpay payment IDs) against an idempotency ledger before executing domain actions.
- Client API mutations use unique UUID idempotency keys stored in the distributed cache.

### 4. Transactional Outbox Pattern for Integration Events
Integration events (cross-context messages) must not be fired directly during a database write. Instead:
1. The domain writes its state changes and enqueues the integration event into an `Outbox` table within the same database transaction.
2. A separate worker process polls the outbox, publishes the events to the messaging queue, and marks them as processed.
This guarantees **at-least-once delivery** of cross-context integration events. Detailed saga orchestration, dead-letter queue (DLQ) behavior, event versioning, and message replay strategy are deferred to [ADR-010](./ADR-010-eventing-and-messaging-strategy.md).

### 5. Retries & Transient Failures
- Adapters implementing ports must handle transient network issues using automated retry mechanisms with exponential backoff and jitter.
- Non-transient errors (e.g. invalid credentials, schema mismatches) must fail fast, trigger alerts, and bypass retries.

### 6. Transactional Boundaries
- Transactions are strictly scoped to a single database within a single bounded context.
- Cross-context distributed transactions (2-phase commits) are prohibited. Downstream side-effects across other domains must resolve asynchronously via integration events and saga/compensating transaction orchestrators.

### 7. Core Integration Observability
Every outbound and inbound adapter must provide full telemetry visibility:
- **Metrics**: Every integration adapter must emit structured operational metrics (e.g., `<vendor>.<operation>.success`, `<vendor>.<operation>.failed`, `<vendor>.<operation>.retry`, `<vendor>.<operation>.timeout`, and `<vendor>.<operation>.latency`).
- **Structured Logs**: Contextual tracing metadata (correlation IDs, tenant references) must propagate through all vendor calls.
- **Traces**: Outgoing network calls must be wrapped in telemetry spans to map trace propagation across boundary gateways.

---

## 3. Consequences

- **Positive**: Vendor SDK upgrades or migrations (e.g., migrating from Razorpay to Stripe) only require implementing a new adapter; business domains are untouched.
- **Positive**: The system is protected from downstream inconsistencies via transactional outbox dispatching and boundary idempotency.
- **Negative**: Adds minor boilerplate overhead (declaring ports, custom DTO translation mapping) for simple integrations.
