import { z } from 'zod';
import logger from '../utils/logger';
import { normalizeTo10Digits } from '../utils/phoneUtils';
import { isProduction } from '../config/env';

/**
 * Mobile Number Schema
 * - Transforms any format into a clean 10-digit string
 * - Production: Strictly enforces Indian mobile numbering [6-9]
 * - Development: Allows any 10-digit number for test accounts
 */
const mobileSchema = z.string()
    .transform(normalizeTo10Digits)
    .refine((value) => {
        // In production, we strictly require Indian mobile formats
        if (isProduction) {
            return /^[6-9]\d{9}$/.test(value);
        }
        // In development/test, allow any 10 digits to support test accounts
        return /^\d{10}$/.test(value);
    }, {
        message: isProduction 
            ? "Invalid mobile format (must be a valid 10-digit Indian number starting with 6-9)" 
            : "Invalid mobile format (must be 10 digits)"
    });

export const loginSchema = z.object({
    mobile: mobileSchema
});

export const verifyOtpSchema = z.object({
    mobile: mobileSchema,
    otp: z.union([z.string(), z.number()])
        .transform(val => {
            if (typeof val === "number") {
                logger.warn("[Type Coercion] OTP received as number — coerced to string");
            }
            return String(val);
        })
        .refine(val => /^\d{6}$/.test(val), "OTP must be 6 digits"),
    name: z.string().optional()
});
