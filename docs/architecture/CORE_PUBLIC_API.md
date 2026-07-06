# @esparex/core Public API Contract

This document defines the strictly governed public API for `@esparex/core`. External consumers (like `backend/user` or `apps/*`) MUST only import from these defined namespaces. Deep imports (e.g., `import X from '@esparex/core/services/X'`) are explicitly prohibited and will cause runtime errors once boundaries are fully enforced.

---

## 1. Models (`@esparex/core/models`)
The domain schemas and data structures.

- `Ad`
- `AdAnalytics`
- `AdImage`
- `AdMetrics`
- `Admin`
- `AdminBoundary`
- `AdminLog`
- `AdminMetrics`
- `AdminSession`
- `AlertDeliveryLog`
- `ApiKey`
- `BlockedUser`
- `Boost`
- `Brand`
- `Business`
- `CatalogRequest`
- `Category`
- `ChatMessage`
- `ChatReport`
- `ContactSubmission`
- `Conversation`
- `Counter`
- `DuplicateEvent`
- `FraudScore`
- `FraudSignal`
- `Geofence`
- `IdempotencyRequest`
- `Invoice`
- `JobLog`
- `Location`
- `LocationAnalytics`
- `LocationEvent`
- `Model`
- `Notification`
- `NotificationLog`
- `Otp`
- `PageContent`
- `PhoneRequest`
- `PhoneRevealLog`
- `Plan`
- `RankingTelemetry`
- `Report`
- `RevenueAnalytics`
- `SavedAd`
- `SavedSearch`
- `ScheduledNotification`
- `ScreenSize`
- `SellerReputation`
- `ServiceType`
- `SmartAlert`
- `SparePart`
- `StatusHistory`
- `SystemConfig`
- `Transaction`
- `User`
- `UserPlan`
- `UserWallet`
- `Variant`
- *Plus all registry mappings exported from `registry.ts`*

---

## 2. Events (`@esparex/core/events`)
The central event bus and listeners.

- `initializeEventDispatcher`
- `lifecycleEvents` (Central Lifecycle Event Dispatcher)

---

## 3. Services (`@esparex/core/services`)
*(Under Active Migration - Project C)*

*The exact public facade for services is currently being curated. Once Project C is completed, only explicitly defined aggregate roots and facades will be documented here.*

---

## 4. Config (`@esparex/core/config`)
*(Under Active Migration - Project E)*

*The exact public config interface is being curated.*

---

## 5. Utils (`@esparex/core/utils`)
*(Under Active Migration - Project E)*

*The exact public utility functions are being curated.*
