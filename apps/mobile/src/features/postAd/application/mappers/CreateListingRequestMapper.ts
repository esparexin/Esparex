import { CreateListingRequest } from '@esparex/contracts';
import { PostAdDraft } from '../../domain/PostAdDraft';
import { UploadedImage } from '../../domain/UploadedImage';

/**
 * CreateListingRequestMapper — pure mapper transforming wizard draft state and uploaded images
 * into a clean API CreateListingRequest payload.
 */
export class CreateListingRequestMapper {
  public static fromDraft(
    draft: PostAdDraft,
    uploadedImages: readonly UploadedImage[],
  ): CreateListingRequest {
    const imageKeys = uploadedImages.map((img) => img.key);

    return {
      title: draft.title!,
      description: draft.description,
      price: draft.isFree ? 0 : (draft.price ?? 0),
      isFree: draft.isFree ?? false,
      categoryId: draft.categoryId!,
      brandId: draft.brandId,
      modelId: draft.modelId,
      customBrandName: draft.customBrandName,
      customModelName: draft.customModelName,
      deviceCondition: draft.deviceCondition,
      spareParts: draft.spareParts && draft.spareParts.length > 0 ? draft.spareParts : undefined,
      location: draft.location,
      locationId: draft.location?.locationId || draft.locationId,
      locationDisplay: draft.location?.display || draft.locationDisplay,
      imageKeys,
      images: imageKeys,
    };
  }
}
