# ADR-001: Booking Ownership

## Metadata
- **Status**: Implemented
- **Date**: 2026-06-25
- **Authors**: Repository Architecture Team
- **Reviewers**: Software Architecture Group, Core Platform Group
- **Decision Category**: Architecture / API / Governance
- **Related Documents**:
  - [ARCHITECTURE.md](../../ARCHITECTURE.md) (System Boundaries & Monorepo Topology)
  - [DEPLOYMENT_MAP.md](../../DEPLOYMENT_MAP.md) (Environment Matrix & Shared Backend implications)
  - [API_CONTRACTS.md](../../API_CONTRACTS.md) (Booking & Payment API contracts)
- **Related GitHub Issues**: None
- **Related Pull Requests**: None

---

## Context
The MAD Entertrainment platform supports concurrent ticket purchasing for high-demand public events. Ticket reservation is highly time-sensitive: when a user initiates a checkout, the system must temporarily reserve their selected seats, calculate pricing, check coupon code validity, and hold the seat inventory while they perform the payment sequence.

Previously, client applications (`apps/web` and `apps/admin`) and backend servers (`apps/server`) shared varying definitions of booking validation, expiration timers, and state transitions.

## Problem Statement
Distributing booking ownership introduces major architectural risks:
1. **Double Bookings**: Concurrent checkout processes could lock the same seats if allocation is not coordinated centrally.
2. **Pricing Integrity**: Allowing the client application to calculate pricing or discounts exposes the system to tampering.
3. **Data Inconsistency**: If client-side timers control seat releases, a dropped client connection would result in orphan locks, leaking seat capacity.
4. **Security Vulnerabilities**: Enforcing user-specific bookings on the client allows malicious actors to access other customers' tickets.

## Decision
All booking state validation, seat locking calculations, pricing calculations, expiration rules, and transaction transitions must reside strictly on the server (`apps/server`) to mitigate double bookings, coupon/pricing integrity bypasses, and security privilege escalations.

- **The client applications** act strictly as presentation consumers. They submit booking requests (`POST /api/bookings`) and checkout details (`PUT /api/bookings/:id/checkout-details`), but never calculate ticket totals, generate booking references, or handle direct state mutations.
- **The server** acts as the Single Source of Truth (SSOT). It manages seat holds inside database transactions, calculates coupon discounts, enforces expiration pings, and executes payment validations.
- For the canonical definition of system boundaries and module packages, see [ARCHITECTURE.md](../../ARCHITECTURE.md). For HTTP request/response schemas and Express endpoint contracts, see [API_CONTRACTS.md](../../API_CONTRACTS.md). For hosting layout and database environment configuration, see [DEPLOYMENT_MAP.md](../../DEPLOYMENT_MAP.md).

---

## Alternatives Considered

### Alternative A: Decentralized Calculations (Dual-State Calculation)
- **Description**: Calculate pricing on the client for instant UI response and recalculate on the server for security checks.
- **Pros**: Instant UI feedback without server roundtrips.
- **Cons**: Duplicated validation code across packages. Higher maintenance cost and likelihood of drift.
- **Verdict**: Rejected in favor of centralizing all logic on the server and sharing payload schemas via `@mad/validations`.

### Alternative B: Distributed Triggers (Database-Level Enforcement)
- **Description**: Use database triggers or Mongo triggers to enforce locks and release holds.
- **Pros**: Decouples application logic from database operations.
- **Cons**: Difficult to debug, test, and version control.
- **Verdict**: Rejected due to maintenance complexity.

---

## Consequences

- **Pros**:
  - Enforces complete pricing integrity and prevents coupon manipulation.
  - Eliminates seat lock race conditions via atomic Mongoose sessions.
  - Simplifies the client applications, which only need to query the server and render the response.
- **Cons**:
  - Adds a server roundtrip for any state transition or discount calculations.
  - Increases dependency on server availability and database transaction performance during checkouts.

---

## Technical & Operational Impact

### Migration Strategy
- Already implemented. Database schemas reside in `apps/server/src/models/` and business validation rules live under `apps/server/src/services/`.
- Frontend applications import validation primitive schemas directly from the shared workspace package `@mad/validations` (described in [ARCHITECTURE.md](../../ARCHITECTURE.md#L345-L346)).

### Operational Impact
- Backend Render nodes handle all ticket locking transactions.
- During high-concurrency pings, database connection pooling must scale to accommodate transaction loads (detailed in [DEPLOYMENT_MAP.md](../../DEPLOYMENT_MAP.md#L97-L100)).

### Security Impact
- Enforces user-specific context matching. The server validates that the active JWT `user.sub` owns the target booking reference (`MAD-YYYY-XXXXX`) before allowing any updates or PDF ticket downloads.

### Performance Impact
- Rate limits protect the booking creation routes (`bookingLimiter` allows 10 requests per 15 minutes, documented in [API_CONTRACTS.md](../../API_CONTRACTS.md#L614-L621)) to prevent DDoS or lock exhaustion.

### Testing Strategy
- Verified by booking integration tests (`apps/server/src/services/public/booking.service.test.ts` and `apps/server/src/controllers/public/booking.controller.test.ts`).

### Rollback Strategy
- Booking states are managed by standard database migrations. In case of operational issues, rollback via the standard Render deploy dashboard.

---

## Future Considerations
- Automatic seat hold release hooks are monitored via dead-letter alerting systems to track if a transaction fail-to-release happens.

## References
- [ARCHITECTURE.md (System Boundaries & SSOT Ownership Matrix)](../../ARCHITECTURE.md#L265-L281)
- [API_CONTRACTS.md (Booking & Payment API Routes and Rate Limiting)](../../API_CONTRACTS.md#L508-L544)
- [DEPLOYMENT_MAP.md (Deployment Environments & Database Connections)](../../DEPLOYMENT_MAP.md#L97-L100)
