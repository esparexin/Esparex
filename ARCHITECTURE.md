# Esparex Architecture Guide: Hexagonal & DDD Core Patterns

This document is the primary developer-facing guide to the architectural patterns, bounded context topology, and naming conventions of the Esparex codebase. 

All future bounded context refactorings and feature implementations must follow these rules.

---

## 1. Current Bounded Context State

```text
Migrated Bounded Contexts (DDD Ports & Adapters)

✅ Location
✅ Catalog
✅ Listings
✅ Identity (M2.4)
✅ Payments (M2.1)
✅ Notifications (M2.2)
✅ Fraud (M2.6)
✅ Trust (M2.6)
✅ Boosts (M2.7)
✅ Discovery (M2.8)
✅ Analytics (M2.9)

Modernization Patterns

✅ Repository Ports
✅ Mongo Adapters
✅ UnitOfWork (Transaction Abstraction)
✅ Cache Ports (Business Invalidation)
✅ Composition Roots
✅ Dependency Injection

Remaining Platform Modernization (Future Projects)

• Auth
• Wallet
• Notifications
• Payments
• Smart Alerts

(Status: Intentionally deferred as future modernization candidates)
```

---

## 2. Directory Structure Conventions

Under `@esparex/core` (`core/src/`), we enforce a strict separation between domain capabilities (inward-facing) and technical infrastructure (outward-facing):

```text
core/src/
├── domains/                  ← INWARD-FACING (Pure Business Logic)
│   └── <domain>/             ← e.g. listings, catalog, location
│       ├── domain/           ← Entities, Value Objects, Domain Events
│       ├── ports/            ← Interfaces defining database, cache, or API needs
│       └── index.ts          ← Public barrel file exporting ONLY public types & ports
│
├── adapters/                 ← OUTWARD-FACING (Technical Implementations)
│   ├── inbound/              ← Controllers, event listeners, CLI entrypoints
│   └── outbound/             ← Concrete database repository & cache implementations
│       └── database/
│           └── <domain>/     ← e.g., MongoListingRepositoryAdapter.ts
│
├── composition/              ← WIRING (Composition Root)
│   └── <domain>.ts           ← Factory methods instantiating and caching singletons
```

---

## 3. Hexagonal Ports & Adapters Suffix Standards

To maintain clean and readable boundaries, we enforce strict suffix and directory rules:

| Archetype | Suffix | Placement | Allowed Imports | Examples |
|---|---|---|---|---|
| **Port** | `Port` | `core/src/domains/<domain>/ports/` | Primitive types, building blocks, domain entities. | `PaymentGatewayPort`, `EmailPort` |
| **Adapter** | `Adapter` | `core/src/adapters/outbound/` | Vendor SDKs, ports, configurations. | `RazorpayAdapter`, `ZeptoMailAdapter` |
| **Repository Port** | `RepositoryPort` | `core/src/domains/<domain>/ports/` | Domain entities, value objects, ID structures. | `ListingRepositoryPort`, `CategoryRepositoryPort` |
| **Persistence Adapter** | `RepositoryAdapter` | `core/src/adapters/outbound/` | Mongoose models, schemas, repositories, ports. | `MongoListingRepositoryAdapter` |

---

## 4. Key Architectural Patterns

### A. Repository Pattern (Database Abstraction)
All persistence-layer queries and commands are routed through a domain-defined Repository Port:
1. **Port**: `ListingRepositoryPort` defines standard CRUD and domain-specific query methods using plain TS objects.
2. **Adapter**: `MongoListingRepositoryAdapter` handles the Mongoose schema interaction, maps MongoDB documents using a `toDomain()` mapping function, and implements the queries.
3. **Application Layer & Presentation Layer**: Call `getListingRepository().findOne(...)` instead of directly importing `AdModel` or writing raw Mongoose queries.

### B. UnitOfWork Pattern (Transaction Abstraction)
To prevent leakage of database transaction details (like Mongoose `ClientSession`) into application services, we use the `UnitOfWork` pattern:
1. **Port**: `ListingUnitOfWorkPort` defines an `executeTransaction` method accepting an opaque session type.
   ```typescript
   export interface ListingUnitOfWorkPort {
       executeTransaction<T>(work: (session: unknown) => Promise<T>): Promise<T>;
   }
   ```
2. **Adapter**: `MongoListingUnitOfWorkAdapter` implements the transaction using Mongoose's `session.withTransaction` internally.
3. **Application Services**: Consume the port via the composition root, passing `session` as `unknown` to ensure complete database framework independence:
   ```typescript
   await getListingUnitOfWork().executeTransaction(async (session) => {
       await getListingRepository().updateOne(id, patch, session);
   });
   ```

### C. Cache Abstraction Pattern
Rather than calling Redis client helpers (like `redisCache`) directly, the application layer declares its invalidation needs through a business-intent-focused cache port:
1. **Port**: `ListingsCachePort` exposes only business-intent invalidation methods:
   ```typescript
   export interface ListingsCachePort {
       invalidateAdFeedCaches(): Promise<void>;
       invalidatePublicAdCache(adId: string): Promise<void>;
   }
   ```
2. **Adapter**: `RedisListingsCacheAdapter` calls the low-level Redis caching helpers.
3. **Core Services & Listeners**: Call `getListingsCache().invalidateAdFeedCaches()` via the composition root, keeping business logic clean of infrastructure caching mechanics.

### D. Composition Root Pattern
Dependencies are wired together at the package boundary in a central composition root (`core/src/composition/<domain>.ts`):
- Singleton instance factories (e.g. `getListingRepository()`, `getListingUnitOfWork()`, `getListingsCache()`) instantiate adapters and return their port interfaces.

---

## 5. Architectural Boundaries & Enforcement

We enforce these boundaries automatically in CI using `dependency-cruiser` and custom AST checks:
1. **Pure Domains**: Files under `core/src/domains/<domain>/` must not import anything from `core/src/adapters/` or `mongoose`/`redis`.
2. **Decoupled Application Layer**: Core domain validations/services contain zero mongoose, direct database model imports, or query builders.
3. **Public API Barrel**: Bounded contexts must only export types and port interfaces through their main `index.ts` file. Deep imports into another context's directories are blocked.
