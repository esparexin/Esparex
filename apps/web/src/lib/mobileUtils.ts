/**
 * Mobile number utilities — normalization, formatting, Indian mobile validation.
 * SSOT for all mobile/phone transformations across the web app.
 */

import { CONTACT_LIMITS } from "@esparex/contracts";

/**
 * Strips country code and normalizes any mobile string to a bare 10-digit number.
 */
export const normalizeTo10Digits = (mobile: string): string => {
  if (!mobile) return "";
  const trimmed = mobile.trim();
  const hasPlusCountryCode = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (hasPlusCountryCode) {
    if (digits.startsWith("91")) {
      return digits.slice(2);
    }
    return digits;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  if (digits.length <= 10 && digits.startsWith("91")) {
    const stripped = digits.slice(2);
    if (stripped.length > 0 && /^[6-9]/.test(stripped)) {
      return stripped;
    }
  }

  return digits.length > 10 ? digits.slice(-10) : digits;
};

/**
 * Formats a mobile number for the API (Twilio / +91 prefix).
 * @param mobile - Raw mobile string (any format).
 * @returns +91XXXXXXXXXX
 */
export const formatMobileForApi = (mobile: string): string => {
  const clean = normalizeTo10Digits(mobile);
  return `+91${clean}`;
};

/**
 * Returns true if the input resolves to a valid 10-digit Indian mobile number.
 */
export const validateIndianMobile = (mobile: string): boolean => {
  return CONTACT_LIMITS.PHONE.PATTERN.test(normalizeTo10Digits(mobile));
};
