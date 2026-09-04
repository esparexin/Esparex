import { z } from 'zod';
import { CONTACT_LIMITS, TEXT_LIMITS } from '../../common/constants/fieldLimits';

/**
 * Canonical normalizer for Indian mobile numbers.
 * Strips non-digits, strips leading +91 / 91 / 0, and returns the 10-digit number.
 */
export function normalizeIndianMobileInput(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.length >= 12 && digits.startsWith('91')) {
        return digits.slice(2, 12);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
        return digits.slice(1, 11);
    }
    return digits.slice(0, 10);
}

export const authMobileSchema = z.string()
    .transform((val) => normalizeIndianMobileInput(val))
    .refine(
        (val) => {
            const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
            if (isProd) {
                return CONTACT_LIMITS.PHONE.PATTERN.test(val);
            }
            return /^\d{10}$/.test(val);
        },
        'Invalid mobile format (must be a valid 10-digit Indian number starting with 6-9)'
    );

export const authNameSchema = z.string()
    .trim()
    .min(TEXT_LIMITS.NAME.MIN, TEXT_LIMITS.NAME.ERROR_MIN)
    .max(TEXT_LIMITS.NAME.MAX, TEXT_LIMITS.NAME.ERROR_MAX)
    .refine((val) => /^[\p{L}\p{N}\s.\-'_,]+$/u.test(val), 'Name contains invalid characters');

export const authOtpSchema = z.union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^\d{6}$/.test(val), 'OTP must be 6 digits');

export const LoginPayloadSchema = z.object({
    mobile: authMobileSchema,
    name: z.union([authNameSchema, z.literal('')]).optional(),
});

export const VerifyOtpPayloadSchema = z.object({
    mobile: authMobileSchema,
    otp: authOtpSchema,
    name: z.union([authNameSchema, z.literal('')]).optional(),
});

export type LoginPayload = z.infer<typeof LoginPayloadSchema>;
export type VerifyOtpPayload = z.infer<typeof VerifyOtpPayloadSchema>;
