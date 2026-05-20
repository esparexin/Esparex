# Database Schema SSOT

## GeoJSON Standards

1. **Point Type**: All location fields must be defined as GeoJSON Point.
2. **Coordinates**: Must be a `[Number]` array of `[longitude, latitude]`.
3. **2dsphere Index**: All GeoJSON fields used for proximity search MUST have a `2dsphere` index defined in the model.

**Status**: Documented and Enforced
**Validator**: `scripts/enforce-ad-ssot-guard.js`
