# 18. Data Flow Analysis

This catalog maps business workflows rather than isolated endpoints, tracking how data moves through the architecture.

## 1. User Registration Flow
```text
Web Client
   ↓ (POST /api/auth/register)
Auth API (authRoutes.ts)
   ↓ 
Validation (Zod Schema)
   ↓
Auth Service (Core)
   ↓ (Generates OTP)
OTP Service (SMS/Email)
   ↓
User Model (MongoDB)
   ↓ (Generates JWT)
Response (JWT Cookie)
   ↓
Web Dashboard
```

## 2. Ad Creation Flow (Listing)
```text
Web Form
   ↓ (Multipart Form Data)
Validation (Zod + File size limits)
   ↓ (POST /api/listings)
Listings API (listingRoutes.ts)
   ↓
Listing Service (Core)
   ↓ (Validates taxonomy)
Category/Brand/Model Validation
   ↓ (Uploads images)
S3 Storage Service
   ↓ (Persists listing)
Ad Model (MongoDB)
   ↓
Response (201 Created)
```

## 3. Admin Master Data Approval Flow
```text
Admin UI
   ↓ (POST /api/admin/catalog/brands)
Admin API (adminCatalogRoutes.ts)
   ↓
Approval Service (Core)
   ↓
Brand Model (MongoDB)
   ↓
Event Emitter (Optional)
   ↓
Smart Alert / Notification Service
```
