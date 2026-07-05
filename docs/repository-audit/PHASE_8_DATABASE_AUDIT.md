# Phase 8: Database Audit Report

## 1. Executive Summary
A database audit of the Mongoose models in `@esparex/core` was conducted to verify schema field configurations, relationship validations, index configurations, and structural alignment with the Domain Model SSOT. The audit revealed a critical discrepancy between the actual runtime collection name (`ads`) and the SSOT-defined collection name (`listings`), severe index inflation (30+ indexes) on the main Classified Ads collection, and field overlaps (e.g. `status`, `isDeleted`, and `moderationStatus`).

---

## 2. Scope
This audit inspected:
- Mongoose model files under `core/src/models/`
- Alignment with [Domain Model SSOT](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/ssot/DOMAIN_MODEL_SSOT.md)
- Geolocation GeoJSON Point compliance (longitude/latitude index ordering)
- Index layout and potential overlap/redundancy
- Key constraints and relationship structures

---

## 3. Inventory
- **Monitored Collections**: 60 Mongoose models mapped to database collections, including:
  - `users` (via `User.ts`)
  - `ads` (via `Ad.ts`)
  - `businesses` (via `Business.ts`)
  - `locations` (via `Location.ts`)
  - `conversations` & `chatmessages` (via `Conversation.ts` & `ChatMessage.ts`)
  - `system_configs` (via `SystemConfig.ts`)

---

## 4. Findings

### Critical Severity Findings
1. **SSOT Database Collection Name Discrepancy (Ads vs. Listings)**
   - **Finding**: Section 4 of the [Domain Model SSOT](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/ssot/DOMAIN_MODEL_SSOT.md#L74) lists the canonical collection name as `listings` (Mongoose Model: `Listing`). In the actual codebase, there is no `Listing` model; the model is named `Ad.ts`, which compiles without a custom collection configuration. This results in Mongoose registering the model under the database collection `ads`.
   - **Impact**: Contradicts the SSOT documentation, causing confusion for developers mapping queries or writing direct database migrations.

---

### High Severity Findings
2. **Severe Index Inflation on the Classified Ads (`ads`) Collection**
   - **Finding**: The `Ad` schema defines over 30 separate indexes (lines 290–425 in `Ad.ts`). Many of these indexes overlap or are redundant. For example:
     - Compound index `{ sellerId: 1, status: 1 }` coexists with `{ sellerId: 1, createdAt: 1 }`.
     - Multiple single-field indexes (`duplicateScore`, `isDuplicateFlag`, `fraudScore`, `isSpotlight`, `duplicateOf`, `modelId`) are maintained alongside compound indexes sharing similar prefixes.
   - **Impact**: Drastically degrades MongoDB write performance (inserts, updates, soft deletes) because every write must update 30+ separate B-Tree and 2dsphere index trees. This also inflates MongoDB RAM consumption.

3. **State Overlap and Lack of Hard Constraints**
   - **Finding**: In `Ad.ts`, the soft-delete status is tracked via `isDeleted: true` (using a soft delete plugin), but the model also has a `status` field (`AdStatusValue`) and a `moderationStatus` field (`ModerationStatusValue`).
   - **Impact**: No hard database constraints prevent a document from having illegal state combinations, such as `isDeleted: true` alongside `status: "active"` and `moderationStatus: "rejected"`.

---

### Medium Severity Findings
4. **Index Naming Standard Violations**
   - **Finding**: Several database indexes use legacy naming conventions (e.g. starting with `ad_` or lacking explicit names) instead of standard `idx_<collection>_<fields>_idx` suffix rules.
   - **Impact**: Mongoose automatically generates index names if they are not explicitly set, which makes database migration scripting error-prone.

---

## 5. Evidence

### Implicit Collection Name registration
In [core/src/models/Ad.ts:L518](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/models/Ad.ts#L518):
```typescript
const Ad: Model<IAd> = (getUserConnection().models.Ad as Model<IAd> | undefined) || getUserConnection().model<IAd>('Ad', AdSchema);
```
*(No `{ collection: 'listings' }` options object is passed to the Schema constructor, yielding the default pluralized collection name `ads`).*

### Ad Schema Index Sprawl
In [core/src/models/Ad.ts:L302-315](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/models/Ad.ts#L302-L315):
```typescript
AdSchema.index({ sellerId: 1, status: 1 }, { name: 'idx_ad_sellerId_status_idx' });
AdSchema.index({ duplicateScore: 1 }, { name: 'idx_ad_duplicateScore_idx' });
AdSchema.index({ isDeleted: 1 }, { name: 'idx_ad_isDeleted' });
```

---

## 6. Risk Level
- **Overall Database Risk**: **High**
- Index inflation is a performance bottleneck, and the collection naming mismatch contradicts core documentation.

---

## 7. Recommendations
1. **Unify Naming / Update SSOT**: Update [Domain Model SSOT](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/ssot/DOMAIN_MODEL_SSOT.md) Section 4 to reflect the actual collection name `ads` (and Model `Ad`), OR explicitly map the schema to `listings` by adding `{ collection: 'listings' }` inside the `AdSchema` configuration.
2. **De-duplicate and Prune Indexes**: Conduct a query analysis to identify unused or redundant indexes. For instance, compound index `{ sellerId: 1, status: 1 }` can often cover queries on `{ sellerId: 1 }` alone, allowing single-field indexes to be safely removed.
3. **Consolidate State Fields**: Restructure status management or add Mongoose pre-save hooks to enforce strict validation between `isDeleted`, `status`, and `moderationStatus`.

---

## 8. Out-of-Scope Items
- Live database performance profiling and actual index usage statistics (must be evaluated on live staging/production database instances).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 9 — Frontend Audit**.
