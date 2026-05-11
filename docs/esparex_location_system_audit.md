# Esparex Post Ad Location System - Enterprise Audit & Architecture

## 1. Executive Summary
This document presents the complete architectural design and audit for the Esparex Post Ad Location System. It strictly enforces a Single Source of Truth (SSOT) where location data is governed exclusively by standard GeoJSON `[longitude, latitude]` formats, deeply integrated with MongoDB `2dsphere` indexes, and universally synced across frontend, backend, and admin dashboard layers.

## 2. Frontend Architecture
- **State Management**: React Hook Form (RHF) integrated with a unified `LocationContext`.
- **UI Components**:
  - `LocationSelector.tsx`: The main orchestration component handling manual searches and auto-detect triggers.
  - `AutoDetectButton.tsx`: Handles HTML5 Geolocation API interactions.
  - `LocationBottomSheet.tsx`: Mobile-first UX container.
- **Data Flow**:
  1. User triggers auto-detect or manual search.
  2. Coordinates/Search term dispatched to `useResolveLocation` or `useLocationSearch`.
  3. Canonical `Location` object returned.
  4. RHF state updated via `setValue('locationId', id, { shouldValidate: true, shouldDirty: true })`.

## 3. Backend Architecture
- **Controller Boundary**: `location.controller.ts` exposes canonical APIs. No parallel routing.
- **Service Layer**: 
  - `LocationResolutionService.ts`: Handles reverse geocoding via external map providers (e.g., Google Maps) and determines if auto-creation is necessary.
  - `LocationOrchestrator.ts`: Manages caching, Atlas Search queries, and database writes for new locations.
- **Unified Listings Binding**: The `/api/v1/listings` API references location strictly by `locationId`. The denormalized GeoJSON is resolved securely by the backend during listing creation.

## 4. MongoDB Schemas

```typescript
// core/src/models/Location.ts
import { Schema, model } from 'mongoose';

const LocationSchema = new Schema({
    slug: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    district: { type: String },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    pincode: { type: String, required: true },
    formattedAddress: { type: String, required: true },
    landmark: { type: String },
    aliases: [{ type: String }],
    coordinates: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    source: { type: String, enum: ['USER_DETECT', 'ADMIN_CREATE', 'SYSTEM_SEED'], required: true },
    searchCount: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Strict 2dsphere and Search Indexes
LocationSchema.index({ coordinates: '2dsphere' });
LocationSchema.index({ city: 1, state: 1 });
LocationSchema.index({ pincode: 1 });
LocationSchema.index({ slug: 1 });
```

## 5. API Contracts

### User APIs
- `POST /api/v1/locations/resolve`: Accepts raw coordinates/address, executes reverse geocoding, auto-creates if missing, returns canonical `Location`.
- `GET /api/v1/locations/search?q={query}`: Fuzzy Atlas search.
- `GET /api/v1/locations/nearby?lng={x}&lat={y}&radius={z}`: `2dsphere` query.
- `GET /api/v1/locations/popular`: Returns cached top-searched locations.
- `GET /api/v1/locations/:id`: Canonical lookup.

### Admin APIs
- `GET /admin/locations`
- `PATCH /admin/locations/:id`: Modify statuses (approve/block).
- `POST /admin/locations/merge`: Merges duplicate locations (re-parents listing dependencies).

## 6. Admin Module Design
- **Verification Queue**: UI list of newly auto-created (`isVerified: false`) locations.
- **Merge Tool**: Side-by-side comparison of two locations allowing admins to merge the source into the target. Updates all `Listing.locationId` references safely in a transaction.
- **Security Guard**: Coordinates are strictly read-only in the dashboard to prevent data skew. Any coordinate change requires a system-level re-resolution.

## 7. React Hooks
- `useLocationSearch(query)`: Debounced (300ms) query to `/locations/search`.
- `useCurrentLocation()`: Wraps `navigator.geolocation.getCurrentPosition`.
- `useResolveLocation()`: Mutation hook mapping raw GPS to `POST /locations/resolve`.

## 8. Zod Schemas
```typescript
export const GeoJSONSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
        z.number().min(-180).max(180), // Longitude
        z.number().min(-90).max(90)    // Latitude
    ])
});

export const LocationResolutionPayloadSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    formattedAddress: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional()
});
```

## 9. GeoJSON Validators
The system universally rejects legacy `[lat, lng]` or flat `latitude`/`longitude` objects. The database pre-save hooks and Zod schemas enforce exactly `[lng, lat]` tuples. Invalid vectors (e.g. `[0,0]` / Null Island) are explicitly rejected by custom Zod `.refine()` logic.

## 10. Atlas Search Configuration
Configured on `aliases`, `city`, `district`, `state`, and `pincode` using custom analyzers for autocomplete (edgeNgram) to achieve `<300ms` keystroke response times.

## 11. SSR-Safe Strategy
The `<LocationSelector />` component skips rendering `navigator.geolocation` triggers on the server. Default popular locations are hydrated via SSR, while specific GPS prompts are mounted safely inside `useEffect` (Client-side).

## 12. Error Handling Strategy
- **GPS Denied**: Graceful fallback to `Manual Search` UI with clear tooltip.
- **Reverse Geocode Failure**: Graceful degradation to manual pin-drop / manual entry.
- **Network Failure**: Retry boundary on `useResolveLocation` with exponential backoff.

## 13. Security Audit
- **Spoof Protection**: Backend rate-limits `/locations/resolve` (e.g. 5 requests per IP per minute) to prevent artificial location farming.
- **Input Sanitization**: All address inputs are stripped of HTML tags and normalized.

## 14. Duplicate Logic Report
*Requires codebase audit execution.* Any legacy `lat/lng` flat fields in the `Listings` schema must be eradicated in favor of referencing the SSOT `Location` object.

## 15. Dead Code Report
*Requires codebase audit execution.* Any legacy hooks like `useLegacyGeo` or endpoints targeting `/api/v1/ads/location` must be marked for deletion.

## 16. Complete UI/UX Flow
1. User sees "Location" card.
2. Clicks "Use Current Location".
3. Spinner mounts -> Browser prompts for permission.
4. Accepted -> GPS coordinates pulled.
5. Coordinates sent to `/resolve`.
6. Resolved Canonical Location returned.
7. Card transitions to "Success" state showing Map Preview and Formatted Address.

## 17. Mobile UX Flow
Executed via a sliding Bottom Sheet modal. Touch targets are minimum `48px`. The "Use Current Location" button is sticky at the top of the sheet. Popular cities are displayed as tap-friendly chips.

## 18. Edge Case Handling
- **Null Island [0,0]**: Strictly blocked by schema.
- **Missing City**: `ResolveService` maps to District or State if City is unavailable.
- **Extremely Low Accuracy GPS**: UI prompts user to manually verify location if GPS accuracy exceeds 2000 meters.

## 19. Manual QA Checklist
- [ ] Decline GPS permission -> Verify fallback UI.
- [ ] Accept GPS -> Verify auto-resolution creates record (if new) or fetches existing.
- [ ] Submit Ad -> Verify `listing.locationId` correctly binds to the resolved location.
- [ ] Test Search -> Type "Mum" -> Verify "Mumbai" returns within 300ms.

## 20. Production Deployment Checklist
- [ ] Run MongoDB `2dsphere` index build in background.
- [ ] Deploy Atlas Search index.
- [ ] Run Database Migration Script (`lat/lng` to `locationId` refs).
- [ ] Invalidate legacy Redis location caches.
- [ ] Monitor `/locations/resolve` rate limiting metrics.
- [ ] Run e2e tests for GPS spoofing protections.
