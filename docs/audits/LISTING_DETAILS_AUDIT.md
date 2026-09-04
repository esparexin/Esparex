# Listing Details Screen: Complete End-to-End Audit & Dependency Map

**Scope**: Mobile (Android & iOS), Backend API, Core Domain, Database, Contracts  
**Branch**: `feat/listing-details-audit-and-remediation`  
**Date**: September 2026

---

## 1. End-to-End Dependency Architecture

```
Mobile UI Layer
├── ListingDetailsScreen.tsx (Main orchestrator screen)
│   ├── ImageCarousel.tsx (Media swipe gallery)
│   ├── PriceSection.tsx (Formatted price, title, attributes)
│   ├── SellerSection.tsx (Seller profile, verified badge)
│   ├── AvailableSparePartsSection.tsx (Spare parts breakdown)
│   ├── DescriptionSection.tsx (Item description)
│   ├── SafetyTipsSection.tsx (Safety reminder & report CTA)
│   ├── NearbyRepairServicesSection.tsx (Verified local shops)
│   ├── ReportAdModal.tsx (Reason selection & text sheet)
│   └── ActionBar.tsx (Floating dynamic CTA bar)
│
├── Mobile Hooks Layer
│   ├── useListingDetails.ts -> services.listingService.getListingDetails(id)
│   ├── useToggleSaveListing.ts -> services.listingService.toggleSaveListing(id, isSaved)
│   ├── useSavedListings.ts -> services.listingService.getSavedListings()
│   ├── useNearbyBusinesses.ts -> services.businessService.getNearbyBusinesses(params)
│   └── useProfile.ts -> services.userService.getProfile()
│
├── Mobile Application & Infrastructure Layer
│   ├── ListingService.ts (Facade delegating to IListingRepository)
│   ├── ApiListingRepository.ts (HTTP client adapter via Axios)
│   ├── ListingMapper.ts (Maps raw Ad DTO -> Listing domain entity)
│   └── BusinessService.ts / ApiBusinessRepository.ts
│
├── Backend API Routing & Middleware
│   ├── GET /api/v1/listings/:id (extractUser, validateIdOrSlug, getListingDetail)
│   ├── GET /api/v1/listings/:id/view (validateObjectId, incrementListingView)
│   ├── GET /api/v1/listings/:id/phone (validateObjectId, extractUser, getListingPhone)
│   ├── POST /api/v1/users/saved-ads (protect, validateRequest, saveAd)
│   ├── DELETE /api/v1/users/saved-ads/:adId (protect, unsaveAd)
│   ├── POST /api/v1/chat/start (protect, startChat)
│   ├── POST /api/v1/reports (protect, validateRequest, createReport)
│   └── GET /api/v1/businesses (searchLimiter, validateRequest(publicBusinessQuerySchemaBase))
│
└── Core Domain & Persistence
    ├── AdDetailService.ts (getListingDetailById, getAdIdBySlug)
    ├── AdEngagementService.ts (incrementAdViewByFilter, ViewBufferingService)
    ├── ContactRevealService.ts (getSellerPhone, logPhoneReveal, maskPhone)
    ├── BusinessSearchService.ts (getBusinesses)
    └── Models: Ad, User, Business, PhoneRevealLog, PhoneRequest, Report
```

---

## 2. Component & Feature Inventory

| Component / Feature | Active File Path | State / Responsibility | Health Status |
|---|---|---|---|
| Screen Container | `apps/mobile/.../screens/ListingDetailsScreen.tsx` | Coordinates data fetching, state, actions | ⚠️ Needs real phone reveal, view tracking & auth checks |
| Image Carousel | `apps/mobile/.../details/ImageCarousel.tsx` | FlatList horizontal carousel, pagination | ⚠️ Needs useWindowDimensions & WCAG touch target hitSlop |
| Price & Title | `apps/mobile/.../details/PriceSection.tsx` | Formatted price, item title | ⚠️ Missing location, condition badge & category |
| Seller Card | `apps/mobile/.../details/SellerSection.tsx` | Avatar, seller name, verified badge | ✅ Functional |
| Spare Parts Breakdown | `apps/mobile/.../details/AvailableSparePartsSection.tsx` | Chips list of compatible spare parts | ✅ Functional |
| Description Card | `apps/mobile/.../details/DescriptionSection.tsx` | Full description text display | ✅ Functional |
| Safety Tips | `apps/mobile/.../details/SafetyTipsSection.tsx` | In-person trade safety guidelines | ✅ Functional |
| Nearby Repair Shops | `apps/mobile/.../details/NearbyRepairServicesSection.tsx` | Horizontal cards of local repair businesses | ❌ Broken: Queries with rejected aliases `city` & `category` |
| Report Ad Modal | `apps/mobile/.../details/ReportAdModal.tsx` | Modal sheet with predefined report reasons | ⚠️ Missing unauthenticated guard |
| Action Bar | `apps/mobile/.../details/ActionBar.tsx` | Bottom sticky action bar (Dynamic Owner/Buyer) | ✅ Functional |

---

## 3. Confirmed Broken Flows & Root Causes

### Root Cause 1: Hardcoded Dummy Phone Number
- **Symptom**: Buyer tapping "Call Seller" dials `1800000000`.
- **Root Cause**: Mobile UI bypassed backend API integration because `IListingRepository` had no method for `getListingPhone`.

### Root Cause 2: Nearby Repair Services Broken Query
- **Symptom**: Nearby Repair Services section never appears on mobile.
- **Root Cause**: Backend's `publicBusinessQuerySchema` strictly rejects `city` and `category` query parameters with a 400 error. Mobile's `ApiBusinessRepository` caught the 400 and returned `[]`. In addition, `ListingMapper.ts` dropped `locationId` and `categoryId` from the `Ad` DTO.

### Root Cause 3: Missing View Tracking
- **Symptom**: Listing view counter does not increment when mobile users view a listing.
- **Root Cause**: `incrementListingView` was never wired in mobile `ListingService` or `ListingDetailsScreen`.

### Root Cause 4: Orphaned Comment in Backend
- **Symptom**: Stale dangling comment block in `core/src/domains/listings/application/ad/ad/AdDetailService.ts` (lines 387-391).
- **Root Cause**: Incomplete cleanup during earlier refactoring.
