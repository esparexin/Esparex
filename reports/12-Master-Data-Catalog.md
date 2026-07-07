# 12. Master Data Catalog

## Master Data Entities

| Entity | Source | Managed By | Used By | Lifecycle |
|--------|--------|------------|---------|-----------|
| **Categories** | Database | Admin | Listings, Search | Permanent |
| **Brands** | Database | Database | Listings, Search | Permanent |
| **Models** | Database | Admin | Listings, Search | Permanent |
| **Variants** | Database | Admin | Listings, Search | Permanent |
| **Spare Parts** | Database | Admin | Listings, Search | Permanent |
| **Locations** | Database | Admin | Listings, Geo-Search | Permanent |

## Architectural Insight
The Master Data (Catalog) forms the backbone of the Esparex platform. It dictates how users can list and search for items.
* **Seeding vs Dynamic:** Core taxonomy is seeded, but admins have a workflow (via `adminCatalogRoutes.ts` and `adminCatalogRequestRoutes.ts`) to dynamically manage additions.
* **Data Flow:** Admins update the DB -> APIs expose it -> Frontend caching layer retrieves it -> Users select from it during Ad creation.
