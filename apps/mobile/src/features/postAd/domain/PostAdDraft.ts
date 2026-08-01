import { PickedImage } from './PickedImage';

/**
 * PostAdDraft — client-side domain state shape for the wizard.
 *
 * Owned by the mobile domain layer (not shared API contracts) because wizard state
 * includes local device image objects (PickedImage) and transient UI selections
 * that are separate from backend CreateListingRequest payloads.
 */
export interface PostAdDraft {
  categoryId?: string;
  categoryName?: string;
  title?: string;
  description?: string;
  price?: number;
  condition?: string;
  localImages?: readonly string[];
  pickedImages?: readonly PickedImage[];
  locationId?: string;
  locationDisplay?: string;
}
