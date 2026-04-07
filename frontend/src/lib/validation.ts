/**
 * Enhanced Validation Utility
 * Comprehensive field validation with detailed error messages
 */

import { createValidationError, EsparexError, sanitizeInput } from "./errorHandler";
import { CONTACT_LIMITS } from "@shared/constants/fieldLimits";

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: EsparexError;
  sanitized?: string;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const ValidationRules = {
  // Business Name
  businessName: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s&'.-]+$/,
    getMessage: (issue: string) => {
      switch (issue) {
        case "required":
          return "Business name is required";
        case "minLength":
          return "Business name must be at least 3 characters";
        case "maxLength":
          return "Business name cannot exceed 100 characters";
        case "pattern":
          return "Business name contains invalid characters";
        default:
          return "Invalid business name";
      }
    },
  },

  // Email
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    maxLength: 255,
    getMessage: (issue: string) => {
      switch (issue) {
        case "required":
          return "Email address is required";
        case "pattern":
          return "Please enter a valid email address";
        case "maxLength":
          return "Email address is too long";
        default:
          return "Invalid email address";
      }
    },
  },

  // Phone
  phone: {
    pattern: /^[+]?[0-9]{10,15}$/,
    getMessage: (issue: string) => {
      switch (issue) {
        case "required":
          return "Phone number is required";
        case "pattern":
          return "Please enter a valid 10-15 digit phone number";
        default:
          return "Invalid phone number";
      }
    },
  },

  // GST Number
  gstNumber: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    length: 15,
    getMessage: (issue: string) => {
      switch (issue) {
        case "pattern":
          return "Please enter a valid 15-character GST number (e.g., 22AAAAA0000A1Z5)";
        case "length":
          return "GST number must be exactly 15 characters";
        default:
          return "Invalid GST number format";
      }
    },
  },

  // Pincode
  pincode: {
    pattern: /^[0-9]{6}$/,
    length: 6,
    getMessage: (issue: string) => {
      switch (issue) {
        case "required":
          return "Pincode is required";
        case "pattern":
          return "Please enter a valid 6-digit pincode";
        case "length":
          return "Pincode must be exactly 6 digits";
        default:
          return "Invalid pincode";
      }
    },
  },

  // URL/Website
  url: {
    pattern: /^https?:\/\/.+/,
    getMessage: (issue: string) => {
      switch (issue) {
        case "pattern":
          return "URL must start with http:// or https://";
        default:
          return "Invalid URL format";
      }
    },
  },

  // Description
  description: {
    minLength: 10,
    maxLength: 500,
    getMessage: (issue: string) => {
      switch (issue) {
        case "required":
          return "Description is required";
        case "minLength":
          return "Description must be at least 10 characters";
        case "maxLength":
          return "Description cannot exceed 500 characters";
        default:
          return "Invalid description";
      }
    },
  },

  // Tagline
  tagline: {
    maxLength: 80,
    getMessage: (issue: string) => {
      switch (issue) {
        case "maxLength":
          return "Tagline cannot exceed 80 characters";
        default:
          return "Invalid tagline";
      }
    },
  },
};

/**
 * Formats a 10-digit mobile number for the API (Twilio compatible).
 * @param mobile - 10 digit mobile string.
 * @returns Formatted phone string with +91 prefix.
 */
export const formatPhoneForAPI = (mobile: string): string => {
  const clean = mobile.replace(/\D/g, "");
  return `+91${clean.slice(-10)}`;
};

/**
 * Validates if the input is a valid 10-digit Indian mobile number.
 * @param mobile - Input string.
 * @returns boolean
 */
export const validateIndianMobile = (mobile: string): boolean => {
  return CONTACT_LIMITS.PHONE.PATTERN.test(mobile.replace(/\D/g, ""));
};

// ============================================================================
// VALIDATOR FUNCTIONS
// ============================================================================

export const validateBusinessName = (value: unknown): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = sanitizeInput(strValue, ValidationRules.businessName.maxLength);

  if (!sanitized) {
    return {
      valid: false,
      error: createValidationError("Business Name", "required"),
    };
  }

  if (sanitized.length < ValidationRules.businessName.minLength) {
    return {
      valid: false,
      error: createValidationError("Business Name", "minLength", sanitized),
    };
  }

  if (sanitized.length > ValidationRules.businessName.maxLength) {
    return {
      valid: false,
      error: createValidationError("Business Name", "maxLength", sanitized),
    };
  }

  if (!ValidationRules.businessName.pattern.test(sanitized)) {
    return {
      valid: false,
      error: createValidationError("Business Name", "format", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validateEmail = (value: unknown): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = strValue.trim().toLowerCase();

  if (!sanitized) {
    return {
      valid: false,
      error: createValidationError("Email", "required"),
    };
  }

  if (sanitized.length > ValidationRules.email.maxLength) {
    return {
      valid: false,
      error: createValidationError("Email", "maxLength", sanitized),
    };
  }

  if (!ValidationRules.email.pattern.test(sanitized)) {
    return {
      valid: false,
      error: createValidationError("Email", "email", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validatePhone = (value: unknown): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = strValue.replace(/[\s-()]/g, "");

  if (!sanitized) {
    return {
      valid: false,
      error: createValidationError("Phone", "required"),
    };
  }

  if (!ValidationRules.phone.pattern.test(sanitized)) {
    return {
      valid: false,
      error: createValidationError("Phone", "phone", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validateGSTNumber = (value: unknown, required = false): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = strValue.trim().toUpperCase();

  if (!sanitized) {
    if (required) {
      return {
        valid: false,
        error: createValidationError("GST Number", "required"),
      };
    }
    return { valid: true, sanitized };
  }

  if (sanitized.length !== ValidationRules.gstNumber.length) {
    return {
      valid: false,
      error: createValidationError("GST Number", "gst", sanitized),
    };
  }

  if (!ValidationRules.gstNumber.pattern.test(sanitized)) {
    return {
      valid: false,
      error: createValidationError("GST Number", "gst", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validatePincode = (value: unknown): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = strValue.trim();

  if (!sanitized) {
    return {
      valid: false,
      error: createValidationError("Pincode", "required"),
    };
  }

  if (!ValidationRules.pincode.pattern.test(sanitized)) {
    return {
      valid: false,
      error: createValidationError("Pincode", "pincode", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validateURL = (value: unknown, required = false): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = strValue.trim();

  if (!sanitized) {
    if (required) {
      return {
        valid: false,
        error: createValidationError("URL", "required"),
      };
    }
    return { valid: true, sanitized };
  }

  if (!ValidationRules.url.pattern.test(sanitized)) {
    return {
      valid: false,
      error: createValidationError("URL", "url", sanitized),
    };
  }

  // Additional URL validation
  try {
    new URL(sanitized);
  } catch {
    return {
      valid: false,
      error: createValidationError("URL", "url", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validateDescription = (value: unknown): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = sanitizeInput(strValue, ValidationRules.description.maxLength);

  if (!sanitized) {
    return {
      valid: false,
      error: createValidationError("Description", "required"),
    };
  }

  if (sanitized.length < ValidationRules.description.minLength) {
    return {
      valid: false,
      error: createValidationError("Description", "minLength", sanitized),
    };
  }

  if (sanitized.length > ValidationRules.description.maxLength) {
    return {
      valid: false,
      error: createValidationError("Description", "maxLength", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validateTagline = (value: unknown, required = false): ValidationResult => {
  const strValue = typeof value === 'string' ? value : String(value || "");
  const sanitized = sanitizeInput(strValue, ValidationRules.tagline.maxLength);

  if (!sanitized) {
    if (required) {
      return {
        valid: false,
        error: createValidationError("Tagline", "required"),
      };
    }
    return { valid: true, sanitized };
  }

  if (sanitized.length > ValidationRules.tagline.maxLength) {
    return {
      valid: false,
      error: createValidationError("Tagline", "maxLength", sanitized),
    };
  }

  return { valid: true, sanitized };
};

export const validateRequired = (
  value: string,
  fieldName: string
): ValidationResult => {
  const sanitized = value.trim();

  if (!sanitized) {
    return {
      valid: false,
      error: createValidationError(fieldName, "required"),
    };
  }

  return { valid: true, sanitized };
};

export const validateLength = (
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult => {
  const sanitized = value.trim();

  if (min && sanitized.length < min) {
    return {
      valid: false,
      error: createValidationError(fieldName, "minLength", sanitized),
    };
  }

  if (max && sanitized.length > max) {
    return {
      valid: false,
      error: createValidationError(fieldName, "maxLength", sanitized),
    };
  }

  return { valid: true, sanitized };
};

// ============================================================================
// FORM VALIDATION
// ============================================================================

export interface FormValidationRules {
  [key: string]: (value: unknown) => ValidationResult;
}

export interface FormValidationErrors {
  [key: string]: string;
}

export const validateForm = (
  data: Record<string, unknown>,
  rules: FormValidationRules
): { valid: boolean; errors: FormValidationErrors } => {
  const errors: FormValidationErrors = {};

  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.valid && result.error) {
      errors[field] = result.error.userMessage;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// ============================================================================
// BUSINESS PROFILE VALIDATION RULES
// ============================================================================

export const businessProfileValidationRules: FormValidationRules = {
  businessName: validateBusinessName,
  email: validateEmail,
  phone: validatePhone,
  description: validateDescription,
  pincode: validatePincode,
};

// Optional fields with validation
export const businessProfileOptionalValidationRules: FormValidationRules = {
  gstNumber: (value: unknown) => validateGSTNumber(value, false),
  website: (value: unknown) => validateURL(value, false),
  tagline: (value: unknown) => validateTagline(value, false),
  alternatePhone: (value: unknown) =>
    value ? validatePhone(value) : { valid: true },
  whatsappNumber: (value: unknown) =>
    value ? validatePhone(value) : { valid: true },
};

// ============================================================================
// REAL-TIME VALIDATION HELPER
// ============================================================================

export const createFieldValidator = (
  validatorFn: (value: string) => ValidationResult
) => {
  return (value: string): { error: string | null; sanitized?: string } => {
    const result = validatorFn(value);
    return {
      error: result.error ? result.error.userMessage : null,
      sanitized: result.sanitized,
    };
  };
};
