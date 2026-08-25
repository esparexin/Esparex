/**
 * validation.ts — Re-export barrel (backward-compatible facade).
 *
 * This file previously contained all validation logic (540 lines).
 * It has been split into three focused modules:
 *   - lib/mobileUtils.ts       — mobile normalization, formatting, Indian mobile validation
 *   - lib/fieldValidators.ts   — ValidationResult, ValidationRules, individual field validators
 *   - lib/formValidation.ts    — form engine, rule sets, createFieldValidator
 *
 * All existing imports from "@/lib/validation" continue to work unchanged.
 */

export type { FieldValidationResult, ValidationResult } from "./fieldValidators";
export {
  ValidationRules,
  validateBusinessName,
  validateEmail,
  validateMobile,
  validateGSTNumber,
  validatePincode,
  validateURL,
  validateDescription,
  validateTagline,
  validateRequired,
  validateLength,
} from "./fieldValidators";

export {
  normalizeTo10Digits,
  formatMobileForApi,
  validateIndianMobile,
} from "./mobileUtils";

export type {
  FormValidationRules,
  FormValidationErrors,
} from "./formValidation";
export {
  validateForm,
  businessProfileValidationRules,
  businessProfileOptionalValidationRules,
  createFieldValidator,
} from "./formValidation";
