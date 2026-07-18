# Enterprise Architecture Specification - Esparex Platform v1.0

This specification establishes the architectural blueprint for the **Esparex Platform**. It dictates the target architecture, principles, and governance rules required to transition the repository into a decoupled, long-lived, and highly scalable enterprise platform designed to support Web, Admin, Mobile, AI services, and partner APIs for 10+ years.

---

## 1. Vision & Architecture Versioning

To ensure the platform's longevity and ease of future evolution, all core components are strictly versioned:

* **Architecture Version**: `v1.0`
* **Domain Version**: `v1`
* **Contract Version**: `v1`
* **API Version**: `v1`
* **Event Version**: `v1`

---

## 2. Architecture Principles

The Esparex Platform architecture must satisfy the following principles throughout all migrations and future development:

* No duplicate business logic.
* Every business capability has a single owner.
* Every domain exposes a single public API.
* Validation is implemented once and reused.
* Infrastructure details never leak into the domain layer.
* No application service may directly access database models.
* Cross-domain communication occurs only through published contracts or domain events.
* Shared packages must remain framework-agnostic.
* Every migrated module must remove obsolete and unused code before completion.

---

## 3. Platform Architecture & Structure

The **Esparex Platform** organizes code into runtime apps, a thin routing/service layer, self-contained domain workspaces, shared contracts, and shared kernel leaf libraries.

```mermaid
graph TD
    subgraph Apps Layer (Exclusively UI, Forms, Hooks & Page Shells)
        Web["apps/web (Next.js)"]
        Admin["apps/admin (Next.js)"]
        Mobile["apps/mobile (React Native)"]
    end

    subgraph Service Entrypoints (Routing)
        API["services/api (Express REST API)"]
        Workers["services/workers (BullMQ Tasks & Crons)"]
    end

    subgraph Packages (Esparex Platform Monolith)
        Contracts["packages/contracts (DTOs, Schemas)"]
        
        subgraph SDK Layer (Optional)
            SDK["packages/sdk/ (Mobile, 3rd Party, CLI)"]
        end

        subgraph Self-Contained Domain Bounded Contexts
            Auth["domain/authentication"]
            Authz["domain/authorization"]
            Identity["domain/identity"]
            Users["domain/users"]
            Catalog["domain/catalog"]
            Listings["domain/listings"]
            Chat["domain/chat"]
            Payments["domain/payments"]
            Media["domain/media"]
            Workflow["domain/workflow"]
            Audit["domain/audit"]
            Search["domain/search"]
            Notifications["domain/notifications"]
        end

        subgraph Core Platform Utilities
            Platform["packages/platform (DI, Bootstrapping)"]
            FeatureFlags["packages/feature-flags"]
            Observability["packages/observability (Tracing, Metrics, Audit)"]
            Kernel["packages/kernel (Abstractions, Domain/Integration Events)"]
            Config["packages/config"]
            Logger["packages/logger"]
            Validation["packages/validation"]
        end
    end

    %% Dependency flows
    Web --> Contracts
    API --> Contracts
    
    Web --> API
    Admin --> API
    
    Mobile --> SDK
    SDK --> API
    
    API --> Platform
    Platform -->|Instantiates| SelfContainedDomains
    Workers -->|Triggers| SelfContainedDomains

    SelfContainedDomains --> Contracts
    SelfContainedDomains --> Kernel
    SelfContainedDomains --> Observability
    SelfContainedDomains --> FeatureFlags
    
    style Kernel fill:#bbf,stroke:#333,stroke-width:2px
    style Contracts fill:#bfb,stroke:#333,stroke-width:2px
    style Platform fill:#fbb,stroke:#333,stroke-width:2px
```

### Folder Structure

```text
esparex-platform/
├── apps/                          
│   ├── web/                       
│   ├── admin/                     
│   └── mobile/                    
│
├── packages/                      
│   ├── kernel/                    
│   │   ├── domain/                # Abstractions (Entity, ValueObject, Result)
│   │   └── events/                
│   │       ├── domain/            # (e.g. ListingApproved, PaymentCompleted)
│   │       └── integration/       # (e.g. EmailRequested, SearchIndexRequested)
│   │
│   ├── contracts/                 # DTOs, API schemas, Zod schemas, Event payloads
│   │
│   ├── platform/                  # Environment, Bootstrapping, DI, Composition
│   ├── sdk/                       # Optional SDK (Mobile, 3rd party, CLI)
│   ├── feature-flags/             # Safely ship features
│   ├── observability/             # tracing, metrics, health, audit
│   ├── config/                    
│   ├── logger/                    
│   ├── validation/                
│   ├── testing/                   
│   │
│   └── domain/                    # Self-contained business domains
│       ├── identity/              
│       ├── authentication/        
│       ├── authorization/         
│       ├── media/                 
│       ├── workflow/              
│       ├── audit/                 
│       ├── users/                 
│       ├── catalog/               
│       ├── listings/              
│       ├── search/                
│       ├── businesses/            
│       ├── payments/              
│       ├── chat/                  
│       ├── notifications/         
│       ├── smart-alerts/          
│       ├── analytics/             
│       ├── reports/               
│       ├── ai/                    
│       └── admin/                 
│
├── services/                      
│   ├── api/                       # API Express REST server (Thin routing layer)
│   └── workers/                   # Background queue workers & cron schedules
│
├── docs/                          
│   └── adr/                       # Architecture Decision Records
└── tests/                         
```

---

## 4. Domain Model & Dependencies

### Domain Lifecycle Status

Not all domains operate at the same level of maturity. This guides stability expectations:

| Domain | Core Responsibilities | Status |
| :--- | :--- | :--- |
| **Identity** | Profile, Email, Mobile, Verification, Reputation | Stable |
| **Authentication** | Login, OTP, JWT, Sessions, Refresh Tokens | Stable |
| **Authorization** | Roles, Permissions, Policies, Resource Access, RBAC | Stable |
| **Catalog** | Category trees, brands, models, spare part metadata | Stable |
| **Listings** | Marketplace advertisements, boosts, ad updates | Stable |
| **Payments** | Invoicing, pricing plans, wallet balances | Stable |
| **Media** | Uploads, Images, Videos, Compression, Storage, CDN | Stable |
| **Workflow** | Approval Engine, Review, Moderation, Escalation, Rejection | Stable |
| **Search** | Match listings, save queries, run feeds | Stable |
| **Businesses** | Verification, registration, business metadata | Stable |
| **Chat** | P2P chats, report messages | Stable |
| **Notifications** | Alerts, logs, emails, SMS scheduling | Stable |
| **Smart Alerts**| Matching alert preferences, cron runs | Beta |
| **Analytics** | View counters, engagement tracking, telemetry | Beta |
| **Reports** | Flagging inappropriate content, reviews | Stable |
| **Audit** | AuditEntry, Activity, Security Events, Admin Actions | Stable |
| **AI** | Auto-categorization, fraud detection, spam checks | Experimental |

### Layered Dependency Policy (The Architectural Law)

To decouple Bounded Contexts, Esparex Platform relies on objective dependency rules rather than a static matrix. Reviewers must enforce the following dependency types:

| Dependency Type | Allowed | Example |
| :--- | :--- | :--- |
| **Direct Service Call** | Only within the same domain | `Listings → Listings` |
| **Contract** | Yes | `Listings → Contracts` |
| **Domain Event** | Preferred | `ListingsPublished → Search` |
| **Integration Event** | Preferred | `PaymentCompleted → Notifications` |
| **Repository Access** | Never cross-domain | `Listings` cannot access `CatalogRepository` directly |
| **Database Access** | Domain-owned only | Only the owning domain accesses its persistence |

---

## 5. Workflow Ownership

Currently, approval logic is scattered. In Esparex Platform, **Workflow** exists as a dedicated domain that strictly owns:

* Approval lifecycle
* Review lifecycle
* Escalation
* Moderation
* State transitions

Domains such as **Listings, Businesses, Reports, and Catalog Requests** must **request** workflow actions via contracts/events rather than implementing approval logic themselves.

---

## 6. Cross-Cutting Concerns

Every domain automatically inherits the following cross-cutting concerns from the Platform and Shared packages. **No domain should implement these independently:**

* Logging
* Validation
* Error handling
* Authorization
* Audit
* Feature flags
* Metrics
* Tracing
* Caching

---

## 7. Non-Functional Requirements (NFRs)

The architecture is designed to support the operational realities of a 10+ year platform. Target NFRs include:

* **Availability**: 99.99% uptime for core domains (Identity, Auth, Catalog, Search).
* **Performance**: 95th percentile (p95) API response time < 200ms.
* **Scalability**: Stateless domain services capable of horizontal pod autoscaling based on CPU/Memory and queue depth (for Workers).
* **Security**: All internal service-to-service communication authenticated; strict RBAC at the API gateway layer.
* **Observability**: 100% trace coverage for all incoming requests (Correlation ID, Request ID, Trace ID).
* **Disaster Recovery**: RPO (Recovery Point Objective) of 5 minutes; RTO (Recovery Time Objective) of 1 hour.
* **Data Retention & Privacy**: Automated PII masking in logs; GDPR-compliant soft-deletion workflows via the Identity domain.

---

## 8. Platform Governance

To preserve the architecture over time, all future contributors must abide by the following rules:

### Evolution Policy
* Existing domains should be extended before creating new ones.
* New domains require architectural review.
* Shared packages must not contain business logic.
* Breaking contract changes require version increments.
* Deprecated APIs follow a documented deprecation lifecycle.

### ADR (Architecture Decision Record) Policy
Every major architectural change must be documented in `docs/adr/`. Each ADR must require:
* Context
* Decision
* Alternatives considered
* Consequences
* Status

### Canonical Naming Standard
To prevent drift, naming conventions are strictly enforced:
* `*Service` — Application services (e.g., `ListingService`)
* `*Repository` — Domain ports (e.g., `UserRepository`)
* `Mongo*RepositoryAdapter` — Infrastructure adapters (e.g., `MongoUserRepositoryAdapter`)
* `*Controller` — HTTP controllers (e.g., `ListingController`)
* `*Command` / `*Query` — Application requests
* `*Event` — Domain or integration events (e.g., `ListingPublishedEvent`)

---

## 9. Migration Strategy & Execution Sequence

The specification has been finalized. We will now proceed with the implementation sequence, starting with Phase 0 (Foundation) and Phase 0.5 (Baseline), followed by the ordered domain migration.

### Phase 0: Foundation Exit Criteria

Before any domain is migrated, the repository foundation must be objectively verified against these exit criteria:

1. **Repository Structure**: Every package must have its own `package.json` and `tsconfig.json`. Workspace resolution must work with no duplicate names, correct build order, and an acyclic dependency graph.
2. **TypeScript**: Project References enabled, incremental builds working, path aliases resolving, and `tsc --build` succeeding with no duplicate declarations.
3. **Workspace**: The package manager installs successfully, no orphan packages, and lockfile is stable.
4. **Kernel Review**: Contains *only* platform primitives (`Entity`, `AggregateRoot`, `ValueObject`, `UniqueId`, `Result`, `Either`, `Specification`, `Guard`, `DomainEvent`, `EventBus`). **Zero business knowledge**.
5. **Contracts Review**: Contains *only* DTOs, Request/Response models, Event payloads, and Shared schemas.
6. **Dependency Review**: Zero circular dependencies, boundary violations, or reverse dependencies.
7. **Package Independence**: Every package must build independently.
8. **Build Verification**: Lint, type-check, test, and build must pass.
9. **CI Verification**: CI executes all guards, builds, and security audits without skipping.

### Phase 0.5: Repository Baseline

Before migrating the first domain, a baseline report must be generated and saved as `docs/reports/repository-baseline-v1.md`. It must capture metrics such as files, LOC, TypeScript/ESLint errors, circular dependencies, duplicate code, build/test times, and bundle size. After each domain migration, we will compare against this baseline to ensure technical debt is improving.

### Phase 1+: Ordered Domain Migration

The migration will proceed strictly in this order to minimize dependency risks and validate the architecture incrementally:

1. **Kernel** ✅
2. **Contracts**
3. **Platform**
4. **Observability**
5. **Feature Flags**
6. **Media**
7. **Workflow**
8. **Catalog**
9. **Locations**
10. **Identity**
11. **Authentication**
12. **Authorization**
13. **Businesses**
14. **Listings**
15. **Search**
16. **Notifications**
17. **Payments**
18. **Chat**
19. **Analytics**
20. **AI**
21. **Admin**

### Migration Quality Gates

Each domain migration must satisfy the following requirements before it is considered complete:

* Zero duplicate implementations introduced.
* Zero legacy wrappers carried into the new architecture.
* Zero direct infrastructure dependencies inside the domain layer.
* All business rules preserved.
* Tests pass.
* Dependency rules remain valid.
* Documentation updated.
* Dead code removed.
* Public APIs remain backward compatible unless explicitly approved.

### Success Criteria ("Esparex Platform Complete")

The architectural transformation is considered fully successful when it meets both technical and operational readiness:

* **Technical Completion**:
  * All domains migrated.
  * Zero legacy code.
  * Zero duplicate business logic.
  * 100% dependency compliance.
  * Green CI/CD.
  * All architecture guards passing.
  * Domain boundaries enforced.
* **Operational Readiness**:
  * Performance budgets met (p95 < 200ms).
  * Security review completed.
  * Documentation synchronized.
  * Domain ownership assigned.
  * Monitoring dashboards configured.
  * Backup and recovery tested.
  * Platform ready for Web, Admin, Mobile, and Partner APIs.

---

## Appendix A: File Inventory

The repository currently contains **1,874 files**. The source layout is divided as:
- **`apps/web`**: 607 files (Client Web UI, hooks, and pages)
- **`apps/admin`**: 246 files (Admin Web UI, pages, and moderation tables)
- **`apps/mobile`**: 3 files (Mobile shell)
- **`backend/api`**: 278 files (API router, server controllers, request validations)
- **`core`**: 510 files (Database schemas, core business logic, composition roots)

---

## Appendix B: File Migration Matrix (Sample)

| Current Path | Domain / Layer | New Path | Strategy |
| :--- | :--- | :--- | :--- |
| `core/src/models/Ad.ts` | Listings | `packages/domain/listings/infrastructure/persistence/MongoAdModel.ts` | Encapsulate within Listing Repository |
| `core/src/models/User.ts` | Identity | `packages/domain/identity/infrastructure/persistence/MongoUserModel.ts` | Encapsulate within Identity Repository |
| `core/src/services/AuthService.ts`| Authentication | `packages/domain/authentication/application/AuthService.ts` | Extract HTTP dependencies |
| `backend/api/src/routes/listingRoutes.ts` | Listings | `services/api/routes/listingRoutes.ts` | Thin HTTP routing layer |

---

## 10. SOLID & Design Principles

Every implementation should follow:
* Single Responsibility Principle (SRP)
* Open/Closed Principle (OCP)
* Liskov Substitution Principle (LSP)
* Interface Segregation Principle (ISP)
* Dependency Inversion Principle (DIP)
* Composition over inheritance
* Favor immutable objects where practical
* Business logic belongs in domain/application layers, never controllers

---

## 11. Error Handling Standards

Every error should be:
* Typed (avoid generic `Error`)
* Contextual
* Logged once
* Never silently ignored
* Never expose internal stack traces to clients

Required types: Domain, Validation, Infrastructure, External API, and Unexpected errors.
Standardized error response format across all APIs.

---

## 12. Logging Standards

Every log should include:
* Correlation ID, Request ID, User ID (if authenticated)
* Domain, Operation, Duration, Severity, Environment

Forbidden:
* `console.log` / `console.error`
* Logging passwords, JWTs, secrets, or PII

---

## 13. Configuration Standards

Configuration must:
* Come only from environment variables
* Be validated at startup
* Have defaults only for development
* Never hardcode secrets, URLs, or IDs

---

## 14. API Standards

Every endpoint should have:
* Versioning, Validation, Authentication, Authorization
* Pagination (where applicable), Sorting, Filtering
* Consistent error format, Idempotency where required

---

## 15. Database Standards

Repositories must:
* Prevent N+1 queries
* Use indexes appropriately
* Support transactions when required
* Avoid full collection scans and duplicated queries
* Prevent race conditions (Optimistic/Pessimistic locking)

---

## 16. Async & Queue Standards

Background jobs should:
* Be idempotent, Support retries with exponential backoff
* Have dead-letter queues, Be observable, Support cancellation
* Use correlation IDs

---

## 17. Frontend Standards

Components should:
* Be accessible (WCAG 2.2 AA), Support keyboard & screen readers
* Avoid unnecessary re-renders, Be responsive
* Avoid duplicated state, Use lazy loading

---

## 18. State Management Standards

State should be:
* Local by default, Shared only when necessary
* Normalized, Immutable, Derived instead of duplicated
* Avoid multiple sources of truth.

---

## 19. Git & Branch Standards

Every PR must:
* Be focused on one concern, Have descriptive commits
* Reference an issue/task, Pass CI, Be reviewed
* Squash merge unless history matters

Branch naming: `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`, `security/`, `perf/`

---

## 20. Dependency Management

Rules:
* Remove unused packages immediately, No abandoned libraries
* Pin critical dependencies, Review licenses
* Prefer maintained libraries, Minimize transitive dependencies

---

## 21. Code Review Checklist

Every review should verify:
* Correctness, Architecture compliance, Naming, Security
* Performance, Accessibility, Testing, Documentation
* Maintainability, Simplicity, No duplication

---

## 22. Technical Debt Policy

Every PR must reduce technical debt or keep it neutral. If debt is introduced:
* Document it, Create a tracking issue
* Add TODO with issue reference, Define an owner
* No anonymous TODOs.

---

## 23. Deprecation Policy

Every deprecated API should include:
* Replacement, Deprecation date, Removal version
* Migration guide, Warning logs

---

## 24. Release Quality Gates

No production release unless:
* CI green, Tests passing, Security scan clean
* Performance budgets met, Architecture checks pass
* Documentation updated, Rollback plan available

---

## 25. AI-Assisted Development Standards

* AI-generated code must undergo human review.
* AI must not bypass architecture or dependency rules.
* AI-generated code must follow naming, testing, and documentation standards.
* No code is merged solely because it was AI-generated.

---

## 26. Repository Metrics Dashboard

Track these continuously:
* **Quality**: TS/ESLint errors, Complexity, Duplication, Dead code
* **Testing**: Coverage, Flaky tests, Test duration
* **Performance**: Bundle size, Build time, CI duration, API latency
* **Security**: Vulnerabilities, Secrets detected, Outdated packages
* **Architecture**: Boundary violations, Circular dependencies

---

## 27. Clean Code Golden Rules

1. Write code for humans first.
2. Every file has one responsibility.
3. Every business rule has one owner.
4. Prefer deletion over abstraction.
5. Favor composition over inheritance.
6. Avoid premature optimization.
7. Remove dead code immediately.
8. Duplicate knowledge is a bug.
9. Make illegal states unrepresentable.
10. Fail fast with clear errors.
11. Every public API is documented.
12. Every feature is tested.
13. Every dependency is intentional.
14. Simplicity beats cleverness.
15. Leave the codebase cleaner than you found it.

---

## 28. Architecture Fitness Functions

Every architectural rule maps to an automated check:

| Rule | Verification Tool |
| :--- | :--- |
| No domain imports UI | Dependency Cruiser |
| No circular dependencies | Madge |
| No unused exports | Knip |
| File size limits | ESLint / Custom script |
| Complexity limits | ESLint SonarJS |
| Bundle budget | Bundle analyzer |
| Security | npm audit + secret scan |
| Architecture score | `npm run verify:architecture` |

---

## 29. Ownership Rules

Every domain must have an explicit owner. No "shared" accountability.
* **Identity**: Platform Team
* **Catalog**: Marketplace Team
* **Payments**: Commerce Team
*(To be fully mapped during domain migrations)*

---

## 30. Compatibility & Deprecation Lifecycle

**Compatibility Policy**: Breaking changes to Public APIs, Events, DTOs, Contracts, or SDKs require:
1. Version increment
2. Architecture Decision Record (ADR)
3. Migration guide

**Lifecycle States**: Experimental -> Beta -> Stable -> Deprecated -> Removed

---

## 31. Observability & Performance Budgets

**Observability**:
* Every service exposes: Health, Readiness, Liveness, Metrics, Version.
* Every request generates: Correlation ID, Trace ID, Request ID.

**Performance Budgets**:
* Initial JS bundle < 250 KB (gzipped)
* Lazy-loaded route bundles < 150 KB
* Lighthouse Performance ≥ 90, Accessibility ≥ 95
* API p95 < 200 ms
* Database query p95 < 50 ms

---

## 32. Security Review Checklist

Every PR must verify:
* Authentication & Authorization
* Input validation & Output encoding
* Rate limiting & Secrets handling
* File upload safety & Logging hygiene
* Dependency vulnerabilities

---

## 33. Strict Forbiddances (What Is Not Allowed)

Reviewers must strictly reject:
* Business logic in controllers or React components.
* Cross-domain database access.
* Duplicate validation rules or global mutable state.
* Anonymous TODOs.
* Magic numbers/strings without constants.
* `any`, `@ts-ignore`, or `eslint-disable` without documented explanation.
* Hardcoded secrets or direct `console.log` in production code.

---

## 34. Definition of Done (DoD)

No feature, refactor, or bug fix is complete until all of the following are true:

* ✅ Architecture compliant
* ✅ Engineering standards compliant
* ✅ Clean code standards compliant
* ✅ Security review passed
* ✅ Tests added or updated
* ✅ Documentation updated
* ✅ No dead code or duplicate logic introduced
* ✅ CI green & Code review approved
* ✅ Performance budget maintained
* ✅ Repository health score unchanged or improved
