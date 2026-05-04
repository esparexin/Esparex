"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnIfLegacyAdUserIdAliasUsed = void 0;
const logger_1 = __importDefault(require("./logger"));
const hasOwn = (value, key) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));
/**
 * Telemetry-only logger for deprecated ownership aliases.
 * This must never mutate request state or alter response behavior.
 */
const warnIfLegacyAdUserIdAliasUsed = (req, source) => {
    const container = source === 'body' ? req.body : (req.query);
    if (!hasOwn(container, 'userId'))
        return;
    const hasSellerId = hasOwn(container, 'sellerId');
    const rawAliasValue = container.userId;
    logger_1.default.warn('Deprecated ad ownership alias detected', {
        alias: 'userId',
        canonical: 'sellerId',
        source,
        method: req.method,
        route: req.originalUrl || req.url,
        requestId: req.requestId,
        hasSellerId,
        userIdAliasType: Array.isArray(rawAliasValue) ? 'array' : typeof rawAliasValue,
    });
};
exports.warnIfLegacyAdUserIdAliasUsed = warnIfLegacyAdUserIdAliasUsed;
//# sourceMappingURL=legacyOwnerAliasTelemetry.js.map