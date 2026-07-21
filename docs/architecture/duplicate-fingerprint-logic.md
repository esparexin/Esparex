# Ad Duplicate Fingerprint Logic

## Business Reason
The duplicate fingerprint prevents malicious or accidental submission of identical listings by the same seller across our platform. By detecting duplicate listings early in the orchestration layer, we prevent catalog pollution and save resources by short-circuiting image processing and database writes.

## Included Fields
The fingerprint is constructed by concatenating the following normalized fields using a pipe `|` delimiter:
1. **type**: The listing type (e.g., `ad`, `spare_part`). Defaults to `ad`.
2. **sellerId**: The ID of the seller submitting the ad.
3. **category**: The ID of the primary category.
4. **brand**: The ID of the brand (if available), otherwise `na`.
5. **model**: The ID of the model (if available), otherwise `na`.
6. **condition**: The physical condition of the item. This resolves based on listing type (e.g., `deviceCondition` for mobiles/tablets, `screenSize` for TVs/displays, or standard `condition`), otherwise `na`.
7. **priceRange**: A bucketed price range calculated as a 500-unit window (e.g., `1000-1499`).
8. **locationRadius**: A concatenated string of `city:state:lng:lat` (coordinates rounded to 2 decimals) to represent the generalized location.

## Excluded Fields
The following fields are explicitly excluded to ensure robust duplicate matching even if minor details change:
- Title
- Description
- Exact Price (bucketed into ranges instead)
- Exact Location Coordinates (rounded instead)
- Image URLs/Hashes (handled by cross-user risk assessment)

## Normalization Rules
Before concatenation, all values pass through `normalizeToken()`, which performs:
1. `.trim()`
2. `.toLowerCase()`
3. `.replace(/[^\p{L}\p{N}]+/gu, '')` - strips all non-alphanumeric characters, ensuring that accidental spacing or punctuation does not bypass the duplicate check.

## Hash Algorithm
The final concatenated string (the `fingerprintBase`) is hashed using `SHA-256`. 
The final `duplicateFingerprint` stored in the database is the first 16 characters of the hex digest:
```typescript
createHash('sha256').update(fingerprintBase).digest('hex').substring(0, 16);
```
