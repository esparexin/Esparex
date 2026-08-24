/**
 * Form-level validation: rule sets, multi-field validation, real-time helper.
 * Consumes individual field validators from fieldValidators.ts.
 */

import type { FieldValidationResult } from "./fieldValidators";
import {
  validateBusinessName,
  validateDescription,
  validateEmail,
  validateGSTNumber,
  validateMobile,
  validatePincode,
  validateTagline,
  validateURL,
} from "./fieldValidators";

// ============================================================================
// FORM ENGINE
// ============================================================================

export interface FormValidationRules {
  [key: string]: (value: unknown) => FieldValidationResult;
}

export interface FormValidationErrors {
  [key: string]: string;
}

export const validateForm = (
  data: Record<string, unknown>,
  rules: FormValidationRules,
): { valid: boolean; errors: FormValidationErrors } => {
  const errors: FormValidationErrors = {};
  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.valid && result.error) {
      errors[field] = result.error.userMessage;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
};

// ============================================================================
// BUSINESS PROFILE RULE SETS
// ============================================================================

export const businessProfileValidationRules: FormValidationRules = {
  businessName: validateBusinessName,
  email: validateEmail,
  mobile: validateMobile,
  description: validateDescription,
  pincode: validatePincode,
};

export const businessProfileOptionalValidationRules: FormValidationRules = {
  gstNumber: (value: unknown) => validateGSTNumber(value, false),
  website:   (value: unknown) => validateURL(value, false),
  tagline:   (value: unknown) => validateTagline(value, false),
  alternatePhone:  (value: unknown) => value ? validateMobile(value) : { valid: true },
  whatsappNumber:  (value: unknown) => value ? validateMobile(value) : { valid: true },
};

// ============================================================================
// REAL-TIME FIELD VALIDATION HELPER
// ============================================================================

export const createFieldValidator = (
  validatorFn: (value: string) => FieldValidationResult,
) => {
  return (value: string): { error: string | null; sanitized?: string } => {
    const result = validatorFn(value);
    return {
      error: result.error ? result.error.userMessage : null,
      sanitized: result.sanitized,
    };
  };
};
