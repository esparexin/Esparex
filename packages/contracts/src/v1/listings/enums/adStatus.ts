import type { ListingStatus } from './listingStatus';

// P7: deprecated AD_STATUS alias + derived value tuples deleted after
// consumer audit (zero repo importers; LISTING_STATUS is canonical).
// AdStatusValue (type-only) is retained: ports/models/services consume it.

export type AdStatusValue = ListingStatus;
