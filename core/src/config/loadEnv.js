"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const module_alias_1 = __importDefault(require("module-alias"));
const path_1 = __importDefault(require("path"));
// 🛡️ RUNTIME ALIAS RESOLUTION (SSOT)
// This ensures that @core and @shared aliases work in production (dist/) 
// without relying on fragile build-time tsc-alias replacements.
if (process.env.NODE_ENV === 'production' || process.env.NODE_PATH?.includes('dist')) {
    // Assuming this file is at [ROOT]/core/src/config/loadEnv.ts
    // In production dist, it's at [ROOT]/dist/core/src/config/loadEnv.js
    const distRoot = path_1.default.resolve(__dirname, '../../../');
    module_alias_1.default.addAliases({
        '@core': path_1.default.join(distRoot, 'core/src'),
        '@shared': path_1.default.join(distRoot, 'shared')
    });
}
/**
 * Environment Loader
 *
 * This module loads and validates environment variables using Zod.
 * Import this file FIRST in your application entry point.
 *
 * The actual validation logic is in ./env.ts
 * This file maintains backward compatibility with existing imports.
 */
require("./env"); // This will validate env vars on import and throw if invalid
const logger_1 = __importDefault(require("@core/utils/logger"));
if (process.env.NODE_ENV !== 'test' && process.env.STARTUP_VERBOSE === 'true') {
    logger_1.default.info('✅ Environment variables loaded and validated');
}
exports.default = {};
//# sourceMappingURL=loadEnv.js.map