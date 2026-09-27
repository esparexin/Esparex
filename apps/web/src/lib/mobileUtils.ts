/**
 * Mobile number utilities — normalization, formatting, Indian mobile validation.
 * SSOT for all mobile/phone transformations across the web app.
 */

import { CONTACT_LIMITS, normalizeIndianMobileInput } from "@esparex/contracts";

/**
 * Strips country code and normalizes any mobile string to a bare 10-digit number.
 * SSOT: delegates to canonical @esparex/contracts normalizeIndianMobileInput.
 */
export const normalizeTo10Digits = (mobile: string): string => {
  if (!mobile) return "";
  return normalizeIndianMobileInput(mobile);
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
