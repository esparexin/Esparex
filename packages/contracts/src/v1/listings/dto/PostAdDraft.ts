/**
 * PostAdDraft — the shared state shape accumulated across wizard steps.
 *
 * Design notes:
 * - `localImages` stores local device URIs (not cloud storage keys).
 *   Upload to cloud storage and conversion to keys happens at submission (Commit 23).
 * - `locationDisplay` is a human-readable string stored alongside `locationId`
 *   so the UI can display it without re-fetching.
 * - This interface is intentionally partial — every field is optional because
 *   the draft is built incrementally across steps.
 */
export interface PostAdDraftImage {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string;
  mimeType?: string;
}

export interface PostAdDraft {
  categoryId?: string;
  categoryName?: string;
  title?: string;
  description?: string;
  price?: number;
  condition?: string;
  localImages?: string[];
  pickedImages?: PostAdDraftImage[];
  locationId?: string;
  locationDisplay?: string;
}
