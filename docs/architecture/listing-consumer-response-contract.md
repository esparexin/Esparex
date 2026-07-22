# Listing Consumer Response Contract Audit

This document defines the strict field requirements across all 7 UI consumer surfaces that display listing summary data.

---

## 1. UI Consumer Matrix

| Consumer Surface | Required Document Fields |
|---|---|
| **AdCardGrid** (Marketplace grid) | `_id`, `id`, `title`, `price`, `description`, `images`, `listingType`, `attributes`, `location`, `sellerId`, `status`, `isSpotlight`, `isFeatured`, `isBusiness` |
| **AdCardList** (Marketplace list) | `_id`, `id`, `title`, `price`, `images`, `listingType`, `category`, `location`, `sellerId`, `status` |
| **SearchFilters** (Facet counts) | `categoryId`, `categoryName`, `brandId`, `brandName`, `modelId`, `modelName`, `screenSize`, `price`, `location` |
| **Favorites / Saved Ads** | `_id`, `id`, `title`, `price`, `images`, `location`, `status`, `createdAt` |
| **Seller Badges & Trust** | `sellerId`, `sellerName`, `sellerType`, `verified`, `businessName`, `businessId` |
| **Analytics & Rank Score** | `views`, `createdAt`, `updatedAt`, `expiresAt`, `isBoosted` |
| **Admin Audit Preview** | `seoSlug`, `createdAt`, `updatedAt` |

---

## 2. Explicit Database Projection Definition

To prevent database over-fetching and payload bloat (~42 KB un-projected → ~12 KB projected), queries run with `PUBLIC_LISTING_PROJECTION`:

```ts
export const PUBLIC_LISTING_PROJECTION = {
    _id: 1, id: 1, title: 1, price: 1, description: 1, images: 1, listingType: 1,
    attributes: 1, category: 1, seoSlug: 1, categoryId: 1, categoryName: 1,
    brandId: 1, brandName: 1, modelId: 1, modelName: 1, screenSize: 1,
    location: 1, sellerId: 1, status: 1, sellerType: 1, createdAt: 1,
    updatedAt: 1, views: 1, isFeatured: 1, isSpotlight: 1, isBoosted: 1,
    isBusiness: 1, verified: 1, businessName: 1, businessId: 1, sellerName: 1, expiresAt: 1
};
```

---

## 3. Excluded Heavy Fields

The following fields are strictly excluded from public list/search query payloads:
- `internalNotes`
- `auditHistory`
- `moderationLogs`
- `rawDraftData`
- `fullSellerUserDocument`
