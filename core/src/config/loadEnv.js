"use strict";
/**
 * Environment Loader
 *
 * This module loads and validates environment variables using Zod.
 * Import this file FIRST in your application entry point.
 *
 * The actual validation logic is in ./env.ts
 * This file maintains backward compatibility with existing imports.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./env"); // This will validate env vars on import and throw if invalid
const logger_1 = __importDefault(require("@core/utils/logger"));
if (process.env.NODE_ENV !== 'test' && process.env.STARTUP_VERBOSE === 'true') {
    logger_1.default.info('✅ Environment variables loaded and validated');
}
exports.default = {};
//# sourceMappingURL=loadEnv.js.map