"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpHash = exports.hashOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@core/config/env");
const getOtpHashSecret = () => {
    const secret = env_1.env.OTP_HASH_SECRET || env_1.env.JWT_SECRET;
    if (env_1.env.NODE_ENV === 'production' && !env_1.env.OTP_HASH_SECRET) {
        throw new Error('OTP_HASH_SECRET must be configured in production');
    }
    return secret;
};
const hashOtp = (otp) => {
    return crypto_1.default
        .createHmac('sha256', getOtpHashSecret())
        .update(otp)
        .digest('hex');
};
exports.hashOtp = hashOtp;
const verifyOtpHash = (otp, expectedHash) => {
    const computedHash = (0, exports.hashOtp)(otp);
    const a = Buffer.from(computedHash, 'utf8');
    const b = Buffer.from(expectedHash, 'utf8');
    if (a.length !== b.length)
        return false;
    return crypto_1.default.timingSafeEqual(a, b);
};
exports.verifyOtpHash = verifyOtpHash;
//# sourceMappingURL=otpSecurity.js.map