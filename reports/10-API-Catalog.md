# 10. API Catalog

## API Routing Architecture
The backend Express application (`backend/user`) maps routes by domains.

### Endpoints Inventory
* **Auth API (`authRoutes.ts`):** `/api/auth/login`, `/api/auth/verify-otp`, `/api/auth/register`. Middleware includes standard rate limiting.
* **Listings API (`listingRoutes.ts`):** `/api/listings` (GET/POST). Includes validation middleware using `@esparex/shared` schemas.
* **Catalog API (`catalogRoutes.ts`):** `/api/catalog/brands`, `/api/catalog/categories`. Read-only for users.
* **Admin Catalog API (`adminCatalogRoutes.ts`):** `/api/admin/catalog/*`. Write-access to Master Data. Guarded by Admin Auth middleware.
* **Chat API (`chatRoutes.ts`):** `/api/chat/conversations`. Works in tandem with Socket.IO for real-time delivery.
* **Smart Alerts API (`smartAlertRoutes.ts`):** `/api/smart-alerts` for users to manage their saved searches.

### Quality Gate Status
* **Verification:** Confirmed route files exist. Detailed extraction of all exact HTTP methods and middleware requires AST parsing (Pending complete Phase 10 validation).
