import { CreateListingRequest } from '@esparex/contracts';
import { PostAdDraft } from '../../domain/PostAdDraft';
import { UploadedImage } from '../../domain/UploadedImage';

/**
 * CreateListingRequestMapper — pure mapper transforming wizard draft state and uploaded images
 * into a clean API CreateListingRequest payload.
 *
 * Single responsibility: DTO payload construction. Keeps mapping logic out of PostAdService.
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
      price: draft.price!,
      categoryId: draft.categoryId!,
      condition: draft.condition,
      locationId: draft.locationId,
      locationDisplay: draft.locationDisplay,
      imageKeys,
    };
  }
}
