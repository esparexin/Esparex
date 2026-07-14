# Canonical Implementation Flows

This reference details the mandatory code execution flows across the Esparex platform. All new form submissions and service operations must adhere strictly to these architectural tracks.

---

## 1. Unified Listing Form Submission Flow

```mermaid
graph TD
    UI[Web / Admin Form View]
    RHF[React Hook Form Controller]
    ZOD[Shared Zod Validator Schema]
    S3[Sequential S3 Pre-upload /api/upload/ad-image]
    REQ[HTTP API request with S3 URLs array]
    CTRL[Thin Controller validation middleware]
    SERV[Core Service Mongoose transactions]
    DB[(MongoDB Collections)]

    UI --> RHF
    RHF -->|validate shape| ZOD
    UI -->|Image selection| S3
    S3 -->|Retrieve S3 URLs| REQ
    REQ -->|POST/PATCH| CTRL
    CTRL -->|validate request schema| SERV
    SERV -->|Soft delete / query| DB
```

### Flow Execution Steps
1. **User enters data** in Web or Admin view portals.
2. **React Hook Form (RHF)** processes inputs using `zodResolver(schema)`.
3. **Form Schema** derives its Zod constraints (min/max lengths, strings) by picking and composing fields from shared schemas in `@esparex/shared`.
4. **Image Uploads** (for ads, service listings, spare parts):
   - Handled via `useListingImages` hook.
   - Files are validated locally, deduplicated using MD5 hashes, and compressed.
   - Sent sequentially to `/api/upload/ad-image`.
   - Form state stores only the resulting S3 URL string array.
5. **JSON Request Body** (containing S3 URL references instead of raw binary data or base64) is posted to the backend routes.
6. **Express Route Handler** executes request validation middleware.
7. **Controller** extracts body contents and calls the matching core service class.
8. **Core Service** opens a mongoose session, runs business logic, and saves the document to MongoDB.

---

## 2. Global Search Flow
- **State Management**: Search values and pagination parameter logic must be managed by the canonical `useHeaderSearch` hook.
- **Header Component Mappings**: Both `UserHeader.tsx` (desktop view) and `MobileHeader.tsx` (mobile view) must consume standard query handlers from `useSharedHeaderLogic.ts`. Do **not** write independent, page-local search input query states.
