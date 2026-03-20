# Location Architecture — Esparex Backend SSOT

> **Last updated:** 2026-02-28  
> **Scope:** Backend models only  
> **Rule:** DO NOT change location format without updating this document.

---

## 📍 Format Policy

### GeoJSON `{ type: "Point", coordinates: [lng, lat] }`

Used by **query-critical models** that need geospatial search (`$near`, `$geoWithin`, `$geoNear`).

| Model | Field path | 2dsphere index |
|---|---|---|
| `Ad.ts` | `location.coordinates` | ✅ Yes |
| `Business.ts` | `location.coordinates` | ✅ Yes |
| `Location.ts` | `coordinates` | ✅ Yes |
| `SmartAlert.ts` | `coordinates` | ✅ Yes |
| `User.ts` | `location.coordinates` | ✅ Yes |
| `Geofence.ts` | `coordinates` (Polygon) | ✅ Yes |

### Flat `{ lat: Number, lng: Number }`

Used by **analytics/logging models** that are never queried with geo operators.

| Model | Field path | 2dsphere index |
|---|---|---|
| `LocationEvent.ts` | `location.lat` + `location.lng` | ❌ None — intentional |
| `Heatmap.ts` | `location.lat` + `location.lng` | ❌ None — intentional |
| `SystemConfig.ts` | `defaultCenter.lat` + `defaultCenter.lng` | ❌ None — intentional |

---

## ⚠️ Rules

1. **Coordinate order is always `[lng, lat]`** — GeoJSON standard. Never swap.
2. **Only GeoJSON models may have a 2dsphere index.**
3. **Flat models MUST NEVER be used in `$near`, `$geoWithin`, or `$geoNear` queries.** These require a 2dsphere index that flat models do not have.
4. **New models that need geo queries MUST use GeoJSON format** and define a `2dsphere` index.
5. **New analytics/logging models MUST use flat format** and must not define a 2dsphere index.

---

## 🔄 Normalization Layer

Frontend sends location in multiple formats:
- `[lng, lat]` array (map picker)
- `{ lat, lng }` flat (location service)
- `{ type: "Point", coordinates: [lng, lat] }` (GeoJSON passthrough)

All formats are normalized to GeoJSON on the backend via:
- `backend/src/services/locationService.ts → normalizeLocation()` + `toGeoPoint()`

Do NOT bypass this normalization layer.
