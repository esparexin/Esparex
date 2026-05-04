"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAppUrl = exports.getFrontendInternalUrl = exports.getFrontendAppUrl = void 0;
const logger_1 = __importDefault(require("./logger"));
const env_1 = require("@core/config/env");
const PRODUCTION_FRONTEND_URL = 'https://esparex.in';
const PRODUCTION_ADMIN_URL = 'https://admin.esparex.in';
const LOCAL_FRONTEND_URL = 'http://localhost:3000';
const LOCAL_ADMIN_URL = 'http://localhost:3001';
const warnedFallbackKeys = new Set();
const isProduction = () => env_1.env.NODE_ENV === 'production';
const normalizeBaseUrl = (value) => value.trim().replace(/\/+$/, '');
const resolveAppUrl = (key, rawValue, fallback) => {
    const configuredValue = rawValue?.trim();
    if (configuredValue) {
        return normalizeBaseUrl(configuredValue);
    }
    if (!warnedFallbackKeys.has(key)) {
        warnedFallbackKeys.add(key);
        logger_1.default.warn('[AppUrl] Missing app URL env, using fallback', {
            envKey: key,
            fallback,
            nodeEnv: env_1.env.NODE_ENV,
        });
    }
    return fallback;
};
const getFrontendAppUrl = () => resolveAppUrl('FRONTEND_URL', env_1.env.FRONTEND_URL, isProduction() ? PRODUCTION_FRONTEND_URL : LOCAL_FRONTEND_URL);
exports.getFrontendAppUrl = getFrontendAppUrl;
const getFrontendInternalUrl = () => resolveAppUrl('FRONTEND_INTERNAL_URL', env_1.env.FRONTEND_INTERNAL_URL || env_1.env.FRONTEND_URL, isProduction() ? PRODUCTION_FRONTEND_URL : LOCAL_FRONTEND_URL);
exports.getFrontendInternalUrl = getFrontendInternalUrl;
const getAdminAppUrl = () => resolveAppUrl('ADMIN_URL', env_1.env.ADMIN_URL || env_1.env.ADMIN_FRONTEND_URL, isProduction() ? PRODUCTION_ADMIN_URL : LOCAL_ADMIN_URL);
exports.getAdminAppUrl = getAdminAppUrl;
//# sourceMappingURL=appUrl.js.map