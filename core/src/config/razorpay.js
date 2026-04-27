"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRazorpayClient = exports.getRazorpayRuntimeConfig = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const systemConfigHelper_1 = require("@core/utils/systemConfigHelper");
const env_1 = require("@core/config/env");
const DEFAULT_RAZORPAY_KEY_ID = env_1.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const DEFAULT_RAZORPAY_KEY_SECRET = env_1.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
const getRazorpayRuntimeConfig = async () => {
    const config = await (0, systemConfigHelper_1.getSystemConfigDoc)();
    const razorpayConfig = config?.integrations?.payment?.razorpay;
    const keyId = (typeof razorpayConfig?.keyId === 'string' && razorpayConfig.keyId.trim().length > 0
        ? razorpayConfig.keyId.trim()
        : DEFAULT_RAZORPAY_KEY_ID);
    const keySecret = (typeof razorpayConfig?.keySecret === 'string' && razorpayConfig.keySecret.trim().length > 0
        ? razorpayConfig.keySecret.trim()
        : DEFAULT_RAZORPAY_KEY_SECRET);
    return {
        enabled: typeof razorpayConfig?.enabled === 'boolean' ? razorpayConfig.enabled : true,
        keyId,
        keySecret,
    };
};
exports.getRazorpayRuntimeConfig = getRazorpayRuntimeConfig;
const getRazorpayClient = async () => {
    const { keyId, keySecret } = await (0, exports.getRazorpayRuntimeConfig)();
    return new razorpay_1.default({
        key_id: keyId,
        key_secret: keySecret,
    });
};
exports.getRazorpayClient = getRazorpayClient;
//# sourceMappingURL=razorpay.js.map