# Listings Domain — Dependency Inventory

## Cross-Domain Dependency Matrix

| Domain        | Relationship                 | Direction                |
| ------------- | ---------------------------- | ------------------------ |
| Identity      | User ownership & permissions | Listings → Identity      |
| Catalog       | Taxonomy validation          | Listings → Catalog       |
| Location      | Address & geo validation     | Listings → Location      |
| Payments      | Premium ads & quotas         | Listings → Payments      |
| Notifications | Listing events               | Listings → Notifications |

## 1. Models
*   `Ad` (Core Listing model)
*   `SavedAd`
*   `AdImage`
*   `Category` (Catalog dependency)
*   `User` (Identity dependency)
*   `Location` (Location dependency)
*   `UserWallet` (Payments/Boosts dependency)

## 2. External Services
*   **S3/Object Storage**: Used by `AdImageService` for media uploads.
*   **Image Processor**: Resizing, watermarking, moderation scoring.

## 3. Domain Dependencies
*   **Identity**: Auth requirements, User suspension status.
*   **Catalog**: Validation against taxonomy, constraints, metadata schema.
*   **Location**: Geocoding, reverse geocoding, boundary validation.
*   **Payments**: AdSlot consumption, boosts, premium ad limits.
*   **Notifications**: Alerting buyers on new ads matching saved searches, moderation updates to sellers.

## 4. Repository Adapters
*   Currently using direct Mongoose queries (e.g. `Ad.findOne`, `Ad.updateOne`).
*   Will require Repository Ports for `AdRepository`, `SavedAdRepository` in future phases.

## 5. Events & Queues
*   `listing.created`
*   `listing.updated`
*   `listing.moderation.approved`
*   `listing.moderation.rejected`
*   Image processing queue.
*   Search indexing queue (Elasticsearch sync).

## 6. Cache Usage
*   Redis is heavily used in `ListingModerationQueryService` and `AdEngagementService` (view counting).
*   Distributed locks in submission policies.

## 7. Search Dependencies
*   Elasticsearch/Algolia sync processes rely on `Ad` model hooks or `AdOrchestrator` triggers.
