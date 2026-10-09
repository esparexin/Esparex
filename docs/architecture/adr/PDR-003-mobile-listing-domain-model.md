# PDR-003: Mobile Listing Domain Model Boundary

**Status:** Accepted
**Date:** 2026-09-29
**Deciders:** Core Architecture Team
**Technical Area:** Mobile Listings Feature (`apps/mobile/src/features/listings`), Contracts (`@esparex/contracts`)
**Decision Reference:** D-010

---

## 1. Context and Problem Statement

Three `Listing`-named types exist across the monorepo:

- `Ad` (canonical DTO, `@esparex/contracts`) — the single source of truth for listing data over the wire.
- `Listing` (`core/src/domains/listings/ports/ListingRepositoryPort.ts`) — backend repository port type.
- `Listing` (`apps/mobile/src/features/listings/domain/Listing.ts`) — mobile presentation domain model with mobile-specific shapes (`ListingPrice.formatted`, `SellerSummary`, `Date` instances, `power_on | power_off` condition).
- `Listing extends Ad` (`apps/web/src/lib/api/user/listings/normalizer.ts`) — web adapter alias adding web-only optional fields.

The question: should the mobile `Listing` domain model be converged into the shared `Ad`/`ListingDTO` contract, or retained as a platform-specific model behind a mapper?

## 2. Decision Drivers

- **Contract-First SSOT**: wire shapes must have exactly one owner (`@esparex/contracts`).
- **Platform Axiom** (AGENTS.md): business rules never depend on platform; platform changes interaction, not the system. Mobile needs `Date` instances, formatted price strings, and simplified seller/location view shapes that JSON DTOs cannot carry.
- **Mapper Ownership Rule**: infrastructure mappers own Response-DTO → Domain transformation; repositories and services never map.
- **Blast Radius**: the mobile model is consumed by ~29 presentation files; converging it to `Ad` would leak DTO optionality (`ad.sellerName || ad.businessName`, `spareParts` vs `sparePartsSnapshot`) into every screen.

## 3. Options Considered

### Option A: Converge mobile onto the shared `Ad` contract (Rejected)
- Delete `domain/Listing.ts`, consume `Ad` directly in all mobile screens.
- **Pros**: one fewer type.
- **Cons**: DTO nullability and dual-field fallbacks (`sellerName`/`businessName`, `spareParts`/`sparePartsSnapshot`, string dates) spread into ~29 presentation files; violates UI-layer prohibition on domain transformation; every contract addition becomes a mobile-wide concern.

### Option B: Retain mobile domain model behind the infrastructure mapper (Accepted)
- Keep `domain/Listing.ts` as the mobile presentation model.
- `infrastructure/mappers/ListingMapper.ts` remains the sole `Ad` → `Listing` boundary (already the case: `mapAdToListing` centralizes HTML unescaping, price formatting, seller resolution, image normalization, condition inference).
- **Pros**: contract changes are absorbed in one file; screens keep simple non-nullable shapes; matches the existing Ports & Adapters layout (`application/IListingRepository`, `ApiListingRepository`).
- **Cons**: model and DTO must be kept aligned when contract fields change — mitigated by the mapper being the single choke point plus `contract:api` verification.

## 4. Decision

**Option B.** The mobile `Listing` domain model is a legitimate platform-specific presentation model, not a competing contract. It MUST only be constructed via `ListingMapper.mapAdToListing` from the canonical `Ad` DTO. No screen, hook, or service may hand-build a `Listing` from raw JSON.

Companion web clarification (same change set): rename the web adapter alias `Listing extends Ad` to `UserListing extends Ad` so each platform's adapter name carries its owner and no longer shadows the mobile/core `Listing` names.

## 5. Consequences

- Mobile feature code is unchanged (no migration); the boundary is now documented and enforceable in review.
- New mobile listing fields must flow `contracts Ad` → `ListingMapper` → `domain/Listing`; direct DTO consumption in `presentation/` is a review violation.
- Web `UserListing` rename is type-only; zero runtime change.

## 6. Verification

- `grep "from '.*domain/Listing'" apps/mobile/src` — all non-mapper consumers import the domain model, never `Ad`, for view state.
- `ListingMapper.ts` is the only file importing both `Ad` (contracts) and `Listing` (domain) in the mobile listings feature.
- `npm run type-check -w @esparex/apps-mobile` and `-w @esparex/apps-web` pass.
- `npm run contract:api` passes (no contract change).

## 7. Rollback

Delete this ADR's enforcement expectation and (separately) revert the `UserListing` rename; the mobile model requires no rollback as it is unchanged.
