# Home Feed Listing Type & Location Architecture Audit

## Problem Statement

When selecting **India** (or a specific location) on the Home Page:
- Switching to the **Services** or **Spare Parts** tab results in:
  - `"No services available right now."` or `"No spare parts available right now."`
- The **All** tab only returns device ads (`listingType: 'ad'`), never services or spare parts.
- The database contains live Services (72) and Spare Parts (72) across India, which are never displayed on the Home Feed.

---

## Complete Data Flow Audit

```text
1. User Gestures: Select Location ("India" / City) & Tab ("All" | "Devices" | "Services" | "Spare Parts")
   └── HomeFeedClient.tsx
2. Client Query Generation:
   └── useHomeAdsQuery(requestParams) -> getHomeAds (listingDiscoveryAPI.ts)
3. API Gateway:
   └── GET /api/v1/listings/home?locationId=...&level=...&listingType=...
4. Backend Validation & Controller:
   └── homeFeedQuerySchema validates query -> getHomeFeed (getListings.controller.ts)
5. Discovery Domain Service:
   └── feedService.getHomeFeedAds -> FeedCacheService (type-partitioned cache key)
6. Query Engine:
   └── FeedQueryService.buildHomeFeed -> queries MongoListingRepositoryAdapter with dynamic listingType
7. Database Retrieval:
   └── Returns typed listing entities (Ad | Service | Spare Part)
8. Response Normalization:
   └── Returns typed DTOs to HomeFeedClient -> rendered by AdCardGrid
```

---

## Root Causes Identified

1. **`FeedQueryService.ts:L31-33`**:
   `baseFilter: ListingFilter = { listingType: LISTING_TYPE.AD };` hardcoded the feed to device ads only. Services and spare parts were never queried.
2. **`FeedCacheService.ts:L21`**:
   `buildHomeFeedCacheKey` lacked `listingType` in the cache key string, which would cause cache collisions between tabs.
3. **`FeedCursorService.ts:L10`**:
   `HomeFeedRequest` interface omitted `listingType`.
4. **`ad.validator.ts:L164`**:
   `homeFeedQuerySchemaBase` omitted `listingType`.
5. **`getListings.controller.ts:L306`**:
   `getHomeFeed` did not extract or pass `query.listingType` to `getHomeFeedAds`.
6. **`listingDiscoveryAPI.ts:L200`**:
   `getHomeAds` omitted `listingType` from query params.
7. **`HomeFeedClient.tsx:L157-160`**:
   `HomeFeedClient` did not pass `selectedType` to the backend query, instead attempting in-memory filtering of an ads-only dataset.

---

## Canonical SSOT Ownership

- **Location**: `LocationData` / `AppLocation` via `LocationContext` (`@esparex/contracts`).
- **Listing Type**: Canonical `ListingTypeValue` union (`"ad" | "service" | "spare_part"` from `@esparex/contracts`).
- **Query Pipeline**: `FeedQueryService.buildHomeFeed` with dynamic `listingType`.
- **Cache**: `buildHomeFeedCacheKey` partitioned by `location + type + sort + cursor + limit`.
- **UI Tab**: Single responsive `ListingTypeTabs` component driving `selectedType`.
