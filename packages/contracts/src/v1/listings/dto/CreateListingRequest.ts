/**
 * CreateListingRequest — the API payload for POST /v1/listings.
 *
 * This is the output of the wizard submission pipeline:
 *   PostAdDraft (local images, display strings)
 *       ↓
 *   PostAdService (uploads images, resolves keys)
 *       ↓
 *   CreateListingRequest (cloud keys, clean primitives)
 *       ↓
 *   ApiListingRepository.create()
 *
 * Note: imageKeys[] holds cloud storage keys returned by the upload service.
 * The original PostAdDraft.localImages[] is never sent to the API.
 */
export interface CreateListingRequest {
  title: string;
  description?: string;
  price: number;
  categoryId: string;
  condition?: string;
  locationId?: string;
  locationDisplay?: string;
  imageKeys: string[];
}
