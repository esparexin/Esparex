"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
const ioredis_1 = require("ioredis");
const bootstrapLogger_1 = __importDefault(require("@core/utils/bootstrapLogger"));
const env_1 = require("@core/config/env");
const REDIS_URL = env_1.env.REDIS_URL || 'redis://127.0.0.1:6379';
if (env_1.env.NODE_ENV === 'production') {
    if (!REDIS_URL.includes('@') && !env_1.env.REDIS_PASSWORD) {
        bootstrapLogger_1.default.warn('Queue Redis connection lacks a password in production environment.');
    }
    if (!REDIS_URL.startsWith('rediss://')) {
        bootstrapLogger_1.default.warn('Queue Redis connection is not using TLS (rediss://). Cloud-hosted Redis should be encrypted.');
    }
}
// We use maxRetriesPerRequest: null, which is required by BullMQ
exports.redisConnection = new ioredis_1.Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: undefined, // 🔒 FORCE DISABLE TLS
});
//# sourceMappingURL=redisConnection.js.map