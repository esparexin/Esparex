"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("@core/utils/logger"));
const phoneUtils_1 = require("@core/utils/phoneUtils");
const env_1 = require("@core/config/env");
/**
 * Mobile Number Schema
 * - Transforms any format into a clean 10-digit string
 * - Production: Strictly enforces Indian mobile numbering [6-9]
 * - Development: Allows any 10-digit number for test accounts
 */
const mobileSchema = zod_1.z.string()
    .transform(phoneUtils_1.normalizeTo10Digits)
    .refine((value) => {
    // In production, we strictly require Indian mobile formats
    if (env_1.isProduction) {
        return /^[6-9]\d{9}$/.test(value);
    }
    // In development/test, allow any 10 digits to support test accounts
    return /^\d{10}$/.test(value);
}, {
    message: env_1.isProduction
        ? "Invalid mobile format (must be a valid 10-digit Indian number starting with 6-9)"
        : "Invalid mobile format (must be 10 digits)"
});
exports.loginSchema = zod_1.z.object({
    mobile: mobileSchema
});
exports.verifyOtpSchema = zod_1.z.object({
    mobile: mobileSchema,
    otp: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
        .transform(val => {
        if (typeof val === "number") {
            logger_1.default.warn("[Type Coercion] OTP received as number — coerced to string");
        }
        return String(val);
    })
        .refine(val => /^\d{6}$/.test(val), "OTP must be 6 digits"),
    name: zod_1.z.string().optional()
});
//# sourceMappingURL=auth.validator.js.map