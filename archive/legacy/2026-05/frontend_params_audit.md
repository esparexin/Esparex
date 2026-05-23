# Esparex Admin Frontend Query Parameter & State Audit

This document delivers a complete developer audit of the URL query parameters parsed, dynamic hooks managed, and route state synchronizations used across the Next.js `apps/admin` workspace. 

Maintaining strict alignment on frontend parameters prevents routing bugs, facilitates deep linking, and ensures audit trail logs match platform configurations.

---

## 1. Global Navigation & Authentication

### Login Route (`/login`)
Handles post-authentication routing redirects by parsing target landing pages.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `next` | Redirection Target Path | String (Normalized relative path / no open redirect) | `/dashboard` | `login/page.tsx` |

---

## 2. Directory & Device Taxonomy

### Device Taxonomy Catalog (`/device-catalog`, `/brands`, `/models`, etc.)
Manages catalog tabs and search query states with debounced synchronization back to URL.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `tab` | Active Catalog Tab | `"categories"` \| `"brands"` \| `"models"` \| `"screen-sizes"` \| `"service-types"` \| `"spare-parts"` \| `"catalog-requests"` | `"categories"` (legacy `"device-categories"` accepted and normalized) | `DeviceCatalogTabs.tsx` |
| `q` / `search` | Filter Query Keyword | String (Debounced search input) | `""` | `useCatalogQueryStateSync.ts` |
| `page` | Pagination Index | Positive Integer | `1` | `useCatalogQueryStateSync.ts` |

### Locations Master Catalog (`/locations`)
Synchronizes regional hierarchical locations (States, Cities, and Areas).

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `q` / `search` | Location Keyword Search | String (Matches name, state or slug) | `""` | `locations/page.tsx` |
| `status` | Location Activity State | `"all"` \| `"active"` \| `"inactive"` | `"all"` | `locations/page.tsx` |
| `state` | State Scoping Filter | String (Matches specific state name) | `"all"` | `locations/page.tsx` |
| `level` | Hierarchy Level Filter | `"all"` \| `"state"` \| `"city"` \| `"area"` | `"all"` | `locations/page.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `locations/page.tsx` |

### Geographic Analytics (`/locations/analytics`)
Scopes hot zone activity and listing distribution metrics.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `city` | Scoped City Name | String (Debounced search input) | `null` | `locations/analytics/page.tsx` |
| `district` | Scoped District Name | String (Debounced search input) | `null` | `locations/analytics/page.tsx` |
| `state` | Scoped State Name | String (Matches distinct state array) | `""` (All States) | `locations/analytics/page.tsx` |
| `country` | Scoped Country Name | `"India"` \| `""` | `""` (All Countries) | `locations/analytics/page.tsx` |

---

## 3. Operations & Listing Moderation

### Listing Moderation Filters (`/ads`)
The most complex query reducer, synchronizing catalog listings, seller targets, and warning thresholds.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `listingType` | Listing Category | `"ad"` \| `"service"` \| `"spare_part"` | `"ad"` | `useAdFilters.ts` |
| `status` | Listing Life State | `"pending"` \| `"live"` \| `"rejected"` \| `"deactivated"` \| `"sold"` \| `"expired"` \| `"all"` | `"live"` | `useAdFilters.ts` |
| `sellerId` | Target User Scope | String (Matches seller UUID) | `null` | `useAdFilters.ts` |
| `q` / `search` | Plain-text Search Query | String | `""` | `useAdFilters.ts` |
| `locationId` | Regional Target Scope | String (Matches Location ID) | `null` | `useAdFilters.ts` |
| `sort` | Result Ordering | `"newest"` \| `"oldest"` \| `"price_high"` \| `"price_low"` | `"newest"` | `useAdFilters.ts` |
| `dateFrom` | Bounds Start Date | Date String (`YYYY-MM-DD`) | `null` | `useAdFilters.ts` |
| `dateTo` | Bounds End Date | Date String (`YYYY-MM-DD`) | `null` | `useAdFilters.ts` |
| `expiryWarningStatus` | Expiring Email Filter | `"sent"` \| `"not_sent"` \| `"all"` | `"all"` | `useAdFilters.ts` |
| `expiringWithinDays` | Expiring Duration Days | Positive Integer | `null` | `useAdFilters.ts` |
| `spotlightWarningStatus` | Promo Email Filter | `"sent"` \| `"not_sent"` \| `"all"` | `"all"` | `useAdFilters.ts` |
| `spotlightExpiringWithinDays` | Promo Expiry Threshold | Positive Integer | `null` | `useAdFilters.ts` |
| `catalogPending` | Uncategorized Listing Filter| `"true"` \| `null` | `null` | `useAdFilters.ts` |
| `page` | Pagination Index | Positive Integer | `1` | `useAdFilters.ts` |
| `limit` | Page Sizing Limit | Positive Integer | `20` | `useAdFilters.ts` |

### Business Master View (`/businesses`)
Controls business verification states, warning histories, and bulk management.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `status` | Active View Tab | `"live"` \| `"suspended"` \| `"pending"` \| `"deleted"` \| `"all"` | `"live"` | `BusinessesView.tsx` |
| `q` / `search` | Keyword Filter | String (Matches name, mobile, email) | `""` | `BusinessesView.tsx` |
| `locationId` | Location Filter ID | String (Matches target location ID) | `null` | `BusinessesView.tsx` |
| `expiringIn3Days` | 72h Expiring Filter | `"true"` \| `null` | `null` | `BusinessesView.tsx` |
| `warningSent` | Expiry Warning Filter | `"true"` \| `null` | `null` | `BusinessesView.tsx` |
| `warningNotSent` | Missing Warning Filter | `"true"` \| `null` | `null` | `BusinessesView.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `BusinessesView.tsx` |

### Listing Reports & Moderation Queue (`/reports`)
Audits platform complaints, reported listings, and user flags.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `status` | Queue Priority Status | `"all"` \| `"open"` \| `"pending"` \| `"reviewed"` \| `"resolved"` \| `"dismissed"` | `"open"` | `reports/page.tsx` |
| `q` / `search` | Plain-text Search | String (Matches listing title/report details) | `""` | `reports/page.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `reports/page.tsx` |

---

## 4. Finance & Subscriptions

### Transaction Auditing (`/finance`)
Monitors overall wallet deposits, transaction fees, and payment gateway responses.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `q` / `search` | Payment Scope Search | String (Matches Payment ID, User or description) | `""` | `finance/page.tsx` |
| `status` | Gateway Transaction State | `"all"` \| `"SUCCESS"` \| `"FAILED"` \| `"INITIATED"` | `"all"` | `finance/page.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `finance/page.tsx` |

### Invoices View (`/invoices`)
Lists official billing statements, subscription renewals, and sales taxes.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `q` / `search` | Invoice Key Filter | String (Matches name, mobile, email, number) | `""` | `invoices/page.tsx` |
| `status` | Invoices State Filter | `"all"` \| `"PENDING"` \| `"SUCCESS"` \| `"FAILED"` \| `"CANCELLED"` | `"all"` | `invoices/page.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `invoices/page.tsx` |

### Plans & Packages (`/plans`)
Configures subscription tier listings and ad pack purchase items.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `q` / `search` | Plan Keyword search | String (Matches name or plan code) | `""` | `plans/page.tsx` |
| `type` | Subscription Limit Type | `"all"` \| `"AD_PACK"` \| `"SPOTLIGHT"` \| `"SMART_ALERT"` | `"all"` | `plans/page.tsx` |

---

## 5. Security & System Administration

### Platform Users Management (`/users`)
Lists, bans, blocks, and validates individual client and business accounts.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `status` | Account Life Status | `"all"` \| `"live"` (Active) \| `"suspended"` \| `"banned"` | `"all"` | `users/page.tsx` |
| `isVerified` | User Verification Scope | `"all"` \| `"true"` \| `"false"` | `"all"` | `users/page.tsx` |
| `q` / `search` | User Search Filter | String (Matches name, email or mobile) | `""` | `users/page.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `users/page.tsx` |

### System Administration Users (`/admin-users`)
Manages back-office access rights, staff keys, and operations dashboards.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `view` | Selected Interface Layout | `"permissions"` \| `null` | `null` | `admin-users/page.tsx` |

### Platform Settings (`/settings`)
Synchronizes configuration subsets inside the centralized SystemConfig schema.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `tab` | Active Config Panel | `"platform"` \| `"listing"` \| `"moderation"` \| `"notifications"` \| `"payments"` \| `"security"` \| `"location"` | `"platform"` | `settings/page.tsx` |

### Security Audit Logs (`/security/audit`)
Maintains back-office compliance and operations tracing.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `q` / `search` | Log Keyword Search | String (Matches Action, Admin, Target ID) | `""` | `audit/page.tsx` |
| `action` | Operational Action Type | `"all"` \| `"LOGIN"` \| `"ADJUST_WALLET"` \| `"APPROVE_AD"` \| `"BAN_USER"` \| `"UPDATE_SYSTEM_CONFIG"` \| ... | `"all"` | `audit/page.tsx` |
| `targetType` | Target Asset Category | `"all"` \| `"Ad"` \| `"Business"` \| `"SmartAlert"` \| `"ExpiryWarning"` \| `"SpotlightPromotion"` \| `"User"` \| `"System"` | `"all"` | `audit/page.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `audit/page.tsx` |

### Notifications & Composer Queue (`/notifications`)
Controls notifications history log filters.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `q` / `search` | History Keyword Filter | String (Matches title or body search) | `""` | `useNotifications.ts` |
| `status` | Delivery Status Filter | `"all"` \| `"sent"` \| `"failed"` \| `"scheduled"` | `"all"` | `useNotifications.ts` |
| `targetType` | Target Audience Filter | `"all"` \| `"topic"` \| `"users"` \| `"any"` | `"any"` | `useNotifications.ts` |
| `page` | Pagination Index | Positive Integer | `1` | `useNotifications.ts` |

### Chat Moderation (`/chat`)
SILENCES/Moderates interactive chat threads between platform buyers and sellers.

| Query Parameter | Target State Variable | Type / Constraints | Default Value | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| `filter` | Thread Context Filter | `"all"` \| `"reported"` \| `"high_risk"` \| `"blocked"` \| `"closed"` | `"all"` | `AdminChatView.tsx` |
| `q` / `search` | Target Match Search | String (Matches Buyer, Seller, Ad, Conv ID) | `""` | `AdminChatView.tsx` |
| `page` | Pagination Index | Positive Integer | `1` | `AdminChatView.tsx` |
