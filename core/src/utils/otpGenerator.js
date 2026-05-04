"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureOtp = void 0;
const crypto_1 = require("crypto");
const env_1 = require("@core/config/env");
/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses Node.js crypto.randomInt which is CSPRNG.
 */
const generateSecureOtp = () => {
    if (env_1.env.USE_DEFAULT_OTP) {
        return env_1.env.DEV_STATIC_OTP;
    }
    return (0, crypto_1.randomInt)(100000, 1000000).toString();
};
exports.generateSecureOtp = generateSecureOtp;
//# sourceMappingURL=otpGenerator.js.map