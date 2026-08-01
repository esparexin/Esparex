import { PostAdDraft, CreateListingRequest } from '@esparex/contracts';
import { IListingRepository } from '../../listings/application/IListingRepository';
import { Listing } from '../../listings/domain/Listing';
import { IImageUploadService } from './IImageUploadService';
import { PostAdValidator } from './PostAdValidator';
import { PickedImage } from '../domain/PickedImage';
import { UploadedImage } from '../domain/UploadedImage';
import { CreateListingRequestMapper } from './mappers/CreateListingRequestMapper';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * SubmitErrorKind — identifies which pipeline stage failed.
 *
 * Allows `useSubmitAd` and the UI to distinguish between:
 *   - validation failures (user must fix the draft)
 *   - upload failures   (retry is viable)
 *   - api failures      (retry is viable)
 */
export type SubmitErrorKind = 'validation' | 'upload' | 'api';

export interface SubmitError {
  kind: SubmitErrorKind;
  message: string;
}

/**
 * SubmitResult — discriminated union instead of exception-driven control flow.
 *
 * Callers pattern-match on `success` rather than catching thrown errors:
 *
 *   const result = await postAdService.submit(draft, onPhaseChange);
 *   if (result.success) { navigate(result.listingId); }
 *   else { showError(result.error); }
 */
export type SubmitResult =
  | { success: true; listingId: string }
  | { success: false; kind: SubmitErrorKind; message: string };

// ---------------------------------------------------------------------------
// Phase callback
// ---------------------------------------------------------------------------

/**
 * SubmitPhase — the current stage of a running submission.
 *
 * Passed to the optional `onPhaseChange` callback so callers can
 * display "Uploading photos…" and "Creating listing…" without the
 * service knowing about UI state.
 */
export type SubmitPhase = 'uploading' | 'creating';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * PostAdService — orchestrates the wizard-to-API submission pipeline.
 *
 * Responsibilities:
 *   1. Validate the draft is complete (PostAdValidator)
 *   2. Upload local images → receive cloud storage keys (IImageUploadService)
 *   3. Transform PostAdDraft (local state) into CreateListingRequest (API payload)
 *   4. Call IListingRepository.create() with the clean request
 *
 * Does NOT:
 *   - Mutate the original draft
 *   - Know about UI, navigation, or submission status
 *   - Throw exceptions for control flow — returns SubmitResult instead
 */
export class PostAdService {
  constructor(
    private readonly imageUploadService: IImageUploadService,
    private readonly listingRepository: IListingRepository,
  ) {}

  public async submit(
    draft: PostAdDraft,
    onPhaseChange?: (phase: SubmitPhase) => void,
  ): Promise<SubmitResult> {
    // 1. Validate — return structured error instead of throwing
    if (!PostAdValidator.isReadyToSubmit(draft)) {
      return {
        success: false,
        kind: 'validation',
        message: 'Please complete all required fields before submitting.',
      };
    }

    // 2. Upload images via IImageUploadService using PickedImage domain objects
    onPhaseChange?.('uploading');
    let uploadedImages: readonly UploadedImage[];
    try {
      const pickedImages: readonly PickedImage[] =
        draft.pickedImages && draft.pickedImages.length > 0
          ? draft.pickedImages
          : (draft.localImages ?? []).map((uri) => ({ uri }));
      uploadedImages = pickedImages.length
        ? await this.imageUploadService.uploadImages(pickedImages)
        : [];
    } catch (uploadErr) {
      const message =
        uploadErr instanceof Error ? uploadErr.message : 'Photo upload failed. Please try again.';
      return { success: false, kind: 'upload', message };
    }

    // 3. Build the API request via explicit CreateListingRequestMapper
    const request = CreateListingRequestMapper.fromDraft(draft, uploadedImages);

    // 4. Create the listing
    onPhaseChange?.('creating');
    let created: { id: string };
    try {
      created = await this.listingRepository.create(request);
    } catch (apiErr) {
      const message =
        apiErr instanceof Error ? apiErr.message : 'Could not create your listing. Please try again.';
      return { success: false, kind: 'api', message };
    }

    return { success: true, listingId: created.id };
  }
}

