# Esparex Core Public API Specification (Architecture v1.0.0)

This document defines the canonical public API interface of `@esparex/core`. Under the Architecture v1.0.0 package contract, all consumer packages must import only from these explicitly defined namespaces. Direct deep imports into internal subfolders are strictly forbidden.

---

## Approved Namespaces

The core package exposes exactly 14 approved public namespaces:

| Namespace | Responsibility / Purpose | Key Exported Symbols | Stability |
| --- | --- | --- | --- |
| `@esparex/core` | Root module bootstrap entry point | connection managers, models registry | Stable |
| `@esparex/core/models` | Database schemas and models | `Ad`, `User`, `Category`, `Brand`, `Model` | Stable |
| `@esparex/core/services` | Domain and application workflows | `AuthService`, `BookingService`, `AdImageService` | Stable |
| `@esparex/core/events` | Event emission and listeners | `eventEmitter`, lifecycle hooks | Stable |
| `@esparex/core/infrastructure` | Shared runtime connections & clients | `redisClient`, `connectDatabase`, `getIO` | Stable |
| `@esparex/core/tooling` | Operational & system maintenance tasks | `gracefulShutdown`, `runStartupIndexAudit` | Stable |
| `@esparex/core/config` | Environmental configurations & constants | `env`, `featureFlags`, `adminPermissions` | Stable |
| `@esparex/core/types` | Public TypeScript typings | `IUser`, `IAd`, `IBusiness`, etc. | Stable |
| `@esparex/core/validators` | Zod schema validation rules | `adSchema`, `userSchema`, `chatSchema` | Stable |
| `@esparex/core/jobs` | Individual background worker jobs | `runExpiryWarningJob`, `cleanupExpiredAds` | Stable |
| `@esparex/core/queues` | Queue publishers and queue names | `paymentQueue`, `enqueuePaymentProcessing` | Stable |
| `@esparex/core/workers` | Background queue consumer listeners | `paymentWorker` | Stable |
| `@esparex/core/domain` | Transport-neutral domain constructs | `NotificationIntent` | Stable |
| `@esparex/core/utils` | Pure functional helper utilities | `logger`, `formatLocationResponse` | Stable |

---

## Stability Levels

Every exposed symbol follows the stability lifecycle:
1. **Experimental**: Subject to change or replacement in minor versions.
2. **Stable**: Backwards compatibility guaranteed; changes require deprecation window.
3. **Deprecated**: Marked for future removal; warning logs printed during usage.
4. **Internal**: Hidden behind private folder structures and not exported.

---

## Governance Rules

### Rule 1: Public namespaces are append-only
Adding a new export is permitted. Modifying or deleting an existing export requires a deprecation warning, a major architecture version bump, and updating the package contract.

### Rule 2: Pure Transport Isolation
No transport dependencies (e.g. `express` router, HTTP request objects) are permitted inside core/domain files.

### Rule 3: Growth Thresholds
If a namespace exceeds **75 exported symbols** or **50 files**, a formal design review is triggered to evaluate splitting the namespace.
