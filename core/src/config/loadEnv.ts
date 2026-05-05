import moduleAlias from 'module-alias';
import path from 'path';

// 🛡️ RUNTIME ALIAS RESOLUTION (SSOT)
// This ensures that @esparex/core and @esparex/shared aliases work in production (dist/) 
// without relying on fragile build-time tsc-alias replacements.
if (process.env.NODE_ENV === 'production' || process.env.NODE_PATH?.includes('dist')) {
    // Source path: [repo]/core/src/config/loadEnv.ts
    // Build path:  [repo]/core/dist/config/loadEnv.js
    // Resolve aliases to built JS artifacts to avoid loading TypeScript in runtime.
    const repoRoot = path.resolve(__dirname, '../../../');
    (moduleAlias as any).addAliases({
        '@esparex/core': path.join(repoRoot, 'core/dist'),
        '@esparex/shared': path.join(repoRoot, 'shared/dist')
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

import './env'; // This will validate env vars on import and throw if invalid
import logger from '../utils/logger';

if (process.env.NODE_ENV !== 'test' && process.env.STARTUP_VERBOSE === 'true') {
    logger.info('✅ Environment variables loaded and validated');
}

export default {};
