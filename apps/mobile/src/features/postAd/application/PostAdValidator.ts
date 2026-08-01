import { PostAdDraft } from '@esparex/contracts';
import { WizardStep } from '../domain/WizardStep';

/**
 * ValidationError — a single field-level validation failure.
 *
 * Returned by PostAdValidator.validate() as part of ValidationResult.
 * Future UI can use `field` to highlight specific inputs; for now the
 * wizard only needs the boolean (.valid) from the parent result.
 */
export interface ValidationError {
  field: keyof PostAdDraft;
  message: string;
}

/**
 * ValidationResult — discriminated union returned by PostAdValidator.
 *
 * When valid: true  — the step is complete, advance is allowed.
 * When valid: false — errors[] identifies every blocking field.
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: readonly ValidationError[] };

/**
 * PostAdValidator — single source of truth for wizard step validation.
 *
 * Keeps validation logic out of UI components. Components call
 * `canAdvanceFrom(step, draft)` for the boolean gate, or `validate(step, draft)`
 * for field-level diagnostics.
 *
 * As requirements evolve (required images, title min-length, price range),
 * only this file changes — no component updates needed.
 */
export class PostAdValidator {
  /**
   * Returns a structured ValidationResult for the given step.
   *
   * `errors` identifies every blocking field so future UI can highlight
   * individual inputs rather than only blocking navigation.
   */
  static validate(step: WizardStep, draft: PostAdDraft): ValidationResult {
    const errors: ValidationError[] = [];

    switch (step) {
      case WizardStep.CATEGORY:
        if (typeof draft.categoryId !== 'string' || draft.categoryId.trim().length === 0) {
          errors.push({ field: 'categoryId', message: 'Please select a category.' });
        }
        break;

      case WizardStep.DETAILS:
        if (typeof draft.title !== 'string' || draft.title.trim().length === 0) {
          errors.push({ field: 'title', message: 'A title is required.' });
        }
        if (typeof draft.price !== 'number' || draft.price <= 0) {
          errors.push({ field: 'price', message: 'Enter a price greater than zero.' });
        }
        break;

      case WizardStep.IMAGES:
        if (!Array.isArray(draft.localImages) || draft.localImages.length === 0) {
          errors.push({ field: 'localImages', message: 'Add at least one photo.' });
        }
        break;

      case WizardStep.PREVIEW:
        // Preview is the submission gate — canAdvanceFrom is always valid here;
        // PostAdService performs final validation before hitting the API.
        break;

      default:
        break;
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }

  /**
   * Convenience wrapper — returns true when the user can advance past the step.
   * Callers that only need the boolean do not need to know about ValidationResult.
   */
  static canAdvanceFrom(step: WizardStep, draft: PostAdDraft): boolean {
    return PostAdValidator.validate(step, draft).valid;
  }

  /**
   * Returns true if the draft is complete enough to submit.
   * Called by PostAdService as the final gate before upload begins.
   */
  static isReadyToSubmit(draft: PostAdDraft): boolean {
    return (
      PostAdValidator.canAdvanceFrom(WizardStep.CATEGORY, draft) &&
      PostAdValidator.canAdvanceFrom(WizardStep.DETAILS, draft) &&
      PostAdValidator.canAdvanceFrom(WizardStep.IMAGES, draft)
    );
  }
}

