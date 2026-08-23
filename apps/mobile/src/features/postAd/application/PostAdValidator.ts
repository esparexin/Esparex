import { PostAdDraft } from '../domain/PostAdDraft';
import { WizardStep } from '../domain/WizardStep';
import {
  MIN_AD_TITLE_CHARS,
  MAX_AD_TITLE_CHARS,
  MIN_AD_DESCRIPTION_CHARS,
  MAX_AD_DESCRIPTION_CHARS,
  MIN_AD_IMAGES,
  MAX_AD_IMAGES,
} from '@esparex/contracts';

export interface ValidationError {
  field: keyof PostAdDraft;
  message: string;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: readonly ValidationError[] };

export class PostAdValidator {
  static validate(step: WizardStep, draft: PostAdDraft): ValidationResult {
    const errors: ValidationError[] = [];

    switch (step) {
      case WizardStep.CATEGORY:
        if (typeof draft.categoryId !== 'string' || draft.categoryId.trim().length === 0) {
          errors.push({ field: 'categoryId', message: 'Please select a category.' });
        }
        break;

      case WizardStep.DETAILS:
        if (typeof draft.title !== 'string' || draft.title.trim().length < MIN_AD_TITLE_CHARS) {
          errors.push({
            field: 'title',
            message: `Title must be at least ${MIN_AD_TITLE_CHARS} characters.`,
          });
        } else if (draft.title.trim().length > MAX_AD_TITLE_CHARS) {
          errors.push({
            field: 'title',
            message: `Title cannot exceed ${MAX_AD_TITLE_CHARS} characters.`,
          });
        }

        if (
          typeof draft.description !== 'string' ||
          draft.description.trim().length < MIN_AD_DESCRIPTION_CHARS
        ) {
          errors.push({
            field: 'description',
            message: `Description must be at least ${MIN_AD_DESCRIPTION_CHARS} characters.`,
          });
        } else if (draft.description.trim().length > MAX_AD_DESCRIPTION_CHARS) {
          errors.push({
            field: 'description',
            message: `Description cannot exceed ${MAX_AD_DESCRIPTION_CHARS} characters.`,
          });
        }

        if (!draft.isFree) {
          if (typeof draft.price !== 'number' || draft.price < 1) {
            errors.push({ field: 'price', message: 'Enter a price greater than zero or mark as Free.' });
          }
        }

        if (!draft.location?.locationId && !draft.locationId && !draft.locationDisplay) {
          errors.push({ field: 'location', message: 'Please select or auto-detect a location.' });
        }
        break;

      case WizardStep.PHOTOS:
        const imgCount = (draft.localImages || draft.pickedImages || []).length;
        if (imgCount < MIN_AD_IMAGES) {
          errors.push({ field: 'localImages', message: 'Add at least one photo.' });
        } else if (imgCount > MAX_AD_IMAGES) {
          errors.push({
            field: 'localImages',
            message: `Maximum ${MAX_AD_IMAGES} photos allowed.`,
          });
        }
        break;

      default:
        break;
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }

  static canAdvanceFrom(step: WizardStep, draft: PostAdDraft): boolean {
    return PostAdValidator.validate(step, draft).valid;
  }

  static isReadyToSubmit(draft: PostAdDraft): boolean {
    return (
      PostAdValidator.canAdvanceFrom(WizardStep.CATEGORY, draft) &&
      PostAdValidator.canAdvanceFrom(WizardStep.DETAILS, draft) &&
      PostAdValidator.canAdvanceFrom(WizardStep.PHOTOS, draft)
    );
  }
}
