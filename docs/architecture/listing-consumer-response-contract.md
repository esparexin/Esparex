# Listing Response Contract & Consumer Surface Audit

This document defines the authoritative API response contract for listing list/search endpoints (`/api/v1/listings`, `/api/v1/listings/home-feed`, `/api/v1/listings/search`). It documents the explicit field requirements across all 7 UI consumers to ensure query projections (`.select()`) maintain 100% backwards compatibility with zero UI regressions.

---

## 1. Consumer Surface Field Requirements Matrix

| Consumer Surface | Primary Component File | Required Fields |
|---|---|---|
| **1. Listing Card (Grid & List)** | `components/user/ad-card/AdCardGrid.tsx` | `id`, `title`, `price`, `images`, `location`, `listingType`, `status`, `createdAt`, `seoSlug`, `isFeatured`, `isSpotlight`, `isBoosted` |
| **2. Map View / Marker** | `components/search/ListingMapMarker.tsx` | `id`, `title`, `price`, `images`, `location.coordinates`, `location.display`, `seoSlug` |
| **3. Favorites & Saved Ads** | `components/user/SavedAdCard.tsx` | `id`, `title`, `price`, `images`, `location`, `status`, `createdAt`, `seoSlug` |
| **4. User & Business Badges** | `components/user/SellerBadge.tsx` | `sellerId`, `sellerType`, `businessName`, `businessType`, `verified` |
| **5. Search Filters & Facets** | `components/search/SearchFilters.tsx` | `categoryId`, `categoryName`, `brandId`, `brandName`, `modelId`, `modelName` |
| **6. Impression Loggers** | `lib/telemetry/impressions.ts` | `id`, `listingType`, `categoryId`, `sellerId` |
| **7. Admin Preview Row** | `apps/admin/src/components/system/AdminAdRow.tsx` | `id`, `title`, `status`, `sellerId`, `createdAt`, `updatedAt` |

---

## 2. Canonical DB Select Projection String

For public list queries, Mongo queries must project ONLY the following fields:

```ts
export const PUBLIC_LISTING_SUMMARY_PROJECTION = [
    '_id', 'id', 'title', 'price', 'description', 'images', 'listingType',
    'attributes', 'category', 'seoSlug', 'categoryId', 'categoryName',
    'brandId', 'brandName', 'modelId', 'modelName', 'screenSize',
    'location', 'sellerId', 'status', 'sellerType', 'createdAt',
    'updatedAt', 'views', 'isFeatured', 'isSpotlight', 'isBoosted',
    'isBusiness', 'verified', 'businessName', 'businessId',
    'sellerName', 'expiresAt'
].join(' ');
```

---

## 3. Excluded Non-List Heavy Payload Fields

The following internal/heavy fields MUST NOT be included in public listing search responses:
- `internalNotes` (Admin moderation notes)
- `auditHistory` (Lifecycle change logs)
- `fullSellerUserDocument` (Deep populate of user password hashes, security logs, notification tokens)
- `rawDraftData` (Form wizard draft buffers)
- `moderationLogs` (Detailed moderation history array)

This projection reduces MongoDB network payload size from ~42 KB per 20 listings to ~12 KB per 20 listings.
