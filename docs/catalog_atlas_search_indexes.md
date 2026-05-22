# Catalog Atlas Search Index Readiness

Use one Atlas Search index name per catalog collection, defaulting to `catalog_search`.
Roll out with `ENABLE_ATLAS_CATALOG_SEARCH=false`, create indexes, validate parity, then enable the flag.

Recommended dynamic mapping is disabled. Explicit fields:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": [{ "type": "string" }, { "type": "autocomplete" }],
      "displayName": [{ "type": "string" }, { "type": "autocomplete" }],
      "canonicalName": [{ "type": "string" }, { "type": "autocomplete" }],
      "slug": [{ "type": "string" }, { "type": "autocomplete" }],
      "aliases": [{ "type": "string" }, { "type": "autocomplete" }],
      "synonyms": [{ "type": "string" }, { "type": "autocomplete" }],
      "hierarchyPath": { "type": "string" },
      "brandId": { "type": "objectId" },
      "categoryIds": { "type": "objectId" },
      "parentModelId": { "type": "objectId" },
      "variantOfModelId": { "type": "objectId" },
      "isActive": { "type": "boolean" },
      "approvalStatus": { "type": "string" },
      "isDeleted": { "type": "boolean" }
    }
  }
}
```

Collections: `categories`, `brands`, `models`, `variants`, `servicetypes`, `spareparts`.

The runtime fallback remains governed regex search if Atlas Search is unavailable or disabled.
