# 11. Database Catalog

## Core Collections & Relationships

### Identity Models
* **User:** Core consumer profile.
* **Admin:** Backoffice staff with RBAC.

### Listing Models
* **Ad:** The primary aggregate root. Contains references to `User` (Seller), `Category`, `Brand`, `Model`, `Location`.

### Catalog Models (Master Data)
* **Category:** Hierarchical tree (parent/child).
* **Brand:** Belongs to Categories.
* **Model:** Belongs to Brands.
* **Variant:** Belongs to Models.
* **SparePart:** Belongs to Categories/Brands.

### Transactional Models
* **Conversation:** Belongs to `Ad`, `User` (Buyer), `User` (Seller).
* **Transaction:** Financial ledger entries for Razorpay interactions.

## Architectural Notes
* Mongoose is the primary ODM.
* Strong usage of MongoDB references (ObjectIds) for relationships, mapped in TypeScript via `@esparex/core/src/models`.
