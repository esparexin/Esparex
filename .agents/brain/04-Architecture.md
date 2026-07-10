---
MetadataSchema: 1.0
Brain-ID: ERB-004
Title: Architecture
Version: 1.0
Status: Active
Type: Static
Owner: Architecture Layer Conventions
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run lint
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-003
    impacts:
      - ERB-005
  repository:
    consumes:
      - docs/architecture/CURRENT_ARCHITECTURE.md
      - docs/architecture/REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md
    owns:
      - Architectural Layers Hierarchy
      - Core Telemetry Requirements
    validates:
      - Direct Model Mutation in API Gateway
      - Transport Context Leakage in Core
    generates:
      - System Architectural Layer Conventions
---

# 04. Architecture

This document registers the structural design pattern guidelines and architectural layer boundaries.

## 1. Architectural Layers Hierarchy

The monorepo operates on a strict downward dependency flow:

```text
  [ Presentation Layer ]  (apps/web, apps/admin)
           │
           ▼
    [ Transport Layer ]   (backend/api gateway)
           │
           ▼
   [ Business Domain ]    (core - services, infrastructure, models)
           │
           ▼
    [ Shared Library ]    (shared - isomorphic helpers & Zod schemas)
```

For strict folder-to-folder import rules and allowed dependencies, refer directly to [ERB-005](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/brain/05-Dependency-Rules.md).

---

## 2. Component Design Specifications

### 2.1 UI Component Purity (Presentation Layer)
* React components inside `apps/` must remain presentational.
* Fetch requests or database mutations are forbidden inside rendering blocks. Data processing must delegate to custom React hooks or unified api helper scripts.
* File naming and structure conventions must follow the rules defined in [ERB-006](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/brain/06-Coding-Standards.md).

### 2.2 Controller Isolation (Transport Layer)
* Backend controllers inside `backend/api` act as thin routing wrappers mapping endpoints to core services.
* Direct MongoDB queries or database writes (e.g. `User.updateOne(...)`) are strictly forbidden inside controllers. All mutations must use `@esparex/core` service boundaries.

### 2.3 Domain Neutrality & Abstraction (Core Layer)
* Business logic in `core/` must be decoupled from the transport protocol. Transport layer artifacts (such as Express requests/responses, ports, or cookie definitions) must never leak into core service code.
* **Status Service Mutation**: Listing status transitions must use the official `StatusHistory` service rather than raw database field edits. This ensures changes are audited and metrics are recorded.
* **Telemetry Registry**: All database queries, external integrations (Razorpay, MSG91), and queue jobs must invoke Prometheus metrics timers (`prom-client`) in [metrics.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/infrastructure/telemetry/metrics.ts).

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Downward architectural layers config**: [docs/architecture/REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/architecture/REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md) and [docs/MASTER_DOCUMENT_REGISTRY.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/MASTER_DOCUMENT_REGISTRY.md)
* **Telemetry registry**: [core/src/infrastructure/telemetry/metrics.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/infrastructure/telemetry/metrics.ts)
* **Status History rules**: [core/src/models/StatusHistory.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/models/StatusHistory.ts) and [core/src/services/UserStatusService.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/UserStatusService.ts)

---

## 4. Central Decisions References

* Central Decision Record: [0002-transport-separation](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0002-transport-separation.md)
* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized architectural layer guidelines.
