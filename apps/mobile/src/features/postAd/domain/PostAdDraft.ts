import { LocationMeta } from '@esparex/contracts';
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
  brandId?: string;
  brandName?: string;
  modelId?: string;
  modelName?: string;
  customBrandName?: string;
  customModelName?: string;
  deviceCondition?: 'power_on' | 'power_off';
  spareParts?: string[];
  title?: string;
  description?: string;
  price?: number;
  isFree?: boolean;
  location?: LocationMeta | null;
  locationId?: string;
  locationDisplay?: string;
  pickedImages?: readonly PickedImage[];
  localImages?: readonly string[];
}
